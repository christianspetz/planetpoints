import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import AnimalAvatar from '../components/AnimalAvatar';

export default function Profile() {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [animal, setAnimal] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/profile'),
      apiFetch('/animals/my-collection').catch(() => ({ collection: [], selected_animal_id: null })),
    ])
      .then(([profileData, animalData]) => {
        setProfile(profileData);
        setDisplayName(profileData.display_name);
        if (animalData.selected_animal_id) {
          const active = animalData.collection.find((a) => a.id === animalData.selected_animal_id);
          if (active) setAnimal(active);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await apiFetch('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: displayName }),
      });
      setProfile(data);
      updateUser({ display_name: data.display_name });
      setEditing(false);
      toast('Profile updated!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const data = await apiFetch('/payments/portal', { method: 'POST' });
      window.location.href = data.portal_url;
    } catch (err) {
      toast(err.message, 'error');
      setPortalLoading(false);
    }
  };

  if (loading) return <div className="page loading">Loading...</div>;
  if (!profile) return <div className="page">Failed to load profile.</div>;

  const isPremium = profile.is_premium;

  return (
    <div className="page profile-page">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          {animal ? (
            <AnimalAvatar
              emoji={animal.emoji}
              color={animal.color}
              stage={animal.current_stage || 1}
              size={72}
            />
          ) : (
            <div className="avatar-frame level-1">🌱</div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {profile.display_name}
              {isPremium && <span className="pro-badge">PRO</span>}
            </div>
            {animal && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Companion: {animal.emoji} {animal.name}
              </div>
            )}
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="profile-field">
          <label>Display Name</label>
          {editing ? (
            <div className="edit-row">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
                maxLength={50}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setDisplayName(profile.display_name); }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-row">
              <span>{profile.display_name}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            </div>
          )}
        </div>
        <div className="profile-field">
          <label>Email</label>
          <span>{profile.email}</span>
        </div>
        {/* Plan section */}
        <div className="profile-field">
          <label>Your Plan</label>
          {isPremium ? (
            <div className="plan-info">
              <div className="plan-badge plan-premium">
                <span>🌟</span> Planet Pass
                {profile.subscription_status === 'active' && <span className="plan-status-dot active" />}
              </div>
              <button
                className="btn btn-premium btn-sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                style={{ marginTop: '8px' }}
              >
                {portalLoading ? 'Opening...' : 'Manage Subscription'}
              </button>
            </div>
          ) : (
            <div className="plan-info">
              <div className="plan-badge plan-free">Free Plan</div>
              <Link to="/premium" className="btn btn-premium btn-sm" style={{ marginTop: '8px' }}>
                Upgrade to Planet Pass
              </Link>
            </div>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat">
            <div className="stat-value">{profile.streak_current}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stat">
            <div className="stat-value">{profile.streak_best}</div>
            <div className="stat-label">Best Streak</div>
          </div>
          <div className="stat">
            <div className="stat-value">{parseFloat(profile.total_carbon_saved).toFixed(1)}</div>
            <div className="stat-label">kg CO2 Saved</div>
          </div>
          <div className="stat">
            <div className="stat-value">{parseFloat(profile.total_water_saved).toFixed(1)}</div>
            <div className="stat-label">L Water Saved</div>
          </div>
        </div>
      </div>
    </div>
  );
}
