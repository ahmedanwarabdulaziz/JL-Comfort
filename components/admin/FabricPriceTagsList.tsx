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
import { FabricPriceTag } from '@/lib/types/fabricPriceTag';
import { getFabricPriceTags, deleteFabricPriceTag } from '@/lib/data/fabricPriceTags';
import FabricPriceTagForm from './FabricPriceTagForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function FabricPriceTagsList() {
  const [tags, setTags] = useState<FabricPriceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<FabricPriceTag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<FabricPriceTag | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await getFabricPriceTags();
      setTags(results);
    } catch (error) {
      console.error('Error loading fabric price tags:', error);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingTag(null);
    setFormOpen(true);
  };

  const handleEdit = (tag: FabricPriceTag) => {
    setEditingTag(tag);
    setFormOpen(true);
  };

  const handleDelete = (tag: FabricPriceTag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (tagToDelete) {
      try {
        await deleteFabricPriceTag(tagToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setTagToDelete(null);
      } catch (error) {
        console.error('Error deleting fabric price tag:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTag(null);
  };

  const handleFormSave = async () => {
    await loadData();
    handleFormClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5">Fabric Price Tags</Typography>
          <Typography variant="body2" color="text.secondary">
            $/yard rates you assign to individual Charlotte Fabrics items from the Fabric Catalog page.
            Editing a tag&apos;s price here updates every item using it.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleAdd}>
          Add Price Tag
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tag</TableCell>
              <TableCell>Price / Yard</TableCell>
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
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No fabric price tags found
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{tag.name}</Typography>
                  </TableCell>
                  <TableCell>${tag.pricePerYard.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(tag)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(tag)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FabricPriceTagForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        tag={editingTag}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={tagToDelete?.name || ''}
      />
    </Box>
  );
}
