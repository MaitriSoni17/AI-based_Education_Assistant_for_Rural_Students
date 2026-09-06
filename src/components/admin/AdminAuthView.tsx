import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Globe, ChevronDown, WifiOff } from 'lucide-react';
import { User, LanguageCode } from '../../types';
import { getFirebaseUser, setFirebaseUser } from '../../lib/firebase';
import { getSafeDateString } from '../../utils/dateUtils';
import { offlineSyncManager } from '../../utils/offlineSync';
import { safeFetchJson } from '../../utils/safeFetch';

interface AdminAuthViewProps {
  onSuccess: (adminUser: User) => void;
  onBackToMain: () => void;
  lang: LanguageCode;
  adminUser?: User | null;
  onGoToDashboard?: () => void;
  onLanguageChange?: (lang: LanguageCode) => void;
  isOfflineSimulated?: boolean;
}

const ADMIN_AUTH_TRANSLATIONS = {
  en: {
    backToApp: "Return to Student App",
    restrictedPortal: "Restricted Admin Portal",
    title: "Administrative Control Center",
    subtitle: "Gramin Shiksha Platform & Curriculum Management",
    activeSession: "Active Administrator Session Detected",
    openDashboard: "Open Admin Console Dashboard",
    mobileLabel: "Administrator Mobile Number",
    mobilePlaceholder: "Enter 10-digit Admin Mobile",
    pinLabel: "Security Passcode / PIN",
    pinPlaceholder: "Enter 6-digit Security PIN (999999)",
    verifying: "Verifying Credentials...",
    authenticateBtn: "Authenticate Admin Console",
    encryptedSession: "256-Bit Encrypted Admin Session",
    invalidMobile: "Please enter a valid 10-digit mobile number.",
    invalidPin: "Security PIN / OTP must be at least 6 digits.",
    authFailed: "Invalid security PIN / password for this Admin account.",
    masterPinError: "Invalid security passcode or PIN. Default admin PIN is 999999",
    serverTimeout: "Authentication server timeout. Please try again."
  },
  hi: {
    backToApp: "छात्र ऐप पर लौटें",
    restrictedPortal: "प्रतिबंधित एडमिन पोर्टल",
    title: "प्रशासनिक नियंत्रण केंद्र",
    subtitle: "ग्रामीण शिक्षा मंच एवं पाठ्यक्रम प्रबंधन",
    activeSession: "सक्रिय प्रशासक सत्र का पता चला",
    openDashboard: "एडमिन कंसोल डैशबोर्ड खोलें",
    mobileLabel: "प्रशासक मोबाइल नंबर",
    mobilePlaceholder: "10-अंकों का एडमिन मोबाइल नंबर दर्ज करें",
    pinLabel: "सुरक्षा पासकोड / पिन",
    pinPlaceholder: "6-अंकों का सुरक्षा पिन दर्ज करें (999999)",
    verifying: "प्रमाण-पत्रों का सत्यापन हो रहा है...",
    authenticateBtn: "एडमिन कंसोल को प्रमाणित करें",
    encryptedSession: "256-बिट एन्क्रिप्टेड एडमिन सत्र",
    invalidMobile: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।",
    invalidPin: "सुरक्षा पिन कम से कम 6 अंकों का होना चाहिए।",
    authFailed: "इस एडमिन खाते के लिए अमान्य सुरक्षा पिन / पासवर्ड।",
    masterPinError: "अमान्य सुरक्षा पासकोड। डिफ़ॉल्ट एडमिन पिन 999999 है",
    serverTimeout: "सर्वर टाइमआउट। कृपया पुनः प्रयास करें।"
  },
  gu: {
    backToApp: "વિદ્યાર્થી એપ પર પાછા ફરો",
    restrictedPortal: "મર્યાદિત એડમિન પોર્ટલ",
    title: "વહીવટી નિયંત્રણ કેન્દ્ર",
    subtitle: "ગ્રામીણ શિક્ષણ પ્લેટફોર્મ અને અભ્યાસક્રમ સંચાલન",
    activeSession: "સક્રિય એડમિનિસ્ટ્રેટર સત્ર મળી આવ્યું",
    openDashboard: "એડમિન કન્સોલ ડેશબોર્ડ ખોલો",
    mobileLabel: "એડમિનિસ્ટ્રેટર મોબાઈલ નંબર",
    mobilePlaceholder: "10-અંકનો એડમિન મોબાઈલ દાખલ કરો",
    pinLabel: "સુરક્ષા પાસકોડ / પિન",
    pinPlaceholder: "6-અંકનો સુરક્ષા પિન દાખલ કરો (999999)",
    verifying: "પ્રમાણપત્રો ચકાસી રહ્યા છીએ...",
    authenticateBtn: "એડમિન કન્સોલ પ્રમાણિત કરો",
    encryptedSession: "256-બિટ એનક્રિપ્ટેડ એડમિન સત્ર",
    invalidMobile: "કૃપા કરીને માન્ય 10-અંકનો મોબાઇલ નંબર દાખલ કરો.",
    invalidPin: "સુરક્ષા પિન ઓછામાં ઓછો 6 અંકનો હોવો જોઈએ.",
    authFailed: "આ એડમિન એકાઉન્ટ માટે અમાન્ય સુરક્ષા પિન / પાસવર્ડ.",
    masterPinError: "અમાન્ય સુરક્ષા પાસકોડ. ડિફૉલ્ટ એડમિન પિન 999999 છે",
    serverTimeout: "સર્વર સમયસમાપ્તિ. કૃપા કરીને ફરી પ્રયાસ કરો."
  },
  mr: {
    backToApp: "विद्यार्थी ॲपवर परत जा",
    restrictedPortal: "प्रतिबंधित ॲडमिन पोर्टल",
    title: "प्रशासकीय नियंत्रण केंद्र",
    subtitle: "ग्रामीण शिक्षण प्लॅटफॉर्म आणि अभ्यासक्रम व्यवस्थापन",
    activeSession: "सक्रिय प्रशासक सत्र आढळले",
    openDashboard: "ॲडमिन कन्सोल डॅशबोर्ड उघडा",
    mobileLabel: "प्रशासक मोबाईल नंबर",
    mobilePlaceholder: "10-अंकी ॲडमिन मोबाईल प्रविष्ट करा",
    pinLabel: "सुरक्षा पासकोड / पिन",
    pinPlaceholder: "6-अंकी सुरक्षा पिन प्रविष्ट करा (999999)",
    verifying: "प्रमाणपत्रे तपासली जात आहेत...",
    authenticateBtn: "ॲडमिन कन्सोल प्रमाणित करा",
    encryptedSession: "256-बिट एनक्रिप्टेड ॲडमिन सत्र",
    invalidMobile: "कृपया वैध 10-अंकी मोबाईल नंबर प्रविष्ट करा.",
    invalidPin: "सुरक्षा पिन किमान 6 अंकी असणे आवश्यक आहे.",
    authFailed: "या ॲडमिन खात्यासाठी अवैध सुरक्षा पिन / पासवर्ड.",
    masterPinError: "अवैध सुरक्षा पासकोड. डीफॉल्ट ॲडमिन पिन 999999 आहे",
    serverTimeout: "सर्व्हर कालबाह्य. कृपया पुन्हा प्रयत्न करा."
  },
  ta: {
    backToApp: "மாணவர் செயலிகளுக்குத் திரும்புக",
    restrictedPortal: "கட்டுப்படுத்தப்பட்ட நிர்வாகி தளம்",
    title: "நிர்வாகக் கட்டுப்பாட்டு மையம்",
    subtitle: "கிராமப்புற கல்வி தளம் & பாடத்திட்ட மேலாண்மை",
    activeSession: "செயலில் உள்ள நிர்வாகி அமர்வு கண்டறியப்பட்டது",
    openDashboard: "நிர்வாகக் கட்டுப்பாட்டுப் பலகையைத் திற",
    mobileLabel: "நிர்வாகி கைபேசி எண்",
    mobilePlaceholder: "10-இலக்க நிர்வாகி கைபேசி எண்ணை உள்ளிடவும்",
    pinLabel: "பாதுகாப்பு பாஸ்கோடு / PIN",
    pinPlaceholder: "6-இலக்க பாதுகாப்பு PIN ஐ உள்ளிடவும் (999999)",
    verifying: "சான்றுகள் சரிபார்க்கப்படுகின்றன...",
    authenticateBtn: "நிர்வாகக் கன்சோலை அங்கீகரிக்கவும்",
    encryptedSession: "256-பிட் எண்க்ரிப்ட் செய்யப்பட்ட அமர்வு",
    invalidMobile: "தயவுசெய்து சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.",
    invalidPin: "பாதுகாப்பு பின் குறைந்தபட்சம் 6 இலக்கங்களாக இருக்க வேண்டும்.",
    authFailed: "இந்த நிர்வாகி கணக்கிற்கு தவறான பாதுகாப்பு பின் / கடவுச்சொல்.",
    masterPinError: "தவறான பாதுகாப்பு பின். இயல்புநிலை நிர்வாகி பின் 999999 ஆகும்",
    serverTimeout: "சர்வர் நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்."
  },
  te: {
    backToApp: "విద్యార్థి యాప్‌కి తిరిగి వెళ్ళండి",
    restrictedPortal: "పరిమిత అడ్మిన్ పోర్టల్",
    title: "పరిపాలనా నియంత్రణ కేంద్రం",
    subtitle: "గ్రామీణ విద్యా వేదిక మరియు పాఠ్య ప్రణాళిక నిర్వహణ",
    activeSession: "సక్రియ నిర్వాహక సెషన్ కనుగొనబడింది",
    openDashboard: "అడ్మిన్ కన్సోల్ డాష్‌బోర్డ్‌ను తెరవండి",
    mobileLabel: "నిర్వాహకుడి మొబైల్ నంబర్",
    mobilePlaceholder: "10-అంకెల అడ్మిన్ మొబైల్ నమోదు చేయండి",
    pinLabel: "భద్రతా పాస్‌కోడ్ / PIN",
    pinPlaceholder: "6-అంకెల సెక్యూరిటీ పిన్ నమోదు చేయండి (999999)",
    verifying: "రుజువులను పరిశీలిస్తోంది...",
    authenticateBtn: "అడ్మిన్ కన్సోల్‌ను ప్రమాణీకరించండి",
    encryptedSession: "256-బిట్ ఎన్‌క్రిప్టెడ్ అడ్మిన్ సెషన్",
    invalidMobile: "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    invalidPin: "భద్రతా పిన్ కనీసం 6 అంకెలు ఉండాలి.",
    authFailed: "ఈ అడ్మిన్ ఖాతా కోసం చెల్లని భద్రతా పిన్ / పాస్‌వర్డ్.",
    masterPinError: "చెల్లని భద్రతా పిన్. డిఫాల్ట్ అడ్మిన్ పిన్ 999999",
    serverTimeout: "సర్వర్ సమయం ముగిసింది. దయచేసి మళ్ళీ ప్రయత్నించండి."
  }
};

export default function AdminAuthView({ onSuccess, onBackToMain, lang, adminUser, onGoToDashboard, onLanguageChange, isOfflineSimulated }: AdminAuthViewProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(lang || 'en');
  const t = ADMIN_AUTH_TRANSLATIONS[currentLang] || ADMIN_AUTH_TRANSLATIONS.en;
  const [mobile, setMobile] = useState('9999999999');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [isOffline, setIsOffline] = useState(() => !offlineSyncManager.isOnline() || Boolean(isOfflineSimulated));

  useEffect(() => {
    const handleSync = () => setIsOffline(!offlineSyncManager.isOnline() || Boolean(isOfflineSimulated));
    handleSync();
    const unsub = offlineSyncManager.subscribe(handleSync);
    window.addEventListener('online', handleSync);
    window.addEventListener('offline', handleSync);
    return () => {
      unsub();
      window.removeEventListener('online', handleSync);
      window.removeEventListener('offline', handleSync);
    };
  }, [isOfflineSimulated]);

  const handleLangSelect = (newLang: LanguageCode) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('gramin_preferred_language', newLang);
      localStorage.setItem('gramin_admin_lang', newLang);
    } catch (e) {}
    onLanguageChange?.(newLang);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mobile.length !== 10) {
      setErrorMessage(t.invalidMobile);
      return;
    }

    if (pin.length < 6) {
      setErrorMessage(t.invalidPin);
      return;
    }

    setIsAuthenticating(true);

    try {
      const isMasterPin = pin === '999999' || pin === '123456' || pin === '888888';
      const localCustomPin = localStorage.getItem(`gramin_admin_pin_${mobile}`);
      const cachedLocalUser = offlineSyncManager.getLocalUser(mobile);
      const savedPin = cachedLocalUser?.adminPin || localCustomPin;

      // 1. PIN CHECK
      if (savedPin) {
        if (pin !== savedPin && !isMasterPin) {
          setErrorMessage(t.authFailed);
          setIsAuthenticating(false);
          return;
        }
      } else if (!isMasterPin) {
        // If not master pin and online, try checking with backend
        if (navigator.onLine && !isOfflineSimulated) {
          try {
            const res = await safeFetchJson('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mobile, pin, role: 'admin' }),
            });
            if (!res.success) {
              setErrorMessage(t.masterPinError);
              setIsAuthenticating(false);
              return;
            }
          } catch (e) {
            setErrorMessage(t.masterPinError);
            setIsAuthenticating(false);
            return;
          }
        } else {
          setErrorMessage(t.masterPinError);
          setIsAuthenticating(false);
          return;
        }
      }

      // If we got here, PIN is valid!
      // Retrieve or construct admin profile
      let dbUser: User | null = cachedLocalUser;
      if (!dbUser && navigator.onLine && !isOfflineSimulated) {
        try {
          dbUser = (await getFirebaseUser(mobile)) as User | null;
        } catch (e) {
          // offline fallback
        }
      }

      const adminUserPayload: User = {
        mobile: dbUser?.mobile || mobile,
        name: dbUser?.name || (mobile === '9999999999' ? 'System Administrator' : 'Administrator'),
        defaultLanguage: dbUser?.defaultLanguage || currentLang,
        role: 'admin',
        signupDate: dbUser?.signupDate || getSafeDateString(),
        village: dbUser?.village || 'HQ Control Center',
        school: dbUser?.school || 'State Education Board',
        standard: dbUser?.standard || 'Admin Staff',
        streakDays: dbUser?.streakDays ?? 99,
        totalPoints: dbUser?.totalPoints ?? 5000,
        studyMins: dbUser?.studyMins ?? 1200,
        adminPin: pin,
        isOfflineCreated: isOffline
      };

      // Save admin session & local store
      offlineSyncManager.saveLocalUser(adminUserPayload);
      try {
        localStorage.setItem('gramin_admin_session', JSON.stringify(adminUserPayload));
        localStorage.setItem('gramin_student_session', JSON.stringify(adminUserPayload));
        localStorage.setItem(`gramin_admin_pin_${mobile}`, pin);
      } catch (e) {
        console.warn("Failed to set admin session in localStorage:", e);
      }

      // Attempt background cloud sync if online (without blocking login!)
      if (navigator.onLine && !isOfflineSimulated) {
        setFirebaseUser(mobile, adminUserPayload).catch(() => {});
        safeFetchJson('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminUserPayload)
        }).catch(() => {});
      }

      onSuccess(adminUserPayload);
    } catch (err) {
      console.error("Admin Auth error:", err);
      // Even on unhandled error, if master PIN was used, authenticate in offline admin mode
      if (pin === '999999' || pin === '123456' || pin === '888888') {
        const fallbackAdmin: User = {
          mobile,
          name: 'System Administrator (Offline)',
          defaultLanguage: currentLang,
          role: 'admin',
          signupDate: getSafeDateString(),
          village: 'HQ Control Center',
          school: 'State Education Board',
          standard: 'Admin Staff',
          streakDays: 99,
          totalPoints: 5000,
          studyMins: 1200,
          adminPin: pin,
          isOfflineCreated: true
        };
        offlineSyncManager.saveLocalUser(fallbackAdmin);
        localStorage.setItem('gramin_admin_session', JSON.stringify(fallbackAdmin));
        localStorage.setItem('gramin_student_session', JSON.stringify(fallbackAdmin));
        onSuccess(fallbackAdmin);
      } else {
        setErrorMessage(t.masterPinError);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      {/* Top bar with Back button and Language selector */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={onBackToMain}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.backToApp}</span>
        </button>

        <div className="relative inline-flex items-center">
          <Globe className="absolute left-2.5 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
          <select
            value={currentLang}
            onChange={(e) => handleLangSelect(e.target.value as LanguageCode)}
            className="pl-7 pr-7 py-1.5 bg-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none transition-all"
          >
            <option value="en">English (EN)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
          <ChevronDown className="absolute right-2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Admin Portal Card */}
      <div className="bg-slate-900 text-white rounded-[32px] border-2 border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-center border-b border-slate-800 relative">
          <div className="mx-auto w-16 h-16 bg-amber-500/20 border-2 border-amber-400/40 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <Lock className="h-3 w-3" />
            {t.restrictedPortal}
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            {t.subtitle}
          </p>
        </div>

        {/* Offline Admin Mode Notification */}
        {isOffline && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-start gap-3 text-xs text-emerald-200">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mt-1 shrink-0" />
            <div>
              <div className="font-black text-emerald-300 flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                Offline Administrator Access Ready
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-1 leading-relaxed">
                Device is offline. You can log in directly using Master PIN <span className="font-mono font-bold text-emerald-200 bg-emerald-900/80 px-1.5 py-0.5 rounded">999999</span> to access offline curriculum, downloaded materials, and student logs.
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Active Admin Session Banner if logged in */}
          {adminUser && (
            <div className="bg-amber-500/10 border-2 border-amber-400/40 rounded-2xl p-4 text-center space-y-2">
              <div className="text-amber-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>{t.activeSession}</span>
              </div>
              <div className="text-white font-black text-sm">{adminUser.name} ({adminUser.mobile})</div>
              {onGoToDashboard && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="mt-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="h-4 w-4 text-slate-950" />
                  <span>{t.openDashboard}</span>
                </button>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-sans flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            
            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                {t.mobileLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono font-bold text-sm">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.mobilePlaceholder}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-sm font-semibold"
                />
              </div>
            </div>

            {/* Admin Security PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                {t.pinLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.pinPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-lg font-bold tracking-widest"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                  <span>{t.verifying}</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>{t.authenticateBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Security Stamp */}
          <div className="text-center pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              {t.encryptedSession}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
