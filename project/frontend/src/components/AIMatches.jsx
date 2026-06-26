import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ORIGIN, api } from '../services/api';
import './AIMatches.css';

/**
 * AIMatches — shows potential matches for either a lost item or a found item.
 *
 * Props:
 *   mode:       'lost' | 'found'
 *   itemId:     ID of the item to find matches for
 *   categories: array of { category_id, name } (optional, for label lookup)
 *   locations:  array of { location_id, name }  (optional, for label lookup)
 */
const CONFIDENCE_META = {
  HIGH:   { label: 'High Confidence',   className: 'confidence-high',   icon: '🎯' },
  MEDIUM: { label: 'Medium Confidence', className: 'confidence-medium', icon: '🔍' },
  LOW:    { label: 'Low Confidence',    className: 'confidence-low',    icon: '💡' },
};

const AIMatches = ({ mode, itemId, categories = [], locations = [] }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);

  const catName = (id) => categories.find((c) => c.category_id === id)?.name || `Cat #${id}`;
  const locName = (id) => locations.find((l) => l.location_id === id)?.name || null;

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    setError('');

    const fetch = mode === 'lost'
      ? api.getMatchesForLostItem(itemId)
      : api.getMatchesForFoundItem(itemId);

    fetch
      .then((data) => setMatches(data.matches || []))
      .catch(() => setError('Could not load AI match suggestions.'))
      .finally(() => setLoading(false));
  }, [mode, itemId]);

  if (loading) {
    return (
      <section className="ai-matches-section">
        <div className="ai-matches-header">
          <span className="ai-badge">✨ AI</span>
          <h2>Possible Matches</h2>
        </div>
        <div className="ai-matches-loading">Analysing potential matches…</div>
      </section>
    );
  }

  const highCount   = matches.filter((m) => m.confidence === 'HIGH').length;
  const mediumCount = matches.filter((m) => m.confidence === 'MEDIUM').length;
  const lowCount    = matches.filter((m) => m.confidence === 'LOW').length;

  return (
    <section className="ai-matches-section">
      <div className="ai-matches-header" onClick={() => setExpanded((v) => !v)} role="button" tabIndex={0}
           onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}>
        <span className="ai-badge">✨ AI</span>
        <h2>Possible Matches</h2>
        {!loading && (
          <span className="ai-matches-summary">
            {matches.length === 0
              ? 'No matches found'
              : `${matches.length} suggestion${matches.length !== 1 ? 's' : ''}` +
                (highCount ? ` · ${highCount} high` : '') +
                (mediumCount ? ` · ${mediumCount} medium` : '') +
                (lowCount ? ` · ${lowCount} low` : '')}
          </span>
        )}
        <span className="ai-matches-toggle">{expanded ? '▲' : '▼'}</span>
      </div>

      {error && <p className="ai-matches-error">{error}</p>}

      {expanded && !error && matches.length === 0 && (
        <p className="ai-matches-empty">
          No potential matches found yet. Matches will appear automatically when a similar item is reported.
        </p>
      )}

      {expanded && matches.length > 0 && (
        <div className="ai-matches-list">
          {matches.map((match, idx) => {
            const item = mode === 'lost' ? match.found_item : match.lost_item;
            const meta = CONFIDENCE_META[match.confidence] || CONFIDENCE_META.LOW;
            const itemPath = mode === 'lost'
              ? `/found-items/${item.found_item_id}`
              : `/lost-items`; // lost items page (no dedicated detail route in existing app)
            const dateLabel = mode === 'lost'
              ? `Found: ${item.date_found ? new Date(item.date_found).toLocaleDateString() : 'Unknown'}`
              : `Lost: ${item.date_lost ? new Date(item.date_lost).toLocaleDateString() : 'Unknown'}`;
            const imageSrc = item.image_url ? `${API_ORIGIN}${item.image_url}` : null;
            const loc = item.location_id ? locName(item.location_id) : null;

            return (
              <article key={idx} className={`ai-match-card ${meta.className}`}>
                <div className="ai-match-score-badge">
                  <span className="score-number">{match.score}%</span>
                  <span className="score-label">{meta.icon} {meta.label}</span>
                </div>

                <div className="ai-match-media">
                  {imageSrc
                    ? <img src={imageSrc} alt={item.title} />
                    : <div className="ai-match-media-fallback">{mode === 'lost' ? 'Found' : 'Lost'}</div>}
                </div>

                <div className="ai-match-info">
                  <h3 className="ai-match-title">{item.title}</h3>
                  {item.description && (
                    <p className="ai-match-desc">{item.description.slice(0, 120)}{item.description.length > 120 ? '…' : ''}</p>
                  )}

                  <div className="ai-match-meta">
                    <span className="meta-tag">{catName(item.category_id)}</span>
                    {loc && <span className="meta-tag">📍 {loc}</span>}
                    {item.color && <span className="meta-tag">🎨 {item.color}</span>}
                    {item.brand && <span className="meta-tag">🏷 {item.brand}</span>}
                    <span className="meta-tag">{dateLabel}</span>
                  </div>

                  <div className="ai-match-factors">
                    <span className="factor-bar-label">Match strength</span>
                    <div className="factor-bar-track">
                      <div
                        className={`factor-bar-fill ${meta.className}`}
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="ai-match-actions">
                    {mode === 'lost' ? (
                      <Link to={itemPath} className="btn-primary btn-sm">
                        View Found Item
                      </Link>
                    ) : (
                      <span className="ai-match-hint">
                        Check the Lost Items list for item #{item.lost_item_id}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="ai-matches-disclaimer">
        ℹ️ AI suggestions are for reference only. Matches are based on title, description, category, location, date, and colour similarity. Staff verify all claims.
      </p>
    </section>
  );
};

export default AIMatches;
