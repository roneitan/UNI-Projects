"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      this.hasMany(models.Event);
    }
  }
  Location.init(
    {
      name: DataTypes.STRING,
      longitude: DataTypes.FLOAT(16, 14),
      latitude: DataTypes.FLOAT(16, 14),
    },
    {
      sequelize,
      modelName: "Location",
      tableName: "Locations",
      underscored: true,
    }
  );
  return Location;
};
