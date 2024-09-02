const jwt = require("jsonwebtoken");
require("dotenv").config();

const validateToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  const token = bearerHeader && bearerHeader.split(" ")[1];
  if (!token) return res.status(401).send("Access token needed.");

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authData) => {
    if (err) return res.status(403).send("Invalid Access Token.");

    req.user = authData.result;
    next();
  });
};

module.exports = { validateToken };
