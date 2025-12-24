// server.js
const app = require("./src/app");
const db = require("./src/models");
const { testConnection } = require("./src/config/db"); // ✅ Import từ config

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Test database connection
    await testConnection(); // ✅ Gọi từ config/db

    // 2. Sync database
    await db.sequelize.sync({
      alter: false,
    });
    console.log("✅ Database synced!");

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║  🚀 Server is running!                                ║
║  📍 URL: http://localhost:${PORT}                     ║
║  📝 Environment: ${process.env.NODE_ENV}              ║
║  📚 API Docs: http://localhost:${PORT}/api/v1/health  ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
