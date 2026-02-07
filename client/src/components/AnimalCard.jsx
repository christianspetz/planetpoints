import { useState } from 'react';

const STATUS_COLORS = {
  'Critically Endangered': '#E76F51',
  'Endangered': '#E76F51',
  'Vulnerable': '#FFB703',
  'Near Threatened': '#FFB703',
  'Least Concern': '#52B788',
};

export default function AnimalCard({ animal, isUnlocked, isSelected, onSelect, currentStage }) {
  const [showFact, setShowFact] = useState(false);
  const locked = animal.is_premium && !isUnlocked;
  const statusColor = STATUS_COLORS[animal.conservation_status] || '#8B95A5';

  return (
    <div
      className={`animal-card ${locked ? 'locked' : ''} ${isSelected ? 'selected' : ''} ${isUnlocked ? 'owned' : ''}`}
      onClick={() => !locked && onSelect?.(animal)}
      onMouseEnter={() => setShowFact(true)}
      onMouseLeave={() => setShowFact(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !locked && onSelect?.(animal)}
    >
      <div className="animal-card-avatar" style={{ background: `${animal.color}12` }}>
        <span className="animal-card-emoji" style={{ filter: locked ? 'grayscale(0.8)' : 'none' }}>
          {animal.emoji}
        </span>
        {locked && <div className="animal-lock-icon">🔒</div>}
        {isSelected && <div className="animal-selected-badge">✓</div>}
      </div>
      <div className="animal-card-name">{animal.name}</div>
      <div className="animal-card-status" style={{ color: statusColor }}>
        {animal.conservation_status}
      </div>
      {locked && animal.unlock_price_cents && (
        <div className="animal-card-price">
          ${(animal.unlock_price_cents / 100).toFixed(2)}
        </div>
      )}
      {isUnlocked && currentStage && (
        <div className="animal-card-stage">
          Stage {currentStage}/5
        </div>
      )}
      {showFact && !locked && (
        <div className="animal-card-tooltip">
          {animal.fun_fact}
        </div>
      )}
    </div>
  );
}
