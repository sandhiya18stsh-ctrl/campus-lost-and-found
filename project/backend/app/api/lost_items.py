from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.files import save_upload
from app.models.user import User
from app.models.lost_item import LostItem
from app.models.item_image import ItemImage
from app.schemas.item import LostItemCreate, LostItemUpdate, LostItemResponse, ItemWithImages, ItemImageCreate, ItemImageResponse
from app.services.matching_service import run_matching_for_lost_item

router = APIRouter()


@router.get("/", response_model=List[LostItemResponse])
def get_lost_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    is_featured: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all lost items with optional filters.
    """
    query = db.query(LostItem)
    
    if category_id:
        query = query.filter(LostItem.category_id == category_id)
    if location_id:
        query = query.filter(LostItem.location_id == location_id)
    if status:
        query = query.filter(LostItem.status == status)
    if user_id:
        query = query.filter(LostItem.user_id == user_id)
    if is_featured is not None:
        query = query.filter(LostItem.is_featured == is_featured)
    if search:
        query = query.filter(
            LostItem.title.ilike(f"%{search}%") |
            LostItem.description.ilike(f"%{search}%")
        )
    
    items = query.order_by(LostItem.created_at.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/featured", response_model=List[LostItemResponse])
def get_featured_lost_items(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get featured lost items.
    """
    items = db.query(LostItem).filter(
        LostItem.is_featured == True,
        LostItem.status == 'OPEN'
    ).order_by(LostItem.created_at.desc()).limit(limit).all()
    return items


@router.get("/{lost_item_id}", response_model=ItemWithImages)
def get_lost_item(
    lost_item_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific lost item by ID with images.
    """
    item = db.query(LostItem).filter(LostItem.lost_item_id == lost_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lost item not found"
        )
    
    images = db.query(ItemImage).filter(ItemImage.lost_item_id == lost_item_id).all()
    
    return ItemWithImages(
        **item.__dict__,
        images=images
    )


@router.post("/", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
def create_lost_item(
    item_data: LostItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Report a new lost item.
    """
    new_item = LostItem(
        user_id=current_user.user_id,
        **item_data.model_dump()
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Trigger AI matching (fire-and-forget style — errors don't break creation)
    try:
        run_matching_for_lost_item(db, new_item, notify=True)
        db.commit()
    except Exception:
        pass

    return new_item


@router.put("/{lost_item_id}", response_model=LostItemResponse)
def update_lost_item(
    lost_item_id: int,
    item_update: LostItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a lost item (owner or admin/staff only).
    """
    item = db.query(LostItem).filter(LostItem.lost_item_id == lost_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lost item not found"
        )
    
    # Check permissions
    if (current_user.role not in ['ADMIN', 'STAFF'] and 
        current_user.user_id != item.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update fields if provided
    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)

    # Re-run AI matching after update
    try:
        run_matching_for_lost_item(db, item, notify=True)
        db.commit()
    except Exception:
        pass

    return item


@router.delete("/{lost_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lost_item(
    lost_item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a lost item (owner or admin only).
    """
    item = db.query(LostItem).filter(LostItem.lost_item_id == lost_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lost item not found"
        )
    
    # Check permissions
    if current_user.role != 'ADMIN' and current_user.user_id != item.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Delete associated images
    db.query(ItemImage).filter(ItemImage.lost_item_id == lost_item_id).delete()
    
    db.delete(item)
    db.commit()
    
    return None


@router.post("/{lost_item_id}/images", response_model=ItemImageResponse, status_code=status.HTTP_201_CREATED)
def upload_lost_item_image(
    lost_item_id: int,
    file: UploadFile = File(...),
    is_primary: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add an image to a lost item.
    """
    item = db.query(LostItem).filter(LostItem.lost_item_id == lost_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lost item not found"
        )
    
    # Check permissions
    if current_user.role != 'ADMIN' and current_user.user_id != item.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # If setting as primary, remove primary status from other images
    if is_primary:
        db.query(ItemImage).filter(
            ItemImage.lost_item_id == lost_item_id,
            ItemImage.is_primary == True
        ).update({"is_primary": False})

    image_url = save_upload(file, "lost-items")
    
    new_image = ItemImage(
        lost_item_id=lost_item_id,
        image_url=image_url,
        is_primary=is_primary,
    )
    
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    
    return new_image
