/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plane, Calendar, MapPin, User, Armchair, Ticket, XCircle, ChevronDown, ChevronUp, Download, CheckCircle, ShieldAlert } from 'lucide-react';
import { Booking } from '../types';
import { formatINR } from '../utils/currency';
import { downloadTicketFile } from '../utils/ticketDownload';

interface BookingCardProps {
  key?: React.Key;
  booking: Booking;
  onCancel: (bookingId: string) => void;
  initialOpen?: boolean;
}

export default function BookingCard({ booking, onCancel, initialOpen = false }: BookingCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(initialOpen);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const { flight, seatNumber, passengerName, id: bookingId, totalPrice, status } = booking;
  const isCancelled = status === 'cancelled';

  const handleDownloadRealPDF = async () => {
    setIsDownloading(true);
    try {
      await downloadTicketFile(booking);
      setHasDownloaded(true);
      setTimeout(() => setHasDownloaded(false), 3500);
    } catch (err) {
      console.error('Boarding pass download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      id={`booking-card-${bookingId}`}
      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm ${
        isCancelled 
          ? 'border-red-100 bg-red-50/10 opacity-80' 
          : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
      }`}
    >
      {/* Upper main row summary */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl ${isCancelled ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-600'} shrink-0`}>
            <Plane className={`h-6 w-6 rotate-45`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400">ID: {bookingId}</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                isCancelled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {status}
              </span>
              {flight.providerSource === 'letsfg_sandbox' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  LetsFG Sandbox
                </span>
              )}
              {flight.providerSource === 'demo' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Demo Fallback
                </span>
              )}
            </div>
            <h4 className="font-display font-black text-slate-800 text-base mt-0.5">
              {flight.departureCity} to {flight.arrivalCity}
            </h4>
            <p className="text-xs font-medium text-slate-500">
              {flight.airline} • {flight.flightNumber} • Departs: {flight.date}
            </p>
          </div>
        </div>

        {/* Pricing tag & status controls */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 border-slate-105 pt-3.5 md:pt-0">
          <div className="text-left md:text-right">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Fare Paid</span>
            <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">{formatINR(totalPrice)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="px-3.5 py-2 hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Boarding Ticket</span>
              {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {!isCancelled && (
              <button
                onClick={() => onCancel(bookingId)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-100 transition-colors cursor-pointer"
                title="Cancel flight reservation"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded digital boarding pass ticket */}
      {detailsOpen && (
        <div className="bg-slate-50/70 border-t border-slate-100 p-5 sm:p-7 animate-fadeIn select-none">
          {/* Plane Boarding Ticket simulation container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md relative overflow-hidden max-w-3xl mx-auto">
            
            {/* Ticket header strip */}
            <div className="bg-navy-950 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded-xl bg-primary/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
                  <Plane className="h-4 w-4 rotate-45" />
                </div>
                <div>
                  <span className="font-display font-black text-base tracking-wider block leading-none">AVIATO</span>
                  <span className="text-[9px] font-bold text-sky-400 tracking-widest leading-none">FLY SMARTER</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-xs sm:text-sm tracking-wider text-amber-400 block uppercase">
                  DEMO BOARDING PASS
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Aviato Demo Simulator • Not an official ticket
                </span>
              </div>
            </div>

            {/* Test Environment Banner */}
            <div className="bg-amber-50/90 border-b border-amber-200/80 px-6 py-2 flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              <span>{flight.providerSource === 'letsfg_sandbox' ? 'LETSFG SANDBOX • TEST ENVIRONMENT' : 'DEMO FALLBACK • TEST ENVIRONMENT'}</span>
              <span className="text-[10px] text-amber-700 font-semibold hidden sm:inline-block">SIMULATION USE ONLY</span>
            </div>

            {/* Ticket body */}
            <div className="p-6 sm:p-7 space-y-6">
              
              {/* Passenger Row */}
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">PASSENGER NAME</span>
                  <span className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <User className="h-4 w-4 text-slate-400" />
                    {passengerName.toUpperCase()}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">OPERATING CARRIER</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">{flight.airline}</span>
                </div>
              </div>

              {/* Route Grid: FROM -> TO with Large Airport Codes & Times */}
              <div className="border-t border-b border-slate-100 py-4 grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
                
                {/* FROM */}
                <div className="sm:col-span-4 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FROM</span>
                  <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 tracking-tight block mt-0.5">
                    {flight.departureAirport}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block truncate">
                    {flight.departureCity}
                  </span>
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">DEPARTURE</span>
                    <span className="font-mono text-base font-extrabold text-slate-900 block">{flight.departureTime}</span>
                  </div>
                </div>

                {/* Center Path */}
                <div className="sm:col-span-3 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-mono font-bold text-sky-600">{flight.duration}</span>
                  <div className="w-full relative my-2 flex items-center">
                    <div className="w-full h-0.5 bg-slate-200 rounded-full" />
                    <Plane className="h-4 w-4 rotate-90 text-sky-500 absolute left-1/2 -translate-x-1/2 -translate-y-[0.5px]" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    {flight.stops === 0 ? 'Nonstop' : `${flight.stops} Stop`}
                  </span>
                </div>

                {/* TO */}
                <div className="sm:col-span-4 text-left sm:text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TO</span>
                  <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 tracking-tight block mt-0.5">
                    {flight.arrivalAirport}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block truncate">
                    {flight.arrivalCity}
                  </span>
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">ARRIVAL</span>
                    <span className="font-mono text-base font-extrabold text-slate-900 block">{flight.arrivalTime}</span>
                  </div>
                </div>

              </div>

              {/* Details: FLIGHT, DATE, SEAT, CLASS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FLIGHT</span>
                  <span className="font-mono font-extrabold text-sm text-slate-900 block mt-0.5">{flight.flightNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DATE</span>
                  <span className="font-bold text-sm text-slate-900 block mt-0.5">{flight.date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">SEAT</span>
                  <div className="mt-0.5">
                    <span className="font-mono font-black text-sm text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 inline-block">
                      {seatNumber}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CLASS</span>
                  <span className="font-bold text-sm text-slate-900 uppercase block mt-0.5">
                    {booking.seatClass || 'Economy'}
                  </span>
                </div>
              </div>

              {/* PNR Block & Safety Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    PNR / BOOKING REFERENCE (DEMO)
                  </span>
                  <span className="font-mono font-black text-base sm:text-lg text-slate-900 tracking-wide block mt-0.5">
                    {booking.bookingNo || `AV-${bookingId.substring(0, 6).toUpperCase()}`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 max-w-sm text-left sm:text-right font-medium leading-relaxed">
                  DEMO SIMULATION RESERVATION • FOR DEMONSTRATION &amp; TESTING PURPOSES ONLY • CANNOT BE USED FOR ACTUAL AIRPORT BOARDING OR GATE ACCESS.
                </p>
              </div>

            </div>

            {/* Bottom Barcode strip & Download Button */}
            <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-center sm:text-left">
                {/* Visual barcode strip layout using CSS divs */}
                <div className="flex space-x-0.5 h-7 w-48 bg-white p-1 rounded border border-slate-200 select-none mx-auto sm:mx-0">
                  {[1,3,2,1,4,2,1,3,2,4,1,2,3,1,2,1,4,3,2,1,2,3].map((bar, ind) => (
                    <div 
                      key={ind} 
                      className="h-full bg-slate-800" 
                      style={{ width: `${bar * 1.5}px` }}
                    />
                  ))}
                </div>
                <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  DEMO PASS • NON-SCANNABLE
                </p>
              </div>

              <button
                onClick={handleDownloadRealPDF}
                disabled={isDownloading}
                className={`text-xs font-bold tracking-wide py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                  hasDownloaded 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-navy-950 hover:bg-sky-600 text-white shadow-md'
                }`}
              >
                {isDownloading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Preparing Demo Boarding Pass...</span>
                  </>
                ) : hasDownloaded ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Demo Boarding Pass Saved ✓</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Demo Boarding Pass</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
