import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import AnimalCard from '../components/AnimalCard';
import AnimalPurchaseModal from '../components/AnimalPurchaseModal';

export default function AnimalSelect() {
  const [animals, setAnimals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchaseAnimal, setPurchaseAnimal] = useState(null);
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    apiFetch('/animals')
      .then((data) => {
        setAnimals(data.animals);
        if (data.selected_animal_id) {
          setSelected(data.selected_animal_id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (animal) => {
    if (animal.is_premium && !animal.is_unlocked) {
      setPurchaseAnimal(animal);
      return;
    }
    setSelected(animal.id);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiFetch('/animals/select', {
        method: 'POST',
        body: JSON.stringify({ animal_id: selected }),
      });
      const animal = animals.find((a) => a.id === selected);
      updateUser({ selected_animal_id: selected });
      toast(`${animal.name} is now your companion! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page loading">Loading...</div>;

  const freeAnimals = animals.filter((a) => !a.is_premium);
  const premiumAnimals = animals.filter((a) => a.is_premium);

  return (
    <div className="page animal-select-page">
      <div className="animal-select-header">
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🌍</div>
        <h1>Choose Your Companion</h1>
        <p className="animal-select-subtitle">
          Pick an endangered animal to grow alongside your recycling journey. The more you recycle, the more they evolve!
        </p>
      </div>

      <h2>Free Companions</h2>
      <div className="animal-grid">
        {freeAnimals.map((animal) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            isUnlocked={true}
            isSelected={selected === animal.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <h2 style={{ marginTop: '32px' }}>Premium Companions</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Tap an animal to unlock it, or get Planet Pass for all of them.
      </p>
      <div className="animal-grid">
        {premiumAnimals.map((animal) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            isUnlocked={animal.is_unlocked}
            isSelected={selected === animal.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="animal-select-footer">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleConfirm}
          disabled={!selected || saving}
        >
          {saving ? 'Saving...' : selected ? 'Start Your Journey!' : 'Select a Companion'}
        </button>
      </div>

      {purchaseAnimal && (
        <AnimalPurchaseModal
          animal={purchaseAnimal}
          onClose={() => setPurchaseAnimal(null)}
        />
      )}
    </div>
  );
}
