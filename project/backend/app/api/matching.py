"""
API endpoints for AI-powered Lost & Found matching.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.matching_service import (
    get_matches_for_lost_item,
    get_matches_for_found_item,
    get_ai_match_count,
    MIN_SCORE,
)

router = APIRouter()


@router.get("/lost-items/{lost_item_id}/matches")
def matches_for_lost_item(
    lost_item_id: int,
    min_score: int = Query(MIN_SCORE, ge=0, le=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return AI-generated match suggestions for a lost item.
    Each result contains score, confidence label, and the matched found item.
    """
    matches = get_matches_for_lost_item(db, lost_item_id, min_score=min_score, limit=limit)
    return {"lost_item_id": lost_item_id, "matches": matches, "total": len(matches)}


@router.get("/found-items/{found_item_id}/matches")
def matches_for_found_item(
    found_item_id: int,
    min_score: int = Query(MIN_SCORE, ge=0, le=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return AI-generated match suggestions for a found item.
    Each result contains score, confidence label, and the matched lost item.
    """
    matches = get_matches_for_found_item(db, found_item_id, min_score=min_score, limit=limit)
    return {"found_item_id": found_item_id, "matches": matches, "total": len(matches)}


@router.get("/stats")
def matching_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dashboard metric: number of open lost items that have at least one
    AI-detected match against an available found item.
    """
    count = get_ai_match_count(db)
    return {"ai_matches_found": count}
