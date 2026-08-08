import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBwBGAskrj4yPyUjclAPNCC4uzVhMIfwk",
  authDomain: "gen-lang-client-0125275339.firebaseapp.com",
  projectId: "gen-lang-client-0125275339",
  storageBucket: "gen-lang-client-0125275339.firebasestorage.app",
  messagingSenderId: "202618466870",
  appId: "1:202618466870:web:7344cd8d1f4f0823989e97",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-aibasededucation-e226d905-d477-4f84-aefe-c91b1fb4a3ca");

async function run() {
  console.log("Fetching all users...");
  const querySnapshot = await getDocs(collection(db, "users"));
  console.log(`Found ${querySnapshot.size} users:`);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`- Mobile: ${doc.id}, Name: ${data.name}, Role: ${data.role}, TotalPoints: ${data.totalPoints}, PuzzlesSolved: ${data.puzzlesSolved}, PuzzlesAttempted: ${data.puzzlesAttempted}, StatsByClass: ${data.puzzleStatsByClass ? 'YES' : 'NO'}`);
    if (data.name && data.name.toLowerCase().includes("rudra")) {
      console.log("RUDRA SONI DETAIL:", JSON.stringify(data, null, 2));
    }
  });
}

run().catch(console.error);
