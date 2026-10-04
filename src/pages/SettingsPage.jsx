import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import PrimaryButton from '../components/PrimaryButton';
import HeartBackground from '../components/HeartBackground';
import { useAuth } from '../context/AuthContext';
import { getUserPreferences, updateUserPreferences } from '../services/userService';
import { Shield, Bell, Lock, User, LogOut, Check } from 'lucide-react';

export const SettingsPage = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState({
    minAge: 18,
    maxAge: 35,
    maxDistance: 50,
    preferredGender: 'All',
    relationshipIntentions: 'Serious Relationship',
    notificationsEnabled: true
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      getUserPreferences(currentUser.uid).then((prefs) => {
        if (prefs) setPreferences(prev => ({ ...prev, ...prefs }));
      });
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      await updateUserPreferences(currentUser.uid, preferences);
      setSuccessMsg('Preferences saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Error updating preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="Settings" />

      <main className="main-content-scrollable settings-page-layout">
        {successMsg && (
          <div className="alert-box-success" style={{ margin: '16px 20px 0' }}>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="settings-form">
          {/* Discovery Preferences */}
          <div className="settings-group-card">
            <h3 className="settings-group-title">Discovery Preferences</h3>

            <div className="settings-field">
              <label className="settings-label">Interested In</label>
              <div className="gender-pill-group">
                {['All', 'Male', 'Female', 'Others'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`gender-pill-btn ${preferences.preferredGender === g ? 'active' : ''}`}
                    onClick={() => setPreferences({ ...preferences, preferredGender: g })}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <div className="settings-label-row">
                <label className="settings-label">Age Range</label>
                <span className="settings-value-chip">{preferences.minAge} - {preferences.maxAge}</span>
              </div>
              <input
                type="range"
                min="18"
                max="60"
                value={preferences.maxAge}
                onChange={(e) => setPreferences({ ...preferences, maxAge: Number(e.target.value) })}
                className="hs-slider"
              />
            </div>

            <div className="settings-field">
              <div className="settings-label-row">
                <label className="settings-label">Max Distance</label>
                <span className="settings-value-chip">{preferences.maxDistance} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={preferences.maxDistance}
                onChange={(e) => setPreferences({ ...preferences, maxDistance: Number(e.target.value) })}
                className="hs-slider"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Relationship Intention</label>
              <select
                value={preferences.relationshipIntentions}
                onChange={(e) => setPreferences({ ...preferences, relationshipIntentions: e.target.value })}
                className="form-control-hs"
              >
                <option value="Serious Relationship">Serious Relationship</option>
                <option value="Casual Dating">Casual Dating</option>
                <option value="Long-term Partner">Long-term Partner</option>
                <option value="New Friends">New Friends</option>
                <option value="Marriage">Marriage</option>
              </select>
            </div>
          </div>

          {/* Account & Security */}
          <div className="settings-group-card">
            <h3 className="settings-group-title">Account & Security</h3>

            <div className="settings-info-row">
              <span className="settings-info-label">Account Email</span>
              <span className="settings-info-val">{currentUser?.email || 'user@heartsync.com'}</span>
            </div>

            <div className="settings-info-row">
              <span className="settings-info-label">Verification Status</span>
              <span className="settings-info-val verified-badge-text">
                <Check size={14} /> Verified Member
              </span>
            </div>

            <div className="settings-info-row">
              <span className="settings-info-label">Firebase Auth UID</span>
              <span className="settings-info-val uid-text">{currentUser?.uid ? `${currentUser.uid.slice(0, 12)}...` : 'demo-uid'}</span>
            </div>
          </div>

          <PrimaryButton
            type="submit"
            loading={saving}
            className="settings-save-btn"
          >
            Save Preferences
          </PrimaryButton>
        </form>

        <div className="settings-logout-wrap">
          <button
            type="button"
            className="btn-danger-logout"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} /> Sign Out of HeartSync
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;
