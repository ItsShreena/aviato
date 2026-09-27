/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Armchair, Shield, AlertTriangle, ArrowRight, ArrowLeft, Radio, Clock, X } from 'lucide-react';
import { Seat, Flight } from '../types';
import { formatINR } from '../utils/currency';
import { useRealtimeSeats } from '../hooks/useRealtimeSeats';

interface SeatSelectorProps {
  flight: Flight;
  seats: Seat[];
  onSelectSeat: (seatId: string) => void;
  selectedSeatId: string | null;
  onConfirm: () => void;
  onBack?: () => void;
}

export default function SeatSelector({
  flight,
  seats,
  onSelectSeat,
  selectedSeatId,
  onConfirm,
  onBack,
}: SeatSelectorProps) {
  const [seatAlert, setSeatAlert] = useState<string | null>(null);

  // Real-time seat subscription and hold management
  const {
    isLiveConnected,
    lockSeat,
    unlockSeat,
    getSeatStatus,
  } = useRealtimeSeats({
    flightId: flight.id,
    selectedSeatId,
    onSeatTaken: (seatId, message) => {
      setSeatAlert(message || `Seat ${seatId} was just booked by another passenger. Please select another seat.`);
      onSelectSeat('');
    },
  });

  const handleSeatClick = async (seatId: string) => {
    setSeatAlert(null);

    // If already selected, deselect and unlock
    if (selectedSeatId === seatId) {
      onSelectSeat('');
      await unlockSeat(seatId);
      return;
    }

    // Check live dynamic status
    const currentStatus = getSeatStatus(seatId);
    if (currentStatus === 'booked') {
      setSeatAlert(`Seat ${seatId} was just booked by another passenger. Please select another seat.`);
      return;
    }
    if (currentStatus === 'locked') {
      setSeatAlert(`Seat ${seatId} is currently held by another passenger. Please select another seat.`);
      return;
    }

    // Attempt to lock on server
    const lockResult = await lockSeat(seatId);
    if (!lockResult.success) {
      setSeatAlert(lockResult.error || `Seat ${seatId} was just booked by another passenger. Please select another seat.`);
      return;
    }

    // If another seat was previously held by this user, update UI selection
    onSelectSeat(seatId);
  };

  // Cabin class split groupings
  const firstClassSeats = seats.filter(s => s.class === 'first');
  const businessSeats = seats.filter(s => s.class === 'business');
  const economySeats = seats.filter(s => s.class === 'economy');

  const selectedSeat = seats.find(s => s.id === selectedSeatId);
  const seatPriceAddon = selectedSeat ? selectedSeat.priceModifier : 0;
  const totalPrice = flight.price + seatPriceAddon;

  const renderSeatIcon = (seat: Seat) => {
    // Dynamic status from real-time engine takes absolute authority
    const dynamicStatus = getSeatStatus(seat.id);
    const isSelected = selectedSeatId === seat.id || dynamicStatus === 'selected';

    let colorClass = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 cursor-pointer'; // available
    let isDisabled = false;
    let title = `Seat ${seat.id} (${seat.class.toUpperCase()} - ${formatINR(flight.price + seat.priceModifier)}) - Available`;
    let ariaLabel = `Seat ${seat.id}, available, ${seat.class} class${seat.priceModifier > 0 ? ', +' + formatINR(seat.priceModifier) : ''}`;

    if (dynamicStatus === 'booked') {
      colorClass = 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed opacity-60';
      isDisabled = true;
      title = `Seat ${seat.id} - Unavailable (Booked)`;
      ariaLabel = `Seat ${seat.id}, unavailable`;
    } else if (dynamicStatus === 'locked') {
      colorClass = 'bg-amber-50 text-amber-600 border-amber-300 cursor-not-allowed opacity-75';
      isDisabled = true;
      title = `Seat ${seat.id} - Currently held by another traveler`;
      ariaLabel = `Seat ${seat.id}, unavailable (held)`;
    } else if (isSelected) {
      colorClass = 'bg-sky-500 text-white border-sky-600 scale-110 shadow-md shadow-sky-500/30';
      title = `Seat ${seat.id} - Selected by you (Reserved)`;
      ariaLabel = `Seat ${seat.id}, selected`;
    }

    return (
      <button
        key={seat.id}
        id={`seat-${seat.id}`}
        type="button"
        role="button"
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onClick={() => handleSeatClick(seat.id)}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 text-xs font-bold select-none focus:outline-none focus:ring-2 focus:ring-sky-500 ${colorClass}`}
        title={title}
      >
        {dynamicStatus === 'locked' ? (
          <Clock className="h-3.5 w-3.5 shrink-0 mb-0.5 text-amber-600" />
        ) : (
          <Armchair className="h-4 w-4 shrink-0 mb-0.5" />
        )}
        <span className="text-[9px] leading-none">{seat.id}</span>
      </button>
    );
  };

  const renderSeatRowGroup = (seatsList: Seat[]) => {
    const rowMap: { [key: number]: Seat[] } = {};
    seatsList.forEach(s => {
      if (!rowMap[s.row]) {
        rowMap[s.row] = [];
      }
      rowMap[s.row].push(s);
    });

    return Object.keys(rowMap).map(rowStr => {
      const rowNum = Number(rowStr);
      const rowSeats = rowMap[rowNum].sort((a, b) => a.letter.localeCompare(b.letter));
      
      const leftGroup = rowSeats.slice(0, 3);
      const rightGroup = rowSeats.slice(3, 6);

      return (
        <div key={rowNum} className="flex items-center justify-center space-x-8 mb-3">
          <span className="w-5 text-center text-xs font-mono text-slate-400 font-bold select-none">{rowNum}</span>
          
          <div className="flex space-x-2">
            {leftGroup.map(s => renderSeatIcon(s))}
          </div>

          <div className="w-1.5 h-8 bg-slate-100 rounded-full select-none" title="Aisle Walkway"></div>

          <div className="flex space-x-2">
            {rightGroup.map(s => renderSeatIcon(s))}
          </div>

          <span className="w-5 text-center text-xs font-mono text-slate-400 font-bold select-none">{rowNum}</span>
        </div>
      );
    });
  };

  return (
    <div id="seat-selector-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Cabin Visual Map Col */}
      <div className="lg:col-span-8 bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-display font-bold text-slate-900 tracking-tight text-lg">
              Cabin Layout & Seat Selection
            </h3>
            <p className="text-xs text-slate-500">
              {flight.aircraft} • Select your preferred seat below
            </p>
          </div>

          {/* Real-time Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700">
              {isLiveConnected ? 'Live seat availability' : 'Live seat availability (Syncing)'}
            </span>
          </div>
        </div>

        {/* Seat Alert Notification Banner */}
        {seatAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-amber-800 text-xs shadow-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Seat Reservation Update</p>
                <p className="mt-0.5 text-amber-800">{seatAlert}</p>
              </div>
            </div>
            <button
              onClick={() => setSeatAlert(null)}
              className="text-amber-500 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Flight Nose visual indicator */}
        <div className="mx-auto w-32 h-10 border-t-2 border-x-2 border-slate-200 rounded-t-full bg-white select-none flex items-center justify-center mb-8 text-[9px] font-sans text-slate-400 font-bold uppercase tracking-wider">
          Aircraft Front
        </div>

        {/* Legend Map */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-8 bg-white border border-slate-100 p-3.5 rounded-2xl max-w-lg mx-auto text-xs font-semibold text-slate-600 select-none">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-600 flex items-center justify-center text-[8px]"><Armchair className="h-2.5 w-2.5" /></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-amber-50 border border-amber-300 rounded text-amber-600 flex items-center justify-center text-[8px]"><Clock className="h-2.5 w-2.5" /></span>
            <span>Holding</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-50 border border-red-200 rounded text-red-500 flex items-center justify-center text-[8px]"><Armchair className="h-2.5 w-2.5" /></span>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-sky-500 border border-sky-600 rounded text-white flex items-center justify-center text-[8px]"><Armchair className="h-2.5 w-2.5" /></span>
            <span>Selected</span>
          </div>
        </div>

        {/* Outer aircraft container bounds */}
        <div className="bg-white border border-slate-200 rounded-[4rem] px-4 py-12 shadow-inner max-w-xl mx-auto">
          {/* First Class Division */}
          <div className="border-b border-dashed border-slate-200 pb-6 mb-6">
            <span className="block text-center text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">First Cabin Class</span>
            {renderSeatRowGroup(firstClassSeats)}
          </div>

          {/* Business Division */}
          <div className="border-b border-dashed border-slate-200 pb-6 mb-6">
            <span className="block text-center text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Business Cabin Class</span>
            {renderSeatRowGroup(businessSeats)}
          </div>

          {/* Economy Division */}
          <div>
            <span className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Economy Cabin Class</span>
            {renderSeatRowGroup(economySeats)}
          </div>
        </div>
      </div>

      {/* Details & Pricing Checkout Col */}
      <div id="booking-checkout-panel" className="lg:col-span-4 space-y-6">
        <div className="bg-navy-900 text-white rounded-3xl p-6 shadow-xl border border-navy-800">
          <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block mb-4">
            FLIGHT SELECTION SUMMARY
          </span>

          <div className="space-y-3 pb-6 border-b border-navy-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Flight Route</span>
              <span className="font-semibold text-white">{flight.departureAirport} → {flight.arrivalAirport}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Scheduled Flight</span>
              <span className="font-mono text-white">{flight.flightNumber}</span>
            </div>
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-400">Reserved Seat No</span>
              <div className="text-right">
                <span className="font-mono font-bold text-sky-400 block">
                  {selectedSeatId || 'None Selected'}
                </span>
                {selectedSeat && (
                  <span className="text-[10px] text-slate-400 uppercase font-medium">
                    {selectedSeat.class} Class
                  </span>
                )}
              </div>
            </div>
            {selectedSeat && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Seat Class Upgrade</span>
                <span className="font-mono text-emerald-400">
                  {selectedSeat.priceModifier > 0 ? `+${formatINR(selectedSeat.priceModifier)}` : 'Included'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between items-baseline mb-6 select-none">
            <span className="text-xs text-navy-400 font-bold uppercase tracking-wider">Estimated Total Due</span>
            <div className="flex items-baseline gap-0.5">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
                {formatINR(totalPrice)}
              </span>
            </div>
          </div>

          {/* Action triggers */}
          <div className="space-y-2.5">
            {selectedSeatId ? (
              <button
                type="button"
                id="seat-confirm-proceed-btn"
                onClick={onConfirm}
                className="w-full bg-sky-500 hover:bg-sky-400 text-navy-950 font-display font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-sky-500/15 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Proceed to Review & Payment</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            ) : (
              <div className="flex items-start gap-2.5 bg-yellow-500/10 text-yellow-500 p-3.5 rounded-2xl border border-yellow-500/20 text-xs leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Please select an available seat on the cabin map to proceed.</span>
              </div>
            )}

            {onBack && (
              <button
                type="button"
                id="seat-back-passenger-btn"
                onClick={onBack}
                className="w-full bg-white/10 hover:bg-white/15 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Passenger Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Seat upgrades guidelines helper card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-150 pb-2">
            <Shield className="h-4 w-4 text-sky-500" /> Premium Cabin Extras Explained
          </h4>
          <ul className="text-xs text-slate-500 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">Row 1-2 (First Class)</span>
              <span>180° lie-flat beds, supreme multi-course gourmet chef service, private workspace.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold">Row 3-4 (Business)</span>
              <span>150° deep recliner models, complimentary lounge cards, in-seat AC power outlets.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">A / F Column Seats</span>
              <span>Window slots are outfitted with standard electronic window shade controls.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
