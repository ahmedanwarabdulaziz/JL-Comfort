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
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { FoamType } from '@/lib/types/foam';
import { Category } from '@/lib/types/category';
import {
  getFoamTypes,
  deleteFoamType as deleteFoamTypeApi,
} from '@/lib/data/foam';
import { getCategories } from '@/lib/data/categories';
import FoamTypeForm from './FoamTypeForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

// Import drag-and-drop libraries (they're in package.json)
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
import { updateFoamTypesOrder } from '@/lib/data/foam-sort';
import SortableTableRowComponent from './SortableTableRow';

export default function FoamTypesList() {
  const [foamTypes, setFoamTypes] = useState<FoamType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFoamType, setEditingFoamType] = useState<FoamType | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [foamTypeToDelete, setFoamTypeToDelete] = useState<FoamType | null>(
    null
  );

  // Always call hooks unconditionally - React hooks rules
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTypes =
    selectedCategoryId === 'all'
      ? foamTypes
      : foamTypes.filter((f) => f.categoryId === selectedCategoryId);

  const loadData = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategoryId === 'all' ? undefined : selectedCategoryId;
      console.log('Loading foam types for category:', categoryParam || 'all');
      
      const [types, cats] = await Promise.all([
        getFoamTypes(categoryParam),
        getCategories(),
      ]);
      
      console.log('Loaded foam types:', types.length, types);
      console.log('Loaded categories:', cats.length);
      
      setFoamTypes(types);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading foam types:', error);
      // Set empty arrays on error to show "No foam types found" message
      setFoamTypes([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const handleAdd = () => {
    setEditingFoamType(null);
    setFormOpen(true);
  };

  const handleEdit = (foamType: FoamType) => {
    setEditingFoamType(foamType);
    setFormOpen(true);
  };

  const handleDelete = (foamType: FoamType) => {
    setFoamTypeToDelete(foamType);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (foamTypeToDelete) {
      try {
        await deleteFoamTypeApi(foamTypeToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setFoamTypeToDelete(null);
      } catch (error) {
        console.error('Error deleting foam type:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingFoamType(null);
  };

  const handleFormSave = async () => {
    await loadData();
    handleFormClose();
  };

  const handleDragEnd = async (event: any) => {
    if (!arrayMove || !updateFoamTypesOrder) return;
    
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentFiltered = selectedCategoryId === 'all'
        ? foamTypes
        : foamTypes.filter((f) => f.categoryId === selectedCategoryId);
      
      const oldIndex = currentFiltered.findIndex((item) => item.id === active.id);
      const newIndex = currentFiltered.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(currentFiltered, oldIndex, newIndex);
      
      // Update local state immediately for better UX
      if (selectedCategoryId === 'all') {
        setFoamTypes((prev) => {
          const reordered = arrayMove(prev, oldIndex, newIndex);
          return reordered.map((item: FoamType, index: number) => ({
            ...item,
            sortOrder: index,
          }));
        });
      } else {
        // For filtered view, update all items but maintain order within category
        setFoamTypes((prev) => {
          const categoryItems = prev.filter((f) => f.categoryId === selectedCategoryId);
          const otherItems = prev.filter((f) => f.categoryId !== selectedCategoryId);
          const reorderedCategory = arrayMove(categoryItems, oldIndex, newIndex);
          return [...otherItems, ...reorderedCategory].map((item: FoamType, index: number) => ({
            ...item,
            sortOrder: index,
          }));
        });
      }

      // Update in Firestore
      try {
        const reorderedTypes = newOrder.map((item: FoamType, index: number) => ({
          ...item,
          sortOrder: index,
        }));
        await updateFoamTypesOrder(reorderedTypes);
      } catch (error) {
        console.error('Error updating order:', error);
        // Reload on error to revert
        await loadData();
      }
    }
  };

  // Helper to get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Foam Types</Typography>
        <Button variant="contained" onClick={handleAdd}>
          Add Foam Type
        </Button>
      </Box>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedCategoryId}
          onChange={(_, newValue) => setSelectedCategoryId(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          {categories.map((cat) => (
            <Tab key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}>Order</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Image</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No foam types found
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={filteredTypes.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredTypes.map((foamType) => {
                    const Row = SortableTableRowComponent;
                    return (
                      <Row
                        key={foamType.id}
                        foamType={foamType}
                        categoryName={getCategoryName(foamType.categoryId)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </SortableContext>
              )}
            </TableBody>
            </Table>
          </DndContext>
      </TableContainer>

      <FoamTypeForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        foamType={editingFoamType}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setFoamTypeToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={foamTypeToDelete?.name || ''}
      />
    </Box>
  );
}
