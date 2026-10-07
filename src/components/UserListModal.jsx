import React, { useState, useEffect } from 'react';
import { ListPlus, X, Check, Plus } from 'lucide-react';
import { PREDEFINED_LISTS, getUserListsForTarget, updateUserListMembership } from '../services/userListService';
import PrimaryButton from './PrimaryButton';

export const UserListModal = ({
  isOpen,
  onClose,
  currentUid,
  targetUid,
  targetProfile = {}
}) => {
  const [selectedLists, setSelectedLists] = useState([]);
  const [customListName, setCustomListName] = useState('');
  const [customLists, setCustomLists] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUid && targetUid) {
      setLoading(true);
      getUserListsForTarget(currentUid, targetUid).then((existing) => {
        setSelectedLists(existing || []);
        // Check if there are lists beyond predefined
        const custom = (existing || []).filter(l => !PREDEFINED_LISTS.includes(l));
        setCustomLists(custom);
        setLoading(false);
      });
    }
  }, [isOpen, currentUid, targetUid]);

  if (!isOpen) return null;

  const toggleList = (listName) => {
    setSelectedLists(prev =>
      prev.includes(listName)
        ? prev.filter(l => l !== listName)
        : [...prev, listName]
    );
  };

  const handleAddCustomList = (e) => {
    e.preventDefault();
    const name = customListName.trim();
    if (!name) return;
    if (!customLists.includes(name) && !PREDEFINED_LISTS.includes(name)) {
      setCustomLists(prev => [...prev, name]);
    }
    if (!selectedLists.includes(name)) {
      setSelectedLists(prev => [...prev, name]);
    }
    setCustomListName('');
  };

  const handleSave = async () => {
    if (!currentUid || !targetUid) return;
    setSaving(true);
    try {
      await updateUserListMembership(currentUid, targetUid, targetProfile, selectedLists);
      onClose();
    } catch (err) {
      console.warn('Error saving user lists:', err);
    } finally {
      setSaving(false);
    }
  };

  const targetName = targetProfile.displayName || targetProfile.firstName || 'this member';
  const allAvailableLists = Array.from(new Set([...PREDEFINED_LISTS, ...customLists]));

  return (
    <div className="modal-backdrop-hs animate-fade-in" onClick={onClose}>
      <div className="confirm-modal-card user-list-modal-card animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-with-icon">
            <ListPlus size={20} color="#ED417A" />
            <h3 className="modal-title">Organize in Lists</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="user-list-intro">
          Add <strong>{targetName}</strong> to personalized categories visible only to you.
        </p>

        {loading ? (
          <p className="loading-sub-text">Loading lists...</p>
        ) : (
          <div className="user-lists-selection-body">
            <div className="lists-checkbox-grid">
              {allAvailableLists.map((listName) => {
                const isChecked = selectedLists.includes(listName);
                return (
                  <label key={listName} className={`list-checkbox-pill ${isChecked ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleList(listName)}
                      style={{ display: 'none' }}
                    />
                    <span className="list-pill-check">
                      {isChecked ? <Check size={13} color="#ffffff" strokeWidth={3} /> : null}
                    </span>
                    <span className="list-pill-text">{listName}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom List Creation Input */}
            <form onSubmit={handleAddCustomList} className="add-custom-list-form">
              <input
                type="text"
                placeholder="New custom list (e.g. Travel Buddies)"
                value={customListName}
                onChange={e => setCustomListName(e.target.value)}
                className="custom-list-input"
                maxLength={30}
              />
              <button
                type="submit"
                disabled={!customListName.trim()}
                className="btn-add-custom-list"
                aria-label="Add custom list"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        )}

        <div className="confirm-modal-actions" style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-cancel-modal"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <PrimaryButton
            onClick={handleSave}
            loading={saving}
            className="btn-save-lists"
          >
            Save Lists
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
