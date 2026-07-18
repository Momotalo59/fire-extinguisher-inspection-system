// ⚙️ Firebase Configuration
// ที่มา: Firebase Console - Project Settings

const firebaseConfig = {
  apiKey: "AIzaSyCxr7GT5vNodsmZSY4GlAcTZc32N82sGC0",
  authDomain: "fire-extinguisher-f40c2.firebaseapp.com",
  projectId: "fire-extinguisher-f40c2",
  storageBucket: "fire-extinguisher-f40c2.firebasestorage.app",
  messagingSenderId: "976036850060",
  appId: "1:976036850060:web:a064a0615851239db4cea9"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  const storage = firebase.storage();
  
  console.log('✅ Firebase initialized successfully!');
  console.log('🔥 Project: fire-extinguisher-f40c2');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  alert('⚠️ Firebase configuration error. Please check your config.');
}
