import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../hooks/useToast';
import AnimalAvatar from './AnimalAvatar';

const STATUS_COLORS = {
  'Critically Endangered': '#E76F51',
  'Endangered': '#E76F51',
  'Vulnerable': '#FFB703',
  'Near Threatened': '#FFB703',
  'Least Concern': '#52B788',
};

export default function AnimalPurchaseModal({ animal, onClose }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  if (!animal) return null;

  const price = (animal.unlock_price_cents / 100).toFixed(2);
  const statusColor = STATUS_COLORS[animal.conservation_status] || '#8B95A5';

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/payments/unlock-animal', {
        method: 'POST',
        body: JSON.stringify({ animal_id: animal.id }),
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="purchase-overlay" onClick={onClose}>
      <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
        <button className="purchase-close" onClick={onClose} aria-label="Close">×</button>

        <AnimalAvatar
          emoji={animal.emoji}
          color={animal.color}
          stage={1}
          size={100}
          animate
        />

        <h2 className="purchase-name">{animal.name}</h2>
        <div className="purchase-species">{animal.species}</div>
        <div className="purchase-status" style={{ color: statusColor }}>
          {animal.conservation_status}
        </div>

        <p className="purchase-fact">{animal.fun_fact}</p>

        <button
          className="btn btn-primary btn-lg purchase-btn"
          onClick={handlePurchase}
          disabled={loading}
        >
          {loading ? 'Redirecting...' : `Unlock for $${price}`}
        </button>

        <button
          className="purchase-pass-link"
          onClick={() => { onClose(); navigate('/premium'); }}
        >
          Or get <strong>Planet Pass</strong> to unlock ALL animals
        </button>
      </div>
    </div>
  );
}
