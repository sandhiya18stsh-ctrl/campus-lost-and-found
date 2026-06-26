import { useState, useEffect } from 'react';
import { API_ORIGIN, api } from '../services/api';
import AIMatches from '../components/AIMatches';
import './LostItems.css';

const LostItems = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
    date_lost: '',
    is_featured: false,
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!showForm) {
      fetchItems();
    }
  }, [showForm]);

  const fetchItems = async () => {
    try {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      if (filterLocation) params.location_id = filterLocation;
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getLostItems(params);
      setItems(data);
    } catch (error) {
      console.error('Error fetching lost items:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createLostItem({
        ...formData,
        category_id: Number(formData.category_id),
        location_id: formData.location_id ? Number(formData.location_id) : null,
      });
      if (imageFile) {
        await api.uploadLostItemImage(created.lost_item_id, imageFile);
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
        date_lost: '',
        is_featured: false,
      });
      fetchItems();
    } catch (error) {
      alert('Error creating lost item: ' + error.message);
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

  return (
    <div className="items-page">
      <div className="items-header">
        <h1>Lost Items</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Report Lost Item
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <h2>Report Lost Item</h2>
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
                <label>Location</label>
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
                <label>Date Lost *</label>
                <input
                  type="date"
                  value={formData.date_lost}
                  onChange={(e) => setFormData({ ...formData, date_lost: e.target.value })}
                  required
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
            <option value="OPEN">Open</option>
            <option value="MATCHED">Matched</option>
            <option value="CLAIMED">Claimed</option>
            <option value="CLOSED">Closed</option>
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
          <p>No lost items found.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.lost_item_id} className="item-card" onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
              <div className="item-media">
                {item.image_url ? (
                  <img src={`${API_ORIGIN}${item.image_url}`} alt={item.title} />
                ) : (
                  <div className="item-media-fallback">Lost</div>
                )}
              </div>
              <div className={`item-status status-${item.status.toLowerCase()}`}>
                {item.status}
              </div>
              <h3>{item.title}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-details">
                <span>Category: {item.category?.name || 'N/A'}</span>
                <span>Date Lost: {new Date(item.date_lost).toLocaleDateString()}</span>
                {item.brand && <span>Brand: {item.brand}</span>}
                {item.color && <span>Color: {item.color}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lost item detail drawer with AI Matches */}
      {selectedItem && (
        <div className="item-detail-overlay" onClick={() => setSelectedItem(null)}>
          <div className="item-detail-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="item-detail-drawer-header">
              <h2>{selectedItem.title}</h2>
              <button className="btn-secondary" onClick={() => setSelectedItem(null)}>✕ Close</button>
            </div>
            <div className="item-detail-drawer-body">
              {selectedItem.image_url && (
                <img
                  src={`${API_ORIGIN}${selectedItem.image_url}`}
                  alt={selectedItem.title}
                  className="drawer-item-image"
                />
              )}
              <dl className="drawer-meta">
                <div className="info-row"><dt>Status</dt><dd><span className={`item-status status-${selectedItem.status.toLowerCase()}`}>{selectedItem.status}</span></dd></div>
                <div className="info-row"><dt>Category</dt><dd>{categories.find(c => c.category_id === selectedItem.category_id)?.name || 'N/A'}</dd></div>
                {selectedItem.location_id && <div className="info-row"><dt>Location</dt><dd>{locations.find(l => l.location_id === selectedItem.location_id)?.name || 'N/A'}</dd></div>}
                <div className="info-row"><dt>Date Lost</dt><dd>{new Date(selectedItem.date_lost).toLocaleDateString()}</dd></div>
                {selectedItem.brand && <div className="info-row"><dt>Brand</dt><dd>{selectedItem.brand}</dd></div>}
                {selectedItem.color && <div className="info-row"><dt>Color</dt><dd>{selectedItem.color}</dd></div>}
                {selectedItem.description && <div className="info-row"><dt>Description</dt><dd>{selectedItem.description}</dd></div>}
              </dl>

              <AIMatches
                mode="lost"
                itemId={selectedItem.lost_item_id}
                categories={categories}
                locations={locations}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostItems;
