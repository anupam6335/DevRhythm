const formatResponse = (message, data = null, meta = null, error = null) => {
  const response = {
    success: true,
    statusCode: 200,
    message,
    data,
    meta: meta || {},
    error: error || null
  };
  
  return response;
};

const formatErrorResponse = (statusCode, message, error = null) => {
  return {
    success: false,
    statusCode,
    message,
    data: null,
    meta: {},
    error
  };
};

module.exports = {
  formatResponse,
  formatErrorResponse
};