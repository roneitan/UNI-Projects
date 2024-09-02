import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { getAllEvents } from "../context/actions";
import L from "leaflet";
import "../css/explorer.css";

const Explorer = () => {
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [userLocation, setUserLocation] = useState([31.262218, 34.801461]); // Default location: Ben Gurion University
  const [searchKeyword, setSearchKeyword] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        dispatch(getAllEvents());
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.error("Error getting user's location:", error);
          // Fallback to default location if geolocation fails
          setUserLocation([31.262218, 34.801461]);
        }
      );
    }
  }, [dispatch]);

  // Select user details and events from Redux store
  const { userEvents } = useSelector((state) => state.user);

  const eventsArray = Object.values(userEvents || {});

  // Filter events based on search keyword and date
  const filteredEvents = eventsArray.filter(
    (event) =>
      (event.name &&
        event.name.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (event.description &&
        event.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // Sort filtered events by date
  const sortedEvents = filteredEvents.sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  return (
    <div className="app">
      <h1 className="page-title">Find Your Next Event!</h1>
      <button
        className="map-view-button"
        onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
      >
        <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
        {viewMode === "list" ? "Map View" : "List View"}
      </button>
      <SearchBar setSearchKeyword={setSearchKeyword} />
      {viewMode === "list" ? (
        <EventsList events={sortedEvents} />
      ) : (
        <EventsMap events={sortedEvents} userLocation={userLocation} />
      )}
    </div>
  );
};

function SearchBar({ setSearchKeyword }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search for events..."
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="search-input"
      />
    </div>
  );
}

function EventsList({ events }) {
  return (
    <div className="events">
      {events.map((event) => (
        <EventEntry key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventEntry({ event }) {
  return (
    <div className="event">
      <div className="event-details">
        <img src={event.imgUrl} alt="Event" className="event-img" />
        <div className="event-info">
          <h2 className="event-name">{event.name}</h2>
          <p className="event-date">
            {new Date(event.startDate).toLocaleString()}
          </p>
          <p className="event-location">
            {formatLocation(event.location.name)}
          </p>
          <Link to={`/event/${event.id}`} className="more-details">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function EventsMap({ events, userLocation }) {
  return (
    <MapContainer center={userLocation} zoom={13} className="events-map">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {events.map((event) =>
        event.location.latitude && event.location.longitude ? (
          <Marker
            key={event.id}
            position={[event.location.latitude, event.location.longitude]}
            icon={L.icon({
              iconUrl: "./PinPoint.png", // Adjust path based on your project structure
              iconSize: [20, 40],
              shadowSize: [50, 64],
              iconAnchor: [10, 40],
              shadowAnchor: [4, 62],
              popupAnchor: [-3, -76],
            })}
          >
            <Popup>
              <div>
                <h2>{event.name}</h2>
                <p>{new Date(event.startDate).toLocaleString()}</p>
                <p>{formatLocation(event.location.name)}</p>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}

// Utility function to format the location
const formatLocation = (fullAddress) => {
  if (!fullAddress) return "N/A";
  const addressParts = fullAddress.split(", ");
  const street = addressParts[0];
  const city = addressParts[3];
  return `${street}, ${city}`;
};

export default Explorer;
