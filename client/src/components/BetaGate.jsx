import { useState } from 'react';
import { apiFetch } from '../utils/api';

const BETA_KEY = 'beta_access';

export function hasBetaAccess() {
  return localStorage.getItem(BETA_KEY) === 'true';
}

export default function BetaGate({ children }) {
  const [granted, setGranted] = useState(hasBetaAccess);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  if (granted) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/beta', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (data.granted) {
        localStorage.setItem(BETA_KEY, 'true');
        setGranted(true);
      }
    } catch {
      setError('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="beta-gate">
      <div className="beta-card">
        <div className="beta-animal-peek">
          <span className="beta-animal">🐼</span>
        </div>
        <div className="beta-content">
          <h1 className="beta-title">PlanetPoints</h1>
          <div className="beta-badge">Private Beta</div>
          <p className="beta-subtitle">
            We're still planting the seeds. Enter the beta password to get early access.
          </p>
          <form onSubmit={handleSubmit} className={`beta-form ${shake ? 'shake' : ''}`}>
            <input
              type="password"
              className="input beta-input"
              placeholder="Beta password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary beta-submit"
              disabled={loading || !password.trim()}
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
          </form>
          {error && <div className="beta-error">{error}</div>}
        </div>
      </div>
      <div className="beta-footer">
        Track your recycling. See your impact. Save the planet.
      </div>
    </div>
  );
}
