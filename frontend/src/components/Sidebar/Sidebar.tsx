import "./sidebar.scss";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import "./sidebar.scss";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { FaHubspot, FaImages, FaSignOutAlt } from "react-icons/fa";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CustomSidebar: React.FC = () => {
  const userData = useSelector((state: RootState) => state.user);
  const location = useLocation();

  const handleSignOut = () => {
    console.log("User signed out");
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  // Function to update active class on parent elements
  const updateActiveClass = () => {
    // Remove 'active' class from all parent elements
    document.querySelectorAll('.ps-menuitem-root.active').forEach(parent => {
      parent.classList.remove('active');
    });

    // Add 'active' class to parent elements of active links
    document.querySelectorAll('.active-menu-item').forEach(child => {
      const parent = child.closest('.ps-menuitem-root');
      if (parent) {
        parent.classList.add('active');
      }
    });
  };

  // Call the function initially to set the active classes
  updateActiveClass();

  // Optionally, you can call this function whenever the route changes
  // For example, using a useEffect hook in a React component
  useEffect(() => {
    updateActiveClass();
  }, [location.pathname]); // Assuming you have access to the location object

  return (
    <Box style={{ display: "flex", height: "100vh" }}>
      <motion.div
        transition={{ duration: 0.5 }}
        style={{
          height: "100vh",
          backgroundColor: "var(--secondary-color)",
          color: "#fff",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Sidebar id="sidebar">
          {/* <Box style={{ position: 'absolute', display: 'block', top: '1rem', right: '0', padding: '10px' }}>
            <IconButton onClick={toggleSidebar}>
              <FaBars style={{ color: '#fff' }} />
            </IconButton>
          </Box> */}
          <Menu className="sidebar-menu">
            {(userData.currentUser.role === "admin" || userData.currentUser.role === "superAdmin") ? (
              <SubMenu
                title="Admin Options"
                className="sidebar-account"
                label={userData.currentUser.firstName + " " + userData.currentUser.lastName}
                icon={<Avatar className="sidebar-avatar-icon" src={userData.currentUser.avatar} />}
                style={{
                  padding: "20px",
                  height: "auto"
                }}
              >
                <MenuItem component="div">
                  <NavLink to="/account" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                    Account
                  </NavLink>
                </MenuItem>
                <MenuItem component="div">
                  <NavLink to="/admin-dashboard" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                    Admin Dashboard
                  </NavLink>
                </MenuItem>
                <MenuItem component="div">
                  <NavLink to="/admin-tags" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                    Tags
                  </NavLink>
                </MenuItem>
                <MenuItem component="div">
                  <NavLink to="/admin-users" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                    Users
                  </NavLink>
                </MenuItem>
                <MenuItem component="div">
                  <NavLink to="/admin-media-types" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                    Media Types
                  </NavLink>
                </MenuItem>
              </SubMenu>
            ) : (
             
                <MenuItem component="div" id="sidebar-account">
                  <NavLink to="/account" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                    <Avatar src={userData.currentUser.avatar} />
                    <span>
                      {userData.currentUser.firstName} {userData.currentUser.lastName}
                    </span>
                  </NavLink>
                </MenuItem>

            )}
            <MenuItem component="div">
              <NavLink to="/home" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                <FaHubspot /> HubSpot
              </NavLink>
            </MenuItem>
            <MenuItem component="div">
              <NavLink to="/media-library" className={({ isActive }) => (isActive ? "active-menu-item" : "")}>
                <FaImages /> Media Library
              </NavLink>
            </MenuItem>
          </Menu>
          <Menu className="sidebar-footer">
            <MenuItem onClick={handleSignOut}>
              <FaSignOutAlt /> Sign Out
            </MenuItem>
          </Menu>
        </Sidebar>
      </motion.div>
      <Box style={{ flex: 1, padding: "20px" }}>
        {/* Main content goes here */}
      </Box>
    </Box>
  );
};

export default CustomSidebar;
