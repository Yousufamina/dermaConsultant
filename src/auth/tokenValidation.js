import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET_KEY ; 

// ==================== AUTH MIDDLEWARE ====================

export const auth = async (req, res, next) => {
  try {
    console.log("token")
    console.log(req.header('Authorization'))

    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    console.log("Called before")
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Called after")
    
    // Add user from payload
    req.user = { id: decoded.userId };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};