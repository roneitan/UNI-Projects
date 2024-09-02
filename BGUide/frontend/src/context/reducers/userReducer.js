import {
  SET_USER,
  SET_USER_LOADER,
  SET_USER_ERROR,
  SET_EVENT_LIST,
  CLEAR_USER,
  UPDATE_PENDING_LIST,
  APPROVE_REQUEST,
  REMOVE_REQUEST,
} from "../actions";

const initialUserValue = {
  error: "",
  loading: false,
  id: null,
  name: null,
  email: null,
  friendsList: [],
  pendingList: [],
  userEvents: [],
  createdEvents: [],
};

const UserReducer = (state = initialUserValue, { type, payload }) => {
  switch (type) {
    case SET_USER:
      return { ...state, ...payload };

    case CLEAR_USER:
      return initialUserValue;

    case SET_USER_LOADER:
      return { ...state, loading: true };

    case SET_USER_ERROR:
      return { ...state, error: payload, loading: false };

    case UPDATE_PENDING_LIST:
      return {
        ...state,
        loading: false,
        error: "",
        pendingList: [...state.pendingList, payload],
      };

    case APPROVE_REQUEST:
      return {
        ...state,
        loading: false,
        error: "",
        pendingList: state.pendingList.filter(
          ({ email }) => email !== payload.email
        ),
        friendsList: [...state.friendsList, payload],
      };

    case REMOVE_REQUEST:
      return {
        ...state,
        loading: false,
        error: "",
        pendingList: state.pendingList.filter(
          ({ email }) => email !== payload.email
        ),
        friendsList: state.friendsList.filter(
          ({ email }) => email !== payload.email
        ),
      };

    case SET_EVENT_LIST:
      return { ...state, userEvents: payload };

    default:
      return state;
  }
};

export default UserReducer;
