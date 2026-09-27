/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plane, Calendar, Clock, ArrowRight, ShieldCheck, Armchair } from 'lucide-react';
import { Flight } from '../types';
import { formatINR } from '../utils/currency';

interface BookingFlightSummaryProps {
  flight: Flight;
  selectedSeatNumber?: string | null;
  selectedSeatClass?: string | null;
  seatPriceModifier?: number;
  promoDiscount?: number;
  className?: string;
  compact?: boolean;
}

export default function BookingFlightSummary({
  flight,
  selectedSeatNumber,
  selectedSeatClass,
  seatPriceModifier = 0,
  promoDiscount = 0,
  className = '',
  compact = false,
}: BookingFlightSummaryProps) {
  const effectiveTotal = Math.max(0, flight.price + seatPriceModifier - promoDiscount);

  return (
    <div
      id="booking-flight-summary-card"
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden select-none transition-all ${className}`}
    >
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-navy-800">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-sky-400">
            <Plane className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block leading-none">
              Selected Flight
            </span>
            <span className="font-display font-extrabold text-sm text-white">
              {flight.airline} • <span className="font-mono text-sky-400">{flight.flightNumber}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {flight.aircraft && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
              {flight.aircraft}
            </span>
          )}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Flight Schedule & Details */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Route & Times */}
          <div className="sm:col-span-8 flex items-center justify-between gap-2 sm:gap-4">
            {/* Origin */}
            <div className="text-left min-w-[70px]">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                {flight.departureAirport}
              </span>
              <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px] block">
                {flight.departureCity}
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 block mt-0.5">
                {flight.departureTime}
              </span>
            </div>

            {/* Flight Path Graphic */}
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[10px] font-mono text-slate-400 font-semibold mb-1">
                {flight.duration}
              </span>
              <div className="w-full flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-slate-300 relative">
                  <Plane className="h-3 w-3 text-sky-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <span className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                {flight.stops === 0 ? 'Direct Route' : 'Layover Included'}
              </span>
            </div>

            {/* Destination */}
            <div className="text-right min-w-[70px]">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                {flight.arrivalAirport}
              </span>
              <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px] block">
                {flight.arrivalCity}
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 block mt-0.5">
                {flight.arrivalTime}
              </span>
            </div>
          </div>

          {/* Pricing Column */}
          <div className="sm:col-span-4 sm:border-l sm:border-slate-150 sm:pl-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between sm:justify-center items-end text-right">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Authoritative Fare
              </span>
              <div className="flex items-baseline justify-end gap-1.5">
                {promoDiscount > 0 && (
                  <span className="text-xs font-mono line-through text-slate-400">
                    {formatINR(flight.price + seatPriceModifier)}
                  </span>
                )}
                <span className="font-mono text-base sm:text-lg font-bold text-slate-900">
                  {formatINR(effectiveTotal)}
                </span>
              </div>
            </div>

            <div className="text-right mt-1 flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Price Locked
              </span>
              {selectedSeatNumber && (
                <div className="mt-1.5 flex flex-col items-end text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Reserved Seat No
                  </span>
                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-xs mt-0.5 inline-flex items-center gap-1">
                    <Armchair className="h-3 w-3 text-sky-500" />
                    <span>{selectedSeatNumber}</span>
                    {selectedSeatClass && (
                      <span className="text-slate-500 font-sans font-normal text-[10px]">
                        ({selectedSeatClass})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date & Aircraft Meta Sub-bar */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Travel Date: <strong className="font-semibold text-slate-700">{flight.date}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Duration: <strong className="font-semibold text-slate-700">{flight.duration}</strong></span>
              </span>
              {flight.aircraft && (
                <span className="sm:hidden font-mono text-[11px] text-slate-600">
                  {flight.aircraft}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
