import React from 'react';
import { Timer, X, Check } from 'lucide-react';
import PrimaryButton from './PrimaryButton';

export const DISAPPEARING_OPTIONS = [
  { label: 'Off', seconds: 0, caption: 'Messages remain in chat' },
  { label: '24 hours', seconds: 86400, caption: 'Expires 24 hours after being sent' },
  { label: '7 days', seconds: 604800, caption: 'Expires 7 days after being sent' },
  { label: '30 days', seconds: 2592000, caption: 'Expires 30 days after being sent' }
];

export const DisappearingMessagesModal = ({
  isOpen,
  onClose,
  currentDuration = 0,
  onSelectDuration
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-hs animate-fade-in" onClick={onClose}>
      <div className="confirm-modal-card disappearing-modal-card animate-pop-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="confirm-modal-icon-wrap" style={{ background: '#fce4ec' }}>
          <Timer size={26} color="#ED417A" />
        </div>

        <h3 className="confirm-modal-title">Disappearing Messages</h3>
        <p className="confirm-modal-message">
          When turned on, new messages sent in this chat will disappear after the selected duration. Existing messages won't be affected.
        </p>

        <div className="disappearing-options-list">
          {DISAPPEARING_OPTIONS.map((opt) => {
            const isSelected = Number(currentDuration) === opt.seconds;
            return (
              <div
                key={opt.seconds}
                className={`disappearing-opt-row ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectDuration(opt.seconds);
                  onClose();
                }}
              >
                <div className="opt-text-col">
                  <span className="opt-label">{opt.label}</span>
                  <span className="opt-caption">{opt.caption}</span>
                </div>
                {isSelected && (
                  <div className="opt-check-badge">
                    <Check size={16} color="#ffffff" strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="confirm-modal-actions" style={{ marginTop: '14px' }}>
          <button
            type="button"
            className="btn-cancel-modal"
            style={{ width: '100%' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisappearingMessagesModal;
