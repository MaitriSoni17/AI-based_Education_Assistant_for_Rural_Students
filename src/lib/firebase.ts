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
  getDocs,
  deleteDoc,
  disableNetwork,
  setLogLevel
} from "firebase/firestore";

// Suppress raw SDK internal console errors/warnings for quota exhaustion
try {
  setLogLevel("silent");
} catch (e) {
  // ignore
}

// Intercept console.error to prevent raw Firebase SDK quota backoff noise from cluttering logs
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const firstArg = args[0] ? String(args[0]) : "";
    if (
      firstArg.includes("@firebase/firestore") &&
      (firstArg.includes("resource-exhausted") ||
        firstArg.includes("Quota limit exceeded") ||
        firstArg.includes("maximum backoff delay") ||
        firstArg.includes("Free daily write units"))
    ) {
      // Handled gracefully via local state & disableNetwork
      markFirestoreQuotaExceeded();
      return;
    }
    originalConsoleError.apply(console, args);
  };
}
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

let isQuotaExceeded = false;

if (typeof localStorage !== 'undefined') {
  const quotaTime = localStorage.getItem('gramin_firestore_quota_exceeded_time');
  if (quotaTime) {
    const elapsed = Date.now() - parseInt(quotaTime, 10);
    // Keep quota exceeded flag active for 6 hours
    if (elapsed < 6 * 60 * 60 * 1000) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    } else {
      localStorage.removeItem('gramin_firestore_quota_exceeded_time');
    }
  }
}

export function isFirestoreQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function markFirestoreQuotaExceeded(): void {
  if (!isQuotaExceeded) {
    isQuotaExceeded = true;
    console.warn("Firestore Quota Exceeded. Running in offline/local fallback mode.");
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gramin_firestore_quota_exceeded_time', String(Date.now()));
    }
    disableNetwork(db).catch(() => {});
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMessage = error instanceof Error ? error.message : String(error);
  if (
    errMessage.includes("resource-exhausted") || 
    errMessage.includes("quota") || 
    errMessage.includes("Quota limit exceeded") ||
    errMessage.includes("Free daily write units") ||
    errMessage.includes("Free daily read units")
  ) {
    markFirestoreQuotaExceeded();
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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
  role?: 'student' | 'teacher' | 'admin';
  state?: string;
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
  adminPin?: string; // Custom security PIN/Password for Admin accounts
  checkInDates?: string; // Stringified array
  dailyStudyLog?: string; // Stringified object
  updatedAt?: number; // Epoch timestamp for Last-Write-Wins conflict resolution
  puzzlesSolved?: number;
  puzzlesAttempted?: number;
  puzzleAccuracy?: number;
  puzzleStreak?: number;
  puzzleSubjectProficiency?: string; // Stringified JSON object
  puzzleStrongTopics?: string; // Stringified JSON array
  puzzleWeakTopics?: string; // Stringified JSON array
  puzzleStatsByClass?: string; // Stringified JSON object mapping class to stats
}

/**
 * Fetch a user profile by mobile number.
 */
export async function getFirebaseUser(mobile: string): Promise<FirestoreUser | null> {
  if (isQuotaExceeded) return null;
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
    return null;
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
  const fallbackUser: FirestoreUser = {
    mobile,
    name: localUser.name || "Student",
    defaultLanguage: localUser.defaultLanguage || "en",
    signupDate: localUser.signupDate || getSafeDateString(),
    avatar: getDeterministicAvatar(localUser.name || "Student", mobile),
    streakDays: localUser.streakDays || 1,
    totalPoints: localUser.totalPoints || 15,
    studyMins: localUser.studyMins || 30,
    village: localUser.village || "",
    school: localUser.school || "",
    standard: localUser.standard || "",
    lastCheckedInDate: localUser.lastCheckedInDate || getSafeDateString(),
    ...localUser
  };

  if (isQuotaExceeded) {
    return { resolvedUser: fallbackUser, conflictResolved: false, source: 'local' };
  }

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
    const fallbackUser: FirestoreUser = {
      mobile,
      name: localUser.name || "Student",
      defaultLanguage: localUser.defaultLanguage || "en",
      signupDate: localUser.signupDate || getSafeDateString(),
      avatar: getDeterministicAvatar(localUser.name || "Student", mobile),
      streakDays: localUser.streakDays || 1,
      totalPoints: localUser.totalPoints || 15,
      studyMins: localUser.studyMins || 30,
      village: localUser.village || "",
      school: localUser.school || "",
      standard: localUser.standard || "",
      lastCheckedInDate: localUser.lastCheckedInDate || getSafeDateString(),
      ...localUser
    };
    return { resolvedUser: fallbackUser, conflictResolved: false, source: 'local' };
  }
}

/**
 * Register a new user profile or update existing.
 */
export async function setFirebaseUser(mobile: string, userData: Partial<FirestoreUser>): Promise<void> {
  if (isQuotaExceeded) return;
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
  if (isQuotaExceeded) return;
  const path = `users/${mobile}`;
  try {
    const userDocRef = doc(db, "users", mobile);
    await updateDoc(userDocRef, fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all user profiles for Admin Dashboard analytics & management.
 */
export async function getAllFirebaseUsers(): Promise<FirestoreUser[]> {
  if (isQuotaExceeded) return [];
  const path = "users";
  try {
    const usersCol = collection(db, "users");
    const querySnapshot = await getDocs(usersCol);
    const usersList: FirestoreUser[] = [];
    querySnapshot.forEach((docSnap) => {
      usersList.push(docSnap.data() as FirestoreUser);
    });
    return usersList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Update user role (student, teacher, admin)
 */
export async function updateUserRole(mobile: string, role: 'student' | 'teacher' | 'admin'): Promise<void> {
  return updateFirebaseUserFields(mobile, { role, updatedAt: Date.now() });
}

/**
 * Delete a user profile (Admin action)
 */
export async function deleteFirebaseUser(mobile: string): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `users/${mobile}`;
  try {
    const userDocRef = doc(db, "users", mobile);
    await deleteDoc(userDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* ==========================================================================
   Certificates Registry - Firestore Integration
   ========================================================================== */

export interface FirestoreCertificate {
  id: string; // e.g. "CERT-2026-8819"
  studentName: string;
  studentMobile: string;
  title: string;
  date: string;
  score: number;
  status: 'valid' | 'revoked';
  issuedBy?: string;
  createdAt?: number;
}

const DEFAULT_DEMO_CERTIFICATES: FirestoreCertificate[] = [
  { id: 'CERT-2026-8819', studentName: 'Aarav Patel', studentMobile: '9876543210', title: 'Mastery in Mathematics & Algebra', date: '2026-08-01', score: 95, status: 'valid', issuedBy: 'Quiz System' },
  { id: 'CERT-2026-4421', studentName: 'Priya Sharma', studentMobile: '9812345678', title: 'General Science Excellence Award', date: '2026-08-03', score: 90, status: 'valid', issuedBy: 'Quiz System' },
  { id: 'CERT-2026-1092', studentName: 'Rahul Verma', studentMobile: '9765432109', title: 'Mascot Learning Path Completion', date: '2026-07-28', score: 88, status: 'valid', issuedBy: 'Mascot Module' },
  { id: 'CERT-2026-7734', studentName: 'Kavya Singh', studentMobile: '9654321098', title: 'Rural Science Quiz Champion', date: '2026-08-05', score: 100, status: 'valid', issuedBy: 'Admin Console' },
];

/**
 * Fetch all certificates from Firestore (combines 'certificates' collection and 'users' earnedCertificates)
 */
export async function getAllFirebaseCertificates(): Promise<FirestoreCertificate[]> {
  if (isQuotaExceeded) return DEFAULT_DEMO_CERTIFICATES;
  const path = "certificates";
  try {
    const certsMap = new Map<string, FirestoreCertificate>();

    // 1. Get explicit certificates from "certificates" collection
    try {
      const certsCol = collection(db, "certificates");
      const certsSnapshot = await getDocs(certsCol);
      certsSnapshot.forEach((docSnap) => {
        const cert = docSnap.data() as FirestoreCertificate;
        if (cert && cert.id) {
          certsMap.set(cert.id, cert);
        }
      });
    } catch (e) {
      console.warn("Could not fetch certificates collection directly:", e);
    }

    // 2. Aggregate student certificates from "users" collection
    try {
      const usersCol = collection(db, "users");
      const usersSnapshot = await getDocs(usersCol);
      usersSnapshot.forEach((userSnap) => {
        const userData = userSnap.data() as FirestoreUser;
        if (userData && userData.earnedCertificates) {
          try {
            const userCerts = JSON.parse(userData.earnedCertificates);
            if (Array.isArray(userCerts)) {
              userCerts.forEach((uc: any) => {
                const certId = uc.id || `CERT-${userSnap.id}-${Math.floor(Math.random() * 1000)}`;
                if (!certsMap.has(certId)) {
                  certsMap.set(certId, {
                    id: certId,
                    studentName: uc.recipientName || userData.name || 'Student',
                    studentMobile: userData.mobile || userSnap.id || '',
                    title: uc.quizTitle || uc.title || 'Course Completion Certificate',
                    date: uc.date || getSafeDateString(),
                    score: uc.score !== undefined ? (typeof uc.score === 'number' && uc.score <= 5 ? uc.score * 20 : uc.score) : 100,
                    status: uc.status || 'valid',
                    issuedBy: 'Student Quiz'
                  });
                }
              });
            }
          } catch (jsonErr) {
            console.error("Failed parsing earnedCertificates for user", userSnap.id, jsonErr);
          }
        }
      });
    } catch (e) {
      console.warn("Could not aggregate user earnedCertificates:", e);
    }

    // 3. Seed default certificates if database has none
    if (certsMap.size === 0) {
      for (const demoCert of DEFAULT_DEMO_CERTIFICATES) {
        certsMap.set(demoCert.id, demoCert);
        try {
          await setDoc(doc(db, "certificates", demoCert.id), demoCert);
        } catch (seedErr) {
          console.warn("Failed to seed demo cert:", demoCert.id, seedErr);
        }
      }
    }

    return Array.from(certsMap.values());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Issue or save a new certificate in Firestore
 */
export async function issueFirebaseCertificate(cert: FirestoreCertificate): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `certificates/${cert.id}`;
  try {
    const certDocRef = doc(db, "certificates", cert.id);
    await setDoc(certDocRef, {
      ...cert,
      createdAt: cert.createdAt || Date.now()
    });

    // Also attach to user document if user exists
    if (cert.studentMobile) {
      try {
        const userDocRef = doc(db, "users", cert.studentMobile);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as FirestoreUser;
          let userCerts: any[] = [];
          if (userData.earnedCertificates) {
            try {
              userCerts = JSON.parse(userData.earnedCertificates);
            } catch (e) {
              userCerts = [];
            }
          }
          const existingIndex = userCerts.findIndex((c: any) => c.id === cert.id);
          const newCertObj = {
            id: cert.id,
            quizTitle: cert.title,
            title: cert.title,
            score: cert.score || 100,
            date: cert.date,
            recipientName: cert.studentName,
            status: cert.status
          };

          if (existingIndex >= 0) {
            userCerts[existingIndex] = newCertObj;
          } else {
            userCerts.unshift(newCertObj);
          }

          await updateDoc(userDocRef, {
            earnedCertificates: JSON.stringify(userCerts),
            updatedAt: Date.now()
          });
        }
      } catch (userUpdateErr) {
        console.warn("Failed syncing certificate to user record:", userUpdateErr);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update certificate status (e.g. valid -> revoked) in Firestore
 */
export async function updateFirebaseCertificateStatus(
  id: string,
  status: 'valid' | 'revoked',
  studentMobile?: string
): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `certificates/${id}`;
  try {
    const certDocRef = doc(db, "certificates", id);
    const docSnap = await getDoc(certDocRef);
    if (docSnap.exists()) {
      await updateDoc(certDocRef, { status });
    } else {
      await setDoc(certDocRef, { id, status }, { merge: true });
    }

    // Sync with user's earnedCertificates if mobile provided
    if (studentMobile) {
      try {
        const userDocRef = doc(db, "users", studentMobile);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as FirestoreUser;
          if (userData.earnedCertificates) {
            let userCerts = JSON.parse(userData.earnedCertificates);
            if (Array.isArray(userCerts)) {
              userCerts = userCerts.map((c: any) => c.id === id ? { ...c, status } : c);
              await updateDoc(userDocRef, {
                earnedCertificates: JSON.stringify(userCerts),
                updatedAt: Date.now()
              });
            }
          }
        }
      } catch (e) {
        console.warn("Could not sync revoked status to user record:", e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a certificate from Firestore
 */
export async function deleteFirebaseCertificate(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `certificates/${id}`;
  try {
    const certDocRef = doc(db, "certificates", id);
    await deleteDoc(certDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Helper to strip undefined values so Firestore setDoc/updateDoc doesn't throw unsupported field value errors
 */
function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleanObj: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleanObj[key] = obj[key];
    }
  });
  return cleanObj;
}

/* ==========================================================================
   Curriculum Folders & Files - Firestore Integration
   ========================================================================== */

export interface FirestoreCurriculumFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  description?: string;
  color?: string;
}

export interface FirestoreCurriculumFile {
  id: string;
  name: string;
  folderId: string | null;
  subject: string;
  category: 'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other';
  materialType?: 'notes' | 'ebook' | 'pyq' | 'practice_questions' | 'other';
  size: string;
  uploadedAt: string;
  fileDataUrl?: string;
  externalUrl?: string;
  description?: string;
  standard?: string;
  board?: string;
  isVisible?: boolean;
}

/**
 * Fetch all curriculum folders from Firestore
 */
export async function getAllFirebaseCurriculumFolders(): Promise<FirestoreCurriculumFolder[]> {
  if (isQuotaExceeded) return [];
  const path = "curriculum_folders";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const result: FirestoreCurriculumFolder[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        result.push(docSnap.data() as FirestoreCurriculumFolder);
      }
    });
    return result;
  } catch (error) {
    console.warn("Failed to fetch curriculum folders from Firestore:", error);
    return [];
  }
}

/**
 * Save/update a curriculum folder in Firestore
 */
export async function saveFirebaseCurriculumFolder(folder: FirestoreCurriculumFolder): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `curriculum_folders/${folder.id}`;
  try {
    const docRef = doc(db, "curriculum_folders", folder.id);
    const cleanPayload = sanitizeFirestorePayload(folder);
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to save curriculum folder to Firestore:", error);
  }
}

/**
 * Delete a curriculum folder from Firestore
 */
export async function deleteFirebaseCurriculumFolder(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `curriculum_folders/${id}`;
  try {
    const docRef = doc(db, "curriculum_folders", id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to delete curriculum folder from Firestore:", error);
  }
}

/**
 * Fetch all curriculum files from Firestore
 */
export async function getAllFirebaseCurriculumFiles(): Promise<FirestoreCurriculumFile[]> {
  if (isQuotaExceeded) return [];
  const path = "curriculum_files";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const result: FirestoreCurriculumFile[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        result.push(docSnap.data() as FirestoreCurriculumFile);
      }
    });
    return result;
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to fetch curriculum files from Firestore:", error);
    return [];
  }
}

/**
 * Retrieve the full fileDataUrl from Firestore, reconstructing it from chunks if necessary
 */
export async function getFirebaseCurriculumFileDataUrl(fileId: string): Promise<string | null> {
  if (isQuotaExceeded) return null;
  try {
    // Try to check chunks first
    const chunksColRef = collection(db, "curriculum_files", fileId, "chunks");
    const snapshot = await getDocs(chunksColRef);
    if (!snapshot.empty) {
      const chunks: { id: number; data: string }[] = [];
      snapshot.forEach((docSnap) => {
        const id = parseInt(docSnap.id, 10);
        const data = docSnap.data().data || "";
        chunks.push({ id, data });
      });
      // Sort chunks by index
      chunks.sort((a, b) => a.id - b.id);
      return chunks.map(c => c.data).join("");
    }
    
    // Fallback: Check if it's on the main document
    const docRef = doc(db, "curriculum_files", fileId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const fileData = docSnap.data() as FirestoreCurriculumFile;
      return fileData.fileDataUrl || null;
    }
    return null;
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to retrieve curriculum file chunks from Firestore:", error);
    return null;
  }
}

/**
 * Save/update a curriculum file in Firestore
 */
export async function saveFirebaseCurriculumFile(file: FirestoreCurriculumFile): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `curriculum_files/${file.id}`;
  try {
    const payload = { ...file };
    const fileDataUrl = payload.fileDataUrl;

    // If we have fileDataUrl, save it in chunks
    if (fileDataUrl) {
      // Chunk size of 800,000 characters (approx 800KB)
      const chunkSize = 800000;
      const chunksCount = Math.ceil(fileDataUrl.length / chunkSize);

      // Save chunks to the chunks subcollection
      for (let i = 0; i < chunksCount; i++) {
        const chunkData = fileDataUrl.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunkDocRef = doc(db, "curriculum_files", file.id, "chunks", String(i));
        await setDoc(chunkDocRef, { data: chunkData });
      }
    }

    // If fileDataUrl is larger than 700KB, strip it for Firestore doc to respect 1MB doc size limit
    if (payload.fileDataUrl && payload.fileDataUrl.length > 700000) {
      delete payload.fileDataUrl;
    }
    const cleanPayload = sanitizeFirestorePayload(payload);
    const docRef = doc(db, "curriculum_files", file.id);
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to save curriculum file to Firestore:", error);
  }
}

/**
 * Delete a curriculum file from Firestore
 */
export async function deleteFirebaseCurriculumFile(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `curriculum_files/${id}`;
  try {
    // Delete chunks first if any exist
    const chunksColRef = collection(db, "curriculum_files", id, "chunks");
    const snapshot = await getDocs(chunksColRef);
    const deletePromises: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, "curriculum_files", id, "chunks", docSnap.id)));
    });
    await Promise.all(deletePromises);

    const docRef = doc(db, "curriculum_files", id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to delete curriculum file from Firestore:", error);
  }
}



