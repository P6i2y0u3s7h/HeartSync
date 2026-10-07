import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Send,
  Plus,
  Volume2,
  VolumeX,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { deleteStory, recordStoryView, getStoryViews } from '../services/storyService';
import { sendMessage } from '../services/messageService';
import { getDeterministicChatId } from '../services/chatService';

export const StoryViewer = ({
  isOpen,
  onClose,
  initialUserIndex = 0,
  storyUsers = [], // array of { userId, userDisplayName, userProfilePhoto, stories: [] }
  currentUser,
  userProfile,
  onOpenAddStory,
  onStoryDeleted
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100 for current story
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySentNotice, setReplySentNotice] = useState(false);

  const videoRef = useRef(null);
  const progressTimerRef = useRef(null);
  const storyDurationMs = 5000; // 5 seconds for photos

  // Sync initial user index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(Math.max(0, Math.min(initialUserIndex, storyUsers.length - 1)));
      setCurrentStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowDeleteConfirm(false);
      setShowViewsModal(false);
    }
  }, [isOpen, initialUserIndex, storyUsers.length]);

  const activeGroup = storyUsers[currentUserIndex];
  const activeStory = activeGroup?.stories?.[currentStoryIndex];
  const isOwner = currentUser?.uid && activeStory?.userId === currentUser.uid;

  // Record view if not owner
  useEffect(() => {
    if (isOpen && activeStory && !isOwner && currentUser?.uid) {
      recordStoryView(activeStory.id || activeStory.storyId, currentUser.uid, userProfile);
    }
  }, [isOpen, activeStory?.id, isOwner, currentUser?.uid, userProfile]);

  // Load viewers list when opening viewers modal
  const handleOpenViewsModal = async () => {
    if (!activeStory) return;
    setIsPaused(true);
    setShowViewsModal(true);
    setLoadingViewers(true);
    try {
      const views = await getStoryViews(activeStory.id || activeStory.storyId);
      setViewersList(views);
    } catch (e) {
      console.warn('Failed to load story views:', e);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleNextStory = useCallback(() => {
    setProgress(0);
    if (!activeGroup) return;

    if (currentStoryIndex < activeGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < storyUsers.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }, [activeGroup, currentStoryIndex, currentUserIndex, storyUsers.length, onClose]);

  const handlePrevStory = useCallback(() => {
    setProgress(0);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      const prevGroup = storyUsers[currentUserIndex - 1];
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, storyUsers]);

  // Timer loop for progress bar
  useEffect(() => {
    if (!isOpen || !activeStory || isPaused || showDeleteConfirm || showViewsModal) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    if (activeStory.mediaType === 'video') {
      // Progress is tied to HTML5 video onTimeUpdate
      return;
    }

    const intervalStep = 50;
    const increment = (intervalStep / storyDurationMs) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimerRef.current);
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, activeStory, isPaused, showDeleteConfirm, showViewsModal, handleNextStory]);

  // Video time update handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const currentPct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentPct);
    }
  };

  const handleVideoEnded = () => {
    handleNextStory();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextStory();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNextStory, handlePrevStory, onClose]);

  // Delete story handler
  const handleDeleteStory = async () => {
    if (!activeStory || !isOwner) return;

    try {
      setIsDeleting(true);
      await deleteStory(
        activeStory.id || activeStory.storyId,
        currentUser.uid,
        activeStory.storagePath
      );

      setShowDeleteConfirm(false);
      setIsDeleting(false);

      if (onStoryDeleted) {
        onStoryDeleted(activeStory.id || activeStory.storyId);
      }

      // If user had more stories, go to next or close
      if (activeGroup.stories.length <= 1) {
        if (storyUsers.length <= 1) {
          onClose();
        } else if (currentUserIndex < storyUsers.length - 1) {
          setCurrentUserIndex((prev) => prev + 1);
          setCurrentStoryIndex(0);
        } else {
          onClose();
        }
      } else {
        handleNextStory();
      }
    } catch (err) {
      console.error('Delete story error:', err);
      setIsDeleting(false);
      alert('Could not delete story. Please check your network connection.');
    }
  };

  // Reply message sender
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser?.uid || !activeGroup?.userId) return;

    try {
      const chatId = getDeterministicChatId(currentUser.uid, activeGroup.userId);
      await sendMessage(chatId, {
        senderId: currentUser.uid,
        receiverId: activeGroup.userId,
        message: `Replied to your story: "${replyText.trim()}"`
      });
      setReplyText('');
      setReplySentNotice(true);
      setTimeout(() => setReplySentNotice(false), 2500);
    } catch (err) {
      console.warn('Could not send reply to story:', err);
    }
  };

  if (!isOpen || !activeGroup || !activeStory) return null;

  // Relative time helper
  const getRelativeTime = (timestampMillis) => {
    if (!timestampMillis) return 'Just now';
    const diffHours = Math.floor((Date.now() - timestampMillis) / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor((Date.now() - timestampMillis) / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  };

  const createdTime = activeStory.createdAtMillis ||
    (activeStory.createdAt?.toMillis ? activeStory.createdAt.toMillis() : null);

  return (
    <div className="story-viewer-fullscreen-overlay">
      <div className="story-viewer-stage">
        {/* Top Progress Bars (one segment per story in this user's group) */}
        <div className="story-progress-segments-bar">
          {activeGroup.stories.map((st, idx) => {
            let widthPercent = 0;
            if (idx < currentStoryIndex) widthPercent = 100;
            else if (idx === currentStoryIndex) widthPercent = progress;
            return (
              <div key={st.id || idx} className="story-progress-segment-track">
                <div
                  className="story-progress-segment-fill"
                  style={{ width: `${widthPercent}%` }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Top User Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user-info">
            <img
              src={activeGroup.userProfilePhoto || '/assets/logo-heart.jpg'}
              alt={activeGroup.userDisplayName}
              className="story-viewer-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/logo-heart.jpg';
              }}
            />
            <div className="story-viewer-user-meta">
              <span className="story-viewer-name">
                {isOwner ? 'My Story' : activeGroup.userDisplayName}
              </span>
              <span className="story-viewer-timestamp">
                <Clock size={11} /> {getRelativeTime(createdTime)}
              </span>
            </div>
          </div>

          <div className="story-viewer-header-actions">
            {activeStory.mediaType === 'video' && (
              <button
                type="button"
                className="story-header-action-btn"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            {isOwner && onOpenAddStory && (
              <button
                type="button"
                className="story-header-action-btn"
                onClick={() => {
                  onClose();
                  onOpenAddStory();
                }}
                title="Add another story"
              >
                <Plus size={18} />
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                className="story-header-action-btn delete-btn"
                onClick={() => {
                  setIsPaused(true);
                  setShowDeleteConfirm(true);
                }}
                title="Delete this story"
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              type="button"
              className="story-header-action-btn close-btn"
              onClick={onClose}
              title="Close story"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Story Media Stage with Press-and-Hold to Pause */}
        <div
          className="story-media-container"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {activeStory.mediaType === 'image' ? (
            <img
              src={activeStory.mediaUrl}
              alt="Story"
              className="story-active-media"
            />
          ) : (
            <video
              ref={videoRef}
              src={activeStory.mediaUrl}
              className="story-active-media"
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          )}

          {/* Left / Right Tap zones */}
          <div
            className="story-nav-tap-zone left-zone"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }}
            title="Previous story"
          >
            <span className="story-nav-hint">
              <ChevronLeft size={24} />
            </span>
          </div>

          <div
            className="story-nav-tap-zone right-zone"
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }}
            title="Next story"
          >
            <span className="story-nav-hint">
              <ChevronRight size={24} />
            </span>
          </div>
        </div>

        {/* Bottom Bar: Owner View Tracking OR Other User Reply Box */}
        <div className="story-viewer-bottom-bar">
          {isOwner ? (
            <div className="story-owner-controls-bar">
              <button
                type="button"
                className="story-view-count-pill"
                onClick={handleOpenViewsModal}
              >
                <Eye size={16} />
                <span>
                  {activeStory.viewCount || 0}{' '}
                  {(activeStory.viewCount || 0) === 1 ? 'view' : 'views'}
                </span>
              </button>
            </div>
          ) : (
            <form className="story-reply-form" onSubmit={handleSendReply}>
              <input
                type="text"
                placeholder={`Reply to ${activeGroup.userDisplayName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                className="story-reply-input"
              />
              <button
                type="submit"
                className="story-reply-send-btn"
                disabled={!replyText.trim()}
              >
                <Send size={16} />
              </button>
              {replySentNotice && (
                <div className="story-reply-sent-toast animate-fade-in">
                  Reply sent!
                </div>
              )}
            </form>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="story-confirm-modal-overlay"
            onClick={() => {
              setShowDeleteConfirm(false);
              setIsPaused(false);
            }}
          >
            <div
              className="story-confirm-modal-box animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-box">
                <AlertTriangle size={32} color="#E91E63" />
              </div>
              <h4>Delete this story?</h4>
              <p>This story will be permanently removed for everyone.</p>
              <div className="confirm-buttons-row">
                <button
                  type="button"
                  className="confirm-btn-cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIsPaused(false);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-btn-delete"
                  onClick={handleDeleteStory}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Views Sheet / Modal for Story Owner */}
        {showViewsModal && (
          <div
            className="story-views-modal-overlay"
            onClick={() => {
              setShowViewsModal(false);
              setIsPaused(false);
            }}
          >
            <div
              className="story-views-sheet animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="story-views-sheet-header">
                <h4>
                  <Eye size={18} /> Viewed by ({viewersList.length})
                </h4>
                <button
                  type="button"
                  className="sheet-close-btn"
                  onClick={() => {
                    setShowViewsModal(false);
                    setIsPaused(false);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="story-views-sheet-list">
                {loadingViewers ? (
                  <div className="sheet-loading">Loading viewers...</div>
                ) : viewersList.length === 0 ? (
                  <div className="sheet-empty">No one has viewed this story yet.</div>
                ) : (
                  viewersList.map((vw) => (
                    <div key={vw.viewerUid || vw.id} className="viewer-list-item">
                      <img
                        src={vw.viewerProfilePhoto || '/assets/logo-heart.jpg'}
                        alt={vw.viewerDisplayName}
                        className="viewer-item-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/logo-heart.jpg';
                        }}
                      />
                      <div className="viewer-item-meta">
                        <span className="viewer-item-name">{vw.viewerDisplayName}</span>
                        <span className="viewer-item-time">
                          {getRelativeTime(vw.viewedAtMillis)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
