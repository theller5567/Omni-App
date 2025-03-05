import './sidebar.scss';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Box, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import './sidebar.scss';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { FaHome, FaImages, FaSignOutAlt } from "react-icons/fa";

const CustomSidebar: React.FC = () => {

  const userData = useSelector((state: RootState) => state.user);
  //const { email, firstName, lastName, avatar } = userData;
  console.log(userData);
  
  const handleSignOut = () => {
    console.log('User signed out');
    localStorage.removeItem('authToken');
    window.location.href = '/';
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
            <MenuItem id="sidebar-account" component={<Link to="/account" />}> <Avatar src={userData.avatar} /> <span>{userData.firstName} {userData.lastName}</span></MenuItem>
            <MenuItem id="sidebar-home" component={<Link to="/home" />}><FaHome /> Home</MenuItem>
            <MenuItem id="sidebar-media-library" component={<Link to="/media-library" />}> <FaImages /> Media Library</MenuItem>
          </Menu>
          <Menu className="sidebar-footer">
          <MenuItem onClick={handleSignOut}><FaSignOutAlt /> Sign Out</MenuItem>
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