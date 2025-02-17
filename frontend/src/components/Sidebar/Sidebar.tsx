import React from 'react';
import { Link } from 'react-router-dom'; // For navigation links
import { motion } from 'framer-motion'; // Import motion from framer-motion
import { FaSignOutAlt, FaHome, FaUser, FaFilm, FaChevronLeft, FaChevronRight } from 'react-icons/fa';  // Import icons for links
import './sidebar.scss';
// eslint-disable-next-line
import omnilogo from '../../assets/omni-circle-logo.svg';

interface SidebarProps {
  isVisible: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, toggleSidebar }) => {
  return (
    <motion.div
      className={`sidebar ${isVisible ? 'visible' : 'hidden'}`}
      initial={{ width: '80px' }} // Initial width when collapsed
      animate={{ width: isVisible ? '250px' : '100px' }} // Animate width change
      transition={{ duration: 0.3 }} // Sidebar animation duration
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <div className="sidebar-content">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={omnilogo} alt="Omni Logo" />
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

      {/* New Blue Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <div className="toggle-icon">{isVisible ? <FaChevronLeft /> : <FaChevronRight />}</div>
      </button>
    </motion.div>
  );
};

export default Sidebar;