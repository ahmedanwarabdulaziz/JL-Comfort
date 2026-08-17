'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { AIChatLogRow } from '@/lib/types/ai';
import { getAIChatLogs, clearAIChatLogs } from '@/lib/data/aiChatLogs';

const formatDate = (date: Date) => date.toLocaleString();

export default function AIChatLogsList() {
  const [logs, setLogs] = useState<AIChatLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      setLogs(await getAIChatLogs());
    } catch (error) {
      console.error('Error loading AI chat logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearAll = async () => {
    setConfirmOpen(false);
    setClearing(true);
    try {
      await clearAIChatLogs();
      setLogs([]);
    } catch (error) {
      console.error('Error clearing AI chat logs:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            AI Chat Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading…' : `${logs.length} logged interaction${logs.length === 1 ? '' : 's'} (most recent ${logs.length >= 200 ? '200' : logs.length})`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteSweepIcon />}
          disabled={loading || clearing || logs.length === 0}
          onClick={() => setConfirmOpen(true)}
        >
          Clear All Logs
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Customer Message</TableCell>
              <TableCell>Assistant Reply</TableCell>
              <TableCell>Results</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No AI conversations logged yet.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={log.mode} color={log.mode === 'chat' ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography variant="body2" noWrap>
                      {log.userMessage || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" noWrap>
                      {log.assistantMessage}
                    </Typography>
                  </TableCell>
                  <TableCell>{log.productCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Clear all AI chat logs?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes all {logs.length} logged conversations. This can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleClearAll} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
