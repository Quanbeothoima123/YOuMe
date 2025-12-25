/**
 * Middleware bảo mật bổ sung
 */

/**
 * Sanitize input - Loại bỏ các ký tự nguy hiểm
 * Chống XSS injection
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        // Loại bỏ các thẻ HTML và script
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<[^>]*>/g, "")
          .trim();
      }
    });
  }
  next();
};

/**
 * Validate request body không rỗng
 */
const validateRequestBody = (req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Request body không được để trống",
      });
    }
  }
  next();
};

/**
 * Log requests (để audit và debug)
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log khi response được gửi
  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    };

    // Chỉ log trong development hoặc log vào file trong production
    if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify(log, null, 2));
    }
  });

  next();
};

/**
 * Chống brute force - Track failed login attempts
 * (Đơn giản, dùng memory. Production nên dùng Redis)
 */
const loginAttempts = new Map();

const preventBruteForce = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const attempts = loginAttempts.get(ip) || {
    count: 0,
    lastAttempt: Date.now(),
  };

  // Reset sau 1 giờ
  if (Date.now() - attempts.lastAttempt > 3600000) {
    loginAttempts.delete(ip);
    return next();
  }

  // Block nếu quá 10 lần thất bại
  if (attempts.count >= 10) {
    return res.status(429).json({
      status: "error",
      message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 giờ",
    });
  }

  // Lưu thông tin để check sau
  req.loginAttemptTracking = { ip, attempts };

  next();
};

/**
 * Track failed login (gọi trong authController khi login thất bại)
 */
const trackFailedLogin = (ip) => {
  const attempts = loginAttempts.get(ip) || {
    count: 0,
    lastAttempt: Date.now(),
  };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
};

/**
 * Reset login attempts (gọi khi login thành công)
 */
const resetLoginAttempts = (ip) => {
  loginAttempts.delete(ip);
};

/**
 * Validate UUID format
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const uuid = req.params[paramName];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        status: "error",
        message: "UUID không hợp lệ",
      });
    }

    next();
  };
};

module.exports = {
  sanitizeInput,
  validateRequestBody,
  requestLogger,
  preventBruteForce,
  trackFailedLogin,
  resetLoginAttempts,
  validateUUID,
};
