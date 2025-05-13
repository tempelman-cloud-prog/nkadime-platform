import React, { useState } from "react";
import { login } from "./api";

interface LoginFormProps {
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const result = await login(email, password);
    setLoading(false);
    if (result.token) {
      localStorage.setItem("token", result.token);
      setMessage("Login successful!");
      setSuccess(true);
      setIsLoggedIn(true);
      setTimeout(() => window.location.href = "/profile", 1000); // Redirect to profile after 1 second
    } else {
      setMessage(result.error || "Login failed");
      setSuccess(false);
    }
  };

  return (
    <form className="modern-card" onSubmit={handleSubmit} style={{
      maxWidth: 400,
      margin: '48px auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 800, marginBottom: 18 }}>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <button type="submit" disabled={loading} style={{
        background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '12px 30px',
        fontWeight: 700,
        fontSize: 19,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        cursor: loading ? 'not-allowed' : 'pointer',
        marginTop: 10,
        transition: 'background 0.2s, box-shadow 0.2s',
        letterSpacing: 0.5,
      }}>{loading ? "Logging in..." : "Login"}</button>
      <div style={{ minHeight: 24, color: success ? '#388E3C' : 'red', marginTop: 8, textAlign: 'center', fontSize: 15 }}>{message}</div>
      <button
        type="button"
        style={{
          marginTop: 12,
          fontSize: '0.95em',
          background: '#eee',
          color: '#455A64',
          border: 'none',
          borderRadius: 6,
          padding: '0.5em 1.2em',
          cursor: 'pointer',
          width: 'auto',
          minWidth: 0,
          fontWeight: 500,
        }}
        onClick={() => window.location.href = '/register'}
      >
        Register
      </button>
    </form>
  );
};

export default LoginForm;