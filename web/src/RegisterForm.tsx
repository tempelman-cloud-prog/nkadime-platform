import React, { useState } from "react";
import { register } from "./api";

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register(form);
    if (result.message) {
      setMessage("Registration successful!");
      setShowLogin(true); // Show login form after successful registration
    } else {
      setMessage(result.error || "Registration failed");
    }
  };

  if (showLogin) {
    // Option 1: If you have a LoginForm component, render it here
    // return <LoginForm />;

    // Option 2: If you want to redirect to a login page, use window.location or a router
    window.location.href = '/login';
    return null;
  }

  return (
    <form className="modern-card" onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input
        name="name"
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <input
        name="phone"
        type="text"
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={handleChange}
      />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, marginTop: 4, width: '100%' }}>
        <input
          type="checkbox"
          id="terms"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="terms" style={{ fontSize: '0.97em', color: '#7B7F9E', cursor: 'pointer' }}>
          I agree to the <button type="button" style={{ color: '#FF9800', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '1em', padding: 0 }} onClick={() => setShowTerms(v => !v)}>{showTerms ? 'Hide Terms' : 'Show Terms'}</button>
        </label>
      </div>
      {showTerms && (
        <div style={{ background: '#f7f7f7', borderRadius: 8, padding: '1em', marginBottom: 12, color: '#22223B', fontSize: '0.97em', maxHeight: 180, overflowY: 'auto' }}>
          <b>Terms of Service</b>
          <ul style={{ margin: '0.5em 0 0 1.2em', padding: 0 }}>
            <li>You agree to provide accurate information when registering and using the platform.</li>
            <li>All equipment listed must be legal, safe, and owned or authorized for rental by you.</li>
            <li>Payments and transactions are handled securely via Orange Money or approved methods.</li>
            <li>Nkadime is not responsible for loss, theft, or damage to equipment during rentals.</li>
            <li>Disputes will be handled according to our dispute resolution policy.</li>
            <li>By registering, you agree to receive transactional emails and notifications.</li>
            <li>Contact us for more terms of service.</li>
          </ul>
        </div>
      )}
      <button
        type="submit"
        disabled={!agreed}
        style={{
          background: agreed ? '#FF9800' : '#e0e0e0',
          color: agreed ? '#fff' : '#aaa',
          cursor: agreed ? 'pointer' : 'not-allowed',
          fontWeight: 700,
        }}
      >
        Register
      </button>
      <div>{message}</div>
    </form>
  );
};

export default RegisterForm;