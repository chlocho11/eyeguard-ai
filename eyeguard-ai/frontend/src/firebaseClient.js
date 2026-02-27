import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDLKMHPg_JRCjTgQckY0gk5PUFCKppr4",
  authDomain: "eyeguard-b9df2.firebaseapp.com",
  projectId: "eyeguard-b9df2",
  storageBucket: "eyeguard-b9df2.firebasestorage.app",
  messagingSenderId: "29454022951",
  appId: "1:29454022951:web:137f4de973f3061c0b5102",
  measurementId: "G-6T1MG5KLHF"
};

const app = initializeApp(firebaseConfig);

let analytics = null;

export async function initAnalytics() {
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
}

export function track(eventName, params = {}) {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
}