import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import AnimalAvatar from '../components/AnimalAvatar';
import ProgressBar from '../components/ProgressBar';
import MaterialPicker from '../components/MaterialPicker';
import QuantityStepper from '../components/QuantityStepper';
import EvolutionCelebration from '../components/EvolutionCelebration';
import { MATERIAL_OPTIONS } from '../components/MaterialPicker';

const STAGE_POINTS = [0, 100, 500, 1500, 5000];
const STAGE_NAMES = ['Baby', 'Young', 'Adult', 'Elder', 'Ancient'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function buildWeekDays(historyData) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const match = historyData.find((h) => h.date === dateStr);
    days.push({
      date: dateStr,
      label: DAY_LABELS[d.getDay()],
      items: match ? parseInt(match.items) : 0,
      carbon: match ? parseFloat(match.carbon_saved) : 0,
    });
  }
  return days;
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [logLoading, setLogLoading] = useState(false);
  const [evolution, setEvolution] = useState(null);
  const [pointsAnim, setPointsAnim] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);

  const materialEmoji = {};
  MATERIAL_OPTIONS.forEach((m) => (materialEmoji[m.key] = m.emoji));

  const fetchData = useCallback(async () => {
    try {
      const [dashData, histData] = await Promise.all([
        apiFetch('/dashboard'),
        apiFetch('/impact/history?days=7'),
      ]);
      setData(dashData);
      setWeekData(buildWeekDays(histData.days || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLog = async () => {
    if (!material) { toast('Pick a material first.', 'error'); return; }
    setLogLoading(true);
    try {
      const result = await apiFetch('/log', {
        method: 'POST',
        body: JSON.stringify({ material_type: material, item_count: quantity }),
      });

      const pts = result.points_earned || 5;
      setPointsAnim(pts);
      setTimeout(() => setPointsAnim(null), 1200);

      const co2 = parseFloat(result.log.carbon_saved_kg).toFixed(3);
      toast(`Logged! ${co2} kg CO2 saved${result.points_earned ? ` + ${result.points_earned} companion pts` : ''}`);

      if (result.streak > 1) toast(`${result.streak}-day streak!`);
      if (result.new_badges?.length > 0) {
        result.new_badges.forEach((b) => toast(`Badge unlocked: ${b.emoji} ${b.name}!`));
      }
      if (result.evolution) setEvolution(result.evolution);

      setMaterial('');
      setQuantity(1);
      setSheetOpen(false);
      fetchData();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLogLoading(false);
    }
  };

  if (loading) return <div className="page loading">Loading...</div>;
  if (!data) return <div className="page">Failed to load dashboard.</div>;

  const isEmpty = data.total_items === 0;
  const animal = data.animal;
  const animalPoints = data.animal_points || 0;
  const currentStage = animal?.current_stage || 1;
  const nextStagePoints = animal?.next_stage_points || STAGE_POINTS[currentStage];
  const currentStageName = animal?.current_stage_name || STAGE_NAMES[currentStage - 1];
  const nextStageName = animal?.next_stage_name;
  const maxItems = Math.max(...weekData.map((d) => d.items), 1);

  return (
    <div className="page dashboard-v2">

      {/* ===== 1. Greeting Bar ===== */}
      <div className="dashboard-greeting">
        <h1 className="greeting-text">
          {getGreeting()}, {user?.display_name || 'friend'}!
        </h1>
        {data.streak_current > 0 && (
          <div className="greeting-streak">
            <span className="greeting-flame">🔥</span>
            <span className="greeting-streak-count">{data.streak_current}</span>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
          <p>Your recycling journey starts here!<br />Tap the + button to log your first item.</p>
          {!animal && (
            <Link to="/choose-animal" className="btn btn-secondary" style={{ marginTop: '12px' }}>
              Choose Your Companion
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ===== 2. Animal Hero ===== */}
          {animal ? (
            <div className="animal-hero">
              <AnimalAvatar
                emoji={animal.emoji}
                color={animal.color}
                stage={currentStage}
                size={120}
                animate
              />
              <div className="animal-hero-title">
                Your {currentStageName} {animal.name}
              </div>
              {nextStageName && nextStagePoints ? (
                <div className="animal-hero-progress">
                  <ProgressBar value={animalPoints} max={nextStagePoints} />
                  <div className="animal-hero-points">
                    {animalPoints} / {nextStagePoints} points to {nextStageName}
                  </div>
                </div>
              ) : (
                <div className="animal-hero-points" style={{ color: 'var(--premium)' }}>
                  Max level reached! 🌟
                </div>
              )}
            </div>
          ) : (
            <Link to="/choose-animal" className="card animal-cta-card">
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🐼</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                Choose Your Companion
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Pick an endangered animal to grow alongside your recycling journey!
              </div>
            </Link>
          )}

          {/* ===== 3. Impact Stats Row ===== */}
          <div className="impact-stats-row">
            <div className="stat-card">
              <div className="stat-card-icon">♻️</div>
              <div className="stat-card-value">{data.total_items}</div>
              <div className="stat-card-label">Items recycled</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🌍</div>
              <div className="stat-card-value">{data.total_carbon_saved.toFixed(1)}</div>
              <div className="stat-card-label">kg CO2 saved</div>
              {data.equivalents.trees >= 0.1 && (
                <div className="stat-card-sub">= {data.equivalents.trees} trees for a day</div>
              )}
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">{data.streak_current > 0 ? '🔥' : '💤'}</div>
              <div className="stat-card-value">{data.streak_current}</div>
              <div className="stat-card-label">Day streak</div>
              {data.streak_best > 0 && (
                <div className="stat-card-sub">Best: {data.streak_best}</div>
              )}
            </div>
          </div>

          {/* ===== 5. Weekly Chart ===== */}
          <div className="card weekly-chart-card">
            <h2 className="weekly-chart-title">This Week</h2>
            <div className="weekly-chart">
              {weekData.map((day, i) => (
                <div
                  key={day.date}
                  className={`chart-col ${selectedBar === i ? 'active' : ''}`}
                  onClick={() => setSelectedBar(selectedBar === i ? null : i)}
                >
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{ height: `${Math.max(4, (day.items / maxItems) * 100)}%` }}
                    />
                  </div>
                  <div className="chart-day-label">{day.label}</div>
                  {selectedBar === i && (
                    <div className="chart-tooltip">
                      <div>{day.items} items</div>
                      <div>{day.carbon.toFixed(2)} kg CO2</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ===== 6. Recent Activity Feed ===== */}
          {data.recent_logs.length > 0 && (
            <div className="card activity-card">
              <div className="activity-header">
                <h2>Recent Activity</h2>
                <Link to="/history" className="activity-see-all">See all</Link>
              </div>
              <div className="activity-feed">
                {data.recent_logs.map((log) => (
                  <div key={log.id} className="activity-item">
                    <span className="activity-emoji">{materialEmoji[log.material_type] || '♻️'}</span>
                    <div className="activity-info">
                      <span className="activity-name">
                        {log.item_count}x {log.material_type}
                      </span>
                      <span className="activity-time">{timeAgo(log.logged_at)}</span>
                    </div>
                    <span className="activity-points">+{parseFloat(log.carbon_saved_kg).toFixed(2)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== 4. Floating Action Button ===== */}
      <button className="fab" onClick={() => setSheetOpen(true)} aria-label="Log Recycling">
        <span className="fab-icon">+</span>
        <span className="fab-label">Log</span>
      </button>

      {/* Points float animation */}
      {pointsAnim && (
        <div className="points-float">+{pointsAnim} pts</div>
      )}

      {/* ===== Bottom Sheet ===== */}
      {sheetOpen && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setSheetOpen(false)} />
          <div className="bottom-sheet">
            <div className="bottom-sheet-handle" />
            <h3 className="sheet-title">Log Recycling</h3>
            <MaterialPicker selected={material} onSelect={setMaterial} />
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <button
              className="btn btn-primary btn-log"
              disabled={logLoading || !material}
              onClick={handleLog}
            >
              {logLoading ? 'Logging...' : `Log ${quantity} item${quantity !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {/* Evolution celebration */}
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
