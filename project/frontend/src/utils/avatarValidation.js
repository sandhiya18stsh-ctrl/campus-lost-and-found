export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export const validateAvatarFile = (file) => {
  if (!file) {
    return 'Please select an image file.';
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, GIF, and WebP images are allowed.';
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return 'Image is too large. Maximum size is 5 MB.';
  }
  return null;
};
