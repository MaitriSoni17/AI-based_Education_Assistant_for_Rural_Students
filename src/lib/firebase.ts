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
  if (
    errMessage.includes("exceeds the maximum allowed size") ||
    errMessage.includes("cannot be written because its size")
  ) {
    console.warn("[Firestore Document Limit] Document write exceeded size limit. Local state preserved.", errMessage);
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

export const ALLOWED_FIRESTORE_USER_FIELDS: (keyof FirestoreUser)[] = [
  'mobile',
  'name',
  'defaultLanguage',
  'signupDate',
  'role',
  'state',
  'village',
  'school',
  'standard',
  'board',
  'avatar',
  'streakDays',
  'lastCheckedInDate',
  'todayMins',
  'lastActiveDate',
  'totalPoints',
  'certificateName',
  'earnedCertificates',
  'claimedMedals',
  'mascotLessonsHistory',
  'activePathId',
  'completedMilestones',
  'chatHistoryDadi',
  'chatHistoryChanda',
  'chatHistorySwami',
  'studyMins',
  'adminPin',
  'checkInDates',
  'dailyStudyLog',
  'updatedAt',
  'puzzlesSolved',
  'puzzlesAttempted',
  'puzzleAccuracy',
  'puzzleStreak',
  'puzzleSubjectProficiency',
  'puzzleStrongTopics',
  'puzzleWeakTopics',
  'puzzleStatsByClass'
];

/**
 * Sanitizes and caps the size of user data written to Firestore.
 * Firestore strictly enforces a 1,048,576 byte limit per document.
 * This function guarantees documents stay well under 600KB by:
 * 1. Filtering out non-blueprint properties (e.g. chatSessions, solverSessions with raw images).
 * 2. Pruning array sizes for mascotLessonsHistory, chat histories, and certificates.
 * 3. Ensuring no raw base64 images or oversized strings are written.
 */
export function sanitizeFirestoreUserData(
  data: Partial<FirestoreUser> & Record<string, any>,
  filterOnlyKnown: boolean = true
): Record<string, any> {
  if (!data || typeof data !== 'object') return {};

  const sanitized: Record<string, any> = {};

  if (filterOnlyKnown) {
    for (const key of ALLOWED_FIRESTORE_USER_FIELDS) {
      if (key in data && data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }
  } else {
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'chatSessions' && key !== 'solverSessions' && val !== undefined) {
        sanitized[key] = val;
      }
    }
  }

  // 1. Bound mascotLessonsHistory (keep at most 8 recent lessons, no embedded base64)
  if (typeof sanitized.mascotLessonsHistory === 'string') {
    try {
      const lessons = JSON.parse(sanitized.mascotLessonsHistory);
      if (Array.isArray(lessons)) {
        const pruned = lessons.slice(0, 8).map((l: any) => ({
          id: l.id,
          query: l.query,
          subject: l.subject,
          explanation: l.explanation ? String(l.explanation).slice(0, 1000) : '',
          videoThumbColor: l.videoThumbColor,
          avatarChar: l.avatarChar,
          avatarName: l.avatarName,
          slides: Array.isArray(l.slides) ? l.slides.slice(0, 5).map((sl: any) => ({
            id: sl.id,
            title: sl.title,
            content: sl.content ? String(sl.content).slice(0, 1500) : '',
            keyPoints: Array.isArray(sl.keyPoints) ? sl.keyPoints.slice(0, 5) : []
          })) : [],
          quiz: Array.isArray(l.quiz) ? l.quiz.slice(0, 5) : [],
          starred: !!l.starred
        }));
        sanitized.mascotLessonsHistory = JSON.stringify(pruned);
      }
    } catch {
      sanitized.mascotLessonsHistory = '[]';
    }
  }

  // 2. Bound chat histories if present (chatHistoryDadi, chatHistoryChanda, chatHistorySwami)
  const chatKeys: (keyof FirestoreUser)[] = ['chatHistoryDadi', 'chatHistoryChanda', 'chatHistorySwami'];
  for (const cKey of chatKeys) {
    if (typeof sanitized[cKey] === 'string') {
      try {
        const msgs = JSON.parse(sanitized[cKey] as string);
        if (Array.isArray(msgs)) {
          const pruned = msgs.slice(-15).map((m: any) => {
            const copy = { ...m };
            if (copy.image && typeof copy.image === 'object') {
              copy.image = {
                name: copy.image.name || 'document',
                mimeType: copy.image.mimeType || 'application/octet-stream',
                data: ''
              };
            }
            return copy;
          });
          sanitized[cKey] = JSON.stringify(pruned);
        }
      } catch {
        sanitized[cKey] = '[]';
      }
    }
  }

  // 3. Bound earnedCertificates
  if (typeof sanitized.earnedCertificates === 'string') {
    try {
      const certs = JSON.parse(sanitized.earnedCertificates);
      if (Array.isArray(certs)) {
        sanitized.earnedCertificates = JSON.stringify(certs.slice(0, 15));
      }
    } catch {
      sanitized.earnedCertificates = '[]';
    }
  }

  // 4. Bound dailyStudyLog
  if (typeof sanitized.dailyStudyLog === 'string') {
    try {
      const log = JSON.parse(sanitized.dailyStudyLog);
      if (log && typeof log === 'object') {
        const entries = Object.entries(log);
        if (entries.length > 60) {
          const trimmed = Object.fromEntries(entries.slice(-60));
          sanitized.dailyStudyLog = JSON.stringify(trimmed);
        }
      }
    } catch {
      sanitized.dailyStudyLog = '{}';
    }
  }

  // 5. Bound checkInDates
  if (typeof sanitized.checkInDates === 'string') {
    try {
      const dates = JSON.parse(sanitized.checkInDates);
      if (Array.isArray(dates) && dates.length > 60) {
        sanitized.checkInDates = JSON.stringify(dates.slice(-60));
      }
    } catch {
      sanitized.checkInDates = '[]';
    }
  }

  // 6. Overall byte size check - must stay comfortably below 600KB
  try {
    const jsonStr = JSON.stringify(sanitized);
    const byteSize = new TextEncoder().encode(jsonStr).length;
    if (byteSize > 600000) {
      console.warn(`[Firestore Sanitizer] Document byte size ${byteSize} exceeds 600KB. Compacting further...`);
      if (sanitized.mascotLessonsHistory) {
        sanitized.mascotLessonsHistory = '[]';
      }
      for (const cKey of chatKeys) {
        if (sanitized[cKey]) sanitized[cKey] = '[]';
      }
    }
  } catch (err) {
    console.warn("[Firestore Sanitizer] Size calculation error:", err);
  }

  return sanitized;
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
    streakDays: localUser.streakDays ?? 0,
    totalPoints: localUser.totalPoints ?? 0,
    studyMins: localUser.studyMins ?? 0,
    todayMins: localUser.todayMins ?? 0,
    village: localUser.village || "",
    school: localUser.school || "",
    standard: localUser.standard || "",
    lastCheckedInDate: localUser.lastCheckedInDate || "",
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
        streakDays: localUser.streakDays ?? 0,
        totalPoints: localUser.totalPoints ?? 0,
        studyMins: localUser.studyMins ?? 0,
        todayMins: localUser.todayMins ?? 0,
        village: "",
        school: "",
        standard: "",
        lastCheckedInDate: localUser.lastCheckedInDate || "",
        ...localUser,
        updatedAt: localUser.updatedAt || Date.now()
      };
      const sanitizedInitial = sanitizeFirestoreUserData(initialUser);
      await setDoc(userDocRef, sanitizedInitial);
      return { resolvedUser: sanitizedInitial as FirestoreUser, conflictResolved: false, source: 'local' };
    }

    const remoteUser = docSnap.data() as FirestoreUser;
    const remoteUpdatedAt = remoteUser.updatedAt || 0;
    const localUpdatedAt = localUser.updatedAt || 0;

    // Last-Write-Wins comparison
    if (remoteUpdatedAt > localUpdatedAt) {
      // console.log(`[LWW Conflict Resolution] Remote version is newer (${remoteUpdatedAt} > ${localUpdatedAt}). Remote wins.`);
      return { resolvedUser: remoteUser, conflictResolved: true, source: 'remote' };
    } else {
      // console.log(`[LWW Conflict Resolution] Local version is newer (${localUpdatedAt} >= ${remoteUpdatedAt}). Local wins. Updating remote.`);
      const updatedUser: FirestoreUser = {
        ...remoteUser,
        ...localUser,
        updatedAt: localUpdatedAt || Date.now() // Use latest timestamp
      };
      const sanitizedUpdated = sanitizeFirestoreUserData(updatedUser);
      await setDoc(userDocRef, sanitizedUpdated);
      return { resolvedUser: sanitizedUpdated as FirestoreUser, conflictResolved: localUpdatedAt > remoteUpdatedAt, source: 'local' };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    const fallbackUser: FirestoreUser = {
      mobile,
      name: localUser.name || "Student",
      defaultLanguage: localUser.defaultLanguage || "en",
      signupDate: localUser.signupDate || getSafeDateString(),
      avatar: getDeterministicAvatar(localUser.name || "Student", mobile),
      streakDays: localUser.streakDays ?? 0,
      totalPoints: localUser.totalPoints ?? 0,
      studyMins: localUser.studyMins ?? 0,
      todayMins: localUser.todayMins ?? 0,
      village: localUser.village || "",
      school: localUser.school || "",
      standard: localUser.standard || "",
      lastCheckedInDate: localUser.lastCheckedInDate || "",
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
      const sanitized = sanitizeFirestoreUserData(userData, false);
      if (Object.keys(sanitized).length > 0) {
        await updateDoc(userDocRef, sanitized);
      }
    } else {
      // Create user
      const defaultUser: FirestoreUser = {
        mobile,
        name: userData.name || "Student",
        defaultLanguage: userData.defaultLanguage || "en",
        signupDate: userData.signupDate || getSafeDateString(),
        avatar: getDeterministicAvatar(userData.name || "Student", mobile),
        streakDays: userData.streakDays ?? 0,
        totalPoints: userData.totalPoints ?? 0,
        studyMins: userData.studyMins ?? 0,
        todayMins: userData.todayMins ?? 0,
        village: "",
        school: "",
        standard: "",
        lastCheckedInDate: "",
        ...userData
      };
      const sanitized = sanitizeFirestoreUserData(defaultUser);
      await setDoc(userDocRef, sanitized);
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
    const sanitized = sanitizeFirestoreUserData(fields, false);
    if (Object.keys(sanitized).length > 0) {
      await updateDoc(userDocRef, sanitized);
    }
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
  language?: string;
  isGenerated?: boolean;
  isUserGenerated?: boolean;
  isPrivate?: boolean;
  createdBy?: string;
  userId?: string;
  creatorName?: string;
  isAdminUploaded?: boolean;
  uploadedByRole?: 'admin' | 'student' | 'teacher';
  fullContent?: string;
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
      // Optimized chunk size of 750,000 characters (~750KB, well within Firestore's 1MB limit)
      // This reduces network roundtrips by 75% for fast multi-file uploads
      const chunkSize = 750000;
      const chunksCount = Math.ceil(fileDataUrl.length / chunkSize);

      // Save chunks concurrently to the chunks subcollection
      const chunkPromises: Promise<void>[] = [];
      for (let i = 0; i < chunksCount; i++) {
        const chunkData = fileDataUrl.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunkDocRef = doc(db, "curriculum_files", file.id, "chunks", String(i));
        chunkPromises.push(setDoc(chunkDocRef, { data: chunkData }));
      }
      await Promise.all(chunkPromises);
    }

    // Always strip fileDataUrl from the root Firestore document to keep the document lightweight (<5KB)
    // and guarantee getAllFirebaseCurriculumFiles() is fast, reliable, and never hits document/payload size limits
    delete payload.fileDataUrl;
    (payload as any).hasChunks = !!fileDataUrl;
    (payload as any).isDeleted = false;
    (payload as any).updatedAt = new Date().toISOString();

    const cleanPayload = sanitizeFirestorePayload(payload);
    const docRef = doc(db, "curriculum_files", file.id);
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to save curriculum file to Firestore:", error);
    throw error;
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
    await setDoc(docRef, { id, isDeleted: true, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to delete curriculum file from Firestore:", error);
  }
}

/* ==========================================================================
   RAG Knowledge Base & Document Chunking - Firestore Integration
   ========================================================================== */

export interface EducationalChunk {
  id: string;
  title: string;
  subject: string;
  board: string;
  standard: string;
  topic: string;
  content: string;
  keywords: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
  score?: number;
}

export const DEFAULT_RAG_EDUCATIONAL_CHUNKS: EducationalChunk[] = [
  {
    id: "chunk-excel-basics",
    title: "Microsoft Excel & Spreadsheet Fundamentals",
    subject: "Computer Science",
    board: "CBSE",
    standard: "Class 9/10",
    topic: "Spreadsheets and Data Processing",
    content: "Microsoft Excel is a spreadsheet program used for storing, organizing, calculating, and analyzing tabular data. A workbook is composed of individual worksheets. Each worksheet consists of a grid made of rows (numbered 1, 2, 3...) and columns (lettered A, B, C...). The intersection of a row and a column is called a Cell (e.g., cell A1 is column A, row 1). Every cell can hold numbers, text, or formulas. Formulas in Excel always begin with an equal sign (=). Common built-in functions include: =SUM(A1:A10) to add numbers in a range, =AVERAGE(B1:B5) to compute arithmetic mean, =COUNT(C1:C10) to count numeric cells, =IF(condition, value_if_true, value_if_false) for logical branching, and =VLOOKUP(lookup_value, table_array, col_index, [range_lookup]) for vertical data lookup. Excel provides charts (Column, Bar, Pie, Line, Scatter) to visualize numerical trends and Pivot Tables for dynamic data summarization.",
    keywords: ["excel", "spreadsheet", "cell", "row", "column", "formula", "sum", "average", "vlookup", "charts", "workbook", "worksheet", "pivot table"],
    source: "NCERT / CBSE Class 9-10 Information & Computer Technology",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "chunk-bio-photosynthesis",
    title: "Photosynthesis & Nutrition in Plants (Life Processes)",
    subject: "Science",
    board: "CBSE",
    standard: "Class 10",
    topic: "Life Processes - Autotrophic Nutrition",
    content: "Photosynthesis is the photochemical process by which green plants and certain autotrophic organisms synthesize glucose (chemical energy) from carbon dioxide (CO2) and water (H2O) in the presence of sunlight and chlorophyll. The balanced chemical equation is: 6CO2 + 12H2O + Light Energy → C6H12O6 (Glucose) + 6O2 + 6H2O. Photosynthesis occurs in two major stages within chloroplasts: (1) Light-Dependent Reactions (in Thylakoid membranes/Grana), where photons excite chlorophyll, splitting water (Photolysis) to produce ATP, NADPH, and releasing Oxygen as a byproduct. (2) Light-Independent Reactions / Calvin Cycle (in Stroma), where ATP and NADPH reduce CO2 into glucose. Stomata (minute pores on leaves guarded by guard cells) regulate gas exchange (CO2 intake, O2 release) and transpiration.",
    keywords: ["photosynthesis", "chlorophyll", "chloroplast", "glucose", "light reaction", "calvin cycle", "stomata", "autotrophic", "life processes", "thylakoid", "stroma", "photolysis"],
    source: "NCERT Class 10 Science, Chapter 6: Life Processes",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "chunk-chem-reactions",
    title: "Chemical Reactions, Equations & Types",
    subject: "Science",
    board: "CBSE",
    standard: "Class 10",
    topic: "Chemical Reactions and Equations",
    content: "A chemical reaction is a process where one or more reactants undergo chemical bonds reorganization to form new substances called products with different properties. According to the Law of Conservation of Mass, the total mass and number of atoms of each element remain constant before and after a reaction, requiring chemical equations to be balanced. Major types of reactions include: (1) Combination Reaction (A + B → AB, e.g., CaO + H2O → Ca(OH)2 + Heat), (2) Decomposition Reaction (AB → A + B, e.g., 2FeSO4 → Fe2O3 + SO2 + SO3 upon heating), (3) Single Displacement Reaction (A + BC → AC + B, e.g., Fe + CuSO4 → FeSO4 + Cu), (4) Double Displacement Reaction (AB + CD → AD + CB, e.g., Na2SO4 + BaCl2 → BaSO4↓ + 2NaCl where BaSO4 is a white precipitate), and (5) Redox (Oxidation-Reduction) Reactions where oxidation is the gain of oxygen/loss of electrons and reduction is the loss of oxygen/gain of electrons.",
    keywords: ["chemical reaction", "equation", "balancing", "combination", "decomposition", "displacement", "double displacement", "redox", "oxidation", "reduction", "precipitate", "exothermic", "endothermic"],
    source: "NCERT Class 10 Science, Chapter 1: Chemical Reactions and Equations",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "chunk-math-quadratic",
    title: "Quadratic Equations & Roots (Algebra)",
    subject: "Mathematics",
    board: "CBSE",
    standard: "Class 10",
    topic: "Quadratic Equations",
    content: "A quadratic equation in variable x is a second-degree polynomial equation of the standard form ax^2 + bx + c = 0, where a ≠ 0 and a, b, c are real numbers. The roots (solutions) can be obtained via: (1) Factorization / Splitting the middle term, (2) Completing the square, or (3) The Quadratic Formula (Shreedharacharya's Formula): x = [-b ± √(b^2 - 4ac)] / (2a). The term D = b^2 - 4ac is called the Discriminant. The nature of roots depends strictly on D: If D > 0, the equation has two distinct real roots. If D = 0, the equation has two equal real roots (x = -b / (2a)). If D < 0, the equation has no real roots (complex roots). The sum of roots is α + β = -b/a, and the product of roots is α·β = c/a.",
    keywords: ["quadratic", "equation", "roots", "discriminant", "shreedharacharya", "algebra", "factorization", "nature of roots", "polynomial"],
    source: "NCERT Class 10 Mathematics, Chapter 4: Quadratic Equations",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "chunk-math-trigonometry",
    title: "Trigonometry, Ratios & Standard Identities",
    subject: "Mathematics",
    board: "CBSE",
    standard: "Class 10",
    topic: "Introduction to Trigonometry",
    content: "Trigonometry deals with the relationships between the sides and angles of right-angled triangles. For an acute angle θ: sin(θ) = Opposite/Hypotenuse, cos(θ) = Adjacent/Hypotenuse, tan(θ) = Opposite/Adjacent = sin(θ)/cos(θ), cosec(θ) = 1/sin(θ), sec(θ) = 1/cos(θ), and cot(θ) = 1/tan(θ). Standard angle values: sin(0°)=0, sin(30°)=1/2, sin(45°)=1/√2, sin(60°)=√3/2, sin(90°)=1; cos(0°)=1, cos(30°)=√3/2, cos(45°)=1/√2, cos(60°)=1/2, cos(90°)=0; tan(0°)=0, tan(30°)=1/√3, tan(45°)=1, tan(60°)=√3, tan(90°)=undefined. Fundamental Pythagorean Identities: (1) sin^2(θ) + cos^2(θ) = 1, (2) 1 + tan^2(θ) = sec^2(θ), (3) 1 + cot^2(θ) = cosec^2(θ).",
    keywords: ["trigonometry", "sin", "cos", "tan", "hypotenuse", "identity", "pythagorean", "ratios", "angles", "sec", "cosec", "cot"],
    source: "NCERT Class 10 Mathematics, Chapter 8: Introduction to Trigonometry",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "chunk-phy-light",
    title: "Optics: Reflection, Refraction, Snell's Law & Lenses",
    subject: "Science",
    board: "CBSE",
    standard: "Class 10",
    topic: "Light - Reflection and Refraction",
    content: "Reflection is the bouncing back of light into the same medium when it hits a polished surface. Laws of Reflection: (1) Angle of incidence (i) equals angle of reflection (r). (2) Incident ray, reflected ray, and normal at the point of incidence lie in the same plane. Mirror formula: 1/f = 1/v + 1/u (f = focal length, v = image distance, u = object distance). Magnification m = -v/u = h'/h. Refraction is the bending of light as it passes from one transparent medium to another due to change in speed. Snell's Law of Refraction: sin(i) / sin(r) = n2 / n1 = Constant (Refractive Index). Lens formula: 1/f = 1/v - 1/u. Lens Magnification: m = v/u = h'/h. Power of a lens P = 1/f (in meters), measured in Dioptres (D). Convex lens has positive power/focal length (converging); Concave lens has negative power/focal length (diverging).",
    keywords: ["light", "reflection", "refraction", "snell's law", "refractive index", "mirror formula", "lens formula", "focal length", "dioptre", "convex", "concave", "magnification"],
    source: "NCERT Class 10 Science, Chapter 10: Light - Reflection and Refraction",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "chunk-sst-nationalism",
    title: "Nationalism in India: Freedom Movement & Satyagraha",
    subject: "Social Science",
    board: "CBSE",
    standard: "Class 10",
    topic: "History - Nationalism in India",
    content: "Mahatma Gandhi returned to India from South Africa in January 1915. He introduced the concept of Satyagraha—a non-violent method of mass agitation based on truth and moral strength. Key early Satyagrahas in India: Champaran (1917, Bihar) against indigo plantation exploitation, Kheda (1917, Gujarat) for peasant revenue remission, and Ahmedabad (1918, Gujarat) for cotton mill workers. In 1919, the British passed the Rowlatt Act allowing indefinite detention without trial, leading to nationwide protests and the tragic Jallianwala Bagh massacre in Amritsar on April 13, 1919 (ordered by General Dyer). Gandhi launched the Non-Cooperation Movement in 1920 with Khilafat support, calling for boycott of British goods, schools, and courts. After the Chauri Chaura incident (February 1922) where violence occurred, Gandhi called off the movement. In 1930, Gandhi launched the Civil Disobedience Movement starting with the historic 240-mile Salt March from Sabarmati Ashram to Dandi, breaking the British salt monopoly.",
    keywords: ["gandhi", "satyagraha", "champaran", "kheda", "rowlatt act", "jallianwala bagh", "non-cooperation", "khilafat", "chauri chaura", "civil disobedience", "dandi march", "salt march", "nationalism"],
    source: "NCERT Class 10 Social Science (History), Chapter 2: Nationalism in India",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

/**
 * Fetch all educational document chunks from Firestore
 */
export async function getAllEducationalChunks(): Promise<EducationalChunk[]> {
  if (isQuotaExceeded) return DEFAULT_RAG_EDUCATIONAL_CHUNKS;
  const path = "educational_chunks";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const result: EducationalChunk[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        result.push(docSnap.data() as EducationalChunk);
      }
    });

    // If Firestore collection is empty, auto-seed default chunks and return them
    if (result.length === 0) {
      await seedDefaultEducationalChunks();
      return DEFAULT_RAG_EDUCATIONAL_CHUNKS;
    }
    return result;
  } catch (error) {
    console.warn("Failed to fetch educational chunks from Firestore:", error);
    return DEFAULT_RAG_EDUCATIONAL_CHUNKS;
  }
}

/**
 * Save / update an educational chunk in Firestore
 */
export async function saveEducationalChunk(chunk: EducationalChunk): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `educational_chunks/${chunk.id}`;
  try {
    const docRef = doc(db, "educational_chunks", chunk.id);
    const cleanPayload = sanitizeFirestorePayload({
      ...chunk,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to save educational chunk to Firestore:", error);
  }
}

/**
 * Delete an educational chunk from Firestore
 */
export async function deleteEducationalChunk(chunkId: string): Promise<void> {
  if (isQuotaExceeded) return;
  const path = `educational_chunks/${chunkId}`;
  try {
    const docRef = doc(db, "educational_chunks", chunkId);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.message?.includes("resource-exhausted") || error?.message?.includes("quota")) {
      isQuotaExceeded = true;
      disableNetwork(db).catch(() => {});
    }
    console.warn("Failed to delete educational chunk from Firestore:", error);
  }
}

/**
 * Seed initial educational syllabus chunks into Firestore if not present
 */
export async function seedDefaultEducationalChunks(): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    for (const chunk of DEFAULT_RAG_EDUCATIONAL_CHUNKS) {
      const docRef = doc(db, "educational_chunks", chunk.id);
      await setDoc(docRef, sanitizeFirestorePayload(chunk), { merge: true });
    }
  } catch (e) {
    console.warn("Failed seeding default educational chunks:", e);
  }
}

/**
 * Intelligent RAG Retrieval: Matches user query against Firestore educational chunks
 * Uses weighted multi-field semantic scoring (Title, Keywords, Topic, Content, Subject, Board)
 */
export async function queryRelevantEducationalChunks(
  queryText: string,
  options?: { board?: string; subject?: string; limit?: number }
): Promise<EducationalChunk[]> {
  const allChunks = await getAllEducationalChunks();
  if (!queryText || !queryText.trim()) return [];

  const normalizedQuery = queryText.toLowerCase().trim();
  const queryTokens = normalizedQuery
    .replace(/[^\w\s]/gi, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'with', 'from', 'have', 'been', 'about', 'explain', 'tell', 'does'].includes(t));

  const maxResults = options?.limit || 3;
  const scoredChunks: (EducationalChunk & { score: number })[] = [];

  for (const chunk of allChunks) {
    let score = 0;
    const titleLower = (chunk.title || '').toLowerCase();
    const topicLower = (chunk.topic || '').toLowerCase();
    const contentLower = (chunk.content || '').toLowerCase();
    const subjectLower = (chunk.subject || '').toLowerCase();
    const keywordsLower = (chunk.keywords || []).map(k => k.toLowerCase());

    // 1. Exact phrase matches (High weight)
    if (normalizedQuery.length > 5) {
      if (titleLower.includes(normalizedQuery)) score += 30;
      if (topicLower.includes(normalizedQuery)) score += 20;
      if (contentLower.includes(normalizedQuery)) score += 15;
    }

    // 2. Tokenized word matches
    for (const token of queryTokens) {
      // Title token match
      if (titleLower.includes(token)) score += 8;
      // Keywords exact or partial match
      if (keywordsLower.some(k => k === token)) score += 10;
      else if (keywordsLower.some(k => k.includes(token) || token.includes(k))) score += 6;
      // Topic match
      if (topicLower.includes(token)) score += 6;
      // Content frequency match (up to 4 occurrences)
      const countInContent = (contentLower.match(new RegExp(`\\b${token}`, 'g')) || []).length;
      score += Math.min(countInContent * 2, 8);
    }

    // 3. Subject and Board alignment bonus
    if (options?.subject && subjectLower.includes(options.subject.toLowerCase())) {
      score += 4;
    }
    if (options?.board && (chunk.board === 'All' || chunk.board.toLowerCase() === options.board.toLowerCase())) {
      score += 2;
    }

    if (score >= 4) {
      scoredChunks.push({
        ...chunk,
        score
      });
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, maxResults);
}




