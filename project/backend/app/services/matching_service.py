"""
AI-powered matching service for Lost & Found items.

Computes a confidence score (0-100) by comparing:
  - Title similarity (TF-IDF token overlap)
  - Description similarity
  - Category match
  - Location proximity (same location = bonus)
  - Date proximity
  - Color match
"""

from __future__ import annotations

import math
import re
from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.found_item import FoundItem
from app.models.lost_item import LostItem
from app.models.notification import Notification


# ---------------------------------------------------------------------------
# Weights (must sum to 100)
# ---------------------------------------------------------------------------
WEIGHT_TITLE = 30
WEIGHT_DESCRIPTION = 20
WEIGHT_CATEGORY = 20
WEIGHT_LOCATION = 15
WEIGHT_DATE = 10
WEIGHT_COLOR = 5

# Minimum score to store/return a match
MIN_SCORE = 40

# High-confidence threshold for notifications
HIGH_CONFIDENCE_THRESHOLD = 80


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def _tokenize(text: str) -> set[str]:
    """Lower-case, strip punctuation, split into tokens."""
    if not text:
        return set()
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    # Remove very short/common stopwords
    stopwords = {"a", "an", "the", "in", "on", "at", "of", "and", "or", "is", "it", "i", "my", "was"}
    return {t for t in tokens if t not in stopwords and len(t) > 1}


def _jaccard(a: str | None, b: str | None) -> float:
    """Jaccard similarity between token sets (0-1)."""
    ta = _tokenize(a or "")
    tb = _tokenize(b or "")
    if not ta and not tb:
        return 0.0
    intersection = ta & tb
    union = ta | tb
    return len(intersection) / len(union)


def _color_score(color_a: str | None, color_b: str | None) -> float:
    """
    1.0 if colors share any token, 0.5 if one is missing, 0.0 if both present
    and share nothing.
    """
    if not color_a or not color_b:
        return 0.5  # neutral — can't rule out
    ta = _tokenize(color_a)
    tb = _tokenize(color_b)
    return 1.0 if ta & tb else 0.0


def _date_score(d1: date | None, d2: date | None) -> float:
    """
    Returns 1.0 for same day, decays over 30 days, 0.0 beyond 60 days.
    Handles the case where found-date should be >= lost-date.
    """
    if d1 is None or d2 is None:
        return 0.5
    diff = abs((d1 - d2).days)
    if diff <= 3:
        return 1.0
    if diff <= 14:
        return 0.75
    if diff <= 30:
        return 0.4
    if diff <= 60:
        return 0.2
    return 0.0


# ---------------------------------------------------------------------------
# Core scoring
# ---------------------------------------------------------------------------

def compute_match_score(lost: LostItem, found: FoundItem) -> int:
    """
    Compare a LostItem against a FoundItem and return a confidence score 0-100.
    """
    title_sim = _jaccard(lost.title, found.title)
    desc_sim = _jaccard(lost.description, found.description)
    category_match = 1.0 if lost.category_id == found.category_id else 0.0
    location_match = (
        1.0 if (lost.location_id and found.location_id and lost.location_id == found.location_id)
        else (0.3 if (lost.location_id or found.location_id) else 0.5)
    )
    date_sim = _date_score(lost.date_lost, found.date_found)
    color_sim = _color_score(lost.color, found.color)

    score = (
        title_sim * WEIGHT_TITLE
        + desc_sim * WEIGHT_DESCRIPTION
        + category_match * WEIGHT_CATEGORY
        + location_match * WEIGHT_LOCATION
        + date_sim * WEIGHT_DATE
        + color_sim * WEIGHT_COLOR
    )

    return round(min(100, max(0, score)))


def score_label(score: int) -> str:
    if score >= HIGH_CONFIDENCE_THRESHOLD:
        return "HIGH"
    if score >= 60:
        return "MEDIUM"
    if score >= MIN_SCORE:
        return "LOW"
    return "NONE"


# ---------------------------------------------------------------------------
# Match result dataclass (plain dict for easy JSON serialisation)
# ---------------------------------------------------------------------------

def _lost_item_dict(item: LostItem) -> dict:
    return {
        "lost_item_id": item.lost_item_id,
        "title": item.title,
        "description": item.description,
        "category_id": item.category_id,
        "location_id": item.location_id,
        "color": item.color,
        "brand": item.brand,
        "date_lost": item.date_lost.isoformat() if item.date_lost else None,
        "status": item.status,
        "image_url": item.image_url,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def _found_item_dict(item: FoundItem) -> dict:
    return {
        "found_item_id": item.found_item_id,
        "title": item.title,
        "description": item.description,
        "category_id": item.category_id,
        "location_id": item.location_id,
        "color": item.color,
        "brand": item.brand,
        "date_found": item.date_found.isoformat() if item.date_found else None,
        "status": item.status,
        "storage_location": item.storage_location,
        "image_url": item.image_url,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_matches_for_lost_item(
    db: Session,
    lost_item_id: int,
    min_score: int = MIN_SCORE,
    limit: int = 10,
) -> list[dict]:
    """Return ranked found-item matches for a given lost item."""
    lost = db.query(LostItem).filter(LostItem.lost_item_id == lost_item_id).first()
    if not lost:
        return []

    found_items = db.query(FoundItem).filter(FoundItem.status == "AVAILABLE").all()

    results = []
    for found in found_items:
        score = compute_match_score(lost, found)
        if score >= min_score:
            results.append(
                {
                    "score": score,
                    "confidence": score_label(score),
                    "found_item": _found_item_dict(found),
                }
            )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def get_matches_for_found_item(
    db: Session,
    found_item_id: int,
    min_score: int = MIN_SCORE,
    limit: int = 10,
) -> list[dict]:
    """Return ranked lost-item matches for a given found item."""
    found = db.query(FoundItem).filter(FoundItem.found_item_id == found_item_id).first()
    if not found:
        return []

    lost_items = db.query(LostItem).filter(LostItem.status == "OPEN").all()

    results = []
    for lost in lost_items:
        score = compute_match_score(lost, found)
        if score >= min_score:
            results.append(
                {
                    "score": score,
                    "confidence": score_label(score),
                    "lost_item": _lost_item_dict(lost),
                }
            )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def run_matching_for_lost_item(
    db: Session,
    lost_item: LostItem,
    notify: bool = True,
) -> int:
    """
    Run matching after a lost item is created/updated.
    Sends HIGH-confidence notifications.
    Returns total match count above threshold.
    """
    found_items = db.query(FoundItem).filter(FoundItem.status == "AVAILABLE").all()
    match_count = 0

    for found in found_items:
        score = compute_match_score(lost_item, found)
        if score < MIN_SCORE:
            continue
        match_count += 1

        if notify and score >= HIGH_CONFIDENCE_THRESHOLD:
            _send_match_notification(db, lost_item, found, score)

    return match_count


def _send_match_notification(
    db: Session,
    lost: LostItem,
    found: FoundItem,
    score: int,
) -> None:
    """Notify the owner of the lost item about a high-confidence match."""
    # Avoid duplicate notifications: check if one already exists
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == lost.user_id,
            Notification.type == "MATCH",
            Notification.related_id == lost.lost_item_id,
            Notification.message.like(f"%{found.found_item_id}%"),
        )
        .first()
    )
    if existing:
        return

    db.add(
        Notification(
            user_id=lost.user_id,
            type="MATCH",
            title="High-Confidence Match Found! 🎯",
            message=(
                f'Your lost item "{lost.title}" may match a found item: '
                f'"{found.title}" (confidence: {score}%). '
                f"Please review the match on your lost item page."
            ),
            related_id=lost.lost_item_id,
            is_read=False,
        )
    )


def get_ai_match_count(db: Session) -> int:
    """
    Dashboard metric: number of distinct lost items that have at least one
    match with score >= MIN_SCORE against an available found item.
    """
    lost_items = db.query(LostItem).filter(LostItem.status == "OPEN").all()
    found_items = db.query(FoundItem).filter(FoundItem.status == "AVAILABLE").all()

    count = 0
    for lost in lost_items:
        for found in found_items:
            if compute_match_score(lost, found) >= MIN_SCORE:
                count += 1
                break  # one match is enough to count this lost item

    return count
