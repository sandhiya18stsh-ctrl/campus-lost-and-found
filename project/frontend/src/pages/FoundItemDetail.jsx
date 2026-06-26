import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_ORIGIN, api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AIMatches from '../components/AIMatches';
import './FoundItemDetail.css';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const FoundItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [item, setItem] = useState(null);
  const [categoryName, setCategoryName] = useState('N/A');
  const [locationName, setLocationName] = useState('N/A');
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reporter, setReporter] = useState(null);
  const [myClaim, setMyClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const itemId = Number(id);
  const isValidId = Number.isInteger(itemId) && itemId > 0;

  useEffect(() => {
    if (!isValidId) {
      setLoading(false);
      setError('Invalid item ID. Please check the link and try again.');
      return;
    }

    let cancelled = false;

    const loadItem = async () => {
      setLoading(true);
      setError('');
      setItem(null);
      setReporter(null);

      try {
        const [itemData, categories, locations, myClaims] = await Promise.all([
          api.getFoundItem(itemId),
          api.getCategories(),
          api.getLocations(),
          api.getMyClaims(),
        ]);

        if (cancelled) return;

        setItem(itemData);
        setMyClaim(
          myClaims.find(
            (claim) =>
              claim.found_item_id === itemId
              && ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(claim.status),
          ) || null,
        );
        setCategories(categories);
        setLocations(locations);
        setCategoryName(
          categories.find((cat) => cat.category_id === itemData.category_id)?.name || 'N/A'
        );
        setLocationName(
          locations.find((loc) => loc.location_id === itemData.location_id)?.name || 'N/A'
        );

        if (itemData.user_id === user?.user_id) {
          setReporter({
            label: 'Reported by you',
            name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
            email: user.email,
            department: user.department,
          });
        } else if (isAdmin) {
          try {
            const reporterUser = await api.getUser(itemData.user_id);
            if (!cancelled) {
              setReporter({
                label: 'Reported by',
                name: reporterUser.full_name,
                email: reporterUser.email,
                department: reporterUser.department,
              });
            }
          } catch {
            if (!cancelled) {
              setReporter({ label: 'Reported by', name: 'Campus member', hidden: true });
            }
          }
        } else {
          setReporter({ label: 'Reported by', name: 'Campus member', hidden: true });
        }
      } catch (err) {
        if (cancelled) return;

        const message = err.message || 'Unable to load this item.';
        if (message.toLowerCase().includes('not found')) {
          setError('This found item could not be found. It may have been removed or the link is incorrect.');
        } else {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadItem();

    return () => {
      cancelled = true;
    };
  }, [itemId, isValidId, user, isAdmin]);

  const primaryImage = item?.image_url
    || item?.images?.find((image) => image.is_primary)?.image_url
    || item?.images?.[0]?.image_url;

  const imageSrc = primaryImage ? `${API_ORIGIN}${primaryImage}` : null;

  const handleClaim = () => {
    navigate('/found-items', {
      state: {
        openClaimFor: item.found_item_id,
        claimDefaults: {
          full_name: user?.full_name || '',
          department: user?.department || '',
          email: user?.email || '',
        },
      },
    });
  };

  return (
    <div className="items-page item-detail-page">
      <div className="item-detail-header">
        <Link to="/found-items" className="btn-secondary">
          Back to Found Items
        </Link>
      </div>

      {loading && (
        <div className="loading">Loading item details...</div>
      )}

      {!loading && error && (
        <div className="item-detail-error">
          <h2>Unable to load item</h2>
          <p>{error}</p>
          <Link to="/found-items" className="btn-primary">
            Return to Found Items
          </Link>
        </div>
      )}

      {!loading && !error && item && (
        <article className="item-detail-card">
          <div className="item-detail-media">
            {imageSrc ? (
              <img src={imageSrc} alt={item.title} />
            ) : (
              <div className="item-media-fallback">No photo available</div>
            )}
          </div>

          <div className="item-detail-content">
            <div className="item-detail-title-row">
              <h1>{item.title}</h1>
              <span className={`item-status status-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>

            <p className="item-detail-description">
              {item.description || 'No description provided.'}
            </p>

            <section className="detail-section">
              <h2>Item Information</h2>
              <dl className="item-detail-meta">
                <div className="info-row">
                  <dt className="label">Category</dt>
                  <dd>{categoryName}</dd>
                </div>
                <div className="info-row">
                  <dt className="label">Location Found</dt>
                  <dd>{locationName}</dd>
                </div>
                <div className="info-row">
                  <dt className="label">Date Found</dt>
                  <dd>{formatDate(item.date_found)}</dd>
                </div>
                <div className="info-row">
                  <dt className="label">Status</dt>
                  <dd>{item.status}</dd>
                </div>
                {item.brand && (
                  <div className="info-row">
                    <dt className="label">Brand</dt>
                    <dd>{item.brand}</dd>
                  </div>
                )}
                {item.color && (
                  <div className="info-row">
                    <dt className="label">Color</dt>
                    <dd>{item.color}</dd>
                  </div>
                )}
                {item.storage_location && (
                  <div className="info-row">
                    <dt className="label">Storage Location</dt>
                    <dd>{item.storage_location}</dd>
                  </div>
                )}
                <div className="info-row">
                  <dt className="label">Reported On</dt>
                  <dd>{formatDate(item.created_at)}</dd>
                </div>
              </dl>
            </section>

            {reporter && (
              <section className="detail-section">
                <h2>Reporter</h2>
                <dl className="item-detail-meta">
                  <div className="info-row">
                    <dt className="label">{reporter.label}</dt>
                    <dd>{reporter.name}</dd>
                  </div>
                  {!reporter.hidden && reporter.email && (
                    <div className="info-row">
                      <dt className="label">Email</dt>
                      <dd>{reporter.email}</dd>
                    </div>
                  )}
                  {!reporter.hidden && reporter.department && (
                    <div className="info-row">
                      <dt className="label">Department</dt>
                      <dd>{reporter.department}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {item.images?.length > 1 && (
              <section className="detail-section">
                <h2>Additional Photos</h2>
                <div className="item-detail-gallery">
                  {item.images.map((image) => (
                    <img
                      key={image.image_id}
                      src={`${API_ORIGIN}${image.image_url}`}
                      alt={`${item.title} photo`}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="item-detail-actions">
              {item.status === 'AVAILABLE' && !myClaim && (
                <button type="button" className="btn-primary" onClick={handleClaim}>
                  Claim Item
                </button>
              )}
              {myClaim && (
                <span className="claim-submitted-badge">
                  Your claim is {myClaim.status.replace('_', ' ').toLowerCase()}
                </span>
              )}
              <Link to="/claims" className="btn-secondary">
                View My Claims
              </Link>
              <Link to="/found-items" className="btn-secondary">
                Back to List
              </Link>
            </div>

            <AIMatches
              mode="found"
              itemId={item.found_item_id}
              categories={categories}
              locations={locations}
            />
          </div>
        </article>
      )}
    </div>
  );
};

export default FoundItemDetail;
