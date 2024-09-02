import axios from "../Network/NetworkWrapper";

export const GET_MORE_USERS = "GET_MORE_USERS";
export const CLEAR_USERS = "CLEAR_USERS";
export const SET_SEARCH_ERROR = "SET_SEARCH_ERROR";
export const SET_SEARCH_LOADER = "SET_SEARCH_LOADER";
export const GET_MORE_EVENTS = "GET_MORE_EVENTS";
export const CLEAR_EVENTS = "CLEAR_EVENTS";
const env = process.env.NODE_ENV || "production";
const BASE_URL =
  env === "production" ? "https://bguide.onrender.com" : "http://localhost:443";

export const getMoreUsers = (payload) => ({
  type: GET_MORE_USERS,
  payload,
});

export const setSearchLoader = () => ({
  type: SET_SEARCH_LOADER,
});

export const clearUsers = () => ({
  type: CLEAR_USERS,
});

export const setSearchError = (payload) => ({
  type: SET_SEARCH_ERROR,
  payload,
});

export const getMoreEvents = (payload) => ({
  type: GET_MORE_EVENTS,
  payload,
});

export const clearEvents = () => ({
  type: CLEAR_EVENTS,
});

const errorFade = (dispatch, message) => {
  dispatch({ type: SET_SEARCH_ERROR, payload: message });
  setTimeout(() => dispatch({ type: SET_SEARCH_ERROR, payload: "" }), 3000);
};

export const searchUsers = (keyword) => {
  return (dispatch, getState) => {
    dispatch({ type: SET_SEARCH_LOADER });
    const { page, limit } = getState().searchUser;
    axios
      .get(
        `${BASE_URL}/api/user/search?limit=${limit}&offset=${
          page * 10
        }&keyword=${keyword}`
      )
      .then((data) => {
        const { rows, count } = data.data.users;
        dispatch(
          getMoreUsers({
            users: rows,
            count,
            limit,
            page,
            loading: false,
            error: "",
          })
        );
      })
      .catch((err) => {
        console.log(err);
        errorFade(dispatch, err.response ? err.response.data : err.message);
      });
  };
};

export const searchEvents = (keyword) => {
  return (dispatch, getState) => {
    dispatch({ type: SET_SEARCH_LOADER });
    const { page, limit } = getState().searchEvent;

    axios
      .get(
        `${BASE_URL}/api/event/search?limit=${limit}&offset=${
          page * 10
        }&keyword=${keyword}`
      )
      .then((data) => {
        const events = data.data.events;
        dispatch(
          getMoreEvents({
            events: events,
            count: events.length,
            limit,
            page,
            loading: false,
            error: "",
          })
        );
      })
      .catch((err) => {
        errorFade(dispatch, err.response ? err.response.data : err.message);
      });
  };
};
