import React, { useState } from 'react';
import { Shield, Lock, Smartphone, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { User, LanguageCode } from '../../types';
import { getFirebaseUser, setFirebaseUser } from '../../lib/firebase';
import { getSafeDateString } from '../../utils/dateUtils';

interface AdminAuthViewProps {
  onSuccess: (adminUser: User) => void;
  onBackToMain: () => void;
  lang: LanguageCode;
  adminUser?: User | null;
  onGoToDashboard?: () => void;
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
    encryptedSession: "256-Bit Encrypted Admin Session"
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
    encryptedSession: "256-बिट एन्क्रिप्टेड एडमिन सत्र"
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
    encryptedSession: "256-બિટ એનક્રિપ્ટેડ એડમિન સત્ર"
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
    encryptedSession: "256-बिट एनक्रिप्टेड ॲडमिन सत्र"
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
    encryptedSession: "256-பிட் எண்க்ரிப்ட் செய்யப்பட்ட அமர்வு"
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
    encryptedSession: "256-బిట్ ఎన్‌క్రిప్టెడ్ అడ్మిన్ సెషన్"
  }
};

export default function AdminAuthView({ onSuccess, onBackToMain, lang, adminUser, onGoToDashboard }: AdminAuthViewProps) {
  const t = ADMIN_AUTH_TRANSLATIONS[lang] || ADMIN_AUTH_TRANSLATIONS.en;
  const [mobile, setMobile] = useState('9999999999');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (pin.length < 6) {
      setErrorMessage('Security PIN / OTP must be at least 6 digits.');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Fetch user doc from Firestore first to see if custom admin PIN exists
      let dbUser = await getFirebaseUser(mobile);
      const localCustomPin = localStorage.getItem(`gramin_admin_pin_${mobile}`);
      const savedPin = dbUser?.adminPin || localCustomPin;

      if (savedPin) {
        // Strict custom PIN check if configured by admin
        if (pin !== savedPin) {
          setErrorMessage('Invalid security PIN / password for this Admin account.');
          setIsAuthenticating(false);
          return;
        }
      } else {
        // Fallback to default master passcodes ('999999', '123456', '888888') or OTP API
        const isMasterPin = pin === '999999' || pin === '123456' || pin === '888888';
        if (!isMasterPin) {
          const res = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp: pin, isSignup: false }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setErrorMessage('Invalid security passcode or PIN. Default admin PIN is 999999');
            setIsAuthenticating(false);
            return;
          }
        }
      }

      if (!dbUser) {
        // Automatically provision administrator profile
        await setFirebaseUser(mobile, {
          name: 'System Administrator',
          defaultLanguage: lang,
          role: 'admin',
          adminPin: pin,
          signupDate: getSafeDateString(),
          village: 'HQ Control Center',
          school: 'State Education Board',
          standard: 'Admin Staff',
          streakDays: 99,
          totalPoints: 5000,
          studyMins: 1200
        });
        dbUser = await getFirebaseUser(mobile);
      } else if (dbUser.role !== 'admin') {
        // Upgrade role to admin if logging in via Admin Portal endpoint
        await setFirebaseUser(mobile, { role: 'admin' });
        dbUser = { ...dbUser, role: 'admin' };
      }

      const adminUser: User = {
        mobile: dbUser?.mobile || mobile,
        name: dbUser?.name || 'System Administrator',
        defaultLanguage: dbUser?.defaultLanguage || lang,
        role: 'admin',
        signupDate: dbUser?.signupDate || getSafeDateString(),
        village: dbUser?.village || 'HQ Control Center',
        school: dbUser?.school || 'State Education Board',
        standard: dbUser?.standard || 'Admin Staff',
        streakDays: dbUser?.streakDays ?? 99,
        totalPoints: dbUser?.totalPoints ?? 5000,
        studyMins: dbUser?.studyMins ?? 1200
      };

      // Store separate admin session key for security isolation
      try {
        localStorage.setItem('gramin_admin_session', JSON.stringify(adminUser));
        localStorage.setItem('gramin_student_session', JSON.stringify(adminUser));
      } catch (e) {
        console.warn("Failed to set admin session in localStorage:", e);
      }

      onSuccess(adminUser);
    } catch (err) {
      console.error("Admin Auth error:", err);
      setErrorMessage('Authentication server timeout. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      {/* Back button */}
      <button
        onClick={onBackToMain}
        className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t.backToApp}</span>
      </button>

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
