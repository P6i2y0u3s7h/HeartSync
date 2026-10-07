import React, { useState, useRef, useLayoutEffect } from 'react';
import { Copy, Trash2, Check, CheckCheck, Star, Ban, CheckSquare, Square } from 'lucide-react';

const REACTION_EMOJIS = ['😂', '👍', '🔥', '😮'];

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
  const [placement, setPlacement] = useState('top');
  const [toolbarStyle, setToolbarStyle] = useState({});

  const outerWrapRef = useRef(null);
  const toolbarRef = useRef(null);
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

  // ── Viewport-aware, collision-free Toolbar Positioning ─────────────────────
  const updatePosition = () => {
    if (!outerWrapRef.current) return;
    const outerEl = outerWrapRef.current;
    const outerRect = outerEl.getBoundingClientRect();
    const chatContainer = outerEl.closest('.chat-messages-container');
    const containerRect = chatContainer
      ? chatContainer.getBoundingClientRect()
      : {
          top: 0,
          bottom: window.innerHeight,
          left: 0,
          right: window.innerWidth,
          width: window.innerWidth,
        };

    // 1. VERTICAL POSITIONING
    // Height of toolbar is ~42px, plus 8px connecting gap = 50px required clearance
    const spaceAbove = outerRect.top - containerRect.top;
    const neededHeight = 52;

    // Position above when space is sufficient; safely flip below otherwise
    const shouldPlaceAbove = spaceAbove >= neededHeight;
    setPlacement(shouldPlaceAbove ? 'top' : 'bottom');

    // 2. HORIZONTAL POSITIONING & VIEWPORT CLAMPING
    // Keep at least 12px margin from chat container/viewport edges
    const minLeft = containerRect.left + 12;
    const maxRight = containerRect.right - 12;
    const availableWidth = Math.max(200, maxRight - minLeft);

    // Measure or estimate toolbar width
    const toolbarWidth = toolbarRef.current?.offsetWidth || 300;
    const effectiveWidth = Math.min(toolbarWidth, availableWidth);

    // Desired viewport target:
    // Outgoing (sent) -> anchor right edge of toolbar to right edge of message
    // Incoming (received) -> anchor left edge of toolbar to left edge of message
    let targetLeftInViewport = isOutgoing
      ? outerRect.right - effectiveWidth
      : outerRect.left;

    // Viewport-aware bounds clamping
    if (targetLeftInViewport + effectiveWidth > maxRight) {
      targetLeftInViewport = maxRight - effectiveWidth;
    }
    if (targetLeftInViewport < minLeft) {
      targetLeftInViewport = minLeft;
    }

    // Convert absolute viewport X to relative X for outerWrap (its containing block)
    const relativeLeft = Math.round(targetLeftInViewport - outerRect.left);

    setToolbarStyle({
      left: `${relativeLeft}px`,
      right: 'auto',
      maxWidth: `${availableWidth}px`,
    });
  };

  useLayoutEffect(() => {
    if (!isActionsActive) return;

    updatePosition();

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleUpdate);
    const container = outerWrapRef.current?.closest('.chat-messages-container');
    if (container) {
      container.addEventListener('scroll', handleUpdate, { passive: true });
    }

    // Second-pass measurement after layout paint ensures exact offsetWidth
    const rafId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleUpdate);
      if (container) {
        container.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [isActionsActive, isOutgoing]);

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

  // ── Touch long-press & tap for mobile interaction ─────────────────────────

  const handleTouchStart = () => {
    longPressFiredRef.current = false;
    if (isSelectionMode) return;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      if (onActivate) {
        onActivate(message.id);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if finger moves (user is scrolling)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSelectionMode && onActivate) {
      onActivate(message.id);
    }
  };

  // ── Primary click/tap: toggle action toolbar ──────────────────────────────

  const handleRowClick = (e) => {
    // If long-press just fired, ignore the subsequent click event
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }

    if (isSelectionMode) {
      // In selection mode, toggle this message's selection
      if (onToggleSelect) onToggleSelect(message.id);
      return;
    }

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

      <div
        ref={outerWrapRef}
        className={`chat-bubble-outer-wrap ${hasReactions ? 'has-reactions' : ''}`}
      >
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

        {/* Action toolbar — viewport-aware, anchored, never covers message */}
        {isActionsActive && !isSelectionMode && !isDeletedForEveryone && (
          <div
            ref={toolbarRef}
            className={`chat-bubble-action-menu placement-${placement} ${isOutgoing ? 'menu-outgoing' : 'menu-incoming'}`}
            style={toolbarStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Emoji reaction section: 😂 👍 🔥 😮 */}
            <div className="reaction-quick-picks">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="quick-react-btn"
                  onClick={(e) => handleReactionClick(e, emoji)}
                  title={`React ${emoji}`}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* 2. Subtle Divider */}
            <div className="bubble-action-divider" aria-hidden="true" />

            {/* 3. Text actions: Copy, Star, Select, Delete */}
            <div className="bubble-action-buttons">
              <button
                type="button"
                className="bubble-action-item"
                onClick={handleCopy}
                title="Copy message"
                aria-label="Copy message"
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                type="button"
                className={`bubble-action-item ${isStarred ? 'starred-active' : ''}`}
                onClick={handleStar}
                title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isStarred ? 'Unstar message' : 'Star message'}
              >
                <Star size={13} fill={isStarred ? '#fbc02d' : 'none'} color={isStarred ? '#fbc02d' : 'currentColor'} />
                {isStarred ? 'Unstar' : 'Star'}
              </button>

              <button
                type="button"
                className="bubble-action-item"
                onClick={handleSelectClick}
                title="Select messages"
                aria-label="Select message"
              >
                <CheckSquare size={13} /> Select
              </button>

              {onDeleteRequest && (
                <button
                  type="button"
                  className="bubble-action-item action-delete"
                  onClick={handleDelete}
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
