import "./sidebar.scss";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box, Avatar } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import "./sidebar.scss";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import logoLight from "../../assets/Omni-new-logo-revvity-grey.png";
import logoDark from "../../assets/Omni-new-logo-revvity-white.png";
import { useTheme } from "@mui/material/styles";
import { 
  FaHubspot, 
  FaImages, 
  FaSignOutAlt, 
  FaUser, 
  FaTachometerAlt, 
  FaTags, 
  FaUsers, 
  FaLayerGroup,
  FaChevronDown
} from "react-icons/fa";
import { useState, useEffect, ReactNode } from "react";

// Custom animated submenu component to replace the default SubMenu
interface AnimatedSubMenuProps {
  label: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  className?: string;
}

const AnimatedSubMenu: React.FC<AnimatedSubMenuProps> = ({ 
  label, 
  icon, 
  children, 
  defaultOpen, 
  open, 
  onOpenChange, 
  className 
}) => {
  return (
    <Box className={className}>
      <Box 
        onClick={() => onOpenChange(!open)} 
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
  const userData = useSelector((state: RootState) => state.user);
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const theme = useTheme();
  const isAdmin = userData.currentUser.role === "admin" || userData.currentUser.role === "superAdmin";

  const handleSignOut = () => {
    console.log("User signed out");
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  // Detect active submenu based on current route
  useEffect(() => {
    // Check if the current path matches any admin routes
    if (
      location.pathname === "/account" ||
      location.pathname === "/admin-dashboard" ||
      location.pathname === "/admin-tags" ||
      location.pathname === "/admin-users" ||
      location.pathname === "/admin-media-types"
    ) {
      setOpenSubMenu("admin");
    }
  }, [location.pathname]);

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
              // Replace SubMenu with our custom AnimatedSubMenu
              <AnimatedSubMenu
                label={
                  <div className="user-profile">
                    <Avatar 
                      className="sidebar-avatar" 
                      src={userData.currentUser.avatar} 
                      alt={`${userData.currentUser.firstName} ${userData.currentUser.lastName}`}
                    />
                    <span className="user-name">
                      {userData.currentUser.firstName} {userData.currentUser.lastName}
                      <span className="username-tag">@{userData.currentUser.username}</span>
                    </span>
                    <FaChevronDown className={`profile-chevron ${openSubMenu === "admin" ? 'chevron-open' : ''}`} />
                  </div>
                }
                icon={null}
                className="sidebar-account"
                defaultOpen={openSubMenu === "admin"}
                open={openSubMenu === "admin"}
                onOpenChange={(open) => setOpenSubMenu(open ? "admin" : null)}
              >
                <MenuItem 
                  icon={<FaUser />} 
                  component={<NavLink to="/account" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
                >
                  Account
                </MenuItem>
                <MenuItem 
                  icon={<FaTachometerAlt />} 
                  component={<NavLink to="/admin-dashboard" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
                >
                  Dashboard
                </MenuItem>
                <MenuItem 
                  icon={<FaTags />} 
                  component={<NavLink to="/admin-tags" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
                >
                  Tags
                </MenuItem>
                <MenuItem 
                  icon={<FaUsers />} 
                  component={<NavLink to="/admin-users" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
                >
                  Users
                </MenuItem>
                <MenuItem 
                  icon={<FaLayerGroup />} 
                  component={<NavLink to="/admin-media-types" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
                >
                  Media Types
                </MenuItem>
              </AnimatedSubMenu>
            ) : (
              <MenuItem 
                className="user-menu-item"
                component={<NavLink to="/account" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
              >
                <div className="user-profile">
                  <Avatar 
                    className="sidebar-avatar" 
                    src={userData.currentUser.avatar} 
                    alt={`${userData.currentUser.firstName} ${userData.currentUser.lastName}`}
                  />
                  <span className="user-name">
                    {userData.currentUser.firstName} {userData.currentUser.lastName}
                  </span>
                </div>
              </MenuItem>
            )}

            <MenuItem 
              icon={<FaHubspot />} 
              component={<NavLink to="/home" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
            >
              HubSpot
            </MenuItem>
            
            <MenuItem 
              icon={<FaImages />} 
              component={<NavLink to="/media-library" className={({ isActive }) => (isActive ? "active-menu-item" : "")} />}
            >
              Media Library
            </MenuItem>
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
