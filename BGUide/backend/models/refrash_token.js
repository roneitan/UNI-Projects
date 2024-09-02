"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Refresh_tokens extends Model {
    static associate(models) {}
  }
  Refresh_tokens.init(
    {
      token: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "RefreshToken",
      tableName: "Refresh_Tokens",
      underscored: true,
    }
  );
  return Refresh_tokens;
};
