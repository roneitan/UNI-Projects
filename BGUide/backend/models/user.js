"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasOne(models.UserCredentials);
      this.hasMany(models.Connection);
      this.hasMany(models.Event, { as: "createdEvents" });
      this.belongsToMany(models.User, {
        through: models.Connection,
        foreignKey: "user_id",
        otherKey: "friend_id",
        as: "friends",
      });
      this.hasMany(models.GuestList, { foreignKey: "userId" });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      underscored: true,
    }
  );
  return User;
};
