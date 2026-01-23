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
} from '@mui/material';
import { Product, ProductInput, ProductStatus } from '@/lib/types/product';
import {
  createProduct,
  updateProduct,
} from '@/lib/data/products';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  product?: Product | null;
}

export default function ProductForm({
  open,
  onClose,
  onSave,
  product,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    currency: 'EGP',
    status: 'draft',
    imageUrl: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        status: product.status,
        imageUrl: product.imageUrl,
      });
      setImagePreview(product.imageUrl);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'EGP',
        status: 'draft',
        imageUrl: null,
      });
      setImagePreview(null);
    }
  }, [product, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (product) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {product ? 'Edit Product' : 'Add Product'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            required
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <TextField
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
            />
          </Box>
          <TextField
            fullWidth
            select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Active</MenuItem>
          </TextField>
          <Box>
            <Typography variant="body2" gutterBottom>
              Image
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ marginBottom: 8 }}
            />
            {imagePreview && (
              <Box
                sx={{
                  mt: 1,
                  width: '100%',
                  height: 200,
                  backgroundColor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </Box>
            )}
            <Typography variant="caption" color="text.secondary">
              Images are uploaded to Cloudflare R2
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name || !formData.description}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
