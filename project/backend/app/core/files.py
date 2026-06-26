from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


def save_upload(file: UploadFile, folder: str) -> str:
    if file.content_type not in settings.allowed_image_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, GIF, and WebP images are allowed.",
        )

    upload_root = Path(settings.UPLOAD_DIR)
    target_dir = upload_root / folder
    target_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        suffix = ".jpg"

    contents = file.file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large. Maximum size is 5 MB.",
        )

    filename = f"{uuid4().hex}{suffix}"
    destination = target_dir / filename
    destination.write_bytes(contents)
    return f"/uploads/{folder}/{filename}"


def delete_upload(relative_url: str | None) -> None:
    """Remove a previously uploaded file from disk."""
    if not relative_url or not relative_url.startswith("/uploads/"):
        return

    file_path = Path(settings.UPLOAD_DIR) / relative_url.removeprefix("/uploads/").lstrip("/")
    if file_path.is_file():
        file_path.unlink()
