import React, { useState } from 'react';
import { Camera, Heart, MessageCircle, Plus, Play } from 'lucide-react';
import PostDetailModal from './PostDetailModal';

export const ProfilePostsGrid = ({
  posts = [],
  loading = false,
  isOwnProfile = false,
  onOpenCreatePost,
  currentUser,
  userProfile,
  onToggleLike,
  onToggleSave,
  onDeletePost,
  onEditCaption
}) => {
  const [selectedPost, setSelectedPost] = useState(null);

  if (loading) {
    return (
      <div className="profile-posts-grid-loading">
        <div className="profile-posts-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="profile-post-thumb-skeleton shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <>
      <div className="profile-posts-grid-container">
        <div className="profile-posts-grid">
          {posts.map((post) => {
            const postId = post.id || post.postId;
            const likes = post.likesCount || 0;
            const comments = post.commentsCount || 0;
            const thumbUrl = post.mediaUrl || post.imageUrl || '/assets/logo-heart.jpg';
            const isVideo =
              post.mediaType === 'video' ||
              /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(thumbUrl) ||
              thumbUrl.startsWith('blob:video') ||
              thumbUrl.startsWith('data:video');

            return (
              <div
                key={postId}
                className="profile-post-thumb-item"
                onClick={() => setSelectedPost(post)}
                role="button"
                tabIndex={0}
                title={post.caption || 'View post'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedPost(post);
                }}
              >
                {isVideo ? (
                  <video
                    src={thumbUrl}
                    className="profile-post-thumb-img"
                    preload="metadata"
                    muted
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={thumbUrl}
                    alt={post.caption || 'Post thumbnail'}
                    className="profile-post-thumb-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/logo-heart.jpg';
                    }}
                  />
                )}

                {/* Video play badge */}
                {isVideo && (
                  <div className="profile-post-thumb-video-badge" aria-hidden="true">
                    <Play size={9} fill="#fff" />
                  </div>
                )}

                {/* Hover overlay with like & comment counts */}
                <div className="profile-post-thumb-overlay">
                  <span className="overlay-stat">
                    <Heart size={14} fill="#ffffff" color="#ffffff" />
                    <span>{likes}</span>
                  </span>
                  <span className="overlay-stat">
                    <MessageCircle size={14} fill="#ffffff" color="#ffffff" />
                    <span>{comments}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          isOpen={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
          currentUser={currentUser}
          userProfile={userProfile}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          onDeletePost={async (id, storagePath) => {
            if (onDeletePost) await onDeletePost(id, storagePath);
            setSelectedPost(null);
          }}
          onEditCaption={onEditCaption}
        />
      )}
    </>
  );
};

export default ProfilePostsGrid;

