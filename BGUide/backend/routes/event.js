const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const {
  getEvent,
  editEvent,
  deleteEvent,
  createEvent,
  getAllEvents,
  getEventsCreatedByMe,
  getMyEvents,
  searchEvents,
  checkAttendance,
  attendEvent,
  cancelAttendance,
} = require("../utils/event"); // Updated imports
const { getUserPublic } = require("../utils/user");
const { validateToken } = require("./middlewares/validateToken");
const { storage } = require("../firebase");
const {
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");

const upload = multer({ storage: multer.memoryStorage() });
const event = express.Router();
event.use(express.json());
event.use(bodyParser.urlencoded({ extended: true }));

event.get("/events", validateToken, async (req, res) => {
  try {
    const eventsData = await getAllEvents(req.user.userId);
    res.json(eventsData);
  } catch (error) {
    if (error.message === "Cannot find all events.")
      return res.status(404).send(error.message);
    return res.status(500).send(error.message);
  }
});

event.get("/eventsCreatedByMe", validateToken, async (req, res) => {
  try {
    const eventsData = await getEventsCreatedByMe(req.user.userId);
    res.json(eventsData);
  } catch (error) {
    if (error.message === "Cannot find all events.")
      return res.status(404).send(error.message);
    return res.status(500).send(error.message);
  }
});

event.get("/myEvents", validateToken, async (req, res) => {
  try {
    const eventsData = await getMyEvents(req.user.userId);
    res.json(eventsData);
  } catch (error) {
    if (error.message === "Cannot find all events.")
      return res.status(404).send(error.message);
    return res.status(500).send(error.message);
  }
});

event.get("/search", validateToken, async (req, res) => {
  try {
    const { keyword, limit, offset } = req.query;
    const events = await searchEvents(
      { keyword: keyword ? keyword : "", limit, offset },
      event.eventId
    );
    res.json({ events });
  } catch (error) {
    if (error.message === "Cannot find event.")
      return res.status(404).send(error.message);
    return res.status(500).send(error.message);
  }
});

event.post(
  "/newEvent",
  validateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { creatorId, name, isPrivate, description } = req.body;
      const file = req.file;
      const date = { startDate: req.body.startDate, endDate: req.body.endDate };
      const location = JSON.parse(req.body.location);
      const lineup = JSON.parse(req.body.lineup);
      const paymentLinks = JSON.parse(req.body.paymentLinks);
      let downloadURL = "/party.jpg";
      if (file) {
        const storageRef = ref(
          storage,
          `files/${file.originalname.split(".")[0]}-${new Date().getTime()}`
        );
        const metaData = {
          contentType: file.mimetype,
        };
        const snapshot = await uploadBytesResumable(
          storageRef,
          file.buffer,
          metaData
        );
        downloadURL = await getDownloadURL(snapshot.ref);
      }
      // Create the event
      const post = await createEvent({
        creatorId,
        name,
        isPrivate,
        date,
        location,
        lineup,
        description,
        paymentLinks,
        imgUrl: downloadURL,
      });

      // Retrieve user information
      const user = await getUserPublic(creatorId);

      if (user) {
        post.creatorName = user.name;
        post.creatorId = creatorId;
      }

      // Return the created post with creatorName
      res.json(post);
    } catch (err) {
      // Handle errors appropriately
      console.error(err);

      if (err.message === "Invalid request") {
        return res.status(401).send(err.message);
      }

      return res.status(500).send(err.message);
    }
  }
);

event.put(
  "/editEvent",
  validateToken,
  upload.single("photo"),
  async (req, res) => {
    const eventData = req.body;
    try {
      const file = req.file;
      let downloadURL = "/party.jpg";
      if (file) {
        const storageRef = ref(
          storage,
          `files/${file.originalname.split(".")[0]}-${new Date().getTime()}`
        );
        const metaData = {
          contentType: file.mimetype,
        };
        const snapshot = await uploadBytesResumable(
          storageRef,
          file.buffer,
          metaData
        );
        downloadURL = await getDownloadURL(snapshot.ref);
      }
      const updatedEvent = await editEvent({
        creatorId: eventData.creatorId,
        id: eventData.id,
        name: eventData.name,
        isPrivate: eventData.isPrivate,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: eventData.location,
        lineup: eventData.lineup,
        description: eventData.description,
        paymentLinks: eventData.paymentLinks,
        imgUrl: downloadURL,
      });
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res
        .status(500)
        .json({ error: "An error occurred while updating the event" });
    }
  }
);

event.delete("/deleteEvent", validateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const postData = await deleteEvent(eventId);
    res.json(postData);
  } catch (err) {
    if (err.message === "Event does not exist.")
      return res.status(404).send(err.message);
    return res.status(500).send(err.message);
  }
});

event.get("/:id", validateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    let eventData = await getEvent(eventId);
    try {
      // Retrieve user information
      const user = await getUserPublic(eventData.creatorId);
      if (user) {
        eventData.creatorName = user.name;
        eventData.creatorId = eventData.creatorId;
      }
    } catch (error) {
      console.error("Error fetching user information:", error);
      // Handle user retrieval error if necessary
    }
    res.json({ ...eventData });
  } catch (error) {
    if (error.message === "Cannot find event.")
      return res.status(404).send(error.message);
    return res.status(500).send(error.message);
  }
});

// New endpoints for attendance management
event.get("/attendance/:eventId/:userId", validateToken, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const isAttending = await checkAttendance(eventId, userId);
    res.json({ isAttending });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

event.post("/attendance", validateToken, async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    await attendEvent(eventId, userId);
    res.status(200).send("Attending marked successfully.");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

event.delete(
  "/attendance/:eventId/:userId",
  validateToken,
  async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      await cancelAttendance(eventId, userId);
      res.status(200).send("Attendance cancelled successfully.");
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
);

module.exports = event;
