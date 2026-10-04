/* ============================================
   HeartSync — Auth Module
   Simple LocalStorage-based auth simulation
   ============================================ */

const Auth = {
  STORAGE_KEY: 'heartsync_user',
  SESSION_KEY: 'heartsync_session',

  /* Register a new user */
  register(username, password, mobile) {
    const users = this._getUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username already exists. Please choose another.' };
    }
    const user = {
      id: Date.now(),
      username,
      password, // In production, this would be hashed
      mobile,
      profile: null,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    return { success: true, user };
  },

  /* Login an existing user */
  login(username, password) {
    const users = this._getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return { success: false, error: 'Invalid username or password. Please try again.' };
    }
    const session = { userId: user.id, username: user.username, loggedAt: new Date().toISOString() };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    HeartSyncData.currentUser = user;
    return { success: true, user };
  },

  /* Logout */
  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    HeartSyncData.currentUser = null;
  },

  /* Check if user is authenticated */
  isAuthenticated() {
    const session = sessionStorage.getItem(this.SESSION_KEY);
    if (!session) return false;
    const parsed = JSON.parse(session);
    const users = this._getUsers();
    const user = users.find(u => u.id === parsed.userId);
    if (user) { HeartSyncData.currentUser = user; return true; }
    return false;
  },

  /* Get current user */
  getCurrentUser() {
    const session = sessionStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    const parsed = JSON.parse(session);
    const users = this._getUsers();
    return users.find(u => u.id === parsed.userId) || null;
  },

  /* Update user profile */
  updateProfile(profileData) {
    const users = this._getUsers();
    const session = JSON.parse(sessionStorage.getItem(this.SESSION_KEY) || '{}');
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx !== -1) {
      users[idx].profile = { ...users[idx].profile, ...profileData };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
      HeartSyncData.currentUser = users[idx];
      return { success: true, user: users[idx] };
    }
    return { success: false, error: 'User not found.' };
  },


  /* Private: get all users */
  _getUsers() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
};
