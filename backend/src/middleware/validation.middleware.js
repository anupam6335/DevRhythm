const Joi = require('joi');
const constants = require('../config/constants');

class ValidationMiddleware {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      pagination: Joi.object({
        page: Joi.number().integer().min(constants.VALIDATION.PAGINATION.MIN_PAGE).default(1),
        limit: Joi.number()
          .integer()
          .min(constants.VALIDATION.PAGINATION.MIN_LIMIT)
          .max(constants.VALIDATION.PAGINATION.MAX_LIMIT)
          .default(constants.VALIDATION.PAGINATION.DEFAULT_LIMIT),
        sort: Joi.string().pattern(/^[a-zA-Z_]+:(asc|desc)$/),
        search: Joi.string().min(1).max(100)
      }),

      objectId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).required(),

      email: Joi.string().email().required(),

      password: Joi.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required(),

      dateRange: Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
      }),

      fileUpload: Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string().required(),
        size: Joi.number().integer().positive().required(),
        destination: Joi.string(),
        filename: Joi.string(),
        path: Joi.string()
      })
    };
  }

  validate(schema, property = 'body') {
    return (req, res, next) => {
      const data = req[property];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors = error.details.reduce((acc, detail) => {
          const key = detail.path.join('.');
          acc[key] = detail.message;
          return acc;
        }, {});

        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: constants.ERROR_CODES.VALIDATION_ERROR,
            errors: errors
          },
          timestamp: new Date().toISOString()
        });
      }

      req[property] = value;
      next();
    };
  }

  validateParams(schema) {
    return this.validate(schema, 'params');
  }

  validateQuery(schema) {
    return this.validate(schema, 'query');
  }

  validateBody(schema) {
    return this.validate(schema, 'body');
  }

  validateHeaders(schema) {
    return this.validate(schema, 'headers');
  }

  validateFile() {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.file ? [req.file] : req.files;
      const errors = [];

      files.forEach((file, index) => {
        const { error } = this.schemas.fileUpload.validate(file);
        if (error) {
          errors.push({
            file: file.originalname,
            errors: error.details.map(detail => detail.message)
          });
        }
      });

      if (errors.length > 0) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'File validation failed',
            code: constants.ERROR_CODES.VALIDATION_ERROR,
            errors: errors
          },
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  validatePagination() {
    return this.validateQuery(this.schemas.pagination);
  }

  validateObjectId(paramName = 'id') {
    return this.validateParams(
      Joi.object({
        [paramName]: this.schemas.objectId
      })
    );
  }

  validateEmail() {
    return this.validateBody(
      Joi.object({
        email: this.schemas.email
      })
    );
  }

  validateDateRange() {
    return this.validateQuery(this.schemas.dateRange);
  }

  createSchema(baseSchema) {
    return Joi.object(baseSchema);
  }

  extendSchema(baseSchema, extensions) {
    return baseSchema.append(extensions);
  }

  middleware() {
    return {
      validate: this.validate.bind(this),
      validateParams: this.validateParams.bind(this),
      validateQuery: this.validateQuery.bind(this),
      validateBody: this.validateBody.bind(this),
      validateHeaders: this.validateHeaders.bind(this),
      validateFile: this.validateFile.bind(this),
      validatePagination: this.validatePagination.bind(this),
      validateObjectId: this.validateObjectId.bind(this),
      validateEmail: this.validateEmail.bind(this),
      validateDateRange: this.validateDateRange.bind(this),
      createSchema: this.createSchema.bind(this),
      extendSchema: this.extendSchema.bind(this),
      schemas: this.schemas
    };
  }
}

module.exports = new ValidationMiddleware();