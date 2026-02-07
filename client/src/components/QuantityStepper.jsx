export default function QuantityStepper({ value, onChange }) {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 999) {
      onChange(num);
    }
  };

  const decrement = () => onChange(Math.max(1, (value || 1) - 1));
  const increment = () => onChange(Math.min(999, (value || 0) + 1));

  return (
    <div className="quantity-stepper">
      <button type="button" className="stepper-btn" onClick={decrement}>-</button>
      <input
        type="number"
        min="1"
        max="999"
        value={value}
        onChange={handleChange}
        className="stepper-input"
      />
      <button type="button" className="stepper-btn" onClick={increment}>+</button>
    </div>
  );
}
