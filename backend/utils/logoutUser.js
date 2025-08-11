import LoggerService from '../services/loggerService.js';

export const logoutUser = async (req, res) => {
  try {
    // Always attempt to clear cookies regardless of auth state
    const user = req.user;
    
    // Get client info for logging
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Track logout activity if we have a user
    if (user) {
      await LoggerService.logUserActivity({
        userId: user.id,
        username: user.username || user.email,
        email: user.email,
        action: 'LOGOUT',
        ip,
        userAgent,
        details: { success: true }
      });
    }
    
    // Clear cookies
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = isProd ? 'none' : 'lax';
    const opts = { httpOnly: true, secure: isProd, sameSite, path: '/' };
    res.clearCookie('accessToken', opts);
    res.clearCookie('refreshToken', opts);

    // Return success
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Error logging out' });
  }
}; 