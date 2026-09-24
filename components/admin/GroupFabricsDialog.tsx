'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { FabricGroup, FabricGroupMember, FabricSearchResult } from '@/lib/types/fabricGroup';
import {
  addFabricToGroup,
  getGroupMembers,
  removeFabricFromGroup,
  searchFabricsToAdd,
  setGroupMemberFeatured,
} from '@/lib/data/fabricGroups';

const MAX_FEATURED_HINT = 6; // how many featured photos the homepage tile actually shows

export default function GroupFabricsDialog({ group, onClose }: { group: FabricGroup; onClose: () => void }) {
  const [members, setMembers] = useState<FabricGroupMember[] | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FabricSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setMembers(await getGroupMembers(group.id));
    } catch (err: any) {
      setError(err.message || 'Failed to load this group’s fabrics.');
      setMembers([]);
    }
  }, [group.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || !members) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setResults(await searchFabricsToAdd(query, members.map((m) => m.fabricId)));
      } catch (err: any) {
        setError(err.message || 'Search failed.');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, members]);

  const handleAdd = async (fabric: FabricSearchResult) => {
    setBusyId(fabric.id);
    setError('');
    try {
      await addFabricToGroup(group.id, fabric.id);
      setResults((prev) => prev.filter((r) => r.id !== fabric.id));
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Could not add that fabric.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (member: FabricGroupMember) => {
    setBusyId(member.fabricId);
    setError('');
    try {
      await removeFabricFromGroup(group.id, member.fabricId);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Could not remove that fabric.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (member: FabricGroupMember) => {
    setBusyId(member.fabricId);
    setError('');
    try {
      await setGroupMemberFeatured(group.id, member.fabricId, !member.isFeatured);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Could not update the featured fabric.');
    } finally {
      setBusyId(null);
    }
  };

  const featuredCount = members?.filter((m) => m.isFeatured).length ?? 0;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { height: '80vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6 }}>
        Fabrics in &quot;{group.name}&quot;
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box sx={{ p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {group.showOnHomepage && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              This group is shown on the homepage. Star up to {MAX_FEATURED_HINT} fabrics below to choose its cover photos
              {featuredCount === 0 ? ' — none starred yet, so the first fabrics added are used.' : `. ${featuredCount} starred now.`}
            </Alert>
          )}
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder="Search by fabric name or SKU to add…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searching ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            }}
          />
          {query.trim() && (
            <Box sx={{ mt: 1, maxHeight: 220, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {!searching && results.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                  No matching fabrics{members && members.length > 0 ? ' (or already in this group)' : ''}.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {results.map((fabric) => (
                    <ListItem
                      key={fabric.id}
                      secondaryAction={
                        <IconButton edge="end" size="small" disabled={busyId === fabric.id} onClick={() => handleAdd(fabric)} aria-label={`Add ${fabric.name}`}>
                          {busyId === fabric.id ? <CircularProgress size={16} /> : <AddIcon fontSize="small" />}
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={fabric.imageUrl || undefined}>
                          {fabric.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={fabric.name} secondary={fabric.sku} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="subtitle2">{members ? `${members.length} fabric${members.length === 1 ? '' : 's'} in this group` : 'Loading…'}</Typography>
            {group.showOnHomepage && featuredCount > 0 && <Chip size="small" icon={<StarIcon sx={{ fontSize: 16 }} />} label={`${featuredCount} featured`} color="primary" variant="outlined" />}
          </Box>

          {!members ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : members.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No fabrics yet. Search above, or bulk-add from the Fabric Catalog Sync page.
            </Typography>
          ) : (
            <List dense disablePadding>
              {members.map((member) => (
                <ListItem
                  key={member.fabricId}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {group.showOnHomepage && (
                        <Tooltip title={member.isFeatured ? 'Featured on homepage — click to unstar' : 'Star to feature on homepage'}>
                          <IconButton edge="end" size="small" disabled={busyId === member.fabricId} onClick={() => toggleFeatured(member)} aria-label={`${member.isFeatured ? 'Unfeature' : 'Feature'} ${member.name}`}>
                            {member.isFeatured ? <StarIcon fontSize="small" color="primary" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Remove from group">
                        <IconButton edge="end" size="small" disabled={busyId === member.fabricId} onClick={() => handleRemove(member)} aria-label={`Remove ${member.name}`}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={member.imageUrl || undefined}>
                      {member.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={member.name} secondary={member.sku} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
