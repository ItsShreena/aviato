import React from 'react';
import { Plane, ShieldCheck, Award, ArrowLeft } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { AuthUser } from '../types';

interface SignupPageProps {
  onSuccess: (user: AuthUser, token: string) => void;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export default function SignupPage({
  onSuccess,
  onNavigateHome,
  onNavigateLogin
}: SignupPageProps) {
  return (
    <div id="aviato-signup-page" className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Airline Elite Status Overview */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-primary via-navy-800 to-navy-950 text-white rounded-3xl shadow-xl border border-white/10 relative overflow-hidden h-[600px]">
          {/* Subtle Ambient Reflections */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <Plane className="h-6 w-6 text-white rotate-45" />
              </div>
              <div>
                <span className="font-display font-black text-2xl tracking-tight text-white block">AVIATO</span>
                <span className="text-[10px] font-bold text-sky-300 tracking-widest uppercase block">MEMBERSHIP PRIVILEGES</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <span className="text-[10px] font-black text-accent uppercase tracking-widest block">
                Traveler Enrollment
              </span>
              <h2 className="font-display font-extrabold text-2xl text-white leading-snug">
                Join our private aviation network.
              </h2>
              <p className="text-xs text-sky-100/80 leading-relaxed font-light">
                Enroll with Aviato to unlock fast-track cabin reservations, direct airline booking synchronization, and personalized VIP travel dossiers.
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-sky-200">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">Instant Ambassador Tier</span>
                <span className="text-[10px] text-sky-200/70">Complimentary priority boarding on all carriers</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-sky-200">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">Verified Traveler Identity</span>
                <span className="text-[10px] text-sky-200/70">Pre-fill passport info for seamless one-click checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xl shadow-slate-200/50">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              id="signup-back-to-home-btn"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Discover</span>
            </button>
          </div>

          <AuthForm
            initialMode="signup"
            onSuccess={onSuccess}
            onModeChange={(m) => {
              if (m === 'login') onNavigateLogin();
            }}
          />
        </div>

      </div>
    </div>
  );
}
