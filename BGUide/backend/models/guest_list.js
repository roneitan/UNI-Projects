"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GuestList extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "userId" });
      this.belongsTo(models.Event, { foreignKey: "eventId" });
    }
  }
  GuestList.init(
    {
      attending: DataTypes.BOOLEAN,
      eventId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Events",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "GuestList",
      tableName: "Guest_Lists",
      underscored: true,
      noPrimaryKey: true,
    }
  );
  return GuestList;
};
