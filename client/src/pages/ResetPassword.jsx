import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../hooks/useToast';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-glow" />
        <div className="auth-mascot animal-breathing">🐼</div>
        <h1 className="auth-brand">Planet<span>Points</span></h1>
        <div className="auth-card">
          <div className="auth-form">
            <p className="error-msg">Invalid reset link. Please request a new one.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters with at least 1 number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      toast('Password reset successfully! Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-mascot animal-breathing">🐼</div>
      <h1 className="auth-brand">Planet<span>Points</span></h1>
      <p className="auth-tagline">Set your new password</p>

      <div className="auth-card">
        <form onSubmit={handleSubmit} className="auth-form">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            showStrength
            required
            minLength={8}
          />
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={8}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="error-msg">Passwords do not match.</p>
          )}
          {error && <p className="error-msg">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <Link to="/login" className="form-link">Back to Login</Link>
        </form>
      </div>
    </div>
  );
}
