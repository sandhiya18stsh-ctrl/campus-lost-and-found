import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './Claims.css';

const ACTIVE_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED'];

const Claims = () => {
  const { isStaff, isAdmin } = useAuth();
  const isReviewer = isStaff || isAdmin;
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState(isReviewer ? 'review' : 'my');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);

  const [formData, setFormData] = useState({
    lost_item_id: '',
    found_item_id: '',
    verification_notes: '',
  });

  const [verificationData, setVerificationData] = useState({
    status: 'APPROVED',
    verification_notes: '',
  });

  useEffect(() => {
    fetchClaims();
    if (isReviewer) {
      fetchLostItems();
      fetchFoundItems();
    }
  }, [viewMode, filterStatus, isReviewer]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const data = viewMode === 'my'
        ? await api.getMyClaims(params)
        : await api.getClaims(params);
      setClaims(data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLostItems = async () => {
    try {
      const data = await api.getLostItems({ status: 'OPEN' });
      setLostItems(data);
    } catch (error) {
      console.error('Error fetching lost items:', error);
    }
  };

  const fetchFoundItems = async () => {
    try {
      const data = await api.getFoundItems({ status: 'AVAILABLE' });
      setFoundItems(data);
    } catch (error) {
      console.error('Error fetching found items:', error);
    }
  };

  const groupedByFoundItem = useMemo(() => {
    if (viewMode !== 'review') return [];

    const groups = new Map();
    for (const claim of claims) {
      const key = claim.found_item_id;
      if (!groups.has(key)) {
        groups.set(key, {
          found_item_id: key,
          found_item_title: claim.found_item?.title || `Item #${key}`,
          found_item_status: claim.found_item?.status || 'UNKNOWN',
          claims: [],
        });
      }
      groups.get(key).claims.push(claim);
    }

    return Array.from(groups.values()).sort((a, b) => {
      const aPending = a.claims.some((c) => ACTIVE_STATUSES.includes(c.status) && c.status !== 'APPROVED');
      const bPending = b.claims.some((c) => ACTIVE_STATUSES.includes(c.status) && c.status !== 'APPROVED');
      if (aPending !== bPending) return aPending ? -1 : 1;
      return b.found_item_id - a.found_item_id;
    });
  }, [claims, viewMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createClaim({
        lost_item_id: Number(formData.lost_item_id),
        found_item_id: Number(formData.found_item_id),
        verification_notes: formData.verification_notes || undefined,
      });
      setShowForm(false);
      setFormData({ lost_item_id: '', found_item_id: '', verification_notes: '' });
      fetchClaims();
    } catch (error) {
      alert('Error creating claim: ' + error.message);
    }
  };

  const handleReview = async (claimId) => {
    try {
      await api.reviewClaim(claimId);
      fetchClaims();
    } catch (error) {
      alert('Error starting review: ' + error.message);
    }
  };

  const handleVerify = async (claimId) => {
    try {
      await api.verifyClaim(claimId, verificationData);
      setShowVerifyModal(null);
      setVerificationData({ status: 'APPROVED', verification_notes: '' });
      fetchClaims();
    } catch (error) {
      alert('Error verifying claim: ' + error.message);
    }
  };

  const handleComplete = async (claimId) => {
    try {
      if (confirm('Mark this claim as returned? This confirms the item was physically handed over.')) {
        await api.completeClaim(claimId);
        fetchClaims();
      }
    } catch (error) {
      alert('Error completing claim: ' + error.message);
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      PENDING: 'status-pending',
      UNDER_REVIEW: 'status-review',
      APPROVED: 'status-approved',
      REJECTED: 'status-rejected',
      RETURNED: 'status-completed',
    };
    return statusClasses[status] || '';
  };

  const renderTimeline = (claim) => (
    <div className="claim-timeline">
      {['PENDING', 'UNDER_REVIEW', claim.status === 'REJECTED' ? 'REJECTED' : 'APPROVED', 'RETURNED'].map((step) => (
        <span
          key={step}
          className={`timeline-step ${
            step === claim.status
            || (step === 'PENDING')
            || (step === 'APPROVED' && ['APPROVED', 'RETURNED'].includes(claim.status))
            || (step === 'UNDER_REVIEW' && ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED'].includes(claim.status))
            || (step === 'RETURNED' && claim.status === 'RETURNED')
              ? 'active'
              : ''
          }`}
        >
          {step.replace('_', ' ')}
        </span>
      ))}
    </div>
  );

  const renderClaimCard = (claim, showFoundItem = true) => (
    <div key={claim.claim_id} className="claim-card">
      <div className={`claim-status ${getStatusClass(claim.status)}`}>
        {claim.status.replace('_', ' ')}
      </div>

      <div className="claim-header">
        <h3>Claim #{claim.claim_id}</h3>
        <span className="claim-date">
          {new Date(claim.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="claim-info">
        {isReviewer && (
          <div className="info-row">
            <span className="label">Claimant:</span>
            <span>{claim.claimant?.full_name || 'N/A'}</span>
          </div>
        )}
        <div className="info-row">
          <span className="label">Lost Item:</span>
          <span>{claim.lost_item?.title || 'N/A'}</span>
        </div>
        {showFoundItem && (
          <div className="info-row">
            <span className="label">Found Item:</span>
            <span>{claim.found_item?.title || 'N/A'}</span>
          </div>
        )}
        {claim.verification_notes && (
          <div className="info-row notes-row">
            <span className="label">Ownership Proof:</span>
            <span className="notes-text">{claim.verification_notes}</span>
          </div>
        )}
        {claim.verified_at && (
          <div className="info-row">
            <span className="label">Reviewed:</span>
            <span>{new Date(claim.verified_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {renderTimeline(claim)}

      {isReviewer && claim.status === 'PENDING' && (
        <div className="claim-actions">
          <button type="button" onClick={() => handleReview(claim.claim_id)} className="btn-secondary">
            Start Review
          </button>
        </div>
      )}

      {isReviewer && claim.status === 'UNDER_REVIEW' && (
        <div className="claim-actions">
          <button type="button" onClick={() => setShowVerifyModal(claim)} className="btn-verify">
            Decide Ownership
          </button>
        </div>
      )}

      {isReviewer && claim.status === 'APPROVED' && !claim.completed_at && (
        <div className="claim-actions">
          <button type="button" onClick={() => handleComplete(claim.claim_id)} className="btn-complete">
            Mark as Returned
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="claims-page">
      <div className="claims-header">
        <h1>{isReviewer ? 'Claims Management' : 'My Claims'}</h1>
        {isReviewer && (
          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === 'review' ? 'active' : ''}
              onClick={() => setViewMode('review')}
            >
              Review by Item
            </button>
            <button
              type="button"
              className={viewMode === 'all' ? 'active' : ''}
              onClick={() => setViewMode('all')}
            >
              All Claims
            </button>
            <button
              type="button"
              className={viewMode === 'my' ? 'active' : ''}
              onClick={() => setViewMode('my')}
            >
              My Claims
            </button>
          </div>
        )}
      </div>

      {isReviewer && viewMode === 'all' && (
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary">
          Create Claim (Staff)
        </button>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <h2>Create New Claim</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Lost Item *</label>
                <select
                  value={formData.lost_item_id}
                  onChange={(e) => setFormData({ ...formData, lost_item_id: e.target.value })}
                  required
                >
                  <option value="">Select Lost Item</option>
                  {lostItems.map((item) => (
                    <option key={item.lost_item_id} value={item.lost_item_id}>
                      {item.title} - {new Date(item.date_lost).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Found Item *</label>
                <select
                  value={formData.found_item_id}
                  onChange={(e) => setFormData({ ...formData, found_item_id: e.target.value })}
                  required
                >
                  <option value="">Select Found Item</option>
                  {foundItems.map((item) => (
                    <option key={item.found_item_id} value={item.found_item_id}>
                      {item.title} - {new Date(item.date_found).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Verification Notes</label>
                <textarea
                  value={formData.verification_notes}
                  onChange={(e) => setFormData({ ...formData, verification_notes: e.target.value })}
                  rows="4"
                  placeholder="Add any additional information to support this claim..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div className="form-overlay">
          <div className="form-modal wide-modal">
            <h2>Decide Ownership — Claim #{showVerifyModal.claim_id}</h2>
            <div className="claim-details">
              <p><strong>Claimant:</strong> {showVerifyModal.claimant?.full_name}</p>
              <p><strong>Lost Item:</strong> {showVerifyModal.lost_item?.title}</p>
              <p><strong>Found Item:</strong> {showVerifyModal.found_item?.title}</p>
              <p><strong>Ownership Proof:</strong></p>
              <pre className="ownership-proof">{showVerifyModal.verification_notes || 'None provided'}</pre>
            </div>

            {(() => {
              const siblings = claims.filter(
                (c) => c.found_item_id === showVerifyModal.found_item_id
                  && c.claim_id !== showVerifyModal.claim_id
                  && ['PENDING', 'UNDER_REVIEW'].includes(c.status),
              );
              if (siblings.length === 0) return null;
              return (
                <div className="competing-claims-notice">
                  <strong>{siblings.length} other active claim(s)</strong> exist for this found item.
                  Approving this claim will automatically reject the others.
                </div>
              );
            })()}

            <form onSubmit={(e) => { e.preventDefault(); handleVerify(showVerifyModal.claim_id); }}>
              <div className="form-group">
                <label>Decision *</label>
                <select
                  value={verificationData.status}
                  onChange={(e) => setVerificationData({ ...verificationData, status: e.target.value })}
                  required
                >
                  <option value="APPROVED">Approve — verify ownership</option>
                  <option value="REJECTED">Reject — insufficient proof</option>
                </select>
              </div>

              <div className="form-group">
                <label>Staff Notes</label>
                <textarea
                  value={verificationData.verification_notes}
                  onChange={(e) => setVerificationData({ ...verificationData, verification_notes: e.target.value })}
                  rows="4"
                  placeholder="Add verification details or reason for rejection..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowVerifyModal(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filter-section">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <p>No claims found.</p>
          {!isReviewer && (
            <p className="empty-hint">Browse Found Items to submit a claim for a matching item.</p>
          )}
        </div>
      ) : viewMode === 'review' ? (
        <div className="found-item-groups">
          {groupedByFoundItem.map((group) => {
            const activeCount = group.claims.filter((c) => ['PENDING', 'UNDER_REVIEW'].includes(c.status)).length;
            const approvedClaim = group.claims.find((c) => c.status === 'APPROVED' || c.status === 'RETURNED');
            return (
              <section key={group.found_item_id} className="found-item-group">
                <header className="group-header">
                  <div>
                    <h2>{group.found_item_title}</h2>
                    <p className="group-meta">
                      Found Item #{group.found_item_id} · {group.found_item_status}
                      · {group.claims.length} claim{group.claims.length !== 1 ? 's' : ''}
                      {activeCount > 0 && ` · ${activeCount} awaiting review`}
                    </p>
                  </div>
                  {approvedClaim && (
                    <span className="group-owner-badge">
                      Owner: {approvedClaim.claimant?.full_name || 'Approved'}
                    </span>
                  )}
                </header>
                <div className="claims-grid">
                  {group.claims.map((claim) => renderClaimCard(claim, false))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="claims-grid">
          {claims.map((claim) => renderClaimCard(claim))}
        </div>
      )}
    </div>
  );
};

export default Claims;
