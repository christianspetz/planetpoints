import { useEffect, useState } from 'react';

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1,
      color: ['#2D6A4F', '#52B788', '#FFB703', '#9B5DE5', '#FF6B9D', '#FFD166'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size * 0.6,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function EvolutionCelebration({ animalName, animalEmoji, stageName, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(onClose, 400);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const handleShare = () => {
    const text = `My ${animalName} just evolved to ${stageName} on PlanetPoints! 🌍♻️ Every recycled item helps endangered animals grow.`;
    if (navigator.share) {
      navigator.share({ title: 'PlanetPoints Evolution!', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className={`evolution-overlay ${visible ? 'visible' : 'hiding'}`} onClick={() => setVisible(false)}>
      <Confetti />
      <div className="evolution-modal" onClick={(e) => e.stopPropagation()}>
        <div className="evolution-glow" />
        <div className="evolution-emoji">{animalEmoji}</div>
        <h2 className="evolution-title">Evolution!</h2>
        <p className="evolution-message">
          Your <strong>{animalName}</strong> evolved to <strong>{stageName}</strong>!
        </p>
        <div className="evolution-actions">
          <button className="btn btn-primary" onClick={handleShare}>
            Share
          </button>
          <button className="btn btn-secondary" onClick={() => setVisible(false)}>
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}
