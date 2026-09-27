import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  ShieldAlert, 
  Award, 
  Plane, 
  CheckCircle2, 
  Save, 
  Edit3, 
  LogOut, 
  Calendar, 
  Hash, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { AuthUser } from '../types';

interface MyProfilePageProps {
  currentUser: AuthUser;
  onUpdateProfile: (updatedData: { name: string; email: string; passportNumber: string }) => Promise<{ success: boolean; error?: string }>;
  bookingCount: number;
  onLogout: () => void;
  onViewBookings: () => void;
  initialEditMode?: boolean;
}

export default function MyProfilePage({ 
  currentUser, 
  onUpdateProfile, 
  bookingCount,
  onLogout,
  onViewBookings,
  initialEditMode = false
}: MyProfilePageProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  
  // Form fields
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [passportNumber, setPassportNumber] = useState(currentUser.passportNumber || '');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync edit mode if prop changes
  useEffect(() => {
    if (initialEditMode !== undefined) {
      setIsEditing(initialEditMode);
    }
  }, [initialEditMode]);

  // Sync state if currentUser changes from external update
  useEffect(() => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setPassportNumber(currentUser.passportNumber || '');
  }, [currentUser]);

  const initials = (currentUser.name || 'Traveler')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = currentUser.createdAt 
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Member since 2026';

  const memberId = `AV-${(currentUser.id || '2026').replace(/\D/g, '').slice(0, 6) || '202699'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please provide your full legal name.');
      setIsSubmitting(false);
      return;
    }

    const res = await onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      passportNumber: passportNumber.trim()
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Your profile credentials have been saved and synchronized with Aviato!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 4500);
    } else {
      setErrorMessage(res.error || 'Failed to update your profile credentials.');
    }
  };

  const handleCancelEdit = () => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setPassportNumber(currentUser.passportNumber || '');
    setErrorMessage(null);
    setIsEditing(false);
  };

  return (
    <div id="aviato-my-profile" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      
      {/* Top Header Row with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-150">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-0.5 rounded-full">
              Traveler Profile Desk
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              ID: {memberId}
            </span>
          </div>
          <h1 className="font-display font-black text-slate-900 text-2xl sm:text-3xl tracking-tight mt-1">
            Personal Flight Dossier
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your official aviation credentials, verified passport coordinates, and track Aviato premium rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              type="button"
              id="edit-profile-trigger-btn"
              onClick={() => {
                setIsEditing(true);
                setErrorMessage(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-secondary text-white font-semibold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              id="cancel-edit-profile-btn"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-2xl transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Cancel Edit</span>
            </button>
          )}

          <button
            type="button"
            id="profile-logout-btn"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 font-semibold text-xs tracking-wider uppercase rounded-2xl transition-all border border-red-100 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Global Success Notification */}
      {successMessage && (
        <div id="profile-success-banner" className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Global Error Notification */}
      {errorMessage && (
        <div id="profile-error-banner" className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Official Membership & Loyalty Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Platinum Membership Pass */}
          <div className="bg-gradient-to-br from-primary via-navy-800 to-navy-950 text-white rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-400/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[9px] font-black tracking-widest text-sky-300 block uppercase">AVIATO AMBASSADOR</span>
                <h3 className="font-display font-black text-lg tracking-tight mt-0.5">
                  {currentUser.role === 'ADMIN' ? 'Platform Administrator' : 'Gold Tier Member'}
                </h3>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <Award className="h-5 w-5 text-accent animate-pulse" />
              </div>
            </div>

            {/* Avatar & Identification */}
            <div className="pt-6 flex items-center gap-4 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-primary text-white font-display font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {initials}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <p className="font-display font-bold text-sm text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-sky-200 truncate">{currentUser.email}</p>
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Passenger
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/10 text-left mt-6 relative z-10">
              <div>
                <span className="text-[9px] text-sky-300 block uppercase font-bold">Total Reservations</span>
                <span className="font-mono text-base font-extrabold text-white">{bookingCount} Flights</span>
              </div>
              <div>
                <span className="text-[9px] text-sky-300 block uppercase font-bold">Member Since</span>
                <span className="font-mono text-xs font-bold text-sky-100">{formattedDate}</span>
              </div>
            </div>

            {/* Privilege Indicator */}
            <div className="pt-4 flex items-center gap-2 text-[10px] text-sky-200 font-mono relative z-10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Expedited security & boarding privileges active</span>
            </div>
          </div>

          {/* Quick Nav Card to Bookings */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmed Itineraries</span>
              <span className="text-xs font-extrabold text-primary">{bookingCount}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-light">
              Review your reserved flight segments, seat allocations, and download official electronic boarding passes.
            </p>
            <button
              type="button"
              id="profile-view-bookings-btn"
              onClick={onViewBookings}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to My Bookings</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

        </div>

        {/* Right Column: Profile Details or Edit Form */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-sm text-left">
          
          {!isEditing ? (
            /* Read-Only Credentials View */
            <div id="profile-view-mode" className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg">Passport & Contact Information</h3>
                  <p className="text-xs text-slate-400">Current traveler data on file with carrier reservations</p>
                </div>
                <button
                  type="button"
                  id="profile-edit-btn-inline"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-primary hover:text-white rounded-xl text-xs font-bold text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Modify</span>
                </button>
              </div>

              {/* Data Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Legal Name */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Official Passenger Name</span>
                  </div>
                  <p className="font-display font-extrabold text-sm text-slate-800">{currentUser.name}</p>
                  <span className="text-[10px] text-slate-400">Matches government identification</span>
                </div>

                {/* Email Address */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>Email Address</span>
                  </div>
                  <p className="font-mono font-bold text-xs text-slate-800 truncate">{currentUser.email}</p>
                  <span className="text-[10px] text-slate-400">Primary contact for flight alerts</span>
                </div>

                {/* Passport Number */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                    <span>Passport Number</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-slate-800">
                    {currentUser.passportNumber || <span className="text-slate-400 font-normal italic">Not specified</span>}
                  </p>
                  <span className="text-[10px] text-slate-400">International border manifest ID</span>
                </div>

                {/* Role / Tier */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <Award className="h-3.5 w-3.5 text-accent" />
                    <span>Account Authority</span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-black rounded-lg text-xs">
                      {currentUser.role || 'CUSTOMER'}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {currentUser.role === 'ADMIN' ? 'Full Dispatch Access' : 'Verified Traveler'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Security permissions</span>
                </div>

              </div>

              {/* Manifest Security Badge */}
              <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-sky-950">Aviation Regulatory Protection</span>
                  <p className="text-[11px] text-sky-800/80 leading-relaxed">
                    Your profile data is synchronized with your bookings. When you adjust your credentials, your future ticket checkouts will automatically reflect your verified passenger coordinates.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Edit Form */
            <div id="profile-edit-mode" className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg">Modify Personal Coordinates</h3>
                  <p className="text-xs text-slate-400">Update your passenger profile parameters across Aviato services</p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase">
                  Editing Mode
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Official Name */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-profile-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Official Passenger Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <User className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="edit-profile-name"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Official passport name"
                      className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-profile-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Primary Email Coordinate <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="edit-profile-email"
                      type="email"
                      required
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. traveler@aviato.vip"
                      className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Passport Number */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-profile-passport" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Passport Identification Number
                  </label>
                  <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <ShieldAlert className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="edit-profile-passport"
                      type="text"
                      disabled={isSubmitting}
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="e.g. US-123456789"
                      className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full uppercase"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    id="save-profile-btn"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-primary hover:bg-secondary text-white font-bold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Profile Parameters</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="cancel-profile-btn"
                    disabled={isSubmitting}
                    onClick={handleCancelEdit}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-2xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
