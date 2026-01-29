const Joi = require('joi');
const AppError = require('../utils/errors/AppError');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property] || {};
    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));
      throw new AppError('Validation failed', 400, { errors });
    }
    next();
  };
};

module.exports = validate;