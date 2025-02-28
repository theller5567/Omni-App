import './sidebar.scss';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Box, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import './sidebar.scss';
import { Link } from 'react-router-dom';

const CustomSidebar: React.FC = () => {
  const handleSignOut = () => {
    // Implement signout logic here, e.g., clearing tokens, redirecting, etc.
    console.log('User signed out');
  };

  return (
    <Box style={{ display: 'flex', height: '100vh' }}>
      <motion.div
        transition={{ duration: 0.5 }}
        style={{
          height: '100vh',
          backgroundColor: 'var(--secondary-color)',
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Sidebar id="sidebar">
          {/* <Box style={{ position: 'absolute', display: 'block', top: '1rem', right: '0', padding: '10px' }}>
            <IconButton onClick={toggleSidebar}>
              <FaBars style={{ color: '#fff' }} />
            </IconButton>
          </Box> */}
          <Menu className="sidebar-menu">
            <MenuItem component={<Link to="/account" />}> <Avatar src="https://via.placeholder.com/150" /></MenuItem>
            <MenuItem component={<Link to="/" />}> Home</MenuItem>
            <MenuItem component={<Link to="/media-library" />}> Media Library</MenuItem>
          </Menu>
          <Menu className="sidebar-footer">
          <MenuItem onClick={handleSignOut}> Sign Out</MenuItem>
          </Menu>
        </Sidebar>
      </motion.div>
      <Box style={{ flex: 1, padding: '20px' }}>
        {/* Main content goes here */}
      </Box>
    </Box>
  );
};

export default CustomSidebar;