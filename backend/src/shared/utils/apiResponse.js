/**
 * Chuẩn hóa API Response Format cho toàn bộ hệ thống
 * Mọi response đều tuân theo cấu trúc này
 */

/**
 * Trả về response thành công
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 * @param {Object} meta - Pagination metadata
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Trả về response lỗi
 */
const error = (res, message = 'Internal Server Error', statusCode = 500, code = null, details = null) => {
  const response = {
    success: false,
    error: { code: code || 'SERVER_ERROR', message },
  };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
};

/**
 * Trả về response phân trang
 */
const paginated = (res, data, { page, limit, total }) => {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { success, error, paginated };
