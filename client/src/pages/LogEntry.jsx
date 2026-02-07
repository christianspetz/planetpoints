import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../hooks/useToast';
import MaterialPicker from '../components/MaterialPicker';
import QuantityStepper from '../components/QuantityStepper';
import EvolutionCelebration from '../components/EvolutionCelebration';

export default function LogEntry() {
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [evolution, setEvolution] = useState(null);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!material) {
      toast('Pick a material from the list.', 'error');
      return;
    }
    if (!quantity || quantity < 1) {
      toast('Oops! Log at least 1 item.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/log', {
        method: 'POST',
        body: JSON.stringify({ material_type: material, item_count: quantity }),
      });

      const co2 = parseFloat(data.log.carbon_saved_kg).toFixed(3);
      const kmSaved = (parseFloat(data.log.carbon_saved_kg) * 5.5).toFixed(1);

      if (data.points_earned) {
        toast(`Logged! ${co2} kg CO2 saved + ${data.points_earned} companion points!`);
      } else {
        toast(`Logged! You just saved ${co2} kg of CO2 — that's like keeping a car parked for ${kmSaved} km!`);
      }

      if (data.streak > 1) {
        toast(`${data.streak}-day streak! Keep it going!`);
      }

      if (data.new_badges && data.new_badges.length > 0) {
        data.new_badges.forEach((b) => {
          toast(`New badge unlocked: ${b.emoji} ${b.name}!`);
        });
      }

      // Check for evolution
      if (data.evolution) {
        setEvolution(data.evolution);
      }

      setMaterial('');
      setQuantity(1);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page log-entry">
      <h1>Log Your Recycling</h1>
      <form onSubmit={handleSubmit}>
        <label className="form-label">What did you recycle?</label>
        <MaterialPicker selected={material} onSelect={setMaterial} />

        <label className="form-label">How many?</label>
        <QuantityStepper value={quantity} onChange={setQuantity} />

        <button type="submit" className="btn btn-primary btn-log" disabled={loading || !material}>
          {loading ? 'Logging...' : 'Log It!'}
        </button>
      </form>

      {evolution && (
        <EvolutionCelebration
          animalName={evolution.animal_name}
          animalEmoji={evolution.animal_emoji}
          stageName={evolution.stage_name}
          onClose={() => setEvolution(null)}
        />
      )}
    </div>
  );
}
