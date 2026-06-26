import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ORIGIN, api } from '../services/api';
import './Home.css';

const Home = () => {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [openLostCount, setOpenLostCount] = useState(0);
  const [availableFoundCount, setAvailableFoundCount] = useState(0);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [aiMatchCount, setAiMatchCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Fetch recent items for display + accurate filtered counts from the server
      const [lostData, foundData, openLostData, availableFoundData] = await Promise.all([
        api.getLostItems({ limit: 6 }),
        api.getFoundItems({ limit: 6 }),
        api.getLostItems({ status: 'OPEN', limit: 100 }),
        api.getFoundItems({ status: 'AVAILABLE', limit: 100 }),
      ]);

      setLostItems(lostData);
      setFoundItems(foundData);
      setOpenLostCount(openLostData.length);
      setAvailableFoundCount(availableFoundData.length);

      try {
        const myClaims = await api.getMyClaims({ limit: 100 });
        setClaims(myClaims);
        setPendingClaimsCount(myClaims.filter((c) => c.status === 'PENDING').length);
      } catch {
        setClaims([]);
        setPendingClaimsCount(0);
      }

      try {
        const matchStats = await api.getAIMatchStats();
        setAiMatchCount(matchStats.ai_matches_found ?? 0);
      } catch {
        setAiMatchCount(0);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const imageSrc = (url) => (url ? `${API_ORIGIN}${url}` : null);

  if (loading) {
    return <div className="home-page"><div className="loading">Loading dashboard...</div></div>;
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">University-grade lost item recovery</span>
          <h1>Recover campus belongings with clarity, speed, and trust.</h1>
          <p>
            Report lost and found items, submit ownership claims, and let staff verify returns through one organized workflow.
          </p>
          <div className="hero-actions">
            <Link to="/lost-items" className="btn-primary btn-large">Report Lost Item</Link>
            <Link to="/found-items" className="btn-secondary btn-large">Browse Found Items</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div>
            <strong>{openLostCount}</strong>
            <span>Open lost reports</span>
          </div>
          <div>
            <strong>{availableFoundCount}</strong>
            <span>Available found items</span>
          </div>
          <div>
            <strong>{pendingClaimsCount}</strong>
            <span>Claims awaiting review</span>
          </div>
          <div className="hero-panel-ai">
            <strong>{aiMatchCount !== null ? aiMatchCount : '…'}</strong>
            <span>✨ AI Matches Found</span>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{lostItems.length}</div>
          <div className="stat-label">Recent Lost Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{foundItems.length}</div>
          <div className="stat-label">Recent Found Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{claims.length}</div>
          <div className="stat-label">Your Recent Claims</div>
        </div>
        <div className="stat-card stat-card-ai">
          <div className="stat-number">{aiMatchCount !== null ? aiMatchCount : '…'}</div>
          <div className="stat-label">✨ AI Matches Found</div>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <div>
            <h2>Recently Found</h2>
            <p>Freshly reported items ready for ownership verification.</p>
          </div>
          <Link to="/found-items" className="view-all">View All</Link>
        </div>

        <div className="items-grid">
          {foundItems.slice(0, 3).map((item) => (
            <article key={item.found_item_id} className="item-card found">
              <div className="item-media">
                {imageSrc(item.image_url) ? <img src={imageSrc(item.image_url)} alt={item.title} /> : <div className="item-media-fallback">Found</div>}
              </div>
              <span className={`item-status status-${item.status.toLowerCase()}`}>{item.status}</span>
              <h3>{item.title}</h3>
              <p className="item-description">{item.description || 'No description provided yet.'}</p>
              <div className="item-details">
                <span>Found: {new Date(item.date_found).toLocaleDateString()}</span>
                {item.storage_location && <span>Storage: {item.storage_location}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <div>
            <h2>Recently Lost</h2>
            <p>Reports from students and staff that may match found items.</p>
          </div>
          <Link to="/lost-items" className="view-all">View All</Link>
        </div>

        <div className="items-grid">
          {lostItems.slice(0, 3).map((item) => (
            <article key={item.lost_item_id} className="item-card">
              <div className="item-media">
                {imageSrc(item.image_url) ? <img src={imageSrc(item.image_url)} alt={item.title} /> : <div className="item-media-fallback">Lost</div>}
              </div>
              <span className={`item-status status-${item.status.toLowerCase()}`}>{item.status}</span>
              <h3>{item.title}</h3>
              <p className="item-description">{item.description || 'No description provided yet.'}</p>
              <div className="item-details">
                <span>Lost: {new Date(item.date_lost).toLocaleDateString()}</span>
                {item.brand && <span>Brand: {item.brand}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <div>
            <h2>How Recovery Works</h2>
            <p>A transparent workflow from report to verified return.</p>
          </div>
        </div>
        <div className="steps-grid">
          {[
            ['1', 'Report', 'Add the item details, location, date, and a clear photo.'],
            ['2', 'Search', 'Filter by category, location, dates, and item details.'],
            ['3', 'Claim', 'Submit ownership proof for a found item.'],
            ['4', 'Verify', 'Staff review the proof and mark the item returned.'],
          ].map(([number, title, copy]) => (
            <div className="step-card" key={title}>
              <div className="step-number">{number}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
