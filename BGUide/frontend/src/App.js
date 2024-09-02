import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import "./css/App.css";
import Explorer from "./pages/Explorer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchEvents from "./pages/SearchEvents";
import SearchUsers from "./pages/SearchUsers";
import NewEvent from "./pages/NewEvent";
import EditEvent from "./pages/EditEvent";
import Event from "./pages/Event";
import Profile from "./pages/Profile";
import ToolBar from "./components/Toolbar";
import MyEvents from "./pages/MyEvents";
import Cookies from "js-cookie";
import { getUser } from "./context/actions";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSelector((state) => state.user.id);
  const noToolbarPaths = ["/login", "/register"];

  useEffect(() => {
    const accessToken = Cookies.get("accessToken");

    if (accessToken) {
      dispatch(getUser());
    }
  }, [dispatch]);

  useEffect(() => {
    const publicPaths = ["/login", "/register"];
    const accessToken = Cookies.get("accessToken");
    if (userId && publicPaths.includes(location.pathname)) {
      navigate("/explorer");
    } else if (!userId && accessToken) {
      dispatch(getUser());
    } else if (!userId && !publicPaths.includes(location.pathname)) {
      navigate("/login");
    }
  }, [userId, location.pathname, dispatch, navigate]);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/login");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="App">
      {!noToolbarPaths.includes(location.pathname) && <ToolBar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/searchEvents" element={<SearchEvents />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/searchUsers" element={<SearchUsers />} />
        <Route path="/newEvent" element={<NewEvent />} />
        <Route path="/myEvents" element={<MyEvents />} />
        <Route path="/event/:id" element={<Event />} />
        <Route path="/editEvent/:id" element={<EditEvent />} />
        {/* Redirect to /login for any unknown paths */}
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
