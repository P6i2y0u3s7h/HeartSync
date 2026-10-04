import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  MapPin,
  Edit3,
  Settings as SettingsIcon,
  LogOut,
  Camera,
  Heart,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import HeartBackground from '../components/HeartBackground';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { userProfile, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const name = userProfile?.displayName || userProfile?.firstName || 'HeartSync Member';
  const age = userProfile?.age || 24;
  const photo = userProfile?.profilePhoto || userProfile?.photos?.[0] || '/assets/logo-heart.jpg';
  const location = `${userProfile?.city || 'Mumbai'}, ${userProfile?.country || 'India'}`;
  const bio = userProfile?.bio || 'Living life one adventure at a time. Looking for genuine connections on HeartSync!';
  const interests = userProfile?.interests && userProfile.interests.length > 0
    ? userProfile.interests
    : ['Music', 'Travel', 'Food', 'Fitness'];

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="My Profile" />

      <main className="main-content-scrollable profile-page-layout">
        {/* Profile Header Hero */}
        <div className="profile-hero-card">
          <div className="profile-photo-hero-wrap">
            <img src={photo} alt={name} className="profile-hero-img" />
            <button
              className="profile-edit-photo-fab"
              onClick={() => navigate('/profile-setup')}
              title="Edit Photos"
            >
              <Camera size={16} />
            </button>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-name-badge-row">
              <h2 className="profile-hero-name">{name}, <span>{age}</span></h2>
              {userProfile?.isVerified && (
                <span className="profile-verified-tag" title="Verified Account">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="profile-location-text">
              <MapPin size={14} /> {location}
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="profile-stats-bar">
            <div className="stat-col" onClick={() => navigate('/matches')}>
              <span className="stat-number">12</span>
              <span className="stat-label">Matches</span>
            </div>
            <div className="stat-col-divider"></div>
            <div className="stat-col" onClick={() => navigate('/likes')}>
              <span className="stat-number">48</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-col-divider"></div>
            <div className="stat-col">
              <span className="stat-number">98%</span>
              <span className="stat-label">Match Rate</span>
            </div>
          </div>
        </div>

        {/* Bio Card */}
        <div className="profile-section-card">
          <h3 className="section-card-title">About Me</h3>
          <p className="profile-bio-text">{bio}</p>
        </div>

        {/* Interests Card */}
        <div className="profile-section-card">
          <h3 className="section-card-title">Interests & Vibes</h3>
          <div className="profile-interests-cloud">
            {interests.map((interest, idx) => (
              <span key={idx} className="profile-interest-chip">
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions-stack">
          <button
            id="btn-edit-profile"
            className="profile-menu-btn"
            onClick={() => navigate('/profile-setup')}
          >
            <div className="menu-btn-left">
              <Edit3 size={18} className="menu-icon-pink" />
              <span>Edit Profile & Photos</span>
            </div>
            <span className="menu-arrow">›</span>
          </button>

          <button
            id="btn-profile-settings"
            className="profile-menu-btn"
            onClick={() => navigate('/settings')}
          >
            <div className="menu-btn-left">
              <SettingsIcon size={18} className="menu-icon-pink" />
              <span>Preferences & Settings</span>
            </div>
            <span className="menu-arrow">›</span>
          </button>

          <button
            id="btn-logout"
            className="profile-menu-btn logout-danger-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <div className="menu-btn-left">
              <LogOut size={18} className="menu-icon-red" />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </div>
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
