const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const AppError = require('../utils/errors/AppError');

const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError('Authentication required', 401);
    const decoded = await verifyToken(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) throw new AppError('User not found', 404);
    if (!user.isActive) throw new AppError('Account deactivated', 403);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = await verifyToken(token, config.jwt.secret);
      const user = await User.findById(decoded.userId).select('-__v');
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
};

module.exports = { auth, optionalAuth, generateToken, generateRefreshToken };