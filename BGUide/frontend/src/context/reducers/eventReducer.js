import {
  SET_EVENT,
  SET_EVENT_LOADER,
  SET_EVENT_ERROR,
  REMOVE_EVENT,
  CLEAR_EVENT,
  ATTEND_EVENT,
  CANCEL_ATTENDANCE,
  CHECK_ATTENDANCE,
} from "../actions";

const initialEventValue = {
  error: "",
  loading: false,
  id: null,
  name: null,
  description: null,
  startDate: null,
  endDate: null,
  locationId: {
    name: "",
    longitude: 0.0,
    latitude: 0.0,
  },
  isPrivate: null,
  soldOut: null,
  link: null,
  creatorId: null,
  creatorName: null,
  isAttending: false, // Added to track attendance
};

const EventReducer = (state = initialEventValue, { type, payload }) => {
  const newState = { ...state };
  switch (type) {
    case SET_EVENT:
      payload.isAttending = newState.isAttending;
      return payload;

    case SET_EVENT_LOADER:
      newState.loading = true;
      return newState;

    case SET_EVENT_ERROR:
      newState.error = payload;
      newState.loading = false;
      return newState;

    case CLEAR_EVENT:
      return initialEventValue;

    case REMOVE_EVENT:
      return payload;

    case ATTEND_EVENT:
      newState.isAttending = true;
      return newState;

    case CANCEL_ATTENDANCE:
      newState.isAttending = false;
      return newState;

    case CHECK_ATTENDANCE:
      newState.isAttending = payload.isAttending;
      return newState;

    default:
      return state;
  }
};

export default EventReducer;
