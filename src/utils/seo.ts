import { CurrentView, DashboardTab, AdminTab, LanguageCode } from '../types';

interface ViewSeoMeta {
  title: string;
  description: string;
}

const VIEW_SEO_MAP: Record<CurrentView, ViewSeoMeta> = {
  home: {
    title: 'GyaanBot – Multilingual AI Rural Education & Offline Study Companion',
    description: 'An offline-first, multilingual AI education assistant designed for rural students with text-to-speech support, NCERT textbooks, and interactive learning games in Hindi, Gujarati, Tamil, Telugu, Marathi, and English.'
  },
  about: {
    title: 'About Us & Rural Mission – Gramin Shiksha | GyaanBot',
    description: 'Empowering students across rural India with high-quality, vernacular, AI-powered education, offline learning modules, and digital classroom infrastructure.'
  },
  features: {
    title: 'Offline AI Tutoring & Vernacular Learning Features – GyaanBot',
    description: 'Explore voice-driven AI tutors, offline curriculum textbooks, interactive quizzes, automated video responses, and certified skill badges.'
  },
  login: {
    title: 'Student Login – GyaanBot Learning Portal',
    description: 'Access your student dashboard, daily study streaks, offline textbooks, and verified certificates on GyaanBot.'
  },
  signup: {
    title: 'Student Registration – Join GyaanBot Rural Classroom',
    description: 'Register for free vernacular learning, interactive quizzes, and personalized AI mentoring tailored to your school grade and state board.'
  },
  dashboard: {
    title: 'Student Learning Dashboard – GyaanBot',
    description: 'Track your daily study minutes, complete syllabus milestones, solve math puzzles, and earn verified credentials.'
  },
  'admin-login': {
    title: 'Administrator Login – Gramin Shiksha Central Registry',
    description: 'Secure administrative access portal for educators, principals, and system administrators.'
  },
  'admin-dashboard': {
    title: 'System Administrator Console – Gramin Shiksha',
    description: 'Manage curriculum textbooks, verify student certificates, view school analytics, and configure educator access.'
  }
};

const TAB_TITLES: Partial<Record<DashboardTab, string>> = {
  profile: 'Student Profile & XP Badges',
  'admin-pdfs': 'Textbooks & Curriculum Materials',
  'ai-assistant': 'Voice AI Study Mentor',
  tutor: 'Interactive Concept Tutor',
  quiz: 'Subject Quizzes & Knowledge Check',
  exam: 'Exam Preparation & Model Papers',
  career: 'Career Guidance & Skill Roadmaps',
  certificates: 'Verified Course Certificates',
  equations: 'Step-by-Step Math & Equation Solver',
  puzzles: 'Educational Logic Puzzles',
  settings: 'Language & Profile Preferences'
};

const ADMIN_TAB_TITLES: Partial<Record<AdminTab, string>> = {
  analytics: 'Curriculum & Student Analytics',
  content: 'Curriculum & Textbook Repository',
  certificates: 'Certificate Registry & Issuance',
  users: 'Registered Student Directory',
  settings: 'System Administration Settings'
};

export const VALID_VIEWS: CurrentView[] = [
  'home', 'about', 'features', 'login', 'signup', 'dashboard', 'admin-login', 'admin-dashboard'
];

export const VALID_TABS: DashboardTab[] = [
  'profile', 'admin-pdfs', 'ai-assistant', 'tutor', 'quiz', 'exam', 'career', 'settings', 'certificates', 'equations', 'puzzles'
];

export const VALID_ADMIN_TABS: AdminTab[] = [
  'analytics', 'content', 'certificates', 'users', 'settings'
];

/**
 * Constructs clean, search-engine indexable paths without hash fragments.
 * Example:
 *  - /dashboard/ai-assistant (instead of /#dashboard?tab=ai-assistant)
 *  - /about (instead of /#about)
 */
export function constructPath(view: CurrentView, studentTab?: DashboardTab, adminTab?: AdminTab): string {
  if (view === 'dashboard') {
    if (studentTab && studentTab !== 'profile') {
      return `/dashboard/${studentTab}`;
    }
    return '/dashboard';
  }
  if (view === 'admin-dashboard') {
    if (adminTab && adminTab !== 'analytics') {
      return `/admin/${adminTab}`;
    }
    return '/admin-dashboard';
  }
  if (view === 'admin-login') {
    return '/admin-login';
  }
  if (view === 'home') {
    return '/';
  }
  return `/${view}`;
}

/**
 * Parses current browser URL (path or legacy hash fallback) into structured view and tabs.
 * If legacy hash like /#dashboard?tab=ai-assistant is detected, it cleanly migrates the browser address bar.
 */
export function parseUrlRoute(): { view: CurrentView | null; studentTab?: DashboardTab; adminTab?: AdminTab } {
  if (typeof window === 'undefined') return { view: null };

  // 1. Backward-compatible migration from legacy hash fragments (e.g. #dashboard?tab=ai-assistant)
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash) {
    const [viewPart, queryPart] = hash.split('?');
    const view = VALID_VIEWS.includes(viewPart as CurrentView) ? (viewPart as CurrentView) : null;
    let studentTab: DashboardTab | undefined = undefined;
    let adminTab: AdminTab | undefined = undefined;

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const t = params.get('tab');
      if (view === 'dashboard' && t && VALID_TABS.includes(t as DashboardTab)) {
        studentTab = t as DashboardTab;
      } else if (view === 'admin-dashboard' && t && VALID_ADMIN_TABS.includes(t as AdminTab)) {
        adminTab = t as AdminTab;
      }
    }

    if (view) {
      const cleanPath = constructPath(view, studentTab, adminTab);
      // Migrate URL in address bar to clean path without reloading
      try {
        window.history.replaceState({ view, studentTab, adminTab }, '', cleanPath);
      } catch (e) {
        // ignore in non-browser context
      }
      return { view, studentTab, adminTab };
    }
  }

  // 2. Parse standard HTML5 pathname
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);

  if (pathname === '/' || pathname === '/home') {
    return { view: 'home' };
  }
  if (pathname === '/about') {
    return { view: 'about' };
  }
  if (pathname === '/features') {
    return { view: 'features' };
  }
  if (pathname === '/login') {
    return { view: 'login' };
  }
  if (pathname === '/signup') {
    return { view: 'signup' };
  }
  if (pathname === '/admin' || pathname === '/admin-login') {
    return { view: 'admin-login' };
  }
  if (pathname === '/admin-dashboard') {
    const tabParam = searchParams.get('tab') as AdminTab | null;
    const adminTab = (tabParam && VALID_ADMIN_TABS.includes(tabParam)) ? tabParam : 'analytics';
    return { view: 'admin-dashboard', adminTab };
  }

  // Check /admin/:adminTab
  if (pathname.startsWith('/admin/')) {
    const segment = pathname.replace('/admin/', '').split('/')[0] as AdminTab;
    if (VALID_ADMIN_TABS.includes(segment)) {
      return { view: 'admin-dashboard', adminTab: segment };
    }
    return { view: 'admin-dashboard', adminTab: 'analytics' };
  }

  // Check /dashboard/:studentTab
  if (pathname === '/dashboard') {
    const tabParam = searchParams.get('tab') as DashboardTab | null;
    const studentTab = (tabParam && VALID_TABS.includes(tabParam)) ? tabParam : 'profile';
    return { view: 'dashboard', studentTab };
  }

  if (pathname.startsWith('/dashboard/')) {
    const segment = pathname.replace('/dashboard/', '').split('/')[0] as DashboardTab;
    if (VALID_TABS.includes(segment)) {
      return { view: 'dashboard', studentTab: segment };
    }
    return { view: 'dashboard', studentTab: 'profile' };
  }

  return { view: null };
}

/**
 * Updates DOM title, meta descriptions, OpenGraph attributes, and HTML language dynamically.
 */
export function updateSeoMetadata(
  view: CurrentView,
  studentTab?: DashboardTab,
  adminTab?: AdminTab,
  language: LanguageCode = 'en'
): void {
  if (typeof document === 'undefined') return;

  // 1. Dynamic HTML Lang attribute
  document.documentElement.lang = language;

  // 2. Resolve view metadata
  let { title, description } = VIEW_SEO_MAP[view] || VIEW_SEO_MAP.home;

  if (view === 'dashboard' && studentTab && TAB_TITLES[studentTab]) {
    title = `${TAB_TITLES[studentTab]} – GyaanBot`;
  } else if (view === 'admin-dashboard' && adminTab && ADMIN_TAB_TITLES[adminTab]) {
    title = `${ADMIN_TAB_TITLES[adminTab]} – Admin Console | GyaanBot`;
  }

  // 3. Update document title
  document.title = title;

  // 4. Update Meta Description
  let metaDescTag = document.querySelector('meta[name="description"]');
  if (!metaDescTag) {
    metaDescTag = document.createElement('meta');
    metaDescTag.setAttribute('name', 'description');
    document.head.appendChild(metaDescTag);
  }
  metaDescTag.setAttribute('content', description);

  // 5. Update Open Graph Title & Description
  let ogTitleTag = document.querySelector('meta[property="og:title"]');
  if (ogTitleTag) {
    ogTitleTag.setAttribute('content', title);
  }
  let ogDescTag = document.querySelector('meta[property="og:description"]');
  if (ogDescTag) {
    ogDescTag.setAttribute('content', description);
  }

  // 6. Update Twitter Card Title & Description
  let twTitleTag = document.querySelector('meta[name="twitter:title"]');
  if (twTitleTag) {
    twTitleTag.setAttribute('content', title);
  }
  let twDescTag = document.querySelector('meta[name="twitter:description"]');
  if (twDescTag) {
    twDescTag.setAttribute('content', description);
  }

  // 7. Dynamic Canonical URL and OpenGraph URL updates for clean indexing
  try {
    const cleanPath = constructPath(view, studentTab, adminTab);
    const fullCanonicalUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${cleanPath}`
      : `https://ais-pre-a23u4lghqblnvdkhq4afuz-639537119276.asia-southeast1.run.app${cleanPath}`;

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonicalUrl);

    let ogUrlTag = document.querySelector('meta[property="og:url"]');
    if (ogUrlTag) {
      ogUrlTag.setAttribute('content', fullCanonicalUrl);
    }
  } catch (e) {
    // ignore
  }
}
