import React, { useState } from 'react';
import { login } from './api';
import { Box, Typography, TextField, Button, Alert, Paper } from '@mui/material';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      setLoading(false);
      if (result && result.token) {
        // Decode token to check isAdmin
        try {
          const decoded: any = JSON.parse(atob(result.token.split('.')[1]));
          if (decoded.isAdmin) {
            localStorage.setItem('token', result.token);
            window.location.href = '/admin';
          } else {
            setError('You do not have admin privileges.');
          }
        } catch {
          setError('Invalid token received.');
        }
      } else {
        setError((result && result.error) || 'Login failed');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Network or server error. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="#FF9800">Admin Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLogin;
