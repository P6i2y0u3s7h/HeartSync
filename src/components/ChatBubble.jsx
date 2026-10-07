import React, { useState, useRef } from 'react';
import { Copy, Trash2, Check, CheckCheck, Star, Ban, CheckSquare, Square } from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮'];

export const ChatBubble = ({
  message,
  isOutgoing,
  otherUserPhoto,
  currentUserPhoto,
  currentUid,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onStartSelection,
  onReact,
  onDeleteRequest,
  onToggleStar,
  onNotify,
  // Lifted state — controlled by parent (ChatPage)
  isActionsActive,
  onActivate,    // (messageId) => void  — called when user clicks message to activate
  onDeactivate,  // () => void           — called after an action is executed
}) => {
  const [copied, setCopied] = useState(false);
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const formattedTime = message.createdAt?.toDate
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const avatarSrc = isOutgoing
    ? (currentUserPhoto || '/assets/profile-user.jpg')
    : (otherUserPhoto || '/assets/profile-aditya.jpg');

  const isStarred = Boolean(currentUid && message.starredBy?.[currentUid]);
  const isDeletedForEveryone = Boolean(message.isDeletedForEveryone);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleCopy = (e) => {
    e.stopPropagation();
    if (message.message && !isDeletedForEveryone) {
      navigator.clipboard.writeText(message.message).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onNotify) onNotify('Message copied');
    }
    if (onDeactivate) onDeactivate();
  };

  const handleReactionClick = (e, emoji) => {
    e.stopPropagation();
    if (onReact && !isDeletedForEveryone) {
      onReact(message.id, emoji);
    }
    if (onDeactivate) onDeactivate();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDeleteRequest) {
      onDeleteRequest(message);
    }
    if (onDeactivate) onDeactivate();
  };

  const handleStar = (e) => {
    e.stopPropagation();
    if (onToggleStar && !isDeletedForEveryone) {
      onToggleStar(message.id);
    }
    if (onDeactivate) onDeactivate();
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
    if (onStartSelection) {
      onStartSelection(message.id);
    }
    if (onDeactivate) onDeactivate();
  };

  // ── Touch long-press for mobile selection mode ────────────────────────────

  const handleTouchStart = (e) => {
    longPressFiredRef.current = false;
    if (isSelectionMode) return;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      if (onStartSelection) {
        onStartSelection(message.id);
      }
    }, 450);
  };

  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if finger moves (scroll gesture)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSelectionMode && onStartSelection) {
      onStartSelection(message.id);
    }
  };

  // ── Primary click/tap: activate action toolbar ────────────────────────────

  const handleRowClick = (e) => {
    // If long-press just fired, ignore the click that follows
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }

    if (isSelectionMode) {
      // In selection mode, toggle this message's selection
      if (onToggleSelect) onToggleSelect(message.id);
      return;
    }

    // Toggle the action toolbar via parent state
    e.stopPropagation();
    if (isActionsActive) {
      if (onDeactivate) onDeactivate();
    } else {
      if (onActivate) onActivate(message.id);
    }
  };

  // ── Reactions aggregation ─────────────────────────────────────────────────

  const reactionsMap = message.reactions || {};
  const reactionCounts = {};
  Object.values(reactionsMap).forEach((emoji) => {
    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
  });
  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <div
      id={`msg-${message.id}`}
      className={`chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'} ${isSelectionMode ? 'selection-mode-active' : ''} ${isSelected ? 'row-selected' : ''} ${isActionsActive ? 'bubble-row-active' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
      onClick={handleRowClick}
    >
      {/* Checkbox indicator in Selection Mode */}
      {isSelectionMode && (
        <div className="selection-checkbox-wrap">
          {isSelected ? (
            <CheckSquare size={20} color="#ED417A" />
          ) : (
            <Square size={20} color="#aaaaaa" />
          )}
        </div>
      )}

      {!isOutgoing && (
        <div className="chat-bubble-avatar-wrap incoming-avatar">
          <img src={avatarSrc} alt="User" className="chat-bubble-avatar-img" />
        </div>
      )}

      <div className="chat-bubble-outer-wrap">
        <div
          className={`chat-bubble-body ${
            isOutgoing ? 'bubble-outgoing' : 'bubble-incoming'
          } ${message.type === 'emoji' ? 'bubble-emoji-only' : ''} ${isDeletedForEveryone ? 'bubble-deleted-msg' : ''} ${isSelected ? 'bubble-selected' : ''} ${isActionsActive ? 'bubble-body-active' : ''}`}
        >
          {isDeletedForEveryone ? (
            <p className="chat-message-text deleted-text">
              <Ban size={14} className="deleted-ban-icon" /> <em>This message was deleted.</em>
            </p>
          ) : message.type === 'image' && message.imageUrl ? (
            <div className="chat-bubble-image-wrap">
              <img src={message.imageUrl} alt="Attachment" className="chat-attachment-img" />
            </div>
          ) : (
            <p className="chat-message-text">{message.message}</p>
          )}

          <div className="chat-bubble-footer-meta">
            {isStarred && (
              <span className="chat-star-indicator" title="Starred Message">
                <Star size={11} fill="#fbc02d" color="#fbc02d" />
              </span>
            )}
            {formattedTime && <span className="chat-timestamp">{formattedTime}</span>}
            {isOutgoing && !isDeletedForEveryone && (
              <span className={`chat-read-indicator ${message.isRead ? 'read' : 'sent'}`} title={message.isRead ? 'Read' : 'Delivered'}>
                {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </div>

          {/* Reaction badge */}
          {hasReactions && !isDeletedForEveryone && (
            <div className="chat-bubble-reactions-badge">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span key={emoji} className="bubble-reaction-pill">
                  {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action toolbar — state-controlled, never hover-dependent */}
        {isActionsActive && !isSelectionMode && !isDeletedForEveryone && (
          <div
            className={`chat-bubble-action-menu animate-fade-in ${isOutgoing ? 'menu-outgoing' : 'menu-incoming'}`}
            // Prevent clicks inside the toolbar from bubbling up to the messages container
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reaction-quick-picks">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="quick-react-btn"
                  onPointerUp={(e) => handleReactionClick(e, emoji)}
                  title={`React ${emoji}`}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="bubble-action-buttons">
              <button
                type="button"
                className="bubble-action-item"
                onPointerUp={handleCopy}
                title="Copy message"
                aria-label="Copy message"
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                type="button"
                className={`bubble-action-item ${isStarred ? 'starred-active' : ''}`}
                onPointerUp={handleStar}
                title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isStarred ? 'Unstar message' : 'Star message'}
              >
                <Star size={13} fill={isStarred ? '#fbc02d' : 'none'} color={isStarred ? '#fbc02d' : 'currentColor'} />
                {isStarred ? 'Unstar' : 'Star'}
              </button>

              <button
                type="button"
                className="bubble-action-item"
                onPointerUp={handleSelectClick}
                title="Select messages"
                aria-label="Select message"
              >
                <CheckSquare size={13} /> Select
              </button>

              {onDeleteRequest && (
                <button
                  type="button"
                  className="bubble-action-item action-delete"
                  onPointerUp={handleDelete}
                  title="Delete message"
                  aria-label="Delete message"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isOutgoing && (
        <div className="chat-bubble-avatar-wrap outgoing-avatar">
          <img src={avatarSrc} alt="Me" className="chat-bubble-avatar-img" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
