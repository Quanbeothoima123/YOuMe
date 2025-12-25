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
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS - Cho phép frontend gọi API
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// 3. Body Parser (ĐẶT TRƯỚC rate limiting)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Rate Limiting - General (cho tất cả API)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // 100 requests
  message: {
    status: "error",
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Rate Limiting - Auth (nghiêm ngặt hơn)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // CHỈ 5 requests
  message: {
    status: "error",
    message: "Quá nhiều lần đăng nhập/đăng ký, vui lòng thử lại sau 15 phút",
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// CUSTOM SECURITY HEADERS
// ============================================

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check (không có rate limit)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Áp dụng rate limiter CHO LOGIN & REGISTER TRƯỚC
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// Áp dụng general limiter cho TẤT CẢ API còn lại
app.use("/api/", generalLimiter);

// Mount tất cả routes
const routes = require("./routes");
app.use("/api", routes);

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

  const errorResponse = {
    status: "error",
    message: err.message || "Internal Server Error",
  };

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

module.exports = app;
