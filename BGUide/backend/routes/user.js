const { Router } = require("express");
const express = require("express");

const {
  register,
  login,
  logout,
  newToken,
  getUser,
  searchUsers,
  sendFriendRequest,
  approveFriendRequest,
  removeFriendRequest,
  approveEventRequest,
  cancelEventRequest,
} = require("../utils/user");
const { validateToken } = require("./middlewares/validateToken");

const user = Router();
user.use(express.json());

user.get("/", validateToken, async (req, res) => {
  try {
    const { user } = req;

    const userData = await getUser(user.userId,user.email);

    res.json({ ...userData });
  } catch (error) {
    if (error.message === "Cannot find user.")
      return res.status(404).send(error.message);

    return res.status(500).send(error.message);
  }
});

user.get("/search", validateToken, async (req, res) => {
  try {
    ;
    const { user } = req;
    const { keyword, limit, offset } = req.query;
    ;

    const users = await searchUsers(
      { keyword: keyword ? keyword : "", limit, offset },
      user.userId
    );

    res.json({ users });
  } catch (error) {
    ;
    if (error.message === "Cannot find user.")
      return res.status(404).send(error.message);

    return res.status(500).send(error.message);
  }
});

user.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await login({ email, password });
    res.cookie("refreshToken", userData.refreshToken);
    res.json(userData);
  } catch (err) {
    if (err.message === "User or password incorrect.")
      return res.status(401).send(err.message);

    if (err.message === "User already logged in.")
      return res.status(403).send(err.message);

    if (err.message === "Cannot find user.")
      return res.status(404).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.post("/sendFriendRequest", validateToken, async (req, res) => {
  try {
    const { user } = req;
    const { email } = req.body;
    const userData = await sendFriendRequest(email, user.userId);
    res.json(userData);
  } catch (err) {
    ;
    if (err.message === "Cannot find user.")
      return res.status(404).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await register({
      name,
      email,
      password,
    });
    res.json(user);
  } catch (err) {
    ;
    if (err.message === "This email already exists.")
      return res.status(401).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.post("/new-token", async (req, res) => {
  const { refreshToken } = req.body;
  ;
  ;
  try {
    const accessToken = await newToken(refreshToken);

    if (accessToken instanceof Error) throw accessToken;

    res.json({ accessToken });
  } catch (err) {
    if (err.message === "Refresh token not found.")
      return res.status(404).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.delete("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    ;
    const response = await logout(refreshToken);
    ;

    if (response) return res.send("User Logged Out Successfully");

    return res.status(401).send("This had no effect");
  } catch (err) {
    if (err.message === "Refresh token required.")
      return res.status(401).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.delete("/removeFriendRequest", validateToken, async (req, res) => {
  try {
    const { user } = req;
    const { email } = req.body;
    const userData = await removeFriendRequest(email, user.userId);
    res.json(userData);
  } catch (err) {
    ;
    if (err.message === "Cannot find user.")
      return res.status(404).send(err.message);

    if (err.message === "Cannot find connection.")
      return res.status(404).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.patch("/approveFriendRequest", validateToken, async (req, res) => {
  try {
    const { user } = req;
    const { email } = req.body;
    const userData = await approveFriendRequest(email, user.userId);
    res.json(userData);
  } catch (err) {
    ;
    if (err.message === "Cannot find user.")
      return res.status(404).send(err.message);

    if (err.message === "Friend request does not exist.")
      return res.status(404).send(err.message);

    if (err.message === "Connection already approved.")
      return res.status(400).send(err.message);

    return res.status(500).send(err.message);
  }
});

user.patch("/approveEventRequest", validateToken, async (req, res) => {
  try {
    const { user } = req;
    const { eventId } = req.body;
    const event = await approveEventRequest(eventId, user.userId);
    res.json({ message: "Event request approved successfully", event });
  } catch (err) {
    ;
    res.status(500).send(err.message);
  }
});

user.patch("/cancelEventRequest", validateToken, async (req, res) => {
  try {
    const { user } = req;
    const { eventId } = req.body;
    const event = await cancelEventRequest(eventId, user.userId);
    res.json({ message: "Event request cancelled successfully", event });
  } catch (err) {
    ;
    res.status(500).send(err.message);
  }
});

user.get("/:id", validateToken, async (req, res) => {
  try {
    const queryId = req.params.id;
    userData = await getUser(queryId);
    res.json({ ...userData });
  } catch (error) {
    if (error.message === "Cannot find user.")
      return res.status(404).send(error.message);
    return res.status(500).send(error.message);
  }
});

module.exports = user;
