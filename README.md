# HeartSync

HeartSync is a responsive dating platform built with React, Vite, and Firebase. It includes authentication, profiles, matchmaking, likes, and real-time interactions.

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the Firebase web app configuration values from your Firebase project.

3. Start the development server:

   ```sh
   npm run dev
   ```

Create a production build with `npm run build`; preview it locally with `npm run preview`.

## Firebase

The app uses Firebase Authentication, Cloud Firestore, and Cloud Storage. The Firebase configuration is read from the `VITE_FIREBASE_*` variables in `.env`. Do not commit `.env` or other credentials.
