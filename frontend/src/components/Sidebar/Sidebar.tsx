import "./sidebar.scss";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Avatar, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";
import "./sidebar.scss";
import { NavLink, useLocation } from "react-router-dom";
import logoLight from "../../assets/Omni-new-logo-revvity-grey.png";
import logoDark from "../../assets/Omni-new-logo-revvity-white.png";
import { useTheme } from "@mui/material/styles";
import { 
  FaImages, 
  FaSignOutAlt, 
  FaUser, 
  FaTachometerAlt, 
  FaTags, 
  FaUsers, 
  FaLayerGroup,
} from "react-icons/fa";
import { useEffect } from "react";
import { useUserProfile } from '../../hooks/query-hooks';
import { useLogoutHandler } from "../../hooks/useAuthHandler";

// Define CSS variables for the components
const setCssVariables = (theme: any) => {
  const root = document.documentElement;
  const primaryColor = theme.palette.primary.main;
  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : null;
  };
  
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--primary-color-rgb', hexToRgb(primaryColor));
  root.style.setProperty('--text-color', theme.palette.mode === 'light' ? '#333' : '#fff');
};

const CustomSidebar: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const handleSignOut = useLogoutHandler();

  const { data: userProfile, isLoading: isUserLoading, error: userError } = useUserProfile();

  const isAdmin = userProfile && (userProfile.role === "admin" || userProfile.role === "superAdmin");

  // Apply CSS variables when theme changes
  useEffect(() => {
    setCssVariables(theme);
  }, [theme]);

  const renderUserProfileDisplay = () => {
    if (isUserLoading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '80px' }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    if (userError || !userProfile) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, height: '80px' }}>
          <Avatar className="sidebar-avatar" />
          <Typography variant="subtitle1" sx={{ ml: 1, color: 'var(--text-color)' }}>User</Typography>
        </Box>
      );
    }
    return (
      // Link the entire profile section to /account page
      <NavLink to="/account" className="user-profile-link" style={{ textDecoration: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: '4px', margin: '10px', "&:hover": { backgroundColor: 'rgba(0,0,0,0.04)' } }}>
            <Avatar 
              className="sidebar-avatar" 
              src={userProfile.avatar || undefined} 
              alt={`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
              sx={{ width: 40, height: 40, mr: 1.5 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                {`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username}
              </Typography>
              {userProfile.username && (
                <Typography variant="caption" noWrap sx={{ color: 'var(--text-color)', opacity: 0.7 }}>
                  @{userProfile.username}
                </Typography>
              )}
            </Box>
        </Box>
      </NavLink>
    );
  };

  return (
    <Box className="sidebar-container">
      <motion.div
        transition={{ duration: 0.5 }}
        className="sidebar-wrapper"
      >
        <Sidebar id="sidebar">
          <div className="sidebar-header">
            { theme.palette.mode === "light" ? <img src={logoLight} alt="logo" className="sidebar-logo" /> : <img src={logoDark} alt="logo" className="sidebar-logo" /> }
          </div>

          {/* Render user profile display at the top */} 
          {renderUserProfileDisplay()}

          <Menu className="sidebar-menu">
            {/* Common Links */}
            <MenuItem 
              icon={<FaImages />} 
              className={location.pathname === "/media-library" ? "active-item" : ""}
              component={<NavLink to="/media-library" className={({isActive}) => isActive ? "active-menu-item" : ""} end/>}
            >
              Media Library
            </MenuItem>

            {/* Admin Links - now top level */}
            {isAdmin && (
              <>
                <MenuItem 
                  icon={<FaUser />} 
                  className={location.pathname === "/account" ? "active-item" : ""}
                  component={<NavLink to="/account" className={({isActive}) => isActive ? "active-menu-item" : ""} end/>}
                >
                  Account Settings
                </MenuItem>
                <MenuItem 
                  icon={<FaTachometerAlt />} 
                  className={location.pathname === "/admin-dashboard" ? "active-item" : ""}
                  component={<NavLink to="/admin-dashboard" className={({isActive}) => isActive ? "active-menu-item" : ""} end/>}
                >
                  Admin Dashboard
                </MenuItem>
                <MenuItem 
                  icon={<FaTags />} 
                  className={location.pathname === "/admin-tags" ? "active-item" : ""}
                  component={<NavLink to="/admin-tags" className={({isActive}) => isActive ? "active-menu-item" : ""} end/>}
                >
                  Tag Management
                </MenuItem>
                <MenuItem 
                  icon={<FaUsers />} 
                  className={location.pathname === "/admin-users" ? "active-item" : ""}
                  component={<NavLink to="/admin-users" className={({isActive}) => isActive ? "active-menu-item" : ""} end/>}
                >
                  User Management
                </MenuItem>
                <MenuItem 
                  icon={<FaLayerGroup />} 
                  className={location.pathname === "/admin-media-types" ? "active-item" : ""}
                  component={<NavLink to="/admin-media-types" className={({isActive}) => isActive ? "active-menu-item" : ""} end/>}
                >
                  Media Types
                </MenuItem>
              </>
            )}

            {/* Sign Out Link */}
            <MenuItem 
              icon={<FaSignOutAlt />} 
              onClick={handleSignOut}
              className="sign-out-button"
            >
              Sign Out
            </MenuItem>
          </Menu>
        </Sidebar>
      </motion.div>
    </Box>
  );
};

export default CustomSidebar;
