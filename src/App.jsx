import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import LikesPage from './pages/LikesPage';
import PeopleILikePage from './pages/PeopleILikePage';
import MatchesPage from './pages/MatchesPage';
import MatchPage from './pages/MatchPage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import UserProfileViewPage from './pages/UserProfileViewPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import FavoritesPage from './pages/FavoritesPage';
import ProtectedRoute from './components/ProtectedRoute';

export const App = () => {
  return (
    <Routes>
      {/* Public Unauthenticated Routes */}
      <Route path="/" element={<SplashPage />} />
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<Navigate to="/profile-setup" replace />} />
      <Route path="/verify-phone" element={<Navigate to="/profile-setup" replace />} />
      <Route path="/mobile-verification" element={<Navigate to="/profile-setup" replace />} />
      <Route path="/otp" element={<Navigate to="/profile-setup" replace />} />
      <Route path="/verify-otp" element={<Navigate to="/profile-setup" replace />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />

      {/* Authenticated / Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <DiscoverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/likes"
        element={
          <ProtectedRoute>
            <LikesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/people-i-like"
        element={
          <ProtectedRoute>
            <PeopleILikePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <MatchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/match"
        element={<MatchPage />}
      />
      <Route
        path="/match/:matchId"
        element={<MatchPage />}
      />
      <Route
        path="/its-a-match"
        element={<MatchPage />}
      />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <ChatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:chatId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <UserProfileViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
