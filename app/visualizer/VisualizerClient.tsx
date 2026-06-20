'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import Link from 'next/link';
import { FabricItem, VisualizationResult, PreferencesState } from '@/lib/types/fabric';

// ─── Constants ─────────────────────────────────────────────────────────────

const STYLES = [
  { label: 'Modern', icon: '⬛' },
  { label: 'Traditional', icon: '🏛️' },
  { label: 'Bohemian', icon: '🌿' },
  { label: 'Mid-Century Modern', icon: '🔶' },
  { label: 'Coastal', icon: '🌊' },
  { label: 'Industrial', icon: '⚙️' },
  { label: 'Glam', icon: '✨' },
  { label: 'Farmhouse', icon: '🌾' },
];

const COLORS = [
  { label: 'Neutral', swatch: 'linear-gradient(135deg, #D2C4B0 0%, #E8E0D5 100%)' },
  { label: 'Warm', swatch: 'linear-gradient(135deg, #C4602A 0%, #E8A040 100%)' },
  { label: 'Cool', swatch: 'linear-gradient(135deg, #2040A0 0%, #2D8A9A 100%)' },
  { label: 'Bold', swatch: 'linear-gradient(135deg, #8B0000 0%, #4B0082 100%)' },
  { label: 'Earth', swatch: 'linear-gradient(135deg, #8B5E3C 0%, #6B8E5A 100%)' },
  { label: 'Pastel', swatch: 'linear-gradient(135deg, #E8C4CF 0%, #C4D9E8 100%)' },
  { label: 'Dark & Moody', swatch: 'linear-gradient(135deg, #1A1A2E 0%, #2C3E50 100%)' },
  { label: 'Multi-Color', swatch: 'linear-gradient(135deg, #E8402A 0%, #4040C0 50%, #2D8A4A 100%)' },
];

const FABRIC_TYPES = [
  { label: 'Velvet', desc: 'Soft & Luxe' },
  { label: 'Linen', desc: 'Natural & Airy' },
  { label: 'Leather', desc: 'Classic & Durable' },
  { label: 'Performance', desc: 'Stain-Resistant' },
  { label: 'Patterned', desc: 'Bold Designs' },
  { label: 'Textured', desc: 'Depth & Character' },
  { label: 'Solid', desc: 'Clean & Simple' },
  { label: 'Microfiber', desc: 'Ultra-Soft' },
];

const STEP_LABELS = ['Upload Photo', 'Your Preferences', 'Choose Fabric', 'AI Preview'];

// ─── Design Tokens ──────────────────────────────────────────────────────────

const BG = '#080C18';
const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const ACCENT = '#7C3AED';
const ACCENT2 = '#EC4899';
const TEXT = '#F0F4FF';
const MUTED = '#8892AA';

// ─── Shared Styles ───────────────────────────────────────────────────────────

const glassCard = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  return (
    <Box sx={{ width: '100%', background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${CARD_BORDER}`, position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 2.5 }}>
        {/* Logo + nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px' }}>
              JL <span style={{ color: ACCENT }}>Comfort</span>
            </Typography>
          </Link>
          <Typography sx={{ color: MUTED, fontSize: 13 }}>
            AI Furniture Visualizer
          </Typography>
        </Box>

        {/* Step indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const isActive = n === step;
            const isDone = n < step;
            return (
              <Box key={n} sx={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isDone ? ACCENT : isActive ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(255,255,255,0.08)',
                    border: isActive ? 'none' : `2px solid ${isDone ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 20px ${ACCENT}80` : 'none',
                  }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: isDone || isActive ? '#fff' : MUTED }}>
                      {isDone ? '✓' : n}
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    color: isActive ? TEXT : isDone ? ACCENT : MUTED,
                    display: { xs: 'none', sm: 'block' },
                    transition: 'color 0.3s ease',
                  }}>
                    {label}
                  </Typography>
                </Box>
                {n < 4 && (
                  <Box sx={{ flex: 1, height: 2, mx: 1.5, borderRadius: 1, background: isDone ? ACCENT : 'rgba(255,255,255,0.08)', transition: 'background 0.5s ease' }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// ── Step 1: Upload ────────────────────────────────────────────────────────────

function UploadStep({
  previewUrl,
  onFileSelect,
  onNext,
}: {
  previewUrl: string;
  onFileSelect: (file: File) => void;
  onNext: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
      {/* Heading */}
      <Typography sx={{
        fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: TEXT,
        letterSpacing: '-1.5px', lineHeight: 1.1, mb: 2,
        background: `linear-gradient(135deg, ${TEXT} 0%, ${MUTED} 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Reimagine Your Furniture
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 18, mb: 6, fontWeight: 300 }}>
        Upload a photo of your furniture and let AI show you what it looks like with a brand-new fabric.
      </Typography>

      {/* Upload Zone */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        sx={{
          ...glassCard,
          p: 5,
          cursor: previewUrl ? 'default' : 'pointer',
          border: `2px dashed ${isDragOver ? ACCENT : previewUrl ? ACCENT : CARD_BORDER}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': !previewUrl ? {
            borderColor: ACCENT,
            background: 'rgba(124,58,237,0.06)',
            transform: 'translateY(-2px)',
            boxShadow: `0 20px 60px rgba(124,58,237,0.1)`,
          } : {},
        }}
      >
        {/* Background glow when dragging */}
        {isDragOver && (
          <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center, ${ACCENT}20, transparent 70%)`, pointerEvents: 'none' }} />
        )}

        {previewUrl ? (
          <Box>
            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 480 }}>
              <Box
                component="img"
                src={previewUrl}
                alt="Uploaded furniture"
                sx={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 3, display: 'block' }}
              />
              <Box sx={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(0,0,0,0.6)', borderRadius: 2, px: 1.5, py: 0.5,
                backdropFilter: 'blur(10px)',
              }}>
                <Typography sx={{ color: '#4ADE80', fontSize: 12, fontWeight: 600 }}>✓ Photo Ready</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="text"
                onClick={() => fileInputRef.current?.click()}
                sx={{ color: MUTED, '&:hover': { color: TEXT } }}
              >
                Change Photo
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box sx={{ fontSize: 56, mb: 2 }}>🛋️</Box>
            <Typography sx={{ color: TEXT, fontWeight: 600, fontSize: 18, mb: 1 }}>
              Drop your furniture photo here
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 14, mb: 3 }}>
              or click to browse · JPG, PNG, WEBP up to 10MB
            </Typography>
            <Button
              variant="outlined"
              sx={{
                borderColor: `${ACCENT}60`, color: ACCENT,
                borderRadius: '12px', px: 4, py: 1.2,
                '&:hover': { borderColor: ACCENT, background: `${ACCENT}15` },
              }}
            >
              Browse Files
            </Button>
          </Box>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} id="furniture-upload" />
      </Box>

      {/* Tip */}
      {!previewUrl && (
        <Typography sx={{ color: MUTED, fontSize: 13, mt: 3 }}>
          💡 <strong style={{ color: TEXT }}>Tip:</strong> For best results, use a clear photo of the full furniture piece with good lighting.
        </Typography>
      )}

      {/* Next button */}
      {previewUrl && (
        <Button
          id="upload-next-btn"
          variant="contained"
          size="large"
          onClick={onNext}
          sx={{
            mt: 4, px: 6, py: 1.8, fontSize: 17, fontWeight: 700, borderRadius: '14px',
            background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
            boxShadow: `0 8px 32px ${ACCENT}60`,
            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 40px ${ACCENT}80` },
            transition: 'all 0.25s ease',
          }}
        >
          Next: Tell Us Your Style →
        </Button>
      )}
    </Box>
  );
}

// ── Step 2: Preferences ───────────────────────────────────────────────────────

function PreferencesStep({
  preferences,
  onChange,
  onBack,
  onSearch,
  isLoading,
}: {
  preferences: PreferencesState;
  onChange: (prefs: PreferencesState) => void;
  onBack: () => void;
  onSearch: () => void;
  isLoading: boolean;
}) {
  const toggleColor = (color: string) => {
    const next = preferences.colors.includes(color)
      ? preferences.colors.filter((c) => c !== color)
      : [...preferences.colors, color];
    onChange({ ...preferences, colors: next });
  };

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto', px: 3, py: 6 }}>
      <Typography sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800, color: TEXT, letterSpacing: '-1px', mb: 1 }}>
        What&apos;s your vision?
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 16, mb: 5 }}>
        Tell us what you love and we&apos;ll find the perfect fabrics for your piece.
      </Typography>

      {/* Style */}
      <Box sx={{ mb: 5 }}>
        <Typography sx={{ color: TEXT, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '1px', fontSize: 12 }}>
          Style Preference
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {STYLES.map(({ label, icon }) => {
            const selected = preferences.style === label;
            return (
              <Chip
                key={label}
                id={`style-${label.replace(/\s+/g, '-').toLowerCase()}`}
                label={`${icon} ${label}`}
                onClick={() => onChange({ ...preferences, style: selected ? '' : label })}
                sx={{
                  height: 42, fontSize: 14, fontWeight: selected ? 600 : 400,
                  background: selected ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : CARD_BG,
                  color: selected ? '#fff' : TEXT,
                  border: `1px solid ${selected ? 'transparent' : CARD_BORDER}`,
                  boxShadow: selected ? `0 4px 20px ${ACCENT}50` : 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  '&:hover': { transform: 'translateY(-1px)', borderColor: ACCENT },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Colors */}
      <Box sx={{ mb: 5 }}>
        <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 12, mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Color Palette <span style={{ color: MUTED, fontWeight: 400 }}>(select all that apply)</span>
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {COLORS.map(({ label, swatch }) => {
            const selected = preferences.colors.includes(label);
            return (
              <Box
                key={label}
                id={`color-${label.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => toggleColor(label)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: '12px',
                  background: selected ? 'rgba(124,58,237,0.15)' : CARD_BG,
                  border: `1px solid ${selected ? ACCENT : CARD_BORDER}`,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  '&:hover': { borderColor: ACCENT, transform: 'translateY(-1px)' },
                  boxShadow: selected ? `0 4px 16px ${ACCENT}30` : 'none',
                }}
              >
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: swatch, flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }} />
                <Typography sx={{ color: selected ? TEXT : MUTED, fontSize: 13, fontWeight: selected ? 600 : 400 }}>
                  {label}
                </Typography>
                {selected && <Typography sx={{ color: ACCENT, fontSize: 14 }}>✓</Typography>}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Fabric Type */}
      <Box sx={{ mb: 6 }}>
        <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 12, mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Fabric Type
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
          {FABRIC_TYPES.map(({ label, desc }) => {
            const selected = preferences.fabricType === label;
            return (
              <Box
                key={label}
                id={`fabric-type-${label.toLowerCase()}`}
                onClick={() => onChange({ ...preferences, fabricType: selected ? '' : label })}
                sx={{
                  ...glassCard,
                  p: 2, cursor: 'pointer', textAlign: 'center',
                  border: `1px solid ${selected ? ACCENT : CARD_BORDER}`,
                  background: selected ? 'rgba(124,58,237,0.12)' : CARD_BG,
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: ACCENT, transform: 'translateY(-2px)' },
                  boxShadow: selected ? `0 4px 20px ${ACCENT}30` : 'none',
                }}
              >
                <Typography sx={{ color: selected ? TEXT : MUTED, fontWeight: selected ? 700 : 500, fontSize: 14 }}>
                  {label}
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.3 }}>{desc}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={onBack} sx={{ color: MUTED, '&:hover': { color: TEXT } }}>
          ← Back
        </Button>
        <Button
          id="find-fabrics-btn"
          variant="contained"
          size="large"
          onClick={onSearch}
          disabled={isLoading}
          sx={{
            px: 6, py: 1.8, fontSize: 16, fontWeight: 700, borderRadius: '14px',
            background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
            boxShadow: `0 8px 32px ${ACCENT}60`,
            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 40px ${ACCENT}80` },
            '&:disabled': { background: 'rgba(255,255,255,0.1)', color: MUTED, transform: 'none', boxShadow: 'none' },
            transition: 'all 0.25s ease',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={18} sx={{ color: 'inherit' }} />
              Finding Perfect Fabrics...
            </Box>
          ) : (
            'Find My Fabrics ✨'
          )}
        </Button>
      </Box>
    </Box>
  );
}

// ── Fabric Card ───────────────────────────────────────────────────────────────

function FabricCard({
  fabric,
  selected,
  rank,
  onToggle,
}: {
  fabric: FabricItem;
  selected: boolean;
  rank: number;
  onToggle: () => void;
}) {
  return (
    <Box
      id={`fabric-card-${fabric.id}`}
      onClick={onToggle}
      sx={{
        ...glassCard,
        cursor: 'pointer', overflow: 'hidden', position: 'relative',
        border: `1px solid ${selected ? ACCENT : CARD_BORDER}`,
        boxShadow: selected ? `0 8px 32px ${ACCENT}40, 0 0 0 1px ${ACCENT}` : 'none',
        transform: selected ? 'translateY(-4px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': { transform: selected ? 'translateY(-4px)' : 'translateY(-2px)', borderColor: ACCENT },
      }}
    >
      {/* Rank badge */}
      <Box sx={{
        position: 'absolute', top: 12, left: 12, zIndex: 2,
        background: rank === 1 ? 'linear-gradient(135deg, #F59E0B, #EF4444)' : 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)', borderRadius: '8px', px: 1.2, py: 0.4,
      }}>
        <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
          {rank === 1 ? '⭐ AI Top Pick' : `#${rank}`}
        </Typography>
      </Box>

      {/* Source badge */}
      <Box sx={{
        position: 'absolute', top: 12, right: selected ? 44 : 12, zIndex: 2,
        background: fabric.source === 'charlotte-fabrics' ? 'rgba(30,80,160,0.8)' : `rgba(124,58,237,0.8)`,
        backdropFilter: 'blur(8px)', borderRadius: '8px', px: 1.2, py: 0.4,
        transition: 'right 0.2s ease',
      }}>
        <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>
          {fabric.source === 'charlotte-fabrics' ? '🏪 Charlotte' : '🏠 JL Comfort'}
        </Typography>
      </Box>

      {/* Selected check */}
      {selected && (
        <Box sx={{
          position: 'absolute', top: 12, right: 12, zIndex: 3,
          width: 28, height: 28, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${ACCENT}60`,
        }}>
          <Typography sx={{ color: '#fff', fontSize: 14 }}>✓</Typography>
        </Box>
      )}

      {/* Fabric image or swatch */}
      {fabric.imageUrl ? (
        <Box
          component="img"
          src={fabric.imageUrl}
          alt={fabric.name}
          sx={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <Box sx={{
          width: '100%', height: 200,
          background: fabric.swatchColor || `linear-gradient(135deg, ${MUTED}, #2A3040)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}>
            {fabric.fabricType}
          </Typography>
        </Box>
      )}

      {/* Info */}
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14, mb: 0.5, lineHeight: 1.3 }}>
          {fabric.name}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            label={fabric.fabricType}
            size="small"
            sx={{ height: 20, fontSize: 10, background: 'rgba(255,255,255,0.08)', color: MUTED, border: `1px solid ${CARD_BORDER}` }}
          />
          {fabric.price && fabric.price !== 'See website' && (
            <Chip
              label={fabric.price}
              size="small"
              sx={{ height: 20, fontSize: 10, background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
            />
          )}
        </Box>

        {/* Gemini's reason */}
        {fabric.geminiReason && (
          <Typography sx={{ color: MUTED, fontSize: 12, lineHeight: 1.4, fontStyle: 'italic', borderLeft: `2px solid ${ACCENT}`, pl: 1 }}>
            {fabric.geminiReason}
          </Typography>
        )}

        {/* View details link for Charlotte Fabrics */}
        {fabric.productUrl && (
          <Box
            component="a"
            href={fabric.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'block', mt: 1.5, color: `${ACCENT}`, fontSize: 12, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            View on Charlotte Fabrics →
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Step 3: Fabric Selection ───────────────────────────────────────────────────

function FabricsStep({
  fabrics,
  isLoading,
  error,
  selectedFabrics,
  onToggle,
  onBack,
  onVisualize,
  isVisualizing,
}: {
  fabrics: FabricItem[];
  isLoading: boolean;
  error: string;
  selectedFabrics: FabricItem[];
  onToggle: (fabric: FabricItem) => void;
  onBack: () => void;
  onVisualize: () => void;
  isVisualizing: boolean;
}) {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 6, pb: selectedFabrics.length > 0 ? 16 : 6 }}>
      <Typography sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800, color: TEXT, letterSpacing: '-1px', mb: 1 }}>
        Your Perfect Fabrics
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 16, mb: 4 }}>
        {isLoading
          ? 'AI is curating fabrics tailored to your furniture and preferences…'
          : 'Select one or more fabrics to visualize on your furniture. Tap to pick.'}
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3, background: 'rgba(234,179,8,0.1)', color: '#FCD34D', border: '1px solid rgba(234,179,8,0.2)' }}>
          {error}. Showing available fabrics.
        </Alert>
      )}

      {/* Fabric grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ ...glassCard, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={200} sx={{ background: 'rgba(255,255,255,0.05)' }} />
                <Box sx={{ p: 2 }}>
                  <Skeleton width="80%" sx={{ background: 'rgba(255,255,255,0.05)', mb: 0.5 }} />
                  <Skeleton width="50%" sx={{ background: 'rgba(255,255,255,0.05)' }} />
                </Box>
              </Box>
            ))
          : fabrics.map((fabric, i) => (
              <FabricCard
                key={fabric.id}
                fabric={fabric}
                rank={i + 1}
                selected={selectedFabrics.some((f) => f.id === fabric.id)}
                onToggle={() => onToggle(fabric)}
              />
            ))}
      </Box>

      {/* Back button */}
      <Button onClick={onBack} sx={{ color: MUTED, mt: 4, '&:hover': { color: TEXT } }}>
        ← Change Preferences
      </Button>

      {/* Floating confirmation panel */}
      {selectedFabrics.length > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'rgba(8,12,24,0.95)', backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${CARD_BORDER}`,
          p: 2.5,
        }}>
          <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>
                {selectedFabrics.length} fabric{selectedFabrics.length > 1 ? 's' : ''} selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                {selectedFabrics.map((f) => (
                  <Chip
                    key={f.id}
                    label={f.name}
                    size="small"
                    onDelete={() => onToggle(f)}
                    sx={{
                      background: `${ACCENT}20`, color: TEXT,
                      border: `1px solid ${ACCENT}40`, fontSize: 12,
                      '& .MuiChip-deleteIcon': { color: MUTED, '&:hover': { color: TEXT } },
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Button
              id="generate-visualization-btn"
              variant="contained"
              onClick={onVisualize}
              disabled={isVisualizing}
              size="large"
              sx={{
                px: 5, py: 1.6, fontSize: 16, fontWeight: 700, borderRadius: '14px', flexShrink: 0,
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                boxShadow: `0 8px 32px ${ACCENT}60`,
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 40px ${ACCENT}80` },
                '&:disabled': { background: 'rgba(255,255,255,0.1)', color: MUTED },
                transition: 'all 0.25s ease',
              }}
            >
              {isVisualizing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={18} sx={{ color: 'inherit' }} />
                  Generating…
                </Box>
              ) : (
                `Generate Visualization${selectedFabrics.length > 1 ? 's' : ''} ✨`
              )}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── Before/After Slider ───────────────────────────────────────────────────────

function BeforeAfterSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', cursor: 'ew-resize', userSelect: 'none', touchAction: 'none' }}
      onMouseDown={(e) => { isDragging.current = true; updatePos(e.clientX); }}
      onMouseMove={(e) => { if (isDragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { isDragging.current = false; }}
      onMouseLeave={() => { isDragging.current = false; }}
      onTouchStart={(e) => { isDragging.current = true; updatePos(e.touches[0].clientX); }}
      onTouchMove={(e) => { e.preventDefault(); if (isDragging.current) updatePos(e.touches[0].clientX); }}
      onTouchEnd={() => { isDragging.current = false; }}
    >
      {/* After (new fabric) image — full width base */}
      <Box component="img" src={afterSrc} alt="After reupholstery" sx={{ width: '100%', height: { xs: 320, md: 480 }, objectFit: 'cover', display: 'block' }} />

      {/* Before (original) image — clipped from the right */}
      <Box component="img" src={beforeSrc} alt="Before reupholstery" sx={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
        clipPath: `inset(0 ${100 - pos}% 0 0)`,
        transition: isDragging.current ? 'none' : 'clip-path 0.05s',
      }} />

      {/* Divider line */}
      <Box sx={{ position: 'absolute', top: 0, left: `${pos}%`, transform: 'translateX(-50%)', width: 3, height: '100%', background: 'rgba(255,255,255,0.9)', zIndex: 10, pointerEvents: 'none' }}>
        {/* Handle */}
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 46, height: 46, borderRadius: '50%',
          background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#333',
        }}>
          ⇔
        </Box>
      </Box>

      {/* Labels */}
      <Box sx={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', borderRadius: '8px', px: 1.5, py: 0.6, zIndex: 5 }}>
        <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '1px' }}>BEFORE</Typography>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 14, right: 14, background: `${ACCENT}CC`, backdropFilter: 'blur(6px)', borderRadius: '8px', px: 1.5, py: 0.6, zIndex: 5 }}>
        <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '1px' }}>AFTER</Typography>
      </Box>

      {/* Instruction (fades after first interaction) */}
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: pos === 50 ? 1 : 0, transition: 'opacity 0.5s ease', zIndex: 6 }}>
        <Box sx={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', px: 2.5, py: 1.2, textAlign: 'center' }}>
          <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>← Drag to Compare →</Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── Step 4: Results ───────────────────────────────────────────────────────────

function VisualizationStep({
  results,
  isLoading,
  loadingIndex,
  totalCount,
  originalImageUrl,
  errorMessage,
  onBack,
  onTryAnother,
  onRetry,
}: {
  results: VisualizationResult[];
  isLoading: boolean;
  loadingIndex: number;
  totalCount: number;
  originalImageUrl: string;
  errorMessage: string;
  onBack: () => void;
  onTryAnother: () => void;
  onRetry: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentResult = results[currentIndex];

  const handleDownload = () => {
    if (!currentResult) return;
    const link = document.createElement('a');
    link.href = `data:${currentResult.mimeType || 'image/png'};base64,${currentResult.visualizedImageBase64}`;
    link.download = `jl-comfort-${currentResult.fabric.name.replace(/\s+/g, '-').toLowerCase()}-visualization.png`;
    link.click();
  };

  if (isLoading && results.length === 0) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 3, py: 10, textAlign: 'center' }}>
        <Box sx={{ mb: 4, position: 'relative', display: 'inline-block' }}>
          <CircularProgress size={80} thickness={2} sx={{ color: ACCENT }} />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            ✨
          </Box>
        </Box>
        <Typography sx={{ fontSize: 28, fontWeight: 800, color: TEXT, mb: 2 }}>
          Generating Your Preview
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 16, mb: 4 }}>
          AI is visualizing fabric {loadingIndex} of {totalCount}…
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(loadingIndex / totalCount) * 100}
          sx={{
            height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`, borderRadius: 3 },
          }}
        />
        <Typography sx={{ color: MUTED, fontSize: 13, mt: 2 }}>
          This may take 15–30 seconds per fabric…
        </Typography>
      </Box>
    );
  }

  if (results.length === 0) {
    const isBillingError = errorMessage === 'BILLING_REQUIRED';

    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', px: 3, py: 10, textAlign: 'center' }}>
        {isBillingError ? (
          <>
            <Typography sx={{ fontSize: 52, mb: 2 }}>💳</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: TEXT, mb: 1, letterSpacing: '-0.5px' }}>
              Billing Required
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 16, mb: 4, lineHeight: 1.6 }}>
              AI image generation models require a paid Google Cloud plan.
              The free tier has <strong style={{ color: TEXT }}>zero quota</strong> for image generation.
            </Typography>

            {/* Steps card */}
            <Box sx={{ ...glassCard, p: 3, mb: 4, textAlign: 'left' }}>
              <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14, mb: 2 }}>
                ✅ How to enable — takes 2 minutes:
              </Typography>
              {[
                { step: '1', text: 'Go to Google Cloud Console → Billing' },
                { step: '2', text: 'Link project 133932755920 to a billing account' },
                { step: '3', text: 'Enable the "Generative Language API" in APIs & Services' },
                { step: '4', text: 'Come back and try again — it will work immediately!' },
              ].map(({ step, text }) => (
                <Box key={step} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{step}</Typography>
                  </Box>
                  <Typography sx={{ color: MUTED, fontSize: 14, pt: 0.3 }}>{text}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component="a"
                href="https://console.cloud.google.com/billing"
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                size="large"
                sx={{
                  px: 4, py: 1.5, fontWeight: 700, borderRadius: '12px',
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  boxShadow: `0 8px 24px ${ACCENT}50`,
                }}
              >
                Open Google Cloud Billing ↗
              </Button>
              <Button
                onClick={onBack}
                sx={{ color: MUTED, border: `1px solid ${CARD_BORDER}`, borderRadius: '12px', px: 3 }}
              >
                ← Back
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 48, mb: 2 }}>😕</Typography>
            <Typography sx={{ fontSize: 26, fontWeight: 700, color: TEXT, mb: 2 }}>
              Visualization Unavailable
            </Typography>
            {errorMessage ? (
              <Alert
                severity="error"
                sx={{ mb: 3, background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 2, textAlign: 'left' }}
              >
                <strong>Error:</strong> {errorMessage}
              </Alert>
            ) : (
              <Typography sx={{ color: MUTED, fontSize: 15, mb: 4 }}>
                Gemini couldn&apos;t generate the visualization. Try a different fabric or a clearer photo.
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button onClick={onBack} sx={{ color: MUTED, border: `1px solid ${CARD_BORDER}`, borderRadius: '12px', px: 3 }}>← Back</Button>
              <Button onClick={onRetry} variant="contained" sx={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, borderRadius: '12px', px: 3 }}>Try Again</Button>
            </Box>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 800, color: TEXT, letterSpacing: '-1px', mb: 0.5 }}>
            Your Preview is Ready! ✨
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 15 }}>
            Drag the slider to compare before &amp; after. Use arrows to browse all fabrics.
          </Typography>
        </Box>
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '12px', px: 2, py: 1 }}>
            <CircularProgress size={14} sx={{ color: ACCENT }} />
            <Typography sx={{ color: MUTED, fontSize: 13 }}>Generating {loadingIndex}/{totalCount}…</Typography>
          </Box>
        )}
      </Box>

      {/* Navigation (multi-fabric) */}
      {totalCount > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            sx={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT, '&:disabled': { opacity: 0.3 }, '&:hover': { borderColor: ACCENT } }}
          >
            ←
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Array.from({ length: totalCount }).map((_, i) => (
              <Box
                key={i}
                onClick={() => { if (i < results.length) setCurrentIndex(i); }}
                sx={{
                  width: i < results.length ? 28 : 8, height: 8, borderRadius: 4,
                  background: i === currentIndex ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` : i < results.length ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  cursor: i < results.length ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
          <IconButton
            onClick={() => setCurrentIndex((i) => Math.min(results.length - 1, i + 1))}
            disabled={currentIndex >= results.length - 1}
            sx={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT, '&:disabled': { opacity: 0.3 }, '&:hover': { borderColor: ACCENT } }}
          >
            →
          </IconButton>
          <Typography sx={{ color: MUTED, fontSize: 14, ml: 1 }}>
            {currentIndex + 1} of {results.length}{isLoading ? ` (${totalCount} total)` : ''}
          </Typography>
        </Box>
      )}

      {/* Main slider */}
      {currentResult && (
        <>
          <Box sx={{ mb: 3 }}>
            <BeforeAfterSlider
              beforeSrc={originalImageUrl}
              afterSrc={`data:${currentResult.mimeType || 'image/png'};base64,${currentResult.visualizedImageBase64}`}
            />
          </Box>

          {/* Current fabric info */}
          <Box sx={{ ...glassCard, p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Swatch preview */}
            <Box sx={{
              width: 60, height: 60, borderRadius: '12px', flexShrink: 0, overflow: 'hidden',
              background: currentResult.fabric.swatchColor || `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              border: `2px solid ${CARD_BORDER}`,
            }}>
              {currentResult.fabric.imageUrl && (
                <Box component="img" src={currentResult.fabric.imageUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 17 }}>{currentResult.fabric.name}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 13 }}>
                {currentResult.fabric.fabricType} ·{' '}
                {currentResult.fabric.source === 'charlotte-fabrics' ? 'Charlotte Fabrics' : 'JL Comfort Collection'}
                {currentResult.fabric.price && currentResult.fabric.price !== 'See website' && ` · ${currentResult.fabric.price}`}
              </Typography>
              {currentResult.fabric.geminiReason && (
                <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5, fontStyle: 'italic' }}>
                  &ldquo;{currentResult.fabric.geminiReason}&rdquo;
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Download the AI visualization">
              <Button
                id="download-visualization-btn"
                variant="outlined"
                onClick={handleDownload}
                sx={{
                  borderColor: ACCENT, color: ACCENT, borderRadius: '12px', px: 3, py: 1.2,
                  '&:hover': { background: `${ACCENT}15`, borderColor: ACCENT },
                }}
              >
                ⬇ Download Preview
              </Button>
            </Tooltip>

            {currentResult.fabric.productUrl && (
              <Button
                component="a"
                href={currentResult.fabric.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                sx={{
                  borderColor: CARD_BORDER, color: MUTED, borderRadius: '12px', px: 3, py: 1.2,
                  '&:hover': { borderColor: TEXT, color: TEXT },
                }}
              >
                View Fabric Details ↗
              </Button>
            )}

            <Button
              id="try-another-fabric-btn"
              variant="text"
              onClick={onTryAnother}
              sx={{ color: MUTED, borderRadius: '12px', px: 3, py: 1.2, '&:hover': { color: TEXT } }}
            >
              ← Try Different Fabric
            </Button>

            <Button
              id="get-quote-btn"
              component={Link}
              href="/checkout"
              variant="contained"
              size="large"
              sx={{
                ml: 'auto', px: 5, py: 1.6, fontSize: 15, fontWeight: 700, borderRadius: '14px',
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                boxShadow: `0 8px 32px ${ACCENT}60`,
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 40px ${ACCENT}80` },
                transition: 'all 0.25s ease',
              }}
            >
              Get a Quote 🛋️
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VisualizerClient() {
  // ── State ────────────────────────────────────────────────────────────────

  const [step, setStep] = useState<number>(1);

  // Step 1
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null);
  const [furniturePreviewUrl, setFurniturePreviewUrl] = useState('');
  const [furnitureBase64, setFurnitureBase64] = useState('');
  const [furnitureMimeType, setFurnitureMimeType] = useState('image/jpeg');

  // Step 2
  const [preferences, setPreferences] = useState<PreferencesState>({
    style: '',
    colors: [],
    fabricType: '',
  });

  // Step 3
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<FabricItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isVisualizing, setIsVisualizing] = useState(false);

  // Step 4
  const [visualizations, setVisualizations] = useState<VisualizationResult[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [visualizeError, setVisualizeError] = useState('');

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    setFurnitureFile(file);
    setFurnitureMimeType(file.type || 'image/jpeg');
    const url = URL.createObjectURL(file);
    setFurniturePreviewUrl(url);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove the data URL prefix: "data:image/jpeg;base64,"
      const base64 = result.split(',')[1];
      setFurnitureBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchError('');
    setFabrics([]);
    setSelectedFabrics([]);

    try {
      const response = await fetch('/api/fabric-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: preferences.style,
          colors: preferences.colors,
          fabricType: preferences.fabricType,
          furnitureImageBase64: furnitureBase64,
          furnitureMimeType,
        }),
      });

      const data = await response.json();
      if (data.fabrics && data.fabrics.length > 0) {
        setFabrics(data.fabrics);
      } else {
        setSearchError('Could not find matching fabrics');
      }
    } catch {
      setSearchError('Network error while searching fabrics');
    } finally {
      setIsSearching(false);
    }

    setStep(3);
  }, [preferences, furnitureBase64, furnitureMimeType]);

  const toggleFabricSelection = useCallback((fabric: FabricItem) => {
    setSelectedFabrics((prev) =>
      prev.some((f) => f.id === fabric.id)
        ? prev.filter((f) => f.id !== fabric.id)
        : [...prev, fabric]
    );
  }, []);

  const handleVisualize = useCallback(async () => {
    if (selectedFabrics.length === 0) return;
    setIsVisualizing(true);
    setVisualizations([]);
    setVisualizeError('');
    setLoadingIndex(1);
    setStep(4);

    const results: VisualizationResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < selectedFabrics.length; i++) {
      const fabric = selectedFabrics[i];
      setLoadingIndex(i + 1);

      try {
        const response = await fetch('/api/ai-visualize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            furnitureImageBase64: furnitureBase64,
            furnitureMimeType,
            fabric,
          }),
        });

        const data = await response.json();

        if (data.visualizedImageBase64) {
          results.push({
            fabric,
            visualizedImageBase64: data.visualizedImageBase64,
            mimeType: data.mimeType || 'image/png',
          });
          setVisualizations([...results]);
        } else if (data.error === 'BILLING_REQUIRED' || response.status === 402) {
          // Billing error — no point trying remaining fabrics
          errors.push('BILLING_REQUIRED');
          console.error('[Visualizer] Billing required for image generation');
          break;
        } else if (data.error) {
          errors.push(`${fabric.name}: ${data.error}`);
          console.error('[Visualizer] API error for', fabric.name, ':', data.error);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        errors.push(`${fabric.name}: ${msg}`);
        console.error(`Error visualizing fabric ${fabric.name}:`, err);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      setVisualizeError(errors[0]);
    }

    setIsVisualizing(false);
  }, [selectedFabrics, furnitureBase64, furnitureMimeType]);


  const handleTryAnother = useCallback(() => {
    setVisualizations([]);
    setStep(3);
  }, []);

  const handleRetry = useCallback(() => {
    handleVisualize();
  }, [handleVisualize]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' }}>

      {/* Background decorative gradients */}
      <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 70%)`, filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT2}12 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      </Box>

      {/* Main content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <StepProgress step={step} />

        {step === 1 && (
          <UploadStep
            previewUrl={furniturePreviewUrl}
            onFileSelect={handleFileSelect}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <PreferencesStep
            preferences={preferences}
            onChange={setPreferences}
            onBack={() => setStep(1)}
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        )}

        {step === 3 && (
          <FabricsStep
            fabrics={fabrics}
            isLoading={isSearching}
            error={searchError}
            selectedFabrics={selectedFabrics}
            onToggle={toggleFabricSelection}
            onBack={() => setStep(2)}
            onVisualize={handleVisualize}
            isVisualizing={isVisualizing}
          />
        )}

        {step === 4 && (
          <VisualizationStep
            results={visualizations}
            isLoading={isVisualizing}
            loadingIndex={loadingIndex}
            totalCount={selectedFabrics.length}
            originalImageUrl={furniturePreviewUrl}
            errorMessage={visualizeError}
            onBack={() => setStep(3)}
            onTryAnother={handleTryAnother}
            onRetry={handleRetry}
          />
        )}
      </Box>
    </Box>
  );
}
