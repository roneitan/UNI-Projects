"use strict";
const { Model } = require("sequelize");
const User = require("./user");
module.exports = (sequelize, DataTypes) => {
  class User_Credentials extends Model {
    static associate(models) {
      this.belongsTo(models.User);
    }
  }
  User_Credentials.init(
    {
      password: DataTypes.STRING,
      email: DataTypes.STRING,
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: User,
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "UserCredentials",
      tableName: "Users_Credentials",
      underscored: true,
    }
  );
  return User_Credentials;
};
