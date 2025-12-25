const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/authController");
const {
  validateRegister,
  validateLogin,
} = require("../../validators/authValidator");
const { authenticate } = require("../../middlewares/authMiddleware");
const {
  sanitizeInput,
  preventBruteForce,
} = require("../../middlewares/securityMiddleware");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
router.post(
  "/register",
  sanitizeInput, // Chống XSS
  validateRegister, // Validate dữ liệu
  AuthController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
router.post(
  "/login",
  sanitizeInput, // Chống XSS
  preventBruteForce, // Chống brute force
  validateLogin, // Validate dữ liệu
  AuthController.login
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Lấy thông tin user hiện tại
 * @access  Private (cần token)
 */
router.get("/profile", authenticate, AuthController.getProfile);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Làm mới access token
 * @access  Public
 */
router.post("/refresh-token", AuthController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Đăng xuất
 * @access  Private (cần token)
 */
router.post("/logout", authenticate, AuthController.logout);

/**
 * @route   GET /api/v1/auth/verify-email?token=xxx
 * @desc    Xác thực email (click từ link trong email)
 * @access  Public
 */
router.get("/verify-email", AuthController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Gửi lại email xác thực
 * @access  Private (cần token)
 */
router.post(
  "/resend-verification",
  authenticate,
  AuthController.resendVerification
);

module.exports = router;
