import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ value, onChange, placeholder = 'Search by name, username, city...', onClear }) => {
  return (
    <div className="search-bar-container-hs">
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon-hs" />
        <input
          id="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="search-input-field"
        />
        {value && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClear ? onClear : () => onChange('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
