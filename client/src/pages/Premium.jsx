import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const FEATURES = [
  { feature: 'Free animal companions', free: '6', pass: 'All 16' },
  { feature: 'Recycling tracking', free: true, pass: true },
  { feature: 'Impact stats & streaks', free: true, pass: true },
  { feature: 'Leaderboards', free: true, pass: true },
  { feature: 'Premium animals', free: false, pass: true },
  { feature: 'Seasonal exclusives', free: false, pass: true },
  { feature: 'Household accounts', free: false, pass: true },
  { feature: 'Detailed reports', free: false, pass: true },
  { feature: 'Premium badge', free: false, pass: true },
  { feature: 'Data export', free: false, pass: true },
];

export default function Premium() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [animals, setAnimals] = useState([]);

  const isPremium = user?.is_premium;

  useEffect(() => {
    apiFetch('/animals')
      .then((data) => setAnimals(data.animals.filter((a) => a.is_premium)))
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/subscribe/planet-pass', { method: 'POST' });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast(err.message, 'error');
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const data = await apiFetch('/payments/portal', { method: 'POST' });
      window.location.href = data.portal_url;
    } catch (err) {
      toast(err.message, 'error');
      setPortalLoading(false);
    }
  };

  return (
    <div className="page premium-page">
      {/* Hero */}
      <div className="premium-hero">
        <div className="premium-hero-icon">🌟</div>
        <h1 className="premium-hero-title">
          {isPremium ? "You're a Planet Pass Member!" : 'Unlock the Full Experience'}
        </h1>
        <p className="premium-hero-subtitle">
          {isPremium
            ? 'Thank you for supporting conservation. You have access to all premium features.'
            : 'Get Planet Pass for all 16 animals, detailed reports, household accounts, and more.'}
        </p>
        {isPremium ? (
          <button className="btn btn-premium" onClick={handleManage} disabled={portalLoading}>
            {portalLoading ? 'Opening...' : 'Manage Subscription'}
          </button>
        ) : (
          <div className="premium-hero-price">
            <span className="premium-price">$3.99</span>
            <span className="premium-period">/month</span>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div className="card premium-compare-card">
        <table className="premium-compare">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th className="premium-col">Planet Pass</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.feature}>
                <td>{f.feature}</td>
                <td className="compare-cell">
                  {f.free === true ? '✓' : f.free === false ? '—' : f.free}
                </td>
                <td className="compare-cell premium-col">
                  {f.pass === true ? '✓' : f.pass}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Premium animals teaser */}
      {animals.length > 0 && (
        <div className="premium-animals-section">
          <h2>Premium Companions</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {isPremium ? 'All unlocked with your Planet Pass!' : 'Unlock all of them with Planet Pass'}
          </p>
          <div className="premium-animals-scroll">
            {animals.map((a) => (
              <div key={a.id} className="premium-animal-chip">
                <span className="premium-animal-emoji">{a.emoji}</span>
                <span className="premium-animal-name">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {!isPremium && (
        <div className="premium-cta">
          <button
            className="btn btn-premium btn-lg premium-cta-btn"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Start 7-Day Free Trial'}
          </button>
          <p className="premium-cta-note">Cancel anytime. $3.99/month after trial.</p>
        </div>
      )}
    </div>
  );
}
