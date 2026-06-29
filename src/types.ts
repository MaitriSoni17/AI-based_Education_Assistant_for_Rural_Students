export type CurrentView = 'home' | 'about' | 'features' | 'login' | 'signup' | 'dashboard';

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
  village?: string;
  school?: string;
  standard?: string;
  avatar?: string;
  totalPoints?: number;
  streakDays?: number;
  lastCheckedInDate?: string;
  certificateName?: string;
  earnedCertificates?: string; // JSON string of certificates
  chatSessions?: string; // JSON string of chat sessions
  activePathId?: string;
  completedMilestones?: string; // JSON string array of completed milestones
  claimedMedals?: string; // JSON string array of claimed medals
  speechRate?: number;
  speechPitch?: number;
  speechVolume?: number;
  selectedVoiceName?: string;
  studyMins?: number;
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
