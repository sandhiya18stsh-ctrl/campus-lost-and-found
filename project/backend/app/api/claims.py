from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_staff_or_admin_user
from app.models.user import User
from app.models.claim import Claim
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.models.notification import Notification
from app.schemas.claim import ClaimCreate, ClaimUpdate, ClaimResponse, ClaimVerification
from app.services.claim_service import (
    REVIEWABLE_CLAIM_STATUSES,
    found_item_accepts_new_claims,
    user_has_active_claim,
    apply_claim_approval,
    apply_claim_rejection,
    notify_finder_new_claim,
    notify_staff_new_claim,
    notify_claimant_decision,
)

router = APIRouter()


def _load_claim_query(db: Session):
    return db.query(Claim).options(
        joinedload(Claim.claimant),
        joinedload(Claim.lost_item),
        joinedload(Claim.found_item),
    )


@router.get("/", response_model=List[ClaimResponse])
def get_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    claimant_id: Optional[int] = Query(None),
    found_item_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff_or_admin_user),
):
    """List all claims (staff/admin). Supports filtering by status, claimant, or found item."""
    query = _load_claim_query(db)

    if status:
        query = query.filter(Claim.status == status)
    if claimant_id:
        query = query.filter(Claim.claimant_id == claimant_id)
    if found_item_id:
        query = query.filter(Claim.found_item_id == found_item_id)

    return query.order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/my-claims", response_model=List[ClaimResponse])
def get_my_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List claims submitted by the current user."""
    query = _load_claim_query(db).filter(Claim.claimant_id == current_user.user_id)

    if status:
        query = query.filter(Claim.status == status)

    return query.order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/by-found-item/{found_item_id}", response_model=List[ClaimResponse])
def get_claims_for_found_item(
    found_item_id: int,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff_or_admin_user),
):
    """List all claimants for a found item so staff can compare and decide ownership."""
    found_item = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not found_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found item not found")

    query = _load_claim_query(db).filter(Claim.found_item_id == found_item_id)
    if status:
        query = query.filter(Claim.status == status)

    return query.order_by(Claim.created_at.asc()).all()


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single claim by ID."""
    claim = _load_claim_query(db).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    if current_user.role not in ["ADMIN", "STAFF"] and current_user.user_id != claim.claimant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    return claim


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    claim_data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a claim linking the user's lost item to a found item.
    Multiple users may claim the same found item; each gets a separate record.
    """
    lost_item = db.query(LostItem).filter(
        LostItem.lost_item_id == claim_data.lost_item_id,
        LostItem.user_id == current_user.user_id,
    ).first()
    if not lost_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lost item not found or you don't have permission",
        )
    if lost_item.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lost item must be open to submit a claim",
        )

    found_item, error = found_item_accepts_new_claims(db, claim_data.found_item_id)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    if user_has_active_claim(db, current_user.user_id, claim_data.found_item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active claim for this found item",
        )

    new_claim = Claim(
        claimant_id=current_user.user_id,
        status="PENDING",
        **claim_data.model_dump(),
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    notify_finder_new_claim(db, new_claim, found_item)
    notify_staff_new_claim(db, new_claim, found_item)
    db.commit()
    db.refresh(new_claim)

    return _load_claim_query(db).filter(Claim.claim_id == new_claim.claim_id).first()


@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: int,
    claim_update: ClaimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update claim notes (claimant) or status (staff/admin)."""
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    if current_user.user_id == claim.claimant_id:
        if claim_update.status:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update claim status. Admin/Staff verification required.",
            )
        if claim_update.verification_notes is not None:
            if claim.status not in REVIEWABLE_CLAIM_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot update notes after claim has been processed",
                )
            claim.verification_notes = claim_update.verification_notes

    elif current_user.role in ["ADMIN", "STAFF"]:
        if claim_update.status:
            _apply_status_change(db, claim, claim_update.status, current_user, claim_update.verification_notes)
        elif claim_update.verification_notes is not None:
            claim.verification_notes = claim_update.verification_notes
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db.commit()
    return _load_claim_query(db).filter(Claim.claim_id == claim_id).first()


@router.post("/{claim_id}/review", response_model=ClaimResponse)
def start_claim_review(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff_or_admin_user),
):
    """Move a pending claim to under review."""
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    if claim.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending claims can be moved to under review",
        )

    claim.status = "UNDER_REVIEW"
    db.commit()
    return _load_claim_query(db).filter(Claim.claim_id == claim_id).first()


@router.post("/{claim_id}/verify", response_model=ClaimResponse)
def verify_claim(
    claim_id: int,
    verification: ClaimVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff_or_admin_user),
):
    """Approve or reject a claim. Approving one claim rejects competing claims for the same item."""
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    if claim.status not in REVIEWABLE_CLAIM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim has already been processed",
        )

    if verification.verification_notes is not None:
        claim.verification_notes = verification.verification_notes

    _apply_status_change(db, claim, verification.status, current_user, verification.verification_notes)

    db.commit()
    return _load_claim_query(db).filter(Claim.claim_id == claim_id).first()


@router.post("/{claim_id}/complete", response_model=ClaimResponse)
def complete_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff_or_admin_user),
):
    """Mark an approved claim as returned (physical handoff complete)."""
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    if claim.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim must be approved before marking as returned",
        )

    claim.status = "RETURNED"
    claim.completed_at = func.now()

    lost_item = db.query(LostItem).filter(LostItem.lost_item_id == claim.lost_item_id).first()
    if lost_item:
        lost_item.status = "CLOSED"

    found_item = db.query(FoundItem).filter(FoundItem.found_item_id == claim.found_item_id).first()
    if found_item:
        found_item.status = "RETURNED"

    db.add(
        Notification(
            user_id=claim.claimant_id,
            type="CLAIM",
            title="Item Returned",
            message="Your item has been returned. The claim is now complete.",
            related_id=claim.claim_id,
            is_read=False,
        )
    )

    db.commit()
    return _load_claim_query(db).filter(Claim.claim_id == claim_id).first()


def _apply_status_change(
    db: Session,
    claim: Claim,
    new_status: str,
    verifier: User,
    notes: Optional[str] = None,
) -> None:
    if new_status == "UNDER_REVIEW":
        if claim.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending claims can be moved to under review",
            )
        claim.status = "UNDER_REVIEW"
        return

    if new_status not in ("APPROVED", "REJECTED"):
        claim.status = new_status
        return

    if claim.status not in REVIEWABLE_CLAIM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim has already been processed",
        )

    if notes is not None:
        claim.verification_notes = notes

    if new_status == "APPROVED":
        existing_approved = (
            db.query(Claim)
            .filter(
                Claim.found_item_id == claim.found_item_id,
                Claim.status == "APPROVED",
                Claim.claim_id != claim.claim_id,
            )
            .first()
        )
        if existing_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another claim has already been approved for this found item",
            )
        apply_claim_approval(db, claim, verifier)
    else:
        apply_claim_rejection(db, claim, verifier)

    notify_claimant_decision(db, claim, verifier, new_status)
