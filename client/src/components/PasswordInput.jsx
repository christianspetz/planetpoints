import { useState } from 'react';

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#E76F51' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#FFB703' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#52B788' };
  return { score: 4, label: 'Strong', color: '#2D6A4F' };
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  showStrength = false,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? getStrength(value) : null;

  return (
    <div className="password-input-wrapper">
      <div className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input"
          {...props}
        />
        <button
          type="button"
          className="toggle-password"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      {showStrength && value && (
        <div className="strength-meter">
          <div className="strength-bars">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="strength-bar"
                style={{
                  backgroundColor: strength.score >= level ? strength.color : '#e5e7eb',
                }}
              />
            ))}
          </div>
          <span className="strength-label" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
