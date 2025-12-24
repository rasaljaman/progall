import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, logEvent, Analytics } from "firebase/analytics";

// 1. Load Config safely
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let analytics: Analytics | null = null;

// 2. Initialize ONLY if keys are present
if (firebaseConfig.projectId && firebaseConfig.apiKey) {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    analytics = getAnalytics(app);
    console.log("✅ Firebase Analytics Active");
  } catch (e) {
    console.warn("⚠️ Firebase Init Failed:", e);
  }
} else {
  console.warn("⚠️ Firebase Keys missing. Analytics disabled.");
}

// 3. Export a safe logging function
export const logUserEvent = (eventName: string, params?: Record<string, any>) => {
  if (!analytics) return; // Do nothing if firebase is offline
  
  try {
    logEvent(analytics, eventName, params);
    // console.log(`📊 Tracking: ${eventName}`, params);
  } catch (error) {
    console.warn("Analytics Error:", error);
  }
};
