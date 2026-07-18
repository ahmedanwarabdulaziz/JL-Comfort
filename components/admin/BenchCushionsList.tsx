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
} from '@mui/material';
import { BenchCushionStyle } from '@/lib/types/benchCushion';
import {
  getBenchCushionStyles,
  deleteBenchCushionStyle as deleteBenchCushionStyleApi,
} from '@/lib/data/benchCushions';
import BenchCushionForm from './BenchCushionForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { updateBenchCushionStylesOrder } from '@/lib/data/benchCushion-sort';
import SortableBenchCushionRow from './SortableBenchCushionRow';

export default function BenchCushionsList() {
  const [styles, setStyles] = useState<BenchCushionStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<BenchCushionStyle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<BenchCushionStyle | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await getBenchCushionStyles();
      setStyles(results);
    } catch (error) {
      console.error('Error loading bench cushion styles:', error);
      setStyles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingStyle(null);
    setFormOpen(true);
  };

  const handleEdit = (style: BenchCushionStyle) => {
    setEditingStyle(style);
    setFormOpen(true);
  };

  const handleDelete = (style: BenchCushionStyle) => {
    setStyleToDelete(style);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (styleToDelete) {
      try {
        await deleteBenchCushionStyleApi(styleToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setStyleToDelete(null);
      } catch (error) {
        console.error('Error deleting bench cushion style:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingStyle(null);
  };

  const handleFormSave = async () => {
    await loadData();
    handleFormClose();
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = styles.findIndex((item) => item.id === active.id);
      const newIndex = styles.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(styles, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sortOrder: index,
      }));

      setStyles(reordered);

      try {
        await updateBenchCushionStylesOrder(reordered);
      } catch (error) {
        console.error('Error updating order:', error);
        await loadData();
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Bench Cushion Styles</Typography>
        <Button variant="contained" onClick={handleAdd}>
          Add Bench Cushion Style
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}>Order</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Style Options</TableCell>
                <TableCell>Base Price</TableCell>
                <TableCell>Image</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : styles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No bench cushion styles found
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext items={styles.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {styles.map((style) => (
                    <SortableBenchCushionRow
                      key={style.id}
                      style={style}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </TableContainer>

      <BenchCushionForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        style={editingStyle}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setStyleToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={styleToDelete?.name || ''}
      />
    </Box>
  );
}
