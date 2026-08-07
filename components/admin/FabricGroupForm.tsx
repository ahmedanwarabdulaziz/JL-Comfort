'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { FabricGroup, FabricGroupInput } from '@/lib/types/fabricGroup';
import { createFabricGroup, updateFabricGroup } from '@/lib/data/fabricGroups';

interface FabricGroupFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  group?: FabricGroup | null;
}

const emptyFormData: FabricGroupInput = {
  name: '',
  description: '',
};

export default function FabricGroupForm({ open, onClose, onSave, group }: FabricGroupFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FabricGroupInput>(emptyFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setFormData({ name: group.name, description: group.description || '' });
    } else {
      setFormData(emptyFormData);
    }
    setError(null);
  }, [group, open]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (group) {
        await updateFabricGroup(group.id, formData);
      } else {
        await createFabricGroup(formData);
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving fabric group:', err);
      setError(err?.message || 'Failed to save fabric group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {group ? 'Edit Fabric Group' : 'Add New Fabric Group'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Group Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
            placeholder="e.g., Most Selling Fabrics"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            placeholder="Optional notes about this group"
          />

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name}
          size="large"
        >
          {loading ? 'Saving...' : group ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
