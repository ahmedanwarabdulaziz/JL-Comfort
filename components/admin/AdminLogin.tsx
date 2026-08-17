'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password',
  email_not_confirmed: 'This account has not confirmed its email yet',
  user_not_found: 'No account found with this email',
  user_banned: 'This account has been disabled',
};

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError(
        'Supabase is not configured. Please check your environment variables:\n' +
          '- NEXT_PUBLIC_SUPABASE_URL\n' +
          '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
      setLoading(false);
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      console.error('Supabase auth error:', signInError);
      const code = (signInError as { code?: string }).code;
      setError((code && ERROR_MESSAGES[code]) || signInError.message || 'Failed to sign in');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
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
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}
          {!isSupabaseConfigured() && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Supabase is not properly configured. Please check your environment variables.
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
