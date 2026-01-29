const AppError = require('../utils/errors/AppError');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.env === 'development') {
    console.error('Error:', err);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message
    }));
    err = new AppError('Validation failed', 400, { errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    err = new AppError(`${field} already exists`, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    err = new AppError('Token expired', 401);
  }

  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    data: null,
    meta: {},
    error: err.error || null
  });
};

module.exports = errorHandler;