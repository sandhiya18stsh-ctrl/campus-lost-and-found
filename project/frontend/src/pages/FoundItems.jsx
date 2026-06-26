import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_ORIGIN, api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './FoundItems.css';

const FoundItems = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [claimItem, setClaimItem] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    brand: '',
    color: '',
    date_found: '',
    storage_location: '',
    is_featured: false,
  });
  const [claimData, setClaimData] = useState({
    lost_item_id: '',
    full_name: '',
    register_number: '',
    department: '',
    contact_number: '',
    email: '',
    ownership_description: '',
  });
  const [myClaims, setMyClaims] = useState([]);

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchLocations();
    fetchLostItems();
    fetchMyClaims();
  }, []);

  useEffect(() => {
    if (!showForm) {
      fetchItems();
    }
  }, [showForm]);

  useEffect(() => {
    const openClaimFor = location.state?.openClaimFor;
    if (!openClaimFor) return;

    const openClaimModal = async () => {
      let itemToClaim = items.find((item) => item.found_item_id === openClaimFor);

      if (!itemToClaim) {
        try {
          itemToClaim = await api.getFoundItem(openClaimFor);
        } catch {
          itemToClaim = null;
        }
      }

      if (itemToClaim) {
        setClaimItem(itemToClaim);
        setClaimData((prev) => ({
          ...prev,
          ...(location.state?.claimDefaults || {}),
        }));
      }

      navigate(location.pathname, { replace: true, state: null });
    };

    openClaimModal();
  }, [items, location.pathname, location.state, navigate]);

  const fetchItems = async () => {
    try {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      if (filterLocation) params.location_id = filterLocation;
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getFoundItems(params);
      setItems(data);
    } catch (error) {
      console.error('Error fetching found items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await api.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchLostItems = async () => {
    try {
      const data = await api.getLostItems({ status: 'OPEN', user_id: user?.user_id });
      setLostItems(data);
    } catch (error) {
      console.error('Error fetching lost items:', error);
    }
  };

  const fetchMyClaims = async () => {
    try {
      const data = await api.getMyClaims();
      setMyClaims(data);
    } catch (error) {
      console.error('Error fetching my claims:', error);
    }
  };

  const getMyClaimForItem = (foundItemId) =>
    myClaims.find(
      (claim) =>
        claim.found_item_id === foundItemId
        && ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(claim.status),
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createFoundItem({
        ...formData,
        category_id: Number(formData.category_id),
        location_id: formData.location_id ? Number(formData.location_id) : null,
      });
      if (imageFile) {
        await api.uploadFoundItemImage(created.found_item_id, imageFile);
      }
      setShowForm(false);
      setImageFile(null);
      setImagePreview('');
      setFormData({
        title: '',
        description: '',
        category_id: '',
        location_id: '',
        brand: '',
        color: '',
        date_found: '',
        storage_location: '',
        is_featured: false,
      });
      fetchItems();
    } catch (error) {
      alert('Error creating found item: ' + error.message);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleImageChange = (file) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const applyFilters = () => {
    fetchItems();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterLocation('');
    setFilterStatus('');
    fetchItems();
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();

    if (lostItems.length === 0) {
      alert('You need an open lost item report before claiming. Create one from Lost Items first.');
      return;
    }

    try {
      const notes = [
        `Full name: ${claimData.full_name}`,
        `Register number: ${claimData.register_number}`,
        `Department: ${claimData.department}`,
        `Contact: ${claimData.contact_number}`,
        `Email: ${claimData.email}`,
        `Ownership proof: ${claimData.ownership_description}`,
      ].join('\n');

      await api.createClaim({
        lost_item_id: Number(claimData.lost_item_id),
        found_item_id: claimItem.found_item_id,
        verification_notes: notes,
      });

      setClaimItem(null);
      setClaimData({
        lost_item_id: '',
        full_name: '',
        register_number: '',
        department: '',
        contact_number: '',
        email: '',
        ownership_description: '',
      });
      fetchMyClaims();
      alert('Claim submitted successfully. Track its status on the Claims page.');
    } catch (error) {
      alert('Error submitting claim: ' + error.message);
    }
  };

  return (
    <div className="items-page">
      <div className="items-header">
        <h1>Found Items</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Report Found Item
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <h2>Report Found Item</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., iPhone 13 Pro"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Location Found</label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date Found *</label>
                <input
                  type="date"
                  value={formData.date_found}
                  onChange={(e) => setFormData({ ...formData, date_found: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Storage Location</label>
                <input
                  type="text"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  placeholder="e.g., Lost & Found Office"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Apple"
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Blue"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  placeholder="Provide detailed description of the item..."
                />
              </div>

              <div className="form-group">
                <label>Item Image</label>
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Selected item preview" />
                  ) : (
                    <span>Click to upload an item photo</span>
                  )}
                </label>
                {imagePreview && (
                  <button type="button" className="btn-secondary" onClick={() => handleImageChange(null)}>
                    Remove Image
                  </button>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {claimItem && (
        <div className="form-overlay">
          <div className="form-modal wide-modal">
            <h2>Claim {claimItem.title}</h2>
            <p className="modal-subtitle">Share clear proof so staff can verify ownership quickly.</p>
            <form onSubmit={handleClaimSubmit}>
              {lostItems.length === 0 ? (
                <div className="claim-warning">
                  <p>You need an open lost item report to submit a claim.</p>
                  <Link to="/lost-items" className="btn-primary">Report a Lost Item</Link>
                </div>
              ) : (
              <>
              <div className="form-group">
                <label>Your Lost Item Report *</label>
                <select
                  value={claimData.lost_item_id}
                  onChange={(e) => setClaimData({ ...claimData, lost_item_id: e.target.value })}
                  required
                >
                  <option value="">Select your matching lost item</option>
                  {lostItems.map((item) => (
                    <option key={item.lost_item_id} value={item.lost_item_id}>
                      {item.title} - {new Date(item.date_lost).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={claimData.full_name} onChange={(e) => setClaimData({ ...claimData, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Register Number *</label>
                  <input value={claimData.register_number} onChange={(e) => setClaimData({ ...claimData, register_number: e.target.value })} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <input value={claimData.department} onChange={(e) => setClaimData({ ...claimData, department: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input value={claimData.contact_number} onChange={(e) => setClaimData({ ...claimData, contact_number: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={claimData.email} onChange={(e) => setClaimData({ ...claimData, email: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Description Proving Ownership *</label>
                <textarea
                  value={claimData.ownership_description}
                  onChange={(e) => setClaimData({ ...claimData, ownership_description: e.target.value })}
                  rows="5"
                  required
                  placeholder="Mention serial numbers, unique marks, contents, lock screen details, or anything only the owner would know."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setClaimItem(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Claim</button>
              </div>
              </>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <button onClick={applyFilters} className="btn-primary">
            Search
          </button>
        </div>

        <div className="filter-controls">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="CLAIMED">Claimed</option>
            <option value="RETURNED">Returned</option>
            <option value="DISPOSED">Disposed</option>
          </select>

          <button onClick={resetFilters} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No found items available.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => {
            const existingClaim = getMyClaimForItem(item.found_item_id);
            return (
            <div key={item.found_item_id} className="item-card">
              <div className="item-media">
                {item.image_url ? (
                  <img src={`${API_ORIGIN}${item.image_url}`} alt={item.title} />
                ) : (
                  <div className="item-media-fallback">Found</div>
                )}
              </div>
              <div className={`item-status status-${item.status.toLowerCase()}`}>
                {item.status}
              </div>
              <h3>{item.title}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-details">
                <span>Category: {item.category?.name || 'N/A'}</span>
                <span>Date Found: {new Date(item.date_found).toLocaleDateString()}</span>
                {item.brand && <span>Brand: {item.brand}</span>}
                {item.color && <span>Color: {item.color}</span>}
                {item.storage_location && <span>Storage: {item.storage_location}</span>}
              </div>
              <div className="item-actions">
                <Link
                  to={`/found-items/${item.found_item_id}`}
                  className="btn-secondary"
                >
                  View Details
                </Link>
                {item.status === 'AVAILABLE' && !existingClaim && (
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => {
                      setClaimItem(item);
                      setClaimData({
                        ...claimData,
                        full_name: user?.full_name || '',
                        department: user?.department || '',
                        email: user?.email || '',
                      });
                    }}
                  >
                    Claim Item
                  </button>
                )}
                {existingClaim && (
                  <span className="claim-submitted-badge">
                    Claim {existingClaim.status.replace('_', ' ').toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FoundItems;
