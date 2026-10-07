import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import PrimaryButton from '../components/PrimaryButton';
import HeartBackground from '../components/HeartBackground';
import { useAuth } from '../context/AuthContext';
import { getUserPreferences, updateUserPreferences } from '../services/userService';
import { subscribeToBlockedUsers, unblockUser } from '../services/blockService';
import { Shield, Bell, Lock, User, LogOut, Check, UserX, Unlock, ShieldCheck, Clock } from 'lucide-react';
import VerificationModal from '../components/VerificationModal';

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
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserPreferences(currentUser.uid).then((prefs) => {
        if (prefs) setPreferences(prev => ({ ...prev, ...prefs }));
      });

      const unsubscribe = subscribeToBlockedUsers(currentUser.uid, (list) => {
        setBlockedUsers(list);
      });

      return () => unsubscribe();
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

  const handleUnblock = async (blockedId) => {
    if (!currentUser?.uid || !blockedId) return;
    setUnblockingId(blockedId);
    try {
      await unblockUser(currentUser.uid, blockedId);
      setSuccessMsg('User unblocked successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error unblocking user:', err);
    } finally {
      setUnblockingId(null);
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

          {/* Privacy & Safety - Blocked Users */}
          <div className="settings-group-card">
            <div className="settings-group-header-row">
              <h3 className="settings-group-title">Privacy & Safety</h3>
              <UserX size={18} color="#ED417A" />
            </div>

            <div className="blocked-users-section">
              <h4 className="blocked-users-subtitle">Blocked Accounts ({blockedUsers.length})</h4>
              {blockedUsers.length > 0 ? (
                <div className="blocked-users-list">
                  {blockedUsers.map((b) => {
                    const info = b.blockedUser || {};
                    const bName = info.displayName || 'Member';
                    const bPhoto = info.profilePhoto || '/assets/logo-heart.jpg';
                    const targetId = b.blockedId;

                    return (
                      <div key={b.id || targetId} className="blocked-user-row">
                        <div className="blocked-user-left">
                          <img src={bPhoto} alt={bName} className="blocked-user-avatar" />
                          <span className="blocked-user-name">{bName}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-unblock-user"
                          disabled={unblockingId === targetId}
                          onClick={() => handleUnblock(targetId)}
                        >
                          <Unlock size={14} />
                          {unblockingId === targetId ? 'Unblocking...' : 'Unblock'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="blocked-users-empty-text">
                  You have not blocked any accounts. Blocked users will not be able to discover or contact you.
                </p>
              )}
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
              <span className="settings-info-label">Photo Verification</span>
              <div className="settings-verify-action-wrap">
                {userProfile?.isVerified || userProfile?.verificationStatus === 'verified' ? (
                  <span className="settings-info-val verified-badge-text">
                    <Check size={14} /> Verified
                  </span>
                ) : userProfile?.verificationStatus === 'pending' ? (
                  <span className="settings-info-val pending-badge-text">
                    <Clock size={14} /> Pending Review
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-settings-verify"
                    onClick={() => setVerificationModalOpen(true)}
                  >
                    <ShieldCheck size={14} /> Get Verified
                  </button>
                )}
              </div>
            </div>

            <div className="settings-info-row">
              <span className="settings-info-label">ID Verification</span>
              <div className="settings-verify-action-wrap">
                {userProfile?.identityVerificationStatus === 'verified' ? (
                  <span className="settings-info-val verified-badge-text">
                    <ShieldCheck size={14} /> ID Verified
                  </span>
                ) : userProfile?.identityVerificationStatus === 'pending' ? (
                  <span className="settings-info-val pending-badge-text">
                    <Clock size={14} /> Pending Review
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-settings-verify"
                    onClick={() => setVerificationModalOpen(true)}
                  >
                    <Shield size={14} /> Verify ID
                  </button>
                )}
              </div>
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

      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
      />

      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;
