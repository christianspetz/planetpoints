import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

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

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      apiFetch(`/payments/session/${sessionId}`)
        .then(setSession)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const isAnimal = session?.type === 'animal_unlock';
  const isPlanetPass = session?.type === 'planet_pass';
  const animal = session?.animal;

  return (
    <div className="page payment-result-page">
      <Confetti />
      <div className="payment-result-card">
        <div className="payment-result-emoji">
          {loading ? '...' : isAnimal && animal ? animal.emoji : isPlanetPass ? '🌟' : '🎉'}
        </div>
        <h1 className="payment-result-title">
          {loading
            ? 'Verifying...'
            : isAnimal && animal
              ? `You Unlocked ${animal.name}!`
              : isPlanetPass
                ? 'Welcome to Planet Pass!'
                : 'Payment Successful!'}
        </h1>
        <p className="payment-result-message">
          {loading
            ? 'Checking your payment...'
            : isAnimal && animal
              ? `${animal.name} is now part of your collection. Start recycling to help them grow!`
              : isPlanetPass
                ? 'All premium animals are now yours. Thank you for supporting conservation!'
                : 'Your purchase has been processed successfully.'}
        </p>
        <div className="payment-result-actions">
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          <Link to="/collection" className="btn btn-secondary">View Collection</Link>
        </div>
      </div>
    </div>
  );
}
