const constants = require('../config/constants');

class ApiResponse {
  static success(res, data = {}, message = 'Success', statusCode = constants.HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static created(res, data = {}, message = 'Resource created successfully') {
    return this.success(res, data, message, constants.HTTP_STATUS.CREATED);
  }

  static accepted(res, data = {}, message = 'Request accepted') {
    return this.success(res, data, message, constants.HTTP_STATUS.ACCEPTED);
  }

  static noContent(res) {
    return res.status(constants.HTTP_STATUS.NO_CONTENT).end();
  }

  static error(res, { message = 'An error occurred', code = constants.ERROR_CODES.SERVER_ERROR, statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null, error = null }) {
    const response = {
      success: false,
      error: {
        message,
        code
      },
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.error.errors = errors;
    }

    if (error && process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
      response.error.details = error.message;
    }

    return res.status(statusCode).json(response);
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, {
      message,
      code: constants.ERROR_CODES.VALIDATION_ERROR,
      statusCode: constants.HTTP_STATUS.BAD_REQUEST,
      errors
    });
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, {
      message,
      code: constants.ERROR_CODES.AUTH_ERROR,
      statusCode: constants.HTTP_STATUS.UNAUTHORIZED
    });
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, {
      message,
      code: constants.ERROR_CODES.AUTH_ERROR,
      statusCode: constants.HTTP_STATUS.FORBIDDEN
    });
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, {
      message,
      code: constants.ERROR_CODES.NOT_FOUND_ERROR,
      statusCode: constants.HTTP_STATUS.NOT_FOUND
    });
  }

  static conflict(res, message = 'Resource already exists') {
    return this.error(res, {
      message,
      code: constants.ERROR_CODES.DUPLICATE_ERROR,
      statusCode: constants.HTTP_STATUS.CONFLICT
    });
  }

  static tooManyRequests(res, message = 'Too many requests', retryAfter = null) {
    const response = this.error(res, {
      message,
      code: constants.ERROR_CODES.RATE_LIMIT_ERROR,
      statusCode: constants.HTTP_STATUS.TOO_MANY_REQUESTS
    });

    if (retryAfter) {
      res.set('Retry-After', retryAfter);
    }

    return response;
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }

  static download(res, fileData, fileName, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(fileData);
  }

  static redirect(res, url, statusCode = constants.HTTP_STATUS.FOUND) {
    return res.redirect(statusCode, url);
  }

  static withMeta(res, data, meta = {}, message = 'Success') {
    return res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ApiResponse;