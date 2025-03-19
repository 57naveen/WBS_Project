// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqv7pE6Anqt4924Cuuha2nRF4713iTwhg",
  authDomain: "workbreaksystem.firebaseapp.com",
  projectId: "workbreaksystem",
  storageBucket: "workbreaksystem.firebasestorage.app",
  messagingSenderId: "1010712944689",
  appId: "1:1010712944689:web:a983e557cac0cca5c53510",
  measurementId: "G-JSMES1Y2Z6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export const auth = getAuth();


export {  db, signInWithEmailAndPassword, signOut, onAuthStateChanged, getDoc, setDoc, doc };