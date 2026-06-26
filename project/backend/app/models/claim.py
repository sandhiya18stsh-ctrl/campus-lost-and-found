from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Claim(Base):
    __tablename__ = "claims"
    
    claim_id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("lost_items.lost_item_id"), nullable=False, index=True)
    found_item_id = Column(Integer, ForeignKey("found_items.found_item_id"), nullable=False, index=True)
    claimant_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    status = Column(String(20), default='PENDING', nullable=False, index=True)  # PENDING, UNDER_REVIEW, APPROVED, REJECTED, RETURNED
    verification_notes = Column(String(2000), nullable=True)
    verified_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    lost_item = relationship("LostItem", back_populates="claims_as_lost", foreign_keys=[lost_item_id])
    found_item = relationship("FoundItem", back_populates="claims_as_found", foreign_keys=[found_item_id])
    claimant = relationship("User", foreign_keys=[claimant_id])
    verifier = relationship("User", foreign_keys=[verified_by])
    
    def __repr__(self) -> str:
        return f"<Claim(claim_id={self.claim_id}, status={self.status})>"
