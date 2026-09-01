const ApiError = require('../utils/ApiError');

// Thứ tự phân quyền từ thấp đến cao
const ROLE_HIERARCHY = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

/**
 * Middleware phân quyền RBAC (Role-Based Access Control)
 *
 * @param {...string} allowedRoles - Các roles được phép truy cập
 * @example
 * router.delete('/products/:id', authenticate, authorize('admin'), deleteProduct)
 * router.put('/orders/:id/status', authenticate, authorize('staff', 'manager', 'admin'), updateStatus)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    const hasPermission = allowedRoles.some(
      (role) => userRoleLevel >= (ROLE_HIERARCHY[role] ?? 0)
    );

    if (!hasPermission) {
      return next(
        ApiError.forbidden(
          `Quyền "${req.user.role}" không đủ để thực hiện thao tác này. Yêu cầu: ${allowedRoles.join(' | ')}.`
        )
      );
    }

    next();
  };
};

/**
 * Middleware kiểm tra email đã xác thực
 */
const requireVerified = (req, res, next) => {
  if (!req.user?.is_verified) {
    return next(
      ApiError.forbidden('Vui lòng xác thực email trước khi thực hiện thao tác này.')
    );
  }
  next();
};

module.exports = { authorize, requireVerified };
