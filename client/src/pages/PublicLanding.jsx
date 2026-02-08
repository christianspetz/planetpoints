import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ANIMALS = [
  { emoji: '🐼', name: 'Giant Panda', color: '#1B1B1B', status: 'Vulnerable', fact: 'Giant pandas spend 10-16 hours a day eating bamboo and can consume up to 38 kg daily.', premium: false },
  { emoji: '🦥', name: 'Sloth', color: '#8B6914', status: 'Least Concern', fact: 'Sloths are so slow that algae grows on their fur, giving them a greenish tint for camouflage.', premium: false },
  { emoji: '🐧', name: 'Emperor Penguin', color: '#2D6A4F', status: 'Near Threatened', fact: 'Emperor penguins can dive over 500 meters deep and hold their breath for more than 20 minutes.', premium: false },
  { emoji: '🐢', name: 'Sea Turtle', color: '#40916C', status: 'Endangered', fact: 'Sea turtles use the Earth\'s magnetic field to navigate thousands of miles across the ocean.', premium: false },
  { emoji: '🐨', name: 'Koala', color: '#74C69D', status: 'Vulnerable', fact: 'Koalas sleep up to 22 hours a day and have fingerprints nearly identical to humans.', premium: false },
  { emoji: '🐺', name: 'Arctic Wolf', color: '#B7C9E2', status: 'Least Concern', fact: 'Arctic wolves can survive in temperatures as low as -53\u00b0C and go weeks without food.', premium: false },
  { emoji: '🐆', name: 'Snow Leopard', color: '#9B5DE5', status: 'Vulnerable', fact: 'Snow leopards can leap up to 15 meters in a single bound.', premium: true },
  { emoji: '🦄', name: 'Narwhal', color: '#5B8DEF', status: 'Near Threatened', fact: 'A narwhal\'s tusk is actually a long spiral tooth that can grow up to 3 meters.', premium: true },
  { emoji: '🐅', name: 'Tiger', color: '#E76F51', status: 'Endangered', fact: 'Every tiger has a unique pattern of stripes, like human fingerprints.', premium: true },
  { emoji: '🦁', name: 'Lion', color: '#FFB703', status: 'Vulnerable', fact: 'A lion\'s roar can be heard from 8 km away.', premium: true },
  { emoji: '🦏', name: 'Rhinoceros', color: '#6B7280', status: 'Critically Endangered', fact: 'Rhinos can run up to 55 km/h and have existed for over 50 million years.', premium: true },
  { emoji: '🦅', name: 'Bald Eagle', color: '#8B4513', status: 'Least Concern', fact: 'Bald eagles can see fish from over a mile away and dive at 160 km/h.', premium: true },
  { emoji: '🦭', name: 'Sea Lion', color: '#52B788', status: 'Least Concern', fact: 'Sea lions can rotate their hind flippers forward and walk on all fours.', premium: true },
  { emoji: '🐘', name: 'Elephant', color: '#4A5568', status: 'Endangered', fact: 'Elephants can recognize themselves in mirrors and mourn their dead.', premium: true },
  { emoji: '🦊', name: 'Red Fox', color: '#D35400', status: 'Least Concern', fact: 'Red foxes use Earth\'s magnetic field to hunt, pouncing northeast for accuracy.', premium: true },
  { emoji: '🦋', name: 'Monarch Butterfly', color: '#FF6B9D', status: 'Endangered', fact: 'Monarchs travel up to 4,800 km during migration and can taste with their feet.', premium: true },
];

const STAGE_NAMES = ['Baby', 'Young', 'Adult', 'Elder', 'Ancient'];

const DEMO_ANIMALS = ANIMALS.slice(0, 6);
const DEMO_MATERIALS = [
  { key: 'aluminum', emoji: '🥫', label: 'Aluminum' },
  { key: 'plastic', emoji: '🧴', label: 'Plastic' },
  { key: 'cardboard', emoji: '📦', label: 'Cardboard' },
];

const SHOWCASE_ANIMALS = [...ANIMALS.slice(0, 6), ANIMALS[6], ANIMALS[8]];

const SATELLITES = [1, 2, 3, 4, 5, 10];

function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [evoStage, setEvoStage] = useState(0);

  useEffect(() => {
    if (step !== 2) return;
    setEvoStage(0);
    const interval = setInterval(() => {
      setEvoStage((s) => (s + 1) % 5);
    }, 1500);
    return () => clearInterval(interval);
  }, [step]);

  const handlePickAnimal = (i) => {
    setSelectedAnimal(i);
    setTimeout(() => setStep(1), 600);
  };

  const handlePickMaterial = (key) => {
    setSelectedMaterial(key);
    setTimeout(() => setStep(2), 600);
  };

  const evoSizes = [56, 64, 76, 88, 100];
  const evoBorders = ['#E8EDE4', '#52B788', '#52B788', '#FFB703', '#9B5DE5'];
  const evoGlows = [
    'none',
    '0 0 12px rgba(82,183,136,0.25)',
    '0 0 20px rgba(82,183,136,0.3)',
    '0 0 24px rgba(255,183,3,0.35)',
    '0 0 32px rgba(155,93,229,0.4)',
  ];

  return (
    <section className="pub-section pub-demo">
      <h2 className="pub-section-title">See How It Works</h2>

      <div className="demo-tabs">
        {['Pick', 'Log', 'Grow'].map((label, i) => (
          <button
            key={i}
            className={`demo-tab ${step === i ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            onClick={() => setStep(i)}
          >
            <span className="demo-tab-num">{i + 1}</span>
            <span className="demo-tab-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="demo-stage">
        {step === 0 && (
          <div className="demo-pick">
            <p className="demo-instruction">Tap an animal to choose your companion</p>
            <div className="demo-animal-grid">
              {DEMO_ANIMALS.map((a, i) => (
                <button
                  key={i}
                  className={`demo-animal-btn ${selectedAnimal === i ? 'selected' : ''}`}
                  onClick={() => handlePickAnimal(i)}
                >
                  <span className="demo-animal-emoji">{a.emoji}</span>
                  <span className="demo-animal-name">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="demo-log">
            <p className="demo-instruction">What did you recycle today?</p>
            <div className="demo-material-row">
              {DEMO_MATERIALS.map((m) => (
                <button
                  key={m.key}
                  className={`demo-material-btn ${selectedMaterial === m.key ? 'selected' : ''}`}
                  onClick={() => handlePickMaterial(m.key)}
                >
                  <span className="demo-material-emoji">{m.emoji}</span>
                  <span className="demo-material-label">{m.label}</span>
                </button>
              ))}
            </div>
            {selectedAnimal !== null && (
              <div className="demo-log-companion">
                <span>{DEMO_ANIMALS[selectedAnimal].emoji}</span>
                <span className="demo-log-waiting">Waiting for recycling...</span>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="demo-grow">
            <div className="demo-evolution">
              <div
                className="demo-evo-circle animal-breathing"
                style={{
                  width: evoSizes[evoStage],
                  height: evoSizes[evoStage],
                  borderColor: evoBorders[evoStage],
                  boxShadow: evoGlows[evoStage],
                  fontSize: `${evoSizes[evoStage] * 0.5}px`,
                }}
              >
                {selectedAnimal !== null ? DEMO_ANIMALS[selectedAnimal].emoji : '🐼'}
              </div>
              <div className="demo-evo-label">{STAGE_NAMES[evoStage]}</div>
              <div className="demo-evo-track">
                {STAGE_NAMES.map((_, i) => (
                  <div key={i} className={`demo-evo-pip ${i <= evoStage ? 'filled' : ''} ${i === evoStage ? 'current' : ''}`} />
                ))}
              </div>
            </div>
            <p className="demo-grow-text">
              Every item you recycle earns points. Your companion evolves through 5 stages!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function PublicLanding() {
  return (
    <div className="pub-landing">
      {/* Navbar */}
      <nav className="pub-nav">
        <span className="pub-nav-brand">PlanetPoints</span>
        <Link to="/login?tab=signup" className="btn btn-primary btn-sm">Get Started</Link>
      </nav>

      {/* Hero */}
      <section className="pub-hero">
        <div className="hero-glow" />
        <div className="hero-animals">
          <div className="hero-animal-featured animal-breathing">🐼</div>
          {SATELLITES.map((idx, i) => (
            <div
              key={i}
              className="hero-animal-satellite"
              style={{ '--sat-delay': `${i * 0.4}s` }}
            >
              {ANIMALS[idx].emoji}
            </div>
          ))}
        </div>
        <h1 className="hero-headline">
          Recycle. Grow. <span className="hero-accent">Protect.</span>
        </h1>
        <p className="hero-subtitle">
          Track your recycling and raise an endangered animal companion through 5 stages of evolution.
        </p>
        <Link to="/login?tab=signup" className="btn btn-primary btn-lg hero-cta">
          Choose Your Animal — It's Free
        </Link>
      </section>

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Meet the Animals */}
      <section className="pub-section pub-animals">
        <h2 className="pub-section-title">Meet the Animals</h2>
        <p className="pub-section-subtitle">16 real endangered species. Each one grows as you recycle.</p>
        <div className="animals-showcase-grid">
          {SHOWCASE_ANIMALS.map((a, i) => (
            <div key={i} className={`animal-tile ${a.premium ? 'premium' : ''}`}>
              <div className="animal-tile-emoji" style={{ background: `${a.color}12` }}>
                {a.emoji}
                {a.premium && <span className="animal-tile-badge">Premium</span>}
              </div>
              <div className="animal-tile-name">{a.name}</div>
              <div
                className="animal-tile-status"
                style={{
                  color: a.status.includes('Endangered') ? '#E76F51'
                    : a.status === 'Vulnerable' ? '#FFB703'
                    : '#52B788',
                }}
              >
                {a.status}
              </div>
              <div className="animal-tile-fact">{a.fact}</div>
            </div>
          ))}
        </div>
        <p className="animals-more">+ 8 more species to discover when you sign up</p>
      </section>

      {/* CTA Banner */}
      <section className="pub-cta-banner">
        <div className="cta-banner-inner">
          <div className="cta-banner-animals">
            {['🐼', '🐧', '🐢'].map((e, i) => (
              <span key={i} className="cta-banner-emoji" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
            ))}
          </div>
          <h2>Your companion is waiting.</h2>
          <p>Join PlanetPoints and turn your recycling into something extraordinary.</p>
          <Link to="/login?tab=signup" className="btn btn-primary btn-lg cta-banner-btn">
            Start Your Journey — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="pub-footer">
        <div className="pub-footer-brand">Made with 🌱 for the planet</div>
      </footer>
    </div>
  );
}
