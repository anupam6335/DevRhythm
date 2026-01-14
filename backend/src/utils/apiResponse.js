const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('./logger');

class ApiResponse {
  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Version': config.api.version,
      'X-Powered-By': 'DevRhythm'
    };
  }

  success(res, data = null, message = 'Success', statusCode = constants.HTTP_STATUS.OK) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (config.env === 'development' && data && data.pagination) {
      response.pagination = data.pagination;
    }

    res.set(this.defaultHeaders);
    return res.status(statusCode).json(response);
  }

  created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, constants.HTTP_STATUS.CREATED);
  }

  accepted(res, data = null, message = 'Request accepted') {
    return this.success(res, data, message, constants.HTTP_STATUS.ACCEPTED);
  }

  noContent(res, message = 'No content') {
    return this.success(res, null, message, constants.HTTP_STATUS.NO_CONTENT);
  }

  error(res, errorCode, message, statusCode = constants.HTTP_STATUS.BAD_REQUEST, details = null) {
    const response = {
      success: false,
      error: {
        code: errorCode,
        message,
        statusCode,
        details,
        timestamp: new Date().toISOString()
      }
    };

    if (config.env === 'development') {
      response.error.stack = new Error().stack;
    }

    res.set(this.defaultHeaders);
    return res.status(statusCode).json(response);
  }

  badRequest(res, message = 'Bad Request', details = null) {
    return this.error(res, constants.ERROR_CODES.VALIDATION_ERROR, message, constants.HTTP_STATUS.BAD_REQUEST, details);
  }

  unauthorized(res, message = 'Unauthorized', details = null) {
    return this.error(res, constants.ERROR_CODES.AUTHENTICATION_ERROR, message, constants.HTTP_STATUS.UNAUTHORIZED, details);
  }

  forbidden(res, message = 'Forbidden', details = null) {
    return this.error(res, constants.ERROR_CODES.AUTHORIZATION_ERROR, message, constants.HTTP_STATUS.FORBIDDEN, details);
  }

  notFound(res, message = 'Resource not found', details = null) {
    return this.error(res, constants.ERROR_CODES.NOT_FOUND_ERROR, message, constants.HTTP_STATUS.NOT_FOUND, details);
  }

  methodNotAllowed(res, message = 'Method not allowed', details = null) {
    return this.error(res, constants.ERROR_CODES.VALIDATION_ERROR, message, constants.HTTP_STATUS.METHOD_NOT_ALLOWED, details);
  }

  conflict(res, message = 'Resource conflict', details = null) {
    return this.error(res, constants.ERROR_CODES.CONFLICT_ERROR, message, constants.HTTP_STATUS.CONFLICT, details);
  }

  unprocessableEntity(res, message = 'Unprocessable entity', details = null) {
    return this.error(res, constants.ERROR_CODES.VALIDATION_ERROR, message, constants.HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
  }

  tooManyRequests(res, message = 'Too many requests', details = null) {
    return this.error(res, constants.ERROR_CODES.RATE_LIMIT_ERROR, message, constants.HTTP_STATUS.TOO_MANY_REQUESTS, details);
  }

  serverError(res, message = 'Internal server error', details = null) {
    return this.error(res, constants.ERROR_CODES.INTERNAL_SERVER_ERROR, message, constants.HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }

  serviceUnavailable(res, message = 'Service unavailable', details = null) {
    return this.error(res, constants.ERROR_CODES.EXTERNAL_SERVICE_ERROR, message, constants.HTTP_STATUS.SERVICE_UNAVAILABLE, details);
  }

  paginated(res, data, pagination, message = 'Success') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || constants.PAGINATION.DEFAULT_PAGE,
        limit: pagination.limit || constants.PAGINATION.DEFAULT_LIMIT,
        total: pagination.total || 0,
        pages: pagination.pages || 0,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString()
    };

    res.set(this.defaultHeaders);
    return res.status(constants.HTTP_STATUS.OK).json(response);
  }

  download(res, content, filename, contentType = 'application/octet-stream') {
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': content.length,
      'X-API-Version': config.api.version
    });

    return res.send(content);
  }

  redirect(res, url, permanent = false) {
    return res.redirect(permanent ? 301 : 302, url);
  }

  setHeaders(res, headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.set(key, value);
    });
  }

  addPaginationHeaders(res, pagination) {
    const links = [];
    
    if (pagination.hasPrev) {
      links.push(`</api/v1/resource?page=${pagination.page - 1}&limit=${pagination.limit}>; rel="prev"`);
    }
    
    if (pagination.hasNext) {
      links.push(`</api/v1/resource?page=${pagination.page + 1}&limit=${pagination.limit}>; rel="next"`);
    }
    
    links.push(`</api/v1/resource?page=${pagination.pages}&limit=${pagination.limit}>; rel="last"`);
    links.push(`</api/v1/resource?page=1&limit=${pagination.limit}>; rel="first"`);
    
    res.set('Link', links.join(', '));
    res.set('X-Total-Count', pagination.total.toString());
    res.set('X-Total-Pages', pagination.pages.toString());
    res.set('X-Current-Page', pagination.page.toString());
    res.set('X-Per-Page', pagination.limit.toString());
  }

  validateAndRespond(validationResult, res, successCallback) {
    if (!validationResult.isValid) {
      return this.unprocessableEntity(res, 'Validation failed', validationResult.errors);
    }
    
    return successCallback();
  }

  logRequest(req, res, responseData) {
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userId: req.user ? req.user._id : 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      responseTime: Date.now() - req._startTime,
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      logger.warn('API Request Error', logData);
    } else {
      logger.info('API Request Success', logData);
    }
  }

  handleAsyncResponse(promise, res, successMessage = 'Success') {
    return promise
      .then(data => {
        if (data && data.pagination) {
          return this.paginated(res, data.data || data, data.pagination, successMessage);
        }
        return this.success(res, data, successMessage);
      })
      .catch(error => {
        logger.error('Async response error:', error);
        
        if (error.statusCode) {
          return this.error(res, error.code || 'UNKNOWN_ERROR', error.message, error.statusCode, error.details);
        }
        
        return this.serverError(res, 'Internal server error');
      });
  }
}

const apiResponse = new ApiResponse();
module.exports = apiResponse;