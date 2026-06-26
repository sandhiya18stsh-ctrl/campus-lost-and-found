from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class FoundItem(Base):
    __tablename__ = "found_items"
    
    found_item_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=True)
    brand = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    date_found = Column(Date, nullable=False, index=True)
    status = Column(String(20), default='AVAILABLE', nullable=False, index=True)  # AVAILABLE, CLAIMED, RETURNED, DISPOSED
    storage_location = Column(String(100), nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="found_items")
    category = relationship("Category")
    location = relationship("Location")
    images = relationship("ItemImage", back_populates="found_item", foreign_keys="ItemImage.found_item_id")
    claims_as_found = relationship("Claim", back_populates="found_item", foreign_keys="Claim.found_item_id")

    @property
    def image_url(self) -> str | None:
        primary = next((image for image in self.images if image.is_primary), None)
        image = primary or (self.images[0] if self.images else None)
        return image.image_url if image else None
    
    def __repr__(self) -> str:
        return f"<FoundItem(found_item_id={self.found_item_id}, title={self.title}, status={self.status})>"
