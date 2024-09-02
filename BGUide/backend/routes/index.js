const { Router } = require("express");
const user = require("./user");
const event = require("./event");

const api = Router();

api.use("/user", user);
api.use("/event", event)

module.exports = api;
