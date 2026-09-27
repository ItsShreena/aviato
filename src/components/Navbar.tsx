import { useState } from 'react';
import { 
  Plane, 
  CalendarCheck, 
  AlignJustify, 
  X, 
  Globe, 
  Gauge, 
  User, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  Sparkles,
  Compass,
  Search,
  Edit3
} from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  bookingCount: number;
  currentUser: AuthUser | null;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onViewChange,
  bookingCount,
  currentUser,
  onLoginClick,
  onSignUpClick,
  onLogout
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Dynamic Navigation Items based on Authenticated State
  const navItems: Array<{ id: string; label: string; icon: any; badge?: number }> = [];

  if (currentUser) {
    // 1. Home / Travel Hub
    navItems.push({
      id: 'travel_hub',
      label: 'Travel Hub',
      icon: Compass,
    });
    // 2. Search Flights
    navItems.push({
      id: 'landing',
      label: 'Search Flights',
      icon: Search,
    });
    // 3. My Bookings
    navItems.push({
      id: 'my_bookings',
      label: 'My Bookings',
      icon: CalendarCheck,
      badge: bookingCount > 0 ? bookingCount : undefined,
    });
    // 4. Profile
    navItems.push({
      id: 'my_profile',
      label: 'Profile',
      icon: User,
    });
    // Admin Portal only for Admin Role
    if (currentUser.role === 'ADMIN') {
      navItems.push({ id: 'admin_dashboard', label: 'Admin Portal', icon: Gauge });
    }
  } else {
    navItems.push({
      id: 'landing',
      label: 'Search Flights',
      icon: Search,
    });
  }

  const isItemActive = (itemId: string) => {
    if (itemId === currentView) return true;
    if (itemId === 'landing' && ['search_results', 'flight_details', 'seat_selection', 'booking_passenger', 'booking_review', 'confirmation'].includes(currentView)) {
      return true;
    }
    if (itemId === 'my_profile' && currentView === 'my_profile_edit') {
      return true;
    }
    return false;
  };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AV';

  // Creative travel-inspired circular profile avatar
  const renderProfileAvatar = (size: 'sm' | 'md' = 'md') => {
    const isSm = size === 'sm';
    return (
      <div className="relative shrink-0 group-hover/profile:scale-105 transition-transform duration-300">
        {/* Modern circular container with AVIATO gradient border */}
        <div className={`${isSm ? 'h-8 w-8' : 'h-9 w-9'} rounded-full bg-gradient-to-tr from-primary via-navy-800 to-secondary p-[1.5px] shadow-2xs group-hover/profile:shadow-md group-hover/profile:shadow-primary/20 transition-all duration-300`}>
          <div className="w-full h-full rounded-full bg-gradient-to-b from-navy-900 via-primary/90 to-navy-950 flex items-center justify-center relative overflow-hidden">
            {/* Subtle atmospheric gradient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/25 via-transparent to-transparent pointer-events-none" />

            {/* Travel-oriented user profile silhouette with aerodynamic flight contour */}
            <svg
              className={`${isSm ? 'w-4 h-4' : 'w-4.5 h-4.5'} text-white/95 group-hover/profile:text-white transition-colors duration-300`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="User Profile"
            >
              {/* Traveler head */}
              <circle cx="12" cy="7.5" r="3.2" />
              {/* Aerodynamic traveler shoulders */}
              <path d="M5.5 19.5C5.5 15.6 8.4 13.8 12 13.8C15.6 13.8 18.5 15.6 18.5 19.5" />
              {/* Subtle supersonic travel sweep across collar */}
              <path
                d="M3.5 13.5C7.2 11.8 11.5 12.2 15 14.2"
                stroke="#38BDF8"
                strokeWidth="1.4"
                strokeOpacity="0.85"
              />
            </svg>
          </div>
        </div>

        {/* Micro aviation flight marker */}
        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-navy-950 border border-white flex items-center justify-center text-accent shadow-xs group-hover/profile:rotate-12 transition-transform duration-300">
          <Plane className="h-2 w-2 rotate-45" />
        </div>
      </div>
    );
  };

  return (
    <header id="aviato-navbar" className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 text-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand Frame */}
          <div 
            id="nav-logo"
            onClick={() => { 
              onViewChange(currentUser ? 'travel_hub' : 'landing'); 
              setMobileMenuOpen(false); 
            }} 
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="bg-primary text-white p-2.5 rounded-2xl group-hover:bg-secondary group-hover:scale-105 transition-all duration-500 shadow-md shadow-primary/20">
              <Plane className="h-5 w-5 rotate-45 group-hover:rotate-90 transition-transform duration-700" />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-primary">
                AVIATO
              </span>
              <p className="text-[9px] font-bold text-secondary tracking-widest leading-none">
                FLY SMARTER
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 select-none cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 stroke-[2.25]" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
                      isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Area: Session Controls & Action Row */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              // Logged In Status: Avatar and Dropdown Selector
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="group/profile flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300/80 rounded-2xl p-1.5 pr-3.5 transition-all duration-300 focus:outline-none cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  {renderProfileAvatar('md')}
                  <div className="text-left select-none max-w-[130px]">
                    <p className="text-xs leading-tight font-extrabold text-slate-850 truncate group-hover/profile:text-primary transition-colors duration-200">{currentUser.name}</p>
                    <span className="text-[10px] text-primary font-bold tracking-wide flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-accent" />
                      {currentUser.role === 'ADMIN' ? 'Administrator' : 'Ambassador'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 group-hover/profile:text-slate-600 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Container */}
                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setProfileDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2.5 w-64 bg-white border border-slate-150 rounded-3xl shadow-2xl py-2 z-40 animate-scaleUp text-left select-none overflow-hidden">
                      {/* User Snapshot Header */}
                      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                        <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">
                          Logged In Traveler
                        </span>
                        <p className="text-xs font-black text-slate-900 truncate mt-0.5">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 truncate font-mono">{currentUser.email}</p>
                      </div>

                      {/* Dropdown Navigation Actions */}
                      <div className="p-1.5 space-y-0.5">
                        <button
                          id="dropdown-travel-hub-btn"
                          onClick={() => {
                            onViewChange('travel_hub');
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                            currentView === 'travel_hub'
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Compass className="h-4 w-4 text-primary stroke-[2]" />
                          <span>Travel Hub</span>
                        </button>

                        <button
                          id="dropdown-my-profile-btn"
                          onClick={() => {
                            onViewChange('my_profile');
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                            currentView === 'my_profile'
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <User className="h-4 w-4 text-primary stroke-[2]" />
                          <span>My Profile</span>
                        </button>

                        <button
                          id="dropdown-edit-profile-btn"
                          onClick={() => {
                            onViewChange('my_profile_edit');
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                            currentView === 'my_profile_edit'
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Edit3 className="h-4 w-4 text-sky-600 stroke-[2]" />
                          <span>Edit Profile</span>
                        </button>

                        <button
                          id="dropdown-my-bookings-btn"
                          onClick={() => {
                            onViewChange('my_bookings');
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                            currentView === 'my_bookings'
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <CalendarCheck className="h-4 w-4 text-secondary stroke-[2]" />
                            <span>My Bookings</span>
                          </div>
                          {bookingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                              {bookingCount}
                            </span>
                          )}
                        </button>

                        {currentUser.role === 'ADMIN' && (
                          <button
                            id="dropdown-admin-portal-btn"
                            onClick={() => {
                              onViewChange('admin_dashboard');
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                              currentView === 'admin_dashboard'
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Gauge className="h-4 w-4 text-amber-500 stroke-[2]" />
                            <span>Admin Portal</span>
                          </button>
                        )}
                      </div>

                      {/* Logout Action */}
                      <div className="border-t border-slate-100 p-1.5">
                        <button
                          id="dropdown-logout-btn"
                          onClick={() => {
                            onLogout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-bold text-red-650 hover:bg-red-50 hover:text-red-700 rounded-2xl transition-all cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 text-red-500 stroke-[2]" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Logged Out Actions Bar
              <div className="flex items-center gap-2">
                <button
                  id="navbar-login-btn"
                  onClick={onLoginClick}
                  className="px-4 py-2.5 text-xs text-primary font-bold hover:text-secondary hover:bg-slate-50 rounded-2xl transition-all cursor-pointer"
                >
                  Log In
                </button>
                <button
                  id="navbar-signup-btn"
                  onClick={onSignUpClick}
                  className="px-4 py-2.5 bg-primary hover:bg-secondary text-white font-bold text-xs tracking-wide rounded-2xl transition-all shadow-md shadow-primary/15 cursor-pointer hover:shadow-lg active:scale-98"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Action Trigger Button */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <AlignJustify className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Slide Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-drawer" className="md:hidden bg-white border-b border-slate-150 py-4 px-4 space-y-3 animate-fadeIn text-left select-none shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4 stroke-[2]" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold leading-none ${
                    isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            {currentUser ? (
              <>
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl mb-2 flex items-center gap-3 group/profile">
                  {renderProfileAvatar('sm')}
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Signed In As</span>
                    <p className="text-xs font-black text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">{currentUser.email}</p>
                  </div>
                </div>
                
                <button
                  id="mobile-my-profile-btn"
                  onClick={() => {
                    onViewChange('my_profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-2xl cursor-pointer"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>My Profile</span>
                </button>

                <button
                  id="mobile-my-bookings-btn"
                  onClick={() => {
                    onViewChange('my_bookings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-2xl cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <CalendarCheck className="h-4 w-4 text-secondary" />
                    <span>My Bookings</span>
                  </div>
                  {bookingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {bookingCount}
                    </span>
                  )}
                </button>

                <button
                  id="mobile-logout-btn"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-red-650 hover:bg-red-50 rounded-2xl cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-1 pt-1">
                <button
                  id="mobile-login-btn"
                  onClick={() => {
                    onLoginClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-slate-50 border border-slate-200 text-primary font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-center"
                >
                  Log In
                </button>
                <button
                  id="mobile-signup-btn"
                  onClick={() => {
                    onSignUpClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-secondary transition-all cursor-pointer text-center shadow-md shadow-primary/20"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
