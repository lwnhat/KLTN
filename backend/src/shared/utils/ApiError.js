/**
 * Custom Error class cho API errors
 * Giúp middleware xử lý lỗi phân biệt operational errors vs programming errors
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Operational error (có thể xảy ra bình thường)
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details = null) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Bạn cần đăng nhập để thực hiện thao tác này.') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(code = 'NOT_FOUND', message = 'Không tìm thấy tài nguyên.') {
    return new ApiError(404, code, message);
  }

  static conflict(code, message, details = null) {
    return new ApiError(409, code, message, details);
  }

  static tooManyRequests(message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Lỗi máy chủ nội bộ.') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

module.exports = ApiError;
