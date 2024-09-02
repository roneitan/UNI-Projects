import React from "react";
import SearchedEvent from "./SearchedEvent";
import { useSelector } from "react-redux";

export default function SearchedEvents() {
  const { events } = useSelector((state) => state.searchEvent);

  return (
    <div>
      {events.length > 0 &&
        events.map((event, i) => <SearchedEvent key={i} event={event} />)}
    </div>
  );
}
