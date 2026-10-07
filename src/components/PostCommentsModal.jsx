import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageCircle, Loader2 } from 'lucide-react';
import {
  subscribeToPostComments,
  addPostComment,
  deletePostComment,
  formatRelativeTime
} from '../services/postService';
import { extractDisplayName, extractProfilePhoto } from '../hooks/useOnlineUsers';

export const PostCommentsModal = ({
  isOpen,
  onClose,
  post,
  currentUser,
  userProfile
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  const postId = post?.id || post?.postId;

  useEffect(() => {
    if (!isOpen || !postId) return;

    setLoading(true);
    const unsubscribe = subscribeToPostComments(postId, (fetchedComments) => {
      setComments(fetchedComments);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting || !currentUser?.uid) return;

    setSubmitting(true);
    setErrorMsg('');
    const textToSend = commentText.trim();
    setCommentText('');

    try {
      await addPostComment(postId, {
        userId: currentUser.uid,
        userDisplayName: extractDisplayName(userProfile || currentUser),
        userProfilePhoto: extractProfilePhoto(userProfile || currentUser),
        text: textToSend
      });
      // Scroll to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error adding comment:', err);
      setErrorMsg('Failed to post comment. Please try again.');
      setCommentText(textToSend); // restore on error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!postId || !commentId) return;
    try {
      await deletePostComment(postId, commentId);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (!isOpen || !post) return null;

  const currentUid = currentUser?.uid;
  const isPostOwner = post.userId === currentUid;

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="post-comments-sheet animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="comments-sheet-title"
      >
        {/* Header */}
        <div className="post-comments-header">
          <div className="post-comments-header-title-wrap">
            <MessageCircle size={19} color="#C2185B" />
            <h3 id="comments-sheet-title" className="post-comments-title">
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </h3>
          </div>
          <button
            type="button"
            className="post-comments-close-btn"
            onClick={onClose}
            aria-label="Close comments"
          >
            <X size={20} />
          </button>
        </div>

        {/* Post Caption Summary */}
        {post.caption && (
          <div className="post-comments-caption-summary">
            <img
              src={extractProfilePhoto(post)}
              alt={extractDisplayName(post)}
              className="comment-author-photo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/logo-heart.jpg';
              }}
            />
            <div className="comment-text-box">
              <span className="comment-author-name">{extractDisplayName(post)}</span>
              <p className="comment-text">{post.caption}</p>
              <span className="comment-time">{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="post-comments-list-wrap">
          {loading ? (
            <div className="post-comments-loading">
              <Loader2 size={24} className="spinner-rotate" color="#C2185B" />
              <span>Loading comments...</span>
            </div>
          ) : comments.length > 0 ? (
            <div className="post-comments-list">
              {comments.map((c) => {
                const commentId = c.id || c.commentId;
                const isAuthor = c.userId === currentUid;
                const canDelete = isAuthor || isPostOwner;
                const authorName = extractDisplayName(c);
                const authorPhoto = extractProfilePhoto(c);

                return (
                  <div key={commentId} className="comment-item-row animate-fade-in">
                    <img
                      src={authorPhoto}
                      alt={authorName}
                      className="comment-author-photo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/logo-heart.jpg';
                      }}
                    />
                    <div className="comment-text-box">
                      <div className="comment-top-meta">
                        <span className="comment-author-name">{authorName}</span>
                        <span className="comment-time">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(commentId)}
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <div className="post-comments-empty">
              <MessageCircle size={32} color="#E91E63" />
              <p className="comments-empty-title">No comments yet</p>
              <p className="comments-empty-subtitle">
                Be the first to share your thoughts!
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="post-comments-error animate-fade-in">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleAddComment} className="post-comments-input-bar">
          <img
            src={extractProfilePhoto(userProfile || currentUser)}
            alt="You"
            className="comment-my-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/logo-heart.jpg';
            }}
          />
          <input
            ref={inputRef}
            type="text"
            className="post-comment-input-field"
            placeholder="Add a comment for this post..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={300}
            disabled={submitting}
          />
          <button
            type="submit"
            className="post-comment-send-btn"
            disabled={!commentText.trim() || submitting}
            aria-label="Send comment"
          >
            {submitting ? (
              <Loader2 size={16} className="spinner-rotate" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCommentsModal;
