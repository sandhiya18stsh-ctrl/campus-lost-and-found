"""Business logic for the multi-claimant claim workflow."""

from typing import Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.claim import Claim
from app.models.found_item import FoundItem
from app.models.lost_item import LostItem
from app.models.notification import Notification
from app.models.user import User

ACTIVE_CLAIM_STATUSES = ("PENDING", "UNDER_REVIEW", "APPROVED")
REVIEWABLE_CLAIM_STATUSES = ("PENDING", "UNDER_REVIEW")
ALL_CLAIM_STATUSES = ("PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "RETURNED")


def found_item_accepts_new_claims(db: Session, found_item_id: int) -> Tuple[Optional[FoundItem], Optional[str]]:
    """Return the found item if it can receive new claims, else an error message."""
    found_item = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not found_item:
        return None, "Found item not found"

    if found_item.status in ("RETURNED", "DISPOSED"):
        return None, "This found item is no longer available for claims"

    approved_claim = (
        db.query(Claim)
        .filter(
            Claim.found_item_id == found_item_id,
            Claim.status == "APPROVED",
        )
        .first()
    )
    if approved_claim:
        return None, "An owner has already been approved for this found item"

    if found_item.status not in ("AVAILABLE",):
        return None, "Found item is not available for claim"

    return found_item, None


def user_has_active_claim(db: Session, claimant_id: int, found_item_id: int) -> bool:
    """True if this user already has a non-terminal claim on the found item."""
    return (
        db.query(Claim.claim_id)
        .filter(
            Claim.claimant_id == claimant_id,
            Claim.found_item_id == found_item_id,
            Claim.status.in_(ACTIVE_CLAIM_STATUSES),
        )
        .first()
        is not None
    )


def reject_competing_claims(
    db: Session,
    approved_claim: Claim,
    verifier: User,
    rejection_note: Optional[str] = None,
) -> None:
    """Reject all other active claims for the same found item after one is approved."""
    competing = (
        db.query(Claim)
        .filter(
            Claim.found_item_id == approved_claim.found_item_id,
            Claim.claim_id != approved_claim.claim_id,
            Claim.status.in_(REVIEWABLE_CLAIM_STATUSES),
        )
        .all()
    )

    note = rejection_note or "Another claimant was approved as the verified owner."
    for claim in competing:
        claim.status = "REJECTED"
        claim.verified_by = verifier.user_id
        claim.verified_at = func.now()
        if not claim.verification_notes:
            claim.verification_notes = note

        db.add(
            Notification(
                user_id=claim.claimant_id,
                type="CLAIM",
                title="Claim Rejected",
                message=f"Your claim was not approved. {note}",
                related_id=claim.claim_id,
                is_read=False,
            )
        )


def apply_claim_approval(db: Session, claim: Claim, verifier: User) -> None:
    """Mark claim approved and update related item statuses."""
    claim.status = "APPROVED"
    claim.verified_by = verifier.user_id
    claim.verified_at = func.now()

    lost_item = db.query(LostItem).filter(LostItem.lost_item_id == claim.lost_item_id).first()
    if lost_item:
        lost_item.status = "CLAIMED"

    found_item = db.query(FoundItem).filter(FoundItem.found_item_id == claim.found_item_id).first()
    if found_item:
        found_item.status = "CLAIMED"

    reject_competing_claims(db, claim, verifier)


def apply_claim_rejection(db: Session, claim: Claim, verifier: User) -> None:
    """Mark a single claim as rejected."""
    claim.status = "REJECTED"
    claim.verified_by = verifier.user_id
    claim.verified_at = func.now()


def notify_finder_new_claim(db: Session, claim: Claim, found_item: FoundItem) -> None:
    db.add(
        Notification(
            user_id=found_item.user_id,
            type="CLAIM",
            title="New Claim Submitted",
            message=f"Someone has claimed an item you found: {found_item.title}",
            related_id=claim.claim_id,
            is_read=False,
        )
    )


def notify_staff_new_claim(db: Session, claim: Claim, found_item: FoundItem) -> None:
    """Alert staff/admin that a new claim needs review."""
    staff_users = (
        db.query(User)
        .filter(User.role.in_(["STAFF", "ADMIN"]), User.is_active.is_(True))
        .all()
    )
    for staff in staff_users:
        db.add(
            Notification(
                user_id=staff.user_id,
                type="CLAIM",
                title="New Claim Needs Review",
                message=(
                    f"A new claim was submitted for found item \"{found_item.title}\" "
                    f"(Claim #{claim.claim_id})."
                ),
                related_id=claim.claim_id,
                is_read=False,
            )
        )


def notify_claimant_decision(db: Session, claim: Claim, verifier: User, status: str) -> None:
    db.add(
        Notification(
            user_id=claim.claimant_id,
            type="CLAIM",
            title=f"Claim {status.title()}",
            message=f"Your claim has been {status.lower()} by {verifier.full_name}.",
            related_id=claim.claim_id,
            is_read=False,
        )
    )
