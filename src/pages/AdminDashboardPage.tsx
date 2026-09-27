/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Plane, Map, Plus, Database, Activity, Sparkles, Trash2, ShieldAlert, CheckCircle, RefreshCw, BarChart2, TrendingUp, Users, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import { Airport, Booking, Flight } from '../types';
import { AIRPORTS } from '../data';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import { formatINR } from '../utils/currency';

interface AdminDashboardPageProps {
  flights: Flight[];
  setFlights: React.Dispatch<React.SetStateAction<Flight[]>>;
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
}

export default function AdminDashboardPage({
  flights,
  setFlights,
  bookings,
  onCancelBooking,
}: AdminDashboardPageProps) {
  const [activeTab, setActiveTab] = useState('flights');

  // Generate dynamic booking trends based on actual confirmed bookings state plus organic seeds
  const bookingTrendsData = useMemo(() => {
    const baseBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
    return [
      { day: 'Mon', bookings: 14 + (baseBookingsCount > 0 ? 1 : 0), revenue: 5600 + (baseBookingsCount * 220) },
      { day: 'Tue', bookings: 22 + (baseBookingsCount > 1 ? 2 : 0), revenue: 8800 + (baseBookingsCount * 310) },
      { day: 'Wed', bookings: 19 + (baseBookingsCount > 2 ? 1 : 0), revenue: 7600 + (baseBookingsCount * 180) },
      { day: 'Thu', bookings: 31 + (baseBookingsCount > 3 ? 3 : 0), revenue: 12400 + (baseBookingsCount * 450) },
      { day: 'Fri', bookings: 38 + (baseBookingsCount > 4 ? 4 : 0), revenue: 15200 + (baseBookingsCount * 520) },
      { day: 'Sat', bookings: 26 + (baseBookingsCount > 5 ? 2 : 0), revenue: 10400 + (baseBookingsCount * 280) },
      { day: 'Sun', bookings: 45 + (baseBookingsCount > 0 ? baseBookingsCount : 1), revenue: 18000 + (baseBookingsCount * 600) },
    ];
  }, [bookings]);

  // Generate dynamic occupancy rates by carrier based on confirmed passenger bookings
  const occupancyData = useMemo(() => {
    const carriers = [
      { name: 'Aviato Supreme', code: 'AV', baseOccupancy: 82, color: '#0B3D91' },
      { name: 'Sovereign Wings', code: 'SW', baseOccupancy: 74, color: '#38BDF8' },
      { name: 'Oceanic Airline', code: 'OA', baseOccupancy: 61, color: '#F59E0B' },
      { name: 'Apex Elite', code: 'AE', baseOccupancy: 88, color: '#0F172A' },
    ];

    const confirmed = bookings.filter(b => b.status === 'confirmed');
    return carriers.map((carrier) => {
      const carrierBookings = confirmed.filter(b => b.flight.airlineCode === carrier.code).length;
      // Boost occupancy rate dynamically with registered check-ins
      const Occupancy = Math.min(99, carrier.baseOccupancy + (carrierBookings * 3));
      return {
        name: carrier.name,
        code: carrier.code,
        Occupancy,
        color: carrier.color,
      };
    });
  }, [bookings]);

  // New Flight form state
  const [newFlightNo, setNewFlightNo] = useState('AV-550');
  const [newAirline, setNewAirline] = useState('Aviato Express');
  const [newAirlineCode, setNewAirlineCode] = useState('AV');
  const [newOrigin, setNewOrigin] = useState('JFK');
  const [newDest, setNewDest] = useState('LHR');
  const [newPrice, setNewPrice] = useState(450);
  const [newDate, setNewDate] = useState('2026-06-25');
  const [newDuration, setNewDuration] = useState('7h 10m');
  const [newAircraft, setNewAircraft] = useState('Airbus A350-1000');
  const [newCo2, setNewCo2] = useState('18% CO2 emission savings');
  const [newScore, setNewScore] = useState(9.5);

  const [formSuccess, setFormSuccess] = useState('');

  // Calculations for KPI Cards
  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const averageTicketPrice = activeBookings.length > 0 ? Math.round(totalRevenue / activeBookings.length) : 0;
  const loadFactor = activeBookings.length > 0 ? Math.min(100, Math.round((activeBookings.length / (flights.length * 4)) * 100)) : 0;

  const handleCreateFlight = (e: React.FormEvent) => {
    e.preventDefault();
    
    const depCityName = AIRPORTS.find(a => a.code === newOrigin)?.city || 'Custom Origin';
    const arrCityName = AIRPORTS.find(a => a.code === newDest)?.city || 'Custom Destination';

    const newFlightItem: Flight = {
      id: `admin-created-${Date.now()}`,
      flightNumber: newFlightNo,
      airline: newAirline,
      airlineCode: newAirlineCode,
      departureAirport: newOrigin,
      departureCity: depCityName,
      arrivalAirport: newDest,
      arrivalCity: arrCityName,
      departureTime: '11:15 AM',
      arrivalTime: '11:30 PM',
      date: newDate,
      duration: newDuration,
      stops: 0,
      layovers: [],
      price: Number(newPrice),
      seatAvailability: 42,
      routeScore: Number(newScore),
      co2Savings: newCo2,
      aircraft: newAircraft,
    };

    setFlights(prev => [newFlightItem, ...prev]);
    setFormSuccess('New flight route created successfully!');
    setTimeout(() => setFormSuccess(''), 4000);

    // Reset random properties for quick repeats
    setNewFlightNo(`AV-${Math.floor(Math.random() * 800) + 100}`);
  };

  const handleDeleteFlight = (id: string) => {
    setFlights(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div id="admin-dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      
      {/* KPI Stats upper row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Consolidated Revenue"
          value={formatINR(totalRevenue)}
          description="Total value of booked passenger fares"
          icon={Database}
          trend={{ type: 'up', value: `+${formatINR(totalRevenue > 0 ? totalRevenue : 0)}` }}
        />
        <DashboardCard
          title="Active Bookings"
          value={activeBookings.length}
          description="Confirmed passenger bookings count"
          icon={Activity}
          trend={{ type: 'neutral', value: 'Live' }}
        />
        <DashboardCard
          title="Average Ticket Value"
          value={formatINR(averageTicketPrice)}
          description="Average fare paid per booked seat"
          icon={Plus}
        />
        <DashboardCard
          title="Flight Capacity Factor"
          value={`${loadFactor}%`}
          description="Average percentage of seats occupied"
          icon={Sparkles}
          trend={{ type: 'up', value: 'Optimal' }}
        />
      </div>

      {/* Main administrative body structure */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar selection */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic subview rendering area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 min-h-[480px]">
          
          {/* TAB 1: FLIGHTS HUB */}
          {activeTab === 'flights' && (
            <div id="tab-flights-content" className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                <div>
                  <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">Flight Directives Manager</h3>
                  <p className="text-xs text-slate-500 mt-1">Add, view, or delete flights in the system repository.</p>
                </div>
                <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                  Total Routes: {flights.length} Active
                </span>
              </div>

              {/* Add Flight Form */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest block flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-sky-500" /> Create New Flight Route
                </span>

                <form onSubmit={handleCreateFlight} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  {/* Flight No */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Flight ID</label>
                    <input
                      type="text"
                      required
                      value={newFlightNo}
                      onChange={(e) => setNewFlightNo(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    />
                  </div>

                  {/* Airline name */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Airline Carrier</label>
                    <input
                      type="text"
                      required
                      value={newAirline}
                      onChange={(e) => setNewAirline(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    />
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Carrier Code</label>
                    <select
                      value={newAirlineCode}
                      onChange={(e) => setNewAirlineCode(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    >
                      <option value="AV">AV (Aviato Supreme)</option>
                      <option value="SW">SW (Sovereign Wings)</option>
                      <option value="OA">OA (Oceanic Airline)</option>
                      <option value="AE">AE (Apex Elite)</option>
                    </select>
                  </div>

                  {/* Origin */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Origin Code</label>
                    <select
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    >
                      {AIRPORTS.map(ap => <option key={ap.code} value={ap.code}>{ap.code} ({ap.city})</option>)}
                    </select>
                  </div>

                  {/* Dest */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Destination Code</label>
                    <select
                      value={newDest}
                      onChange={(e) => setNewDest(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    >
                      {AIRPORTS.map(ap => <option key={ap.code} value={ap.code}>{ap.code} ({ap.city})</option>)}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    />
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Route score (1-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      required
                      value={newScore}
                      onChange={(e) => setNewScore(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:border-sky-500 w-full"
                    />
                  </div>

                  {/* Dispatch CTA */}
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-navy-900 hover:bg-sky-500 hover:text-navy-950 text-white font-semibold text-xs tracking-wide py-3 px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      Create Flight Route
                    </button>
                  </div>
                </form>

                {formSuccess && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-xs font-medium animate-fadeIn select-none">
                    <CheckCircle className="h-4 w-4" />
                    <span>{formSuccess}</span>
                  </div>
                )}
              </div>

              {/* Flights Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-55 bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                      <th className="p-4">Flight</th>
                      <th className="p-4">Carrier</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Base price</th>
                      <th className="p-4">aircraft type</th>
                      <th className="p-4">score</th>
                      <th className="p-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-705">
                    {flights.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/40">
                        <td className="p-4 font-mono font-bold text-slate-900">{f.flightNumber}</td>
                        <td className="p-4">{f.airline}</td>
                        <td className="p-4 font-mono text-[11px]">
                          {f.departureAirport} → {f.arrivalAirport} 
                        </td>
                        <td className="p-4 font-mono text-slate-900">{formatINR(f.price)}</td>
                        <td className="p-4 font-light text-slate-400">{f.aircraft}</td>
                        <td className="p-4 text-emerald-600 font-mono">{f.routeScore}/10</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteFlight(f.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Remove flight model"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AIRPORTS DATABASE */}
          {activeTab === 'airports' && (
            <div id="tab-airports-content" className="space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">Active Airport Hubs</h3>
                <p className="text-xs text-slate-500 mt-1">Directory of global airport hubs coordinating with Aviato operations.</p>
              </div>

              {/* Airports Cards list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AIRPORTS.map((ap) => (
                  <div key={ap.code} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center space-x-3.5">
                    <div className="h-10 w-10 bg-white rounded-xl border border-slate-150 flex items-center justify-center font-mono font-black text-sky-600 shrink-0">
                      {ap.code}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">{ap.city} ({ap.code})</span>
                      <p className="text-[10px] text-slate-400 block font-medium uppercase mt-0.5">{ap.name}</p>
                      <p className="text-[9px] text-sky-600 font-mono font-bold uppercase mt-1">Timezone: {ap.timezone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}          {/* TAB 3: LIVE BOOKINGS */}
          {activeTab === 'bookings' && (
            <div id="tab-bookings-content" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                <div>
                  <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">Passenger Bookings List</h3>
                  <p className="text-xs text-slate-500 mt-1">Review active and cancelled customer bookings currently stored in memory.</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                  Active Bookings: {bookings.filter(b => b.status === "confirmed").length} confirmed
                </span>
              </div>

              {bookings.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Booking ID</th>
                        <th className="p-4">Passenger Name</th>
                        <th className="p-4">Route Path</th>
                        <th className="p-4">Assigned Seat</th>
                        <th className="p-4">Total Fare</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-705">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/40">
                          <td className="p-4 font-mono font-bold text-slate-800">AV-{b.id.toUpperCase()}</td>
                          <td className="p-4">{b.passengerName}</td>
                          <td className="p-4 font-mono">
                            {b.flight.departureAirport} → {b.flight.arrivalAirport}
                          </td>
                          <td className="p-4 text-sky-600 font-mono font-bold">{b.seatNumber}</td>
                          <td className="p-4 font-mono text-slate-900">{formatINR(b.totalPrice)}</td>
                          <td className="p-4">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {b.status === 'confirmed' ? (
                              <button
                                onClick={() => onCancelBooking(b.id)}
                                className="text-red-550 text-[10px] uppercase font-extrabold hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-slate-400 font-light italic text-[10px]">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center text-slate-600 text-xs font-light">
                  No active mock travelers registered in React state yet. Select flights on the main dashboard to check values.
                </div>
              )}
            </div>
          )}
          {/* TAB 4: SYSTEM ANALYTICS */}
          {activeTab === 'analytics' && (
            <div id="tab-analytics-content" className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">Aviato Efficiency & Operations Analytics</h3>
                <p className="text-xs text-slate-500 mt-1">Review live performance metrics, seat capacities, booking volumes, and active fleet efficiency factors.</p>
              </div>

              {/* Data Visualizations Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* 1. Booking & Revenue Volume Trends */}
                <div className="bg-white border border-slate-150 p-5 sm:p-6 rounded-3xl shadow-[0_4px_22px_-4px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black tracking-widest text-[#0B3D91] uppercase block">volume indicators</span>
                      <h4 className="font-display font-bold text-slate-900 text-sm">Booking Volume & Revenue Trends</h4>
                    </div>
                    <div className="bg-sky-50 text-sky-600 p-2 rounded-xl border border-sky-100">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bookingTrendsData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsPriceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0B3D91" stopOpacity={0.16} />
                            <stop offset="95%" stopColor="#0B3D91" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                        <XAxis 
                          dataKey="day" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => formatINR(value)}
                          tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600, fontFamily: 'monospace' }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-100 rounded-xl shadow-lg text-left text-xs">
                                  <p className="font-bold text-slate-800">{payload[0].payload.day} Reservations</p>
                                  <div className="mt-1 space-y-0.5">
                                    <p className="text-slate-500">Bookings: <span className="font-mono font-bold text-slate-800">{payload[0].payload.bookings} tickets</span></p>
                                    <p className="text-primary font-bold">Revenue: {formatINR(payload[0].payload.revenue)}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#0B3D91" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#analyticsPriceGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium text-center italic">Weekly cyclic reservation density and dynamic gross revenue telemetry</p>
                </div>

                {/* 2. Seat Occupancy percentages */}
                <div className="bg-white border border-slate-150 p-5 sm:p-6 rounded-3xl shadow-[0_4px_22px_-4px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black tracking-widest text-[#FFB703] uppercase block">fleet capacities</span>
                      <h4 className="font-display font-bold text-slate-900 text-sm">Seat Occupancy Factor by Carrier</h4>
                    </div>
                    <div className="bg-amber-50 text-amber-600 p-2 rounded-xl border border-amber-100">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                        <XAxis 
                          dataKey="code" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600, fontFamily: 'monospace' }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#F8FAFC', opacity: 0.5 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-100 rounded-xl shadow-lg text-left text-xs">
                                  <p className="font-bold text-slate-800">{item.name}</p>
                                  <p className="mt-1 text-[#0B3D91] font-bold">Avg. Occupancy: {item.Occupancy}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="Occupancy" radius={[8, 8, 0, 0]} maxBarSize={45}>
                          {occupancyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium text-center italic">Calculated load ratios representing passenger seat allocation across operational hubs</p>
                </div>

              </div>

              {/* Carbon Reduction & Trajectory Optimization Panel */}
              <div className="space-y-6 bg-slate-50/60 border border-slate-100 rounded-3xl p-6">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block flex items-center gap-1.5 select-none">
                  <BarChart2 className="h-4 w-4 text-emerald-500" /> Carbon Offset & Flight Trajectory Index
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Aviato Supreme (AV)</span>
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-xl font-black text-emerald-600">24.2%</span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Saved Fuel</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Sovereign Wings (SW)</span>
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-xl font-black text-emerald-600">19.5%</span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Saved Fuel</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '69%' }}></div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Oceanic Airline (OA)</span>
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-xl font-black text-emerald-600">14.8%</span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Saved Fuel</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '48%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed font-light">
                  <ShieldAlert className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Aviato routes are dynamically configured with high-altitude optimized vector paths. By using live wind data and aerodynamic trajectory planning, our fleet reduces fuel consumption and minimizes carbon offsets by an average of 19.5% per route passenger.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
