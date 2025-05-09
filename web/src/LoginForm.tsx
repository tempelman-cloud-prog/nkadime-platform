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
    <form className="modern-card" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      <div style={{ marginTop: "1em", color: success ? "green" : "red" }}>
        {message}
      </div>
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