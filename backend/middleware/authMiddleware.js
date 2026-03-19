const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    console.log('Auth middleware - Request headers:', req.headers.authorization);

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Auth middleware - Token extracted:', token.substring(0, 20) + '...');

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Auth middleware - Token decoded:', decoded);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log('Auth middleware - User not found for ID:', decoded.id);
                return res.status(401).json({ message: 'User not found' });
            }

            console.log('Auth middleware - User authenticated:', req.user._id, req.user.role);
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        console.log('Auth middleware - No token found in headers');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorize };
