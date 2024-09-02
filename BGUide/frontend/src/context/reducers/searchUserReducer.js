import {
  CLEAR_USERS,
  GET_MORE_USERS,
  SET_SEARCH_ERROR,
  SET_SEARCH_LOADER,
} from "../actions";

const initialSearchValue = {
  error: "",
  loading: false,
  page: 0,
  limit: 10,
  count: 0,
  hasMore: false,
  users: [],
};

const searchUserReducer = (state = initialSearchValue, { type, payload }) => {
  const newState = JSON.parse(JSON.stringify(state));

  switch (type) {
    case CLEAR_USERS:
      return initialSearchValue;

    case GET_MORE_USERS:
      newState.count = newState.users.length + payload.users.length;
      newState.page += 1;
      newState.hasMore = newState.count < payload.count;
      newState.users = newState.users.concat(payload.users);
      return newState;

    case SET_SEARCH_LOADER:
      newState.loading = true;
      return newState;

    case SET_SEARCH_ERROR:
      newState.error = payload;
      newState.loading = false;
      return newState;

    default:
      return state;
  }
};

export default searchUserReducer;
