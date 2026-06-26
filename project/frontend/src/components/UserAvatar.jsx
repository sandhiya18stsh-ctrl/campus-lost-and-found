import { API_ORIGIN } from '../services/api';
import './UserAvatar.css';

const getInitials = (user) => {
  if (!user) return '?';
  const first = user.first_name?.[0] || '';
  const last = user.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
};

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const initials = getInitials(user);
  const classes = ['user-avatar', `user-avatar-${size}`, className].filter(Boolean).join(' ');

  if (user?.avatar_url) {
    return (
      <img
        src={`${API_ORIGIN}${user.avatar_url}`}
        alt={`${user.full_name || 'User'} profile`}
        className={classes}
      />
    );
  }

  return (
    <span className={`${classes} user-avatar-fallback`} aria-hidden="true">
      {initials}
    </span>
  );
};

export default UserAvatar;
