from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_staff_or_admin_user
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse

router = APIRouter()


@router.get("/", response_model=List[LocationResponse])
def get_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db)
):
    """
    Get all locations.
    """
    query = db.query(Location)
    
    if is_active is not None:
        query = query.filter(Location.is_active == is_active)
    
    locations = query.order_by(Location.name).offset(skip).limit(limit).all()
    return locations


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific location by ID.
    """
    location = db.query(Location).filter(Location.location_id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return location


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_or_admin_user)
):
    """
    Create a new location (Admin/Staff only).
    """
    # Check if location name already exists
    existing = db.query(Location).filter(Location.name == location_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location with this name already exists"
        )
    
    new_location = Location(**location_data.model_dump())
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    
    return new_location


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    location_update: LocationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_or_admin_user)
):
    """
    Update a location (Admin/Staff only).
    """
    location = db.query(Location).filter(Location.location_id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Check if name is being changed and if it already exists
    if location_update.name and location_update.name != location.name:
        existing = db.query(Location).filter(Location.name == location_update.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location with this name already exists"
            )
    
    # Update fields if provided
    update_data = location_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_staff_or_admin_user)
):
    """
    Delete a location (Admin/Staff only).
    """
    location = db.query(Location).filter(Location.location_id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    db.delete(location)
    db.commit()
    
    return None
