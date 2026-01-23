'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Collapse,
} from '@mui/material';
import { auth, isFirebaseConfigured } from '@/lib/firebase/config';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    // Show diagnostics if Firebase is not configured
    if (!isFirebaseConfigured() || !auth) {
      setShowDiagnostics(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!auth) {
      setError(
        'Firebase is not configured. Please check your environment variables:\n' +
        '- NEXT_PUBLIC_FIREBASE_API_KEY\n' +
        '- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n' +
        '- NEXT_PUBLIC_FIREBASE_PROJECT_ID'
      );
      setLoading(false);
      return;
    }

    // Validate email format
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Firebase auth error:', err);
      let errorMessage = 'Failed to sign in';
      
      // Provide more specific error messages
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection';
            break;
          case 'auth/invalid-api-key':
            errorMessage = 'Firebase API key is invalid. Please check your environment variables';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = 'This domain is not authorized for Firebase authentication';
            break;
          default:
            errorMessage = err.message || `Authentication error: ${err.code}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {(!isFirebaseConfigured() || !auth) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Firebase is not properly configured. Please check your environment variables.
              </Typography>
              <Button
                size="small"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                sx={{ mt: 1 }}
              >
                {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
              </Button>
              <Collapse in={showDiagnostics}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                    <div>Firebase Configured: {isFirebaseConfigured() ? '✓ Yes' : '✗ No'}</div>
                    <div>Auth Object: {auth ? '✓ Available' : '✗ Missing'}</div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                      Check your .env.local file and ensure:
                      <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                        <li>NEXT_PUBLIC_FIREBASE_API_KEY is set</li>
                        <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set</li>
                        <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID is set</li>
                        <li>Development server was restarted after changes</li>
                      </ul>
                      See FIREBASE_TROUBLESHOOTING.md for detailed help
                    </div>
                  </Typography>
                </Box>
              </Collapse>
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
