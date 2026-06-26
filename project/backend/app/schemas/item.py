from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class ItemBase(BaseModel):
    category_id: int = Field(..., gt=0)
    location_id: Optional[int] = Field(None, gt=0)
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    brand: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)


class LostItemCreate(ItemBase):
    date_lost: date
    is_featured: bool = False


class LostItemUpdate(BaseModel):
    category_id: Optional[int] = Field(None, gt=0)
    location_id: Optional[int] = Field(None, gt=0)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    brand: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    date_lost: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(OPEN|MATCHED|CLAIMED|CLOSED)$")
    is_featured: Optional[bool] = None


class LostItemResponse(ItemBase):
    lost_item_id: int
    user_id: int
    date_lost: date
    status: str
    is_featured: bool
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FoundItemCreate(ItemBase):
    date_found: date
    storage_location: Optional[str] = Field(None, max_length=100)
    is_featured: bool = False


class FoundItemUpdate(BaseModel):
    category_id: Optional[int] = Field(None, gt=0)
    location_id: Optional[int] = Field(None, gt=0)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    brand: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    date_found: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(AVAILABLE|CLAIMED|RETURNED|DISPOSED)$")
    storage_location: Optional[str] = Field(None, max_length=100)
    is_featured: Optional[bool] = None


class FoundItemResponse(ItemBase):
    found_item_id: int
    user_id: int
    date_found: date
    status: str
    storage_location: Optional[str]
    is_featured: bool
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ItemImageCreate(BaseModel):
    image_url: str = Field(..., max_length=500)
    is_primary: bool = False


class ItemImageResponse(BaseModel):
    image_id: int
    lost_item_id: Optional[int]
    found_item_id: Optional[int]
    image_url: str
    is_primary: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ItemWithImages(LostItemResponse):
    images: List[ItemImageResponse] = []


class FoundItemWithImages(FoundItemResponse):
    images: List[ItemImageResponse] = []
