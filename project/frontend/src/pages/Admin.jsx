import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Admin.css';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'claims') {
      fetchClaims();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const [lostItems, foundItems, pendingClaims, allUsers] = await Promise.all([
        api.getLostItems(),
        api.getFoundItems(),
        api.getClaims({ status: 'PENDING' }),
        api.getUsers(),
      ]);

      setStats({
        totalLost: lostItems.length,
        openLost: lostItems.filter(item => item.status === 'OPEN').length,
        totalFound: foundItems.length,
        availableFound: foundItems.filter(item => item.status === 'AVAILABLE').length,
        pendingClaims: pendingClaims.length,
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.is_active).length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, role) => {
    try {
      await api.updateUser(targetUser.user_id, { role });
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Unable to update role: ' + error.message);
    }
  };

  const handleActiveToggle = async (targetUser) => {
    try {
      await api.updateUser(targetUser.user_id, { is_active: !targetUser.is_active });
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Unable to update user: ' + error.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!confirm(`Delete ${targetUser.full_name}?`)) return;
    try {
      await api.deleteUser(targetUser.user_id);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Unable to delete user: ' + error.message);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const data = await api.getClaims();
      setClaims(data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && activeTab === 'overview') {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <span className="admin-badge">Administrator</span>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={activeTab === 'claims' ? 'active' : ''}
          onClick={() => setActiveTab('claims')}
        >
          Claims
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <div className="stat-number">{stats.openLost}</div>
                <div className="stat-label">Open Lost Items</div>
                <div className="stat-total">Total: {stats.totalLost}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔍</div>
              <div className="stat-info">
                <div className="stat-number">{stats.availableFound}</div>
                <div className="stat-label">Available Found Items</div>
                <div className="stat-total">Total: {stats.totalFound}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <div className="stat-number">{stats.pendingClaims}</div>
                <div className="stat-label">Pending Claims</div>
                <div className="stat-total">Requires Action</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-number">{stats.activeUsers}</div>
                <div className="stat-label">Active Users</div>
                <div className="stat-total">Total: {stats.totalUsers}</div>
              </div>
            </div>
          </div>

          <div className="quick-links">
            <h3>Quick Actions</h3>
            <div className="links-grid">
              <a href="/claims" className="quick-link">
                Review Pending Claims →
              </a>
              <a href="/users" className="quick-link">
                Manage Users →
              </a>
              <a href="/lost-items" className="quick-link">
                View Lost Items →
              </a>
              <a href="/found-items" className="quick-link">
                View Found Items →
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="section-header">
            <h2>User Management</h2>
            <button onClick={fetchUsers} className="btn-refresh">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select value={user.role} onChange={(e) => handleRoleChange(user, e.target.value)}>
                          <option value="STUDENT">Student</option>
                          <option value="STAFF">Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-secondary" onClick={() => handleActiveToggle(user)}>
                            {user.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn-secondary" onClick={() => handleDeleteUser(user)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="admin-content">
          <div className="section-header">
            <h2>All Claims</h2>
            <button onClick={fetchClaims} className="btn-refresh">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="claims-list">
              {claims.length === 0 ? (
                <div className="empty-state">No claims found.</div>
              ) : (
                claims.map((claim) => (
                  <div key={claim.claim_id} className="claim-item">
                    <div className={`claim-status status-${claim.status.toLowerCase()}`}>
                      {claim.status}
                    </div>
                    <div className="claim-details">
                      <h3>Claim #{claim.claim_id}</h3>
                      <p><strong>Claimant:</strong> {claim.claimant?.full_name}</p>
                      <p><strong>Lost Item:</strong> {claim.lost_item?.title}</p>
                      <p><strong>Found Item:</strong> {claim.found_item?.title}</p>
                      <p><strong>Created:</strong> {new Date(claim.created_at).toLocaleString()}</p>
                      {claim.verified_at && (
                        <p><strong>Verified:</strong> {new Date(claim.verified_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
