/* ============================================
   HeartSync — Main Application Controller
   Single-page app with screen routing
   ============================================ */

const App = {
  /* ---- State ---- */
  currentScreen: null,
  currentNav: 'home',
  discoverIndex: 0,
  likedProfiles: [],
  activeChat: null,
  filterState: { ageMin: 18, ageMax: 40, dist: 50, gender: 'all', relation: 'all', verified: false, interests: [] },
  pendingUsername: '',
  pendingMobile: '',
  uploadedPhotos: [null, null, null],
  profileSetupData: {},
  resendTimer: null,
  toastTimer: null,
  swipeStartX: 0,
  swipeStartY: 0,
  isDragging: false,
  dragCard: null,
  dragStartX: 0,
  cardOffsetX: 0,

  /* ---- Entry Point ---- */
  init() {
    // Show splash, then check auth
    this.showSplash();
  },

  /* ============================================
     ROUTING / NAVIGATION
     ============================================ */
  navigate(screenName, direction = 'forward') {
    const app = document.getElementById('app');
    const cls = direction === 'back' ? 'screen-enter-back' : 'screen-enter';
    let html = '';

    switch(screenName) {
      case 'splash':        html = this.renderSplash();          break;
      case 'onboarding1':   html = this.renderOnboarding(1);     break;
      case 'onboarding2':   html = this.renderOnboarding(2);     break;
      case 'onboarding3':   html = this.renderOnboarding(3);     break;
      case 'login':         html = this.renderLogin();           break;
      case 'register':      html = this.renderRegister();        break;
      case 'otp':           return this.navigate('profile-setup');
      case 'profile-setup': html = this.renderProfileSetup();    break;
      case 'home':          html = this.renderHome();            break;
      case 'discover':      html = this.renderDiscover();        break;
      case 'likes':         html = this.renderLikes();           break;
      case 'people-i-like': html = this.renderPeopleILike();     break;
      case 'chats':         html = this.renderChats();           break;
      case 'chat':          html = this.renderChat();            break;
      case 'profile':       html = this.renderProfilePage();     break;
      case 'notifications': html = this.renderNotifications();   break;
      case 'search':        html = this.renderSearch();          break;
      case 'profile-view':  html = this.renderProfileView();     break;
      default:              html = this.renderHome();
    }

    app.innerHTML = html;
    this.currentScreen = screenName;

    // Add entrance animation
    const screen = app.querySelector('.screen');
    if (screen) {
      screen.classList.add(cls);
    }

    // Post-render setup
    this._postRenderSetup(screenName);
  },

  _postRenderSetup(screenName) {
    switch(screenName) {
      case 'otp':           this._setupOTP();           break;
      case 'profile-setup': this._setupProfileSetup();  break;
      case 'discover':      this._setupSwipe();         break;
      case 'chat':          this._setupChat();          break;
      case 'home':          this._setupSearch();        break;
      case 'chats':         this._setupSearch();        break;
      case 'people-i-like': this._setupSearch();        break;
      case 'search':        this._setupSearch();        break;
      case 'login':         this._setupFormValidation(); break;
      case 'register':      this._setupFormValidation(); break;
    }
    // Setup filter chips
    this._setupFilterChips();
  },

  /* ============================================
     SPLASH SCREEN
     ============================================ */
  showSplash() {
    this.navigate('splash');
    setTimeout(() => {
      if (Auth.isAuthenticated()) {
        const user = Auth.getCurrentUser();
        if (user && user.profile) {
          this.navigate('home');
          this.renderBottomNav('home');
        } else if (user) {
          this.navigate('profile-setup');
        }
      } else {
        this.navigate('onboarding1');
      }
    }, 2000);
  },

  renderSplash() {
    return `
    <div class="screen splash-screen" id="screen-splash">
      <div class="hearts-container">
        ${this._generateHearts()}
      </div>
      <div class="splash-logo-wrap">
        <img src="assets/logo-heart.jpg" alt="HeartSync logo" class="splash-logo-img" />
        <span class="splash-wordmark">HeartSync</span>
      </div>
    </div>`;
  },

  /* ============================================
     ONBOARDING SCREENS
     ============================================ */
  renderOnboarding(step) {
    const steps = [
      {
        img: 'assets/onboard1.jpg',
        heading: `Smart Matches Based<br>on Your <span>Vibe!</span>`,
        text: 'We match you with people who share your energy, interests & intentions.',
        btn: 'NEXT',
        next: 'onboarding2'
      },
      {
        img: 'assets/onboard2.jpg',
        heading: `Only Verified &<br><span>Genuine</span> Profile!`,
        text: 'No fake accounts. Every profile goes through basic verification so you feel safe.',
        btn: 'NEXT',
        next: 'onboarding3'
      },
      {
        img: 'assets/onboard3.jpg',
        heading: `Find People Near <span>You!</span>`,
        text: 'Location-based suggestions help you meet compatible people around you.',
        btn: 'Get Started',
        next: 'login'
      }
    ];

    const s = steps[step - 1];
    const indicators = [1,2,3].map(i =>
      `<span class="page-dot ${i === step ? 'active' : ''}"></span>`
    ).join('');

    return `
    <div class="screen onboarding-screen" id="screen-onboarding-${step}">
      <div class="hearts-container">
        ${this._generateHearts()}
      </div>
      <button class="onboarding-skip" onclick="App.navigate('login')" aria-label="Skip onboarding">Skip</button>
      <img src="${s.img}" alt="Onboarding illustration" class="onboarding-illustration" />
      <div class="onboarding-content">
        <h1 class="onboarding-heading">${s.heading}</h1>
        <p class="onboarding-subtext">${s.text}</p>
        <div class="page-indicators" role="tablist" aria-label="Onboarding progress">
          ${indicators}
        </div>
      </div>

      <!-- Wave bottom -->
      <div class="onboarding-bottom">
        <div class="onboarding-actions">
          ${step < 3 ? `<button class="btn-skip" onclick="App.navigate('login')" aria-label="Skip">Skip</button>
          <button class="btn-next" onclick="App.navigate('${s.next}')" id="btn-ob-next" aria-label="Next">${s.btn}</button>`
          : `<button class="btn-get-started" onclick="App.navigate('login')" id="btn-get-started">${s.btn}</button>`}
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     LOGIN SCREEN
     ============================================ */
  renderLogin() {
    return `
    <div class="screen auth-screen" id="screen-login">
      <div class="auth-top">
        <div class="auth-marble-decor"></div>
        <div class="hearts-container" style="position:absolute;inset:0;pointer-events:none;">
          ${this._generateHearts(4)}
        </div>
        <img src="assets/logo-heart.jpg" alt="HeartSync Logo" class="auth-logo-img" />
        <span class="auth-wordmark">HeartSync</span>
      </div>

      <div class="auth-panel">
        <h1 class="auth-title">Sign in</h1>

        <form id="login-form" onsubmit="App.handleLogin(event)" novalidate>
          <div class="form-group">
            <div class="form-input-wrap">
              <span class="form-icon">👤</span>
              <input type="text" id="login-username" class="form-input" placeholder="Username"
                autocomplete="username" autocapitalize="none" aria-label="Username" required />
            </div>
            <div class="form-error" id="err-login-username">Username is required.</div>
          </div>

          <div class="form-group">
            <div class="form-input-wrap">
              <span class="form-icon">🔒</span>
              <input type="password" id="login-password" class="form-input" placeholder="Password"
                autocomplete="current-password" aria-label="Password" required />
              <button type="button" class="toggle-password" onclick="App.togglePassword('login-password', this)"
                aria-label="Toggle password visibility">👁️</button>
            </div>
            <div class="form-error" id="err-login-password">Password is required.</div>
          </div>

          <div class="forgot-link">
            <a href="#" onclick="App.handleForgotPassword(event)">Forgot Password?</a>
          </div>

          <button type="submit" class="btn-primary btn-press-anim" id="btn-login">Sign In</button>
        </form>

        <div class="auth-link-text">
          Don't have an account?
          <span role="button" tabindex="0" onclick="App.navigate('register')"
            onkeydown="if(event.key==='Enter')App.navigate('register')">Register</span>
        </div>

        <div class="social-divider">
          <span>sign in with</span>
        </div>
        <div class="social-buttons">
          <button class="social-btn" onclick="App.handleSocialLogin('Instagram')" aria-label="Sign in with Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="url(#ig_grad)"/>
              <circle cx="12" cy="12" r="4" stroke="white" stroke-width="2"/>
              <circle cx="17" cy="7" r="1.2" fill="white"/>
              <defs>
                <linearGradient id="ig_grad" x1="0" y1="24" x2="24" y2="0">
                  <stop offset="0%" stop-color="#FCAF45"/>
                  <stop offset="50%" stop-color="#E1306C"/>
                  <stop offset="100%" stop-color="#405DE6"/>
                </linearGradient>
              </defs>
            </svg>
          </button>
          <button class="social-btn" onclick="App.handleSocialLogin('Facebook')" aria-label="Sign in with Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
            </svg>
          </button>
          <button class="social-btn" onclick="App.handleSocialLogin('Google')" aria-label="Sign in with Google">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     REGISTER SCREEN
     ============================================ */
  renderRegister() {
    return `
    <div class="screen auth-screen" id="screen-register">
      <div class="auth-top" style="min-height:160px; padding-top:var(--space-xl);">
        <div class="auth-marble-decor"></div>
        <div class="hearts-container" style="position:absolute;inset:0;pointer-events:none;">
          ${this._generateHearts(3)}
        </div>
        <img src="assets/logo-heart.jpg" alt="HeartSync Logo" class="auth-logo-img" style="width:64px;height:64px;" />
        <span class="auth-wordmark" style="font-size:26px;">HeartSync</span>
      </div>

      <div class="auth-panel" style="padding-top:var(--space-xl);">
        <h1 class="auth-title">Sign up</h1>

        <form id="register-form" onsubmit="App.handleRegister(event)" novalidate>
          <div class="form-group">
            <div class="form-input-wrap">
              <span class="form-icon">👤</span>
              <input type="text" id="reg-username" class="form-input" placeholder="Username"
                autocomplete="username" autocapitalize="none" aria-label="Username" required />
            </div>
            <div class="form-error" id="err-reg-username">Username is required.</div>
          </div>

          <div class="form-group">
            <div class="form-input-wrap">
              <span class="form-icon">🔒</span>
              <input type="password" id="reg-password" class="form-input" placeholder="Password"
                autocomplete="new-password" aria-label="Password" required minlength="6" />
              <button type="button" class="toggle-password" onclick="App.togglePassword('reg-password', this)"
                aria-label="Toggle password visibility">👁️</button>
            </div>
            <div class="form-error" id="err-reg-password">Password must be at least 6 characters.</div>
          </div>

          <div class="form-group">
            <div class="form-input-wrap">
              <span class="form-icon">🔒</span>
              <input type="password" id="reg-retype" class="form-input" placeholder="Retype Password"
                autocomplete="new-password" aria-label="Retype password" required />
              <button type="button" class="toggle-password" onclick="App.togglePassword('reg-retype', this)"
                aria-label="Toggle retype password visibility">👁️</button>
            </div>
            <div class="form-error" id="err-reg-retype">Passwords do not match.</div>
          </div>

          <div class="form-group">
            <div class="form-input-wrap">
              <span class="form-icon">📱</span>
              <input type="tel" id="reg-mobile" class="form-input" placeholder="Mobile Number"
                autocomplete="tel" aria-label="Mobile number" required pattern="[0-9]{10,13}" />
            </div>
            <div class="form-error" id="err-reg-mobile">Enter a valid phone number.</div>
          </div>

          <button type="submit" class="btn-primary btn-press-anim" id="btn-register">Register</button>
        </form>

        <div class="auth-link-text" style="margin-top:var(--space-md);">
          Already have an account?
          <span role="button" tabindex="0" onclick="App.navigate('login', 'back')"
            onkeydown="if(event.key==='Enter')App.navigate('login','back')">Sign In</span>
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     OTP VERIFICATION
     ============================================ */
  renderOTP() {
    const maskedMobile = this.pendingMobile
      ? '+91 ' + this.pendingMobile.replace(/(\d{5})(\d{5})/, 'XXXXX-$2')
      : '+62 813-8172-5977';

    return `
    <div class="screen auth-screen otp-screen" id="screen-otp">
      <div class="otp-top">
        <div class="auth-marble-decor"></div>
        <button class="otp-back-btn" onclick="App.navigate('register','back')" aria-label="Go back">←</button>
        <button class="change-number-btn" onclick="App.navigate('register','back')">Change number</button>
        <img src="assets/logo-heart.jpg" alt="HeartSync Logo" class="otp-logo" />
        <span class="otp-wordmark">HeartSync</span>
      </div>

      <div class="otp-panel">
        <h1 class="otp-title">Enter authentication code</h1>
        <p class="otp-subtitle">
          Enter the 4-digit code we have sent via the<br>
          phone number <strong>${maskedMobile}</strong>
        </p>

        <div class="otp-inputs" id="otp-inputs" role="group" aria-label="OTP code input">
          <input type="tel" maxlength="1" class="otp-input" id="otp-0" aria-label="OTP digit 1" inputmode="numeric" />
          <input type="tel" maxlength="1" class="otp-input" id="otp-1" aria-label="OTP digit 2" inputmode="numeric" />
          <input type="tel" maxlength="1" class="otp-input" id="otp-2" aria-label="OTP digit 3" inputmode="numeric" />
          <input type="tel" maxlength="1" class="otp-input" id="otp-3" aria-label="OTP digit 4" inputmode="numeric" />
        </div>

        <button class="btn-white-outline btn-press-anim" id="btn-verify-otp" onclick="App.handleVerifyOTP()" style="max-width:100%;">
          Continue
        </button>

        <div class="otp-resend" id="otp-resend-section">
          <span id="otp-resend-text">Didn't receive it? Resend in <span id="otp-countdown">30</span>s</span>
          <button id="otp-resend-btn" onclick="App.handleResendOTP()" disabled style="margin-left:6px;">Resend code</button>
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     PROFILE SETUP
     ============================================ */
  renderProfileSetup() {
    const years = [];
    const now = new Date().getFullYear();
    for(let y = now - 18; y >= now - 80; y--) years.push(y);
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const days = Array.from({length:31},(_,i)=>i+1);

    return `
    <div class="screen profile-setup-screen" id="screen-profile-setup">
      <div class="profile-setup-header">
        <h1 class="profile-setup-title">Profile Info</h1>
      </div>

      <div class="profile-setup-body">
        <form id="profile-form" onsubmit="App.handleProfileSave(event)" novalidate>

          <div class="profile-section-label">Add Photos</div>
          <div class="photo-upload-grid" id="photo-grid">
            ${[0,1,2].map(i => `
            <div class="photo-upload-box" id="photo-box-${i}" onclick="App.triggerPhotoUpload(${i})"
              role="button" tabindex="0" aria-label="Upload photo ${i+1}"
              onkeydown="if(event.key==='Enter')App.triggerPhotoUpload(${i})">
              <span class="photo-upload-icon">📷</span>
              <span class="photo-upload-text">Add Photo</span>
              <button type="button" class="photo-remove-btn" onclick="App.removePhoto(event,${i})" aria-label="Remove photo">✕</button>
            </div>`).join('')}
          </div>
          <input type="file" id="photo-file-input" accept="image/*" style="display:none;" onchange="App.handlePhotoFile(event)" />

          <div class="profile-field">
            <label class="profile-label" for="prof-name">Name</label>
            <input type="text" id="prof-name" class="profile-input" placeholder="Your full name"
              autocomplete="name" aria-label="Full name" required />
            <div class="form-error" id="err-prof-name">Name is required.</div>
          </div>

          <div class="profile-field">
            <label class="profile-label">Date of Birth</label>
            <div class="dob-row">
              <select id="prof-dob-day" class="profile-select" aria-label="Day">
                <option value="">Day</option>
                ${days.map(d=>`<option value="${d}">${d}</option>`).join('')}
              </select>
              <select id="prof-dob-month" class="profile-select" aria-label="Month">
                <option value="">Month</option>
                ${months.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}
              </select>
              <select id="prof-dob-year" class="profile-select" aria-label="Year">
                <option value="">Year</option>
                ${years.map(y=>`<option value="${y}">${y}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="profile-field">
            <label class="profile-label">Gender</label>
            <div class="gender-chips" role="group" aria-label="Gender selection">
              <button type="button" class="gender-chip selected" data-gender="Male"
                onclick="App.selectGender('Male')" id="gc-male">Male</button>
              <button type="button" class="gender-chip" data-gender="Female"
                onclick="App.selectGender('Female')" id="gc-female">Female</button>
              <button type="button" class="gender-chip" data-gender="Others"
                onclick="App.selectGender('Others')" id="gc-others">Others</button>
            </div>
          </div>

          <div class="profile-field">
            <label class="profile-label" for="prof-country">Country</label>
            <input type="text" id="prof-country" class="profile-input" placeholder="Country"
              aria-label="Country" />
          </div>

          <div class="profile-field">
            <label class="profile-label" for="prof-city">City</label>
            <input type="text" id="prof-city" class="profile-input" placeholder="City"
              aria-label="City" />
          </div>

          <div class="profile-field">
            <label class="profile-label" for="prof-about">Few words about me</label>
            <textarea id="prof-about" class="profile-textarea"
              placeholder="Tell people about yourself..."
              aria-label="About me" maxlength="250"></textarea>
          </div>

          <button type="submit" class="btn-white-outline btn-press-anim" style="background:var(--gradient-primary);color:white;margin-top:var(--space-md);"
            id="btn-save-profile">Save</button>

        </form>
      </div>
    </div>`;
  },

  /* ============================================
     HOME SCREEN
     ============================================ */
  renderHome() {
    const profiles = HeartSyncData.profiles;
    const user = Auth.getCurrentUser();
    const avatarSrc = (user && user.profile && user.profile.photo) ? user.profile.photo : 'assets/logo-heart.jpg';

    const storiesHTML = profiles.map(p => `
      <div class="story-item" onclick="App.viewProfile(${p.id})" role="button" tabindex="0" aria-label="View ${p.name}'s profile">
        <div class="story-ring">
          <img src="${p.image}" alt="${p.name}" class="story-img" loading="lazy" />
        </div>
        <span class="story-name">${p.name.split(' ')[0]}</span>
      </div>
    `).join('');

    const gridHTML = profiles.map(p => `
      <div class="profile-card" onclick="App.viewProfile(${p.id})"
        role="button" tabindex="0" aria-label="View ${p.name}'s profile"
        onkeydown="if(event.key==='Enter')App.viewProfile(${p.id})">
        <img src="${p.image}" alt="${p.name}" class="profile-card-img" loading="lazy" />
        <div class="profile-card-info">
          <div class="profile-card-name">${p.name}</div>
          <div class="profile-card-meta">
            Age ${p.age} · ${p.distance}
            ${p.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');

    return `
    <div class="screen home-screen" id="screen-home">
      <!-- App Header -->
      <header class="app-header" role="banner">
        <div class="header-logo" role="heading" aria-level="1">
          <img src="assets/logo-heart.jpg" alt="HeartSync" class="header-logo-img" />
          <span class="header-logo-text">HeartSync</span>
        </div>
        <div class="header-actions">
          <button class="header-icon-btn" onclick="App.openFilter()" aria-label="Open filters">
            ⚙️
          </button>
          <button class="header-icon-btn" onclick="App.navigate('notifications')" aria-label="Notifications">
            🔔
            <span class="notif-badge" aria-label="2 unread notifications">2</span>
          </button>
          <img src="${avatarSrc}" alt="Your profile" class="header-avatar"
            onclick="App.navigateToTab('profile')" role="button" tabindex="0" />
        </div>
      </header>

      <!-- Stories Row -->
      <section aria-label="Active profiles">
        <div class="stories-section">
          <div class="story-item" role="button" tabindex="0" aria-label="Add or update your story">
            <div class="story-ring add-story">
              <span class="story-plus">+</span>
            </div>
            <span class="story-name">You</span>
          </div>
          ${storiesHTML}
        </div>
      </section>

      <!-- Discover Grid -->
      <section>
        <div class="section-row">
          <h2 class="section-title">Discover</h2>
          <button class="section-see-all" onclick="App.navigateToTab('discover')">See all</button>
        </div>
        <div class="profile-grid" role="list" aria-label="Discovered profiles">
          ${gridHTML}
        </div>
      </section>

      ${this.renderBottomNavHTML('home')}
    </div>`;
  },

  /* ============================================
     DISCOVER / SWIPE SCREEN
     ============================================ */
  renderDiscover() {
    const profile = HeartSyncData.profiles[this.discoverIndex % HeartSyncData.profiles.length];
    const user = Auth.getCurrentUser();
    const avatarSrc = (user && user.profile && user.profile.photo) ? user.profile.photo : 'assets/logo-heart.jpg';

    return `
    <div class="screen discover-screen" id="screen-discover">
      <header class="app-header" role="banner">
        <div class="header-logo">
          <img src="assets/logo-heart.jpg" alt="HeartSync" class="header-logo-img" />
          <span class="header-logo-text">HeartSync</span>
        </div>
        <div class="header-actions">
          <button class="header-icon-btn" onclick="App.openFilter()" aria-label="Open filters">⚙️</button>
          <button class="header-icon-btn" onclick="App.navigate('notifications')" aria-label="Notifications">
            🔔
            <span class="notif-badge">2</span>
          </button>
          <img src="${avatarSrc}" alt="Your profile" class="header-avatar" onclick="App.navigateToTab('profile')" />
        </div>
      </header>

      <!-- Profile Card -->
      <div class="discover-profile-card" id="discover-card" role="article" aria-label="${profile.name}'s profile">
        <div class="swipe-like-indicator" id="like-indicator">LIKE ❤️</div>
        <div class="swipe-pass-indicator" id="pass-indicator">NOPE ✕</div>
        <img src="${profile.image}" alt="${profile.name}" class="discover-profile-img" id="discover-img" />
        <div class="discover-profile-overlay"></div>
        <div class="discover-distance-badge">📍 ${profile.distance}</div>
        <div class="discover-profile-info">
          <div class="discover-profile-name">${profile.name} ${profile.verified ? '✓' : ''}</div>
          <div class="discover-profile-age">Age ${profile.age}</div>
          <div class="discover-profile-about">📝 About me</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="discover-actions" role="group" aria-label="Profile actions">
        <button class="action-btn pass" onclick="App.passProfile()" aria-label="Pass on this profile" title="Pass">✕</button>
        <button class="action-btn like" onclick="App.likeProfile()" aria-label="Like this profile" title="Like">❤️</button>
        <button class="action-btn interested" onclick="App.viewProfile(${profile.id})" aria-label="View full profile" title="View Profile">✔</button>
      </div>

      ${this.renderBottomNavHTML('discover')}
    </div>`;
  },

  /* ============================================
     PROFILE VIEW (Full profile card)
     ============================================ */
  renderProfileView() {
    const profile = HeartSyncData.profiles[this.discoverIndex % HeartSyncData.profiles.length];

    return `
    <div class="screen" id="screen-profile-view" style="background:#111;position:relative;padding-bottom:90px;">
      <button class="otp-back-btn" style="position:absolute;top:var(--space-md);left:var(--space-md);z-index:10;background:rgba(255,255,255,0.2);color:white;border-radius:var(--radius-full);width:38px;height:38px;font-size:20px;display:flex;align-items:center;justify-content:center;"
        onclick="App.navigate('discover','back')" aria-label="Go back">←</button>

      <img src="${profile.image}" alt="${profile.name}" style="width:100%;height:65vh;object-fit:cover;display:block;" />

      <div style="position:absolute;top:var(--space-md);left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.9);color:var(--color-primary);font-weight:700;font-size:13px;padding:6px 16px;border-radius:var(--radius-full);">
        📍 ${profile.distance}
      </div>

      <div style="background:white;border-radius:var(--radius-xl) var(--radius-xl) 0 0;margin-top:-24px;padding:var(--space-lg);position:relative;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-md);">
          <div>
            <div style="font-size:24px;font-weight:700;color:var(--color-text-dark);">${profile.name} ${profile.verified ? '<span style="color:var(--color-primary);font-size:16px;">✓</span>' : ''}</div>
            <div style="font-size:15px;color:var(--color-text-muted);">Age ${profile.age} · ${profile.city}</div>
          </div>
          <button onclick="App.navigate('chat')" style="background:var(--gradient-primary);color:white;border-radius:var(--radius-full);width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:var(--shadow-md);">💬</button>
        </div>

        <div style="margin-bottom:var(--space-md);">
          <div style="font-size:15px;font-weight:600;color:var(--color-text-dark);margin-bottom:var(--space-sm);">About me</div>
          <div style="font-size:14px;color:var(--color-text-muted);line-height:1.7;">${profile.about}</div>
        </div>

        <div style="margin-bottom:var(--space-md);">
          <div style="font-size:15px;font-weight:600;color:var(--color-text-dark);margin-bottom:var(--space-sm);">Interests</div>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
            ${profile.interests.map(i=>`<span class="interest-chip">${i}</span>`).join('')}
          </div>
        </div>

        <div class="discover-actions" style="margin:0;padding:var(--space-md) 0 0;">
          <button class="action-btn pass" onclick="App.passProfile();App.navigate('discover')" aria-label="Pass">✕</button>
          <button class="action-btn like" onclick="App.likeProfile();App.navigate('discover')" aria-label="Like">❤️</button>
          <button class="action-btn interested" aria-label="Interested">✔</button>
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     MATCH MODAL
     ============================================ */
  showMatch(profile) {
    const modal = document.getElementById('match-modal');
    const matchName = document.getElementById('match-name');
    const matchOtherImg = document.getElementById('match-other-img');
    const user = Auth.getCurrentUser();

    if (matchName) matchName.textContent = profile.name.split(' ')[0];
    if (matchOtherImg) matchOtherImg.src = profile.image;

    const matchUserImg = document.getElementById('match-user-img');
    if (matchUserImg && user && user.profile && user.profile.photo) {
      matchUserImg.src = user.profile.photo;
    }

    this.activeChat = profile;
    modal.classList.remove('hidden');
  },

  closeMatch() {
    const modal = document.getElementById('match-modal');
    modal.classList.add('hidden');
  },

  goToChat() {
    this.closeMatch();
    this.navigate('chat');
  },

  /* ============================================
     CHATS LIST
     ============================================ */
  renderChats() {
    const chatPartners = HeartSyncData.profiles.slice(0, 5);
    const lastMessages = ['Hi! How is your day?', 'Hi ❤️', 'Hello! Just confirming', "document I sent earlier?", 'Hello 😊'];
    const times = ['20:00', '12:00', '00:40', '11:09', '13:40'];
    const unreads = [1, 0, 2, 0, 0];
    const user = Auth.getCurrentUser();
    const avatarSrc = (user && user.profile && user.profile.photo) ? user.profile.photo : 'assets/logo-heart.jpg';

    return `
    <div class="screen chats-screen" id="screen-chats">
      <header class="app-header" role="banner">
        <div style="display:flex;align-items:center;gap:var(--space-sm);">
          <span style="font-size:22px;color:var(--color-primary);font-family:var(--font-script);font-weight:700;">💬 Chats</span>
        </div>
        <div class="header-actions">
          <button class="header-icon-btn" onclick="App.navigate('search')" aria-label="Search">🔍</button>
          <button class="header-icon-btn" onclick="App.openFilter()" aria-label="Filter">⚙️</button>
          <img src="${avatarSrc}" alt="Your profile" class="header-avatar" onclick="App.navigateToTab('profile')" />
        </div>
      </header>

      <!-- Now Active -->
      <section class="active-users-section" aria-label="Now active users">
        <div class="active-section-header">
          <span class="active-title">Now Active</span>
          <button class="active-see-all">See all</button>
        </div>
        <div class="active-users-row">
          ${chatPartners.map(p => `
          <div class="active-user-item" onclick="App.openChatWith(${p.id})" role="button" tabindex="0" aria-label="Chat with ${p.name}">
            <div class="active-user-avatar-wrap">
              <img src="${p.image}" alt="${p.name}" class="active-user-avatar" loading="lazy" />
              <span class="active-dot" aria-label="Online"></span>
            </div>
            <span class="active-user-name">${p.name.split(' ')[0]}</span>
          </div>`).join('')}
        </div>
      </section>

      <!-- Chat List -->
      <div class="chat-list" role="list" aria-label="Conversations">
        ${chatPartners.map((p, i) => `
        <div class="chat-list-item" onclick="App.openChatWith(${p.id})"
          role="listitem" tabindex="0" aria-label="Chat with ${p.name}: ${lastMessages[i]}"
          onkeydown="if(event.key==='Enter')App.openChatWith(${p.id})">
          <div class="chat-avatar-wrap">
            <img src="${p.image}" alt="${p.name}" class="chat-avatar" loading="lazy" />
            ${i < 3 ? '<span class="chat-active-dot"></span>' : ''}
          </div>
          <div class="chat-item-body">
            <div class="chat-item-name">${p.name}</div>
            <div class="chat-item-last">${lastMessages[i]}</div>
          </div>
          <div class="chat-item-meta">
            <span class="chat-item-time">${times[i]}</span>
            ${unreads[i] > 0 ? `<span class="unread-badge" aria-label="${unreads[i]} unread messages">${unreads[i]}</span>` : ''}
          </div>
        </div>`).join('')}
      </div>

      ${this.renderBottomNavHTML('chats')}
    </div>`;
  },

  /* ============================================
     CHAT SCREEN (individual conversation)
     ============================================ */
  renderChat() {
    const partner = this.activeChat || HeartSyncData.profiles[0];
    const messages = HeartSyncData.chatMessages[partner.id] || HeartSyncData.chatMessages[1];

    const messagesHTML = messages.map(m => `
      <div class="chat-bubble-wrap ${m.from === 'me' ? 'outgoing' : 'incoming'}" role="listitem">
        ${m.from !== 'me' ? `<img src="${partner.image}" alt="${partner.name}" class="bubble-avatar" />` : ''}
        <div>
          <div class="chat-bubble ${m.from === 'me' ? 'outgoing' : 'incoming'}">${m.text}</div>
          <div class="bubble-time" style="text-align:${m.from === 'me' ? 'right' : 'left'}">${m.time}</div>
        </div>
      </div>
    `).join('');

    return `
    <div class="screen chat-screen" id="screen-chat">
      <header class="chat-header" role="banner">
        <button class="chat-back-btn" onclick="App.navigate('chats','back')" aria-label="Go back">←</button>
        <div class="chat-user-info">
          <img src="${partner.image}" alt="${partner.name}" class="chat-user-avatar" loading="lazy" />
          <div>
            <div class="chat-user-name">${partner.name.split(' ')[0]}</div>
            <div class="chat-user-status">🟢 Online</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-header-btn" onclick="App.showToast('Video call starting...')" aria-label="Video call">📹</button>
          <button class="chat-header-btn" onclick="App.showToast('Calling...')" aria-label="Voice call">📞</button>
          <button class="chat-header-btn" aria-label="More options">⋮</button>
        </div>
      </header>

      <div class="chat-messages" id="chat-messages" role="log" aria-label="Chat messages" aria-live="polite">
        ${messagesHTML}
      </div>

      <div class="chat-input-area">
        <div class="chat-input-row">
          <div class="chat-attach-btns">
            <button class="chat-attach-btn" onclick="App.showToast('Emoji picker coming soon')" aria-label="Emoji">😊</button>
            <button class="chat-attach-btn" onclick="App.showToast('Image upload coming soon')" aria-label="Image">🖼️</button>
            <button class="chat-attach-btn" onclick="App.showToast('Attachment coming soon')" aria-label="Attachment">📎</button>
          </div>
          <input type="text" id="chat-input" class="chat-input" placeholder="Send a message"
            aria-label="Type a message" onkeydown="if(event.key==='Enter')App.sendMessage()" />
          <button class="chat-attach-btn" onclick="App.showToast('Voice message coming soon')" aria-label="Voice message">🎤</button>
          <button class="chat-send-btn" onclick="App.sendMessage()" aria-label="Send message">➤</button>
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     LIKES SCREEN
     ============================================ */
  renderLikes() {
    const profiles = HeartSyncData.profiles;
    const user = Auth.getCurrentUser();
    const avatarSrc = (user && user.profile && user.profile.photo) ? user.profile.photo : 'assets/logo-heart.jpg';

    return `
    <div class="screen likes-screen" id="screen-likes">
      <header class="app-header" role="banner">
        <div style="font-size:22px;font-family:var(--font-script);font-weight:700;color:var(--color-primary);">❤️ Likes</div>
        <div class="header-actions">
          <button class="header-icon-btn" onclick="App.navigate('notifications')" aria-label="Notifications">
            🔔 <span class="notif-badge">2</span>
          </button>
          <img src="${avatarSrc}" alt="Your profile" class="header-avatar" onclick="App.navigateToTab('profile')" />
        </div>
      </header>

      <div class="section-row">
        <h1 class="section-title">People Who Liked You</h1>
      </div>

      <div class="likes-grid" role="list" aria-label="Profiles who liked you">
        ${profiles.map(p => `
        <div class="likes-card" onclick="App.viewProfile(${p.id})"
          role="listitem" tabindex="0" aria-label="${p.name}, age ${p.age}"
          onkeydown="if(event.key==='Enter')App.viewProfile(${p.id})">
          <div class="likes-card-img-wrap">
            <img src="${p.image}" alt="${p.name}" class="likes-card-img" loading="lazy" />
            <button class="likes-card-like-btn" onclick="event.stopPropagation();App.likeProfileById(${p.id})"
              aria-label="Like ${p.name}">❤️</button>
          </div>
          <div class="likes-card-info">
            <div class="likes-card-name">${p.name.split(' ')[0]}</div>
            <div class="likes-card-detail">Age ${p.age} · ${p.city}</div>
          </div>
        </div>`).join('')}
      </div>

      ${this.renderBottomNavHTML('likes')}
    </div>`;
  },

  /* ============================================
     PEOPLE I LIKE SCREEN
     ============================================ */
  renderPeopleILike() {
    const liked = this.likedProfiles.length > 0
      ? this.likedProfiles
      : HeartSyncData.profiles.slice(0, 4);

    return `
    <div class="screen likes-screen" id="screen-people-i-like">
      <header class="app-header" role="banner">
        <div style="font-size:22px;font-family:var(--font-script);font-weight:700;color:var(--color-primary);">💕 HeartSync</div>
        <div class="header-actions">
          <button class="header-icon-btn" onclick="App.openFilter()" aria-label="Filters">⚙️</button>
          <button class="header-icon-btn" onclick="App.navigate('notifications')" aria-label="Notifications">🔔</button>
          <img src="assets/logo-heart.jpg" alt="Profile" class="header-avatar" onclick="App.navigateToTab('profile')" />
        </div>
      </header>

      <div class="section-row">
        <h1 class="section-title">People Whom I Like</h1>
      </div>

      <div class="chat-search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="search" class="search-input" placeholder="Search" id="pil-search"
            aria-label="Search people you like" oninput="App.filterPeopleILike(this.value)" />
        </div>
      </div>

      ${liked.length === 0
        ? `<div class="empty-state">
             <div class="empty-state-icon">💔</div>
             <div class="empty-state-title">No likes yet</div>
             <div class="empty-state-text">Start liking profiles to see them here!</div>
           </div>`
        : `<div class="likes-grid" id="pil-grid" role="list" aria-label="Profiles you liked">
            ${liked.map(p => `
            <div class="likes-card" onclick="App.viewProfile(${p.id})"
              role="listitem" tabindex="0" aria-label="${p.name}, age ${p.age}">
              <div class="likes-card-img-wrap">
                <img src="${p.image}" alt="${p.name}" class="likes-card-img" loading="lazy" />
                <button class="likes-card-like-btn" onclick="event.stopPropagation();"
                  aria-label="Liked ${p.name}" style="background:white;color:var(--color-primary);">✔</button>
              </div>
              <div class="likes-card-info">
                <div class="likes-card-name">${p.name.split(' ')[0]}</div>
                <div class="likes-card-detail">Age ${p.age} · ${p.city}</div>
              </div>
            </div>`).join('')}
           </div>`
      }

      ${this.renderBottomNavHTML('likes')}
    </div>`;
  },

  /* ============================================
     PROFILE PAGE
     ============================================ */
  renderProfilePage() {
    const user = Auth.getCurrentUser();
    const profile = user && user.profile;
    const name = profile ? profile.name : (user ? user.username : 'Your Profile');
    const avatarSrc = (profile && profile.photo) ? profile.photo : 'assets/logo-heart.jpg';
    const city = profile ? (profile.city || 'Unknown city') : 'Set your location';
    const about = profile ? (profile.about || 'Add a bio to let people know you better.') : '';
    const interests = ['Music', 'Travel', 'Food', 'Fitness', 'Movies', 'Art'];

    return `
    <div class="screen profile-page" id="screen-profile">
      <div class="profile-page-header">
        <div class="profile-page-cover-decor"></div>
        <div class="profile-page-avatar-wrap">
          <img src="${avatarSrc}" alt="${name}" class="profile-page-avatar" />
          <button class="profile-edit-badge" onclick="App.navigate('profile-setup')" aria-label="Edit profile photo">✏️</button>
        </div>
        <h1 class="profile-page-name">${name}</h1>
        <div class="profile-page-sub">
          <span>📍 ${city}</span>
          <span class="verified-tag">✓ Verified</span>
        </div>
      </div>

      <div class="profile-body">
        <div class="profile-info-card">
          <div class="profile-info-card-title">About Me <span>💕</span></div>
          <p class="profile-info-text">${about || 'Add a bio to let people know you better!'}</p>
        </div>

        <div class="profile-info-card">
          <div class="profile-info-card-title">Interests <span>✨</span></div>
          <div class="interests-wrap">
            ${interests.map(i=>`<span class="interest-chip">${i}</span>`).join('')}
          </div>
        </div>

        <div class="profile-info-card">
          <div class="profile-info-card-title">Info <span>📋</span></div>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span style="color:var(--color-text-muted);">Looking for</span>
              <span style="font-weight:600;">Serious relationship</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span style="color:var(--color-text-muted);">Gender</span>
              <span style="font-weight:600;">${profile ? (profile.gender || 'Not set') : 'Not set'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span style="color:var(--color-text-muted);">Country</span>
              <span style="font-weight:600;">${profile ? (profile.country || 'Not set') : 'Not set'}</span>
            </div>
          </div>
        </div>

        <div class="profile-action-row" role="list">
          <button class="profile-action-btn" onclick="App.navigate('profile-setup')" role="listitem">
            <span class="action-icon">✏️</span>
            <span>Edit Profile</span>
            <span style="margin-left:auto;color:var(--color-text-muted);">›</span>
          </button>
          <button class="profile-action-btn" onclick="App.showToast('Settings coming soon!')" role="listitem">
            <span class="action-icon">⚙️</span>
            <span>Settings</span>
            <span style="margin-left:auto;color:var(--color-text-muted);">›</span>
          </button>
          <button class="profile-action-btn" onclick="App.showToast('Privacy settings coming soon!')" role="listitem">
            <span class="action-icon">🔒</span>
            <span>Privacy</span>
            <span style="margin-left:auto;color:var(--color-text-muted);">›</span>
          </button>
          <button class="profile-action-btn" onclick="App.showToast('Help & Support coming soon!')" role="listitem">
            <span class="action-icon">❓</span>
            <span>Help & Support</span>
            <span style="margin-left:auto;color:var(--color-text-muted);">›</span>
          </button>
          <button class="profile-action-btn danger" onclick="App.handleLogout()" role="listitem">
            <span class="action-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      ${this.renderBottomNavHTML('profile')}
    </div>`;
  },

  /* ============================================
     NOTIFICATIONS SCREEN
     ============================================ */
  renderNotifications() {
    return `
    <div class="screen notifications-screen" id="screen-notifications">
      <div class="page-title-bar">
        <button class="page-title-bar-back" onclick="App.navigate('home','back')" aria-label="Go back">←</button>
        <h1>Notifications</h1>
      </div>

      <div class="notif-list" role="list" aria-label="Notifications">
        ${HeartSyncData.notifications.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" role="listitem" tabindex="0"
          aria-label="${n.title}${n.unread ? ' (unread)' : ''}">
          <div class="notif-icon-wrap">
            ${n.avatar
              ? `<img src="${n.avatar}" alt="${n.title}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" />`
              : `<span style="font-size:22px;">${n.icon}</span>`}
          </div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
          </div>
          <span class="notif-time">${n.time}</span>
        </div>`).join('')}
      </div>
    </div>`;
  },

  /* ============================================
     SEARCH SCREEN
     ============================================ */
  renderSearch() {
    return `
    <div class="screen" style="background:var(--color-pink-pale);padding-bottom:90px;" id="screen-search">
      <div class="page-title-bar">
        <button class="page-title-bar-back" onclick="App.navigate('home','back')" aria-label="Go back">←</button>
        <h1>Search</h1>
      </div>

      <div style="padding:var(--space-md);">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="search" class="search-input" placeholder="Search by name, city or interests..."
            id="search-main" aria-label="Search" oninput="App.handleSearch(this.value)" />
        </div>
      </div>

      <div id="search-results">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Search for people</div>
          <div class="empty-state-text">Find matches by name, city, or interests</div>
        </div>
      </div>
    </div>`;
  },

  /* ============================================
     BOTTOM NAVIGATION
     ============================================ */
  renderBottomNavHTML(active) {
    const items = [
      { id: 'home',    icon: '🏠', label: 'Home',    onclick: "App.navigateToTab('home')" },
      { id: 'likes',   icon: '❤️', label: 'Likes',   onclick: "App.navigateToTab('likes')" },
      { id: 'discover',icon: '🔍', label: 'Discover', onclick: "App.navigateToTab('discover')" },
      { id: 'chats',   icon: '💬', label: 'Chats',   onclick: "App.navigateToTab('chats')" },
      { id: 'profile', icon: '👤', label: 'Profile',  onclick: "App.navigateToTab('profile')" }
    ];

    return `
    <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
      ${items.map(item => `
      <button class="nav-item ${active === item.id ? 'active' : ''}"
        onclick="${item.onclick}"
        id="nav-${item.id}"
        aria-label="${item.label}"
        aria-current="${active === item.id ? 'page' : 'false'}">
        <span class="nav-icon" aria-hidden="true">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </button>`).join('')}
    </nav>`;
  },

  renderBottomNav(active) {
    // Standalone (not inside a screen) — handled by renderBottomNavHTML embedded
  },

  /* ============================================
     HANDLERS — AUTH
     ============================================ */
  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    let valid = true;

    if (!username) {
      this._showFieldError('err-login-username', 'login-username');
      valid = false;
    } else { this._clearFieldError('err-login-username', 'login-username'); }

    if (!password) {
      this._showFieldError('err-login-password', 'login-password');
      valid = false;
    } else { this._clearFieldError('err-login-password', 'login-password'); }

    if (!valid) return;

    const btn = document.getElementById('btn-login');
    this._setLoading(btn, true, 'Signing in...');

    setTimeout(() => {
      const result = Auth.login(username, password);
      this._setLoading(btn, false, 'Sign In');
      if (result.success) {
        this.showToast('Welcome back! 💕');
        const user = result.user;
        if (user.profile) {
          this.navigate('home');
        } else {
          this.navigate('profile-setup');
        }
      } else {
        this.showToast(result.error);
        this._showFieldError('err-login-username', 'login-username');
        this._showFieldError('err-login-password', 'login-password');
      }
    }, 800);
  },

  handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const retype   = document.getElementById('reg-retype').value;
    const mobile   = document.getElementById('reg-mobile').value.trim();
    let valid = true;

    if (!username) {
      this._showFieldError('err-reg-username', 'reg-username'); valid = false;
    } else { this._clearFieldError('err-reg-username', 'reg-username'); }

    if (!password || password.length < 6) {
      this._showFieldError('err-reg-password', 'reg-password', 'Password must be at least 6 characters.'); valid = false;
    } else { this._clearFieldError('err-reg-password', 'reg-password'); }

    if (!retype || retype !== password) {
      this._showFieldError('err-reg-retype', 'reg-retype', 'Passwords do not match.'); valid = false;
    } else { this._clearFieldError('err-reg-retype', 'reg-retype'); }

    if (!mobile || !/^[0-9]{10,13}$/.test(mobile.replace(/\s/g,''))) {
      this._showFieldError('err-reg-mobile', 'reg-mobile', 'Enter a valid phone number.'); valid = false;
    } else { this._clearFieldError('err-reg-mobile', 'reg-mobile'); }

    if (!valid) return;

    const btn = document.getElementById('btn-register');
    this._setLoading(btn, true, 'Registering...');

    setTimeout(() => {
      const result = Auth.register(username, password, mobile);
      this._setLoading(btn, false, 'Register');
      if (result.success) {
        this.pendingUsername = username;
        this.pendingMobile = mobile;
        Auth.login(username, password);
        this.showToast('Account created! Welcome to HeartSync! ✨');
        this.navigate('profile-setup');
      } else {
        this.showToast(result.error);
        this._showFieldError('err-reg-username', 'reg-username', result.error);
      }
    }, 800);
  },

  handleVerifyOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    let otp = '';
    inputs.forEach(inp => otp += inp.value);

    if (otp.length < 4) {
      this.showToast('Please enter all 4 digits');
      return;
    }

    const btn = document.getElementById('btn-verify-otp');
    this._setLoading(btn, true, 'Verifying...');

    setTimeout(() => {
      this._setLoading(btn, false, 'Continue');
      // Accept any 4-digit code (or the default '5110')
      this.showToast('Phone verified! ✅');
      this.navigate('profile-setup');
    }, 800);
  },

  handleResendOTP() {
    this.showToast('Code resent to your phone! 📱');
    this._startResendTimer(30);
  },

  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      Auth.logout();
      this.showToast('Logged out. See you soon! 💕');
      this.navigate('login');
    }
  },

  handleForgotPassword(e) {
    e.preventDefault();
    this.showToast('Password reset link sent to your email! 📧');
  },

  handleSocialLogin(provider) {
    this.showToast(`${provider} login coming soon! 🔜`);
  },

  handleProfileSave(e) {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    if (!name) {
      this._showFieldError('err-prof-name', 'prof-name', 'Name is required.'); return;
    }

    const btn = document.getElementById('btn-save-profile');
    this._setLoading(btn, true, 'Saving...');

    setTimeout(() => {
      const profileData = {
        name,
        dob: {
          day:   document.getElementById('prof-dob-day').value,
          month: document.getElementById('prof-dob-month').value,
          year:  document.getElementById('prof-dob-year').value
        },
        gender:  this.profileSetupData.gender || 'Male',
        country: document.getElementById('prof-country').value,
        city:    document.getElementById('prof-city').value,
        about:   document.getElementById('prof-about').value,
        photo:   this.uploadedPhotos[0]
      };

      Auth.updateProfile(profileData);
      this._setLoading(btn, false, 'Save');
      this.showToast('Profile saved! 💕');
      this.navigate('home');
    }, 800);
  },

  /* ============================================
     HANDLERS — DISCOVERY
     ============================================ */
  likeProfile() {
    const profile = HeartSyncData.profiles[this.discoverIndex % HeartSyncData.profiles.length];
    this.likedProfiles.push(profile);
    profile.liked = true;

    // Animate card
    const card = document.getElementById('discover-card');
    if (card) {
      card.classList.add('swiping-right');
      const indicator = document.getElementById('like-indicator');
      if (indicator) { indicator.style.opacity = '1'; }
    }

    this.showToast(`You liked ${profile.name.split(' ')[0]}! ❤️`);
    this.discoverIndex++;

    // Show match randomly (33% chance after liking)
    const showMatch = Math.random() < 0.33;

    setTimeout(() => {
      if (showMatch) {
        this.navigate('discover');
        setTimeout(() => this.showMatch(profile), 300);
      } else {
        this.navigate('discover');
      }
    }, 350);
  },

  passProfile() {
    const profile = HeartSyncData.profiles[this.discoverIndex % HeartSyncData.profiles.length];
    const card = document.getElementById('discover-card');
    if (card) {
      card.classList.add('swiping-left');
      const indicator = document.getElementById('pass-indicator');
      if (indicator) { indicator.style.opacity = '1'; }
    }
    this.discoverIndex++;
    setTimeout(() => this.navigate('discover'), 350);
  },

  likeProfileById(id) {
    const profile = HeartSyncData.profiles.find(p => p.id === id);
    if (profile) {
      this.likedProfiles.push(profile);
      this.showToast(`You liked ${profile.name.split(' ')[0]}! ❤️`);
      if (Math.random() < 0.33) {
        setTimeout(() => this.showMatch(profile), 500);
      }
    }
  },

  viewProfile(id) {
    const idx = HeartSyncData.profiles.findIndex(p => p.id === id);
    if (idx !== -1) this.discoverIndex = idx;
    this.navigate('profile-view');
  },

  openChatWith(id) {
    const profile = HeartSyncData.profiles.find(p => p.id === id);
    if (profile) {
      this.activeChat = profile;
      this.navigate('chat');
    }
  },

  navigateToTab(tab) {
    this.currentNav = tab;
    switch(tab) {
      case 'home':    this.navigate('home');    break;
      case 'likes':   this.navigate('likes');   break;
      case 'discover':this.navigate('discover');break;
      case 'chats':   this.navigate('chats');   break;
      case 'profile': this.navigate('profile'); break;
    }
  },

  /* ============================================
     HANDLERS — CHAT
     ============================================ */
  sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const partner = this.activeChat || HeartSyncData.profiles[0];
    const messages = HeartSyncData.chatMessages[partner.id] || HeartSyncData.chatMessages[1];

    const newMsg = {
      id: messages.length + 1,
      from: 'me',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
    };
    messages.push(newMsg);
    input.value = '';

    const chatEl = document.getElementById('chat-messages');
    if (chatEl) {
      const wrap = document.createElement('div');
      wrap.className = 'chat-bubble-wrap outgoing';
      wrap.setAttribute('role', 'listitem');
      wrap.innerHTML = `
        <div>
          <div class="chat-bubble outgoing">${text}</div>
          <div class="bubble-time" style="text-align:right">${newMsg.time}</div>
        </div>`;
      chatEl.appendChild(wrap);
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    // Auto-reply after 1.5s
    setTimeout(() => {
      const replies = ['That\'s interesting! 😊', 'Tell me more!', 'Haha, I love that! 💕', 'Sounds amazing!', '❤️'];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg = {
        id: messages.length + 1,
        from: 'them',
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
      };
      messages.push(replyMsg);

      const chatEl2 = document.getElementById('chat-messages');
      if (chatEl2) {
        const replyWrap = document.createElement('div');
        replyWrap.className = 'chat-bubble-wrap incoming';
        replyWrap.setAttribute('role', 'listitem');
        replyWrap.innerHTML = `
          <img src="${partner.image}" alt="${partner.name}" class="bubble-avatar" />
          <div>
            <div class="chat-bubble incoming">${replyText}</div>
            <div class="bubble-time">${replyMsg.time}</div>
          </div>`;
        chatEl2.appendChild(replyWrap);
        chatEl2.scrollTop = chatEl2.scrollHeight;
      }
    }, 1500);
  },

  /* ============================================
     HANDLERS — SEARCH
     ============================================ */
  handleSearch(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;

    if (!query.trim()) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Search for people</div>
          <div class="empty-state-text">Find matches by name, city, or interests</div>
        </div>`;
      return;
    }

    const q = query.toLowerCase();
    const matches = HeartSyncData.profiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.interests.some(i => i.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💔</div>
          <div class="empty-state-title">No matches found</div>
          <div class="empty-state-text">Try a different name or city</div>
        </div>`;
    } else {
      resultsEl.innerHTML = `
        <div class="profile-grid" style="padding:var(--space-sm) var(--space-md);" role="list">
          ${matches.map(p => `
          <div class="profile-card" onclick="App.viewProfile(${p.id})" role="listitem" tabindex="0">
            <img src="${p.image}" alt="${p.name}" class="profile-card-img" loading="lazy" />
            <div class="profile-card-info">
              <div class="profile-card-name">${p.name}</div>
              <div class="profile-card-meta">Age ${p.age} · ${p.distance}</div>
            </div>
          </div>`).join('')}
        </div>`;
    }
  },

  filterPeopleILike(query) {
    // Filter logic for people-i-like search
    const grid = document.getElementById('pil-grid');
    if (!grid) return;
    const items = grid.querySelectorAll('.likes-card');
    items.forEach(item => {
      const name = item.querySelector('.likes-card-name').textContent.toLowerCase();
      item.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
    });
  },

  /* ============================================
     HANDLERS — FILTER
     ============================================ */
  openFilter() {
    const modal = document.getElementById('filter-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeFilter() {
    const modal = document.getElementById('filter-modal');
    if (modal) modal.classList.add('hidden');
  },

  applyFilter() {
    const ageMin = document.getElementById('age-min');
    const ageMax = document.getElementById('age-max');
    const dist = document.getElementById('dist-range');
    const verified = document.getElementById('verified-only');

    if (ageMin) this.filterState.ageMin = parseInt(ageMin.value);
    if (ageMax) this.filterState.ageMax = parseInt(ageMax.value);
    if (dist)  this.filterState.dist = parseInt(dist.value);
    if (verified) this.filterState.verified = verified.checked;

    this.closeFilter();
    this.showToast('Filters applied! ✨');
  },

  resetFilter() {
    this.filterState = { ageMin: 18, ageMax: 40, dist: 50, gender: 'all', relation: 'all', verified: false, interests: [] };
    const ageMin = document.getElementById('age-min');
    const ageMax = document.getElementById('age-max');
    const dist = document.getElementById('dist-range');
    const verified = document.getElementById('verified-only');
    if (ageMin) { ageMin.value = 18; document.getElementById('age-min-val').textContent = 18; }
    if (ageMax) { ageMax.value = 40; document.getElementById('age-max-val').textContent = 40; }
    if (dist)   { dist.value = 50;   document.getElementById('dist-val').textContent = 50; }
    if (verified) verified.checked = false;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active', 'selected'));
    document.querySelectorAll('.chip[data-val="all"]').forEach(c => c.classList.add('chip-active'));
    this.showToast('Filters reset!');
  },

  /* ============================================
     HANDLERS — PROFILE SETUP
     ============================================ */
  selectGender(gender) {
    this.profileSetupData.gender = gender;
    document.querySelectorAll('.gender-chip').forEach(c => c.classList.remove('selected'));
    const chip = document.querySelector(`[data-gender="${gender}"]`);
    if (chip) chip.classList.add('selected');
  },

  triggerPhotoUpload(index) {
    const input = document.getElementById('photo-file-input');
    if (input) {
      input._uploadIndex = index;
      input.click();
    }
  },

  handlePhotoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const index = e.target._uploadIndex || 0;
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.uploadedPhotos[index] = ev.target.result;
      const box = document.getElementById(`photo-box-${index}`);
      if (box) {
        box.innerHTML = `
          <img src="${ev.target.result}" alt="Photo ${index+1}" class="uploaded-photo" />
          <button type="button" class="photo-remove-btn" onclick="App.removePhoto(event,${index})" aria-label="Remove photo">✕</button>`;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  },

  removePhoto(e, index) {
    e.stopPropagation();
    this.uploadedPhotos[index] = null;
    const box = document.getElementById(`photo-box-${index}`);
    if (box) {
      box.innerHTML = `
        <span class="photo-upload-icon">📷</span>
        <span class="photo-upload-text">Add Photo</span>
        <button type="button" class="photo-remove-btn" onclick="App.removePhoto(event,${index})" aria-label="Remove photo">✕</button>`;
    }
  },

  /* ============================================
     SETUP FUNCTIONS (post-render)
     ============================================ */
  _setupOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    if (!inputs.length) return;

    inputs[0].focus();

    inputs.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
        if (val && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
        input.classList.add('filled', 'fill-anim');
        setTimeout(() => input.classList.remove('fill-anim'), 200);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
          inputs[idx - 1].classList.remove('filled');
        }
      });

      // Paste support
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/\D/g, '').split('').slice(0, 4);
        digits.forEach((d, i) => {
          if (inputs[i]) {
            inputs[i].value = d;
            inputs[i].classList.add('filled');
          }
        });
        if (inputs[digits.length - 1]) inputs[digits.length - 1].focus();
      });
    });

    // Start resend countdown
    this._startResendTimer(30);
  },

  _startResendTimer(seconds) {
    const countdownEl = document.getElementById('otp-countdown');
    const resendBtn = document.getElementById('otp-resend-btn');
    const resendText = document.getElementById('otp-resend-text');
    let remaining = seconds;

    if (resendBtn) resendBtn.disabled = true;
    if (this.resendTimer) clearInterval(this.resendTimer);

    this.resendTimer = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.resendTimer);
        if (resendText) resendText.textContent = "Didn't receive it?";
        if (resendBtn) resendBtn.disabled = false;
      }
    }, 1000);
  },

  _setupProfileSetup() {
    // Pre-fill if user has profile
    const user = Auth.getCurrentUser();
    if (user && user.profile) {
      const p = user.profile;
      if (p.name && document.getElementById('prof-name')) document.getElementById('prof-name').value = p.name;
      if (p.country && document.getElementById('prof-country')) document.getElementById('prof-country').value = p.country;
      if (p.city && document.getElementById('prof-city')) document.getElementById('prof-city').value = p.city;
      if (p.about && document.getElementById('prof-about')) document.getElementById('prof-about').value = p.about;
    }
  },

  _setupSwipe() {
    const card = document.getElementById('discover-card');
    if (!card) return;

    let startX = 0, startY = 0, currentX = 0, dragging = false;

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      currentX = e.touches[0].clientX - startX;
      card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;

      const likeInd = document.getElementById('like-indicator');
      const passInd = document.getElementById('pass-indicator');
      if (currentX > 50) {
        if (likeInd) likeInd.style.opacity = Math.min(currentX / 150, 1);
        if (passInd) passInd.style.opacity = 0;
      } else if (currentX < -50) {
        if (passInd) passInd.style.opacity = Math.min(-currentX / 150, 1);
        if (likeInd) likeInd.style.opacity = 0;
      } else {
        if (likeInd) likeInd.style.opacity = 0;
        if (passInd) passInd.style.opacity = 0;
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      card.style.transform = '';
      const likeInd = document.getElementById('like-indicator');
      const passInd = document.getElementById('pass-indicator');

      if (currentX > 100) {
        this.likeProfile();
      } else if (currentX < -100) {
        this.passProfile();
      } else {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = '';
        if (likeInd) likeInd.style.opacity = 0;
        if (passInd) passInd.style.opacity = 0;
        setTimeout(() => { card.style.transition = ''; }, 300);
      }
    });

    // Mouse swipe for desktop
    card.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      dragging = true;
      card.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      currentX = e.clientX - startX;
      card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      card.style.transition = '';
      if (currentX > 100) this.likeProfile();
      else if (currentX < -100) this.passProfile();
      else card.style.transform = '';
    });
  },

  _setupChat() {
    const chatEl = document.getElementById('chat-messages');
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;

    const input = document.getElementById('chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  },

  _setupSearch() {
    // Prevent any search field from auto-triggering on render
  },

  _setupFormValidation() {
    // Add real-time validation feedback
    document.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('blur', () => {
        if (input.required && !input.value.trim()) {
          input.classList.add('input-error');
        } else {
          input.classList.remove('input-error');
        }
      });
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
      });
    });
  },

  _setupFilterChips() {
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const group = chip.dataset.group;
        if (group) {
          // Toggle for interests (multi-select)
          if (group === 'interests') {
            chip.classList.toggle('chip-active');
          } else {
            // Single select groups
            document.querySelectorAll(`.chip[data-group="${group}"]`).forEach(c => c.classList.remove('chip-active'));
            chip.classList.add('chip-active');
          }
        }
      });
    });

    // Range slider updates
    const ageMin = document.getElementById('age-min');
    const ageMax = document.getElementById('age-max');
    const distRange = document.getElementById('dist-range');

    if (ageMin) ageMin.addEventListener('input', () => {
      const minVal = parseInt(ageMin.value);
      const maxEl = document.getElementById('age-max');
      if (maxEl && parseInt(maxEl.value) < minVal) maxEl.value = minVal;
      document.getElementById('age-min-val').textContent = ageMin.value;
    });

    if (ageMax) ageMax.addEventListener('input', () => {
      document.getElementById('age-max-val').textContent = ageMax.value;
    });

    if (distRange) distRange.addEventListener('input', () => {
      document.getElementById('dist-val').textContent = distRange.value;
    });
  },

  /* ============================================
     HELPERS
     ============================================ */
  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁️';
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  },

  showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  },

  _showFieldError(errId, inputId, msg) {
    const errEl = document.getElementById(errId);
    const input = document.getElementById(inputId);
    if (errEl) {
      errEl.classList.add('visible');
      if (msg) errEl.textContent = msg;
    }
    if (input) input.classList.add('input-error');
  },

  _clearFieldError(errId, inputId) {
    const errEl = document.getElementById(errId);
    const input = document.getElementById(inputId);
    if (errEl) errEl.classList.remove('visible');
    if (input) input.classList.remove('input-error');
  },

  _setLoading(btn, loading, text) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.dataset.origText = btn.textContent;
      btn.innerHTML = `<span class="loading-spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto;"></span>`;
    } else {
      btn.disabled = false;
      btn.textContent = text || btn.dataset.origText || text;
    }
  },

  _generateHearts(count = 8) {
    const positions = [
      { top: '5%', left: '5%', size: '110px', delay: '0s', dur: '7s' },
      { top: '3%', right: '10%', size: '90px', delay: '1s', dur: '6s' },
      { top: '25%', left: '-5%', size: '75px', delay: '2s', dur: '8s' },
      { top: '20%', right: '-3%', size: '85px', delay: '0.5s', dur: '7.5s' },
      { top: '55%', left: '5%', size: '70px', delay: '3s', dur: '9s' },
      { top: '60%', right: '2%', size: '95px', delay: '1.5s', dur: '6.5s' },
      { top: '80%', left: '-2%', size: '80px', delay: '4s', dur: '8s' },
      { top: '75%', right: '5%', size: '75px', delay: '2.5s', dur: '7s' },
    ];

    return positions.slice(0, count).map(pos => `
      <div class="h-decor medium" style="
        top:${pos.top};
        ${pos.left ? `left:${pos.left}` : `right:${pos.right}`};
        font-size:${pos.size};
        animation-duration:${pos.dur};
        animation-delay:${pos.delay};
      ">🤍</div>
    `).join('');
  }
};

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', () => App.init());
