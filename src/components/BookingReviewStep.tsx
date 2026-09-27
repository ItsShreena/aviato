/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plane,
  User,
  Armchair,
  CreditCard,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Calendar,
  Clock,
  Mail,
  FileText,
  Phone,
} from 'lucide-react';
import { Flight, Seat } from '../types';
import { formatINR } from '../utils/currency';
import { PassengerInfo } from './PassengerDetailsStep';

interface BookingReviewStepProps {
  flight: Flight;
  passenger: PassengerInfo;
  selectedSeat: Seat;
  appliedPromo: string | null;
  promoCode: string;
  promoFeedback: { type: 'success' | 'error'; message: string } | null;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  onPromoCodeChange: (code: string) => void;
  isFirstTimeUser: boolean;
  onConfirmBooking: () => Promise<void>;
  onBackToSeat: () => void;
  isProcessing: boolean;
  processingMessage?: string;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export default function BookingReviewStep({
  flight,
  passenger,
  selectedSeat,
  appliedPromo,
  promoCode,
  promoFeedback,
  onApplyPromo,
  onRemovePromo,
  onPromoCodeChange,
  isFirstTimeUser,
  onConfirmBooking,
  onBackToSeat,
  isProcessing,
  processingMessage = 'Securing your reservation...',
  errorMessage = null,
  onClearError,
}: BookingReviewStepProps) {
  // Authoritative calculations
  const baseFlightFare = flight.price;
  const seatUpgradeFare = selectedSeat.priceModifier || 0;
  const subtotalFare = baseFlightFare + seatUpgradeFare;
  const discountFare = (appliedPromo && isFirstTimeUser) ? Math.round(subtotalFare * 0.10) : 0;
  const authoritativeTotal = Math.max(0, subtotalFare - discountFare);

  // Mock payment fields state for UI realism
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('382');
  const [cardName, setCardName] = useState(passenger.name || 'Alexander Vance');

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    await onConfirmBooking();
  };

  return (
    <div id="booking-review-step-view" className="max-w-4xl mx-auto space-y-8 select-none text-left">
      {/* Step Header */}
      <div className="text-center sm:text-left border-b border-slate-150 pb-4">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Step 4 of 4
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Final Verification
          </span>
        </div>
        <h2 className="font-display font-black text-slate-900 text-2xl sm:text-3xl tracking-tight mt-1.5">
          Review & Confirm Your Reservation
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Please verify your flight itinerary, passenger credentials, and seat selection before finalizing payment.
        </p>
      </div>

      {/* Error notification banner if booking failed */}
      {errorMessage && (
        <div
          id="booking-error-banner"
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs flex items-start justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 text-sm">Booking Attention Required</p>
              <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-rose-500 hover:text-rose-800 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 2-Column Grid: Review Details (Left 7 cols) & Pricing Breakdown / Confirm (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Flight, Passenger, Seat cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. FLIGHT DETAILS CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Plane className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                    Flight Itinerary
                  </span>
                  <span className="font-display font-bold text-sm text-slate-900">
                    {flight.airline} • <span className="font-mono text-sky-600">{flight.flightNumber}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {flight.providerSource === 'letsfg_sandbox' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Sandbox Test Offer
                  </span>
                )}
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Route & Times */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <span className="font-mono text-2xl font-black text-slate-900 block leading-none">
                  {flight.departureAirport}
                </span>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  {flight.departureCity}
                </span>
                <span className="font-mono text-xs text-slate-600 font-semibold block mt-0.5">
                  {flight.departureTime}
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center px-4">
                <span className="text-[10px] font-mono text-slate-400 font-medium mb-1">
                  {flight.duration}
                </span>
                <div className="w-full flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-2xl font-black text-slate-900 block leading-none">
                  {flight.arrivalAirport}
                </span>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  {flight.arrivalCity}
                </span>
                <span className="font-mono text-xs text-slate-600 font-semibold block mt-0.5">
                  {flight.arrivalTime}
                </span>
              </div>
            </div>

            {/* Sub-bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Date: <strong className="text-slate-800">{flight.date}</strong></span>
              </div>
              {flight.aircraft && (
                <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {flight.aircraft}
                </span>
              )}
            </div>
          </div>

          {/* 2. PASSENGER DETAILS CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Passenger Verification
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium text-[11px]">Primary Passenger</span>
                <p className="font-bold text-slate-900 text-sm">{passenger.name}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium text-[11px]">Confirmation Email</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{passenger.email}</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium text-[11px]">Passport / Official ID</span>
                <p className="font-mono font-bold text-slate-900 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{passenger.passportNumber}</span>
                </p>
              </div>

              {passenger.phone && (
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium text-[11px]">Mobile Contact</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{passenger.phone}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. SEAT & CABIN DETAILS CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Armchair className="h-4 w-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Seat & Cabin Class
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reserved Seat No
                </span>
                <span className="font-mono font-black text-sm text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 mt-0.5 inline-block">
                  Seat {selectedSeat.id}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium text-[11px]">Cabin Allocation</span>
                <p className="font-bold text-slate-900 uppercase tracking-wide">
                  {selectedSeat.class} Class
                </p>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-slate-400 font-medium text-[11px]">Seat Premium</span>
                <p className="font-mono font-bold text-slate-800">
                  {selectedSeat.priceModifier > 0 ? `+${formatINR(selectedSeat.priceModifier)}` : 'Included'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-relaxed">
              {selectedSeat.class === 'first' && 'Includes 180° lie-flat suite, multi-course chef dining, private bar access, and fast-track security.'}
              {selectedSeat.class === 'business' && 'Includes 150° deep recliner, premium priority boarding, luxury amenities kit, and lounge access.'}
              {selectedSeat.class === 'economy' && 'Includes ergonomic seat with adjustable headrest, complimentary beverage service, and in-flight entertainment.'}
            </p>
          </div>
        </div>

        {/* Right Col: Price Breakdown & Final Booking Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-navy-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-navy-800 space-y-6">
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block">
              AUTHORITATIVE FARE SUMMARY
            </span>

            {/* Line items */}
            <div className="space-y-3 pb-5 border-b border-navy-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Flight Base Fare</span>
                <span className="font-mono font-semibold text-white">{formatINR(baseFlightFare)}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Seat Selection ({selectedSeat.id})</span>
                <span className="font-mono font-semibold text-white">
                  {seatUpgradeFare > 0 ? `+${formatINR(seatUpgradeFare)}` : 'Included'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Taxes, Carrier & Security Fees</span>
                <span className="font-mono font-semibold text-emerald-400">Included in Fare</span>
              </div>

              {discountFare > 0 && (
                <div className="flex justify-between items-center text-xs bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl text-emerald-300">
                  <span className="flex items-center gap-1 font-semibold">
                    <Tag className="h-3 w-3" />
                    First-Time Discount ({appliedPromo})
                  </span>
                  <span className="font-mono font-bold">-{formatINR(discountFare)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">
                  Total Amount Due
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">All taxes & fees included</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xl sm:text-2xl font-bold text-white block leading-tight">
                  {formatINR(authoritativeTotal)}
                </span>
              </div>
            </div>

            {/* Promo Code Input Field */}
            <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-3.5 space-y-2">
              <label htmlFor="promo-code-input" className="block text-[11px] font-bold text-slate-300">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code-input"
                  type="text"
                  value={promoCode}
                  onChange={(e) => onPromoCodeChange(e.target.value)}
                  placeholder="e.g. FIRST10"
                  className="bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 uppercase flex-1 focus:outline-none focus:border-sky-500"
                />
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={onRemovePromo}
                    className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApplyPromo(promoCode)}
                    className="bg-sky-500 hover:bg-sky-400 text-navy-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
              {promoFeedback && (
                <p
                  className={`text-[11px] font-medium mt-1 ${
                    promoFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {promoFeedback.message}
                </p>
              )}
            </div>

            {/* Mock Card Preview */}
            <div className="bg-navy-900/60 border border-navy-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <CreditCard className="h-4 w-4 text-sky-400" />
                  Aviato Sandbox Simulator
                </span>
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Lock className="h-3 w-3" /> No Payment Required
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 bg-navy-950/80 px-3 py-2 rounded-xl border border-navy-800 flex justify-between items-center">
                <span>•••• •••• •••• 4444 (Test Card)</span>
                <span className="text-slate-400">12/28</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="booking-confirm-btn"
                disabled={isProcessing}
                onClick={handleFinalSubmit}
                className={`w-full py-4 px-6 rounded-2xl font-display font-extrabold text-sm tracking-wide shadow-xl transition-all transform flex items-center justify-center gap-2 cursor-pointer ${
                  isProcessing
                    ? 'bg-sky-500/50 text-navy-950/60 cursor-not-allowed'
                    : 'bg-sky-500 hover:bg-sky-400 text-navy-950 hover:-translate-y-0.5 active:translate-y-0 shadow-sky-500/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>{processingMessage}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-navy-950" />
                    <span>Confirm Demo Reservation & Issue PNR</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="booking-back-seat-btn"
                disabled={isProcessing}
                onClick={onBackToSeat}
                className="w-full bg-white/10 hover:bg-white/15 text-slate-300 font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Seat Selection</span>
              </button>
            </div>
          </div>

          {/* Guarantee pill */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Simulated seat assignment & demo PNR generation for testing & development.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
