import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ShieldAlert, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Plane, 
  ArrowRight,
  HelpCircle,
  X
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  onSuccess: (user: AuthUser, token: string) => void;
  onModeChange?: (mode: 'login' | 'signup') => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function AuthForm({
  initialMode = 'login',
  onSuccess,
  onModeChange,
  onCancel,
  isModal = false
}: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowForgotNotice(false);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return false;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your official full name.');
        return false;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your confirm password.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = mode === 'login'
        ? { email: email.trim(), password }
        : {
            name: name.trim(),
            email: email.trim(),
            password,
            passportNumber: passportNumber.trim() || undefined
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (mode === 'login' ? 'Invalid credentials' : 'Failed to create account'));
      }

      const { user, token } = data;
      setSuccessMessage(mode === 'login' ? 'Signed in successfully!' : 'Account created successfully!');
      
      // Short delay for visual feedback before proceeding
      setTimeout(() => {
        onSuccess(user, token);
      }, 400);

    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill for demo accounts to assist testers
  const fillDemoAccount = (role: 'traveler' | 'admin') => {
    if (role === 'traveler') {
      setEmail('traveler@aviato.vip');
      setPassword('traveler123');
      if (mode === 'signup') {
        setName('Julian Sterling');
        setConfirmPassword('traveler123');
        setPassportNumber('US-123456789');
      }
    } else {
      setEmail('admin@aviato.vip');
      setPassword('admin123');
      if (mode === 'signup') {
        setName('Victoria Stirling');
        setConfirmPassword('admin123');
        setPassportNumber('US-987654321');
      }
    }
    setErrorMessage(null);
  };

  return (
    <div id="aviato-auth-form" className="w-full text-left select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-white p-2.5 rounded-2xl shadow-sm shadow-primary/20">
            <Plane className="h-5 w-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-tight text-primary">AVIATO</span>
              <span className="text-[10px] bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Passport ID
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {mode === 'login' ? 'Sign in to access your luxury flight desk' : 'Create your verified traveler profile'}
            </p>
          </div>
        </div>

        {isModal && onCancel && (
          <button
            type="button"
            id="auth-modal-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mode Switch Tabs */}
      <div className="mt-5 grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl text-xs font-semibold">
        <button
          type="button"
          id="tab-login-btn"
          onClick={() => handleModeSwitch('login')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-primary font-black shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          id="tab-signup-btn"
          onClick={() => handleModeSwitch('signup')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-primary font-black shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div id="auth-error-banner" className="mt-4 p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div id="auth-success-banner" className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Forgot Password Concierge Box */}
      {showForgotNotice && (
        <div id="forgot-password-notice" className="mt-4 p-4 bg-sky-50 border border-sky-100 rounded-2xl text-xs text-slate-700 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-sky-900">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-sky-600" />
              Aviato Concierge Assistance
            </span>
            <button
              type="button"
              onClick={() => setShowForgotNotice(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            For credential security across VIP passenger manifests, password resets are processed directly through the Aviato Concierge Desk. Please contact{' '}
            <span className="font-semibold text-primary">concierge@aviato.vip</span> or call{' '}
            <span className="font-mono font-semibold">+1 (800) AVIATO-VIP</span>.
          </p>
        </div>
      )}

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        
        {/* Full Name (Signup Only) */}
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <label htmlFor="auth-name-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Official Traveler Name <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <User className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                id="auth-name-input"
                type="text"
                required
                disabled={isLoading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Julian Sterling"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none w-full disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="auth-email-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Email Coordinate <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              id="auth-email-input"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. traveler@aviato.vip"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none w-full disabled:opacity-50"
            />
          </div>
        </div>

        {/* Passport Number (Signup Only - Optional) */}
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label htmlFor="auth-passport-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Passport Identification
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Optional</span>
            </div>
            <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <ShieldAlert className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                id="auth-passport-input"
                type="text"
                disabled={isLoading}
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="e.g. US-123456789"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none w-full uppercase disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label htmlFor="auth-password-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {mode === 'signup' ? 'Create Secure Passcode' : 'Account Passcode'} <span className="text-red-500">*</span>
            </label>
            {mode === 'login' && (
              <button
                type="button"
                id="forgot-password-trigger"
                onClick={() => setShowForgotNotice(!showForgotNotice)}
                className="text-[10px] font-bold text-sky-600 hover:text-primary transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              id="auth-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none w-full disabled:opacity-50"
            />
            <button
              type="button"
              id="toggle-password-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password (Signup Only) */}
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <label htmlFor="auth-confirm-password-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Confirm Passcode <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                id="auth-confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none w-full disabled:opacity-50"
              />
              <button
                type="button"
                id="toggle-confirm-password-visibility-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={isLoading}
            className="w-full py-3.5 bg-primary hover:bg-secondary active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Aviato' : 'Complete Registration'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch Mode Prompt */}
      <div className="mt-5 text-center text-xs text-slate-500">
        {mode === 'login' ? (
          <p>
            Don't have an Aviato account?{' '}
            <button
              type="button"
              id="switch-to-signup-link"
              onClick={() => handleModeSwitch('signup')}
              className="text-primary hover:text-secondary font-bold underline transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              id="switch-to-login-link"
              onClick={() => handleModeSwitch('login')}
              className="text-primary hover:text-secondary font-bold underline transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
        )}
      </div>

      {/* Quick Demo Assist Pills */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-center">
          Quick Demo Credentials
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('traveler')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-slate-100 rounded-xl text-[10px] text-slate-600 hover:text-sky-800 transition-all text-center cursor-pointer"
          >
            <span className="font-bold block">Traveler Demo</span>
            <span className="text-[9px] text-slate-400">traveler@aviato.vip</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-100 rounded-xl text-[10px] text-slate-600 hover:text-amber-800 transition-all text-center cursor-pointer"
          >
            <span className="font-bold block">Admin Demo</span>
            <span className="text-[9px] text-slate-400">admin@aviato.vip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
