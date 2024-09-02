import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getEvent,
  attendEvent,
  cancelAttendance,
  checkAttendance,
  deleteEvent,
} from "../context/actions"; // Updated actions import
import "../css/event.css";
import { useParams, useNavigate } from "react-router-dom";

// Utility function to format the location
const formatLocation = (fullAddress) => {
  if (!fullAddress) return "N/A";
  const addressParts = fullAddress.split(",");
  const street = addressParts[0].trim();
  const city = addressParts[3].trim();
  return `${street}, ${city}`;
};

export default function Event() {
  const event = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { id: eventId } = useParams(); // Gets event ID from URL
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        dispatch(getEvent(eventId));
        dispatch(checkAttendance(eventId, user.id)); // Check attendance on load
      } catch (error) {
        console.error("Failed to fetch event:", error);
      }
    };
    fetchEvent();
  }, [dispatch, eventId, user.id]);

  if (!event) {
    return <div>Loading...</div>;
  }

  const {
    name,
    creatorId,
    creatorName,
    description,
    startDate,
    endDate,
    location,
    isPrivate,
    paymentLinks,
    isAttending,
    imgUrl,
  } = event;

  // Check if the logged-in user is the creator of the event
  const isCreator = user.id === creatorId;

  const handleEdit = () => {
    navigate(`/editEvent/${eventId}`);
  };

  const handleDelete = async () => {
    // Implement delete logic here
    dispatch(deleteEvent(eventId));
    navigate("/explorer");
  };

  const handleAttendance = async () => {
    if (isAttending) {
      dispatch(cancelAttendance(eventId, user.id));
    } else {
      dispatch(attendEvent(eventId, user.id));
    }
    dispatch(checkAttendance(eventId, user.id)); // Refresh attendance status
  };

  return (
    <div className="event-container">
      <img src={imgUrl} alt="Event" className="event-img" />
      <h1>Event Details</h1>
      <div className="event-detail">
        <strong>Name:</strong>
        <p>{name}</p>
      </div>
      <div className="event-detail">
        <strong>Creator:</strong>
        {isCreator ? <p>You</p> : <p>{creatorName}</p>}
      </div>
      <div className="event-detail">
        <strong>Starts at:</strong>
        <p>{new Date(startDate).toLocaleString()}</p>
      </div>
      <div className="event-detail">
        <strong>Ends at:</strong>
        <p>{new Date(endDate).toLocaleString()}</p>
      </div>
      <div className="event-detail">
        <strong>Description:</strong>
        <p>{description}</p>
      </div>
      <div className="event-detail">
        <strong>Location:</strong>
        <p>
          {location && location.name ? formatLocation(location.name) : "N/A"}
        </p>
      </div>
      <div className="event-detail">
        <strong>Private:</strong>
        <p>{isPrivate ? "Yes" : "No"}</p>
      </div>
      <div className="event-detail">
        <strong>Payment Links:</strong>
        {paymentLinks &&
          paymentLinks.map((link, i) => (
            <p key={i}>
              <a href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            </p>
          ))}
      </div>

      {isCreator && (
        <div className="event-actions">
          <button onClick={handleEdit} className="btn-edit">
            Edit Event
          </button>
          <button onClick={handleDelete} className="btn-delete">
            Delete Event
          </button>
        </div>
      )}

      {!isCreator && (
        <div className="attendance-actions">
          <button onClick={handleAttendance} className="btn-attendance">
            {isAttending ? "Cancel Attendance" : "Attend"}
          </button>
          {isAttending && <span className="attending-label">Attending</span>}
        </div>
      )}
    </div>
  );
}
