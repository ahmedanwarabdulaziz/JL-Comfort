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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FoamGrade } from '@/lib/types/foam-grade';
import {
  getFoamGrades,
  getFoamGradeBrands,
  createFoamGrade,
  updateFoamGrade,
  deleteFoamGrade as deleteGradeApi,
} from '@/lib/data/foam-grades';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function FoamGradesList() {
  const [grades, setGrades] = useState<FoamGrade[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<FoamGrade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<FoamGrade | null>(null);

  // Form state
  const [brand, setBrand] = useState('');
  const [gradeName, setGradeName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isNewBrand, setIsNewBrand] = useState(false);

  const filteredGrades =
    selectedBrand === 'all'
      ? grades
      : grades.filter((g) => g.brand === selectedBrand);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gradesData, brandsData] = await Promise.all([
        getFoamGrades(),
        getFoamGradeBrands(),
      ]);
      setGrades(gradesData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading foam grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingGrade(null);
    setBrand('');
    setGradeName('');
    setPrice(0);
    setIsNewBrand(false);
    setFormOpen(true);
  };

  const handleEdit = (grade: FoamGrade) => {
    setEditingGrade(grade);
    setBrand(grade.brand);
    setGradeName(grade.gradeName);
    setPrice(grade.price);
    setIsNewBrand(!brands.includes(grade.brand));
    setFormOpen(true);
  };

  const handleDelete = (grade: FoamGrade) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (gradeToDelete) {
      try {
        await deleteGradeApi(gradeToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setGradeToDelete(null);
      } catch (error) {
        console.error('Error deleting foam grade:', error);
      }
    }
  };

  const handleFormSave = async () => {
    try {
      const input = {
        brand: brand.trim(),
        gradeName: gradeName.trim(),
        price: price,
      };

      if (editingGrade) {
        await updateFoamGrade(editingGrade.id, input);
      } else {
        await createFoamGrade(input);
      }

      await loadData();
      setFormOpen(false);
      setEditingGrade(null);
    } catch (error) {
      console.error('Error saving foam grade:', error);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingGrade(null);
    setBrand('');
    setGradeName('');
    setPrice(0);
    setIsNewBrand(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Foam Grades</Typography>
        <Button variant="contained" onClick={handleAdd} startIcon={<AddIcon />}>
          Add Grade
        </Button>
      </Box>

      {/* Brand Tabs */}
      {brands.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={selectedBrand}
            onChange={(_, newValue) => setSelectedBrand(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" value="all" />
            {brands.map((brandName) => (
              <Tab key={brandName} label={brandName} value={brandName} />
            ))}
          </Tabs>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Brand</TableCell>
              <TableCell>Grade Name</TableCell>
              <TableCell align="right">Price</TableCell>
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
            ) : filteredGrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No foam grades found
                </TableCell>
              </TableRow>
            ) : (
              filteredGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>
                    <Chip label={grade.brand} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{grade.gradeName}</TableCell>
                  <TableCell align="right">
                    ${grade.price.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(grade)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(grade)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Grade Form Dialog */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGrade ? 'Edit Foam Grade' : 'Add Foam Grade'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {!isNewBrand ? (
              <FormControl fullWidth required>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={brand}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsNewBrand(true);
                      setBrand('');
                    } else {
                      setBrand(e.target.value);
                    }
                  }}
                  label="Brand"
                >
                  {brands.map((brandName) => (
                    <MenuItem key={brandName} value={brandName}>
                      {brandName}
                    </MenuItem>
                  ))}
                  <MenuItem value="__NEW__">
                    <em>+ Add New Brand</em>
                  </MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Box>
                <TextField
                  label="Brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  fullWidth
                  required
                  helperText="Enter a new brand name"
                />
                <Button
                  size="small"
                  onClick={() => {
                    setIsNewBrand(false);
                    setBrand('');
                  }}
                  sx={{ mt: 1 }}
                >
                  Select Existing Brand
                </Button>
              </Box>
            )}
            <TextField
              label="Grade Name"
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              fullWidth
              required
              helperText="Name of the foam grade"
            />
            <TextField
              label="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              inputProps={{ step: '0.01', min: '0' }}
              fullWidth
              required
              helperText="Price per unit"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>Cancel</Button>
          <Button
            onClick={handleFormSave}
            variant="contained"
            disabled={!brand.trim() || !gradeName.trim() || price < 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setGradeToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={gradeToDelete ? `${gradeToDelete.brand} - ${gradeToDelete.gradeName}` : ''}
      />
    </Box>
  );
}
