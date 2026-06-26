from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    building: Optional[str] = Field(None, max_length=50)
    floor: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = Field(None, max_length=200)


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    building: Optional[str] = Field(None, max_length=50)
    floor: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    location_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
