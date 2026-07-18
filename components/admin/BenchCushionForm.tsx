'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Divider,
  Stack,
  InputAdornment,
  ButtonBase,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import StraightenIcon from '@mui/icons-material/Straighten';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  BenchCushionStyle,
  BenchCushionStyleInput,
  CushionVariable,
} from '@/lib/types/benchCushion';
import { DimensionType } from '@/lib/types/foam';
import {
  createBenchCushionStyle,
  updateBenchCushionStyle,
} from '@/lib/data/benchCushions';
import ImagePickerDialog from './ImagePickerDialog';
import { uploadImageWithProgress } from '@/lib/uploadWithProgress';

interface BenchCushionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  style?: BenchCushionStyle | null;
}

const emptyFormData: BenchCushionStyleInput = {
  name: '',
  description: '',
  images: [],
  dimensions: [],
  variables: [],
  basePrice: 0,
  currency: 'usd',
};

export default function BenchCushionForm({
  open,
  onClose,
  onSave,
  style,
}: BenchCushionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BenchCushionStyleInput>(emptyFormData);

  useEffect(() => {
    if (style) {
      setFormData({
        name: style.name,
        description: style.description || '',
        images: style.images || [],
        dimensions: style.dimensions || [],
        variables: style.variables || [],
        basePrice: style.basePrice ?? 0,
        currency: style.currency || 'usd',
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [style, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImageUploadProgress(0);
    try {
      const data = await uploadImageWithProgress(file, setImageUploadProgress);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, data.url],
      }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image.');
    } finally {
      setLoading(false);
      setImageUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleImageRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // The first image in the array is treated as the primary/thumbnail image
  const handleSetPrimaryImage = (index: number) => {
    setFormData((prev) => {
      if (index === 0) return prev;
      const images = [...prev.images];
      const [selected] = images.splice(index, 1);
      images.unshift(selected);
      return { ...prev, images };
    });
  };

  const handleAddDimension = () => {
    setFormData((prev) => ({
      ...prev,
      dimensions: [
        ...prev.dimensions,
        { type: 'width', name: '', value: 0, unit: 'inch', letterShortcut: '' },
      ],
    }));
  };

  const handleRemoveDimension = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.filter((_, i) => i !== index),
    }));
  };

  const handleDimensionChange = (
    index: number,
    field: 'type' | 'name' | 'value' | 'unit' | 'letterShortcut',
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((dim, i) =>
        i === index ? { ...dim, [field]: value } : dim
      ),
    }));
  };

  const handleAddVariable = () => {
    setFormData((prev) => ({
      ...prev,
      variables: [...prev.variables, { name: '', options: [] }],
    }));
  };

  const handleRemoveVariable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  const handleVariableNameChange = (index: number, name: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) => (i === index ? { ...v, name } : v)),
    }));
  };

  const handleAddOption = (variableIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) =>
        i === variableIndex
          ? { ...v, options: [...v.options, { label: '', priceModifier: 0 }] }
          : v
      ),
    }));
  };

  const handleRemoveOption = (variableIndex: number, optionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) =>
        i === variableIndex
          ? { ...v, options: v.options.filter((_, oi) => oi !== optionIndex) }
          : v
      ),
    }));
  };

  const handleOptionChange = (
    variableIndex: number,
    optionIndex: number,
    field: 'label' | 'priceModifier' | 'imageUrl',
    value: string | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) =>
        i === variableIndex
          ? {
              ...v,
              options: v.options.map((o, oi) =>
                oi === optionIndex ? { ...o, [field]: value } : o
              ),
            }
          : v
      ),
    }));
  };

  const [imagePickerTarget, setImagePickerTarget] = useState<{
    variableIndex: number;
    optionIndex: number;
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (style) {
        await updateBenchCushionStyle(style.id, formData);
      } else {
        await createBenchCushionStyle(formData);
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving bench cushion style:', error);
      alert(error?.message || 'Failed to save bench cushion style.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {style ? 'Edit Bench Cushion Style' : 'Add New Bench Cushion Style'}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={4}>
          {/* Basic Information Section */}
          <Box>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Style Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Rectangular Bench Cushion, Waterfall Edge"
                  helperText="Enter a descriptive name for this cushion style"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Base Price"
                  name="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basePrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  SelectProps={{ native: true }}
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="usd">USD</option>
                  <option value="cad">CAD</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Optional description for this cushion style"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Dimensions Section */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StraightenIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="600">
                  Dimensions
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddDimension}
                variant="contained"
                size="small"
                color="primary"
              >
                Add Dimension
              </Button>
            </Box>
            {formData.dimensions.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  No dimensions added yet. Click &quot;Add Dimension&quot; to define width, depth, thickness, etc.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {formData.dimensions.map((dimension, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    variant="outlined"
                    sx={{ p: 2.5, backgroundColor: 'grey.50', '&:hover': { backgroundColor: 'grey.100' } }}
                  >
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          select
                          SelectProps={{ native: true }}
                          label="Dimension Type"
                          value={dimension.type}
                          onChange={(e) =>
                            handleDimensionChange(index, 'type', e.target.value as DimensionType)
                          }
                          required
                          size="small"
                        >
                          <option value="width">Width</option>
                          <option value="depth">Depth</option>
                          <option value="thickness">Thickness</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Dimension Name"
                          placeholder="e.g., top width, bottom width"
                          value={dimension.name}
                          onChange={(e) => handleDimensionChange(index, 'name', e.target.value)}
                          required
                          size="small"
                          helperText="Custom name for this dimension"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Letter Shortcut"
                          placeholder="e.g., A, B, W"
                          value={dimension.letterShortcut || ''}
                          onChange={(e) =>
                            handleDimensionChange(index, 'letterShortcut', e.target.value.toUpperCase())
                          }
                          size="small"
                          inputProps={{ maxLength: 1 }}
                          helperText="For image reference"
                        />
                      </Grid>
                      <Grid item xs={8} sm={2}>
                        <TextField
                          fullWidth
                          label="Default Value"
                          type="number"
                          value={dimension.value}
                          onChange={(e) =>
                            handleDimensionChange(index, 'value', parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          inputProps={{ step: '0.01', min: '0' }}
                          helperText="Editable by customer"
                        />
                      </Grid>
                      <Grid item xs={4} sm={1}>
                        <TextField
                          fullWidth
                          label="Unit"
                          value="inch"
                          disabled
                          size="small"
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveDimension(index)}
                          size="small"
                          sx={{ mt: 0.5, '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' } }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Variables Section */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TuneIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="600">
                  Style Options
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddVariable}
                variant="contained"
                size="small"
                color="primary"
              >
                Add Option Group
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define customer-selectable options like Edge Style, Fill Type, Tufting, or Piping. Each choice can add to the base price.
            </Typography>
            {formData.variables.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  No option groups added yet. Click &quot;Add Option Group&quot; to define Edge Style, Fill Type, etc.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {formData.variables.map((variable: CushionVariable, vIndex) => (
                  <Paper key={vIndex} variant="outlined" sx={{ p: 2.5, backgroundColor: 'grey.50' }}>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                      <Grid item xs>
                        <TextField
                          fullWidth
                          label="Option Group Name"
                          placeholder="e.g., Edge Style, Fill Type, Tufting, Piping"
                          value={variable.name}
                          onChange={(e) => handleVariableNameChange(vIndex, e.target.value)}
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid item>
                        <IconButton color="error" onClick={() => handleRemoveVariable(vIndex)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                    <Stack spacing={1.5} sx={{ pl: 2 }}>
                      {variable.options.map((option, oIndex) => (
                        <Grid container spacing={2} key={oIndex} alignItems="center">
                          <Grid item xs="auto">
                            <Box sx={{ position: 'relative' }}>
                              <ButtonBase
                                onClick={() => setImagePickerTarget({ variableIndex: vIndex, optionIndex: oIndex })}
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  border: '1px dashed',
                                  borderColor: 'divider',
                                  backgroundColor: 'white',
                                  '&:hover': { borderColor: 'primary.main' },
                                }}
                              >
                                {option.imageUrl ? (
                                  <img
                                    src={option.imageUrl}
                                    alt={option.label}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <ImageIcon fontSize="small" color="disabled" />
                                )}
                              </ButtonBase>
                              {option.imageUrl && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleOptionChange(vIndex, oIndex, 'imageUrl', null)}
                                  sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    width: 18,
                                    height: 18,
                                    backgroundColor: 'error.main',
                                    color: 'white',
                                    '&:hover': { backgroundColor: 'error.dark' },
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs>
                            <TextField
                              fullWidth
                              size="small"
                              label="Choice Label"
                              placeholder="e.g., Box Edge, Navy Boucle"
                              value={option.label}
                              onChange={(e) =>
                                handleOptionChange(vIndex, oIndex, 'label', e.target.value)
                              }
                            />
                          </Grid>
                          <Grid item xs={4} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Price Modifier"
                              type="number"
                              value={option.priceModifier}
                              onChange={(e) =>
                                handleOptionChange(
                                  vIndex,
                                  oIndex,
                                  'priceModifier',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          </Grid>
                          <Grid item xs="auto">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveOption(vIndex, oIndex)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(vIndex)}
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Add Choice
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Images Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ImageIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="600">
                Gallery Images
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Box sx={{ mb: 2 }}>
                <Button variant="outlined" component="label" startIcon={<ImageIcon />} size="small" disabled={loading}>
                  Add Image
                  <input type="file" accept="image/*" onChange={handleImageAdd} hidden />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Upload one or more reference images for this cushion style
                </Typography>
                {imageUploadProgress !== null && (
                  <Box sx={{ mt: 1.5, maxWidth: 320 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Uploading...
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {imageUploadProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={imageUploadProgress} />
                  </Box>
                )}
              </Box>
              {formData.images.length > 0 ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                    The primary image is used as the thumbnail in listings. Click the star to make an image primary.
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.images.map((url, index) => {
                      const isPrimary = index === 0;
                      return (
                        <Grid item key={url + index}>
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              sx={{
                                width: 120,
                                height: 120,
                                backgroundColor: 'white',
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '2px solid',
                                borderColor: isPrimary ? 'primary.main' : 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <img src={url} alt={`Image ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </Box>
                            {isPrimary && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  lineHeight: 1.4,
                                }}
                              >
                                Primary
                              </Box>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleSetPrimaryImage(index)}
                              disabled={isPrimary}
                              title={isPrimary ? 'Primary image' : 'Set as primary'}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                left: -8,
                                backgroundColor: 'white',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { backgroundColor: 'grey.100' },
                              }}
                            >
                              {isPrimary ? (
                                <StarIcon fontSize="small" color="primary" />
                              ) : (
                                <StarBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleImageRemove(index)}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: 'error.main',
                                color: 'white',
                                '&:hover': { backgroundColor: 'error.dark' },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 150,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No images uploaded
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name}
          size="large"
        >
          {loading ? 'Saving...' : style ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
      <ImagePickerDialog
        open={imagePickerTarget !== null}
        onClose={() => setImagePickerTarget(null)}
        onSelect={(url) => {
          if (imagePickerTarget) {
            handleOptionChange(
              imagePickerTarget.variableIndex,
              imagePickerTarget.optionIndex,
              'imageUrl',
              url
            );
          }
        }}
      />
    </Dialog>
  );
}
