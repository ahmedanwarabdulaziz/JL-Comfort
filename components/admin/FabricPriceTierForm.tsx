'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  Stack,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Paper,
} from '@mui/material';
import { FabricPriceTier, FabricPriceTierInput } from '@/lib/types/fabricPriceTier';
import { createFabricPriceTier, updateFabricPriceTier } from '@/lib/data/fabricPriceTiers';
import { CHARLOTTE_FABRIC_MATERIALS } from '@/lib/data/charlotteFabricFacets';

interface FabricPriceTierFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  tier?: FabricPriceTier | null;
}

const emptyFormData: FabricPriceTierInput = {
  name: '',
  pricePerYard: 0,
  materials: [],
  isDefault: false,
};

export default function FabricPriceTierForm({ open, onClose, onSave, tier }: FabricPriceTierFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FabricPriceTierInput>(emptyFormData);

  useEffect(() => {
    if (tier) {
      setFormData({
        name: tier.name,
        pricePerYard: tier.pricePerYard ?? 0,
        materials: tier.materials || [],
        isDefault: tier.isDefault ?? false,
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [tier, open]);

  const handleToggleMaterial = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.includes(value)
        ? prev.materials.filter((m) => m !== value)
        : [...prev.materials, value],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (tier) {
        await updateFabricPriceTier(tier.id, formData);
      } else {
        await createFabricPriceTier(formData);
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving fabric price tier:', error);
      alert(error?.message || 'Failed to save fabric price tier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {tier ? 'Edit Fabric Price Tier' : 'Add New Fabric Price Tier'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Tier Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Standard, Performance, Premium"
              />
            </Grid>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  />
                }
                label="Default tier"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                The default tier is used when a customer picks a fabric without filtering by Material, or when no other tier matches.
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ mb: 1 }}>
              Materials in This Tier
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which Charlotte Fabrics material categories belong to this price tier. When a customer filters by one of these in the fabric gallery, this tier&apos;s price applies.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={0.5}>
                {CHARLOTTE_FABRIC_MATERIALS.map((material) => (
                  <Grid item xs={12} sm={6} md={4} key={material.value}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.materials.includes(material.value)}
                          onChange={() => handleToggleMaterial(material.value)}
                        />
                      }
                      label={<Typography variant="body2">{material.label}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
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
          {loading ? 'Saving...' : tier ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
