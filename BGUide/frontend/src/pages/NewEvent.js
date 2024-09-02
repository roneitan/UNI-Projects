// src/pages/NewEvent.js
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { createEvent } from "../context/actions";
import { useNavigate } from "react-router-dom";
import EventFormComponent from "../components/EventFormComponent";
import "../css/NewEvent.css"; // Import the CSS file

export default function NewEvent() {
  const { id: creatorId } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (eventData) => {
    try {
      dispatch(createEvent(eventData));
      navigate("/explorer");
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };
  return <EventFormComponent onSubmit={handleSubmit} creatorId={creatorId} />;
}
