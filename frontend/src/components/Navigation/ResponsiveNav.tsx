import React from 'react';
import { AppBar, Box, Toolbar, IconButton, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, useMediaQuery, BottomNavigation, BottomNavigationAction } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ImageIcon from '@mui/icons-material/Image';
import SettingsIcon from '@mui/icons-material/Settings';
import SellIcon from '@mui/icons-material/Sell';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useUserProfile } from '../../hooks/query-hooks';
import { useLogout } from '../NavBar/NavBar';

const drawerWidth = 280;

const ResponsiveNav: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const isAdmin = userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin');
  const isSmall = useMediaQuery('(max-width:900px)');
  const logout = useLogout();

  if (!isSmall) return null;

  const handleNavigate = (to: string) => {
    setOpen(false);
    if (location.pathname !== to) navigate(to);
  };

  return (
    <>
      <AppBar position="fixed" color="default" elevation={2} sx={{ zIndex: theme.zIndex.drawer + 1, backdropFilter: 'saturate(180%) blur(8px)' }}>
        <Toolbar disableGutters sx={{ pl: 'env(safe-area-inset-left)', pr: 'env(safe-area-inset-right)' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open navigation menu"
            aria-controls="mobile-drawer"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Omni
          </Typography>
          <Box sx={{ flex: 1 }} />
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ id: 'mobile-drawer', sx: { width: drawerWidth } }}
      >
        <Box role="navigation" sx={{ pt: 1 }}>
          <List>
            <ListItemButton selected={location.pathname === '/media-library'} onClick={() => handleNavigate('/media-library')}>
              <ListItemIcon><ImageIcon /></ListItemIcon>
              <ListItemText primary="Media Library" />
            </ListItemButton>
            {isAdmin && (
              <>
                <ListItemButton selected={location.pathname === '/admin-dashboard'} onClick={() => handleNavigate('/admin-dashboard')}>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Admin Dashboard" />
                </ListItemButton>
                <ListItemButton selected={location.pathname === '/admin-tags'} onClick={() => handleNavigate('/admin-tags')}>
                  <ListItemIcon><SellIcon /></ListItemIcon>
                  <ListItemText primary="Tag Management" />
                </ListItemButton>
                <ListItemButton selected={location.pathname === '/admin-users'} onClick={() => handleNavigate('/admin-users')}>
                  <ListItemIcon><PeopleIcon /></ListItemIcon>
                  <ListItemText primary="User Management" />
                </ListItemButton>
                <ListItemButton selected={location.pathname === '/admin-media-types'} onClick={() => handleNavigate('/admin-media-types')}>
                  <ListItemIcon><CategoryIcon /></ListItemIcon>
                  <ListItemText primary="Media Types" />
                </ListItemButton>
              </>
            )}
          </List>
          <Divider />
          <List>
            <ListItemButton selected={location.pathname === '/account'} onClick={() => handleNavigate('/account')}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Account" />
            </ListItemButton>
            <ListItemButton onClick={async () => { setOpen(false); await logout(); }}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* bottom nav for primary routes */}
      <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: theme.zIndex.drawer + 1, pb: 'env(safe-area-inset-bottom)' }}>
        <BottomNavigation
          showLabels
          value={location.pathname}
          onChange={(_, value) => handleNavigate(value)}
        >
          <BottomNavigationAction label="Library" value="/media-library" icon={<ImageIcon />} />
          {isAdmin && <BottomNavigationAction label="Dashboard" value="/admin-dashboard" icon={<DashboardIcon />} />}
          <BottomNavigationAction label="Account" value="/account" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Box>

      {/* spacer removed; content area handles top padding */}
    </>
  );
};

export default ResponsiveNav;


