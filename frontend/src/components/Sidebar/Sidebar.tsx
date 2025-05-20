import "./sidebar.scss";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Avatar, CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import "./sidebar.scss";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  FaChevronDown,
  FaPalette
} from "react-icons/fa";
import { useState, useEffect, ReactNode } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys, useUserProfile } from '../../hooks/query-hooks';

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

// Custom animated submenu component to replace the default SubMenu
interface AnimatedSubMenuProps {
  label: ReactNode;
  children: ReactNode;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  className?: string;
}

const AnimatedSubMenu: React.FC<AnimatedSubMenuProps> = ({ 
  label, 
  children, 
  open, 
  onOpenChange, 
  className 
}) => {
  return (
    <Box className={className}>
      <Box 
        onClick={() => {
          onOpenChange(!open);
        }} 
        sx={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        {label}
      </Box>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{ overflow: 'hidden' }}
          >
            <Box sx={{ paddingLeft: '1rem' }}>
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

const CustomSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading: isUserLoading, error: userError } = useUserProfile();

  const isAdmin = userProfile && (userProfile.role === "admin" || userProfile.role === "superAdmin");

  // Apply CSS variables when theme changes
  useEffect(() => {
    setCssVariables(theme);
  }, [theme]);

  const handleSignOut = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Sidebar: User signing out...");
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");

    // Clear the user profile from TanStack Query cache
    queryClient.removeQueries({ queryKey: QueryKeys.userProfile });
    // Optionally, clear allUsers cache as well
    queryClient.removeQueries({ queryKey: QueryKeys.allUsers });
    
    // Consider invalidating other queries that depend on auth state if necessary
    // queryClient.invalidateQueries(); // Or more specific keys

    if (process.env.NODE_ENV === 'development') {
      console.log('Sidebar: User and auth tokens cleared, navigating to login.');
    }
    navigate("/login");
  };

  // Detect active submenu based on current route
  useEffect(() => {
    const onAdminPage = isAdmin && (
      location.pathname === "/account" ||
      location.pathname === "/admin-dashboard" ||
      location.pathname === "/admin-tags" ||
      location.pathname === "/admin-users" ||
      location.pathname === "/admin-media-types"
    );

    if (onAdminPage) {
      if (openSubMenu === null) {
        setOpenSubMenu("admin");
      } else {
      }
    } else { // Not on an admin page (or not admin)
      if (openSubMenu === "admin") {
        setOpenSubMenu(null);
      } else {
      }
    }
  }, [location.pathname, isAdmin]); // openSubMenu REMOVED from dependencies

  // Avatar and user name display logic
  const renderUserProfile = () => {
    if (isUserLoading) {
      return (
        <Box display="flex" alignItems="center" justifyContent="center" height="60px">
          <CircularProgress size={24} />
        </Box>
      );
    }
    if (userError || !userProfile) {
      // Minimal display or error indication if profile fetch failed or no profile
      return (
        <Box display="flex" alignItems="center" justifyContent="center" height="60px">
          <Avatar className="sidebar-avatar" /> 
          <span className="user-name">User</span>
        </Box>
      );
    }

    // Display for Admin users (AnimatedSubMenu)
    if (isAdmin) {
      return (
        <div className="user-profile">
          <Avatar 
            className="sidebar-avatar" 
            src={userProfile.avatar || undefined} 
            alt={`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
          />
          <span className="user-name">
            {`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
            {userProfile.username && <span className="username-tag">@{userProfile.username}</span>}
          </span>
          <FaChevronDown className={`profile-chevron ${openSubMenu === "admin" ? 'chevron-open' : ''}`} />
        </div>
      );
    }

    // Display for non-admin users (Direct MenuItem link)
    return (
      <div className="user-profile">
        <Avatar 
          className="sidebar-avatar" 
          src={userProfile.avatar || undefined} 
          alt={`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
        />
        <span className="user-name">
          {`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
        </span>
      </div>
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

          <Menu className="sidebar-menu">
            {isAdmin ? (
              <AnimatedSubMenu
                label={renderUserProfile()}
                open={openSubMenu === "admin"}
                onOpenChange={(isOpen) => {
                  setOpenSubMenu(isOpen ? "admin" : null);
                }}
                className="admin-profile-submenu"
                children={
                  <>
                    <MenuItem 
                      icon={<FaUser />} 
                      className={location.pathname === "/account" ? "active-item" : ""}
                      component={
                        <NavLink 
                          to="/account" 
                          className={({isActive}) => isActive ? "active-menu-item" : ""}
                          end
                        />
                      }
                    >
                      Account
                    </MenuItem>
                    <MenuItem 
                      icon={<FaTachometerAlt />} 
                      className={location.pathname === "/admin-dashboard" ? "active-item" : ""}
                      component={
                        <NavLink 
                          to="/admin-dashboard" 
                          className={({isActive}) => isActive ? "active-menu-item" : ""}
                          end
                        />
                      }
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem 
                      icon={<FaTags />} 
                      className={location.pathname === "/admin-tags" ? "active-item" : ""}
                      component={
                        <NavLink 
                          to="/admin-tags" 
                          className={({isActive}) => isActive ? "active-menu-item" : ""}
                          end
                        />
                      }
                    >
                      Tags
                    </MenuItem>
                    <MenuItem 
                      icon={<FaUsers />} 
                      className={location.pathname === "/admin-users" ? "active-item" : ""}
                      component={
                        <NavLink 
                          to="/admin-users" 
                          className={({isActive}) => isActive ? "active-menu-item" : ""}
                          end
                        />
                      }
                    >
                      Users
                    </MenuItem>
                    <MenuItem 
                      icon={<FaLayerGroup />} 
                      className={location.pathname === "/admin-media-types" ? "active-item" : ""}
                      component={
                        <NavLink 
                          to="/admin-media-types" 
                          className={({isActive}) => isActive ? "active-menu-item" : ""}
                          end
                        />
                      }
                    >
                      Media Types
                    </MenuItem>
                  </>
                }
              />
            ) : (
              // Non-admin users get a direct link to their account page if userProfile exists
              userProfile ? (
                <MenuItem 
                  className="user-menu-item"
                  component={<NavLink to="/account" className={({ isActive }) => (isActive ? "active-menu-item" : "")}/>}
                >
                  {renderUserProfile()}
                </MenuItem>
              ) : isUserLoading ? (
                // Show a loading placeholder for the user menu item
                <MenuItem className="user-menu-item">
                  <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="40px">
                    <CircularProgress size={20} />
                  </Box>
                </MenuItem>
              ) : null // Or some error/fallback display if needed when not loading and no profile
            )}

            {/* <MenuItem 
              icon={<FaHubspot />} 
              className={location.pathname === "/home" ? "active-item" : ""}
              component={
                <NavLink 
                  to="/home" 
                  className={({isActive}) => isActive ? "active-menu-item" : ""}
                  end
                />
              }
            >
              HubSpot
            </MenuItem> */}
            
            <MenuItem 
              icon={<FaImages />} 
              className={location.pathname === "/media-library" ? "active-item" : ""}
              component={
                <NavLink 
                  to="/media-library" 
                  className={({isActive}) => isActive ? "active-menu-item" : ""}
                  end
                />
              }
            >
              Media Library
            </MenuItem>
            
            {isAdmin && (
              <MenuItem 
                icon={<FaPalette />} 
                className={location.pathname === "/style-guide" ? "active-item" : ""}
                component={
                  <NavLink 
                    to="/style-guide" 
                    className={({isActive}) => isActive ? "active-menu-item" : ""}
                    end
                  />
                }
              >
                Style Guide
              </MenuItem>
            )}
          </Menu>
          
          <Menu className="sidebar-footer">
            <MenuItem 
              icon={<FaSignOutAlt />} 
              onClick={handleSignOut}
              className="signout-button"
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
