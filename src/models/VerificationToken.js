const { DataTypes } = require("sequelize");
const crypto = require("crypto");

module.exports = (sequelize) => {
  const VerificationToken = sequelize.define(
    "VerificationToken",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM("email_verification", "password_reset"),
        defaultValue: "email_verification",
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "verification_tokens",
      timestamps: false,
      indexes: [{ fields: ["token"] }, { fields: ["user_id", "type"] }],
    }
  );

  // Static method: Tạo token mới
  VerificationToken.createToken = async function (
    userId,
    type = "email_verification"
  ) {
    // Tạo token ngẫu nhiên 32 bytes
    const token = crypto.randomBytes(32).toString("hex");

    // Token hết hạn sau 24 giờ
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Xóa các token cũ chưa dùng của user này (cleanup)
    await this.destroy({
      where: {
        user_id: userId,
        type,
        used_at: null,
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date(),
        },
      },
    });

    // Tạo token mới
    return await this.create({
      user_id: userId,
      token,
      type,
      expires_at: expiresAt,
    });
  };

  // Instance method: Kiểm tra token còn hạn không
  VerificationToken.prototype.isExpired = function () {
    return new Date() > this.expires_at;
  };

  // Instance method: Đánh dấu token đã dùng
  VerificationToken.prototype.markAsUsed = async function () {
    this.used_at = new Date();
    await this.save();
  };

  return VerificationToken;
};
