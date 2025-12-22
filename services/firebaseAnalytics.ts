import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// --- HELPER FUNCTION TO TRACK EVENTS ---
export const logUserEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    logEvent(analytics, eventName, params);
    console.log(`📊 Tracking: ${eventName}`, params); // Debug log for you
  } catch (error) {
    console.error("Analytics Error:", error);
  }
};
