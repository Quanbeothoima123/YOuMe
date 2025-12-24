// src/models/index.js
const { sequelize } = require("../config/db");
const { Sequelize } = require("sequelize");

// Import models
const Role = require("./Role")(sequelize);
const User = require("./User")(sequelize);
const SocialAccount = require("./SocialAccount")(sequelize);
const VerificationToken = require("./VerificationToken")(sequelize);

// Định nghĩa các quan hệ (Associations)
const db = {
  sequelize,
  Sequelize,

  // Models
  Role,
  User,
  SocialAccount,
  VerificationToken,
};

// ==================== RELATIONSHIPS ====================

// 1. Role - User (1:N)
db.Role.hasMany(db.User, {
  foreignKey: "role_id",
  as: "users",
});
db.User.belongsTo(db.Role, {
  foreignKey: "role_id",
  as: "role",
});

// 2. User - SocialAccount (1:N)
db.User.hasMany(db.SocialAccount, {
  foreignKey: "user_id",
  as: "socialAccounts",
});
db.SocialAccount.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});

// 3. User - VerificationToken (1:N)
db.User.hasMany(db.VerificationToken, {
  foreignKey: "user_id",
  as: "verificationTokens",
});
db.VerificationToken.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});

module.exports = db;
