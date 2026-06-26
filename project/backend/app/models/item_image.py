from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ItemImage(Base):
    __tablename__ = "item_images"
    
    image_id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("lost_items.lost_item_id"), nullable=True, index=True)
    found_item_id = Column(Integer, ForeignKey("found_items.found_item_id"), nullable=True, index=True)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    lost_item = relationship("LostItem", back_populates="images", foreign_keys=[lost_item_id])
    found_item = relationship("FoundItem", back_populates="images", foreign_keys=[found_item_id])
    
    def __repr__(self) -> str:
        return f"<ItemImage(image_id={self.image_id}, image_url={self.image_url})>"
