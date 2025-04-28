import LoggerService from '../services/loggerService.js';

export const logoutUser = async (req, res) => {
  try {
    // Get the user info from the authentication middleware
    const user = req.user;
    
    // If no user is found, just return success
    if (!user) {
      return res.status(200).json({ message: 'Logged out' });
    }
    
    // Get client info for logging
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Track logout activity
    await LoggerService.logUserActivity({
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      action: 'LOGOUT',
      ip,
      userAgent,
      details: {
        success: true
      }
    });
    
    // Return success
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Error logging out' });
  }
}; 