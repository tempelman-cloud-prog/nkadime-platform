import React, { useState, useRef, useEffect } from "react";
import { register } from "./api";
import styles from "./RegisterForm.module.css";
import PasswordInput from "./PasswordInput";
import TermsModal from "./TermsModal";
import { useSnackbar } from "./App";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Reusable FormField component for DRYness
const FormField: React.FC<{
  label?: string;
  id: string;
  children: React.ReactNode;
  error?: string;
}> = ({ label, id, children, error }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label htmlFor={id} className={styles.label}>{label}</label>}
    {children}
    {error && <div id={`${id}-error`} className={styles.errorMsg}>{error}</div>}
  </div>
);

const CheckboxRow: React.FC<{ agreed: boolean; setAgreed: (v: boolean) => void; onShowTerms: () => void }> = ({ agreed, setAgreed, onShowTerms }) => (
  <div className={styles.checkboxRow}>
    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} required style={{ marginRight: 8 }} />
    <span style={{ fontSize: 15 }}>I agree to the <button type="button" onClick={onShowTerms} className={styles.termsButton}>Terms</button></span>
  </div>
);

// Loading indicator component
const LoadingIndicator: React.FC = () => (
  <div className={styles.processing}>Processing...</div>
);

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { showMessage } = useSnackbar();

  const validate = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Enter a valid email address.';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (form.password !== confirmPassword) setConfirmError('Passwords do not match.');
    else setConfirmError(undefined);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !confirmError;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setConfirmError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.message) {
      showMessage("Registration successful!", "success");
      setShowLogin(true); // Show login form after successful registration
    } else {
      showMessage(result.error || "Registration failed", "error");
    }
  };

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  if (showLogin) {
    // Option 1: If you have a LoginForm component, render it here
    // return <LoginForm />;

    // Option 2: If you want to redirect to a login page, use window.location or a router
    window.location.href = '/login';
    return null;
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>Register</h2>
      <FormField id="name" error={errors.name}>
        <input
          ref={nameInputRef}
          id="name"
          name="name"
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className={styles.input}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
      </FormField>
      <FormField id="email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className={styles.input}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
      </FormField>
      <FormField id="password" error={errors.password}>
        <div style={{ position: 'relative' }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              outline: 'none',
              color: '#888',
              fontSize: 22
            }}
            tabIndex={0}
          >
            {showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
          </button>
        </div>
      </FormField>
      <FormField id="confirm-password" error={confirmError}>
        <PasswordInput
          value={confirmPassword}
          onChange={handleConfirmChange}
          error={confirmError}
          name="confirm-password"
          placeholder="Confirm Password"
          ariaInvalid={!!confirmError}
          ariaDescribedby={confirmError ? 'confirm-password-error' : undefined}
          showStrength={false}
        />
      </FormField>
      <FormField id="phone">
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
          className={styles.input}
          aria-label="Phone number"
          pattern="[+0-9 ]*"
        />
      </FormField>
      <CheckboxRow agreed={agreed} setAgreed={setAgreed} onShowTerms={() => setShowTerms(true)} />
      <button
        type="submit"
        disabled={!agreed || loading || !!confirmError}
        className={styles.submitButton}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
      {loading && <LoadingIndicator />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </form>
  );
};

export default RegisterForm;