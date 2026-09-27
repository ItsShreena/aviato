/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plane, Leaf, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { Flight } from '../types';
import { formatINR } from '../utils/currency';

interface FlightCardProps {
  key?: React.Key;
  flight: Flight;
  onBook: (flight: Flight) => void;
  onViewDetails: (flight: Flight) => void;
}

export default function FlightCard({ flight, onBook, onViewDetails }: FlightCardProps) {
  // Brand color accents for recognizable airline carriers
  const getBrandingClass = (code: string) => {
    switch (code) {
      case 'AV': // Aviato Supreme
        return { bg: 'bg-primary/10 border-primary/20', text: 'text-primary', badge: 'bg-primary' };
      case 'SW': // Sovereign Wings / Southwest
        return { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-600' };
      case 'OA': // Oceanic Air
        return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600' };
      case 'UA': // United
        return { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', badge: 'bg-sky-600' };
      default:
        return { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800', badge: 'bg-slate-700' };
    }
  };

  const brandStyle = getBrandingClass(flight.airlineCode);

  return (
    <div 
      id={`flight-card-${flight.id}`}
      className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 relative group overflow-hidden"
    >
      {/* 1. HIERARCHY LEVEL 1: AIRLINE + FLIGHT NUMBER + BADGES */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 mb-5 border-b border-slate-100 select-none">
        {/* Left: Carrier Identity */}
        <div className="flex items-center space-x-3">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-mono font-black text-xs border shadow-2xs ${brandStyle.bg} ${brandStyle.text}`}>
            {flight.airlineCode || 'AV'}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-primary transition-colors">
              {flight.airline}
            </h4>
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80">
              {flight.flightNumber}
            </span>
            {flight.aircraft && (
              <span className="text-[11px] text-slate-400 hidden md:inline-block font-medium">
                · {flight.aircraft}
              </span>
            )}
          </div>
        </div>

        {/* Right: Environment & Feature Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {flight.providerSource === 'letsfg_sandbox' && (
            <span className="bg-amber-50 text-amber-850 border border-amber-300/80 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              LetsFG Sandbox • Test Environment
            </span>
          )}
          {flight.providerSource === 'demo' && (
            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              Demo Fallback
            </span>
          )}
          {flight.isCheapest && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Cheapest
            </span>
          )}
          {flight.isFastest && (
            <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Fastest
            </span>
          )}
          {flight.co2Savings && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2 py-0.5 rounded-full hidden sm:flex items-center gap-1">
              <Leaf className="h-3 w-3 text-emerald-600" />
              <span>{flight.co2Savings}</span>
            </span>
          )}
        </div>
      </div>

      {/* MAIN BODY: 
          LEVEL 2: DEPARTURE → ARRIVAL (Strongest Times + Clear Airport Codes)
          LEVEL 3: DURATION / STOPS
          LEVEL 4: PRICE
          LEVEL 5: SELECT FLIGHT
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* HIERARCHY LEVEL 2 & 3: ROUTE & TIMING TIMELINE (Col 1-8 on desktop) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-11 gap-3 sm:gap-4 items-center">
          
          {/* DEPARTURE: Time is strongest, Origin Airport Code clearly visible */}
          <div className="sm:col-span-4 text-left">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none block">
              {flight.departureTime}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-base sm:text-lg font-black text-primary tracking-wide">
                {flight.departureAirport}
              </span>
              <span className="text-xs text-slate-500 font-medium truncate">
                · {flight.departureCity}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
              Departure
            </span>
          </div>

          {/* DURATION / STOPS: Centered flight path segment */}
          <div className="sm:col-span-3 flex flex-col items-center justify-center px-1 py-2 sm:py-0 select-none">
            {/* Duration: Smaller but readable */}
            <span className="text-xs font-mono font-bold text-slate-600 tracking-tight flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {flight.duration}
            </span>
            
            {/* Elegant flight line with directional airplane */}
            <div className="w-full relative my-2 flex items-center">
              <div className="w-full h-[2px] bg-slate-200 rounded-full"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 absolute left-0 -translate-y-[0.5px]"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary absolute right-0 -translate-y-[0.5px]"></div>
              <div className="absolute left-1/2 -translate-x-1/2 p-1 bg-white border border-slate-200 rounded-full shadow-2xs text-primary group-hover:rotate-12 transition-transform duration-300">
                <Plane className="h-3.5 w-3.5 rotate-45" />
              </div>
            </div>

            {/* Stops indicator */}
            <span className="text-[11px] font-semibold text-slate-500">
              {flight.stops === 0 ? 'Nonstop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}${flight.layovers && flight.layovers[0] ? ` (${flight.layovers[0].split(' ')[0]})` : ''}`}
            </span>
          </div>

          {/* ARRIVAL: Time is strongest, Destination Airport Code clearly visible */}
          <div className="sm:col-span-4 text-left sm:text-right">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none block">
              {flight.arrivalTime}
            </span>
            <div className="flex items-baseline justify-start sm:justify-end gap-1.5 mt-1.5">
              <span className="font-mono text-base sm:text-lg font-black text-primary tracking-wide">
                {flight.arrivalAirport}
              </span>
              <span className="text-xs text-slate-500 font-medium truncate">
                · {flight.arrivalCity}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
              Arrival
            </span>
          </div>

        </div>

        {/* HIERARCHY LEVEL 4 & 5: PRICE & SELECT FLIGHT (Col 9-12 on desktop) */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col sm:flex-row lg:flex-col justify-between items-start sm:items-center lg:items-end gap-4">
          
          {/* LEVEL 4: PRICE (Visually prominent without being oversized) */}
          <div className="text-left lg:text-right select-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block">
              Total Fare
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 leading-none">
              {formatINR(flight.price)}
            </div>
            {flight.seatAvailability ? (
              <span className="text-[11px] font-semibold text-slate-500 mt-1.5 block">
                {flight.seatAvailability} seats remaining
              </span>
            ) : null}
          </div>

          {/* LEVEL 5: SELECT FLIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-2 w-full sm:w-auto lg:w-full justify-start sm:justify-end">
            <button
              type="button"
              id={`select-flight-btn-${flight.id}`}
              onClick={() => onBook(flight)}
              className="flex-1 sm:flex-initial px-5 py-3 bg-navy-950 hover:bg-primary text-white font-display font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 group-hover:bg-primary"
            >
              <span>Select Flight</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              id={`view-details-btn-${flight.id}`}
              onClick={() => onViewDetails(flight)}
              className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-900 font-display font-semibold rounded-2xl text-xs tracking-wider uppercase border border-slate-200/80 transition-colors cursor-pointer text-center select-none"
            >
              Details
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

