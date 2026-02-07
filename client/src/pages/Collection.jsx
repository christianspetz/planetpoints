import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import AnimalAvatar from '../components/AnimalAvatar';
import ProgressBar from '../components/ProgressBar';
import AnimalPurchaseModal from '../components/AnimalPurchaseModal';

const STAGE_POINTS = [0, 100, 500, 1500, 5000];
const STAGE_NAMES = ['Baby', 'Young', 'Adult', 'Elder', 'Ancient'];

export default function Collection() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [animalPoints, setAnimalPoints] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [stagesCache, setStagesCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchaseAnimal, setPurchaseAnimal] = useState(null);
  const toast = useToast();

  useEffect(() => {
    apiFetch('/animals')
      .then((data) => {
        setAnimals(data.animals);
        setSelectedAnimalId(data.selected_animal_id);
        setAnimalPoints(data.animal_points);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExpand = async (animal) => {
    const isLocked = animal.is_premium && !animal.is_unlocked && !user?.is_premium;
    if (isLocked) {
      setPurchaseAnimal(animal);
      return;
    }

    if (expandedId === animal.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(animal.id);
    if (!stagesCache[animal.id]) {
      try {
        const data = await apiFetch(`/animals/${animal.id}/stages`);
        setStagesCache((prev) => ({ ...prev, [animal.id]: data.stages }));
      } catch {
        // silently fail
      }
    }
  };

  const handleSelect = async (animal) => {
    try {
      await apiFetch('/animals/select', {
        method: 'POST',
        body: JSON.stringify({ animal_id: animal.id }),
      });
      setSelectedAnimalId(animal.id);
      toast(`${animal.name} is now your active companion!`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <div className="page loading">Loading...</div>;

  const ownedCount = animals.filter((a) => a.is_unlocked).length;

  return (
    <div className="page collection-page">
      <h1>My Collection</h1>
      <p className="collection-count">{ownedCount} of {animals.length} companions discovered</p>

      <div className="collection-grid">
        {animals.map((animal) => {
          const isOwned = animal.is_unlocked || (user?.is_premium && animal.is_premium);
          const isLocked = animal.is_premium && !isOwned;
          const isExpanded = expandedId === animal.id;
          const isActive = selectedAnimalId === animal.id;
          const stages = stagesCache[animal.id];
          const currentStage = animal.current_stage || (isOwned ? 1 : 0);

          return (
            <div key={animal.id} className={`collection-card ${isLocked ? 'locked' : ''} ${isActive ? 'active' : ''}`}>
              <div className="collection-card-top" onClick={() => handleExpand(animal)}>
                <div className="collection-avatar-wrap">
                  {isLocked ? (
                    <div className="collection-locked-avatar" style={{ background: `${animal.color}10` }}>
                      <span style={{ fontSize: '2rem', filter: 'grayscale(0.8)', opacity: 0.5 }}>{animal.emoji}</span>
                      <span className="lock-overlay">🔒</span>
                    </div>
                  ) : (
                    <AnimalAvatar
                      emoji={animal.emoji}
                      color={animal.color}
                      stage={currentStage}
                      size={64}
                    />
                  )}
                </div>
                <div className="collection-info">
                  <div className="collection-name">
                    {animal.name}
                    {isActive && <span className="active-badge">Active</span>}
                  </div>
                  <div className="collection-status" style={{ color: animal.conservation_status.includes('Endangered') ? 'var(--error)' : animal.conservation_status === 'Vulnerable' ? 'var(--accent)' : 'var(--secondary)' }}>
                    {animal.conservation_status}
                  </div>
                  {isOwned && (
                    <div className="collection-stage-info">
                      {STAGE_NAMES[currentStage - 1] || 'Baby'} (Stage {currentStage}/5)
                    </div>
                  )}
                  {isLocked && animal.unlock_price_cents && (
                    <div className="collection-price">${(animal.unlock_price_cents / 100).toFixed(2)}</div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="collection-expanded">
                  <div className="collection-fact">
                    <strong>Fun fact:</strong> {animal.fun_fact}
                  </div>

                  <div className="collection-stages">
                    {STAGE_NAMES.map((name, i) => {
                      const stageNum = i + 1;
                      const isReached = isOwned && currentStage >= stageNum;
                      const pts = STAGE_POINTS[i];
                      return (
                        <div key={stageNum} className={`stage-item ${isReached ? 'reached' : 'locked'}`}>
                          <div className="stage-icon" style={{
                            background: isReached ? `${animal.color}20` : 'var(--border-light)',
                            borderColor: isReached ? animal.color : 'var(--border)',
                          }}>
                            {isReached ? animal.emoji : '?'}
                          </div>
                          <div className="stage-label">{name}</div>
                          <div className="stage-pts">{pts} pts</div>
                        </div>
                      );
                    })}
                  </div>

                  {isOwned && currentStage < 5 && (
                    <div className="collection-progress">
                      <ProgressBar value={animalPoints} max={STAGE_POINTS[currentStage]} />
                      <div className="collection-progress-text">
                        {STAGE_POINTS[currentStage] - animalPoints} points to {STAGE_NAMES[currentStage]}
                      </div>
                    </div>
                  )}

                  {isOwned && !isActive && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleSelect(animal)}>
                      Set as Active
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
