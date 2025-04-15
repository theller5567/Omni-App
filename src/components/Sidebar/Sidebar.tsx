import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";

// In the component props, remove unused props
interface SidebarItemProps {
  title: string;
  to: string;
  // Remove icon and defaultOpen if not used
}

// Remove unused isActive function if not needed 