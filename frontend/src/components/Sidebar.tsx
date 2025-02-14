import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // For navigation links
import { motion } from 'framer-motion'; // Import motion from framer-motion
import './component_styles/sidebar.scss'; // Import the CSS file for styling
import { FaSignOutAlt, FaAtlassian, FaHome, FaUser, FaFilm } from 'react-icons/fa';  // Import icons for links

const Sidebar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true); // Sidebar visibility state

  const toggleSidebar = () => {
    setIsVisible(!isVisible); // Toggle the sidebar visibility
  };

  return (
    <motion.div
      className={`sidebar ${isVisible ? 'visible' : 'hidden'}`}
      initial={{ width: '80px' }} // Initial width when collapsed
      animate={{ width: isVisible ? '250px' : '80px' }} // Animate width change
      transition={{ duration: 0.3 }} // Sidebar animation duration
    >
      <div className="sidebar-content">
        {/* Menu Button (to toggle sidebar visibility) */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰ {/* Hamburger icon */}
      </button>
        {/* Logo */}
        <div className="sidebar-logo">
          <FaAtlassian />
        </div>

        {/* Navigation Links */}
        <motion.nav className="sidebar-nav">
          <div className="sidebar-link">
            <Link to="/account" className="link-item">
              <div className="icon-circle">
                <FaUser /> {/* User icon */}
              </div>
              <span className="text-link">{isVisible && "Account"}</span> {/* Show text only when sidebar is visible */}
            </Link>
          </div>
          <div className="sidebar-link">
            <Link to="/home" className="link-item">
              <div className="icon-circle">
                <FaHome /> {/* Home icon */}
              </div>
              <span className="text-link">{isVisible && "Home"}</span>
            </Link>
          </div>
          <div className="sidebar-link">
            <Link to="/media-library" className="link-item">
              <div className="icon-circle">
                <FaFilm /> {/* Media library icon */}
              </div>
              <span className="text-link">{isVisible && "Media Library"}</span>
            </Link>
          </div>
        </motion.nav>

        {/* Sign Out Button */}
        <div className="sidebar-signout sidebar-link">
          <Link to="/signout" className="link-item">
            <div className="icon-circle">
              <FaSignOutAlt /> {/* Media library icon */}
            </div>
            <span className="text-link">{isVisible && "Signout"}</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;