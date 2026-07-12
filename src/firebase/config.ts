import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBU59RZ7F6lssSsJD1Ddh8hB1syAwo6kaU",
  authDomain: "society-maintenence.firebaseapp.com",
  projectId: "society-maintenence",
  storageBucket: "society-maintenence.firebasestorage.app",
  messagingSenderId: "545328408882",
  appId: "1:545328408882:web:c4df6a6970d2ec1c584f2b"
};


export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
