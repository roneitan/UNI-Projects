"use strict";
const { Model } = require("sequelize");
const User = require("./user");

module.exports = (sequelize, DataTypes) => {
  class Connection extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "userId" });
      this.belongsTo(models.User, { foreignKey: "friendId" });
    }
  }

  Connection.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: User,
          key: "id",
        },
      },
      friendId: {
        type: DataTypes.INTEGER,
        references: {
          model: User,
          key: "id",
        },
      },
      approved: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: "Connection",
      tableName: "Connections",
      underscored: true,
    }
  );

  return Connection;
};
