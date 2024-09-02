import React from "react";

export default function SearchedEvent({ event }) {
  const { name, description, date } = event;

  // const isApproved = eventsList.find((evt) => evt.id === event.id);
  // const isPending = pendingEvents.find((evt) => evt.id === event.id);

  return (
    <div>
      <p>{name}</p>
      <p>{description}</p>
      <p>{date}</p>
      {/* {isApproved ? (
        <>
          <p>Event is approved</p>
          <button onClick={() => dispatch(cancelEventRequest(event))}>
            Cancel
          </button>
        </>
      ) : isPending ? (
        <>
          <p>Event is pending</p>
          <button onClick={() => dispatch(approveEventRequest(event))}>
            Approve
          </button>
          <button onClick={() => dispatch(cancelEventRequest(event))}>
            Cancel
          </button>
        </>
      ) : (
        <p>No pending or approved status</p>
      )} */}
    </div>
  );
}
