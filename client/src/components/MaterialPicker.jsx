const MATERIAL_OPTIONS = [
  { key: 'aluminum', emoji: '🥫', label: 'Aluminum Can' },
  { key: 'plastic', emoji: '🧴', label: 'Plastic Bottle' },
  { key: 'glass', emoji: '🍾', label: 'Glass Bottle' },
  { key: 'paper', emoji: '📰', label: 'Paper' },
  { key: 'steel', emoji: '🥫', label: 'Steel/Tin Can' },
  { key: 'cardboard', emoji: '📦', label: 'Cardboard Box' },
];

export default function MaterialPicker({ selected, onSelect }) {
  return (
    <div className="material-grid">
      {MATERIAL_OPTIONS.map((m) => (
        <button
          key={m.key}
          type="button"
          className={`material-btn ${selected === m.key ? 'selected' : ''}`}
          onClick={() => onSelect(m.key)}
        >
          <span className="material-emoji">{m.emoji}</span>
          <span className="material-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

export { MATERIAL_OPTIONS };
