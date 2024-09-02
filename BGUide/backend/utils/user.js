require("dotenv").config();
const {
  User,
  Event,
  UserCredentials,
  RefreshToken,
  Connection,
} = require("../models");
const { Op } = require("sequelize");
const { hash, compare } = require("bcrypt");
const { sign, verify } = require("jsonwebtoken");

const generateToken = (isRefresh, expiresIn, result) => {
  return sign(
    { result },
    isRefresh
      ? process.env.REFRESH_TOKEN_SECRET
      : process.env.ACCESS_TOKEN_SECRET,
    { expiresIn }
  );
};

const createUser = async (name) => {
  const user = await User.create({ name });
  const userData = user.toJSON();
  userData.createdAt = undefined;
  userData.updatedAt = undefined;
  return userData;
};

const getUserPublic = async (id) => {
  let user = await User.findOne({
    attributes: { exclude: ["createdAt", "updatedAt"] },
    where: { id },
  });
  if (!user) throw new Error("Cannot find user.");
  return user.dataValues;
};

const getUser = async (id, email) => {
  let user = await User.findOne({
    attributes: { exclude: ["createdAt", "updatedAt"] },
    where: { id },
  });

  if (!user) throw new Error("Cannot find user.");
  user = user.toJSON();

  const connections = await Connection.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
    where: { [Op.or]: [{ user_id: id }, { friend_id: id }] },
  });

  const friendsIds = connections
    .filter(({ approved }) => approved)
    .map(({ user_id, friend_id }) => (user_id === id ? friend_id : user_id));

  const friendsList = await User.findAll({
    attributes: ["name"],
    where: { id: { [Op.in]: friendsIds } },
    include: {
      model: UserCredentials,
      attributes: ["email"],
    },
  });

  user.friendsList = friendsList.map((user) => {
    const newUser = user.toJSON();
    newUser.email = newUser.UserCredential.email;
    newUser.UserCredential = undefined;
    return newUser;
  });

  const pendingIds = connections
    .filter(({ approved }) => !approved)
    .map(({ user_id, friend_id }) => (user_id === id ? friend_id : user_id));

  // TODO: Fixed this messy way of querying
  const pendingList = await User.findAll({
    attributes: ["id", "name"],
    where: { id: { [Op.in]: pendingIds } },
    include: {
      model: UserCredentials,
      attributes: ["email"],
    },
  });

  const pendingConnections = await Connection.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
    where: {
      [Op.or]: [
        { userId: id, friendId: { [Op.in]: pendingIds } },
        { friendId: id, userId: { [Op.in]: pendingIds } },
      ],
    },
  });

  user.pendingList = pendingList.map((user) => {
    const newUser = user.toJSON();
    newUser.email = newUser.UserCredential.email;
    delete newUser.UserCredential;
    newUser.receiver = pendingConnections.find(
      ({ user_id, friend_id }) => friend_id === id && user_id === newUser.id
    )
      ? true
      : false;
    delete newUser.id;
    return newUser;
  });
  user.email = email;
  return user;
};

const sendFriendRequest = async (email, userId) => {
  
  if (!userId) {
    throw new Error("User ID is required.");
  }
  
  const user = await UserCredentials.findOne({
    attributes: ["user_id"],
    where: { email },
  });

  if (!user) {
    throw new Error("Cannot find user.");
  } 

  const user_id = user.toJSON().user_id;

  if (!user_id) {
    throw new Error("The found user does not have a valid user ID.");
  }

  const connection = await Connection.findOne({
    where: {
      [Op.or]: [
        { userId, friendId: user_id },
        { friendId: userId, userId: user_id },
      ],
    },
  });

  if (connection) {
    throw new Error("Connection already made.");
  }

  console.log(`User requesting: ${userId}`);
  console.log(`User found: ${user_id}`);

  try {
    await Connection.create({
      user_id: userId,
      friend_id: user_id,
      approved: false,
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    throw error; // Re-throw the error to ensure it's handled by the caller
  }

  return user;
};



const approveFriendRequest = async (email, userId) => {
  const user = await UserCredentials.findOne({
    attributes: ["user_id"],
    where: { email },
  });

  if (!user) throw new Error("Cannot find user.");

  const connection = await Connection.findOne({
    where: { friendId: userId, userId: user.toJSON().user_id },
  });

  if (!connection) throw new Error("Friend request does not exist.");
  if (connection.approved) throw new Error("Connection already approved.");

  await Connection.update(
    { approved: true },
    { where: { userId: connection.userId, friendId: connection.friendId } }
  );
  return user;
};

const removeFriendRequest = async (email, userId) => {
  const user = await UserCredentials.findOne({
    attributes: ["user_id"],
    where: { email },
  });

  if (!user) throw new Error("Cannot find user.");

  const connection = await Connection.findOne({
    where: {
      [Op.or]: [
        { userId, friendId: user.toJSON().user_id },
        { friendId: userId, userId: user.toJSON().user_id },
      ],
    },
  });

  if (!connection) throw new Error("Cannot find connection.");

  await Connection.destroy({
    where: {
      [Op.or]: [
        { userId, friendId: user.toJSON().user_id },
        { friendId: userId, userId: user.toJSON().user_id },
      ],
    },
  });
  return user;
};

const searchUsers = async (params, id) => {
  if (!params) {
    const users = await User.findAll({
      attributes: ["name"],
      where: { isOrg: false, id: { [Op.not]: id } },
    });
    return users.map((user) => user.toJSON());
  }

  const { keyword, limit, offset } = params;

  let where = { id: { [Op.not]: id } };

  if (keyword) {
    where = {
      [Op.and]: [
        { id: { [Op.not]: id } },
        {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { "$UserCredential.email$": { [Op.like]: `%${keyword}%` } },
          ],
        },
      ],
    };
  }

  const limitOffset = {};

  if (limit) limitOffset.limit = Number(limit);
  if (offset) limitOffset.offset = Number(offset);

  const users = await User.findAndCountAll({
    attributes: ["id", "name"],
    include: [
      {
        model: UserCredentials,
        attributes: ["email"],
      },
    ],
    where,
    ...limitOffset,
  });

  // TODO: Fixed this messy way of querying
  const ids = users.rows.map((user) => user.id);
  const connections = await Connection.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
    where: {
      [Op.or]: [
        { userId: id, friendId: { [Op.in]: ids } },
        { friendId: id, userId: { [Op.in]: ids } },
      ],
    },
  });
  users.rows = users.rows.map((user) => {
    const newUser = user.toJSON();
    newUser.email = newUser.UserCredential.email;
    delete newUser.UserCredential;
    newUser.receiver = connections.find(
      ({ user_id, friend_id }) => friend_id === id && user_id === newUser.id
    )
      ? true
      : false;
    delete newUser.id;
    return newUser;
  });

  return users;
};

const register = async (user) => {
  const { email, name } = user;

  const registerUser = await UserCredentials.findAll({
    where: { email },
  });

  if (registerUser.length !== 0) throw new Error("This email already exists.");

  const newUser = await createUser(name);
  const password = await hash(user.password, 10);
  await UserCredentials.create({ email, password, userId: newUser.id });
  return newUser;
};

const login = async (user) => {
  const loginData = await UserCredentials.findOne({
    where: { email: user.email },
  });

  if (!loginData) throw new Error("Cannot find user.");

  const loginUser = loginData.toJSON();

  if (!(await compare(user.password, loginUser.password))){
    throw new Error("User or password incorrect.");
  }

  const { email, name, userId } = loginUser;

  const result = { email, name, userId };
  const accessToken = generateToken(false, "1d", result);
  const refreshToken = generateToken(true, "7d", result);

  const userData = await getUser(userId, email);

  await RefreshToken.create({ token: refreshToken, userId });
  return { userData, accessToken, refreshToken };
};

const logout = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token required.");

  const logout = await RefreshToken.destroy({
    where: { token: refreshToken },
  });

  return logout;
};

const newToken = async (refreshToken) => {
  const data = await RefreshToken.findOne({
    where: { token: refreshToken },
    attributes: ["token"],
  });

  if (!data) throw new Error("Refresh token not found.");

  const token = data.toJSON().token;

  return verify(token, process.env.REFRESH_TOKEN_SECRET, (err, authData) => {
    if (err) throw new Error("Invalid refresh Token.");

    const accessToken = generateToken(false, "10m", authData.result);

    return accessToken;
  });
};

const approveEventRequest = async (eventId, userId) => {
  const event = await Event.findByPk(eventId);

  if (!event) throw new Error("Event not found.");

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found.");

  await user.addEvent(event);

  await event.addGuest(user);

  return event;
};

const cancelEventRequest = async (eventId, userId) => {
  const event = await Event.findByPk(eventId);

  if (!event) throw new Error("Event not found.");

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found.");

  await user.removeEvent(event);

  await event.removeGuest(user);

  return event;
};

module.exports = {
  getUser,
  getUserPublic,
  searchUsers,
  login,
  logout,
  register,
  newToken,
  sendFriendRequest,
  approveFriendRequest,
  removeFriendRequest,
  approveEventRequest,
  cancelEventRequest,
};
