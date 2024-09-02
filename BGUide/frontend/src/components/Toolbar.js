import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faPlus, faSearch, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import '../css/Toolbar.css';

const Toolbar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="toolbar-container">
            <div className="toolbar">
                <NavLink to="/explorer" className={`toolbar-button ${currentPath === '/explorer' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faHome} /> Home
                </NavLink>
                <NavLink to="/searchUsers" className={`toolbar-button ${currentPath === '/searchUsers' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faSearch} /> Search Users
                </NavLink>
                <NavLink to="/newEvent" className={`toolbar-button ${currentPath === '/newEvent' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faPlus} /> New Event
                </NavLink>
                <NavLink to="/myEvents" className={`toolbar-button ${currentPath === '/myEvents' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faCalendarAlt} /> My Events
                </NavLink>
                <NavLink to="/profile" className={`toolbar-button ${currentPath === '/profile' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faUser} /> Profile
                </NavLink>
            </div>
        </div>
    );
};

export default Toolbar;
