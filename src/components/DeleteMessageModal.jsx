import React from 'react';
import { Trash2, X, Users, User } from 'lucide-react';

export const DeleteMessageModal = ({
  isOpen,
  onClose,
  isOwnMessage,
  selectedCount = 1,
  onDeleteForMe,
  onDeleteForEveryone
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-hs animate-fade-in" onClick={onClose}>
      <div className="confirm-modal-card animate-pop-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="confirm-modal-icon-wrap" style={{ background: '#ffebee' }}>
          <Trash2 size={26} color="#e53935" />
        </div>

        <h3 className="confirm-modal-title">
          {selectedCount > 1 ? `Delete ${selectedCount} messages?` : 'Delete message?'}
        </h3>
        <p className="confirm-modal-message">
          {isOwnMessage
            ? 'You can delete this message for yourself, or remove it for everyone in this chat.'
            : 'This message will be removed from your chat view.'}
        </p>

        <div className="delete-message-options-stack">
          {isOwnMessage && onDeleteForEveryone && (
            <button
              type="button"
              className="btn-delete-option btn-delete-everyone"
              onClick={() => {
                onDeleteForEveryone();
                onClose();
              }}
            >
              <Users size={16} /> Delete for everyone
            </button>
          )}

          <button
            type="button"
            className="btn-delete-option btn-delete-forme"
            onClick={() => {
              onDeleteForMe();
              onClose();
            }}
          >
            <User size={16} /> Delete for me
          </button>

          <button
            type="button"
            className="btn-cancel-modal"
            style={{ width: '100%', marginTop: '4px' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
