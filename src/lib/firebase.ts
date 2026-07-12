import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "notre-popote",
  appId: "1:363512868439:web:6cdfb8de41e7d8c0a0fd12",
  storageBucket: "notre-popote.firebasestorage.app",
  apiKey: "AIzaSyCRVbxj5q6IMwIiX80XuCxEJrjEBbJFevc",
  authDomain: "notre-popote.firebaseapp.com",
  messagingSenderId: "363512868439"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
