import React, { useState } from 'react';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import { LanguageCode, User } from '../types';
import SpeakButton from './SpeakButton';
import { Smartphone, Lock, UserCheck, Globe, RefreshCw, Send } from 'lucide-react';
import { getFirebaseUser, setFirebaseUser } from '../lib/firebase';

interface AuthViewProps {
  mode: 'login' | 'signup';
  onSuccess: (user: User) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  lang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export default function AuthView({
  mode,
  onSuccess,
  onSwitchMode,
  lang,
  onLanguageChange,
}: AuthViewProps) {
  const t = TRANSLATIONS[lang];

  // Form states
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  // UI Flow states
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Validation
  const validateMobile = (num: string) => {
    return /^[6-9]\d{9}$/.test(num);
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
      if (mode === 'login') {
        const dbUser = await getFirebaseUser(mobile);
        if (!dbUser) {
          onSwitchMode('signup');
          const msgs = {
            hi: 'इस मोबाइल नंबर के साथ कोई खाता नहीं मिला। हमने आपको पंजीकरण पृष्ठ पर स्थानांतरित कर दिया है। कृपया जारी रखने के लिए अपना पूरा नाम दर्ज करें।',
            gu: 'આ મોબાઈલ નંબર સાથે કોઈ ખાતું મળ્યું નથી. અમે તમને રજીસ્ટ્રેશન પેજ પર મોકલી દીધા છે. કૃપા કરીને આગળ વધવા માટે તમારું નામ લખો.',
            mr: 'या मोबाईल नंबरवर कोणतेही खाते आढळले नाही. आम्ही तुम्हाला नोंदणी पृष्ठावर पाठवले आहे. कृपया पुढे जाण्यासाठी तुमचे पूर्ण नाव प्रविष्ट करा.',
            ta: 'இந்த மொபைல் எண்ணில் கணக்கு எதுவும் இல்லை. நாங்கள் உங்களை பதிவுப் பக்கத்திற்கு அனுப்பியுள்ளோம். தயவுசெய்து தொடர உங்கள் முழு பெயரை உள்ளிடவும்.',
            te: 'ఈ మొబైల్ నంబర్‌తో ఎటువంటి ఖాతా కనుగొనబడలేదు. మేము మిమ్మల్ని రిజిస్ట్రేషన్ పేజీకి మళ్లించాము. దయచేసి కొనసాగించడానికి మీ పూర్తి పేరును నమోదు చేయండి.',
            en: 'Account not found for this mobile number. We have automatically guided you to the registration page. Please enter your full name to continue!'
          };
          setErrorMessage(msgs[lang as keyof typeof msgs] || msgs.en);
          setSendingOtp(false);
          return;
        }
      }

      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.isSimulated && data.simulatedOtp) {
          setGeneratedOtp(data.simulatedOtp);
          setIsSimulated(true);
        } else {
          setGeneratedOtp('');
          setIsSimulated(false);
        }
        if (data.gatewayError) {
          console.log("Twilio Gateway Error Details:", data.gatewayError);
        }
        setIsOtpSent(true);
      } else {
        setErrorMessage(data.message || 'Failed to dispatch verification code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Server might be offline. Please try again.');
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
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          otp,
          name: name.trim(),
          isSignup: mode === 'signup'
        }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.verified) {
        if (mode === 'signup') {
          // Register user profile in Firebase Firestore
          await setFirebaseUser(mobile, {
            name: name.trim(),
            defaultLanguage: lang,
            signupDate: data.user.signupDate || new Date().toLocaleDateString(),
          });
          
          const dbUser = await getFirebaseUser(mobile);
          if (dbUser) {
            onSuccess(dbUser as User);
          } else {
            onSuccess({
              mobile,
              name: name.trim(),
              defaultLanguage: lang,
              signupDate: data.user.signupDate || new Date().toLocaleDateString(),
            });
          }
        } else {
          // Login: Fetch existing user profile from Firebase Firestore
          const dbUser = await getFirebaseUser(mobile);
          if (!dbUser) {
            onSwitchMode('signup');
            handleResetForm();
            const verifyFailMsgs = {
              hi: 'इस मोबाइल नंबर के साथ कोई खाता नहीं मिला। हमने आपको पंजीकरण पृष्ठ पर स्थानांतरित कर दिया है। कृपया अपना नाम दर्ज करें और नया कोड प्राप्त करें।',
              gu: 'આ મોબાઈલ નંબર સાથે કોઈ ખાતું મળ્યું નથી. અમે તમને રજીસ્ટ્રેશન પેજ પર મોકલી દીધા છે. કૃપા કરીને તમારું નામ લખો અને નવો કોડ મેળવો.',
              mr: 'या मोबाईल नंबरवर कोणतेही खाते आढळले नाही. आम्ही तुम्हाला नोंदणी पृष्ठावर पाठवले आहे. कृपया तुमचे नाव प्रविष्ट करा आणि नवीन कोड मिळवा.',
              ta: 'இந்த மொபைல் எண்ணில் கணக்கு எதுவும் இல்லை. நாங்கள் உங்களை பதிவுப் பக்கத்திற்கு அனுப்பியுள்ளோம். தயవుசெய்து உங்கள் பெயரை உள்ளிட்டு புதிய குறியீட்டைப் பெறவும்.',
              te: 'ఈ మొబైల్ నంబర్‌తో ఎటువంటి ఖాతా కనుగొనబడలేదు. మేము మిమ్మల్ని రిజిస్ట్రేషన్ పేజీకి మళ్లించాము. దయచేసి మీ పేరును నమోదు చేసి, కొత్త కోడ్‌ని పొందండి.',
              en: 'Account not found for this mobile number. We have automatically guided you to the registration page. Please enter your name and request a code to register.'
            };
            setErrorMessage(verifyFailMsgs[lang as keyof typeof verifyFailMsgs] || verifyFailMsgs.en);
            return;
          }
          onSuccess(dbUser as User);
        }
      } else {
        setErrorMessage(data.message || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Verification failed. Unable to reach authentication server.');
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

  return (
    <div id="auth-view-card" className="max-w-md mx-auto bg-white rounded-[32px] border border-[#F2CC8F]/30 shadow-xl overflow-hidden my-6">
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
          Simple Rural Mobile Verification
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

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-sans flex items-start gap-2 animate-pulse">
            <span>⚠️</span>
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form elements */}
        {!isOtpSent ? (
          /* SECTION 1: Phone submission */
          <form onSubmit={handleSendOTP} className="space-y-4">
            
            {/* If in Signup mode, request Student Name */}
            {mode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                  {t.fullNameLabel}
                </label>
                <input
                  type="text"
                  required
                  id="auth-input-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-sans"
                />
              </div>
            )}

            {/* Mobile Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-display font-black text-gray-750 uppercase tracking-widest">
                {t.mobileLabel}
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
              className="w-full py-3.5 px-4 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-sans font-bold text-base rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingOtp ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <Send className="h-4.5 w-4.5" />
                  <span>{t.sendOTP}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* SECTION 2: OTP typing form */
          <form onSubmit={handleVerifyOTP} className="space-y-4">

            {/* Floating Info alert with simulated code */}
            <div className="bg-[#FAF8F4] border border-[#F2CC8F]/40 p-3.5 rounded-2xl space-y-1.5 text-left text-xs sm:text-sm">
              <div className="font-bold text-[#8B6E32] flex items-center gap-1.5">
                <span className="animate-pulse w-2 h-2 rounded-full bg-[#E07A5F]" />
                {t.otpSentMessage}
              </div>
              {/*<p className="font-mono text-xs text-[#3D405B]/85">
                OTP code sent to <strong>+91 {mobile}</strong> is:{' '}
                <span className="bg-[#F2CC8F]/30 px-2.5 py-0.5 rounded font-bold text-[#8B6E32] text-sm border border-[#F2CC8F]/40">
                  {generatedOtp}
                </span>
              </p>*/}
              {/*<p className="text-[10px] text-gray-500 font-mono italic">
                (You can also use developer code <span className="underline font-bold">123456</span> to bypass)
              </p>*/}
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
                className="w-2/3 py-3 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-sans font-bold text-sm sm:text-base rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
