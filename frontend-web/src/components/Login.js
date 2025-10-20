import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  Tab,
  Tabs,
  Snackbar,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading, error, isAuthenticated, clearError } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // For already authenticated users on mount, redirect immediately
      const from = location.state?.from?.pathname || '/dashboard';
      const isValidPath = from.startsWith('/') && !from.includes('//');
      const redirectPath = isValidPath ? from : '/dashboard';
      
      window.location.replace(redirectPath);
    }
  }, [isAuthenticated, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      clearError();
      await login({ username, password });
      
      // Navigate directly after successful login
      const from = location.state?.from?.pathname || '/dashboard';
      const isValidPath = from.startsWith('/') && !from.includes('//');
      const redirectPath = isValidPath ? from : '/dashboard';
      
      // Use window.location for more reliable navigation
      window.location.href = redirectPath;
    } catch (error) {
      // Error is handled in the context
      console.error('Login failed:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    try {
      clearError();
      await register({ username, email, password, role: 'user' });
      setShowSuccess(true);
      setTabValue(0); // Switch to login tab after successful registration
      setEmail('');
      setConfirmPassword('');
      setPassword('');
      setUsername('');
    } catch (error) {
      // Error is handled in the context
      console.error('Registration failed:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          p: 2,
          backgroundColor: '#f5f5f5'
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 350,
            width: '100%',
            border: '1px solid #310727ff', 
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: 'white'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h4" 
              align="center" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: '#310727ff',
                mb: 1
              }}
            >
              🏪 POS System
            </Typography>
            <Typography 
              variant="body2" 
              align="center" 
              color="textSecondary" 
              sx={{ mb: 3 }}
            >
              Sign in to access your dashboard
            </Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="auth tabs">
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>
          {tabValue === 0 && (
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error.detail || 'Login failed'}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  backgroundColor: '#310727ff',
                  '&:hover': {
                    backgroundColor: '#4a0a3a'
                  },
                  py: 1.5,
                  fontSize: '1rem'
                }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Box>
          )}
          {tabValue === 1 && (
            <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                error={password !== confirmPassword && confirmPassword !== ''}
                helperText={password !== confirmPassword && confirmPassword !== '' ? 'Passwords do not match' : ''}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error.detail || 'Registration failed'}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  backgroundColor: '#310727ff',
                  '&:hover': {
                    backgroundColor: '#4a0a3a'
                  },
                  py: 1.5,
                  fontSize: '1rem'
                }}
                disabled={loading || password !== confirmPassword}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </Box>
          )}
            </CardContent>
          </Card>
      </Box>
    
    {/* Success notification */}
    <Snackbar
      open={showSuccess}
      autoHideDuration={6000}
      onClose={() => setShowSuccess(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
        Registration successful! You can now log in.
      </Alert>
    </Snackbar>
  </>
  );
};

export default Login;