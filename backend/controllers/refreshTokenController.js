import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const handleRefreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Optionally, you can check if the refresh token is revoked or not
    // This would require storing refresh tokens in the database

    const newAccessToken = jwt.sign(
      { email: user.email, id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '60m' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = isProd ? 'none' : 'lax';
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
}; 