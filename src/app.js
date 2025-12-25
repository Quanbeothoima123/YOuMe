const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// 1. Helmet - Set various HTTP headers for security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Cho phép inline styles
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Tắt nếu cần load resources từ CDN
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS - Cho phép frontend gọi API
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // Không dùng cookies
  })
);

// 3. Rate Limiting - Giới hạn số request
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests mỗi 15 phút
  message: {
    status: "error",
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Áp dụng rate limiting cho tất cả routes
app.use("/api/", limiter);

// Rate limiting nghiêm ngặt hơn cho authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Chỉ 5 lần login/register mỗi 15 phút
  message: {
    status: "error",
    message: "Quá nhiều lần đăng nhập/đăng ký, vui lòng thử lại sau 15 phút",
  },
  skipSuccessfulRequests: true, // Không đếm request thành công
});

// ============================================
// BODY PARSERS
// ============================================

app.use(express.json({ limit: "10mb" })); // Giới hạn size request body
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// CUSTOM SECURITY HEADERS
// ============================================

app.use((req, res, next) => {
  // Chống clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Chống MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS Protection (cũ nhưng vẫn tốt cho browser cũ)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const routes = require("./routes");
app.use("/api", routes);

// Áp dụng auth rate limiter cho auth routes
const authRoutes = require("./routes/v1/authRoute");
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Không leak stack trace trong production
  const errorResponse = {
    status: "error",
    message: err.message || "Internal Server Error",
  };

  // Chỉ show stack trace trong development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

module.exports = app;
