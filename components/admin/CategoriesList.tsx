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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Category } from '@/lib/types/category';
import {
  getCategories,
  deleteCategory as deleteCategoryApi,
  updateCategoriesOrder,
} from '@/lib/data/categories';
import CategoryForm from './CategoryForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import SortableCategoryRow from './SortableCategoryRow';

// Import drag-and-drop libraries
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

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategoryApi(categoryToDelete.id);
        await loadCategories();
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingCategory(null);
  };

  const handleFormSave = async () => {
    await loadCategories();
    handleFormClose();
  };

  const handleDragEnd = async (event: any) => {
    if (!arrayMove || !updateCategoriesOrder) return;
    
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(categories, oldIndex, newIndex);
      
      // Update local state immediately for better UX
      setCategories((prev) => {
        const reordered = arrayMove(prev, oldIndex, newIndex);
        return reordered.map((item: Category, index: number) => ({
          ...item,
          sortOrder: index,
        }));
      });

      // Update in Firestore
      try {
        const reorderedCategories = newOrder.map((item: Category, index: number) => ({
          ...item,
          sortOrder: index,
        }));
        await updateCategoriesOrder(reorderedCategories);
      } catch (error) {
        console.error('Error updating order:', error);
        // Reload on error to revert
        await loadCategories();
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Categories</Typography>
        <Button variant="contained" onClick={handleAdd}>
          Add Category
        </Button>
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
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
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
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => (
                    <SortableCategoryRow
                      key={category.id}
                      category={category}
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

      <CategoryForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        category={editingCategory}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={categoryToDelete?.name || ''}
      />
    </Box>
  );
}
