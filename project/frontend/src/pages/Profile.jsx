import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { validateAvatarFile } from '../utils/avatarValidation';
import './Profile.css';

const trimValue = (value) => value.trim();

const Profile = () => {
  const { user, logout, updateUser, uploadAvatar, removeAvatar } = useAuth();
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        department: user.department || '',
      });
    }
  }, [user]);

  const validateProfileForm = () => {
    const firstName = trimValue(formData.first_name);
    const lastName = trimValue(formData.last_name);
    const phone = trimValue(formData.phone);
    const department = trimValue(formData.department);

    if (!firstName) {
      return 'First name is required.';
    }
    if (firstName.length > 50) {
      return 'First name must be 50 characters or fewer.';
    }
    if (!lastName) {
      return 'Last name is required.';
    }
    if (lastName.length > 50) {
      return 'Last name must be 50 characters or fewer.';
    }
    if (phone.length > 20) {
      return 'Phone number must be 20 characters or fewer.';
    }
    if (department.length > 100) {
      return 'Department must be 100 characters or fewer.';
    }

    return null;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    const validationError = validateProfileForm();
    if (validationError) {
      setProfileMessage({ type: 'error', text: validationError });
      setProfileLoading(false);
      return;
    }

    const payload = {
      first_name: trimValue(formData.first_name),
      last_name: trimValue(formData.last_name),
      phone: trimValue(formData.phone) || null,
      department: trimValue(formData.department) || null,
    };

    const result = await updateUser(payload);
    if (result.success) {
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
    } else {
      setProfileMessage({ type: 'error', text: result.error || 'Unable to update profile. Please try again.' });
    }

    setProfileLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    const password = passwordData.password;
    const confirmPassword = passwordData.confirmPassword;

    if (!password) {
      setPasswordMessage({ type: 'error', text: 'Please enter a new password.' });
      setPasswordLoading(false);
      return;
    }

    if (password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      setPasswordLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      setPasswordLoading(false);
      return;
    }

    const result = await updateUser({ password });
    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordData({ password: '', confirmPassword: '' });
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Unable to update password. Please try again.' });
    }

    setPasswordLoading(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setProfileMessage(null);
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        department: user.department || '',
      });
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarMessage(null);
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarMessage({ type: 'error', text: validationError });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const isReplace = !!user?.avatar_url;
    setAvatarPreview(previewUrl);
    setAvatarLoading(true);

    const result = await uploadAvatar(file);
    URL.revokeObjectURL(previewUrl);
    setAvatarPreview(null);
    setAvatarLoading(false);

    if (result.success) {
      setAvatarMessage({
        type: 'success',
        text: isReplace ? 'Profile picture updated.' : 'Profile picture uploaded.',
      });
    } else {
      setAvatarMessage({ type: 'error', text: result.error || 'Unable to upload profile picture.' });
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.avatar_url) return;
    if (!confirm('Remove your profile picture?')) return;

    setAvatarMessage(null);
    setAvatarLoading(true);

    const result = await removeAvatar();
    setAvatarLoading(false);

    if (result.success) {
      setAvatarMessage({ type: 'success', text: 'Profile picture removed.' });
    } else {
      setAvatarMessage({ type: 'error', text: result.error || 'Unable to remove profile picture.' });
    }
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="user-avatar user-avatar-xl avatar-preview" />
              ) : (
                <UserAvatar user={user} size="xl" />
              )}
            </div>

            <div className="avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="avatar-file-input"
                onChange={handleAvatarSelect}
                disabled={avatarLoading}
              />
              <button
                type="button"
                className="btn-secondary btn-avatar"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
              >
                {avatarLoading ? 'Uploading...' : user.avatar_url ? 'Replace Photo' : 'Upload Photo'}
              </button>
              {user.avatar_url && (
                <button
                  type="button"
                  className="btn-secondary btn-avatar-danger"
                  onClick={handleAvatarRemove}
                  disabled={avatarLoading}
                >
                  Remove Photo
                </button>
              )}
              <p className="avatar-hint">JPG, PNG, GIF, or WebP · Max 5 MB</p>
              {avatarMessage && (
                <div className={`message ${avatarMessage.type}`}>
                  {avatarMessage.text}
                </div>
              )}
            </div>
          </div>

          <div className="profile-info">
            <h2>{user.full_name}</h2>
            <p className="email">{user.email}</p>
            <span className={`role-badge role-${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-card">
            <div className="card-header">
              <h3>Personal Information</h3>
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-edit">
                  Edit
                </button>
              )}
            </div>

            {profileMessage && (
              <div className={`message ${profileMessage.type}`}>
                {profileMessage.text}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      maxLength={50}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" value={user.email} disabled />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="555-0100"
                    maxLength={20}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Computer Science"
                    maxLength={100}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={profileLoading} className="btn-primary">
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-display">
                <div className="info-row">
                  <span className="label">First Name:</span>
                  <span>{user.first_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Last Name:</span>
                  <span>{user.last_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span>{user.phone || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Department:</span>
                  <span>{user.department || 'Not provided'}</span>
                </div>
                {user.student_id && (
                  <div className="info-row">
                    <span className="label">Student ID:</span>
                    <span>{user.student_id}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Role:</span>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Account Status:</span>
                  <span className="status-active">Active</span>
                </div>
                <div className="info-row">
                  <span className="label">Member Since:</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail-card">
            <div className="card-header">
              <h3>Change Password</h3>
            </div>

            {passwordMessage && (
              <div className={`message ${passwordMessage.type}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="profile-form">
              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <input
                  id="new_password"
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  minLength={8}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={passwordLoading} className="btn-primary">
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
