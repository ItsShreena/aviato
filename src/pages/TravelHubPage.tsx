/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plane, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Armchair, 
  Ticket, 
  RefreshCw, 
  ArrowRight, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Edit3, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { AuthUser, Booking, SearchQuery } from '../types';
import { formatINR } from '../utils/currency';
import SearchForm from '../components/SearchForm';

interface TravelHubPageProps {
  currentUser: AuthUser;
  bookings: Booking[];
  isLoading: boolean;
  isSearchLoading?: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onSearch: (query: SearchQuery) => void;
  onViewBooking: (bookingId: string) => void;
  onViewAllBookings: () => void;
  onGoToProfile: (editMode?: boolean) => void;
  onCancelBooking: (bookingId: string) => void;
}

export default function TravelHubPage({
  currentUser,
  bookings,
  isLoading,
  isSearchLoading = false,
  errorMessage,
  onRefresh,
  onSearch,
  onViewBooking,
  onViewAllBookings,
  onGoToProfile,
  onCancelBooking
}: TravelHubPageProps) {
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Helper to determine if a booking is upcoming
  const isUpcoming = (b: Booking) => {
    if (b.status === 'cancelled') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    const flightDate = b.flight?.date;
    if (!flightDate) return true;
    return flightDate >= todayStr;
  };

  const upcomingBookings = bookings
    .filter(isUpcoming)
    .sort((a, b) => (a.flight?.date || '').localeCompare(b.flight?.date || ''));

  const pastBookings = bookings
    .filter(b => !isUpcoming(b))
    .sort((a, b) => (b.flight?.date || '').localeCompare(a.flight?.date || ''));

  // Nearest upcoming flight
  const nearestFlight = upcomingBookings[0] || null;

  // Filtered list for the summary table/cards
  const displayBookings = bookingFilter === 'upcoming' 
    ? upcomingBookings 
    : bookingFilter === 'past' 
      ? pastBookings 
      : bookings;

  // Real destinations from actual bookings
  const bookedDestinations = Array.from(
    new Set(bookings.map(b => b.flight?.arrivalCity).filter(Boolean))
  ) as string[];

  const initials = (currentUser.name || 'Traveler')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div id="aviato-travel-hub" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 select-none text-left">
      
      {/* 1. Header Banner: Personalized Welcome & Profile Element */}
      <div className="bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* Avatar element */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-display font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10 shrink-0">
              {initials}
            </div>
            
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-bold tracking-wider uppercase border border-sky-400/20">
                <Sparkles className="h-3 w-3" />
                AVIATO • YOUR TRAVEL HUB
              </div>
              <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
                {currentUser.name ? `Welcome back, ${currentUser.name}` : 'Welcome back'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-light flex items-center gap-2">
                <span>{currentUser.email}</span>
                <span className="text-slate-500">•</span>
                <span className="text-sky-400 font-medium">
                  {currentUser.role === 'ADMIN' ? 'Administrator' : 'Verified Traveler'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Profile Actions & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              id="travel-hub-refresh-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh travel records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              id="travel-hub-profile-btn"
              onClick={() => onGoToProfile(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-sky-400" />
              <span>Profile</span>
            </button>

            <button
              id="travel-hub-edit-profile-btn"
              onClick={() => onGoToProfile(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-navy-950 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state handling */}
      {errorMessage && (
        <div id="travel-hub-error-banner" className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-900">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">{errorMessage}</p>
              <p className="text-[11px] text-rose-600">Please check your network connectivity or sign in again.</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-48 bg-slate-100 rounded-3xl border border-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-slate-100 rounded-2xl" />
            <div className="h-28 bg-slate-100 rounded-2xl" />
            <div className="h-28 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && (
        <>
          {/* 2. UPCOMING FLIGHT SECTION */}
          <section id="travel-hub-upcoming-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                <h2 className="text-xs font-mono font-black text-sky-600 uppercase tracking-widest">
                  UPCOMING FLIGHT
                </h2>
              </div>
              {nearestFlight && (
                <span className="text-[11px] font-medium text-slate-400">
                  Departure in {nearestFlight.flight?.date}
                </span>
              )}
            </div>

            {nearestFlight ? (
              <div 
                id={`upcoming-flight-card-${nearestFlight.id}`}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6"
              >
                {/* Upper row: Airline, Flight No, PNR, Status */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                      <Plane className="h-6 w-6 rotate-45" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-slate-900 text-lg">
                          {nearestFlight.flight?.airline || 'Aviato Airlines'}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {nearestFlight.flight?.flightNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {nearestFlight.flight?.aircraft || 'Modern Jetliner'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                        PNR / BOOKING CODE
                      </span>
                      <span className="font-mono font-black text-sm text-slate-850 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {nearestFlight.id}
                      </span>
                    </div>
                    {getStatusBadge(nearestFlight.status)}
                  </div>
                </div>

                {/* Route Visualizer: Origin -> Destination */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Origin */}
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      DEPARTURE
                    </span>
                    <h3 className="font-display font-black text-2xl text-slate-900">
                      {nearestFlight.flight?.departureCity}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {nearestFlight.flight?.departureAirport} Airport
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{nearestFlight.flight?.departureTime}</span>
                      <span className="text-slate-300">•</span>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{nearestFlight.flight?.date}</span>
                    </div>
                  </div>

                  {/* Flight Duration & Arrow Indicator */}
                  <div className="md:col-span-4 text-center space-y-2 py-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {nearestFlight.flight?.duration} • Direct Non-Stop
                    </span>
                    <div className="relative flex items-center justify-center">
                      <div className="h-[2px] bg-slate-200 w-full" />
                      <div className="absolute bg-white px-2 text-sky-600">
                        <Plane className="h-5 w-5 rotate-90" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                      On Schedule
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="md:col-span-4 space-y-1 md:text-right">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      ARRIVAL
                    </span>
                    <h3 className="font-display font-black text-2xl text-slate-900">
                      {nearestFlight.flight?.arrivalCity}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {nearestFlight.flight?.arrivalAirport} Airport
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 pt-1 md:justify-end">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{nearestFlight.flight?.arrivalTime}</span>
                    </div>
                  </div>
                </div>

                {/* Lower Information Strip & Actions */}
                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-100">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <Armchair className="h-4 w-4 text-sky-600" />
                      <span className="text-slate-400 font-medium">Assigned Seat:</span>
                      <span className="font-mono font-black text-slate-850 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {nearestFlight.seatNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-400 font-medium">Traveler:</span>
                      <span className="font-bold text-slate-850">
                        {nearestFlight.passengerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Fare:</span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatINR(nearestFlight.totalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      id="view-upcoming-booking-btn"
                      onClick={() => onViewBooking(nearestFlight.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-navy-950 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>View Booking</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 3. NO UPCOMING FLIGHT EMPTY STATE */
              <div 
                id="no-upcoming-flights-state"
                className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-xs"
              >
                <div className="mx-auto h-14 w-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-100 shadow-xs">
                  <Compass className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-slate-900 text-lg sm:text-xl">
                    No upcoming trips
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                    Ready for your next journey? Discover optimized routes and transparent fares across global destinations.
                  </p>
                </div>
                <div>
                  <button
                    id="hub-empty-search-flights-btn"
                    onClick={() => setShowQuickSearch(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-navy-950 hover:bg-sky-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search Flights</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 4. QUICK SEARCH SECTION */}
          <section id="travel-hub-quick-search" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-sky-600" />
                <h2 className="text-xs font-mono font-black text-slate-850 uppercase tracking-widest">
                  QUICK FLIGHT SEARCH
                </h2>
              </div>
              <button
                onClick={() => setShowQuickSearch(!showQuickSearch)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                {showQuickSearch ? 'Minimize Search' : 'Open Flight Search'}
              </button>
            </div>

            {showQuickSearch && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm animate-fadeIn">
                <SearchForm onSearch={onSearch} isLoading={isSearchLoading} />
              </div>
            )}
          </section>

          {/* 5. TRAVEL STATISTICS SECTION (Honest real numbers from actual booking state) */}
          <section id="travel-hub-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                TOTAL BOOKINGS
              </span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-slate-900">
                {bookings.length}
              </p>
              <p className="text-[11px] text-slate-500">Reservations made with Aviato</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-sky-600 uppercase tracking-wider block">
                UPCOMING JOURNEYS
              </span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-sky-700">
                {upcomingBookings.length}
              </p>
              <p className="text-[11px] text-slate-500">Active and upcoming flights</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
                COMPLETED JOURNEYS
              </span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-emerald-700">
                {pastBookings.filter(b => b.status !== 'cancelled').length}
              </p>
              <p className="text-[11px] text-slate-500">Completed flight itineraries</p>
            </div>
          </section>

          {/* 6. RECENT DESTINATIONS (From real booking data or suggestions) */}
          {bookedDestinations.length > 0 && (
            <section id="travel-hub-recent-destinations" className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-sky-600" />
                <h2 className="text-xs font-mono font-black text-slate-850 uppercase tracking-widest">
                  RECENT DESTINATIONS
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bookedDestinations.slice(0, 4).map((city) => (
                  <div
                    key={city}
                    onClick={() => {
                      onSearch({
                        fromCity: 'New York',
                        toCity: city,
                        date: '2026-06-25',
                        passengers: 1,
                        cabinClass: 'economy'
                      });
                    }}
                    className="group bg-white rounded-2xl p-4 border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination</span>
                      <h4 className="font-display font-black text-sm text-slate-850 group-hover:text-sky-600 transition-colors">
                        {city}
                      </h4>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. MY BOOKINGS SUMMARY SECTION */}
          <section id="travel-hub-bookings-summary" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                  My Bookings
                </h2>
                <p className="text-xs text-slate-500">
                  Recent reservations and boarding credentials
                </p>
              </div>

              {/* Filter Tabs & View All Link */}
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setBookingFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      bookingFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('upcoming')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      bookingFilter === 'upcoming' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upcoming ({upcomingBookings.length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('past')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      bookingFilter === 'past' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Past ({pastBookings.length})
                  </button>
                </div>

                <button
                  onClick={onViewAllBookings}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 px-3 py-1 cursor-pointer"
                >
                  <span>Full Manifest</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {displayBookings.length > 0 ? (
              <div className="space-y-3">
                {displayBookings.slice(0, 5).map((booking) => {
                  const isExpanded = expandedBookingId === booking.id;
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:border-slate-300 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2.5 bg-slate-50 rounded-xl text-sky-600 shrink-0">
                            <Plane className="h-5 w-5 rotate-45" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-black text-slate-900 text-sm sm:text-base">
                                {booking.flight?.departureCity} ({booking.flight?.departureAirport}) → {booking.flight?.arrivalCity} ({booking.flight?.arrivalAirport})
                              </h4>
                              {getStatusBadge(booking.status)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {booking.flight?.airline} • {booking.flight?.flightNumber} • Date: {booking.flight?.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">PNR</span>
                            <span className="font-mono font-bold text-xs text-slate-700">
                              {booking.id}
                            </span>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Fare</span>
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-800">
                              {formatINR(booking.totalPrice)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onViewBooking(booking.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              View
                            </button>

                            {booking.status !== 'cancelled' && (
                              <button
                                onClick={() => onCancelBooking(booking.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl text-xs transition-colors cursor-pointer"
                                title="Cancel booking"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  {bookingFilter === 'upcoming' 
                    ? 'No upcoming trips found.' 
                    : bookingFilter === 'past' 
                      ? 'No past trips on record.' 
                      : 'You have no bookings on file.'}
                </p>
                <button
                  onClick={() => setShowQuickSearch(true)}
                  className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                >
                  Start a new search →
                </button>
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
