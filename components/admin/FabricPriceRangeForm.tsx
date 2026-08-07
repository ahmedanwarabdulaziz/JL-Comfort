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
  Grid,
  Divider,
  Stack,
  InputAdornment,
} from '@mui/material';
import { FabricPriceRange, FabricPriceRangeInput } from '@/lib/types/fabricPriceRange';
import { createFabricPriceRange, updateFabricPriceRange } from '@/lib/data/fabricPriceRanges';

interface FabricPriceRangeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  range?: FabricPriceRange | null;
}

const emptyFormData: FabricPriceRangeInput = {
  name: '',
  minPrice: 0,
  maxPrice: null,
};

export default function FabricPriceRangeForm({ open, onClose, onSave, range }: FabricPriceRangeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FabricPriceRangeInput>(emptyFormData);
  const [maxPriceText, setMaxPriceText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (range) {
      setFormData({ name: range.name, minPrice: range.minPrice, maxPrice: range.maxPrice });
      setMaxPriceText(range.maxPrice === null ? '' : String(range.maxPrice));
    } else {
      setFormData(emptyFormData);
      setMaxPriceText('');
    }
    setError(null);
  }, [range, open]);

  const handleSubmit = async () => {
    if (formData.maxPrice !== null && formData.maxPrice < formData.minPrice) {
      setError('Max price must be greater than or equal to min price.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (range) {
        await updateFabricPriceRange(range.id, formData);
      } else {
        await createFabricPriceRange(formData);
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving fabric price range:', err);
      setError(err?.message || 'Failed to save fabric price range.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {range ? 'Edit Fabric Price Range' : 'Add New Fabric Price Range'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Label"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Economy Fabrics"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={formData.minPrice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))
                }
                required
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={maxPriceText}
                onChange={(e) => {
                  const text = e.target.value;
                  setMaxPriceText(text);
                  setFormData((prev) => ({ ...prev, maxPrice: text === '' ? null : parseFloat(text) || 0 }));
                }}
                placeholder="Leave blank for no limit"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
          </Grid>

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
          {loading ? 'Saving...' : range ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
