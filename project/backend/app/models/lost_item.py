from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LostItem(Base):
    __tablename__ = "lost_items"
    
    lost_item_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=True)
    brand = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    date_lost = Column(Date, nullable=False, index=True)
    status = Column(String(20), default='OPEN', nullable=False, index=True)  # OPEN, MATCHED, CLAIMED, CLOSED
    is_featured = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="lost_items")
    category = relationship("Category")
    location = relationship("Location")
    images = relationship("ItemImage", back_populates="lost_item", foreign_keys="ItemImage.lost_item_id")
    claims_as_lost = relationship("Claim", back_populates="lost_item", foreign_keys="Claim.lost_item_id")

    @property
    def image_url(self) -> str | None:
        primary = next((image for image in self.images if image.is_primary), None)
        image = primary or (self.images[0] if self.images else None)
        return image.image_url if image else None
    
    def __repr__(self) -> str:
        return f"<LostItem(lost_item_id={self.lost_item_id}, title={self.title}, status={self.status})>"
