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
import { FabricPriceTag, FabricPriceTagInput } from '@/lib/types/fabricPriceTag';
import { createFabricPriceTag, updateFabricPriceTag } from '@/lib/data/fabricPriceTags';

interface FabricPriceTagFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  tag?: FabricPriceTag | null;
}

const emptyFormData: FabricPriceTagInput = {
  name: '',
  pricePerYard: 0,
};

export default function FabricPriceTagForm({ open, onClose, onSave, tag }: FabricPriceTagFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FabricPriceTagInput>(emptyFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tag) {
      setFormData({ name: tag.name, pricePerYard: tag.pricePerYard ?? 0 });
    } else {
      setFormData(emptyFormData);
    }
    setError(null);
  }, [tag, open]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tag) {
        await updateFabricPriceTag(tag.id, formData);
      } else {
        await createFabricPriceTag(formData);
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving fabric price tag:', err);
      setError(err?.message || 'Failed to save fabric price tag.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {tag ? 'Edit Fabric Price Tag' : 'Add New Fabric Price Tag'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                label="Tag Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Economy, Standard, Premium"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Price Per Yard"
                type="number"
                value={formData.pricePerYard}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pricePerYard: parseFloat(e.target.value) || 0 }))
                }
                required
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/ yd</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Assign this tag to specific fabrics from the Fabric Catalog page. Fabrics with no tag
                assigned have no price and won&apos;t be shown to customers.
              </Typography>
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
          {loading ? 'Saving...' : tag ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
