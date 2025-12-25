// src/controllers/authController.js
const AuthService = require("../services/authService");
const ApiResponse = require("../utils/apiResponse");
const {
  resetLoginAttempts,
  trackFailedLogin,
} = require("../middlewares/securityMiddleware");
class AuthController {
  /**
   * POST /api/v1/auth/register
   * Đăng ký tài khoản mới
   */
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);

      return ApiResponse.success(res, "Đăng ký thành công", result, 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Đăng nhập
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Reset login attempts khi thành công
      const ip = req.ip || req.connection.remoteAddress;
      resetLoginAttempts(ip);

      return ApiResponse.success(res, "Đăng nhập thành công", result);
    } catch (error) {
      // Track failed login attempts
      const ip = req.ip || req.connection.remoteAddress;
      trackFailedLogin(ip);

      return ApiResponse.error(res, error.message, 401);
    }
  }

  /**
   * GET /api/v1/auth/profile
   * Lấy thông tin user hiện tại (cần auth)
   */
  static async getProfile(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.userId);

      return ApiResponse.success(res, "Lấy thông tin thành công", { user });
    } catch (error) {
      return ApiResponse.error(res, error.message, 404);
    }
  }

  /**
   * POST /api/v1/auth/refresh-token
   * Làm mới access token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.error(res, "Refresh token là bắt buộc", 400);
      }

      const result = await AuthService.refreshToken(refreshToken);

      return ApiResponse.success(res, "Làm mới token thành công", result);
    } catch (error) {
      return ApiResponse.error(res, error.message, 401);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Đăng xuất
   */
  static async logout(req, res, next) {
    try {
      await AuthService.logout(req.user.userId);

      return ApiResponse.success(res, "Đăng xuất thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/v1/auth/verify-email?token=xxx
   * Xác thực email
   */
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;

      if (!token) {
        return ApiResponse.error(res, "Token là bắt buộc", 400);
      }

      const result = await AuthService.verifyEmail(token);

      return ApiResponse.success(
        res,
        "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.",
        result
      );
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Gửi lại email xác thực
   */
  static async resendVerification(req, res, next) {
    try {
      // Lấy userId từ token (user đã login)
      const result = await AuthService.resendVerificationEmail(req.user.userId);

      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = AuthController;
