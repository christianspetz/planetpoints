import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isPremium = user?.is_premium;

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/log', label: 'Log It!' },
    { to: '/collection', label: 'Animals' },
    { to: '/history', label: 'History' },
    { to: '/badges', label: 'Badges' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/premium', label: isPremium ? 'PRO' : 'Premium', className: isPremium ? 'nav-pro' : 'nav-premium' },
    { to: '/profile', label: 'Profile' },
  ];

  const handleNav = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-top">
        <Link to="/dashboard" className="nav-brand">PlanetPoints</Link>
        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>
      <div className={`nav-links ${menuOpen ? 'show' : ''}`}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${location.pathname === l.to ? 'active' : ''} ${l.className || ''}`}
            onClick={handleNav}
          >
            {l.label}
          </Link>
        ))}
        <button onClick={() => { logout(); handleNav(); }} className="nav-link btn-logout">Logout</button>
      </div>
    </nav>
  );
}
