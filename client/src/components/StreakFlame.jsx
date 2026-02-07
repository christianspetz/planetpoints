export default function StreakFlame({ current, best }) {
  return (
    <div className="streak-flame">
      <div className="flame-icon">{current > 0 ? '🔥' : '💤'}</div>
      <div className="flame-count">{current}</div>
      <div className="flame-label">day streak</div>
      {best > 0 && <div className="flame-best">Best: {best} days</div>}
    </div>
  );
}
