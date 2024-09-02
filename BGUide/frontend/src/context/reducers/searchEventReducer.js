import { GET_MORE_EVENTS, CLEAR_EVENTS, SET_EVENT_ERROR, SET_EVENT_LOADER } from "../actions";

const initialSearchEventValue = {
  error: "",
  loading: false,
  page: 0,
  limit: 10,
  count: 0,
  hasMore: false,
  events: [],
};

const searchEventReducer = (state = initialSearchEventValue, { type, payload }) => {
  const newState = JSON.parse(JSON.stringify(state));
  switch (type) {
    case CLEAR_EVENTS:
      return initialSearchEventValue;

    case GET_MORE_EVENTS:
      newState.count = newState.events.length + payload.events.length;
      newState.page += 1;
      newState.hasMore = newState.count < payload.count;
      newState.events = newState.events.concat(payload.events);
      return newState;

    case SET_EVENT_LOADER:
      return { ...state, loading: true, error: "" };

    case SET_EVENT_ERROR:
      return { ...state, loading: false, error: payload };

    default:
      return state;
  }
};

export default searchEventReducer;
