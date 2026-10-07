import React from 'react';
import { Star, X, Trash2, ArrowUpRight } from 'lucide-react';

export const StarredMessagesModal = ({
  isOpen,
  onClose,
  starredMessages = [],
  onScrollToMessage,
  onUnstarMessage,
  currentUid,
  otherUser = {}
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-hs animate-fade-in" onClick={onClose}>
      <div className="confirm-modal-card starred-modal-card animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-with-icon">
            <Star size={20} fill="#fbc02d" color="#fbc02d" />
            <h3 className="modal-title">Starred Messages ({starredMessages.length})</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="starred-messages-list-body">
          {starredMessages.length === 0 ? (
            <div className="starred-empty-view">
              <Star size={36} color="#cccccc" />
              <p>No starred messages yet.</p>
              <span className="starred-empty-sub">
                Click or long-press any message in the chat and tap <strong>Star</strong> to bookmark key moments!
              </span>
            </div>
          ) : (
            starredMessages.map((msg) => {
              const isOutgoing = msg.senderId === currentUid || msg.senderId === 'current_user';
              const senderName = isOutgoing ? 'You' : (otherUser.displayName || otherUser.firstName || 'Member');
              const formattedTime = msg.createdAt?.toDate
                ? msg.createdAt.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id}
                  className="starred-message-item"
                  onClick={() => {
                    onScrollToMessage(msg.id);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="starred-item-header">
                    <span className="starred-sender-name">{senderName}</span>
                    <span className="starred-item-time">{formattedTime}</span>
                  </div>

                  <p className="starred-item-text">
                    {msg.message || '📷 Photo'}
                  </p>

                  <div className="starred-item-footer">
                    <button
                      type="button"
                      className="btn-unstar-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnstarMessage(msg.id);
                      }}
                      title="Remove from Starred"
                    >
                      <Star size={13} fill="#fbc02d" color="#fbc02d" /> Unstar
                    </button>

                    <span className="jump-to-msg-link">
                      Jump to message <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
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

export default StarredMessagesModal;
