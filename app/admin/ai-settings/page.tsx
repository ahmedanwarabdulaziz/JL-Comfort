'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { supabase } from '@/lib/supabase/client';

export default function AiSettingsPage() {
  const [persona, setPersona] = useState<string>('');
  const [outputSchema, setOutputSchema] = useState<string>('');
  const [rules, setRules] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        if (!supabase) {
          setMessage({ type: 'error', text: 'Supabase client is not configured.' });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('ai_settings')
          .select('persona, output_schema, rules, system_prompt')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching prompt:', error);
          setMessage({ type: 'error', text: 'Failed to load prompt.' });
        } else if (data) {
          if (data.persona !== null && data.persona !== undefined) {
            setPersona(data.persona || '');
            setOutputSchema(data.output_schema || '');
            setRules(data.rules || '');
          } else if (data.system_prompt) {
            setPersona(data.system_prompt);
            setOutputSchema('');
            setRules('');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrompt();
  }, []);

  const handleSave = async () => {
    if (!persona.trim() && !outputSchema.trim() && !rules.trim()) return;
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase client is not configured.' });
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('ai_settings')
        .insert([{ 
          persona: persona,
          output_schema: outputSchema,
          rules: rules,
          system_prompt: '' // fallback for legacy column
        }]);

      if (error) throw error;
      setMessage({ type: 'success', text: "Yousha's brain updated successfully!" });
    } catch (err: any) {
      console.error('Error saving prompt:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save prompt.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>
        Yousha&apos;s Brain (AI Settings)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Edit the system prompt to change Yousha&apos;s personality, rules, or how she extracts customer filters.
        This updates her behavior instantly across the store.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          1. Persona
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Describe Yousha&apos;s personality, her role, and how she should interact with customers.
        </Typography>
        <TextField
          multiline
          fullWidth
          rows={6}
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          variant="outlined"
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          2. Output Format (Schema)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Define the strict JSON format the backend expects her to output. Be very careful changing this.
        </Typography>
        <TextField
          multiline
          fullWidth
          rows={12}
          value={outputSchema}
          onChange={(e) => setOutputSchema(e.target.value)}
          variant="outlined"
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          3. Rules
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Numbered list of hard rules she must follow (e.g. what she can and cannot say).
        </Typography>
        <TextField
          multiline
          fullWidth
          rows={8}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          variant="outlined"
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />
      </Paper>

      <Button
        variant="contained"
        color="primary"
        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        onClick={handleSave}
        disabled={saving || (!persona.trim() && !outputSchema.trim() && !rules.trim())}
      >
        {saving ? 'Saving...' : 'Save AI Settings'}
      </Button>
    </Box>
  );
}
