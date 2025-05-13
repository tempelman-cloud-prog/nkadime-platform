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
    <form className="modern-card" onSubmit={handleSubmit} style={{
      maxWidth: 420,
      margin: '48px auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 800, marginBottom: 18 }}>Register</h2>
      <input
        name="name"
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        required
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <input
        name="phone"
        type="text"
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={handleChange}
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} required style={{ marginRight: 8 }} />
        <span style={{ fontSize: 15 }}>I agree to the <a href="#" onClick={e => { e.preventDefault(); setShowTerms(true); }} style={{ color: '#FF9800', textDecoration: 'underline' }}>Terms</a></span>
      </div>
      <button type="submit" disabled={!agreed} style={{
        background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '12px 30px',
        fontWeight: 700,
        fontSize: 19,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        cursor: !agreed ? 'not-allowed' : 'pointer',
        marginTop: 10,
        transition: 'background 0.2s, box-shadow 0.2s',
        letterSpacing: 0.5,
      }}>Register</button>
      <div style={{ minHeight: 24, color: message === 'Registration successful!' ? '#388E3C' : 'red', marginTop: 8, textAlign: 'center', fontSize: 15 }}>{message}</div>
      {/* Terms modal (optional) */}
      {showTerms && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 32, maxWidth: 420, boxShadow: '0 4px 24px #0003' }}>
            <h3 style={{ color: '#FF9800', fontWeight: 800, marginBottom: 16 }}>Terms & Conditions</h3>
            <ul style={{ fontSize: 15, color: '#444', marginBottom: 18 }}>
              <li>By registering, you agree to our platform's terms and privacy policy.</li>
              <li>Payments and transactions are handled securely via Orange Money or approved methods.</li>
              <li>All users must provide accurate information.</li>
            </ul>
            <button onClick={() => setShowTerms(false)} style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 700, fontSize: 16, marginTop: 8, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </form>
  );
};

export default RegisterForm;