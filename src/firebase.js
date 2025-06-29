// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGt5n6hDMcerUcVrJCJITuxS-BDqZs0H4",
  authDomain: "triq-50946.firebaseapp.com",
  projectId: "triq-50946",
  storageBucket: "triq-50946.firebasestorage.app",
  messagingSenderId: "30312757416",
  appId: "1:30312757416:web:5e37c43c98936aabd02a9d",
  measurementId: "G-931PEG37CS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);