import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Camera,
  Image as ImageIcon,
  AudioWaveform,
  MoreVertical,
  Phone,
  Video,
  User,
  UserX,
  ShieldAlert,
  HeartOff,
  Search,
  Star,
  Timer,
  ListPlus,
  Eraser,
  Trash2,
  XCircle,
  X,
  Copy,
  ChevronUp,
  ChevronDown,
  CheckSquare
} from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import ReportModal from '../components/ReportModal';
import DeleteMessageModal from '../components/DeleteMessageModal';
import DisappearingMessagesModal, { DISAPPEARING_OPTIONS } from '../components/DisappearingMessagesModal';
import UserListModal from '../components/UserListModal';
import StarredMessagesModal from '../components/StarredMessagesModal';
import CameraModal from '../components/CameraModal';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import {
  extractOtherUid,
  markChatAsRead,
  clearChat,
  deleteChat,
  setDisappearingMessages,
  subscribeToChatDoc
} from '../services/chatService';
import { setTypingStatus, subscribeToTypingStatus } from '../services/messageService';
import { blockUser, unblockUser, subscribeToBlockedUsers } from '../services/blockService';
import { unmatchUsers } from '../services/matchService';
import { initialProfiles } from '../data/seedData';

const QUICK_EMOJIS = ['❤️', '😍', '✨', '🔥', '😘', '😊', '🍕', '☕', '🥂', '🎉'];

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chatSettings, setChatSettings] = useState(null);

  // Search in chat state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [selectionFeedback, setSelectionFeedback] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Active message id for action toolbar (lifted from ChatBubble to prevent hover-dismiss)
  const [activeMessageId, setActiveMessageId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  // Modals state
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Close menu, search, selection, or active bubble action when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showMenu) {
          setShowMenu(false);
        } else if (activeMessageId) {
          setActiveMessageId(null);
        } else if (isSearching) {
          setIsSearching(false);
          setSearchQuery('');
        } else if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedMessageIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMenu, activeMessageId, isSearching, isSelectionMode]);

  // Dismiss active message action toolbar when clicking outside the active bubble
  useEffect(() => {
    if (!activeMessageId) return;
    const handleOutsideClick = (e) => {
      if (e.target.closest(`#msg-${activeMessageId}`)) return;
      if (e.target.closest('.confirm-modal-card') || e.target.closest('.chat-dropdown-menu')) return;
      setActiveMessageId(null);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 20);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeMessageId]);

  // Extract other user id from chatId using robust helper
  const otherUid = extractOtherUid(chatId, currentUser?.uid);

  const {
    messages,
    loading,
    sending,
    sendTextMessage,
    sendEmojiMessage,
    sendImageAttachment,
    deleteForMe,
    deleteForEveryone,
    deleteMultiple,
    toggleStar,
    reactToMessageById
  } = useMessages(chatId, otherUid);

  useEffect(() => {
    // Resolve other user profile
    const fetchOther = async () => {
      if (!otherUid) return;
      const seed = initialProfiles.find(
        p => p.uid === otherUid || p.username === otherUid || p.uid.includes(otherUid) || p.firstName?.toLowerCase() === otherUid?.toLowerCase()
      );
      if (seed) {
        setOtherUser(seed);
        return;
      }
      try {
        const prof = await getUserProfile(otherUid);
        if (prof) {
          setOtherUser(prof);
          return;
        }
      } catch (e) {
        console.warn('Error fetching other user:', e);
      }
      setOtherUser({
        uid: otherUid,
        displayName: 'HeartSync Member',
        firstName: 'Member',
        profilePhoto: '/assets/logo-heart.jpg'
      });
    };

    fetchOther();
  }, [otherUid]);

  // Subscribe to real-time chat document (disappearing duration, clearedAt, etc.)
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToChatDoc(chatId, (data) => {
      setChatSettings(data);
    });
    return () => unsub();
  }, [chatId]);

  // Subscribe to real-time typing status
  useEffect(() => {
    if (!chatId || !currentUser?.uid) return;
    const unsubscribe = subscribeToTypingStatus(chatId, currentUser.uid, (typing) => {
      setIsOtherTyping(typing);
    });
    return () => unsubscribe();
  }, [chatId, currentUser?.uid]);

  // Subscribe to blocked users to enforce chat safety
  useEffect(() => {
    if (!currentUser?.uid || !otherUid) return;
    const unsub = subscribeToBlockedUsers(currentUser.uid, (list) => {
      const blocked = list.some(b => b.blockedId === otherUid);
      setIsBlocked(blocked);
    });
    return () => unsub();
  }, [currentUser?.uid, otherUid]);

  const handleUnblock = async () => {
    if (!currentUser?.uid || !otherUid) return;
    try {
      await unblockUser(currentUser.uid, otherUid);
      setIsBlocked(false);
    } catch (e) {
      console.error('Error unblocking user:', e);
    }
  };

  // Mark chat as read when opened or new messages arrive
  useEffect(() => {
    if (chatId && currentUser?.uid) {
      markChatAsRead(chatId, currentUser.uid);
    }
  }, [chatId, currentUser?.uid, messages.length]);

  // Scroll to bottom when new messages arrive (only if not searching)
  useEffect(() => {
    if (!isSearching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherTyping, isSearching]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (chatId && currentUser?.uid) {
      setTypingStatus(chatId, currentUser.uid, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(chatId, currentUser.uid, false);
      }, 2500);
    }
  };

  // Dynamic viewport listener for mobile keyboards & dynamic browser toolbars
  useEffect(() => {
    const updateViewportHeight = () => {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--chat-vh', `${height}px`);
      if (!isSearching) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
      document.documentElement.style.removeProperty('--chat-vh');
    };
  }, [isSearching]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;

    if (chatId && currentUser?.uid) {
      setTypingStatus(chatId, currentUser.uid, false);
    }

    sendTextMessage(inputVal);
    setInputVal('');
    setShowEmojiPicker(false);
  };

  const handleSelectEmoji = (emoji) => {
    sendEmojiMessage(emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      sendImageAttachment(file);
    }
  };

  // Search Results Calculation
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.message && m.message.toLowerCase().includes(q) && !m.isDeletedForEveryone);
  }, [messages, searchQuery]);

  const scrollToMessageId = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('search-highlight-pulse');
      setTimeout(() => el.classList.remove('search-highlight-pulse'), 1800);
    }
  };

  // Helper to highlight matching text in search results
  const highlightMatch = (text, queryStr) => {
    if (!queryStr?.trim() || !text) return text;
    const safeQuery = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight-text">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveSearchIndex(0);
    if (val.trim()) {
      const q = val.toLowerCase();
      const firstMatch = messages.find(
        m => m.message && m.message.toLowerCase().includes(q) && !m.isDeletedForEveryone
      );
      if (firstMatch) {
        scrollToMessageId(firstMatch.id);
      }
    }
  };

  const handleNavigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    let nextIdx = activeSearchIndex + direction;
    if (nextIdx < 0) nextIdx = searchResults.length - 1;
    if (nextIdx >= searchResults.length) nextIdx = 0;
    setActiveSearchIndex(nextIdx);
    scrollToMessageId(searchResults[nextIdx].id);
  };

  // Selection handlers
  const handleStartSelection = (messageId) => {
    setActiveMessageId(null); // dismiss toolbar when entering selection mode
    setIsSelectionMode(true);
    setSelectedMessageIds([messageId]);
  };

  const handleToggleSelectMessage = (messageId) => {
    setSelectedMessageIds(prev =>
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    );
  };

  const handleExitSelection = () => {
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const handleCopySelected = () => {
    const selectedTexts = messages
      .filter(m => selectedMessageIds.includes(m.id) && m.message && !m.isDeletedForEveryone)
      .map(m => m.message)
      .join('\n');
    if (selectedTexts) {
      navigator.clipboard.writeText(selectedTexts);
      setSelectionFeedback('Copied!');
      showToast('Message copied');
      setTimeout(() => setSelectionFeedback(''), 1800);
    }
  };

  const handleStarSelected = async () => {
    for (const id of selectedMessageIds) {
      await toggleStar(id);
    }
    setSelectionFeedback('Starred!');
    showToast('Starred!');
    setTimeout(() => setSelectionFeedback(''), 1800);
  };

  const handleDeleteSelected = () => {
    // Open Delete dialog for selected messages
    const selectedObjs = messages.filter(m => selectedMessageIds.includes(m.id));
    if (selectedObjs.length === 0) return;
    const allOwn = selectedObjs.every(m => m.senderId === currentUser?.uid || m.senderId === 'current_user');
    setDeleteTargetMessage({
      isBulk: true,
      ids: selectedMessageIds,
      isOwn: allOwn
    });
  };

  // Delete message modal handlers
  const handleConfirmDeleteForMe = async () => {
    if (!deleteTargetMessage) return;
    if (deleteTargetMessage.isBulk) {
      await deleteMultiple(deleteTargetMessage.ids, 'forMe');
      handleExitSelection();
    } else {
      await deleteForMe(deleteTargetMessage.id);
    }
    setDeleteTargetMessage(null);
  };

  const handleConfirmDeleteForEveryone = async () => {
    if (!deleteTargetMessage) return;
    if (deleteTargetMessage.isBulk) {
      await deleteMultiple(deleteTargetMessage.ids, 'forEveryone');
      handleExitSelection();
    } else {
      await deleteForEveryone(deleteTargetMessage.id);
    }
    setDeleteTargetMessage(null);
  };

  // Clear Chat confirmation handler
  const handleConfirmClearChat = async () => {
    if (!chatId || !currentUser?.uid) return;
    setActionLoading(true);
    try {
      await clearChat(chatId, currentUser.uid);
      setShowClearChatModal(false);
    } catch (err) {
      console.error('Error clearing chat:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Chat confirmation handler
  const handleConfirmDeleteChat = async () => {
    if (!chatId || !currentUser?.uid) return;
    setActionLoading(true);
    try {
      await deleteChat(chatId, currentUser.uid);
      setShowDeleteChatModal(false);
      navigate('/chats');
    } catch (err) {
      console.error('Error deleting chat:', err);
      showToast('Failed to delete chat. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Unmatch confirmation handler
  const handleConfirmUnmatch = async () => {
    if (!currentUser?.uid || !otherUid) return;
    setActionLoading(true);
    try {
      await unmatchUsers(currentUser.uid, otherUid);
      setShowUnmatchModal(false);
      navigate('/matches');
    } catch (err) {
      console.error('Error unmatching:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Block confirmation handler
  const handleConfirmBlock = async () => {
    if (!currentUser?.uid || !otherUid) return;
    setActionLoading(true);
    try {
      await blockUser(currentUser.uid, otherUid, otherUser);
      setShowBlockModal(false);
      navigate('/chats');
    } catch (err) {
      console.error('Error blocking user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectDisappearingDuration = async (seconds) => {
    try {
      await setDisappearingMessages(chatId, seconds, currentUser?.uid);
    } catch (err) {
      console.error('Error saving disappearing duration:', err);
    }
  };

  const otherUserName = otherUser?.firstName || (otherUser?.displayName ? otherUser.displayName.split(' ')[0] : 'Member');
  const otherUserPhoto = otherUser?.profilePhoto || otherUser?.image || '/assets/logo-heart.jpg';
  const currentUserPhoto = (userProfile?.profilePhoto && userProfile.profilePhoto !== '/assets/logo-heart.jpg')
    ? userProfile.profilePhoto
    : '/assets/profile-user.jpg';

  const currentDisappearingSec = chatSettings?.disappearingDuration || 0;
  const currentDisappearingOpt = DISAPPEARING_OPTIONS.find(o => o.seconds === currentDisappearingSec) || DISAPPEARING_OPTIONS[0];

  const starredMessages = useMemo(() => {
    if (!currentUser?.uid) return [];
    return messages.filter(m => m.starredBy?.[currentUser.uid] === true && !m.isDeletedForEveryone);
  }, [messages, currentUser?.uid]);

  return (
    <div className="chat-screen-page" onClick={() => setShowMenu(false)}>
      {/* Soft Cloud-Heart background overlay */}
      <div className="chat-bg-cloud-overlay" aria-hidden="true" />

      {/* 1. CHAT HEADER - TRANSFORMS DYNAMICALLY */}
      {isSelectionMode ? (
        /* SELECTION HEADER MODE */
        <header className="chat-screen-header chat-header-selection-mode animate-fade-in">
          <div className="chat-selection-header-left">
            <button
              id="btn-cancel-selection"
              type="button"
              className="chat-back-btn"
              onClick={handleExitSelection}
              aria-label="Cancel selection"
              title="Cancel selection"
            >
              <X size={22} color="#ffffff" strokeWidth={2.5} />
            </button>
            <span className="chat-header-selection-count">
              {selectedMessageIds.length} selected
            </span>
            {selectionFeedback && (
              <span className="selection-feedback-badge animate-pop-in">
                {selectionFeedback}
              </span>
            )}
          </div>

          <div className="chat-selection-header-actions">
            <button
              id="btn-selection-copy"
              type="button"
              className="chat-header-action-btn"
              disabled={selectedMessageIds.length === 0}
              onClick={handleCopySelected}
              title="Copy"
              aria-label="Copy selected messages"
            >
              <Copy size={20} color="#ffffff" />
            </button>
            <button
              id="btn-selection-star"
              type="button"
              className="chat-header-action-btn"
              disabled={selectedMessageIds.length === 0}
              onClick={handleStarSelected}
              title="Star"
              aria-label="Star selected messages"
            >
              <Star size={20} color="#ffffff" />
            </button>
            <button
              id="btn-selection-delete"
              type="button"
              className="chat-header-action-btn text-danger-btn"
              disabled={selectedMessageIds.length === 0}
              onClick={handleDeleteSelected}
              title="Delete"
              aria-label="Delete selected messages"
            >
              <Trash2 size={20} color="#ffffff" />
            </button>
          </div>
        </header>
      ) : isSearching ? (
        /* WHATSAPP-STYLE SEARCH HEADER MODE */
        <header className="chat-screen-header chat-header-search-mode animate-fade-in">
          <button
            id="btn-close-search"
            type="button"
            className="chat-back-btn"
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            aria-label="Exit search"
            title="Exit search"
          >
            <ArrowLeft size={22} color="#ffffff" strokeWidth={2.5} />
          </button>

          <div className="chat-header-search-input-wrap">
            <Search size={17} className="chat-header-search-icon" />
            <input
              id="chat-search-input"
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="chat-header-search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="chat-header-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="chat-header-search-nav-group">
            {searchQuery.trim() && (
              <span className="chat-header-search-tally">
                {searchResults.length > 0
                  ? `${activeSearchIndex + 1} of ${searchResults.length}`
                  : '0 found'}
              </span>
            )}
            {searchResults.length > 0 && (
              <div className="chat-header-search-arrows">
                <button
                  type="button"
                  className="chat-header-search-arrow-btn"
                  onClick={() => handleNavigateSearch(-1)}
                  title="Previous result"
                  aria-label="Previous result"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  className="chat-header-search-arrow-btn"
                  onClick={() => handleNavigateSearch(1)}
                  title="Next result"
                  aria-label="Next result"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            )}
          </div>
        </header>
      ) : (
        /* NORMAL CHAT HEADER */
        <header className="chat-screen-header animate-fade-in">
          <div className="chat-header-left-group">
            <button
              id="btn-chat-back"
              className="chat-back-btn"
              onClick={() => navigate('/chats')}
              aria-label="Back to conversations"
            >
              <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
            </button>

            <div
              className="chat-header-profile"
              onClick={() => navigate(`/profile/${otherUser?.uid || otherUser?.id || otherUid}`)}
              role="button"
              tabIndex={0}
              title={otherUserName}
            >
              <div className="chat-header-avatar-wrap">
                <img
                  src={otherUserPhoto}
                  alt={otherUserName}
                  className="chat-header-avatar-img"
                />
                {otherUser?.isOnline && <span className="chat-header-online-indicator"></span>}
              </div>
              <div className="chat-header-user-text">
                <h2 className="chat-header-name">{otherUserName}</h2>
                <span className="chat-header-sub-status">
                  {isOtherTyping ? (
                    <span className="chat-typing-text">Typing...</span>
                  ) : otherUser?.isOnline ? (
                    'Active now'
                  ) : (
                    'Active recently'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="chat-header-actions" onClick={e => e.stopPropagation()}>
            <button
              id="btn-header-search"
              className="chat-header-action-btn"
              aria-label="Search"
              title="Search Messages"
              onClick={() => setIsSearching(true)}
            >
              <Search size={20} color="#ffffff" />
            </button>
            <button className="chat-header-action-btn" aria-label="Phone Call" title="Phone Call">
              <Phone size={20} color="#ffffff" />
            </button>
            <div className="chat-more-menu-container">
              <button
                id="btn-chat-more"
                className="chat-header-action-btn"
                aria-label="More Options"
                title="More Options"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(prev => !prev);
                }}
              >
                <MoreVertical size={22} color="#ffffff" />
              </button>

              {/* THREE-DOT CHAT MENU DROPDOWN */}
              {showMenu && (
                <>
                  <div
                    className="chat-menu-backdrop"
                    onClick={() => setShowMenu(false)}
                    aria-hidden="true"
                  />
                  <div
                    id="chat-dropdown-popover"
                    className="chat-dropdown-menu scrollable-menu animate-fade-in"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Section 1: Chat Tools */}
                    <div className="chat-menu-section-label">Chat Tools</div>
                    <button
                      id="menu-opt-search"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        setIsSearching(true);
                      }}
                    >
                      <Search size={16} /> Search Messages
                    </button>
                    <button
                      id="menu-opt-starred"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        setShowStarredModal(true);
                      }}
                    >
                      <Star size={16} /> Starred Messages {starredMessages.length > 0 && `(${starredMessages.length})`}
                    </button>
                    <button
                      id="menu-opt-disappearing"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        setShowDisappearingModal(true);
                      }}
                    >
                      <Timer size={16} />
                      <span className="menu-item-text-wrap">
                        Disappearing Messages <strong className="menu-sub-chip">{currentDisappearingOpt.label}</strong>
                      </span>
                    </button>

                    <div className="chat-menu-divider" />

                    {/* Section 2: Manage */}
                    <div className="chat-menu-section-label">Manage</div>
                    <button
                      id="menu-opt-add-to-list"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        setShowUserListModal(true);
                      }}
                    >
                      <ListPlus size={16} /> Add to List
                    </button>
                    <button
                      id="menu-opt-clear-chat"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        setShowClearChatModal(true);
                      }}
                    >
                      <Eraser size={16} /> Clear Chat
                    </button>
                    <button
                      id="menu-opt-delete-chat"
                      type="button"
                      className="chat-dropdown-item text-danger"
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteChatModal(true);
                      }}
                    >
                      <Trash2 size={16} /> Delete Chat
                    </button>
                    <button
                      id="menu-opt-close-chat"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/chats');
                      }}
                    >
                      <XCircle size={16} /> Close Chat
                    </button>

                    <div className="chat-menu-divider" />

                    {/* Section 3: Safety & Profile */}
                    <div className="chat-menu-section-label">Safety & Profile</div>
                    <button
                      id="menu-opt-view-profile"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        navigate(`/profile/${otherUser?.uid || otherUser?.id || otherUid}`);
                      }}
                    >
                      <User size={16} /> View Profile
                    </button>
                    <button
                      id="menu-opt-unmatch"
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        setShowUnmatchModal(true);
                      }}
                    >
                      <HeartOff size={16} /> Unmatch
                    </button>
                    <button
                      id="menu-opt-block-user"
                      type="button"
                      className="chat-dropdown-item text-danger"
                      onClick={() => {
                        setShowMenu(false);
                        setShowBlockModal(true);
                      }}
                    >
                      <UserX size={16} /> Block User
                    </button>
                    <button
                      id="menu-opt-report-user"
                      type="button"
                      className="chat-dropdown-item text-danger"
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                    >
                      <ShieldAlert size={16} /> Report User
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* SEARCH RESULTS DROPDOWN (Directly beneath the search header) */}
      {isSearching && searchQuery.trim() && (
        <div className="chat-search-results-panel animate-slide-down">
          {searchResults.length > 0 ? (
            searchResults.map((m, idx) => {
              const isOut = m.senderId === currentUser?.uid || m.senderId === 'current_user';
              const sName = isOut ? 'You' : otherUserName;
              const timeStr = m.createdAt?.toDate
                ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <div
                  key={m.id}
                  className={`search-result-item ${idx === activeSearchIndex ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSearchIndex(idx);
                    scrollToMessageId(m.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="search-result-header">
                    <span className="search-result-sender">{sName}</span>
                    {timeStr && <span className="search-result-time">{timeStr}</span>}
                  </div>
                  <p className="search-result-snippet">
                    {highlightMatch(m.message, searchQuery)}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="search-no-results-view">
              No messages found
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION TOAST */}
      {toastMessage && (
        <div className="chat-floating-toast animate-pop-in">
          {toastMessage}
        </div>
      )}

      {/* 2. CHAT MESSAGES AREA */}
      {/* Clicking the messages area background dismisses active toolbar */}
      <div
        className="chat-messages-container"
        onClick={() => setActiveMessageId(null)}
      >
        {loading ? (
          <LoadingSpinner text="Loading messages..." />
        ) : (
          <>
            {messages.map((msg) => {
              const isOutgoing = msg.senderId === currentUser?.uid || msg.senderId === 'current_user';
              const isSelected = selectedMessageIds.includes(msg.id);

              return (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOutgoing={isOutgoing}
                  otherUserPhoto={otherUserPhoto}
                  currentUserPhoto={currentUserPhoto}
                  currentUid={currentUser?.uid}
                  isSelectionMode={isSelectionMode}
                  isSelected={isSelected}
                  onToggleSelect={handleToggleSelectMessage}
                  onStartSelection={handleStartSelection}
                  onReact={(messageId, emoji) => reactToMessageById(messageId, emoji)}
                  onDeleteRequest={(messageToDel) => {
                    const isOwn = messageToDel.senderId === currentUser?.uid || messageToDel.senderId === 'current_user';
                    setDeleteTargetMessage({
                      isBulk: false,
                      id: messageToDel.id,
                      isOwn
                    });
                  }}
                  onToggleStar={async (messageId) => {
                    const isNowStarred = await toggleStar(messageId);
                    showToast(isNowStarred ? 'Starred!' : 'Unstarred');
                  }}
                  onNotify={showToast}
                  isActionsActive={activeMessageId === msg.id}
                  onActivate={(id) => setActiveMessageId(id)}
                  onDeactivate={() => setActiveMessageId(null)}
                />
              );
            })}

            {isOtherTyping && (
              <div className="chat-typing-bubble-row animate-fade-in">
                <div className="chat-bubble-avatar-wrap incoming-avatar">
                  <img src={otherUserPhoto} alt="User" className="chat-bubble-avatar-img" />
                </div>
                <div className="chat-typing-dots-pill">
                  <span className="dot dot-1"></span>
                  <span className="dot dot-2"></span>
                  <span className="dot dot-3"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="quick-emoji-drawer animate-pop-in">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="quick-emoji-btn"
              onClick={() => handleSelectEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Hidden File Input for Camera and Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* 4. MESSAGE INPUT AREA */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <div className="chat-input-media-group">
          <button
            type="button"
            id="btn-chat-open-camera"
            className="chat-input-media-btn"
            onClick={() => setCameraModalOpen(true)}
            aria-label="Take photo with camera"
            title="Camera"
          >
            <Camera size={23} className="chat-media-icon" />
          </button>

          <button
            type="button"
            className="chat-input-media-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image from gallery"
            title="Gallery"
          >
            <ImageIcon size={23} className="chat-media-icon" />
          </button>

          <button
            type="button"
            className="chat-input-media-btn"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            aria-label="Toggle voice note / emojis"
            title="Voice & Reactions"
          >
            <AudioWaveform size={23} className="chat-media-icon" />
          </button>
        </div>

        {/* Blocked User Safety Notice */}
        {isBlocked && (
          <div className="blocked-chat-banner">
            <span>You have blocked {otherUserName}.</span>
            <button type="button" className="btn-unblock-banner" onClick={handleUnblock}>
              Unblock
            </button>
          </div>
        )}

        <div className="chat-input-pill-box">
          <input
            id="chat-text-input"
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            disabled={isBlocked || sending}
            placeholder={isBlocked ? "You have blocked this member." : "Send a message."}
            className="chat-pill-input-field"
            autoComplete="off"
          />

          <button
            id="btn-send-message"
            type="submit"
            disabled={sending || isBlocked}
            className="chat-pill-send-btn"
            aria-label="Send message"
            title="Send"
          >
            <Send size={18} fill="#1a1a1f" color="#1a1a1f" className="chat-send-icon" />
          </button>
        </div>
      </form>

      {/* Clear Chat Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearChatModal}
        title="Clear chat?"
        message="Your messages will be removed from your chat view."
        confirmText="Clear"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmClearChat}
        onCancel={() => setShowClearChatModal(false)}
      />

      {/* Delete Chat Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteChatModal}
        title="Delete chat?"
        message="Are you sure you want to delete this conversation?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmDeleteChat}
        onCancel={() => setShowDeleteChatModal(false)}
      />

      {/* Delete Message Modal (Delete for me vs Delete for everyone) */}
      <DeleteMessageModal
        isOpen={Boolean(deleteTargetMessage)}
        onClose={() => setDeleteTargetMessage(null)}
        isOwnMessage={deleteTargetMessage?.isOwn}
        selectedCount={deleteTargetMessage?.isBulk ? deleteTargetMessage.ids.length : 1}
        onDeleteForMe={handleConfirmDeleteForMe}
        onDeleteForEveryone={handleConfirmDeleteForEveryone}
      />

      {/* Disappearing Messages Configuration Modal */}
      <DisappearingMessagesModal
        isOpen={showDisappearingModal}
        onClose={() => setShowDisappearingModal(false)}
        currentDuration={currentDisappearingSec}
        onSelectDuration={handleSelectDisappearingDuration}
      />

      {/* User Lists Modal */}
      <UserListModal
        isOpen={showUserListModal}
        onClose={() => setShowUserListModal(false)}
        currentUid={currentUser?.uid}
        targetUid={otherUid}
        targetProfile={otherUser || {}}
      />

      {/* Starred Messages Modal */}
      <StarredMessagesModal
        isOpen={showStarredModal}
        onClose={() => setShowStarredModal(false)}
        starredMessages={starredMessages}
        onScrollToMessage={scrollToMessageId}
        onUnstarMessage={(msgId) => toggleStar(msgId)}
        currentUid={currentUser?.uid}
        otherUser={otherUser || {}}
      />

      {/* Unmatch Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnmatchModal}
        title={`Unmatch with ${otherUserName}?`}
        message="You will be removed from each other's matches and won't be able to message each other."
        confirmText="Unmatch"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmUnmatch}
        onCancel={() => setShowUnmatchModal(false)}
      />

      {/* Block Confirmation Modal */}
      <ConfirmModal
        isOpen={showBlockModal}
        title={`Block ${otherUserName}?`}
        message={`${otherUserName} will not be able to find your profile, see you on Discover, or send you messages. This match will also be removed.`}
        confirmText="Block"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockModal(false)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reporterId={currentUser?.uid}
        reportedUser={otherUser?.uid ? otherUser : { uid: otherUid, id: otherUid, displayName: otherUserName }}
        conversationId={chatId}
      />

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(file) => {
          if (file) sendImageAttachment(file);
        }}
        title="Take Photo for Chat"
        subtitle="Capture a live photo to send directly"
        initialFacingMode="user"
      />
    </div>
  );
};

export default ChatPage;
