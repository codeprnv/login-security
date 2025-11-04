import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Update session last used time
    await Session.findOneAndUpdate(
      { userId: decoded.userId },
      { lastUsedAt: new Date() }
    );

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export default authenticateToken;
