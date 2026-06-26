from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.files import save_upload
from app.models.user import User
from app.models.found_item import FoundItem
from app.models.item_image import ItemImage
from app.schemas.item import FoundItemCreate, FoundItemUpdate, FoundItemResponse, FoundItemWithImages, ItemImageCreate, ItemImageResponse

router = APIRouter()


@router.get("/", response_model=List[FoundItemResponse])
def get_found_items(
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
    Get all found items with optional filters.
    """
    query = db.query(FoundItem)
    
    if category_id:
        query = query.filter(FoundItem.category_id == category_id)
    if location_id:
        query = query.filter(FoundItem.location_id == location_id)
    if status:
        query = query.filter(FoundItem.status == status)
    if user_id:
        query = query.filter(FoundItem.user_id == user_id)
    if is_featured is not None:
        query = query.filter(FoundItem.is_featured == is_featured)
    if search:
        query = query.filter(
            FoundItem.title.ilike(f"%{search}%") |
            FoundItem.description.ilike(f"%{search}%")
        )
    
    items = query.order_by(FoundItem.created_at.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/featured", response_model=List[FoundItemResponse])
def get_featured_found_items(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get featured found items.
    """
    items = db.query(FoundItem).filter(
        FoundItem.is_featured == True,
        FoundItem.status == 'AVAILABLE'
    ).order_by(FoundItem.created_at.desc()).limit(limit).all()
    return items


@router.get("/{found_item_id}", response_model=FoundItemWithImages)
def get_found_item(
    found_item_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific found item by ID with images.
    """
    item = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Found item not found"
        )
    
    images = db.query(ItemImage).filter(ItemImage.found_item_id == found_item_id).all()
    
    return FoundItemWithImages(
        **item.__dict__,
        images=images
    )


@router.post("/", response_model=FoundItemResponse, status_code=status.HTTP_201_CREATED)
def create_found_item(
    item_data: FoundItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Report a new found item.
    """
    new_item = FoundItem(
        user_id=current_user.user_id,
        **item_data.model_dump()
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return new_item


@router.put("/{found_item_id}", response_model=FoundItemResponse)
def update_found_item(
    found_item_id: int,
    item_update: FoundItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a found item (owner or admin/staff only).
    """
    item = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Found item not found"
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
    
    return item


@router.delete("/{found_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_found_item(
    found_item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a found item (owner or admin only).
    """
    item = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Found item not found"
        )
    
    # Check permissions
    if current_user.role != 'ADMIN' and current_user.user_id != item.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Delete associated images
    db.query(ItemImage).filter(ItemImage.found_item_id == found_item_id).delete()
    
    db.delete(item)
    db.commit()
    
    return None


@router.post("/{found_item_id}/images", response_model=ItemImageResponse, status_code=status.HTTP_201_CREATED)
def upload_found_item_image(
    found_item_id: int,
    file: UploadFile = File(...),
    is_primary: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add an image to a found item.
    """
    item = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Found item not found"
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
            ItemImage.found_item_id == found_item_id,
            ItemImage.is_primary == True
        ).update({"is_primary": False})

    image_url = save_upload(file, "found-items")
    
    new_image = ItemImage(
        found_item_id=found_item_id,
        image_url=image_url,
        is_primary=is_primary,
    )
    
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    
    return new_image
