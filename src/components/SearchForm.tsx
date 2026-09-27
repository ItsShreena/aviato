/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ArrowLeftRight, Calendar, Users, Briefcase, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { AIRPORTS } from '../data';
import { SearchQuery } from '../types';

interface SearchFormProps {
  onSearch: (query: SearchQuery) => void;
  initialQuery?: SearchQuery;
  isLoading?: boolean;
}

export default function SearchForm({ onSearch, initialQuery, isLoading = false }: SearchFormProps) {
  const [fromCity, setFromCity] = useState(initialQuery?.fromCity || 'New York');
  const [toCity, setToCity] = useState(initialQuery?.toCity || 'London');
  const [date, setDate] = useState(initialQuery?.date || '2026-06-25');
  const [passengers, setPassengers] = useState(initialQuery?.passengers || 1);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>(
    initialQuery?.cabinClass || 'economy'
  );

  const [fromFocus, setFromFocus] = useState(false);
  const [toFocus, setToFocus] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSwap = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Protect against rapid double clicks

    const trimmedFrom = fromCity.trim();
    const trimmedTo = toCity.trim();

    if (!trimmedFrom || !trimmedTo) {
      setErrorMessage('Please specify both an origin city and a destination city.');
      return;
    }
    if (trimmedFrom.toLowerCase() === trimmedTo.toLowerCase()) {
      setErrorMessage('Origin and destination cities cannot be identical.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a valid departure date.');
      return;
    }
    if (date < todayStr) {
      setErrorMessage('Departure date cannot be in the past.');
      return;
    }
    if (passengers < 1 || passengers > 9) {
      setErrorMessage('Passenger count must be between 1 and 9.');
      return;
    }

    setErrorMessage('');
    onSearch({
      fromCity: trimmedFrom,
      toCity: trimmedTo,
      date,
      passengers,
      cabinClass,
    });
  };

  // Helper to filter airports for auto-suggestions
  const filterAirports = (input: string) => {
    if (!input) return [];
    return AIRPORTS.filter(
      a =>
        a.city.toLowerCase().includes(input.toLowerCase()) ||
        a.code.toLowerCase().includes(input.toLowerCase()) ||
        a.name.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 4);
  };

  return (
    <div id="search-form-container" className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 max-w-5xl mx-auto">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Upper Controllers: Cabin Class and Passengers */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 select-none pb-4 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['economy', 'business', 'first'] as const).map((cl) => (
              <button
                key={cl}
                type="button"
                onClick={() => setCabinClass(cl)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  cabinClass === cl
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'hover:text-navy-900'
                }`}
              >
                {cl}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="bg-transparent font-semibold border-none focus:outline-none text-slate-700 text-xs pr-1"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} Traveler{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center text-[11px] text-sky-600 font-sans ml-auto">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
            Real-time rates and scheduling
          </div>
        </div>

        {/* Middle Inputs Grid: From, Swap, To, Date */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Origin */}
          <div className="lg:col-span-4 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              FROM (City or Code)
            </label>
            <div className={`flex items-center px-4 py-3 bg-slate-50 rounded-2xl border transition-all ${
              fromFocus ? 'border-sky-500 bg-white ring-2 ring-sky-100' : 'border-slate-200'
            }`}>
              <MapPin className="h-5 w-5 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="e.g. New York or JFK"
                value={fromCity}
                onFocus={() => { setFromFocus(true); setToFocus(false); }}
                onBlur={() => setTimeout(() => setFromFocus(false), 250)}
                onChange={(e) => setFromCity(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full placeholder-slate-400"
              />
            </div>

            {/* From Dynamic Suggestions */}
            {fromFocus && fromCity && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto">
                <p className="text-[10px] text-slate-400 font-bold px-3 py-1 uppercase tracking-wider">Suggested Airports</p>
                {filterAirports(fromCity).length > 0 ? (
                  filterAirports(fromCity).map((ap) => (
                    <button
                      key={ap.code}
                      type="button"
                      onClick={() => setFromCity(ap.city)}
                      className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span className="truncate">{ap.city} ({ap.code})</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">{ap.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 px-3 py-1 font-light italic">Type code/city to locate</p>
                )}
              </div>
            )}
          </div>

          {/* Swap Trigger Button */}
          <div className="lg:col-span-1 flex justify-center mt-4 lg:mt-5">
            <button
              type="button"
              id="swap-route-button"
              onClick={handleSwap}
              className="p-3 bg-slate-100 hover:bg-sky-500 hover:text-navy-950 text-slate-600 rounded-full transition-all duration-300 hover:scale-110 shadow-sm cursor-pointer select-none active:scale-95"
              title="Reverse routing direction"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="lg:col-span-4 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              TO (City or Code)
            </label>
            <div className={`flex items-center px-4 py-3 bg-slate-50 rounded-2xl border transition-all ${
              toFocus ? 'border-sky-500 bg-white ring-2 ring-sky-100' : 'border-slate-200'
            }`}>
              <MapPin className="h-5 w-5 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="e.g. London or LHR"
                value={toCity}
                onFocus={() => { setToFocus(true); setFromFocus(false); }}
                onBlur={() => setTimeout(() => setToFocus(false), 250)}
                onChange={(e) => setToCity(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full placeholder-slate-400"
              />
            </div>

            {/* To Dynamic Suggestions */}
            {toFocus && toCity && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto">
                <p className="text-[10px] text-slate-400 font-bold px-3 py-1 uppercase tracking-wider">Suggested Airports</p>
                {filterAirports(toCity).length > 0 ? (
                  filterAirports(toCity).map((ap) => (
                    <button
                      key={ap.code}
                      type="button"
                      onClick={() => setToCity(ap.city)}
                      className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span className="truncate">{ap.city} ({ap.code})</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">{ap.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 px-3 py-1 font-light italic">Type code/city to locate</p>
                )}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Departure Date
            </label>
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition-all">
              <Calendar className="h-5 w-5 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full pr-1"
              />
            </div>
          </div>
        </div>

        {/* Error Prompt */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-2xl border border-red-105 font-medium text-xs animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Submission Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="flight-search-submit"
            disabled={isLoading}
            className={`w-full font-display font-semibold py-4 px-6 rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-navy-800 text-slate-400 cursor-not-allowed opacity-80'
                : 'bg-navy-900 hover:bg-sky-500 hover:text-navy-950 text-white hover:shadow-sky-500/10 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-sky-400" />
                <span>Searching Available Flights...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5 shrink-0" />
                <span>Search Available Flights</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
