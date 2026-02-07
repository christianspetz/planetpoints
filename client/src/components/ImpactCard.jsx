export default function ImpactCard({ icon, label, value, unit, subtitle }) {
  return (
    <div className="impact-card">
      <div className="impact-icon">{icon}</div>
      <div className="impact-value">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
      <div className="impact-unit">{unit}</div>
      <div className="impact-label">{label}</div>
      {subtitle && <div className="impact-subtitle">{subtitle}</div>}
    </div>
  );
}
