const JWTUtil = require("../utils/jwt");
const ApiResponse = require("../utils/apiResponse");

/**
 * Middleware xác thực JWT token
 */
const authenticate = (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, "Token không được cung cấp");
    }

    // Tách token ra khỏi "Bearer "
    const token = authHeader.substring(7);

    // Verify token
    const decoded = JWTUtil.verifyToken(token);

    // Gán thông tin user vào req để dùng ở controller
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, "Token không hợp lệ hoặc đã hết hạn");
  }
};

/**
 * Middleware kiểm tra role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Chưa xác thực");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, "Bạn không có quyền truy cập");
    }

    next();
  };
};

/**
 * Middleware kiểm tra email đã verify chưa
 * Dùng cho các API quan trọng (create post, comment...)
 */
const requireVerifiedEmail = async (req, res, next) => {
  try {
    const db = require("../models");
    const user = await db.User.findByPk(req.user.userId);

    if (!user) {
      return ApiResponse.unauthorized(res, "User không tồn tại");
    }

    if (!user.is_verified) {
      return ApiResponse.forbidden(
        res,
        "Vui lòng xác thực email trước khi thực hiện hành động này"
      );
    }

    next();
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};

module.exports = {
  authenticate,
  authorize,
  requireVerifiedEmail,
};
