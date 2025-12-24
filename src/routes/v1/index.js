const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./authRoute");

// Mount routes
router.use("/auth", authRoutes);

// Health check cho API v1
router.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "API v1 is running!",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
