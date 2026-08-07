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
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FabricPriceRange } from '@/lib/types/fabricPriceRange';
import { getFabricPriceRanges, deleteFabricPriceRange } from '@/lib/data/fabricPriceRanges';
import FabricPriceRangeForm from './FabricPriceRangeForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function FabricPriceRangesList() {
  const [ranges, setRanges] = useState<FabricPriceRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<FabricPriceRange | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rangeToDelete, setRangeToDelete] = useState<FabricPriceRange | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await getFabricPriceRanges();
      setRanges(results);
    } catch (error) {
      console.error('Error loading fabric price ranges:', error);
      setRanges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingRange(null);
    setFormOpen(true);
  };

  const handleEdit = (range: FabricPriceRange) => {
    setEditingRange(range);
    setFormOpen(true);
  };

  const handleDelete = (range: FabricPriceRange) => {
    setRangeToDelete(range);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (rangeToDelete) {
      try {
        await deleteFabricPriceRange(rangeToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setRangeToDelete(null);
      } catch (error) {
        console.error('Error deleting fabric price range:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingRange(null);
  };

  const handleFormSave = async () => {
    await loadData();
    handleFormClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5">Fabric Price Ranges</Typography>
          <Typography variant="body2" color="text.secondary">
            Read-only labels (e.g. &quot;Economy Fabrics&quot;) automatically applied to items based on
            their current effective price — not another way to set price.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleAdd}>
          Add Price Range
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell>Min Price</TableCell>
              <TableCell>Max Price</TableCell>
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
            ) : ranges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No fabric price ranges found
                </TableCell>
              </TableRow>
            ) : (
              ranges.map((range) => (
                <TableRow key={range.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{range.name}</Typography>
                  </TableCell>
                  <TableCell>${range.minPrice.toFixed(2)}</TableCell>
                  <TableCell>{range.maxPrice === null ? 'No limit' : `$${range.maxPrice.toFixed(2)}`}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(range)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(range)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FabricPriceRangeForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        range={editingRange}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRangeToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={rangeToDelete?.name || ''}
      />
    </Box>
  );
}
