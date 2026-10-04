import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import PrimaryButton from './PrimaryButton';

const ALL_INTERESTS = [
  'Music', 'Travel', 'Food', 'Fitness', 'Movies',
  'Art', 'Gaming', 'Books', 'Photography', 'Cooking'
];

export const FilterModal = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    minAge: 18,
    maxAge: 35,
    maxDistance: 50,
    preferredGender: 'All',
    city: '',
    verifiedOnly: false,
    interests: []
  });

  if (!isOpen) return null;

  const toggleInterest = (interest) => {
    setLocalFilters(prev => {
      const current = prev.interests || [];
      const updated = current.includes(interest)
        ? current.filter(i => i !== interest)
        : [...current, interest];
      return { ...prev, interests: updated };
    });
  };

  const handleReset = () => {
    const defaultFilters = {
      minAge: 18,
      maxAge: 35,
      maxDistance: 50,
      preferredGender: 'All',
      city: '',
      verifiedOnly: false,
      interests: []
    };
    setLocalFilters(defaultFilters);
    onApply(defaultFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="modal-backdrop-hs" onClick={onClose}>
      <div className="filter-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header-row">
          <h3 className="modal-title">Discovery Filters</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="filter-modal-body">
          {/* Gender */}
          <div className="filter-section">
            <label className="filter-label">Show Me</label>
            <div className="gender-pill-group">
              {['All', 'Male', 'Female', 'Others'].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`gender-pill-btn ${localFilters.preferredGender === g ? 'active' : ''}`}
                  onClick={() => setLocalFilters({ ...localFilters, preferredGender: g })}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div className="filter-section">
            <div className="filter-label-row">
              <label className="filter-label">Age Range</label>
              <span className="filter-value-text">{localFilters.minAge || 18} - {localFilters.maxAge || 35}</span>
            </div>
            <div className="range-slider-wrapper">
              <input
                type="range"
                min="18"
                max="60"
                value={localFilters.maxAge || 35}
                onChange={(e) => setLocalFilters({ ...localFilters, maxAge: Number(e.target.value) })}
                className="hs-slider"
              />
            </div>
          </div>

          {/* Distance */}
          <div className="filter-section">
            <div className="filter-label-row">
              <label className="filter-label">Maximum Distance</label>
              <span className="filter-value-text">{localFilters.maxDistance || 50} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={localFilters.maxDistance || 50}
              onChange={(e) => setLocalFilters({ ...localFilters, maxDistance: Number(e.target.value) })}
              className="hs-slider"
            />
          </div>

          {/* City */}
          <div className="filter-section">
            <label className="filter-label">City</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              value={localFilters.city || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
              className="form-control-hs"
            />
          </div>

          {/* Verified Only */}
          <div className="filter-section checkbox-section">
            <label className="checkbox-custom-label">
              <input
                type="checkbox"
                checked={localFilters.verifiedOnly || false}
                onChange={(e) => setLocalFilters({ ...localFilters, verifiedOnly: e.target.checked })}
              />
              <span className="checkbox-custom-box">
                {localFilters.verifiedOnly && <Check size={14} color="#fff" />}
              </span>
              <span className="checkbox-text">Verified Profiles Only</span>
            </label>
          </div>

          {/* Interests */}
          <div className="filter-section">
            <label className="filter-label">Interests</label>
            <div className="interests-pill-cloud">
              {ALL_INTERESTS.map((interest) => {
                const isSelected = (localFilters.interests || []).includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-tag-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="modal-footer-row">
          <button type="button" className="btn-reset-filters" onClick={handleReset}>
            Reset
          </button>
          <PrimaryButton onClick={handleApply}>
            Apply Filters
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
