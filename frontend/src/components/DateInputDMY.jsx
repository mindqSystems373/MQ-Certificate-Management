import { useState, useEffect } from 'react';

function isoToDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}-${m}-${y}`;
}

function displayToIso(display) {
  const match = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return '';
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

// Legacy system's date fields are plain text inputs formatted DD-MM-YYYY, not
// the browser-locale-dependent native <input type="date">. This masks keystrokes
// into that shape and only calls onChange (with an ISO yyyy-mm-dd string, what
// the API expects) once the value is a complete, valid date.
export default function DateInputDMY({ value, onChange, placeholder = 'DD-MM-YYYY' }) {
  const [display, setDisplay] = useState(isoToDisplay(value));

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let masked = digits;
    if (digits.length > 4) masked = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    setDisplay(masked);

    const iso = displayToIso(masked);
    onChange(iso);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className="input"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      maxLength={10}
    />
  );
}
