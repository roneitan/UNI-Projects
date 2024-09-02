"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      this.belongsTo(models.Location, { as: "location" });
      this.belongsTo(models.User, { as: "creator" });
      this.hasMany(models.GuestList, { foreignKey: "eventId" });
    }
  }
  Event.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      locationId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Locations",
          key: "id",
        },
      },
      isPrivate: DataTypes.BOOLEAN,
      paymentLinks: DataTypes.STRING,
      lineup: DataTypes.STRING,
      imgUrl: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Event",
      tableName: "Events",
      underscored: true,
    }
  );
  return Event;
};
