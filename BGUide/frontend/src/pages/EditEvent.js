// src/pages/EditEvent.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEvent, updateEvent } from "../context/actions";
import { useParams, useNavigate } from "react-router-dom";
import EventFormComponent from "../components/EventFormComponent";
import "../css/event.css";

export default function EditEvent() {
  const { id: eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const event = useSelector((state) => state.event);
  const { id: creatorId } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getEvent(eventId));
  }, [dispatch, eventId]);

  const handleSubmit = async (formData) => {
    // Convert FormData to a dictionary
    const updatedEvent = {};
    formData.forEach((value, key) => {
      if (
        key === "lineup" ||
        key === "paymentLinks" ||
        key === "location" ||
        key === "date"
      ) {
        updatedEvent[key] = JSON.parse(value);
      } else {
        updatedEvent[key] = value;
      }
    });
    updatedEvent.id = eventId;

    try {
      const result = await dispatch(updateEvent(updatedEvent));
      if (result && result.id) {
        navigate(`/event/${result.id}`);
      }
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <EventFormComponent
      initialData={event}
      onSubmit={handleSubmit}
      creatorId={creatorId}
    />
  );
}
