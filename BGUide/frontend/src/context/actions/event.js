import axios from "../Network/NetworkWrapper";
import { setEventList } from "./user";

export const SET_EVENT = "SET_EVENT";
export const SET_EVENT_LOADER = "SET_EVENT_LOADER";
export const SET_EVENT_ERROR = "SET_EVENT_ERROR";
export const SET_REMOVED_EVENT = "SET_REMOVED_EVENT";
export const CLEAR_EVENT = "CLEAR_EVENT";
export const UPDATE_ATTENDING = "UPDATE_ATTENDING";
export const REMOVE_EVENT = "REMOVE_EVENT";
export const ALL_EVENTS = "ALL_EVENTS";
export const ATTEND_EVENT = "ATTEND_EVENT";
export const CANCEL_ATTENDANCE = "CANCEL_ATTENDANCE";
export const CHECK_ATTENDANCE = "CHECK_ATTENDANCE";
export const UPDATE_EVENT_SUCCESS = "UPDATE_EVENT_SUCCESS";
export const UPDATE_EVENT_ERROR = "UPDATE_EVENT_ERROR";
const env = process.env.NODE_ENV || "production";
const BASE_URL =
  env === "production" ? "https://bguide.onrender.com" : "http://localhost:443";

export const setEvent = (payload) => ({
  type: SET_EVENT,
  payload,
});

export const setEventLoader = (payload) => ({
  type: SET_EVENT_LOADER,
  payload,
});

export const setEventError = (payload) => ({
  type: SET_EVENT_ERROR,
  payload,
});

export const clearEvent = (payload) => ({
  type: CLEAR_EVENT,
  payload,
});

export const updateAttending = () => ({
  type: UPDATE_ATTENDING,
});

const errorFade = (dispatch, message) => {
  dispatch({ type: SET_EVENT_ERROR, payload: message });
  setTimeout(() => dispatch({ type: SET_EVENT_ERROR, payload: "" }), 3000);
};

export const getEvent = (eventId) => {
  return (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    axios
      .get(`${BASE_URL}/api/event/${eventId}`)
      .then((data) =>
        dispatch({
          type: SET_EVENT,
          payload: { ...data.data, loading: false, error: "" },
        })
      )
      .catch((err) => {
        errorFade(dispatch, err.response.data);
      });
  };
};

export const getAllEvents = () => {
  return async (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    try {
      const data = await axios.get(`${BASE_URL}/api/event/events`);
      dispatch(setEventList(data.data));
    } catch (err) {
      errorFade(dispatch, err.response.data);
    }
  };
};

export const getCreatedByMeEvents = (id, mode) => {
  return async (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    try {
      const data = await axios.get(
        `${BASE_URL}/api/event/eventsCreatedByMe`,
        id
      );
      dispatch(setEventList(data.data));
    } catch (err) {
      errorFade(dispatch, err.response.data);
    }
  };
};

export const getMyEvents = (id) => {
  return async (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    try {
      const data = await axios.get(`${BASE_URL}/api/event/myEvents`, id);
      dispatch(setEventList(data.data));
    } catch (err) {
      errorFade(dispatch, err.response.data);
    }
  };
};

export const createEvent = (event) => {
  return async (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    try {
      const response = await axios.post(
        `${BASE_URL}/api/event/newEvent`,
        event
      );
      if (response.data instanceof Error) throw response.data;
      const eventData = response.data;
      dispatch({
        type: SET_EVENT,
        payload: { ...eventData, loading: false, error: "" },
      });
      return eventData; // Return the created event data
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
      throw err; // Ensure the error is thrown for the caller to handle
    }
  };
};

export const deleteEvent = (event_id) => {
  return async (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    try {
      const { data } = await axios.delete(`${BASE_URL}/api/event/deleteEvent`, {
        data: { eventId: event_id },
      });

      if (data instanceof Error) throw data;
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

// New actions for attending and canceling attendance
export const attendEvent = (eventId, userId) => async (dispatch) => {
  try {
    await axios.post(`${BASE_URL}/api/event/attendance`, {
      eventId,
      userId,
    });
    dispatch({ type: ATTEND_EVENT, payload: { eventId, userId } });
  } catch (error) {
    console.error("Failed to mark attendance:", error);
  }
};

export const cancelAttendance = (eventId, userId) => async (dispatch) => {
  try {
    await axios.delete(`${BASE_URL}/api/event/attendance/${eventId}/${userId}`);
    dispatch({ type: CANCEL_ATTENDANCE, payload: { eventId, userId } });
  } catch (error) {
    console.error("Failed to cancel attendance:", error);
  }
};

export const checkAttendance = (eventId, userId) => async (dispatch) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/event/attendance/${eventId}/${userId}`
    );
    dispatch({
      type: CHECK_ATTENDANCE,
      payload: { eventId, userId, isAttending: response.data.isAttending },
    });
  } catch (error) {
    console.error("Failed to check attendance:", error);
  }
};

export const updateEvent = (eventData) => {
  return async (dispatch) => {
    dispatch({ type: SET_EVENT_LOADER });
    try {
      const response = await axios.put(
        `${BASE_URL}/api/event/editEvent`,
        eventData
      );

      if (response.data instanceof Error) throw response.data;

      const updatedEvent = response.data;

      dispatch({ type: UPDATE_EVENT_SUCCESS, payload: updatedEvent });
      return updatedEvent; // Return the updated event data
    } catch (err) {
      dispatch({ type: UPDATE_EVENT_ERROR, payload: err.message });
      console.error(err);
      throw err; // Ensure the error is thrown for the caller to handle
    }
  };
};
