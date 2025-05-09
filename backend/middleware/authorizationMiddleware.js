/**
 * Authorization middleware that checks if the authenticated user has the required role(s)
 * @param {string[]} roles - Array of role names that are authorized to access the route
 * @returns {function} Express middleware function
 */
export const authorize = (roles = []) => {
  // Convert a single role to array if needed
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // At this point, user should be authenticated and req.user should exist
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user's role is in the authorized roles list
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied: ${req.user.role} role is not authorized` 
      });
    }

    // User is authorized, continue to the next middleware/route handler
    next();
  };
}; 