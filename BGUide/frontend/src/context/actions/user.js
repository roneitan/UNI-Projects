import axios from "../Network/NetworkWrapper";
import Cookies from "js-cookie";
import { clearUsers } from "./search";

export const SET_USER = "SET_USER";
export const CLEAR_USER = "CLEAR_USER";
export const SET_USER_ERROR = "SET_USER_ERROR";
export const SET_USER_LOADER = "SET_USER_LOADER";
export const SET_EVENT_LIST = "SET_EVENT_LIST";
export const UPDATE_PENDING_LIST = "UPDATE_PENDING_LIST";
export const APPROVE_REQUEST = "APPROVE_REQUEST";
export const REMOVE_REQUEST = "REMOVE_REQUEST";
const env = process.env.NODE_ENV || "production";
const BASE_URL =
  env === "production" ? "https://bguide.onrender.com" : "http://localhost:443";

export const setUser = (payload) => ({
  type: SET_USER,
  payload,
});

export const updatePendingList = (payload) => ({
  type: UPDATE_PENDING_LIST,
  payload,
});

export const approveRequest = (payload) => ({
  type: APPROVE_REQUEST,
  payload,
});

export const removeRequest = (payload) => ({
  type: REMOVE_REQUEST,
  payload,
});

export const setUserLoader = () => ({
  type: SET_USER_LOADER,
});

export const clearUser = () => ({
  type: CLEAR_USER,
});

export const setUserError = (payload) => ({
  type: SET_USER_ERROR,
  payload,
});

export const setEventList = (payload) => ({
  type: SET_EVENT_LIST,
  payload,
});

const errorFade = (dispatch, message) => {
  dispatch({ type: SET_USER_ERROR, payload: message });
};

export const getUser = () => {
  return (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    axios
      .get(`${BASE_URL}/api/user`)
      .then((data) => {
        dispatch({
          type: SET_USER,
          payload: { ...data.data, loading: false, error: "" },
        });
      })
      .catch((err) => {
        errorFade(dispatch, err.response.data);
      });
  };
};

export const loginUser = (user) => {
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    try {
      const isError = await axios.post(`${BASE_URL}/api/user/login`, user);
      if (isError instanceof Error) throw isError;
      const { data } = isError;

      Cookies.set("accessToken", `Bearer ${data.accessToken}`, {
        expires: 1,
      });
      Cookies.set("refreshToken", data.refreshToken, { expires: 1 });

      dispatch({
        type: SET_USER,
        payload: { ...data.userData, loading: false, error: "" },
      });
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

export const sendFriendRequest = (user) => {
  const { email } = user;
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    try {
      const data = await axios.post(`${BASE_URL}/api/user/sendFriendRequest`, {
        email,
      });

      if (data instanceof Error) throw data;

      dispatch({
        type: UPDATE_PENDING_LIST,
        payload: { ...user, receiver: false },
      });
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

export const approveFriendRequest = (user) => {
  const { email } = user;
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    try {
      const data = await axios.patch(
        `${BASE_URL}/api/user/approveFriendRequest`,
        {
          email,
        }
      );

      if (data instanceof Error) throw data;

      dispatch(approveRequest({ name: user.name, email: user.email }));
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

export const removeFriendRequest = (user) => {
  const { email } = user;
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    try {
      const data = await axios.delete(
        `${BASE_URL}/api/user/removeFriendRequest`,
        {
          data: { email },
        }
      );

      if (data instanceof Error) throw data;

      dispatch(removeRequest({ name: user.name, email: user.email }));
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

export const registerUser = (newUser) => {
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });

    try {
      const isError = await axios.post(
        `${BASE_URL}/api/user/register`,
        newUser
      );
      if (isError instanceof Error) throw isError;

      const { email, password } = newUser;

      const { data } = await axios.post(`${BASE_URL}/api/user/login`, {
        email,
        password,
      });

      if (data instanceof Error) throw data;

      Cookies.set("accessToken", `Bearer ${data.accessToken}`, {
        expires: 1,
      });
      Cookies.set("refreshToken", data.refreshToken, { expires: 1 });

      dispatch({
        type: SET_USER,
        payload: { ...data.userData, loading: false, error: "" },
      });
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

export const logoutUser = () => {
  return (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    const data = { refreshToken: Cookies.get("refreshToken") };
    axios
      .delete(`${BASE_URL}/api/user/logout`, { data })
      .then(() => {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        dispatch(clearUser());
        dispatch(clearUsers());
      })
      .catch((err) => {
        errorFade(dispatch, err.message);
      });
  };
};

export const approveEventRequest = (eventId) => {
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    try {
      const data = await axios.patch(
        `${BASE_URL}/api/event/approveEventRequest`,
        {
          eventId,
        }
      );

      if (data instanceof Error) throw data;

      dispatch(approveRequest({ eventId }));
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};

// This function cancels an event request
export const cancelEventRequest = (eventId) => {
  return async (dispatch) => {
    dispatch({ type: SET_USER_LOADER });
    try {
      const data = await axios.patch(
        `${BASE_URL}/api/event/cancelEventRequest`,
        {
          eventId,
        }
      );

      if (data instanceof Error) throw data;

      dispatch(removeRequest({ eventId }));
    } catch (err) {
      errorFade(dispatch, err.response ? err.response.data : err.message);
    }
  };
};
