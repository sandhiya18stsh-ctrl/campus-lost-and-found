import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import UserAvatar from './UserAvatar';
import './Navigation.css';

const BellIcon = () => (
  <svg
    className="nav-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const Navigation = () => {
  const { user, isAuthenticated, logout, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getUnreadCount()
      .then((data) => setUnreadCount(data.unread_count || 0))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-mark">CL</span>
          <span>Campus Lost & Found</span>
        </Link>

        {isAuthenticated ? (
          <div className="nav-menu">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/lost-items" className="nav-link">Lost Items</Link>
            <Link to="/found-items" className="nav-link">Found Items</Link>
            <Link to="/claims" className="nav-link">Claims</Link>

            {isAdmin && (
              <Link to="/admin" className="nav-link">Admin</Link>
            )}

            <Link
              to="/notifications"
              className="nav-link nav-bell"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <BellIcon />
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </Link>
            <Link to="/profile" className="nav-link nav-profile">
              <UserAvatar user={user} size="sm" />
              <span>Profile</span>
            </Link>

            <button type="button" onClick={handleLogout} className="nav-link nav-logout">
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-menu">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link nav-cta">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
