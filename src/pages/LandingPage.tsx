/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plane, Star, ShieldAlert, Award, Compass, Sparkles, Navigation } from 'lucide-react';
import { POPULAR_DESTINATIONS, WHY_CHOOSE_US, FEATURED_FLIGHTS } from '../data';
import { Flight, SearchQuery } from '../types';
import SearchForm from '../components/SearchForm';
import { formatINR } from '../utils/currency';

interface LandingPageProps {
  onSearch: (query: SearchQuery) => void;
  onBookFeatured: (flight: Flight) => void;
  onViewFeaturedDetails: (flight: Flight) => void;
  isLoading?: boolean;
}

export default function LandingPage({ onSearch, onBookFeatured, onViewFeaturedDetails, isLoading = false }: LandingPageProps) {
  
  const handleDestinationClick = (city: string) => {
    if (isLoading) return;
    onSearch({
      fromCity: 'New York',
      toCity: city,
      date: '2026-06-25',
      passengers: 1,
      cabinClass: 'economy',
    });
  };

  return (
    <div id="landing-page" className="space-y-16 pb-20 select-none">
      {/* Immersive Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-20 px-4 sm:px-6 lg:px-8 ">
        {/* Background visual graphics */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Ambient light blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-sky-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse-slow"></div>

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-sky-350 border border-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smarter flight curation & transparent pricing</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-white leading-[1.1] text-balance">
              Fly Smarter. <span className="text-sky-300">Reach Faster.</span>
            </h1>
            <p className="text-sm sm:text-base text-navy-200 font-light max-w-xl mx-auto leading-relaxed text-balance">
              Experience the world’s first route optimized flight platform. Avoid heavy layovers, maximize fuel efficiency, and access crystal-clear pricing.
            </p>
          </div>

          {/* Embedded Search Widget */}
          <div className="pt-4 max-w-4xl mx-auto">
            <SearchForm onSearch={onSearch} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Popular Destinations Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-left">
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs tracking-widest uppercase mb-1">
            <Compass className="h-4 w-4" />
            <span>Popular Destinations</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3.5xl text-slate-900 tracking-tight">
            Popular Destinations From New York
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Click any destination card to instantly view available schedules and real-time rates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleDestinationClick(dest.city)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-350 cursor-pointer flex flex-col justify-between"
            >
              {/* Image Frame */}
              <div className="relative aspect-video sm:aspect-square overflow-hidden bg-slate-100">
                <img
                  src={dest.image}
                  alt={dest.city}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="font-display font-extrabold text-base tracking-tight block">{dest.city}</span>
                  <span className="text-[10px] font-medium text-slate-200">{dest.country}</span>
                </div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-sm text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{dest.rating}</span>
                </div>
              </div>

              {/* pricing description */}
              <div className="p-4 flex items-center justify-between bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Base fare start</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">{formatINR(dest.priceStart)}</span>
                </div>
                <span className="text-xs font-semibold text-sky-600 group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-0.5">
                  Analyze →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Flight Routes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-left">
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs tracking-widest uppercase mb-1">
            <Sparkles className="h-4 w-4" />
            <span>FEATURED FLIGHT ROUTES</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3.5xl text-slate-900 tracking-tight">
            Featured Flight Routes Today
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Explore curated pathways showing lower emission ratings combined with direct routes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_FLIGHTS.map((feat) => (
            <div 
              key={feat.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-sky-50 text-sky-700 font-bold font-mono px-2 py-0.5 rounded border border-sky-100">{feat.flightNumber}</span>
                    <span className="text-xs font-bold text-slate-700">{feat.airline}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{feat.routeScore}/10 Score</span>
                </div>

                <div className="py-4 my-2 flex items-center justify-between text-slate-900">
                  <div className="text-left">
                    <span className="font-mono font-extrabold text-base">{feat.departureAirport}</span>
                    <p className="text-[9px] text-slate-400 font-medium uppercase">{feat.departureCity}</p>
                  </div>
                  <div className="flex flex-col items-center flex-1 px-4">
                    <span className="text-[9px] font-mono font-medium text-slate-400">{feat.duration}</span>
                    <Plane className="h-3.5 w-3.5 rotate-45 text-sky-500 my-0.5" />
                    <span className="text-[8px] font-bold uppercase text-emerald-500">{feat.co2Savings.split(' ')[0]} Savings</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-base">{feat.arrivalAirport}</span>
                    <p className="text-[9px] text-slate-400 font-medium uppercase">{feat.arrivalCity}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">TICKET VALUE</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-slate-900">{formatINR(feat.price)}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onBookFeatured(feat)}
                    className="px-3.5 py-2 bg-navy-900 hover:bg-sky-500 hover:text-navy-950 text-white font-semibold text-[10px] tracking-wider uppercase rounded-xl transition-all select-none cursor-pointer"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => onViewFeaturedDetails(feat)}
                    className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-650 font-semibold text-[10px] tracking-wider uppercase rounded-xl border border-slate-150 transition-colors cursor-pointer"
                  >
                    Specs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Aviato Section */}
      <section className="bg-slate-50 border-t border-b border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-sky-600 font-mono font-bold text-xs tracking-widest uppercase">AIRLINE RESHAPED</span>
            <h2 className="font-display font-black text-2xl sm:text-3.5xl text-slate-900 tracking-tight">
              Why Elite Travelers Choose Aviato
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Our intelligent routing coordinates eliminate transit overhead and optimize cabin pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_CHOOSE_US.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100/50 shadow-sm space-y-4"
              >
                {/* Decorative numeric indicator */}
                <div className="h-10 w-10 bg-sky-50 text-sky-600 border border-sky-100 rounded-2xl flex items-center justify-center font-display font-extrabold text-sm select-none">
                  0{index + 1}
                </div>
                <h3 className="font-display font-extrabold text-slate-850 text-base tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
