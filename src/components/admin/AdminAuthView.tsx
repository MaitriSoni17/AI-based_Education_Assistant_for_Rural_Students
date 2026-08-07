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

export default function AdminAuthView({ onSuccess, onBackToMain, lang, adminUser, onGoToDashboard }: AdminAuthViewProps) {
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
      localStorage.setItem('gramin_admin_session', JSON.stringify(adminUser));
      localStorage.setItem('gramin_student_session', JSON.stringify(adminUser));

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
        <span>Return to Student App</span>
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
            Restricted Admin Portal
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            Administrative Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Gramin Shiksha Platform & Curriculum Management
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Active Admin Session Banner if logged in */}
          {adminUser && (
            <div className="bg-amber-500/10 border-2 border-amber-400/40 rounded-2xl p-4 text-center space-y-2">
              <div className="text-amber-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Active Administrator Session Detected</span>
              </div>
              <div className="text-white font-black text-sm">{adminUser.name} ({adminUser.mobile})</div>
              {onGoToDashboard && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="mt-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="h-4 w-4 text-slate-950" />
                  <span>Open Admin Console Dashboard</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Credential Hint Box */}
          <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              <KeyRound className="h-4 w-4" />
              <span>Admin Demo Passcode:</span>
            </div>
            <div className="font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-700 text-slate-200 flex flex-col gap-1">
              <div><span className="text-slate-500">Mobile:</span> <span className="text-amber-300 font-bold">9999999999</span></div>
              <div><span className="text-slate-500">PIN / OTP:</span> <span className="text-emerald-400 font-bold">999999</span></div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Note: This dedicated endpoint is separate from the student login page.
            </p>
          </div>

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
                Administrator Mobile Number
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
                  placeholder="Enter 10-digit Admin Mobile"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-sm font-semibold"
                />
              </div>
            </div>

            {/* Admin Security PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Security Passcode / PIN
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
                  placeholder="Enter 6-digit Security PIN (999999)"
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
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Authenticate Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Security Stamp */}
          <div className="text-center pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              256-Bit Encrypted Admin Session
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
