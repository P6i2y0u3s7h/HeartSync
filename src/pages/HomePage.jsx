import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import StoryAvatar from '../components/StoryAvatar';
import AddStoryModal from '../components/AddStoryModal';
import StoryViewer from '../components/StoryViewer';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../hooks/useStories';
import { useFeedPosts } from '../hooks/usePosts';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const [addStoryModalOpen, setAddStoryModalOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryUserIndex, setSelectedStoryUserIndex] = useState(0);

  const { currentUser, userProfile } = useAuth();
  // Stories (separate from Now Active)
  const { myStories, otherUsersWithStories, loading: storiesLoading } = useStories(currentUser);

  // Community Photo & Video Feed
  const {
    posts,
    loading: postsLoading,
    handleCreatePost,
    handleToggleLike,
    handleToggleSave,
    handleDeletePost,
    handleEditCaption
  } = useFeedPosts(currentUser);

  const navigate = useNavigate();

  // Combine own stories and others into unified list for sequential viewing
  const allStoryGroups = useMemo(() => {
    const groups = [];
    if (myStories && myStories.length > 0) {
      groups.push({
        userId: currentUser?.uid,
        userDisplayName: userProfile?.firstName || userProfile?.displayName || 'My Story',
        userProfilePhoto: userProfile?.profilePhoto || currentUser?.photoURL,
        stories: myStories
      });
    }
    if (otherUsersWithStories && otherUsersWithStories.length > 0) {
      groups.push(...otherUsersWithStories);
    }
    return groups;
  }, [myStories, otherUsersWithStories, currentUser, userProfile]);

  const handleOpenMyStory = () => {
    if (myStories && myStories.length > 0) {
      setSelectedStoryUserIndex(0);
      setStoryViewerOpen(true);
    } else {
      setAddStoryModalOpen(true);
    }
  };

  const handleOpenOtherStory = (userGroup, otherIdx) => {
    const targetIndex = myStories && myStories.length > 0 ? otherIdx + 1 : otherIdx;
    setSelectedStoryUserIndex(targetIndex);
    setStoryViewerOpen(true);
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />

      {/* Header: HeartSync logo on left, Notifications + Profile avatar on right (NO + button) */}
      <Header />

      <main className="main-content-scrollable home-content-layout">
        {/* 1. Stories Section: My Story + Other Users' Active Stories */}
        <section className="stories-section" aria-label="Stories">
          <div className="stories-horizontal-scroll">
            <StoryAvatar
              isAddStory={true}
              hasStory={myStories && myStories.length > 0}
              userProfile={userProfile}
              onAddStory={() => setAddStoryModalOpen(true)}
              onViewStory={handleOpenMyStory}
            />

            {otherUsersWithStories.map((group, idx) => (
              <StoryAvatar
                key={group.userId}
                storyUser={group}
                hasStory={true}
                onViewStory={() => handleOpenOtherStory(group, idx)}
              />
            ))}
          </div>
        </section>

        {/* 2. Instagram-Style Photo & Video Feed */}
        <section className="home-photo-feed-section" aria-label="Social Feed">
          {postsLoading ? (
            <div className="feed-loading-container">
              <LoadingSpinner text="Loading feed..." />
            </div>
          ) : posts.length > 0 ? (
            <div className="feed-stream-container">
              {posts.map((post) => (
                <PostCard
                  key={post.id || post.postId}
                  post={post}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                  onDeletePost={handleDeletePost}
                  onEditCaption={handleEditCaption}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              type="feed"
              title="No posts yet!"
              message="When users share photos and videos, they will appear here in your feed."
              actionText="Create a Post"
              onAction={() => setCreatePostModalOpen(true)}
            />
          )}
        </section>
      </main>

      {/* Modals */}
      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onCreatePost={handleCreatePost}
      />

      <AddStoryModal
        isOpen={addStoryModalOpen}
        onClose={() => setAddStoryModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
      />

      <StoryViewer
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
        initialUserIndex={selectedStoryUserIndex}
        storyUsers={allStoryGroups}
        currentUser={currentUser}
        userProfile={userProfile}
        onOpenAddStory={() => setAddStoryModalOpen(true)}
      />

      <BottomNavigation />
    </div>
  );
};

export default HomePage;
