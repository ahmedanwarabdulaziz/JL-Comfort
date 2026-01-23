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
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FibreWrap } from '@/lib/types/fibre-wrap';
import {
  getFibreWraps,
  createFibreWrap,
  updateFibreWrap,
  deleteFibreWrap as deleteWrapApi,
} from '@/lib/data/fibre-wrap';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function FibreWrapList() {
  const [wraps, setWraps] = useState<FibreWrap[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingWrap, setEditingWrap] = useState<FibreWrap | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wrapToDelete, setWrapToDelete] = useState<FibreWrap | null>(null);

  // Form state
  const [fibreThickness, setFibreThickness] = useState('');
  const [value, setValue] = useState<number>(0);
  const [valueInput, setValueInput] = useState<string>('0');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFibreWraps();
      setWraps(data);
    } catch (error) {
      console.error('Error loading fibre wraps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper function to parse fraction string to number
  const parseFraction = (input: string): number => {
    const trimmed = input.trim();
    
    // Check if it's a fraction (contains '/')
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator;
        }
      }
    }
    
    // Try parsing as regular number
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = () => {
    setEditingWrap(null);
    setFibreThickness('');
    setValue(0);
    setValueInput('0');
    setFormOpen(true);
  };

  const handleEdit = (wrap: FibreWrap) => {
    setEditingWrap(wrap);
    setFibreThickness(wrap.fibreThickness);
    setValue(wrap.value);
    setValueInput(String(wrap.value));
    setFormOpen(true);
  };

  const handleDelete = (wrap: FibreWrap) => {
    setWrapToDelete(wrap);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (wrapToDelete) {
      try {
        await deleteWrapApi(wrapToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setWrapToDelete(null);
      } catch (error) {
        console.error('Error deleting fibre wrap:', error);
      }
    }
  };

  const handleFormSave = async () => {
    try {
      // Parse the value input (could be fraction or decimal)
      const parsedValue = parseFraction(valueInput);
      
      const input = {
        fibreThickness: fibreThickness.trim(),
        value: parsedValue,
      };

      if (editingWrap) {
        await updateFibreWrap(editingWrap.id, input);
      } else {
        await createFibreWrap(input);
      }

      await loadData();
      setFormOpen(false);
      setEditingWrap(null);
    } catch (error) {
      console.error('Error saving fibre wrap:', error);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingWrap(null);
    setFibreThickness('');
    setValue(0);
    setValueInput('0');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Fibre Wrap</Typography>
        <Button variant="contained" onClick={handleAdd} startIcon={<AddIcon />}>
          Add Fibre Wrap
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fibre Thickness</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : wraps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No fibre wraps found
                </TableCell>
              </TableRow>
            ) : (
              wraps.map((wrap) => (
                <TableRow key={wrap.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {wrap.fibreThickness}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="medium">
                      {wrap.value}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(wrap)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(wrap)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Wrap Form Dialog */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWrap ? 'Edit Fibre Wrap' : 'Add Fibre Wrap'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Fibre Thickness"
              value={fibreThickness}
              onChange={(e) => setFibreThickness(e.target.value)}
              fullWidth
              required
              helperText="Enter the fibre thickness (e.g., '1/2 inch', '1 inch', etc.)"
            />
            <TextField
              label="Value"
              value={valueInput}
              onChange={(e) => {
                setValueInput(e.target.value);
                const parsed = parseFraction(e.target.value);
                setValue(parsed);
              }}
              fullWidth
              required
              helperText="Enter value as number or fraction (e.g., '0.5' or '1/2')"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>Cancel</Button>
          <Button
            onClick={handleFormSave}
            variant="contained"
            disabled={!fibreThickness.trim() || !valueInput.trim() || value < 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setWrapToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={wrapToDelete ? `Fibre Wrap - ${wrapToDelete.fibreThickness}` : ''}
      />
    </Box>
  );
}
