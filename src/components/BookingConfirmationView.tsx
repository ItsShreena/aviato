/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CheckCircle2, Plane, Mail, ShieldAlert, Armchair, Calendar, Clock, Ticket, ArrowRight, Home, Download, Compass, FileText } from 'lucide-react';
import { Booking } from '../types';
import { formatINR } from '../utils/currency';
import { downloadTicketFile } from '../utils/ticketDownload';
import BookingCard from './BookingCard';

interface BookingConfirmationViewProps {
  booking: Booking;
  emailStatus: { sent: boolean; message?: string | null } | null;
  onViewMyBookings: () => void;
  onBackToHome: () => void;
  onCancelBooking: (bookingId: string) => void;
  onGoToTravelHub?: () => void;
}

export default function BookingConfirmationView({
  booking,
  emailStatus,
  onViewMyBookings,
  onBackToHome,
  onCancelBooking,
  onGoToTravelHub,
}: BookingConfirmationViewProps) {
  const { flight, seatNumber, passengerName, id: bookingId, totalPrice, bookingDate } = booking;
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadedFilename, setDownloadedFilename] = useState<string | null>(null);

  const handleDownloadTicket = async () => {
    setIsDownloading(true);
    try {
      const res = await downloadTicketFile(booking);
      setDownloadedFilename(res.filename);
      setHasDownloaded(true);
      setTimeout(() => setHasDownloaded(false), 4000);
    } catch (err) {
      console.error('Failed to download ticket:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div id="booking-confirmation-view" className="max-w-4xl mx-auto space-y-8 select-none text-left py-4">
      {/* 1. Header Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
        <div className="mx-auto h-14 w-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono font-black text-emerald-800 uppercase tracking-widest block">
            {flight.providerSource === 'letsfg_sandbox' ? 'LETSFG SANDBOX • TEST ENVIRONMENT' : 'AVIATO AIRLINES • DEMO FALLBACK'}
          </span>
          <h2 className="font-display font-black text-slate-900 text-2xl sm:text-3xl tracking-tight">
            ✓ Demo Reservation Confirmed
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {flight.providerSource === 'letsfg_sandbox'
              ? 'Test reservation recorded using LetsFG Sandbox flight data. Simulated seat assignment and test PNR preserved.'
              : 'Test reservation recorded using Demo Fallback flight data. Simulated seat assignment and test PNR preserved.'}
          </p>
        </div>

        {/* Real Email Delivery Status */}
        <div className="pt-2 max-w-xl mx-auto">
          {emailStatus?.sent ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-emerald-100/90 py-2 px-4 rounded-full border border-emerald-300 shadow-2xs">
              <Mail className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Booking confirmed. A confirmation email has been sent to your email address ({booking.passengerEmail}).</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-900 bg-amber-50 py-2 px-4 rounded-full border border-amber-200 shadow-2xs">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Booking confirmed. We couldn&apos;t send the confirmation email. Your booking is still available in My Bookings.</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Clear Key Summary Box displaying all required fields */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-150 pb-5">
          <div>
            <span className="text-[10px] font-mono font-black text-sky-600 uppercase tracking-widest block">
              {flight.providerSource === 'letsfg_sandbox' ? 'LETSFG SANDBOX TEST RECORD' : 'DEMO FALLBACK TEST RECORD'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-semibold">PNR / Booking ID:</span>
              <span className="font-mono font-black text-lg text-slate-900 bg-slate-100 px-3 py-0.5 rounded-lg border border-slate-200">
                {bookingId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              id="confirmation-summary-download-btn"
              onClick={handleDownloadTicket}
              disabled={isDownloading}
              className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl text-xs border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-sky-600" />
              )}
              <span>{hasDownloaded ? 'Pass Saved ✓' : 'Download Boarding Pass (Demo)'}</span>
            </button>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Fare (Simulated)
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold text-slate-900">
                {formatINR(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Grid of details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Passenger Name</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{passengerName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Flight Number</span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {flight.flightNumber} <span className="text-slate-500 font-sans font-normal text-xs">({flight.airline})</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Route</span>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">
              {flight.departureAirport} → {flight.arrivalAirport}
            </p>
          </div>

          {/* Reserved Seat No: Aligned down below label */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Reserved Seat No</span>
            <div className="mt-0.5">
              <span className="font-mono font-extrabold text-sky-700 text-sm bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 inline-flex items-center gap-1.5">
                <Armchair className="h-3.5 w-3.5 text-sky-600" />
                <span>{seatNumber}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Sub-grid */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px] block">Travel Date</span>
              <strong className="text-slate-800">{flight.date}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px] block">Departure Time</span>
              <strong className="text-slate-800">{flight.departureTime} ({flight.departureAirport})</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px] block">Arrival Time</span>
              <strong className="text-slate-800">{flight.arrivalTime} ({flight.arrivalAirport})</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Boarding Pass Ticket View with PDF Download */}
      <div className="space-y-3">
        <div className="flex items-center justify-between ml-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            BOARDING PASS PREVIEW
          </span>
          <button
            type="button"
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Demo Boarding Pass</span>
          </button>
        </div>
        <BookingCard booking={booking} onCancel={onCancelBooking} initialOpen={true} />
      </div>

      {/* 4. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 select-none">
        <button
          type="button"
          id="confirmation-download-ticket-btn"
          onClick={handleDownloadTicket}
          disabled={isDownloading}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Preparing Boarding Pass...</span>
            </>
          ) : hasDownloaded ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-white" />
              <span>Demo Boarding Pass Saved ✓</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Demo Boarding Pass</span>
            </>
          )}
        </button>

        {onGoToTravelHub && (
          <button
            type="button"
            id="confirmation-travel-hub-btn"
            onClick={onGoToTravelHub}
            className="w-full sm:w-auto px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-navy-950 font-display font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <Compass className="h-4 w-4" />
            <span>Go to Travel Hub</span>
          </button>
        )}

        <button
          type="button"
          id="confirmation-view-bookings-btn"
          onClick={onViewMyBookings}
          className="w-full sm:w-auto px-6 py-3.5 bg-navy-900 hover:bg-sky-500 hover:text-navy-950 text-white font-display font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center gap-2"
        >
          <Ticket className="h-4 w-4" />
          <span>View My Bookings</span>
        </button>

        <button
          type="button"
          id="confirmation-back-home-btn"
          onClick={onBackToHome}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-display font-semibold rounded-2xl text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}
