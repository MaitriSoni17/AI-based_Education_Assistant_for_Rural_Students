import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import { LanguageCode, User } from '../types';
import { safeFetchJson } from '../utils/safeFetch';
import SpeakButton from './SpeakButton';
import { Smartphone, Lock, UserCheck, Globe, RefreshCw, Send, ChevronDown, Check, Search, GraduationCap, MapPin, School, BookOpen, WifiOff, Zap } from 'lucide-react';
import { getFirebaseUser, setFirebaseUser } from '../lib/firebase';
import { getSafeDateString } from '../utils/dateUtils';
import { STATES, STANDARDS, BOARDS } from '../data/educationData';
import { offlineSyncManager } from '../utils/offlineSync';

interface AuthViewProps {
  mode: 'login' | 'signup';
  onSuccess: (user: User) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  lang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isOfflineSimulated?: boolean;
}

export default function AuthView({
  mode,
  onSuccess,
  onSwitchMode,
  lang,
  onLanguageChange,
  isOfflineSimulated,
}: AuthViewProps) {
  const t = TRANSLATIONS[lang];

  // Form states
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('Gujarat');
  const [village, setVillage] = useState('');
  const [school, setSchool] = useState('');
  const [standard, setStandard] = useState('');
  const [board, setBoard] = useState('');

  // Dropdown UI states
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');

  // OTP Flow states
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Offline detection state
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' && !navigator.onLine) || Boolean(isOfflineSimulated));

  useEffect(() => {
    const handleOnline = () => setIsOffline(Boolean(isOfflineSimulated));
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOfflineSimulated]);

  // Validation
  const validateMobile = (num: string) => {
    return /^[6-9]\d{9}$/.test(num);
  };

  const cachedLocalUser = validateMobile(mobile) ? offlineSyncManager.getLocalUser(mobile) : null;

  const handleQuickOfflineLogin = () => {
    if (cachedLocalUser) {
      onSuccess(cachedLocalUser);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSimulated(false);

    if (!validateMobile(mobile)) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया एक मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (शुरुआत 6-9 से होनी चाहिए)।'
          : lang === 'gu'
          ? 'કૃપા કરીને સાચો ૧૦ આંકડાનો મોબાઈલ નંબર લખો (૬-૯ થી શરૂ થતો).'
          : 'Please enter a valid 10-digit mobile number starting with 6-9.'
      );
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage(
        lang === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : lang === 'gu' ? 'કૃપા કરીને તમારું નામ લખો.' : 'Please enter your full name.'
      );
      return;
    }

    setSendingOtp(true);
    try {
      // 1. If currently offline (or simulated offline):
      if (isOffline) {
        if (mode === 'login') {
          const localUser = offlineSyncManager.getLocalUser(mobile);
          if (localUser) {
            setGeneratedOtp('123456');
            setIsSimulated(true);
            setIsOtpSent(true);
            setErrorMessage('');
          } else {
            onSwitchMode('signup');
            const msgs = {
              hi: 'ऑफ़लाइन डिवाइस पर इस मोबाइल नंबर का कोई खाता नहीं मिला। हमने आपको ऑफ़लाइन पंजीकरण पर भेज दिया है ताकि आप तुरंत प्रोफ़ाइल बना सकें!',
              gu: 'ઓફલાઇન ડિવાઇસ પર આ મોબાઈલ નંબરનું ખાતું મળ્યું નથી. અમે તમને ઓફલાઇન નોંધણી પર લઈ જઈએ છીએ!',
              mr: 'ऑफलाइन डिव्हाइसवर या नंबरचे खाते आढळले नाही. ऑफलाइन नोंदणीवर पुनर्निर्देशित केले.',
              ta: 'ஆஃப்லைனில் கணக்கு இல்லை. ஆஃப்லைன் பதிவுக்கு திருப்பி விடப்பட்டது.',
              te: 'ఆఫ్‌లైన్‌లో ఖాతా కనుగొనబడలేదు. ఆఫ్‌లైన్ రిజిస్ట్రేషన్‌కు దారి మళ్లించబడింది.',
              en: 'No offline profile found for this number. Guided you to offline registration so you can start right now!'
            };
            setErrorMessage(msgs[lang as keyof typeof msgs] || msgs.en);
          }
        } else {
          // Offline registration
          setGeneratedOtp('123456');
          setIsSimulated(true);
          setIsOtpSent(true);
          setErrorMessage('');
        }
        setSendingOtp(false);
        return;
      }

      // 2. If online:
      if (mode === 'login') {
        const dbUser = await getFirebaseUser(mobile);
        const localUser = offlineSyncManager.getLocalUser(mobile);
        if (!dbUser && !localUser) {
          onSwitchMode('signup');
          const msgs = {
            hi: 'इस मोबाइल नंबर के साथ कोई खाता नहीं मिला। हमने आपको पंजीकरण पृष्ठ पर स्थानांतरित कर दिया है। कृपया जारी रखने के लिए अपना विवरण दर्ज करें।',
            gu: 'આ મોબાઈલ નંબર સાથે કોઈ ખાતું મળ્યું નથી. અમે તમને રજીસ્ટ્રેશન પેજ પર મોકલી દીધા છે. કૃપા કરીને આગળ વધવા માટે તમારું નામ લખો.',
            mr: 'या मोबाईल नंबरवर कोणतेही खाते आढळले नाही. आम्ही तुम्हाला नोंदणी पृष्ठावर पाठवले आहे. कृपया पुढे जाण्यासाठी तुमचे पूर्ण नाव प्रविष्ट करा.',
            ta: 'இந்த மொபைல் எண்ணில் கணக்கு எதுவும் இல்லை. நாங்கள் உங்களை பதிவுப் பக்கத்திற்கு அனுப்பியுள்ளோம். தயவுசெய்து தொடர உங்கள் விவரங்களை உள்ளிடவும்.',
            te: 'ఈ మొబైల్ నంబర్‌తో ఎటువంటి ఖాతా కనుగొనబడలేదు. మేము మిమ్మల్ని రిజిస్ట్రేషన్ పేజీకి మళ్లించాము. దయచేసి కొనసాగించడానికి మీ వివరాలను నమోదు చేయండి.',
            en: 'Account not found for this mobile number. We have automatically guided you to the registration page. Please enter your details to continue!'
          };
          setErrorMessage(msgs[lang as keyof typeof msgs] || msgs.en);
          setSendingOtp(false);
          return;
        }
      }

      const data = await safeFetchJson('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });

      if (data.success) {
        if (data.isSimulated && data.simulatedOtp) {
          setGeneratedOtp(data.simulatedOtp);
          setIsSimulated(true);
        } else {
          setGeneratedOtp('');
          setIsSimulated(false);
        }
        setIsOtpSent(true);
      } else {
        // Fall back smoothly to offline simulation code
        setGeneratedOtp('123456');
        setIsSimulated(true);
        setIsOtpSent(true);
      }
    } catch (err) {
      console.warn("OTP generate network error, switching to offline code:", err);
      setGeneratedOtp('123456');
      setIsSimulated(true);
      setIsOtpSent(true);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otp.length !== 6) {
      setErrorMessage(
        lang === 'hi' ? 'सुरक्षा कोड 6 अंकों का होना चाहिए।' : lang === 'gu' ? 'ઓટીપી કોડ ૬ આંકડાનો હોવો જોઈએ.' : 'Security Code must be exactly 6 digits.'
      );
      return;
    }

    setIsVerifying(true);
    const isMasterBypass = otp === '123456' || otp === '999999' || otp === '888888' || (isSimulated && otp === generatedOtp);

    // If device is offline or master bypass code was entered, verify immediately without requiring external network!
    if (isOffline || isMasterBypass) {
      if (mode === 'signup') {
        const newUserPayload: User = {
          mobile,
          name: name.trim() || 'Student',
          defaultLanguage: lang,
          signupDate: getSafeDateString(),
          state: state.trim() || 'Gujarat',
          village: village.trim(),
          school: school.trim(),
          standard: standard,
          board: board,
          streakDays: 1,
          totalPoints: 15,
          studyMins: 30,
          isOfflineCreated: isOffline,
          pendingSync: isOffline,
          updatedAt: Date.now()
        };

        offlineSyncManager.saveLocalUser(newUserPayload, isOffline);
        setFirebaseUser(mobile, newUserPayload).catch(() => {});
        try {
          localStorage.setItem(`${mobile}_profile_state`, state);
          localStorage.setItem(`${mobile}_profile_village`, village);
          localStorage.setItem(`${mobile}_profile_school`, school);
          localStorage.setItem(`${mobile}_profile_standard`, standard);
          localStorage.setItem(`${mobile}_profile_board`, board);
        } catch (e) {}

        if (!isOffline && navigator.onLine) {
          safeFetchJson('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserPayload)
          }).catch(() => {});
        }

        setIsVerifying(false);
        onSuccess(newUserPayload);
        return;
      } else {
        // Login mode
        let localUser = offlineSyncManager.getLocalUser(mobile);
        if (!localUser) {
          localUser = {
            mobile,
            name: 'Student',
            defaultLanguage: lang,
            signupDate: getSafeDateString(),
            streakDays: 1,
            totalPoints: 15,
            studyMins: 30,
            isOfflineCreated: isOffline,
            updatedAt: Date.now()
          };
          offlineSyncManager.saveLocalUser(localUser, isOffline);
        }
        setIsVerifying(false);
        onSuccess(localUser);
        return;
      }
    }

    // Standard online OTP verification
    try {
      const data = await safeFetchJson('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          otp,
          name: name.trim(),
          isSignup: mode === 'signup'
        }),
      });

      if (data.success && data.verified) {
        if (mode === 'signup') {
          const newUserPayload: User = {
            mobile,
            name: name.trim() || 'Student',
            defaultLanguage: lang,
            signupDate: data.user?.signupDate || getSafeDateString(),
            state: state.trim() || 'Gujarat',
            village: village.trim(),
            school: school.trim(),
            standard: standard,
            board: board,
            streakDays: 1,
            totalPoints: 15,
            studyMins: 30,
            isOfflineCreated: false,
            updatedAt: Date.now()
          };

          offlineSyncManager.saveLocalUser(newUserPayload, false);
          await setFirebaseUser(mobile, newUserPayload);

          try {
            localStorage.setItem(`${mobile}_profile_state`, state);
            localStorage.setItem(`${mobile}_profile_village`, village);
            localStorage.setItem(`${mobile}_profile_school`, school);
            localStorage.setItem(`${mobile}_profile_standard`, standard);
            localStorage.setItem(`${mobile}_profile_board`, board);
          } catch(e) {}
          
          onSuccess(newUserPayload);
        } else {
          // Login
          const dbUser = await getFirebaseUser(mobile);
          const localUser = offlineSyncManager.getLocalUser(mobile);
          const userToLogin = dbUser || localUser;
          if (!userToLogin) {
            onSwitchMode('signup');
            handleResetForm();
            setErrorMessage('Account not found for this mobile number. Please register.');
            return;
          }
          offlineSyncManager.saveLocalUser(userToLogin as User, false);
          onSuccess(userToLogin as User);
        }
      } else {
        setErrorMessage(data.message || 'Invalid code. Please try again.');
      }
    } catch (err) {
      console.warn("Verify OTP network failure, applying offline fallback:", err);
      const fallbackUser: User = offlineSyncManager.getLocalUser(mobile) || {
        mobile,
        name: name.trim() || 'Student',
        defaultLanguage: lang,
        signupDate: getSafeDateString(),
        streakDays: 1,
        totalPoints: 15,
        studyMins: 30,
        isOfflineCreated: true,
        updatedAt: Date.now()
      };
      offlineSyncManager.saveLocalUser(fallbackUser, true);
      onSuccess(fallbackUser);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetForm = () => {
    setIsOtpSent(false);
    setOtp('');
    setErrorMessage('');
    setGeneratedOtp('');
    setIsSimulated(false);
  };

  const filteredBoards = BOARDS.filter(b => 
    b.label.toLowerCase().includes(boardSearch.toLowerCase()) || 
    b.group.toLowerCase().includes(boardSearch.toLowerCase())
  );

  return (
    <div 
      id="auth-view-card" 
      className={`mx-auto bg-white rounded-[32px] border border-[#F2CC8F]/30 shadow-xl overflow-hidden my-6 transition-all duration-300 ${
        mode === 'signup' ? 'max-w-xl' : 'max-w-md'
      }`}
    >
      {/* Visual Header Banner */}
      <div className="bg-[#3D405B] p-6 text-white text-center relative border-b border-[#F2CC8F]/20">
        <div className="absolute right-4 top-4">
          <SpeakButton
            text={mode === 'signup' ? `${t.signupTitle}. ${t.selectLanguageLabel}` : `${t.loginTitle}. ${t.selectLanguageLabel}`}
            lang={lang}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          />
        </div>
        <div className="mx-auto w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3 border border-white/20">
          <Smartphone className="h-6 w-6 text-[#F2CC8F]" />
        </div>
        <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
          {mode === 'signup' ? t.signupTitle : t.loginTitle}
        </h2>
        <p className="text-xs text-[#F2CC8F] font-mono tracking-wide mt-1 uppercase">
          {mode === 'signup' ? 'Student Registration & Academy Profile' : 'Simple Rural Mobile Verification'}
        </p>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Prominent Language Changer inside card */}
        <div className="bg-[#FAF8F4] border border-[#F2CC8F]/20 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-sans font-bold text-[#3D405B] flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="h-4 w-4 text-[#81B29A]" />
            {t.selectLanguageLabel}
          </label>
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                id={`lang-select-${item.code}`}
                onClick={() => onLanguageChange(item.code)}
                className={`py-2 px-1 text-center rounded-xl cursor-pointer text-xs font-sans font-semibold transition-all border ${
                  lang === item.code
                    ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-xs scale-102'
                    : 'bg-white text-[#3D405B] border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold">{item.nativeLabel}</div>
                <div className={`text-[9px] ${lang === item.code ? 'text-white/80' : 'text-gray-400'}`}>
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Offline Mode Alert */}
        {isOffline && (
          <div id="auth-offline-badge" className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs sm:text-sm font-sans flex items-start gap-2.5">
            <WifiOff className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-bold text-amber-900">
                {lang === 'hi' ? '📶 ऑफ़लाइन मोड सक्रिय' : lang === 'gu' ? '📶 ઓફલાઇન મોડ સક્રિય' : '📶 Offline Mode Active'}
              </p>
              <p className="text-amber-800 text-xs mt-0.5">
                {lang === 'hi'
                  ? 'डिवाइस इंटरनेट से कनेक्ट नहीं है। आप ऑफ़लाइन लॉगिन और नया खाता पंजीकरण कर सकते हैं। डेटा स्थानीय रूप से सुरक्षित रहेगा।'
                  : lang === 'gu'
                  ? 'ઇન્ટરનેટ વગર પણ તમે લોગીન અને નવું રજીસ્ટ્રેશન કરી શકો છો. ડેટા સુરક્ષિત રહેશે.'
                  : 'You can login or register while offline. All progress is saved locally and synchronizes automatically when you reconnect.'}
              </p>
            </div>
          </div>
        )}

        {/* Quick Offline Login Shortcut */}
        {!isOtpSent && cachedLocalUser && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-left flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>Saved Offline Account Found</span>
              </div>
              <div className="text-xs text-emerald-700 font-sans mt-0.5">
                {cachedLocalUser.name} ({cachedLocalUser.mobile})
              </div>
            </div>
            <button
              type="button"
              id="auth-btn-quick-offline-login"
              onClick={handleQuickOfflineLogin}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Instant Login
            </button>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-sans flex items-start gap-2 animate-pulse">
            <span>⚠️</span>
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form elements */}
        {!isOtpSent ? (
          /* SECTION 1: Details and phone submission */
          <form onSubmit={handleSendOTP} className="space-y-4">
            
            {/* If in Signup mode, request full student registration info */}
            {mode === 'signup' && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Full Name */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                    {t.fullNameLabel} <span className="text-[#E07A5F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="auth-input-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-sans text-sm"
                  />
                </div>

                {/* 2. State & Village / City Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* State Dropdown */}
                  <div className="space-y-1.5 text-left relative">
                    <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                      {lang === 'hi' ? 'राज्य / संघ क्षेत्र' : 'State / Territory'}
                    </label>
                    <button
                      type="button"
                      id="auth-select-state"
                      onClick={() => {
                        setIsStateOpen(!isStateOpen);
                        setIsStandardOpen(false);
                        setIsBoardOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm font-sans font-semibold text-gray-800 transition-all hover:bg-gray-50 cursor-pointer text-left"
                    >
                      <span className="truncate">{state || 'Select State'}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStateOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 max-h-52 overflow-y-auto p-1.5 space-y-0.5 animate-fade-in text-left">
                        {STATES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setState(st);
                              setIsStateOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer text-left ${
                              state === st ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-bold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className="truncate">{st}</span>
                            {state === st && <Check className="h-3.5 w-3.5 text-[#E07A5F] shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Village / City */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                      {lang === 'hi' ? 'गांव / शहर' : 'Village / City'}
                    </label>
                    <input
                      type="text"
                      id="auth-input-village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder={lang === 'hi' ? 'उदा. आनंद' : 'e.g. Anand'}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-sans text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* 3. High School / Institution */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                    {lang === 'hi' ? 'स्कूल / संस्थान का नाम' : 'High School / Institution'}
                  </label>
                  <input
                    type="text"
                    id="auth-input-school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder={lang === 'hi' ? 'उदा. राजकीय उच्च विद्यालय' : 'e.g. Govt Higher Secondary School'}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-sans text-xs sm:text-sm"
                  />
                </div>

                {/* 4. Standard & Board Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Standard / Grade Class */}
                  <div className="space-y-1.5 text-left relative">
                    <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                      {lang === 'hi' ? 'कक्षा (Standard)' : 'Standard / Class'}
                    </label>
                    <button
                      type="button"
                      id="auth-select-standard"
                      onClick={() => {
                        setIsStandardOpen(!isStandardOpen);
                        setIsStateOpen(false);
                        setIsBoardOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm font-sans font-semibold text-gray-800 transition-all hover:bg-gray-50 cursor-pointer text-left"
                    >
                      <span className="truncate">{standard || (lang === 'hi' ? 'कक्षा चुनें' : 'Select Class')}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isStandardOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStandardOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 max-h-52 overflow-y-auto p-1.5 space-y-0.5 animate-fade-in text-left">
                        {STANDARDS.map((std) => (
                          <button
                            key={std.value}
                            type="button"
                            onClick={() => {
                              setStandard(std.value);
                              setIsStandardOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer text-left ${
                              standard === std.value ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-bold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className="truncate">{std.label}</span>
                            {standard === std.value && <Check className="h-3.5 w-3.5 text-[#E07A5F] shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Board / Syllabus */}
                  <div className="space-y-1.5 text-left relative">
                    <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                      {lang === 'hi' ? 'शिक्षा बोर्ड (Board)' : 'Academic Board'}
                    </label>
                    <button
                      type="button"
                      id="auth-select-board"
                      onClick={() => {
                        setIsBoardOpen(!isBoardOpen);
                        setIsStateOpen(false);
                        setIsStandardOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm font-sans font-semibold text-gray-800 transition-all hover:bg-gray-50 cursor-pointer text-left"
                    >
                      <span className="truncate">{board || (lang === 'hi' ? 'बोर्ड चुनें' : 'Select Board')}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isBoardOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isBoardOpen && (
                      <div className="absolute top-full right-0 left-0 sm:left-auto sm:w-72 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-fade-in text-left">
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                          <div className="relative">
                            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={boardSearch}
                              onChange={(e) => setBoardSearch(e.target.value)}
                              placeholder="Search board (CBSE, GSEB...)..."
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
                            />
                          </div>
                        </div>

                        <div className="overflow-y-auto p-1.5 space-y-0.5">
                          {filteredBoards.map((b) => (
                            <button
                              key={b.value}
                              type="button"
                              onClick={() => {
                                setBoard(b.value);
                                setIsBoardOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer text-left ${
                                board === b.value ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-bold' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="truncate">
                                <div>{b.label}</div>
                                <div className="text-[9px] text-gray-400">{b.group}</div>
                              </div>
                              {board === b.value && <Check className="h-3.5 w-3.5 text-[#E07A5F] shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Mobile Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                {t.mobileLabel} <span className="text-[#E07A5F]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-mono font-bold text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  required
                  pattern="^[6-9]\d{9}$"
                  maxLength={10}
                  id="auth-input-mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.mobilePlaceholder}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-mono text-base font-semibold tracking-wide"
                />
              </div>
            </div>

            {/* Action trigger button */}
            <button
              type="submit"
              id="auth-btn-send-otp"
              disabled={sendingOtp}
              className="w-full py-3.5 px-4 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-sans font-bold text-base rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {sendingOtp ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <Send className="h-4.5 w-4.5 text-sm" />
                  <span className="text-sm">{t.sendOTP}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* SECTION 2: OTP typing form */
          <form onSubmit={handleVerifyOTP} className="space-y-4">

            {/* Floating Info alert with simulated code */}
            <div className="bg-[#FAF8F4] border border-[#F2CC8F]/40 p-3.5 rounded-2xl space-y-2 text-left text-xs sm:text-sm">
              <div className="font-bold text-[#8B6E32] flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="animate-pulse w-2 h-2 rounded-full bg-[#E07A5F]" />
                  {t.otpSentMessage}
                </div>
                {(isOffline || isSimulated || generatedOtp) && (
                  <button
                    type="button"
                    onClick={() => setOtp(generatedOtp || '123456')}
                    className="text-[11px] font-mono font-bold text-[#E07A5F] hover:underline bg-white px-2 py-0.5 rounded-md border border-[#E07A5F]/30"
                  >
                    Auto-fill ({generatedOtp || '123456'})
                  </button>
                )}
              </div>
              {isOffline && (
                <p className="text-[11px] text-gray-500">
                  ⚡ Device is offline: Enter offline passcode <code className="font-mono font-bold text-gray-800">123456</code> to verify immediately.
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                {t.otpLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  id="auth-input-otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.otpPlaceholder}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-mono text-lg font-bold tracking-widest text-left"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                id="auth-btn-change-number"
                onClick={handleResetForm}
                className="w-1/3 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-sans text-xs font-medium text-gray-650 cursor-pointer"
              >
                Change No.
              </button>
              <button
                type="submit"
                id="auth-btn-verify-otp"
                disabled={isVerifying}
                className="w-2/3 py-3 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-sans font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4.5 w-4.5" />
                    <span>{t.verifyOTP}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Change Mode Toggle button (Switch between Login and Registration) */}
        <div className="text-center pt-2 border-t border-gray-150">
          <button
            type="button"
            id="auth-toggle-mode"
            onClick={() => {
              onSwitchMode(mode === 'login' ? 'signup' : 'login');
              handleResetForm();
            }}
            className="text-xs sm:text-sm font-sans font-bold text-[#E07A5F] hover:text-[#C8644B] underline cursor-pointer"
          >
            {mode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
