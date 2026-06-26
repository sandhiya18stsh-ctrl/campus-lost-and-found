from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserSummary(BaseModel):
    user_id: int
    email: str
    first_name: str
    last_name: str
    role: str
    full_name: str

    class Config:
        from_attributes = True


class ItemSummary(BaseModel):
    title: str
    description: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    status: str
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class ClaimBase(BaseModel):
    lost_item_id: int = Field(..., gt=0)
    found_item_id: int = Field(..., gt=0)
    verification_notes: Optional[str] = Field(None, max_length=2000)


class ClaimCreate(ClaimBase):
    pass


class ClaimUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(PENDING|UNDER_REVIEW|APPROVED|REJECTED|RETURNED)$")
    verification_notes: Optional[str] = Field(None, max_length=2000)


class ClaimResponse(ClaimBase):
    claim_id: int
    claimant_id: int
    status: str
    verified_by: Optional[int]
    verified_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    claimant: Optional[UserSummary] = None
    lost_item: Optional[ItemSummary] = None
    found_item: Optional[ItemSummary] = None
    
    class Config:
        from_attributes = True


class ClaimVerification(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    verification_notes: Optional[str] = Field(None, max_length=2000)
