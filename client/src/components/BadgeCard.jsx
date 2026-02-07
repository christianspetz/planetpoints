export default function BadgeCard({ badge }) {
  return (
    <div className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
      <div className="badge-emoji">{badge.emoji}</div>
      <div className="badge-name">{badge.name}</div>
      <div className="badge-desc">{badge.description}</div>
      {badge.earned && badge.earned_at && (
        <div className="badge-date">
          {new Date(badge.earned_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
