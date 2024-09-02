require("dotenv").config();
const { sequelize } = require("./models");
const app = require("./app");
const PORT = process.env.PORT || 443;

app.listen(PORT, async () => {
  await sequelize.sync();
  console.log(`Server is running on port: ${PORT}`);
});
