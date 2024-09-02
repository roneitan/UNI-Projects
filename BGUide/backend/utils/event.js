require("dotenv").config();
const { Event, Connection, GuestList, Location, sequelize, User } = require("../models");
const { Op } = require("sequelize");

const getEvent = async (eventId) => {
  // Fetch the event details excluding created_at and updated_at
  const event = await Event.findByPk(eventId, {
    attributes: {
      exclude: ["createdAt", "updatedAt", "LocationId", "locationId"],
    },
    include: [
      {
        model: GuestList,
        required: false, // Include guests even if there are none
      },
      {
        model: Location,
        as: "location",
      },
      {
        model: User,
        as: "creator",
      },
    ],
  });
  if (!event) {
    return {};
  }
  const eventData = event.get({ plain: true });
  // Process the guest list based on event privacy
  if (eventData.is_private) {
    // Sort guests by attending status (approved users first)
    eventData.guest_list = eventData.GuestLists.sort(
      (a, b) => b.attending - a.attending
    );
  } else {
    // Filter to only include approved guests for public events
    eventData.guest_list = eventData.GuestLists.filter(
      (guest) => guest.attending
    );
  }
  // Clean up the response
  delete eventData.GuestLists;
  delete eventData.UserId;
  delete eventData.location.createdAt;
  delete eventData.location.updatedAt;
  eventData.lineup = eventData.lineup.split(";");
  eventData.paymentLinks = eventData.paymentLinks.split(" ");
  eventData.creatorName = eventData.creator.name;
  delete eventData.creator;
  return eventData;
};

const getAllEvents = async (id) => {
  try {
    // Get today's date at the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch connections for the current user
    const connections = await Connection.findAll({
      where: {
        [Op.or]: [
          { user_id: id, approved: true },
          { friend_id: id, approved: true },
        ],
      },
      attributes: ['user_id', 'friend_id'],
    });

    // Extract userIds of connected users
    const connectedUserIds = connections.reduce((acc, connection) => {
      if (connection.user_id !== id) acc.push(connection.user_id);
      if (connection.friend_id !== id) acc.push(connection.friend_id);
      return acc;
    }, []);


    // Fetch all events from today and forward, excluding created_at and updated_at, including guest lists
    const events = await Event.findAll({
      where: {
        startDate: {
          [Op.gte]: today,
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt", "locationId", "LocationId"],
      },
      include: [
        {
          model: GuestList,
        },
        {
          model: Location,
          as: "location",
        },
      ],
    });


    // Process each event to handle guest lists and remove unnecessary data
    const processedEvents = events.map((event) => {
      const eventData = event.get({ plain: true });
      // Process the guest list based on event privacy
      if (eventData.isPrivate) {
        // Check if the current user is connected to the event creator
        if (eventData.creatorId === id || connectedUserIds.includes(eventData.creatorId)) {
          // Sort guests by attending status (approved users first)
          eventData.guest_list = eventData.GuestLists.sort(
            (a, b) => b.attending - a.attending
          );
        } else {
          // Skip this event as the user is not connected to the creator
          return null;
        }
      } else {
        // Filter to only include approved guests for public events
        eventData.guest_list = eventData.GuestLists.filter(
          (guest) => guest.attending
        );
      }
      // Clean up the response
      delete eventData.GuestLists;
      delete eventData.UserId;
      delete eventData.location.createdAt;
      delete eventData.location.updatedAt;
      eventData.lineup = eventData.lineup.split(";");
      eventData.paymentLinks = eventData.paymentLinks.split(" ");
      return eventData;
    }).filter(event => event !== null); // Remove null events


    return processedEvents;
  } catch (error) {
    console.error('Error getting events:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

const getEventsCreatedByMe = async (id) => {
  // Get today's date at the start of the day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all events, excluding created_at and updated_at, including guest lists
  const events = await Event.findAll({
    where: {
      startDate: {
        [Op.gte]: today,
      },
    },
    attributes: {
      exclude: ["created_at", "updated_at", "locationId", "LocationId"],
    },
    include: [
      {
        model: GuestList,
      },
      {
        model: Location,
        as: "location",
      },
    ],
  });
  const filteredEvents = events.filter((event) => event.creatorId === id);
  // Process each event to handle guest lists and remove unnecessary data
  const processedEvents = filteredEvents.map((event) => {
    const eventData = event.get({ plain: true });
    // Process the guest list based on event privacy
    if (eventData.is_private) {
      // Sort guests by attending status (approved users first)
      eventData.guest_list = eventData.GuestLists.sort(
        (a, b) => b.attending - a.attending
      );
    } else {
      // Filter to only include approved guests for public events
      eventData.guest_list = eventData.GuestLists.filter(
        (guest) => guest.attending
      );
    }
    // Clean up the response
    delete eventData.GuestLists;
    return eventData;
  });
  return processedEvents;
};

const getMyEvents = async (id) => {
  try {
    // Get today's date at the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch events created by the user
    const events = await Event.findAll({
    where: {
      startDate: {
        [Op.gte]: today,
      },
    },
    attributes: {
      exclude: ["created_at", "updated_at", "locationId", "LocationId"],
    },
    include: [
      {
        model: GuestList,
      },
      {
        model: Location,
        as: "location",
      },
    ],
  });

  const eventsCreatedByMe = events.filter((event) => event.creatorId === id);

    // Fetch events where the user is attending
    const eventsUserIsAttending = await Event.findAll({
      where: {
        startDate: {
          [Op.gte]: today,
        },
      },
      attributes: {
        exclude: ["created_at", "updated_at", "locationId", "LocationId"],
      },
      include: [
        {
          model: GuestList,
          where: {
            user_id: id,
            attending: 1, // Adjust as per your database schema
          },
        },
        {
          model: Location,
          as: "location",
        },
      ],
    });

    // Combine events from both queries
    const combinedEvents = [...eventsCreatedByMe, ...eventsUserIsAttending];

    // Use a set to deduplicate events based on their IDs
    const eventMap = new Map();
    combinedEvents.forEach((event) => {
      eventMap.set(event.id, event);
    });

    // Convert map values back to array
    const uniqueEvents = Array.from(eventMap.values());

    // Process each event to handle guest lists and remove unnecessary data
    const processedEvents = uniqueEvents.map((event) => {
      const eventData = event.get({ plain: true });
      // Process the guest list based on event privacy
      if (eventData.is_private) {
        // Sort guests by attending status (approved users first)
        eventData.guest_list = eventData.GuestLists.sort(
          (a, b) => b.attending - a.attending
        );
      } else {
        // Filter to only include approved guests for public events
        eventData.guest_list = eventData.GuestLists.filter(
          (guest) => guest.attending
        );
      }
      // Clean up the response
      delete eventData.GuestLists;
      return eventData;
    });

    return processedEvents;
  } catch (error) {
    console.error(
      "Error fetching events created by user and events user is attending:",
      error
    );
    throw error;
  }
};

const searchEvents = async (params, eventId) => {
  const { keyword, limit, offset } = params;
  // Define the basic search query
  const query = {
    where: {
      [Op.and]: [
        // Use the Sequelize Op.and to combine conditions
        {
          name: {
            // Assuming 'name' can be searched for a keyword.
            [Op.like]: "%" + keyword + "%", // SQL LIKE query for searching the keyword in name.
          },
        },
        ...(eventId ? [{ id: eventId }] : []), // Conditionally add eventId to the search if provided.
      ],
    },
    attributes: { exclude: ["created_at", "updated_at"] }, // Exclude these fields in the result.
    limit: parseInt(limit, 10) || 10, // Limit the number of results returned, default to 10.
    offset: parseInt(offset, 10) || 0, // Skip a number of results, default to 0.
  };
  // Fetch events from the database that match the query
  const events = await Event.findAll(query);
  return events;
};

const createEvent = async (eventData) => {
  const transaction = await sequelize.transaction();

  try {
    const location = await Location.findOrCreate({
      where: {
        longitude: eventData.location.longitude,
        latitude: eventData.location.latitude,
      },
      defaults: eventData.location,
      transaction,
    });

    const event = await Event.create(
      {
        creatorId: eventData.creatorId,
        name: eventData.name,
        isPrivate: eventData.isPrivate,
        startDate: eventData.date.startDate,
        endDate: eventData.date.endDate,
        locationId: location[0].id,
        description: eventData.description,
        paymentLinks: eventData.paymentLinks.join(" "),
        lineup: eventData.lineup.join(";"),
        imgUrl: eventData.imgUrl,
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    return {
      ...event.toJSON(),
      paymentLinks: event.paymentLinks.split(" "),
      lineup: event.lineup.split(";"),
    };
  } catch (error) {
    console.error("Error creating the event:", error);
    await transaction.rollback();
    throw error;
  }
};

const editEvent = async (eventData) => {
  const event = await Event.findByPk(eventData.id);
  if (Array.isArray(eventData.lineup)) {
    eventData.lineup = eventData.lineup.join(";");
  }
  if (Array.isArray(eventData.paymentLinks)) {
    eventData.paymentLinks = eventData.paymentLinks.join(";");
  }
  if (!event) {
    throw new Error("Event not found");
  }

  // Update the event with new data
  await event.update(eventData);

  return event;
};

const deleteEvent = async (postId) => {
  // Fetch the event by ID
  const event = await Event.findByPk(postId);

  // Check if the event exists
  if (!event) {
    throw new Error("Event does not exist.");
  }
  // Delete the event
  await event.destroy();
};

const checkAttendance = async (eventId, userId) => {
  const attendance = await GuestList.findOne({
    where: {
      eventId: eventId,
      userId: userId,
    },
  });
  return attendance ? attendance.attending : false;
};

const attendEvent = async (eventId, userId) => {
  const [attendance, created] = await GuestList.findOrCreate({
    where: {
      eventId: eventId,
      userId: userId,
    },
    defaults: {
      attending: true,
    },
  });

  if (!created) {
    attendance.attending = true;
    await attendance.save();
  }

  return attendance;
};

const cancelAttendance = async (eventId, userId) => {
  const attendance = await GuestList.findOne({
    where: {
      eventId: eventId,
      userId: userId,
    },
  });

  if (attendance) {
    attendance.attending = false;
    await attendance.save();
  }

  return attendance;
};

module.exports = {
  createEvent,
  getEvent,
  searchEvents,
  getAllEvents,
  getEventsCreatedByMe,
  getMyEvents,
  editEvent,
  deleteEvent,
  checkAttendance,
  attendEvent,
  cancelAttendance,
};
