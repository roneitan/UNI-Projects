const express = require("express");
const cors = require("cors");
const app = express();
const api = require("./routes");
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

app.use("/api", api);
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});
app.use("/", (req, res) => {
  res.status(404).json({ error: "Page not found!" });
});

module.exports = app;
