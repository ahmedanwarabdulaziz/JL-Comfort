'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Container,
  Collapse,
} from '@mui/material';
import Link from 'next/link';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useCart } from '@/lib/context/CartContext';

// Color dot map for the mega-menu
const MEGA_COLORS: { label: string; value: string; dot: string }[] = [
  { label: 'Red & Burgundy',  value: 'red-burgundy',  dot: '#8B1A2B' },
  { label: 'Orange & Rust',   value: 'orange-rust',   dot: '#C2612A' },
  { label: 'Gold & Yellow',   value: 'gold-yellow',   dot: '#D4A017' },
  { label: 'Green',           value: 'green',         dot: '#3A7A47' },
  { label: 'Aqua & Teal',     value: 'aqua-teal',     dot: '#2A8A8A' },
  { label: 'Blue',            value: 'blue',          dot: '#2A5FA8' },
  { label: 'Purple',          value: 'purple',        dot: '#6A3A9A' },
  { label: 'Coral & Peach',   value: 'coral-peach',   dot: '#E07060' },
  { label: 'Pink',            value: 'pink',          dot: '#D4608A' },
  { label: 'Neutral',         value: 'beige-taupe',   dot: '#B8A898' },
  { label: 'Brown',           value: 'brown',         dot: '#6B4226' },
  { label: 'Black',           value: 'black',         dot: '#1A1A1A' },
  { label: 'Grey & Silver',   value: 'grey-silver',   dot: '#8A8A8A' },
  { label: 'White & Ivory',   value: 'white-ivory',   dot: '#F0EDE5' },
];

const MEGA_TRENDING = [
  { label: 'New Arrivals',        href: '/fabrics?isNew=true' },
  { label: 'Performance / Crypton', href: '/fabrics?material=crypton' },
  { label: 'Velvet',             href: '/fabrics?material=velvet' },
  { label: 'Linen',              href: '/fabrics?material=linen' },
  { label: 'Chenille',           href: '/fabrics?material=chenille' },
];

const MEGA_PATTERNS = [
  { label: 'Plain & Solid',          value: 'plain-solid' },
  { label: 'Abstract & Geometric',   value: 'abstract-geometric' },
  { label: 'Floral',                 value: 'floral' },
  { label: 'Stripe',                 value: 'stripe' },
  { label: 'Check & Houndstooth',    value: 'check-houndstooth' },
  { label: 'Velvet',                 value: null, href: '/fabrics?material=velvet' },
];

// Phase 1: Fabric-only launch.
const primaryLinks = [
  { label: 'Shop Fabrics', href: '/fabrics' },
  { label: 'Sample Books', href: '/sample-books' },
  { label: 'About',        href: '/about' },
  { label: 'FAQ',          href: '/faq' },
];

// ─── Mega-menu dropdown ──────────────────────────────────────────────────────
function FabricMegaMenu({ onClose }: { onClose: () => void }) {
  const linkSx = {
    display: 'block',
    color: '#333',
    fontSize: '0.82rem',
    textDecoration: 'none',
    py: 0.45,
    transition: 'color 0.15s',
    '&:hover': { color: '#b8935f' },
  };

  return (
    <Box
      onMouseLeave={onClose}
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: '#fff',
        borderTop: '2px solid #e3c29a',
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: '180px 200px 1fr', gap: 5 }}>

          {/* TRENDING */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1a1a1a', fontSize: '0.68rem', display: 'block', mb: 1.5 }}>
              Trending
            </Typography>
            {MEGA_TRENDING.map((item) => (
              <Box key={item.label} component={Link} href={item.href} onClick={onClose} sx={linkSx}>
                {item.label}
              </Box>
            ))}
            <Box sx={{ mt: 2 }}>
              <Box
                component={Link}
                href="/fabrics"
                onClick={onClose}
                sx={{
                  display: 'inline-block',
                  mt: 1,
                  px: 2,
                  py: 0.7,
                  border: '1px solid #1a1a1a',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#1a1a1a', color: '#e3c29a' },
                }}
              >
                View All Fabrics →
              </Box>
            </Box>
          </Box>

          {/* PATTERN */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1a1a1a', fontSize: '0.68rem', display: 'block', mb: 1.5 }}>
              Pattern
            </Typography>
            {MEGA_PATTERNS.map((item) => (
              <Box
                key={item.label}
                component={Link}
                href={item.href ?? `/fabrics?pattern=${item.value}`}
                onClick={onClose}
                sx={linkSx}
              >
                {item.label}
              </Box>
            ))}
          </Box>

          {/* COLOR */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1a1a1a', fontSize: '0.68rem', display: 'block', mb: 1.5 }}>
              Color
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px' }}>
              {MEGA_COLORS.map((c) => (
                <Box
                  key={c.value}
                  component={Link}
                  href={`/fabrics?color=${c.value}`}
                  onClick={onClose}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.45,
                    textDecoration: 'none',
                    color: '#333',
                    fontSize: '0.82rem',
                    transition: 'color 0.15s',
                    '&:hover': { color: '#b8935f' },
                    '&:hover .color-dot': { transform: 'scale(1.25)' },
                  }}
                >
                  <Box
                    className="color-dot"
                    sx={{
                      width: 13,
                      height: 13,
                      borderRadius: '50%',
                      bgcolor: c.dot,
                      border: c.value === 'white-ivory' ? '1.5px solid #ccc' : '1px solid rgba(0,0,0,0.1)',
                      flexShrink: 0,
                      transition: 'transform 0.15s',
                    }}
                  />
                  {c.label}
                </Box>
              ))}
            </Box>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}

// ─── Main header ─────────────────────────────────────────────────────────────
export default function SiteHeader() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFabricsOpen, setMobileFabricsOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  if (pathname?.startsWith('/admin')) return null;

  // Hover handlers with a tiny delay so the menu doesn't flicker on fast mouse moves
  const handleFabricsEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setMegaOpen(true);
  };
  const handleFabricsLeave = () => {
    leaveTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };
  const handleMegaEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const navLinkSx = (active: boolean) => ({
    color: active ? '#b8935f' : '#555',
    fontWeight: 700,
    position: 'relative' as const,
    fontSize: '0.8rem',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    '&:hover': { color: '#b8935f', bgcolor: 'transparent' },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 4,
      height: 2,
      bgcolor: '#b8935f',
      transform: active ? 'scaleX(1)' : 'scaleX(0)',
      transition: 'transform 0.2s ease',
    },
  });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#fff',
        color: '#1a1a1a',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        // Allow the mega-menu to overflow outside the AppBar
        overflow: 'visible',
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Toolbar sx={{ px: { xs: 2, md: 3 }, position: 'relative' }}>

          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, fontWeight: 900, letterSpacing: 2, textDecoration: 'none', color: '#1a1a1a', fontSize: '1.4rem' }}
          >
            <span style={{ color: '#8B1A2B' }}>JL</span> COMFORT
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>

            {/* Shop Fabrics — with mega-menu */}
            <Box
              onMouseEnter={handleFabricsEnter}
              onMouseLeave={handleFabricsLeave}
              sx={{ position: 'relative' }}
            >
              <Button
                component={Link}
                href="/fabrics"
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      fontSize: '16px !important',
                      transition: 'transform 0.2s',
                      transform: megaOpen ? 'rotate(180deg)' : 'none',
                      ml: -0.5,
                    }}
                  />
                }
                sx={navLinkSx(isActive('/fabrics'))}
              >
                Shop Fabrics
              </Button>

              {/* Mega-menu — rendered inside the sticky AppBar so it overlays the page */}
              {megaOpen && (
                <Box
                  onMouseEnter={handleMegaEnter}
                  onMouseLeave={handleFabricsLeave}
                  sx={{
                    position: 'fixed',
                    top: { xs: 56, sm: 64 }, // AppBar default heights
                    left: 0,
                    right: 0,
                    zIndex: 1300,
                    bgcolor: '#fff',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Container maxWidth="xl" disableGutters sx={{ display: 'flex' }}>
                    
                    {/* TRENDING - Grey Column */}
                    <Box sx={{ width: 240, bgcolor: '#f0f0f0', p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 1, color: '#666', fontSize: '0.75rem', display: 'block', mb: 2 }}>
                        TRENDING
                      </Typography>
                      {MEGA_TRENDING.map((item) => (
                        <Box
                          key={item.label}
                          component={Link}
                          href={item.href}
                          onClick={() => setMegaOpen(false)}
                          sx={{ display: 'block', color: '#555', fontSize: '0.9rem', textDecoration: 'none', py: 0.7, transition: 'color 0.15s', '&:hover': { color: '#b8935f' } }}
                        >
                          {item.label}
                        </Box>
                      ))}
                      <Box sx={{ mt: 'auto', pt: 3 }}>
                        <Box
                          component={Link}
                          href="/fabrics"
                          onClick={() => setMegaOpen(false)}
                          sx={{
                            display: 'inline-block',
                            width: '100%',
                            textAlign: 'center',
                            py: 1,
                            bgcolor: '#fff',
                            border: '1px solid #ccc',
                            color: '#555',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#1a1a1a', color: '#1a1a1a' },
                          }}
                        >
                          View All Fabric
                        </Box>
                      </Box>
                    </Box>

                    {/* PATTERN / APPLICATION */}
                    <Box sx={{ width: 240, p: { xs: 3, md: 4 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 1, color: '#666', fontSize: '0.75rem', display: 'block', mb: 2 }}>
                        PATTERN
                      </Typography>
                      {MEGA_PATTERNS.map((item) => (
                        <Box
                          key={item.label}
                          component={Link}
                          href={item.href ?? `/fabrics?pattern=${item.value}`}
                          onClick={() => setMegaOpen(false)}
                          sx={{ display: 'block', color: '#666', fontSize: '0.9rem', textDecoration: 'none', py: 0.7, transition: 'color 0.15s', '&:hover': { color: '#b8935f' } }}
                        >
                          {item.label}
                        </Box>
                      ))}
                    </Box>

                    {/* COLOR */}
                    <Box sx={{ flex: 1, p: { xs: 3, md: 4 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 1, color: '#666', fontSize: '0.75rem', display: 'block', mb: 2 }}>
                        COLOR
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '8px 48px' }}>
                        {MEGA_COLORS.map((c) => (
                          <Box
                            key={c.value}
                            component={Link}
                            href={`/fabrics?color=${c.value}`}
                            onClick={() => setMegaOpen(false)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              py: 0.5,
                              textDecoration: 'none',
                              color: '#666',
                              fontSize: '0.9rem',
                              transition: 'color 0.15s',
                              '&:hover': { color: '#b8935f' },
                              '&:hover .cdot': { transform: 'scale(1.2)' },
                            }}
                          >
                            <Box
                              className="cdot"
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                bgcolor: c.dot,
                                border: c.value === 'white-ivory' ? '1px solid #ddd' : 'none',
                                flexShrink: 0,
                                transition: 'transform 0.15s',
                              }}
                            />
                            {c.label}
                          </Box>
                        ))}
                      </Box>
                    </Box>

                  </Container>
                </Box>
              )}
            </Box>

            <Button component={Link} href="/sample-books" sx={navLinkSx(isActive('/sample-books'))}>Sample Books</Button>
            <Button component={Link} href="/about" sx={navLinkSx(isActive('/about'))}>Inspiration</Button>
            <Button component={Link} href="/faq" sx={navLinkSx(isActive('/faq'))}>Resources</Button>

            <IconButton component={Link} href="/checkout" sx={{ ml: 2, color: '#555', '&:hover': { color: '#b8935f' } }}>
              <Badge badgeContent={itemCount} color="error" invisible={itemCount === 0}>
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
          </Box>

          {/* Mobile controls */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <IconButton component={Link} href="/checkout" sx={{ color: '#555' }}>
              <Badge badgeContent={itemCount} color="error" invisible={itemCount === 0}>
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#555' }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, bgcolor: '#0a0908', color: '#fff', height: '100%', pt: 2 }} role="presentation">
          <Typography sx={{ px: 2.5, pb: 2, fontWeight: 'bold', letterSpacing: 2, fontSize: '1rem' }}>
            <span style={{ color: '#e3c29a' }}>JL</span> COMFORT
          </Typography>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <List sx={{ pt: 0 }}>

            {/* Shop Fabrics — expandable in mobile */}
            <ListItemButton onClick={() => setMobileFabricsOpen((o) => !o)} sx={{ color: '#fff', py: 1.5 }}>
              <ListItemText primary="Shop Fabrics" primaryTypographyProps={{ fontWeight: 600 }} />
              {mobileFabricsOpen ? <ExpandLessIcon sx={{ color: '#e3c29a' }} /> : <ExpandMoreIcon sx={{ color: '#888' }} />}
            </ListItemButton>
            <Collapse in={mobileFabricsOpen}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', pb: 1 }}>
                <Typography variant="caption" sx={{ px: 3, pt: 1.5, pb: 0.5, display: 'block', color: '#e3c29a', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  Trending
                </Typography>
                {MEGA_TRENDING.map((item) => (
                  <ListItemButton key={item.label} component={Link} href={item.href} onClick={() => setMobileOpen(false)} sx={{ py: 0.6, pl: 4, color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#e3c29a' } }}>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.83rem' }} />
                  </ListItemButton>
                ))}
                <Typography variant="caption" sx={{ px: 3, pt: 1.5, pb: 0.5, display: 'block', color: '#e3c29a', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  By Color
                </Typography>
                {MEGA_COLORS.slice(0, 8).map((c) => (
                  <ListItemButton key={c.value} component={Link} href={`/fabrics?color=${c.value}`} onClick={() => setMobileOpen(false)} sx={{ py: 0.6, pl: 4, color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#e3c29a' } }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.dot, mr: 1.5, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                    <ListItemText primary={c.label} primaryTypographyProps={{ fontSize: '0.83rem' }} />
                  </ListItemButton>
                ))}
                <ListItemButton component={Link} href="/fabrics" onClick={() => setMobileOpen(false)} sx={{ py: 0.8, pl: 4, color: '#e3c29a', fontWeight: 700 }}>
                  <ListItemText primary="View All Fabrics →" primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 700 }} />
                </ListItemButton>
              </Box>
            </Collapse>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
            <ListItemButton component={Link} href="/about" onClick={() => setMobileOpen(false)} sx={{ color: isActive('/about') ? '#e3c29a' : '#fff', py: 1.5 }}>
              <ListItemText primary="About" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
            <ListItemButton component={Link} href="/faq" onClick={() => setMobileOpen(false)} sx={{ color: isActive('/faq') ? '#e3c29a' : '#fff', py: 1.5 }}>
              <ListItemText primary="FAQ" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
