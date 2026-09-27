/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, Armchair, ChevronRight, CheckCircle2, Shield, Wifi, Zap, Coffee, Tv, Info, Leaf } from 'lucide-react';
import { Flight } from '../types';
import { formatINR } from '../utils/currency';

interface FlightDetailsPageProps {
  flight: Flight;
  onBack: () => void;
  onProceedToSeatSelection: () => void;
}

export default function FlightDetailsPage({
  flight,
  onBack,
  onProceedToSeatSelection,
}: FlightDetailsPageProps) {
  
  const amenities = [
    { label: 'Satellite Wi-Fi', icon: Wifi, desc: 'Complimentary high-speed connection' },
    { label: 'In-seat Power Outlets', icon: Zap, desc: '110V AC outlets + USB-C' },
    { label: 'Curated Chef Dining', icon: Coffee, desc: 'A-la-carte airline cuisine select' },
    { label: '4K Ent. Screens', icon: Tv, desc: '1,500+ movies on demand' },
  ];

  return (
    <div id="flight-details-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      {/* Upper action header */}
      <div>
        <button
          onClick={onBack}
          className="group flex items-center space-x-2 text-slate-650 hover:text-navy-950 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to flight results</span>
        </button>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Details and Layovers Timeline Box */}
        <div className="lg:col-span-8 space-y-6">
          {/* Specs layout Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-widest text-sky-620 uppercase">AIRCRAFT SPECIFICATIONS</span>
                  {flight.providerSource === 'letsfg_sandbox' && (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sandbox Test Offer
                    </span>
                  )}
                </div>
                <h2 className="font-display font-extrabold text-navy-950 text-xl tracking-tight mt-1">
                  {flight.aircraft}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {flight.airline} • Flight Code: {flight.flightNumber}
                </p>
              </div>

              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/30 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold font-display">
                <Leaf className="h-4 w-4 fill-emerald-100" />
                <span>{flight.co2Savings}</span>
              </div>
            </div>

            {/* Immersive segment timeline */}
            <div className="space-y-8 relative pl-6 border-l-2 border-slate-200">
              
              {/* Departure segment */}
              <div className="relative">
                {/* Visual custom timeline bullet */}
                <div className="absolute -left-9 top-1.5 h-6 w-6 rounded-full bg-white border-2 border-navy-900 flex items-center justify-center text-[10px] text-navy-900 font-bold">
                  D
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-base font-extrabold text-navy-950">{flight.departureTime}</span>
                    <span className="text-xs font-bold text-sky-650">{flight.departureAirport}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">{flight.departureCity}</h4>
                  <p className="text-xs text-slate-500 font-light mt-1">{flight.departureAirport} Terminal. Baggage drop opens 3 hours prior.</p>
                </div>
              </div>

              {/* Layovers division segment */}
              {flight.stops > 0 ? (
                <div className="relative">
                  {/* Visual layover node bullet */}
                  <div className="absolute -left-9 top-1 h-6 w-6 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-500 font-bold text-xs">
                    !
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">LAYOVER INFO</span>
                    <p className="text-xs text-slate-700 font-semibold mt-1">
                      {flight.layovers[0] || '1 Layover required'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-light mt-1">
                      Cabin luggage remains checked-in. Security re-clearing guidelines depend on country rules.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Visual nonstop line decorator */}
                  <div className="absolute -left-9 top-1.5 h-6 w-6 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                    ✓
                  </div>
                  <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-4 text-xs">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">DIRECT FLIGHT PATHWAY</span>
                    <p className="text-slate-600 mt-1">
                      Non-stop transcontinental routing. Route score rated at <span className="font-bold text-emerald-700">{flight.routeScore}/10</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Arrival segment */}
              <div className="relative">
                {/* Visual custom timeline bullet */}
                <div className="absolute -left-9 top-1.5 h-6 w-6 rounded-full bg-white border-2 border-sky-600 flex items-center justify-center text-[10px] text-sky-600 font-bold">
                  A
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-base font-extrabold text-navy-950">{flight.arrivalTime}</span>
                    <span className="text-xs font-bold text-sky-650">{flight.arrivalAirport}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">{flight.arrivalCity}</h4>
                  <p className="text-xs text-slate-500 font-light mt-1">Estimated standard local arrival timezone time.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Cabin Amenities Grid Box */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-slate-900 tracking-tight text-base pb-3 border-b border-slate-50">
              Complimentary Cabin Amenities Included
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {amenities.map((item, id) => {
                const Icon = item.icon;
                return (
                  <div key={id} className="flex space-x-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-2.5 bg-white text-sky-600 border border-slate-150 rounded-xl shrink-0 shadow-sm">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-850 text-xs block">{item.label}</span>
                      <span className="text-[10px] text-slate-450 mt-0.5 block">{item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pricing CTA checkout Panel Col */}
        <div id="booking-cta-pane" className="lg:col-span-4 space-y-6">
          <div className="bg-navy-900 text-white rounded-3xl p-6 shadow-xl border border-navy-800 space-y-6">
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block">
              PRICE SUMMARY
            </span>

            <div className="space-y-2">
              <span className="text-xs text-navy-300">Base flight fare:</span>
              <div className="flex items-baseline gap-1 select-none">
                <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {formatINR(flight.price)}
                </span>
              </div>
            </div>

            <div className="bg-navy-950 p-4 rounded-2xl border border-navy-850 space-y-2.5 text-xs text-navy-300">
              <div className="flex justify-between items-center">
                <span>Seat availability:</span>
                <span className="font-mono font-bold text-white">{flight.seatAvailability} spots</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cancellation rules:</span>
                <span className="text-emerald-400">Refundable within 24h</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Efficiency rating:</span>
                <span className="text-sky-300 font-bold">{flight.routeScore}/10</span>
              </div>
            </div>

            <button
              onClick={onProceedToSeatSelection}
              className="w-full bg-sky-500 hover:bg-sky-400 text-navy-950 font-display font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-sky-500/15 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Armchair className="h-4 w-4" />
              <span>Proceed to Seat Selection</span>
            </button>
          </div>

          {/* Secure validation guidelines ticket */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Shield className="h-4 w-4 text-sky-600" /> Booking Guarantee rules
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              Your flight routing selection is temporarily secured for 15 minutes while you choose your seating configuration. No pricing hikes or re-schedulings will happen while checked.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
