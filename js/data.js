/* ============================================
   HeartSync — Mock Data
   ============================================ */

const HeartSyncData = {

  /* --- Mock profiles --- */
  profiles: [
    {
      id: 1,
      name: 'Aditya Arora',
      age: 28,
      distance: '1 km',
      city: 'Mumbai',
      country: 'India',
      about: 'Music lover, foodie & adventure seeker. Looking for someone genuine to share life\'s moments with. 🎵 🏔️',
      interests: ['Music', 'Travel', 'Food', 'Fitness'],
      verified: true,
      image: 'assets/profile-aditya.jpg',
      gender: 'Male',
      relation: 'Serious',
      liked: false,
      matched: false
    },
    {
      id: 2,
      name: 'Ryan Kapoor',
      age: 24,
      distance: '3 km',
      city: 'Delhi',
      country: 'India',
      about: 'Aspiring chef and travel enthusiast. I love exploring new cultures and cuisines. Let\'s explore together! 🍕 ✈️',
      interests: ['Food', 'Travel', 'Movies', 'Art'],
      verified: true,
      image: 'assets/profile-ryan.jpg',
      gender: 'Male',
      relation: 'Casual',
      liked: false,
      matched: false
    },
    {
      id: 3,
      name: 'Vivaan Arora',
      age: 24,
      distance: '5 km',
      city: 'Mumbai',
      country: 'India',
      about: 'Software engineer by day, guitarist by night. I believe in authentic connections and real conversations. 🎸 💻',
      interests: ['Music', 'Gaming', 'Travel', 'Books'],
      verified: false,
      image: 'assets/profile-vivaan.jpg',
      gender: 'Male',
      relation: 'Serious',
      liked: false,
      matched: false
    },
    {
      id: 4,
      name: 'Arjun Malhotra',
      age: 24,
      distance: '8 km',
      city: 'Bangalore',
      country: 'India',
      about: 'Fitness fanatic and book worm. I love deep conversations over coffee. Looking for my adventure partner! ☕ 📚',
      interests: ['Fitness', 'Books', 'Art', 'Movies'],
      verified: true,
      image: 'assets/profile-arjun.jpg',
      gender: 'Male',
      relation: 'Friendship',
      liked: false,
      matched: false
    },
    {
      id: 5,
      name: 'Reyansh Suri',
      age: 26,
      distance: '2 km',
      city: 'Mumbai',
      country: 'India',
      about: 'Content creator & photographer. Capturing beautiful moments is my passion. Let\'s make some memories! 📸 🌅',
      interests: ['Art', 'Travel', 'Music', 'Food'],
      verified: true,
      image: 'assets/profile-reyansh.jpg',
      gender: 'Male',
      relation: 'Serious',
      liked: false,
      matched: false
    },
    {
      id: 6,
      name: 'Ishaan Gupta',
      age: 27,
      distance: '4 km',
      city: 'Delhi',
      country: 'India',
      about: 'Entrepreneur with a passion for sustainability. I love hiking, cooking, and meaningful conversations. 🌿 🏔️',
      interests: ['Fitness', 'Food', 'Travel', 'Books'],
      verified: false,
      image: 'assets/profile-ishaan.jpg',
      gender: 'Male',
      relation: 'Serious',
      liked: false,
      matched: false
    }
  ],

  /* --- Mock messages per chat partner --- */
  chatMessages: {
    1: [
      { id: 1, from: 'them', text: 'Hello, How are you?', time: '10:00 AM' },
      { id: 2, from: 'me', text: "I'm good, thanks for asking!", time: '10:02 AM' },
      { id: 3, from: 'them', text: 'Good 😊', time: '10:04 AM' },
      { id: 4, from: 'them', text: 'How is your day?', time: '10:05 AM' }
    ],
    2: [
      { id: 1, from: 'them', text: 'Hi ❤️', time: '12:00 PM' },
      { id: 2, from: 'me', text: 'Hey! How are you?', time: '12:01 PM' }
    ],
    3: [
      { id: 1, from: 'me', text: 'Hello! Just confirming', time: '00:40 AM' },
      { id: 2, from: 'them', text: 'Yes, confirmed! See you there', time: '00:45 AM' }
    ],
    4: [
      { id: 1, from: 'them', text: 'document I sent earlier?', time: '11:09 AM' },
      { id: 2, from: 'me', text: 'Got it, thanks!', time: '11:12 AM' }
    ]
  },

  /* --- Mock notifications --- */
  notifications: [
    {
      id: 1,
      type: 'like',
      icon: '❤️',
      avatar: 'assets/profile-aditya.jpg',
      title: 'Aditya liked your profile',
      message: 'Aditya Arora liked your profile. Check them out!',
      time: '2 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'match',
      icon: '💕',
      avatar: 'assets/profile-ryan.jpg',
      title: "You have a new match!",
      message: "You and Ryan Kapoor matched! Start a conversation.",
      time: '15 min ago',
      unread: true
    },
    {
      id: 3,
      type: 'message',
      icon: '💬',
      avatar: 'assets/profile-arjun.jpg',
      title: 'Arjun sent you a message',
      message: 'Arjun Malhotra: "Hi ❤️"',
      time: '1 hour ago',
      unread: false
    },
    {
      id: 4,
      type: 'verified',
      icon: '✅',
      avatar: null,
      title: 'Your profile was verified!',
      message: 'Congratulations! Your profile has been verified. You now have a verified badge.',
      time: '2 hours ago',
      unread: false
    },
    {
      id: 5,
      type: 'like',
      icon: '❤️',
      avatar: 'assets/profile-vivaan.jpg',
      title: 'Vivaan liked your profile',
      message: 'Vivaan Arora liked your profile.',
      time: '3 hours ago',
      unread: false
    }
  ],

  /* --- Current user (mock session) --- */
  currentUser: null
};
