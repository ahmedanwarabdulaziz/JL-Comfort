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
  Switch,
  Tooltip,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StyleIcon from '@mui/icons-material/Style';
import { FabricGroup } from '@/lib/types/fabricGroup';
import { getFabricGroups, deleteFabricGroup, updateFabricGroup } from '@/lib/data/fabricGroups';
import { supabase } from '@/lib/supabase/client';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import FabricGroupForm from './FabricGroupForm';
import GroupFabricsDialog from './GroupFabricsDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function FabricGroupsList() {
  const [groups, setGroups] = useState<FabricGroup[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FabricGroup | null>(null);
  const [managingGroup, setManagingGroup] = useState<FabricGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<FabricGroup | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await getFabricGroups();
      setGroups(results);

      const client = supabase;
      if (client) {
        // fabric_group_members has no `id` column (its key is fabric_id+group_id), so order by group_id.
        const rows = await fetchAllRows<{ group_id: string }>(() => client.from('fabric_group_members').select('group_id'), 'group_id');
        const tally: Record<string, number> = {};
        for (const row of rows) tally[row.group_id] = (tally[row.group_id] || 0) + 1;
        setCounts(tally);
      }
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

  const toggleHomepage = async (group: FabricGroup, value: boolean) => {
    setTogglingId(group.id);
    setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, showOnHomepage: value } : g)));
    try {
      await updateFabricGroup(group.id, { showOnHomepage: value });
    } catch (error) {
      console.error('Error toggling homepage visibility:', error);
      await loadData();
    } finally {
      setTogglingId(null);
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
            Curated collections (e.g. &quot;Most Selling Fabrics&quot;). Add fabrics by searching directly on a group
            (&quot;Manage fabrics&quot;), or by bulk-selecting rows on the Fabric Catalog Sync page. Turn on
            &quot;On homepage&quot; to feature a group on the storefront, with starred fabrics as its cover photos.
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
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Fabrics</TableCell>
              <TableCell align="center">On Homepage</TableCell>
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
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No fabric groups found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id} hover>
                  <TableCell sx={{ width: 48 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {group.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={group.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <StyleIcon fontSize="small" color="disabled" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{group.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      icon={<StyleIcon sx={{ fontSize: 16 }} />}
                      label={counts[group.id] || 0}
                      variant="outlined"
                      onClick={() => setManagingGroup(group)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={group.showOnHomepage ? 'Shown on the homepage' : 'Not shown on the homepage'}>
                      <Switch
                        size="small"
                        checked={group.showOnHomepage}
                        disabled={togglingId === group.id}
                        onChange={(e) => toggleHomepage(group, e.target.checked)}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Manage fabrics in this group">
                      <IconButton size="small" onClick={() => setManagingGroup(group)}>
                        <StyleIcon />
                      </IconButton>
                    </Tooltip>
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

      {managingGroup && (
        <GroupFabricsDialog
          group={managingGroup}
          onClose={() => {
            setManagingGroup(null);
            loadData();
          }}
        />
      )}

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
