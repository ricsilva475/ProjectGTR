import { initializeApp } from "firebase/app";
import 'firebase/compat/auth';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

const firebaseConfig = {
  
  apiKey,
  authDomain: "gtr-ei.firebaseapp.com",
  databaseURL: "https://gtr-ei-default-rtdb.firebaseio.com",
  projectId: "gtr-ei",
  storageBucket: "gtr-ei.appspot.com",
  messagingSenderId: "820684122359",
  appId: "1:820684122359:web:e5dbc247f79cc722b00bf2",
  measurementId: "G-4F43FW1YVR"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db};
