import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import LeaderboardRow from '../components/LeaderboardRow';

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/leaderboard?period=weekly')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page loading">Loading...</div>;

  return (
    <div className="page leaderboard-page">
      <h1>Weekly Leaderboard</h1>
      {!data || data.leaderboard.length === 0 ? (
        <div className="empty-state">
          <p>The leaderboard is wide open! Be the first to claim the top spot.</p>
        </div>
      ) : (
        <>
          <div className="leaderboard-list">
            {data.leaderboard.map((entry) => (
              <LeaderboardRow key={entry.rank} entry={entry} />
            ))}
          </div>
          {data.user_rank > 0 && (
            <p className="user-rank">Your rank: #{data.user_rank}</p>
          )}
        </>
      )}
    </div>
  );
}
