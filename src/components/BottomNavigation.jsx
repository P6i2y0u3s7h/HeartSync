import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Compass, MessageCircle, User } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const BottomNavigation = () => {
  return (
    <nav className="bottom-nav-container-hs" aria-label="Main Navigation">
      <div className="bottom-nav-pill">
        <NavLink
          to="/home"
          id="nav-home"
          className={({ isActive }) => `nav-item-hs ${isActive ? 'active' : ''}`}
        >
          <Home size={22} className="nav-icon" />
          <span className="nav-label">Home</span>
        </NavLink>

        <NavLink
          to="/likes"
          id="nav-likes"
          className={({ isActive }) => `nav-item-hs ${isActive ? 'active' : ''}`}
        >
          <Heart size={22} className="nav-icon" />
          <span className="nav-label">Likes</span>
        </NavLink>

        <NavLink
          to="/discover"
          id="nav-discover"
          className={({ isActive }) => `nav-item-hs ${isActive ? 'active' : ''}`}
        >
          <Compass size={22} className="nav-icon" />
          <span className="nav-label">Discover</span>
        </NavLink>

        <NavLink
          to="/chats"
          id="nav-chats"
          className={({ isActive }) => `nav-item-hs ${isActive ? 'active' : ''}`}
        >
          <MessageCircle size={22} className="nav-icon" />
          <span className="nav-label">Chats</span>
        </NavLink>

        <NavLink
          to="/profile"
          id="nav-profile"
          className={({ isActive }) => `nav-item-hs ${isActive ? 'active' : ''}`}
        >
          <User size={22} className="nav-icon" />
          <span className="nav-label">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavigation;
