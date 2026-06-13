'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import StraightenIcon from '@mui/icons-material/Straighten';
import { FoamType, FoamTypeInput, FoamDimension, DimensionType } from '@/lib/types/foam';
import { Category } from '@/lib/types/category';
import {
  createFoamType,
  updateFoamType,
} from '@/lib/data/foam';
import { getCategories } from '@/lib/data/categories';

interface FoamTypeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  foamType?: FoamType | null;
}

export default function FoamTypeForm({
  open,
  onClose,
  onSave,
  foamType,
}: FoamTypeFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FoamTypeInput>({
    categoryId: '',
    name: '',
    description: '',
    imageUrl: null,
    svgId: '',
    customSvgContent: '',
    dimensions: [],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (foamType) {
      setFormData({
        categoryId: foamType.categoryId,
        name: foamType.name,
        description: foamType.description || '',
        imageUrl: foamType.imageUrl,
        svgId: foamType.svgId || '',
        dimensions: foamType.dimensions || [],
      });
      setImagePreview(foamType.imageUrl);
    } else {
      setFormData({
        categoryId: '',
        name: '',
        description: '',
        imageUrl: null,
        svgId: '',
        dimensions: [],
      });
      setImagePreview(null);
    }
  }, [foamType, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setImagePreview(preview);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudflare R2
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Failed to upload image';
          const errorDetails = errorData.details || '';
          const errorHelp = errorData.help || '';
          
          // Show detailed error message
          const fullMessage = errorHelp 
            ? `${errorMessage}\n\n${errorDetails}\n\n${errorHelp}`
            : errorDetails 
            ? `${errorMessage}\n\n${errorDetails}`
            : errorMessage;
          
          throw new Error(fullMessage);
        }

        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          imageUrl: data.url,
        }));
      } catch (error: any) {
        console.error('Error uploading image:', error);
        // Show user-friendly error message
        const errorMessage = error.message || 'Failed to upload image. Please check your Cloudflare R2 configuration.';
        alert(errorMessage);
        setImagePreview(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        customSvgContent: content,
      }));
    };
    reader.readAsText(file);
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (foamType) {
        await updateFoamType(foamType.id, formData);
      } else {
        await createFoamType(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving foam type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {foamType ? 'Edit Foam Type' : 'Add New Foam Type'}
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
                  select
                  label="Category"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  disabled={categories.length === 0}
                  helperText={
                    categories.length === 0
                      ? 'No categories available. Please add categories first.'
                      : 'Select a category for this foam type'
                  }
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Foam Type Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Square, Rectangle, Angel End Seat"
                  helperText="Enter a descriptive name for this foam type"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Interactive SVG Shape (Optional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    If you want an interactive shape, upload your .svg file here. Leave this blank to just use the static image above.
                  </Typography>
                  <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                    Upload .svg File
                    <input
                      type="file"
                      accept=".svg"
                      onChange={handleSvgUpload}
                      hidden
                    />
                  </Button>
                  <TextField
                    fullWidth
                    label="Raw SVG Content"
                    name="customSvgContent"
                    value={formData.customSvgContent || ''}
                    onChange={handleChange}
                    multiline
                    rows={6}
                    placeholder="<svg>...</svg>"
                    helperText="You can also manually paste or edit the SVG code here. Make sure to use {{A}}, {{B}}, etc. for dynamic dimensions."
                    InputProps={{
                      sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                    }}
                  />
                </Box>
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
                  placeholder="Optional description for this foam type"
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
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'grey.50',
                }}
              >
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
                    sx={{
                      p: 2.5,
                      backgroundColor: 'grey.50',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                    }}
                  >
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          select
                          label="Dimension Type"
                          value={dimension.type}
                          onChange={(e) =>
                            handleDimensionChange(index, 'type', e.target.value as DimensionType)
                          }
                          required
                          size="small"
                        >
                          <MenuItem value="width">Width</MenuItem>
                          <MenuItem value="depth">Depth</MenuItem>
                          <MenuItem value="thickness">Thickness</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Dimension Name"
                          placeholder="e.g., top width, bottom width"
                          value={dimension.name}
                          onChange={(e) =>
                            handleDimensionChange(index, 'name', e.target.value)
                          }
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
                            handleDimensionChange(
                              index,
                              'value',
                              parseFloat(e.target.value) || 0
                            )
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
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveDimension(index)}
                          size="small"
                          sx={{
                            mt: 0.5,
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.contrastText',
                            },
                          }}
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

          {/* Image Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ImageIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="600">
                Diagram Image
              </Typography>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                  size="small"
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Upload a diagram image for this foam type
                </Typography>
              </Box>
              {imagePreview && (
                <Box
                  sx={{
                    mt: 2,
                    width: '100%',
                    maxHeight: 300,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}
              {!imagePreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
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
                    No image uploaded
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Note: Cloudflare upload integration will be added in a future update
              </Typography>
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
          disabled={loading || !formData.name || !formData.categoryId}
          size="large"
        >
          {loading ? 'Saving...' : foamType ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
