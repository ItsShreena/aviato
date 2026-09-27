import React from 'react';
import { Plane, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { AuthUser } from '../types';

interface LoginPageProps {
  onSuccess: (user: AuthUser, token: string) => void;
  onNavigateHome: () => void;
  onNavigateSignup: () => void;
  targetViewName?: string | null;
}

export default function LoginPage({
  onSuccess,
  onNavigateHome,
  onNavigateSignup,
  targetViewName
}: LoginPageProps) {
  return (
    <div id="aviato-login-page" className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Luxury Airline Brand & Perks Narrative */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-primary via-navy-800 to-navy-950 text-white rounded-3xl shadow-xl border border-white/10 relative overflow-hidden h-[540px]">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <Plane className="h-6 w-6 text-white rotate-45" />
              </div>
              <div>
                <span className="font-display font-black text-2xl tracking-tight text-white block">AVIATO</span>
                <span className="text-[10px] font-bold text-sky-300 tracking-widest uppercase block">PRIVATE CURATION</span>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                VIP Aviation Portal
              </span>
              <h2 className="font-display font-extrabold text-2xl text-white leading-snug">
                Welcome back to refined flight planning.
              </h2>
              <p className="text-xs text-sky-100/80 leading-relaxed font-light">
                Sign in to manage your private reservations, update passenger passport credentials, and access expedited boarding passes.
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-sky-200">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">Encrypted Manifest Storage</span>
                <span className="text-[10px] text-sky-200/70">Verified ICAO passport standards</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-sky-200">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">Instant Boarding Pass Access</span>
                <span className="text-[10px] text-sky-200/70">Live flight gate alerts & loyalty tier perks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Login Card Container */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xl shadow-slate-200/50">
          {targetViewName && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 text-left">
              <span className="font-bold">Authentication Required:</span> Please sign in to access your {targetViewName === 'my_profile' ? 'Profile' : 'My Bookings'} desk.
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              id="login-back-to-home-btn"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Discover</span>
            </button>
          </div>

          <AuthForm
            initialMode="login"
            onSuccess={onSuccess}
            onModeChange={(m) => {
              if (m === 'signup') onNavigateSignup();
            }}
          />
        </div>

      </div>
    </div>
  );
}
