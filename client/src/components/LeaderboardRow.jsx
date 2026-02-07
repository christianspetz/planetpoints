export default function LeaderboardRow({ entry }) {
  const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';

  return (
    <div className={`leaderboard-row ${entry.is_current_user ? 'current-user' : ''}`}>
      <span className="lb-rank">{rankEmoji} #{entry.rank}</span>
      <span className="lb-name">{entry.display_name}</span>
      <span className="lb-score">{entry.total_carbon_saved.toFixed(2)} kg CO2</span>
      <span className="lb-items">{entry.total_items} items</span>
    </div>
  );
}
