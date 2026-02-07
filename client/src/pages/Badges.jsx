import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import BadgeCard from '../components/BadgeCard';

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/badges')
      .then((data) => setBadges(data.badges))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page loading">Loading...</div>;

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="page badges-page">
      <h1>My Badges</h1>
      {earned.length === 0 ? (
        <div className="empty-state">
          <p>Your trophy shelf is waiting! Start logging to earn your first badge.</p>
        </div>
      ) : (
        <p className="badge-count">{earned.length} of {badges.length} earned</p>
      )}
      <div className="badge-grid">
        {earned.map((b) => <BadgeCard key={b.id} badge={b} />)}
        {locked.map((b) => <BadgeCard key={b.id} badge={b} />)}
      </div>
    </div>
  );
}
