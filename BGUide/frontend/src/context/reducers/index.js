import { combineReducers } from "@reduxjs/toolkit";

import userReducer from "./userReducer";
import searchUserReducer from "./searchUserReducer";
import searchEventReducer from "./searchEventReducer";
import eventReducer from "./eventReducer";  

export default combineReducers({
  user: userReducer,
  searchUser: searchUserReducer,
  searchEvent: searchEventReducer,
  event : eventReducer 
});
