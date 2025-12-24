const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          isIn: [["user", "moderator", "admin"]],
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "roles",
      timestamps: false, // Không có createdAt, updatedAt
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],
    }
  );

  return Role;
};
