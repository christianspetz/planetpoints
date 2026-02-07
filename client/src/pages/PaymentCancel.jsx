import { Link } from 'react-router-dom';

export default function PaymentCancel() {
  return (
    <div className="page payment-result-page">
      <div className="payment-result-card">
        <div className="payment-result-emoji">🐾</div>
        <h1 className="payment-result-title">No Worries!</h1>
        <p className="payment-result-message">
          Your animals will be waiting whenever you're ready.
          <br />
          You can always come back and unlock them later.
        </p>
        <div className="payment-result-actions">
          <Link to="/collection" className="btn btn-primary">Back to Collection</Link>
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
