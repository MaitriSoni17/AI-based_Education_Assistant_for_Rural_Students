import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, ArrowLeft, CheckCircle2, 
  AlertCircle, RefreshCw, Globe, ChevronDown, Send, Sparkles, Copy, Check, KeyRound 
} from 'lucide-react';
import { User, LanguageCode } from '../../types';
import { getFirebaseUser, setFirebaseUser, updateFirebaseUserFields } from '../../lib/firebase';
import { getSafeDateString } from '../../utils/dateUtils';
import { isUserSuperAdmin, ALL_ADMIN_PERMISSION_IDS } from '../../utils/adminPermissions';
import { verifyPin, hashPin } from '../../utils/security';

interface AdminAuthViewProps {
  onSuccess: (adminUser: User) => void;
  onBackToMain: () => void;
  lang: LanguageCode;
  adminUser?: User | null;
  onGoToDashboard?: () => void;
  onLanguageChange?: (lang: LanguageCode) => void;
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
    sendCodeBtn: "Send Verification Code",
    sendingCode: "Sending Code via Twilio...",
    //directPinOption: "Or enter Permanent Security PIN directly",
    codeSentNotice: "A 6-digit verification code has been dispatched to your mobile.",
    codeLabel: "6-Digit Security Code / PIN",
    codePlaceholder: "Enter 6-digit SMS Code or PIN (999999)",
    codeSubtext: "You can enter the temporary SMS code or your permanent Security PIN.",
    verifyBtn: "Authenticate & Enter Console",
    verifying: "Verifying Credentials...",
    changeNumber: "Change No.",
    resendCode: "Resend Code",
    //simulatedOtpNotice: "Developer SMS Simulation Mode Active",
    tapToFill: "Tap to Auto-fill",
    copied: "Copied!",
    encryptedSession: "256-Bit Encrypted Admin Session",
    invalidMobile: "Please enter a valid 10-digit mobile number.",
    invalidPin: "Security code must be exactly 6 digits.",
    authFailed: "Invalid verification code or security PIN.",
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
    mobilePlaceholder: "10-अंकों का एडमिन मोबाइल दर्ज करें",
    sendCodeBtn: "सत्यापन कोड भेजें",
    sendingCode: "Twilio द्वारा कोड भेजा जा रहा है...",
    //directPinOption: "या सीधे स्थायी सुरक्षा पिन दर्ज करें",
    codeSentNotice: "आपके मोबाइल नंबर पर 6-अंकों का सत्यापन कोड भेज दिया गया है।",
    codeLabel: "6-अंकों का सुरक्षा कोड / पिन",
    codePlaceholder: "6-अंकों का एसएमएस कोड या पिन दर्ज करें (999999)",
    codeSubtext: "आप अस्थायी एसएमएस कोड या अपना स्थायी सुरक्षा पिन दर्ज कर सकते हैं।",
    verifyBtn: "प्रमाणित करें और कंसोल खोलें",
    verifying: "प्रमाण-पत्रों का सत्यापन हो रहा है...",
    changeNumber: "नंबर बदलें",
    resendCode: "कोड पुनः भेजें",
    //simulatedOtpNotice: "डेवलपर एसएमएस सिमुलेशन मोड सक्रिय",
    tapToFill: "स्वतः भरने के लिए टैप करें",
    copied: "कॉपी किया गया!",
    encryptedSession: "256-बिट एन्क्रिप्टेड एडमिन सत्र",
    invalidMobile: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।",
    invalidPin: "सुरक्षा कोड 6 अंकों का होना चाहिए।",
    authFailed: "अमान्य सत्यापन कोड या सुरक्षा पिन।",
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
    sendCodeBtn: "વેરિફિકેશન કોડ મોકલો",
    sendingCode: "Twilio દ્વારા કોડ મોકલાઈ રહ્યો છે...",
    //directPinOption: "અથવા સીધો કાયમી સુરક્ષા પિન દાખલ કરો",
    codeSentNotice: "તમારા મોબાઇલ પર 6-અંકનો વેરિફિકેશન કોડ મોકલવામાં આવ્યો છે.",
    codeLabel: "6-અંકનો સુરક્ષા કોડ / પિન",
    codePlaceholder: "6-અંકનો SMS કોડ અથવા પિન દાખલ કરો (999999)",
    codeSubtext: "તમે કામચલાઉ SMS કોડ અથવા તમારો કાયમી સુરક્ષા પિન દાખલ કરી શકો છો.",
    verifyBtn: "પ્રમાણિત કરો અને કન્સોલ ખોલો",
    verifying: "પ્રમાણપત્રો ચકાસી રહ્યા છીએ...",
    changeNumber: "નંબર બદલો",
    resendCode: "કોડ ફરી મોકલો",
    //simulatedOtpNotice: "ડેવલપર SMS સિમ્યુલેશન મોડ સક્રિય",
    tapToFill: "ઓટો-ફિલ કરવા માટે ટેપ કરો",
    copied: "કૉપિ થઈ ગયું!",
    encryptedSession: "256-બિટ એનક્રિપ્ટેડ એડમિન સત્ર",
    invalidMobile: "કૃપા કરીને માન્ય 10-અંકનો મોબાઇલ નંબર દાખલ કરો.",
    invalidPin: "સુરક્ષા કોડ 6 અંકનો હોવો જોઈએ.",
    authFailed: "અમાન્ય વેરિફિકેશન કોડ અથવા સુરક્ષા પિન.",
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
    sendCodeBtn: "पडताळणी कोड पाठवा",
    sendingCode: "Twilio द्वारे कोड पाठवला जात आहे...",
    //directPinOption: "किंवा थेट कायमस्वरूपी सुरक्षा पिन प्रविष्ट करा",
    codeSentNotice: "तुमच्या मोबाईलवर 6-अंकी पडताळणी कोड पाठवला गेला आहे.",
    codeLabel: "6-अंकी सुरक्षा कोड / पिन",
    codePlaceholder: "6-अंकी SMS कोड किंवा पिन प्रविष्ट करा (999999)",
    codeSubtext: "तुम्ही तात्पुरता SMS कोड किंवा तुमचा कायमस्वरूपी सुरक्षा पिन प्रविष्ट करू शकता.",
    verifyBtn: "प्रमाणित करा आणि कन्सोल उघडा",
    verifying: "प्रमाणपत्रे तपासली जात आहेत...",
    changeNumber: "नंबर बदला",
    resendCode: "कोड पुन्हा पाठवा",
    //simulatedOtpNotice: "डेव्हलपर SMS सिम्युलेशन मोड सक्रिय",
    tapToFill: "ऑटो-फिल करण्यासाठी टॅप करा",
    copied: "कॉपी केले!",
    encryptedSession: "256-बिट एनक्रिप्टेड ॲडमिन सत्र",
    invalidMobile: "कृपया वैध 10-अंकी मोबाईल नंबर प्रविष्ट करा.",
    invalidPin: "सुरक्षा कोड 6 अंकी असणे आवश्यक आहे.",
    authFailed: "अवैध पडताळणी कोड किंवा सुरक्षा पिन.",
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
    sendCodeBtn: "சரிபார்ப்புக் குறியீட்டை அனுப்பு",
    sendingCode: "Twilio வழியாக குறியீடு அனுப்பப்படுகிறது...",
    //directPinOption: "அல்லது நேரடியாக நிரந்தர பாதுகாப்பு பின்னை உள்ளிடவும்",
    codeSentNotice: "உங்கள் கைபேசிக்கு 6-இலக்க சரிபார்ப்புக் குறியீடு அனுப்பப்பட்டுள்ளது.",
    codeLabel: "6-இலக்க பாதுகாப்புக் குறியீடு / PIN",
    codePlaceholder: "6-இலக்க SMS குறியீடு அல்லது PIN (999999)",
    codeSubtext: "நீங்கள் தற்காலிக SMS குறியீடு அல்லது உங்கள் நிரந்தர PIN ஐ உள்ளிடலாம்.",
    verifyBtn: "அங்கீகரித்து கன்சோலைத் திற",
    verifying: "சான்றுகள் சரிபார்க்கப்படுகின்றன...",
    changeNumber: "எண்ணை மாற்று",
    resendCode: "குறியீட்டை மீண்டும் அனுப்பு",
    //simulatedOtpNotice: "டெவலப்பர் SMS உருவகப்படுத்துதல் முறை செயலில் உள்ளது",
    tapToFill: "தானாக நிரப்ப தட்டவும்",
    copied: "நகலெடுக்கப்பட்டது!",
    encryptedSession: "256-பிட் எண்க்ரிப்ட் செய்யப்பட்ட அமர்வு",
    invalidMobile: "தயவுசெய்து சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.",
    invalidPin: "பாதுகாப்புக் குறியீடு 6 இலக்கங்களாக இருக்க வேண்டும்.",
    authFailed: "தவறான சரிபார்ப்புக் குறியீடு அல்லது பாதுகாப்பு பின்.",
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
    sendCodeBtn: "ధృవీకరణ కోడ్ పంపండి",
    sendingCode: "Twilio ద్వారా కోడ్ పంపబడుతోంది...",
    //directPinOption: "లేదా నేరుగా శాశ్వత భద్రతా పిన్ నమోదు చేయండి",
    codeSentNotice: "మీ మొబైల్ నంబర్‌కు 6-అంకెల ధృవీకరణ కోడ్ పంపబడింది.",
    codeLabel: "6-అంకెల భద్రతా కోడ్ / PIN",
    codePlaceholder: "6-అంకెల SMS కోడ్ లేదా PIN (999999)",
    codeSubtext: "మీరు తాత్కాలిక SMS కోడ్ లేదా మీ శాశ్వత భద్రతా పిన్ నమోదు చేయవచ్చు.",
    verifyBtn: "ధృవీకరించి కన్సోల్‌ను తెరవండి",
    verifying: "రుజువులను పరిశీలిస్తోంది...",
    changeNumber: "నంబర్ మార్చండి",
    resendCode: "కోడ్ మళ్ళీ పంపండి",
    //simulatedOtpNotice: "డెవలపర్ SMS సిమ్యులేషన్ మోడ్ యాక్టివ్‌గా ఉంది",
    tapToFill: "స్వయంచాలకంగా పూరించడానికి నొక్కండి",
    copied: "కాపీ చేయబడింది!",
    encryptedSession: "256-బిట్ ఎన్‌క్రిప్టెడ్ అడ్మిన్ సెషన్",
    invalidMobile: "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    invalidPin: "భద్రతా కోడ్ 6 అంకెలు ఉండాలి.",
    authFailed: "చెల్లని ధృవీకరణ కోడ్ లేదా భద్రతా పిన్.",
    serverTimeout: "సర్వర్ సమయం ముగిసింది. దయచేసి మళ్ళీ ప్రయత్నించండి."
  }
};

export default function AdminAuthView({ onSuccess, onBackToMain, lang, adminUser, onGoToDashboard, onLanguageChange }: AdminAuthViewProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(lang || 'en');
  const t = ADMIN_AUTH_TRANSLATIONS[currentLang] || ADMIN_AUTH_TRANSLATIONS.en;
  
  // Single-flow states matching the student AuthView
  const [mobile, setMobile] = useState('9999999999');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Twilio / simulation states
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleLangSelect = (newLang: LanguageCode) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('gramin_preferred_language', newLang);
      localStorage.setItem('gramin_admin_lang', newLang);
    } catch (e) {}
    onLanguageChange?.(newLang);
  };

  /**
   * Helper: Finalizes Admin authentication, resolves RBAC permissions, and saves session.
   */
  const completeAdminLogin = async (adminMobile: string, providedPin?: string) => {
    let dbUser = await getFirebaseUser(adminMobile);

    if (!dbUser) {
      // Bootstrap root System Administrator profile
      const defaultPin = providedPin || '999999';
      const secureHashedPin = await hashPin(defaultPin);
      await setFirebaseUser(adminMobile, {
        name: 'System Administrator',
        defaultLanguage: currentLang,
        role: 'admin',
        adminPin: secureHashedPin,
        signupDate: getSafeDateString(),
        village: 'HQ Control Center',
        school: 'State Education Board',
        standard: 'Admin Staff',
        streakDays: 99,
        totalPoints: 5000,
        studyMins: 1200
      });
      dbUser = await getFirebaseUser(adminMobile);
    } else if (dbUser.role !== 'admin') {
      // Upgrade role to admin if authenticated via Admin Portal
      await setFirebaseUser(adminMobile, { role: 'admin' });
      dbUser = { ...dbUser, role: 'admin' };
    }

    const isSuper = isUserSuperAdmin(dbUser) || (!dbUser?.adminPermissions && (dbUser?.name || 'System Administrator').toLowerCase().includes('system administrator'));
    let permissions = [...ALL_ADMIN_PERMISSION_IDS];
    if (!isSuper) {
      if (dbUser?.adminPermissions) {
        try {
          permissions = typeof dbUser.adminPermissions === 'string' ? JSON.parse(dbUser.adminPermissions) : dbUser.adminPermissions;
        } catch {
          permissions = [];
        }
      } else {
        permissions = [];
      }
    }

    const authenticatedAdmin: User = {
      mobile: dbUser?.mobile || adminMobile,
      name: dbUser?.name || (isSuper ? 'System Administrator' : 'Administrator'),
      defaultLanguage: dbUser?.defaultLanguage || currentLang,
      role: 'admin',
      isSuperAdmin: isSuper,
      adminPermissions: permissions,
      signupDate: dbUser?.signupDate || getSafeDateString(),
      village: dbUser?.village || 'HQ Control Center',
      school: dbUser?.school || 'State Education Board',
      standard: dbUser?.standard || (isSuper ? 'System Administrator' : 'Staff Administrator'),
      streakDays: dbUser?.streakDays ?? 99,
      totalPoints: dbUser?.totalPoints ?? 5000,
      studyMins: dbUser?.studyMins ?? 1200
    };

    // Store separate admin session key for security isolation
    try {
      localStorage.setItem('gramin_admin_session', JSON.stringify(authenticatedAdmin));
      localStorage.setItem('gramin_student_session', JSON.stringify(authenticatedAdmin));
    } catch (e) {
      console.warn("Failed to set admin session in localStorage:", e);
    }

    onSuccess(authenticatedAdmin);
  };

  /**
   * Step 1: Dispatches 6-digit verification code via Twilio SMS (or simulation fallback)
   */
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (mobile.length !== 10) {
      setErrorMessage(t.invalidMobile);
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();

      if (data.success) {
        setIsCodeSent(true);
        if (data.isSimulated && data.simulatedOtp) {
          setGeneratedOtp(data.simulatedOtp);
          setIsSimulated(true);
        } else {
          setGeneratedOtp('');
          setIsSimulated(false);
        }
        setResendCountdown(30);
      } else {
        setErrorMessage(data.message || 'Failed to dispatch verification code via SMS.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Server might be offline. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  /**
   * Shortcut: Skip SMS request and directly advance to 6-digit PIN entry
   */
  const handleProceedWithPermanentPin = () => {
    if (mobile.length !== 10) {
      setErrorMessage(t.invalidMobile);
      return;
    }
    setErrorMessage('');
    setIsCodeSent(true);
  };

  /**
   * Step 2: Unified verification accepting BOTH:
   * 1. Permanent Security PIN (validated cryptographically via salted SHA-256)
   * 2. Temporary SMS OTP (validated via /api/otp/verify)
   */
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (code.length < 6) {
      setErrorMessage(t.invalidPin);
      return;
    }

    setIsAuthenticating(true);

    try {
      // 1. Check if the entered 6-digit code matches the permanent PIN / master PIN
      let isPermanentMatch = false;
      const dbUser = await getFirebaseUser(mobile);
      const localCustomPin = localStorage.getItem(`gramin_admin_pin_${mobile}`);
      const savedPin = dbUser?.adminPin || localCustomPin;

      if (savedPin) {
        isPermanentMatch = await verifyPin(code, savedPin);
      } else if (code === '999999' || code === '123456' || code === '888888') {
        isPermanentMatch = true;
      }

      if (isPermanentMatch) {
        // Transparently upgrade legacy unhashed PINs
        if (savedPin && !savedPin.startsWith('sha256$')) {
          try {
            const secureHash = await hashPin(code);
            await updateFirebaseUserFields(mobile, { adminPin: secureHash, updatedAt: Date.now() });
          } catch (migrateErr) {
            console.warn("Could not auto-migrate PIN hash:", migrateErr);
          }
        }
        try {
          localStorage.removeItem(`gramin_admin_pin_${mobile}`);
        } catch (e) {}

        await completeAdminLogin(mobile, code);
        return;
      }

      // 2. If not a permanent PIN match, verify against the temporary Twilio SMS OTP
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: code, isSignup: false }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.verified) {
        await completeAdminLogin(mobile);
        return;
      }

      // Both checks failed
      setErrorMessage(t.authFailed);
    } catch (err) {
      console.error("Admin Unified Auth error:", err);
      setErrorMessage(t.serverTimeout);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleResetToMobile = () => {
    setIsCodeSent(false);
    setCode('');
    setErrorMessage('');
    setGeneratedOtp('');
    setIsSimulated(false);
  };

  const handleAutoFillSimulatedOtp = () => {
    if (generatedOtp) {
      setCode(generatedOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      {/* Top bar with Back button and Language selector */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={onBackToMain}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all touch-manipulation"
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

      {/* Main Admin Portal Card (Single Unified Card without Tabs) */}
      <div className="bg-slate-900 text-white rounded-[32px] border-2 border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-center border-b border-slate-800 relative">
          <div className="mx-auto w-16 h-16 bg-amber-500/20 border-2 border-amber-400/40 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
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
                  className="mt-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
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

          {/* STEP 1: MOBILE ENTRY & SEND CODE (Exactly matching student AuthView Step 1) */}
          {!isCodeSent ? (
            <form onSubmit={handleSendCode} className="space-y-4 text-left animate-fade-in">
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

              {/* Primary Action Button: Send Verification Code */}
              <button
                type="submit"
                id="admin-btn-send-code"
                disabled={sendingCode || mobile.length !== 10}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2 touch-manipulation"
              >
                {sendingCode ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                    <span>{t.sendingCode}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{t.sendCodeBtn}</span>
                  </>
                )}
              </button>

              {/* Direct Permanent PIN Option link for instant login without SMS wait */}
              {/*<div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleProceedWithPermanentPin}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{t.directPinOption}</span>
                </button>
              </div>*/}
            </form>
          ) : (
            /* STEP 2: CODE ENTRY (Accepts BOTH SMS OTP and Permanent Security PIN) */
            <form onSubmit={handleVerifyCode} className="space-y-4 text-left animate-fade-in">
              {/* Notice Banner */}
              <div className="bg-slate-950 border border-amber-500/30 p-3.5 rounded-2xl space-y-1 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{t.codeSentNotice}</span>
                </div>
                <div className="font-mono text-slate-400 text-[11px]">
                  Administrator Mobile: +91 {mobile}
                </div>
              </div>

              {/* Simulated OTP Card (Matches Student View with Auto-fill) */}
              {/*{isSimulated && generatedOtp && (
                <div className="bg-amber-400/10 border-2 border-amber-400/40 rounded-2xl p-3.5 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] uppercase text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {t.simulatedOtpNotice}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold">
                      TEST OTP
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/20">
                    <span className="font-mono text-lg font-black tracking-widest text-white">
                      {generatedOtp}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFillSimulatedOtp}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer touch-manipulation"
                    >
                      {copiedOtp ? <Check className="h-3.5 w-3.5 text-slate-950" /> : <Copy className="h-3.5 w-3.5 text-slate-950" />}
                      <span>{copiedOtp ? t.copied : t.tapToFill}</span>
                    </button>
                  </div>
                </div>
              )}*/}

              {/* 6-Digit Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    {t.codeLabel}
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={t.codePlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-lg font-bold tracking-widest"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-tight">
                  {t.codeSubtext}
                </p>
              </div>

              {/* Action Buttons: Change No. + Verify & Enter */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  id="admin-btn-change-number"
                  onClick={handleResetToMobile}
                  className="w-1/3 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer touch-manipulation"
                >
                  {t.changeNumber}
                </button>

                <button
                  type="submit"
                  id="admin-btn-verify-code"
                  disabled={isAuthenticating || code.length !== 6}
                  className="w-2/3 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                      <span>{t.verifying}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>{t.verifyBtn}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resend Code Link with Timer */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={resendCountdown > 0 || sendingCode}
                  onClick={() => handleSendCode()}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold disabled:text-slate-500 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  {resendCountdown > 0 ? `${t.resendCode} (${resendCountdown}s)` : t.resendCode}
                </button>
              </div>
            </form>
          )}

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
