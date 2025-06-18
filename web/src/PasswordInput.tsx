import React, { useState } from "react";
import styles from "./RegisterForm.module.css";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  showStrength?: boolean;
  name?: string;
  required?: boolean;
  placeholder?: string;
  ariaInvalid?: boolean;
  ariaDescribedby?: string;
}

function getPasswordStrength(password: string) {
  if (!password) return { label: '', color: '' };
  if (password.length < 6) return { label: 'Too short', color: 'red' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: 'Weak', color: '#e53935' };
  if (score === 2) return { label: 'Fair', color: '#fbc02d' };
  if (score === 3) return { label: 'Good', color: '#43a047' };
  return { label: 'Strong', color: '#1976d2' };
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  error,
  showStrength = true,
  name = "password",
  required = true,
  placeholder = "Password",
  ariaInvalid,
  ariaDescribedby
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(value);

  return (
    <div style={{ position: 'relative' }}>
      <input
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={styles.input}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className={styles.passwordToggle}
        tabIndex={0}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? 'Hide' : 'Show'}
      </button>
      {error && <div id="password-error" className={styles.errorMsg} style={{ marginTop: 2 }}>{error}</div>}
      {showStrength && value && !error && (
        <div className={styles.passwordStrength} style={{ color: strength.color }}>
          Password strength: {strength.label}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
export {}
