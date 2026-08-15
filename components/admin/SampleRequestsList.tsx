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
  Stack,
} from '@mui/material';
import { SampleRequest } from '@/lib/types/sampleRequest';
import { getSampleRequests, markSampleRequestShipped } from '@/lib/data/sampleRequests';

const formatDate = (date: Date) => date.toLocaleString();

export default function SampleRequestsList() {
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSampleRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading sample requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkShipped = async (id: string) => {
    setUpdatingId(id);
    try {
      await markSampleRequestShipped(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'shipped' } : r)));
    } catch (error) {
      console.error('Error marking sample request shipped:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
        Fabric Sample Requests
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {loading ? 'Loading…' : `${requests.length} total, ${pendingCount} pending`}
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Requested</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Samples</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No sample requests yet.</TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.email}</Typography>
                    {r.phone && <Typography variant="caption" color="text.secondary">{r.phone}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {r.address.line1}{r.address.line2 ? `, ${r.address.line2}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.address.city}, {r.address.state} {r.address.zip}, {r.address.country}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      {r.items.map((item) => (
                        <Typography key={item.fabricId} variant="caption">
                          {item.name} ({item.sku})
                        </Typography>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.status === 'shipped' ? 'Shipped' : 'Pending'}
                      color={r.status === 'shipped' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={updatingId === r.id}
                        onClick={() => handleMarkShipped(r.id)}
                      >
                        Mark Shipped
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
