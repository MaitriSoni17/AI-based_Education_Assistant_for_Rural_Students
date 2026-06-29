import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Read configuration from the provisioned firebase applet config
const firebaseConfig = {
  apiKey: "AIzaSyBBwBGAskrj4yPyUjclAPNCC4uzVhMIfwk",
  authDomain: "gen-lang-client-0125275339.firebaseapp.com",
  projectId: "gen-lang-client-0125275339",
  storageBucket: "gen-lang-client-0125275339.firebasestorage.app",
  messagingSenderId: "202618466870",
  appId: "1:202618466870:web:7344cd8d1f4f0823989e97",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-aibasededucation-e226d905-d477-4f84-aefe-c91b1fb4a3ca");
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirestoreUser {
  mobile: string;
  name: string;
  defaultLanguage: 'en' | 'hi' | 'gu' | 'mr' | 'ta' | 'te';
  signupDate: string;
  village?: string;
  school?: string;
  standard?: string;
  avatar?: string;
  streakDays?: number;
  lastCheckedInDate?: string;
  totalPoints?: number;
  certificateName?: string;
  earnedCertificates?: string; // Stringified array
  claimedMedals?: string; // Stringified array
  activePathId?: string | null;
  completedMilestones?: string; // Stringified array
  chatHistoryDadi?: string; // Stringified array
  chatHistoryChanda?: string; // Stringified array
  chatHistorySwami?: string; // Stringified array
  studyMins?: number;
}

/**
 * Fetch a user profile by mobile number.
 */
export async function getFirebaseUser(mobile: string): Promise<FirestoreUser | null> {
  const path = `users/${mobile}`;
  try {
    const userDocRef = doc(db, "users", mobile);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Register a new user profile or update existing.
 */
export async function setFirebaseUser(mobile: string, userData: Partial<FirestoreUser>): Promise<void> {
  const path = `users/${mobile}`;
  try {
    const userDocRef = doc(db, "users", mobile);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      await updateDoc(userDocRef, userData);
    } else {
      // Create user
      const defaultUser: FirestoreUser = {
        mobile,
        name: userData.name || "Student",
        defaultLanguage: userData.defaultLanguage || "en",
        signupDate: userData.signupDate || new Date().toLocaleDateString(),
        avatar: "🦊",
        streakDays: 1,
        totalPoints: 15,
        studyMins: 30,
        village: "",
        school: "",
        standard: "",
        lastCheckedInDate: new Date().toLocaleDateString(),
        ...userData
      };
      await setDoc(userDocRef, defaultUser);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update specific fields in user profile.
 */
export async function updateFirebaseUserFields(mobile: string, fields: Partial<FirestoreUser>): Promise<void> {
  const path = `users/${mobile}`;
  try {
    const userDocRef = doc(db, "users", mobile);
    await updateDoc(userDocRef, fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
