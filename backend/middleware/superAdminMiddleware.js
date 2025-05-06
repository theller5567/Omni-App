/**
 * Middleware to restrict route access to superAdmin users only
 */
export const isSuperAdmin = (req, res, next) => {
  // Check if user exists and has superAdmin role
  if (!req.user || req.user.role !== 'superAdmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SuperAdmin privileges required.'
    });
  }
  
  // If superAdmin, continue to the next middleware/route handler
  next();
}; 