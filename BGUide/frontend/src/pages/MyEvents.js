// src/Explorer.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { useDispatch, useSelector } from "react-redux";
import { getMyEvents, getCreatedByMeEvents } from '../context/actions';
import '../css/explorer.css';

// Utility function to format the location
const formatLocation = (fullAddress) => {
  if (!fullAddress) return 'N/A';
  const addressParts = fullAddress.split(', ');
  const street = addressParts[0];
  const city = addressParts[3];
  return `${street}, ${city}`;
};


const MyEvents = () => {
    // Select user details and events from Redux store
  const { id, userEvents } = useSelector((state) => state.user);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'createdByMe'
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (viewMode === 'all'){
          await dispatch(getMyEvents(id));
        }
        else{
          await dispatch(getCreatedByMeEvents(id));
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, [id, dispatch, viewMode]);


  const eventsArray = Object.values(userEvents || {});

  return (
    <div className="app">
      <main>
        <h1>My Events</h1>
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={viewMode === 'createdByMe'}
              onChange={() =>
                setViewMode(viewMode === 'all' ? 'createdByMe' : 'all')
              }
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">
              Show only events created by me
            </span>
          </label>
        </div>
        <EventsList events={eventsArray} viewMode={viewMode} />
      </main>
    </div>
  );
};
  // return (
  //   <div className="app">     
  //     <main>
  //       <h1>My Events</h1>
  //       <div>
  //           <button
  //               onClick={() => setViewMode(viewMode === 'all' ? 'createdByMe' : 'all')}
  //               className="px-4 py-2 bg-blue-500 text-white rounded-lg"
  //               >
  //               {viewMode === 'all' ? 'Events created by me' : 'My events'}
  //           </button>
  //       </div>
  //       <EventsList events={eventsArray} />
  //     </main>
  //   </div>
  // );
// };

export default MyEvents;

function EventEntry({ event }) {
  return (
    <div className="event">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden">
        <img src={event.imgUrl} alt="Event" className="event-img" />
        {/* <img src="./party.jpg" alt="Event" className="event-img" /> */}
        <div className="p-4">
          <h2 className="event-name">{event.name}</h2>
          <p className="event-date">{new Date(event.startDate).toLocaleString()}</p>
          <p className="event-location">{formatLocation(event.location.name)}</p>
          <Link to={`/event/${event.id}`} className="more-details">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function EventsList({ events }) {
  return (
    <div className="events">
      {events.map(event => (
        <EventEntry key={event.id} event={event} />
      ))}
    </div>
  );
}
