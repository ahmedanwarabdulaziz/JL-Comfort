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
import { FabricGroup } from '@/lib/types/fabricGroup';
import { getFabricGroups, deleteFabricGroup } from '@/lib/data/fabricGroups';
import FabricGroupForm from './FabricGroupForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function FabricGroupsList() {
  const [groups, setGroups] = useState<FabricGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FabricGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<FabricGroup | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await getFabricGroups();
      setGroups(results);
    } catch (error) {
      console.error('Error loading fabric groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingGroup(null);
    setFormOpen(true);
  };

  const handleEdit = (group: FabricGroup) => {
    setEditingGroup(group);
    setFormOpen(true);
  };

  const handleDelete = (group: FabricGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (groupToDelete) {
      try {
        await deleteFabricGroup(groupToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setGroupToDelete(null);
      } catch (error) {
        console.error('Error deleting fabric group:', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingGroup(null);
  };

  const handleFormSave = async () => {
    await loadData();
    handleFormClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5">Fabric Groups</Typography>
          <Typography variant="body2" color="text.secondary">
            Curated collections (e.g. &quot;Most Selling Fabrics&quot;) — assign items from the Fabric
            Catalog page. Admin-only for now, not shown to customers yet.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleAdd}>
          Add Group
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
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
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No fabric groups found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{group.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(group)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(group)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FabricGroupForm open={formOpen} onClose={handleFormClose} onSave={handleFormSave} group={editingGroup} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={confirmDelete}
        productName={groupToDelete?.name || ''}
      />
    </Box>
  );
}
