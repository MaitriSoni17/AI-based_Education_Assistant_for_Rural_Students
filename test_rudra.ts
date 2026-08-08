import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as fs from "fs";

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
  const querySnapshot = await getDocs(collection(db, "users"));
  const results: any[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    results.push({ id: doc.id, ...data });
  });
  fs.writeFileSync("test_rudra_out.json", JSON.stringify(results, null, 2));
  console.log("Successfully wrote all users to test_rudra_out.json");
}

run().catch(console.error);
