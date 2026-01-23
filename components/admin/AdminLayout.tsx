'use client';

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Collapse,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import MemoryIcon from '@mui/icons-material/Memory';
import CategoryIcon from '@mui/icons-material/Category';
import RuleIcon from '@mui/icons-material/Rule';
import StarIcon from '@mui/icons-material/Star';
import LayersIcon from '@mui/icons-material/Layers';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { auth } from '@/lib/firebase/config';
import ProductsList from './ProductsList';

const DRAWER_WIDTH = 240;

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [foamOpen, setFoamOpen] = useState(
    pathname?.includes('/foam') || pathname?.includes('/categories') || pathname?.includes('/dimensions-rules') || pathname?.includes('/grades') || pathname?.includes('/fibre-wrap')
  );
  const [selectedView, setSelectedView] = useState<
    'dashboard' | 'products' | 'foam'
  >(pathname?.includes('/foam') ? 'foam' : 'products');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedView === 'dashboard'}
            onClick={() => setSelectedView('dashboard')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedView === 'products'}
            onClick={() => setSelectedView('products')}
          >
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="Products" />
          </ListItemButton>
        </ListItem>
        {/* Foam Section - Collapsible */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setFoamOpen(!foamOpen)}
            selected={pathname?.includes('/foam') || pathname?.includes('/categories') || pathname?.includes('/dimensions-rules') || pathname?.includes('/grades') || pathname?.includes('/fibre-wrap')}
          >
            <ListItemIcon>
              <MemoryIcon />
            </ListItemIcon>
            <ListItemText primary="Foam" />
            {foamOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={foamOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname?.includes('/categories')}
              onClick={() => {
                router.push('/admin/categories');
                setSelectedView('foam');
              }}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Foam Categories" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname?.includes('/foam') && !pathname?.includes('/categories') && !pathname?.includes('/dimensions-rules') && !pathname?.includes('/grades') && !pathname?.includes('/fibre-wrap')}
              onClick={() => {
                router.push('/admin/foam');
                setSelectedView('foam');
              }}
            >
              <ListItemIcon>
                <MemoryIcon />
              </ListItemIcon>
              <ListItemText primary="Foam Types" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname?.includes('/dimensions-rules')}
              onClick={() => {
                router.push('/admin/foam/dimensions-rules');
                setSelectedView('foam');
              }}
            >
              <ListItemIcon>
                <RuleIcon />
              </ListItemIcon>
              <ListItemText primary="Dimension Rules" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname?.includes('/grades')}
              onClick={() => {
                router.push('/admin/foam/grades');
                setSelectedView('foam');
              }}
            >
              <ListItemIcon>
                <StarIcon />
              </ListItemIcon>
              <ListItemText primary="Foam Grades" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname?.includes('/fibre-wrap')}
              onClick={() => {
                router.push('/admin/foam/fibre-wrap');
                setSelectedView('foam');
              }}
            >
              <ListItemIcon>
                <LayersIcon />
              </ListItemIcon>
              <ListItemText primary="Fibre Wrap" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {children ? (
          children
        ) : (
          <>
            {selectedView === 'dashboard' && (
              <Typography variant="h5" gutterBottom>
                Dashboard
              </Typography>
            )}
            {selectedView === 'products' && <ProductsList />}
          </>
        )}
      </Box>
    </Box>
  );
}
