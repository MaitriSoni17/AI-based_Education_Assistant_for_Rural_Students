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
import { getDeterministicAvatar } from "../utils/avatar";
import { getSafeDateString } from "../utils/dateUtils";

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
  board?: string;
  avatar?: string;
  streakDays?: number;
  lastCheckedInDate?: string;
  todayMins?: number;
  lastActiveDate?: string;
  totalPoints?: number;
  certificateName?: string;
  earnedCertificates?: string; // Stringified array
  claimedMedals?: string; // Stringified array
  mascotLessonsHistory?: string; // Stringified array
  activePathId?: string | null;
  completedMilestones?: string; // Stringified array
  chatHistoryDadi?: string; // Stringified array
  chatHistoryChanda?: string; // Stringified array
  chatHistorySwami?: string; // Stringified array
  studyMins?: number;
  updatedAt?: number; // Epoch timestamp for Last-Write-Wins conflict resolution
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
 * Synchronize the user data with Firebase using a Last-Write-Wins (LWW) conflict resolution strategy.
 * If a student modified data on another device, the device with the higher (most recent) 'updatedAt' timestamp wins.
 */
export async function syncFirebaseUserWithLWW(
  mobile: string,
  localUser: Partial<FirestoreUser> & { updatedAt?: number }
): Promise<{ resolvedUser: FirestoreUser; conflictResolved: boolean; source: 'local' | 'remote' }> {
  const path = `users/${mobile}`;
  try {
    const userDocRef = doc(db, "users", mobile);
    const docSnap = await getDoc(userDocRef);
    
    if (!docSnap.exists()) {
      // No remote user exists yet. Initialize with local user data and current timestamp.
      const initialUser: FirestoreUser = {
        mobile,
        name: localUser.name || "Student",
        defaultLanguage: localUser.defaultLanguage || "en",
        signupDate: localUser.signupDate || getSafeDateString(),
        avatar: getDeterministicAvatar(localUser.name || "Student", mobile),
        streakDays: 1,
        totalPoints: 15,
        studyMins: 30,
        village: "",
        school: "",
        standard: "",
        lastCheckedInDate: getSafeDateString(),
        ...localUser,
        updatedAt: localUser.updatedAt || Date.now()
      };
      await setDoc(userDocRef, initialUser);
      return { resolvedUser: initialUser, conflictResolved: false, source: 'local' };
    }

    const remoteUser = docSnap.data() as FirestoreUser;
    const remoteUpdatedAt = remoteUser.updatedAt || 0;
    const localUpdatedAt = localUser.updatedAt || 0;

    // Last-Write-Wins comparison
    if (remoteUpdatedAt > localUpdatedAt) {
      console.log(`[LWW Conflict Resolution] Remote version is newer (${remoteUpdatedAt} > ${localUpdatedAt}). Remote wins.`);
      return { resolvedUser: remoteUser, conflictResolved: true, source: 'remote' };
    } else {
      console.log(`[LWW Conflict Resolution] Local version is newer (${localUpdatedAt} >= ${remoteUpdatedAt}). Local wins. Updating remote.`);
      const updatedUser: FirestoreUser = {
        ...remoteUser,
        ...localUser,
        updatedAt: localUpdatedAt || Date.now() // Use latest timestamp
      };
      await setDoc(userDocRef, updatedUser);
      return { resolvedUser: updatedUser, conflictResolved: localUpdatedAt > remoteUpdatedAt, source: 'local' };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
        signupDate: userData.signupDate || getSafeDateString(),
        avatar: getDeterministicAvatar(userData.name || "Student", mobile),
        streakDays: 1,
        totalPoints: 15,
        studyMins: 30,
        village: "",
        school: "",
        standard: "",
        lastCheckedInDate: getSafeDateString(),
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
