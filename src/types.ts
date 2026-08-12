export type CurrentView = 'home' | 'about' | 'features' | 'login' | 'signup' | 'dashboard' | 'admin-login' | 'admin-dashboard';

export type LanguageCode = 'en' | 'hi' | 'gu' | 'mr' | 'ta' | 'te';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export interface User {
  mobile: string;
  name: string;
  defaultLanguage: LanguageCode;
  signupDate: string;
  role?: 'student' | 'teacher' | 'admin';
  state?: string;
  village?: string;
  school?: string;
  standard?: string;
  board?: string;
  avatar?: string;
  totalPoints?: number;
  streakDays?: number;
  lastCheckedInDate?: string;
  todayMins?: number;
  lastActiveDate?: string;
  certificateName?: string;
  earnedCertificates?: string; // JSON string of certificates
  chatSessions?: string; // JSON string of chat sessions
  solverSessions?: string; // JSON string of solver sessions
  mascotLessonsHistory?: string; // JSON string of mascot lessons history
  activePathId?: string;
  completedMilestones?: string; // JSON string array of completed milestones
  claimedMedals?: string; // JSON string array of claimed medals
  speechRate?: number;
  speechPitch?: number;
  speechVolume?: number;
  selectedVoiceName?: string;
  studyMins?: number;
  adminPin?: string;
  checkInDates?: string; // JSON string array of YYYY-MM-DD checked-in dates
  dailyStudyLog?: string; // JSON string record of YYYY-MM-DD -> study minutes
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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface OfflineResource {
  id: string;
  title: string;
  subject: string;
  size: string;
  category: 'video' | 'pdf' | 'audio' | 'quiz';
  downloaded: boolean;
}

export interface CurriculumFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  description?: string;
  color?: string;
}

export interface CurriculumFile {
  id: string;
  name: string;
  folderId: string | null;
  subject: string;
  category: 'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other';
  size: string;
  uploadedAt: string;
  fileDataUrl?: string;
  externalUrl?: string;
  description?: string;
  standard?: string;
  board?: string;
  isVisible?: boolean;
}
