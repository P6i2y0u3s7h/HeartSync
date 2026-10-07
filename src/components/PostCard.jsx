import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
  Edit2,
  Trash2,
  ShieldAlert,
  Lock,
  Share2,
  Loader2,
  Play
} from 'lucide-react';
import { formatRelativeTime } from '../services/postService';
import { extractDisplayName, extractProfilePhoto } from '../hooks/useOnlineUsers';
import PostCommentsModal from './PostCommentsModal';
import EditPostCaptionModal from './EditPostCaptionModal';
import SharePostModal from './SharePostModal';
import ReportPostModal from './ReportPostModal';
import { addPostComment } from '../services/postService';

export const PostCard = ({
  post,
  currentUser,
  userProfile,
  onToggleLike,
  onToggleSave,
  onDeletePost,
  onEditCaption
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Double-tap heart animation state
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef(0);
  const videoRef = useRef(null);

  // Quick inline comment state
  const [quickComment, setQuickComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isExpandedCaption, setIsExpandedCaption] = useState(false);

  const postId = post?.id || post?.postId;
  const currentUid = currentUser?.uid;
  const isOwner = post.userId === currentUid;

  const likedBy = post.likedBy || [];
  const isLiked = currentUid ? likedBy.includes(currentUid) : false;
  const savedBy = post.savedBy || [];
  const isSaved = currentUid ? savedBy.includes(currentUid) : false;

  const likesCount = post.likesCount || 0;
  const commentsCount = post.commentsCount || 0;

  const authorName = extractDisplayName(post);
  const authorPhoto = extractProfilePhoto(post);

  const mediaUrl = post.mediaUrl || post.imageUrl || '';
  const isVideo =
    post.mediaType === 'video' ||
    /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(mediaUrl) ||
    mediaUrl.startsWith('blob:video') ||
    mediaUrl.startsWith('data:video');

  // Double tap handler on photo
  const handlePhotoClick = () => {
    if (isVideo) return; // For videos let controls/playback handle clicks
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger like if not already liked
      if (!isLiked && onToggleLike) {
        onToggleLike(postId, false);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (!currentUid || !onToggleLike) return;
    onToggleLike(postId, isLiked);
  };

  const handleSaveClick = (e) => {
    if (e) e.stopPropagation();
    if (!currentUid || !onToggleSave) return;
    onToggleSave(postId, isSaved, post);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (onDeletePost) {
        await onDeletePost(postId, post.storagePath);
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickCommentSubmit = async (e) => {
    e.preventDefault();
    if (!quickComment.trim() || !currentUid || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const textToSend = quickComment.trim();
    setQuickComment('');

    try {
      await addPostComment(postId, {
        userId: currentUid,
        userDisplayName: extractDisplayName(userProfile || currentUser),
        userProfilePhoto: extractProfilePhoto(userProfile || currentUser),
        text: textToSend
      });
    } catch (err) {
      console.error('Failed to add quick comment:', err);
      setQuickComment(textToSend);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAuthorClick = () => {
    if (post.userId) {
      navigate(`/profile/${post.userId}`);
    }
  };

  const captionText = post.caption || '';
  const shouldTruncateCaption = captionText.length > 100;
  const displayedCaption =
    shouldTruncateCaption && !isExpandedCaption
      ? captionText.slice(0, 100) + '...'
      : captionText;

  return (
    <article className="post-card-container animate-fade-in" id={`post-${postId}`}>
      {/* 1. Header: Author info & Menu */}
      <header className="post-card-header">
        <div
          className="post-author-info"
          onClick={handleAuthorClick}
          role="button"
          tabIndex={0}
          title={`View ${authorName}'s profile`}
        >
          <div className="post-author-avatar-wrap">
            <img
              src={authorPhoto}
              alt={authorName}
              className="post-author-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/logo-heart.jpg';
              }}
            />
          </div>

          <div className="post-author-text-meta">
            <div className="post-author-name-row">
              <span className="post-author-name">{authorName}</span>
              {post.privacy === 'matches' && (
                <span className="post-privacy-badge" title="Visible to matches only">
                  <Lock size={11} />
                  <span>Matches</span>
                </span>
              )}
            </div>
            <span className="post-time-ago">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        {/* 3-Dots Menu */}
        <div className="post-menu-container">
          <button
            type="button"
            className="post-menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Post actions"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <>
              <div
                className="post-menu-backdrop"
                onClick={() => setMenuOpen(false)}
              />
              <div className="post-menu-dropdown animate-fade-in">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditModalOpen(true);
                      }}
                    >
                      <Edit2 size={15} />
                      <span>Edit Caption</span>
                    </button>

                    <button
                      type="button"
                      className="post-menu-item delete"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 size={15} />
                      <span>Delete Post</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        handleSaveClick();
                      }}
                    >
                      <Bookmark
                        size={15}
                        fill={isSaved ? '#E91E63' : 'none'}
                        color={isSaved ? '#E91E63' : '#333333'}
                      />
                      <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="post-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setShareModalOpen(true);
                  }}
                >
                  <Share2 size={15} />
                  <span>Share to Chat</span>
                </button>

                {!isOwner && (
                  <button
                    type="button"
                    className="post-menu-item danger"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportModalOpen(true);
                    }}
                  >
                    <ShieldAlert size={15} />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. Media Stage (Photo or Video) */}
      <div className="post-photo-stage" onClick={handlePhotoClick}>
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="post-main-video"
            controls
            playsInline
            preload="metadata"
            onError={(e) => {
              console.warn('Video failed to load:', e);
            }}
          />
        ) : (
          <img
            src={mediaUrl || '/assets/logo-heart.jpg'}
            alt={post.caption || `${authorName}'s photo`}
            className="post-main-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/logo-heart.jpg';
            }}
          />
        )}

        {/* Double-Tap Heart Animation */}
        {!isVideo && showHeartPop && (
          <div className="post-double-tap-heart-anim">
            <Heart size={82} fill="#ffffff" color="#ffffff" />
          </div>
        )}
      </div>

      {/* 3. Action Bar: Like, Comment, Share, Bookmark */}
      <div className="post-action-bar">
        <div className="post-actions-left">
          {/* Like Button */}
          <button
            type="button"
            className={`post-action-icon-btn like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
          >
            <Heart
              size={23}
              fill={isLiked ? '#E91E63' : 'none'}
              color={isLiked ? '#E91E63' : '#212121'}
              className={isLiked ? 'heart-liked-pop' : ''}
            />
            {likesCount > 0 && <span className="action-count">{likesCount}</span>}
          </button>

          {/* Comment Button */}
          <button
            type="button"
            className="post-action-icon-btn"
            onClick={() => setCommentsModalOpen(true)}
            aria-label="View comments"
          >
            <MessageCircle size={22} color="#212121" />
            {commentsCount > 0 && (
              <span className="action-count">{commentsCount}</span>
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            className="post-action-icon-btn"
            onClick={() => setShareModalOpen(true)}
            aria-label="Share post"
          >
            <Send size={21} color="#212121" />
          </button>
        </div>

        {/* Bookmark / Save Button */}
        <div className="post-actions-right">
          <button
            type="button"
            className="post-action-icon-btn save-btn"
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
            title={isSaved ? 'Saved' : 'Save post'}
          >
            <Bookmark
              size={22}
              fill={isSaved ? '#E91E63' : 'none'}
              color={isSaved ? '#E91E63' : '#212121'}
            />
          </button>
        </div>
      </div>

      {/* 4. Likes count line if > 0 */}
      {likesCount > 0 && (
        <div className="post-likes-summary">
          <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
        </div>
      )}

      {/* 5. Caption */}
      {captionText && (
        <div className="post-caption-block">
          <span
            className="post-caption-author"
            onClick={handleAuthorClick}
            role="button"
            tabIndex={0}
          >
            {authorName}
          </span>
          <span className="post-caption-text"> {displayedCaption}</span>
          {shouldTruncateCaption && (
            <button
              type="button"
              className="post-caption-more-btn"
              onClick={() => setIsExpandedCaption((prev) => !prev)}
            >
              {isExpandedCaption ? ' less' : ' more'}
            </button>
          )}
        </div>
      )}

      {/* 6. Comments Summary Button */}
      {commentsCount > 0 && (
        <button
          type="button"
          className="post-view-comments-btn"
          onClick={() => setCommentsModalOpen(true)}
        >
          View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      {/* 7. Quick inline comment */}
      <form onSubmit={handleQuickCommentSubmit} className="post-quick-comment-form">
        <input
          type="text"
          className="post-quick-comment-input"
          placeholder="Add a comment..."
          value={quickComment}
          onChange={(e) => setQuickComment(e.target.value)}
          maxLength={200}
        />
        {quickComment.trim() && (
          <button
            type="submit"
            className="post-quick-comment-submit"
            disabled={isSubmittingComment}
          >
            {isSubmittingComment ? (
              <Loader2 size={14} className="spinner-rotate" />
            ) : (
              'Post'
            )}
          </button>
        )}
      </form>

      {/* 8. Modals */}
      <PostCommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        post={post}
        currentUser={currentUser}
        userProfile={userProfile}
      />

      <EditPostCaptionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        post={post}
        onSaveCaption={onEditCaption}
      />

      <SharePostModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        post={post}
        currentUser={currentUser}
      />

      <ReportPostModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        post={post}
        currentUser={currentUser}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="hs-modal-backdrop animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="delete-confirm-dialog animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
          >
            <h3 className="delete-dialog-title">Delete this post?</h3>
            <p className="delete-dialog-desc">
              This action cannot be undone. Your photo and comments will be permanently removed.
            </p>
            <div className="delete-dialog-actions">
              <button
                type="button"
                className="delete-dialog-cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-dialog-confirm-btn"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
