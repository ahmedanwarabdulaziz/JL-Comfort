'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  ButtonBase,
  LinearProgress,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import { uploadImageWithProgress } from '@/lib/uploadWithProgress';

interface MediaImage {
  url: string;
  path: string;
}

interface ImagePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function ImagePickerDialog({ open, onClose, onSelect }: ImagePickerDialogProps) {
  const [tab, setTab] = useState<'gallery' | 'upload'>('gallery');
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab('gallery');
    setError(null);
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadImages = async () => {
    setLoadingImages(true);
    try {
      const response = await fetch('/api/media', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load images');
      setImages(data.images || []);
    } catch (err: any) {
      console.error('Error loading media gallery:', err);
      setError(err.message || 'Failed to load images');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const data = await uploadImageWithProgress(file, setUploadProgress);
      onSelect(data.url);
      onClose();
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Choose Image</DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Choose from Gallery" value="gallery" />
          <Tab label="Upload New" value="upload" />
        </Tabs>
      </Box>
      <DialogContent sx={{ minHeight: 320 }}>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {tab === 'gallery' && (
          <>
            {loadingImages ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : images.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                No previously uploaded images found. Switch to &quot;Upload New&quot; to add one.
              </Typography>
            ) : (
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {images.map((img) => (
                  <Grid item key={img.path} xs={4} sm={3} md={2}>
                    <ButtonBase
                      onClick={() => {
                        onSelect(img.url);
                        onClose();
                      }}
                      sx={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'white',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </ButtonBase>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
        {tab === 'upload' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Select Image File'}
              <input type="file" accept="image/*" onChange={handleUpload} hidden />
            </Button>
            {uploadProgress !== null && (
              <Box sx={{ width: '100%', maxWidth: 280 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Uploading...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {uploadProgress}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG, or WebP, up to 10MB
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
