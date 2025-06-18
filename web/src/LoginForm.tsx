import React, { useState } from "react";
import { login } from "./api";
import { useSnackbar } from "./App";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface LoginFormProps {
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showMessage } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.token) {
      localStorage.setItem("token", result.token);
      showMessage("Login successful!", "success");
      setIsLoggedIn(true);
      setTimeout(() => window.location.href = "/profile", 1000); // Redirect to profile after 1 second
    } else {
      showMessage(result.error || "Login failed", "error");
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
        className="input"
        style={{ padding: 14, borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 18, marginBottom: 8, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      />
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
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
      <button type="submit" disabled={loading} className="submitButton" style={{
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
        transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
        letterSpacing: 0.5,
        outline: 'none',
        animation: 'fadeInUp 0.5s',
      }}>{loading ? "Logging in..." : "Login"}</button>
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