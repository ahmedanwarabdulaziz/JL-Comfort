'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FabricPriceTier } from '@/lib/types/fabricPriceTier';
import { getFabricPriceTiers, deleteFabricPriceTier } from '@/lib/data/fabricPriceTiers';
import { CHARLOTTE_FABRIC_MATERIALS } from '@/lib/data/charlotteFabricFacets';
import FabricPriceTierForm from './FabricPriceTierForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const materialLabel = (value: string) =>
  CHARLOTTE_FABRIC_MATERIALS.find((m) => m.value === value)?.label || value;

export default function FabricPriceTiersList() {
  const [tiers, setTiers] = useState<FabricPriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<FabricPriceTier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<FabricPriceTier | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await getFabricPriceTiers();
      setTiers(results);
    } catch (error) {
      console.error('Error loading fabric price tiers:', error);
      setTiers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingTier(null);
    setFormOpen(true);
  };

  const handleEdit = (tier: FabricPriceTier) => {
    setEditingTier(tier);
    setFormOpen(true);
  };

  const handleDelete = (tier: FabricPriceTier) => {
    setTierToDelete(tier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (tierToDelete) {
      try {
        await deleteFabricPriceTier(tierToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setTierToDelete(null);
      } catch (error) {
        console.error('Error deleting fabric price tier:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTier(null);
  };

  const handleFormSave = async () => {
    await loadData();
    handleFormClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5">Fabric Price Tiers</Typography>
          <Typography variant="body2" color="text.secondary">
            Sets $/yard pricing for Charlotte Fabrics selections, bucketed by material.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleAdd}>
          Add Price Tier
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tier</TableCell>
              <TableCell>Price / Yard</TableCell>
              <TableCell>Materials</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No fabric price tiers found
                </TableCell>
              </TableRow>
            ) : (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight="bold">{tier.name}</Typography>
                      {tier.isDefault && <Chip label="Default" size="small" color="primary" />}
                    </Stack>
                  </TableCell>
                  <TableCell>${tier.pricePerYard.toFixed(2)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {tier.materials.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">None</Typography>
                      ) : (
                        tier.materials.map((m) => (
                          <Chip key={m} label={materialLabel(m)} size="small" />
                        ))
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(tier)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(tier)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FabricPriceTierForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        tier={editingTier}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTierToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={tierToDelete?.name || ''}
      />
    </Box>
  );
}
