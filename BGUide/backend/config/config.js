require("dotenv").config();
const fs = require("fs"); // Required for reading SSL files
const path = require("path");

const CAPATH = path.join(__dirname, "..", "..");

module.exports = {
  development: {
    username: process.env.MYSQL_USERNAME_DEV,
    password: process.env.MYSQL_PASSWORD_DEV,
    database: process.env.MYSQL_DATABASE_DEV,
    host: process.env.MYSQL_HOST_DEV,
    dialect: "mysql",
    logging: false,
  },
  test: {
    username: process.env.MYSQL_USERNAME_TEST,
    password: process.env.MYSQL_PASSWORD_TEST,
    database: process.env.MYSQL_DATABASE_TEST,
    host: process.env.MYSQL_HOST_TEST,
    port: process.env.MYSQL_PORT_TEST,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
        ca: fs
          .readFileSync(path.join(CAPATH, process.env.MYSQL_CA_TEST))
          .toString(),
      },
    },
  },
  production: {
    username: process.env.MYSQL_USERNAME_PROD,
    password: process.env.MYSQL_PASSWORD_PROD,
    database: process.env.MYSQL_DATABASE_PROD,
    host: process.env.MYSQL_HOST_PROD,
    port: process.env.MYSQL_PORT_PROD,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
        ca: fs
          .readFileSync(path.join(CAPATH, process.env.MYSQL_CA_PROD))
          .toString(),
      },
    },
  },
};
