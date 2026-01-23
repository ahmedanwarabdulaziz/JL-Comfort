'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DimensionRule, RangeRule } from '@/lib/types/dimension-rules';
import {
  getDimensionRules,
  createDimensionRule,
  updateDimensionRule,
  deleteDimensionRule as deleteRuleApi,
} from '@/lib/data/dimension-rules';
import { DimensionType } from '@/lib/types/foam';

export default function DimensionsRulesList() {
  const [rules, setRules] = useState<DimensionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DimensionRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<DimensionRule | null>(null);

  // Form state
  const [dimensionType, setDimensionType] = useState<DimensionType>('width');
  const [allowFractions, setAllowFractions] = useState(true);
  const [minValue, setMinValue] = useState<number | undefined>(undefined);
  const [maxValue, setMaxValue] = useState<number | undefined>(undefined);
  const [ranges, setRanges] = useState<RangeRule[]>([]);

  // Range form state
  const [rangeFormOpen, setRangeFormOpen] = useState(false);
  const [editingRangeIndex, setEditingRangeIndex] = useState<number | null>(null);
  const [rangeMin, setRangeMin] = useState<number>(0);
  const [rangeMax, setRangeMax] = useState<number | null>(null);
  const [roundTo, setRoundTo] = useState<number>(0);

  const dimensionTypes: DimensionType[] = ['width', 'depth', 'thickness'];

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDimensionRules();
      setRules(data);
    } catch (error) {
      console.error('Error loading dimension rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingRule(null);
    setDimensionType('width');
    setAllowFractions(true);
    setMinValue(undefined);
    setMaxValue(undefined);
    setRanges([]);
    setFormOpen(true);
  };

  const handleEdit = (rule: DimensionRule) => {
    setEditingRule(rule);
    setDimensionType(rule.dimensionType);
    setAllowFractions(rule.allowFractions);
    setMinValue(rule.minValue);
    setMaxValue(rule.maxValue);
    setRanges([...rule.ranges]);
    setFormOpen(true);
  };

  const handleDelete = (rule: DimensionRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (ruleToDelete) {
      try {
        await deleteRuleApi(ruleToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setRuleToDelete(null);
      } catch (error) {
        console.error('Error deleting dimension rule:', error);
      }
    }
  };

  const handleFormSave = async () => {
    try {
      const input = {
        dimensionType,
        allowFractions,
        minValue,
        maxValue,
        ranges: ranges.sort((a, b) => a.min - b.min), // Sort ranges by min
      };

      if (editingRule) {
        await updateDimensionRule(editingRule.id, input);
      } else {
        await createDimensionRule(input);
      }

      await loadData();
      setFormOpen(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Error saving dimension rule:', error);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingRule(null);
    setRanges([]);
  };

  // Range management
  const handleAddRange = () => {
    setEditingRangeIndex(null);
    setRangeMin(0);
    setRangeMax(null);
    setRoundTo(0);
    setRangeFormOpen(true);
  };

  const handleEditRange = (index: number) => {
    // Get the sorted ranges to find the correct range
    const sortedRanges = [...ranges].sort((a, b) => a.min - b.min);
    const range = sortedRanges[index];
    // Find the original index in the unsorted array
    const originalIndex = ranges.findIndex(
      (r) => r.min === range.min && r.max === range.max && r.roundTo === range.roundTo
    );
    setEditingRangeIndex(originalIndex);
    setRangeMin(range.min);
    setRangeMax(range.max ?? null);
    setRoundTo(range.roundTo);
    setRangeFormOpen(true);
  };

  const handleDeleteRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleSaveRange = () => {
    const newRange: RangeRule = {
      min: rangeMin,
      max: rangeMax,
      roundTo: roundTo,
    };

    if (editingRangeIndex !== null) {
      const updated = [...ranges];
      updated[editingRangeIndex] = newRange;
      setRanges(updated);
    } else {
      setRanges([...ranges, newRange]);
    }

    setRangeFormOpen(false);
    setEditingRangeIndex(null);
  };

  const getRuleForDimension = (type: DimensionType): DimensionRule | undefined => {
    return rules.find((r) => r.dimensionType === type);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Dimension Rules</Typography>
        <Button variant="contained" onClick={handleAdd} startIcon={<AddIcon />}>
          Add Rule
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure rules for how dimensions (width, depth, thickness) are calculated and rounded.
        You can set whether fractions are allowed, min/max values, and custom rounding ranges.
      </Alert>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {dimensionTypes.map((type) => {
            const rule = getRuleForDimension(type);
            return (
              <Card key={type}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {type}
                    </Typography>
                    {rule ? (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(rule)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(rule)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Button size="small" onClick={handleAdd}>
                        Create Rule
                      </Button>
                    )}
                  </Box>

                  {rule ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Allow Fractions: {rule.allowFractions ? 'Yes' : 'No'}
                      </Typography>
                      {rule.minValue !== undefined && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Min Value: {rule.minValue} inches
                        </Typography>
                      )}
                      {rule.maxValue !== undefined && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Max Value: {rule.maxValue} inches
                        </Typography>
                      )}
                      {rule.ranges.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Rounding Ranges:
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Min</TableCell>
                                  <TableCell>Max</TableCell>
                                  <TableCell>Round To</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rule.ranges.map((range, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{range.min}</TableCell>
                                    <TableCell>
                                      {range.max === null ? '∞' : range.max}
                                    </TableCell>
                                    <TableCell>{range.roundTo}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No rule configured
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Rule Form Dialog */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Dimension Rule' : 'Add Dimension Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Dimension Type</InputLabel>
              <Select
                value={dimensionType}
                onChange={(e) => setDimensionType(e.target.value as DimensionType)}
                label="Dimension Type"
                disabled={!!editingRule}
              >
                {dimensionTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={allowFractions}
                  onChange={(e) => setAllowFractions(e.target.checked)}
                />
              }
              label="Allow Fractions"
            />

            <TextField
              label="Minimum Value (inches)"
              type="number"
              value={minValue ?? ''}
              onChange={(e) =>
                setMinValue(e.target.value ? parseFloat(e.target.value) : undefined)
              }
              inputProps={{ step: '0.1' }}
              helperText="Leave empty for no minimum"
            />

            <TextField
              label="Maximum Value (inches)"
              type="number"
              value={maxValue ?? ''}
              onChange={(e) =>
                setMaxValue(e.target.value ? parseFloat(e.target.value) : undefined)
              }
              inputProps={{ step: '0.1' }}
              helperText="Leave empty for no maximum"
            />

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle1">Rounding Ranges</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddRange}
                >
                  Add Range
                </Button>
              </Box>

              {ranges.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Min</TableCell>
                        <TableCell>Max</TableCell>
                        <TableCell>Round To</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ranges
                        .sort((a, b) => a.min - b.min)
                        .map((range, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{range.min}</TableCell>
                            <TableCell>
                              {range.max === null ? '∞' : range.max}
                            </TableCell>
                            <TableCell>{range.roundTo}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleEditRange(idx)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRange(idx)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No ranges configured. Values will be used as-is.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>Cancel</Button>
          <Button onClick={handleFormSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Range Form Dialog */}
      <Dialog
        open={rangeFormOpen}
        onClose={() => setRangeFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRangeIndex !== null ? 'Edit Range' : 'Add Range'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Minimum Value"
              type="number"
              value={rangeMin}
              onChange={(e) => setRangeMin(parseFloat(e.target.value) || 0)}
              inputProps={{ step: '0.1' }}
              fullWidth
            />
            <TextField
              label="Maximum Value"
              type="number"
              value={rangeMax ?? ''}
              onChange={(e) =>
                setRangeMax(e.target.value ? parseFloat(e.target.value) : null)
              }
              inputProps={{ step: '0.1' }}
              helperText="Leave empty for no upper limit"
              fullWidth
            />
            <TextField
              label="Round To"
              type="number"
              value={roundTo}
              onChange={(e) => setRoundTo(parseFloat(e.target.value) || 0)}
              inputProps={{ step: '0.1' }}
              helperText="Value will be rounded up to this number"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRangeFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRange} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Dimension Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the rule for{' '}
            <strong>{ruleToDelete?.dimensionType}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
