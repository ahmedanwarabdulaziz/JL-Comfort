'use client';

import { useState, MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Container,
} from '@mui/material';
import Link from 'next/link';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useCart } from '@/lib/context/CartContext';

const guideLinks = [
  { label: 'How to Measure', href: '/how-to-measure' },
  { label: 'Choosing Your Firmness', href: '/firmness-guide' },
  { label: 'Fibre Wrap Guide', href: '/fibre-wrap' },
];

const primaryLinks = [
  { label: 'Order Foam', href: '/foam' },
  { label: 'Bench Cushions', href: '/bench-cushions' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [guidesAnchor, setGuidesAnchor] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  const isGuidesActive = guideLinks.some((g) => g.href === pathname);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleGuidesOpen = (e: MouseEvent<HTMLElement>) => setGuidesAnchor(e.currentTarget);
  const handleGuidesClose = () => setGuidesAnchor(null);

  const navLinkSx = (active: boolean) => ({
    color: active ? '#e3c29a' : '#fff',
    fontWeight: active ? 'bold' : 'normal',
    position: 'relative' as const,
    '&:hover': { color: '#e3c29a', bgcolor: 'transparent' },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 6,
      height: 2,
      bgcolor: '#e3c29a',
      transform: active ? 'scaleX(1)' : 'scaleX(0)',
      transition: 'transform 0.2s ease',
    },
  });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#000000',
        color: '#ffffff',
        borderBottom: '1px solid rgba(227, 194, 154, 0.15)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 2, textDecoration: 'none', color: '#fff' }}
          >
            <span style={{ color: '#e3c29a' }}>JL</span> COMFORT
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            <Button component={Link} href="/foam" sx={navLinkSx(isActive('/foam'))}>
              Order Foam
            </Button>

            <Button component={Link} href="/bench-cushions" sx={navLinkSx(isActive('/bench-cushions'))}>
              Bench Cushions
            </Button>

            <Button
              onClick={handleGuidesOpen}
              endIcon={<KeyboardArrowDownIcon sx={{ transition: 'transform 0.2s', transform: guidesAnchor ? 'rotate(180deg)' : 'none' }} />}
              sx={navLinkSx(isGuidesActive)}
            >
              Guides
            </Button>
            <Menu
              anchorEl={guidesAnchor}
              open={Boolean(guidesAnchor)}
              onClose={handleGuidesClose}
              MenuListProps={{ sx: { bgcolor: '#111', minWidth: 220 } }}
              PaperProps={{ sx: { bgcolor: '#111', border: '1px solid rgba(227, 194, 154, 0.15)', mt: 1 } }}
            >
              {guideLinks.map((link) => (
                <MenuItem
                  key={link.href}
                  component={Link}
                  href={link.href}
                  onClick={handleGuidesClose}
                  sx={{ color: isActive(link.href) ? '#e3c29a' : '#fff', '&:hover': { bgcolor: 'rgba(227, 194, 154, 0.1)', color: '#e3c29a' } }}
                >
                  {link.label}
                </MenuItem>
              ))}
            </Menu>

            <Button component={Link} href="/about" sx={navLinkSx(isActive('/about'))}>
              About
            </Button>
            <Button component={Link} href="/faq" sx={navLinkSx(isActive('/faq'))}>
              FAQ
            </Button>

            <IconButton component={Link} href="/checkout" sx={{ ml: 1, color: '#fff', '&:hover': { color: '#e3c29a' } }}>
              <Badge badgeContent={itemCount} color="warning" invisible={itemCount === 0}>
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
          </Box>

          {/* Mobile controls */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <IconButton component={Link} href="/checkout" sx={{ color: '#fff' }}>
              <Badge badgeContent={itemCount} color="warning" invisible={itemCount === 0}>
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#fff' }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, bgcolor: '#000', color: '#fff', height: '100%', pt: 2 }} role="presentation">
          <Typography sx={{ px: 2, pb: 2, fontWeight: 'bold', letterSpacing: 2 }}>
            <span style={{ color: '#e3c29a' }}>JL</span> COMFORT
          </Typography>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <List>
            {primaryLinks.map((link) => (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                sx={{ color: isActive(link.href) ? '#e3c29a' : '#fff' }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
            {guideLinks.map((link) => (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                sx={{ color: isActive(link.href) ? '#e3c29a' : 'rgba(255,255,255,0.8)', pl: 3 }}
              >
                <ListItemText primary={link.label} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
