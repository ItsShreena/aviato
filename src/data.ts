/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Airport, Flight, Seat } from './types';
import { calculateFlightPrice } from './utils/pricing';

// Standard Premium Airport List
export const AIRPORTS: Airport[] = [
  // Major Indian Destinations
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India', timezone: 'IST' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', timezone: 'IST' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', timezone: 'IST' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', timezone: 'IST' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', timezone: 'IST' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India', timezone: 'IST' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', timezone: 'IST' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', timezone: 'IST' },
  { code: 'GOI', name: 'Dabolim / Manohar International Airport', city: 'Goa', country: 'India', timezone: 'IST' },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', timezone: 'IST' },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', timezone: 'IST' },
  { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India', timezone: 'IST' },
  { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India', timezone: 'IST' },
  { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India', timezone: 'IST' },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'India', timezone: 'IST' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', country: 'India', timezone: 'IST' },
  { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', country: 'India', timezone: 'IST' },
  { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'India', timezone: 'IST' },
  { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', country: 'India', timezone: 'IST' },
  { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', country: 'India', timezone: 'IST' },
  { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', country: 'India', timezone: 'IST' },
  { code: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore', country: 'India', timezone: 'IST' },
  { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', country: 'India', timezone: 'IST' },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', country: 'India', timezone: 'IST' },

  // Major International Destinations
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', timezone: 'GST' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', timezone: 'SGT' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', timezone: 'ICT' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', timezone: 'AST' },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'MYT' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'GMT' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'CET' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', timezone: 'EST' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', timezone: 'EST' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', timezone: 'AEST' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', timezone: 'JST' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', timezone: 'PST' },
];

// Popular Destinations for Hero & Landing Page
export interface PopularDestination {
  id: string;
  city: string;
  country: string;
  image: string;
  priceStart: number;
  rating: number;
}

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=600',
    priceStart: 58000,
    rating: 4.9,
  },
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600',
    priceStart: 48000,
    rating: 4.8,
  },
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600',
    priceStart: 46000,
    rating: 4.7,
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600',
    priceStart: 18000,
    rating: 4.9,
  },
];

// Why Choose Us Info Cards
export interface WhyChooseUsCard {
  title: string;
  description: string;
}

export const WHY_CHOOSE_US: WhyChooseUsCard[] = [
  {
    title: 'Intelligent Optimization',
    description: 'Aviato uses deep routing telemetry to find the single most eco-efficient, low-burn pathways globally, routing you faster while preserving the planet.',
  },
  {
    title: 'No-Nonsense Glass Pricing',
    description: 'Zero dark patterns or sudden convenience fees. What you see on the routing radar is the transparent real rate down to the single seat booking.',
  },
  {
    title: 'Premium Comfort Curation',
    description: 'Compare seat layouts, on-board power configurations, real-time noise indexes, and food ratings before clicking confirm.',
  },
];

// Curated Landing Page Featured Flights Database
export const FEATURED_FLIGHTS: Flight[] = [
  {
    id: 'feat-1',
    flightNumber: 'AV-202',
    airline: 'Aviato Supreme',
    airlineCode: 'AV',
    departureAirport: 'JFK',
    departureCity: 'New York',
    arrivalAirport: 'LHR',
    arrivalCity: 'London',
    departureTime: '08:30 PM',
    arrivalTime: '08:45 AM',
    date: '2026-06-25',
    duration: '7h 15m',
    stops: 0,
    layovers: [],
    price: calculateFlightPrice({ origin: 'JFK', destination: 'LHR', stops: 0, airlineCode: 'AV', flightId: 'feat-1', departureTime: '08:30 PM' }),
    seatAvailability: 14,
    isCheapest: false,
    isFastest: true,
    routeScore: 9.8,
    co2Savings: '21% CO2 reductions',
    aircraft: 'Boeing 787-9 Dreamliner',
  },
  {
    id: 'feat-2',
    flightNumber: 'AV-880',
    airline: 'Sovereign Wings',
    airlineCode: 'SW',
    departureAirport: 'CDG',
    departureCity: 'Paris',
    arrivalAirport: 'HND',
    arrivalCity: 'Tokyo',
    departureTime: '01:15 PM',
    arrivalTime: '08:50 AM',
    date: '2026-06-26',
    duration: '11h 35m',
    stops: 0,
    layovers: [],
    price: calculateFlightPrice({ origin: 'CDG', destination: 'HND', stops: 0, airlineCode: 'SW', flightId: 'feat-2', departureTime: '01:15 PM' }),
    seatAvailability: 8,
    isCheapest: true,
    isFastest: true,
    routeScore: 9.6,
    co2Savings: '17% CO2 reductions',
    aircraft: 'Airbus A350-1000',
  },
  {
    id: 'feat-3',
    flightNumber: 'AV-305',
    airline: 'Aviato Express',
    airlineCode: 'AV',
    departureAirport: 'DXB',
    departureCity: 'Dubai',
    arrivalAirport: 'SIN',
    arrivalCity: 'Singapore',
    departureTime: '10:10 AM',
    arrivalTime: '09:30 PM',
    date: '2026-06-28',
    duration: '7h 20m',
    stops: 0,
    layovers: [],
    price: calculateFlightPrice({ origin: 'DXB', destination: 'SIN', stops: 0, airlineCode: 'AV', flightId: 'feat-3', departureTime: '10:10 AM' }),
    seatAvailability: 22,
    isCheapest: true,
    isFastest: true,
    routeScore: 9.7,
    co2Savings: '19% CO2 reductions',
    aircraft: 'Boeing 777X-9',
  },
];

// Helper to calculate duration in hours & minutes between times
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic flights dynamically between selected cities
export function generateFlightsForRoute(
  fromCity: string,
  toCity: string,
  dateStr: string,
  cabinClass: 'economy' | 'business' | 'first'
): Flight[] {
  // Extract or sanitize values
  const originCode = AIRPORTS.find(a => 
    a.city.toLowerCase().includes(fromCity.toLowerCase()) || 
    a.code.toLowerCase() === fromCity.toLowerCase()
  )?.code || 'JFK';

  const destCode = AIRPORTS.find(a => 
    a.city.toLowerCase().includes(toCity.toLowerCase()) || 
    a.code.toLowerCase() === toCity.toLowerCase()
  )?.code || 'LHR';

  const originCityName = AIRPORTS.find(a => a.code === originCode)?.city || fromCity;
  const destCityName = AIRPORTS.find(a => a.code === destCode)?.city || toCity;

  // Base configurations
  const airlines = [
    { name: 'Aviato Supreme', code: 'AV' },
    { name: 'Sovereign Wings', code: 'SW' },
    { name: 'Oceanic Airline', code: 'OA' },
    { name: 'Apex Elite', code: 'AE' }
  ];
  
  const aircraftList = [
    'Boeing 787-9 Dreamliner',
    'Airbus A350-1000',
    'Boeing 777X-9',
    'Airbus A330-900neo'
  ];

  const flights: Flight[] = [];

  // Generate 4-6 flight choices
  const flightCount = getRandomInt(4, 6);

  for (let i = 0; i < flightCount; i++) {
    const isDirect = i % 2 === 0 || i === 0;
    const stopsValue = isDirect ? 0 : 1;
    
    // Choose random airline & aircraft
    const chosenAirline = airlines[i % airlines.length];
    const chosenAircraft = aircraftList[i % aircraftList.length];

    // Build Times
    const hDep = getRandomInt(6, 21);
    const mDep = [0, 15, 30, 45][getRandomInt(0, 3)];
    const depTimeStr = `${String(hDep > 12 ? hDep - 12 : hDep).padStart(2, '0')}:${String(mDep).padStart(2, '0')} ${hDep >= 12 ? 'PM' : 'AM'}`;
    
    // Duration
    const durHours = isDirect ? getRandomInt(5, 12) : getRandomInt(9, 17);
    const durMins = [0, 10, 20, 35, 45, 50][getRandomInt(0, 5)];
    const durationStr = `${durHours}h ${durMins}m`;
    
    // Calculate Arrival Time
    const hArr = (hDep + durHours) % 24;
    const mArr = (mDep + durMins) % 60;
    const arrTimeStr = `${String(hArr > 12 ? hArr - 12 : hArr).padStart(2, '0')}:${String(mArr).padStart(2, '0')} ${hArr >= 12 ? 'PM' : 'AM'}`;

    // Layovers
    const layoverCities = ['AMS (Amsterdam)', 'CDG (Paris)', 'FRA (Frankfurt)', 'DXB (Dubai)'];
    const possibleLayover = layoverCities.filter(c => !c.includes(originCityName) && !c.includes(destCityName));
    const randomLayover = possibleLayover[getRandomInt(0, possibleLayover.length - 1)];
    const layovers = isDirect ? [] : [`${randomLayover} (${getRandomInt(1, 2)}h ${[15, 30, 45][getRandomInt(0, 2)]}m)`];

    // Calculate realistic, deterministic flight price via centralized pricing engine
    const finalPrice = calculateFlightPrice({
      origin: originCode,
      destination: destCode,
      cabinClass,
      stops: stopsValue,
      airlineCode: chosenAirline.code,
      departureTime: depTimeStr,
      availableSeatsCount: 16,
      flightId: `dynamic-${originCode}-${destCode}-${i + 1}`,
    });

    // Dynamic metrics
    const routingEfficiencyScore = Number((8.5 + Math.random() * 1.4).toFixed(1));
    const savingPercent = getRandomInt(12, 28);

    flights.push({
      id: `dynamic-${originCode}-${destCode}-${i+1}`,
      flightNumber: `${chosenAirline.code}-${getRandomInt(100, 999)}`,
      airline: chosenAirline.name,
      airlineCode: chosenAirline.code,
      departureAirport: originCode,
      departureCity: originCityName,
      arrivalAirport: destCode,
      arrivalCity: destCityName,
      departureTime: depTimeStr,
      arrivalTime: arrTimeStr,
      date: dateStr,
      duration: durationStr,
      stops: stopsValue,
      layovers,
      price: finalPrice,
      seatAvailability: getRandomInt(2, 35),
      routeScore: routingEfficiencyScore,
      co2Savings: `${savingPercent}% CO2 emission savings`,
      aircraft: chosenAircraft,
    });
  }

  // Sort and highlight Cheapest vs Fastest
  flights.sort((a, b) => a.price - b.price);
  if (flights[0]) flights[0].isCheapest = true;

  // Let's analyze durations
  const parseDurMinutes = (d: string) => {
    const parts = d.split(' ');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
  };

  const flightsBySpeed = [...flights].sort((a, b) => parseDurMinutes(a.duration) - parseDurMinutes(b.duration));
  if (flightsBySpeed[0]) {
    // Flag it as fastest (unless it's the same, let him have both or keep fastest separate)
    const fastestId = flightsBySpeed[0].id;
    const found = flights.find(f => f.id === fastestId);
    if (found) found.isFastest = true;
  }

  return flights;
}

// Global default seat layout generator (30 seats)
export function generateSeats(): Seat[] {
  const seats: Seat[] = [];
  const classes: ('first' | 'business' | 'economy')[] = ['first', 'business', 'economy'];
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

  rows.forEach(row => {
    columns.forEach(letter => {
      // Class allocation
      let seatClass: 'first' | 'business' | 'economy' = 'economy';
      let mod = 0;
      if (row <= 2) {
        seatClass = 'first';
        mod = 1500;
      } else if (row <= 4) {
        seatClass = 'business';
        mod = 750;
      }

      // Check letter configuration (middle vs window)
      if (['A', 'F'].includes(letter)) {
        mod += 200; // window seat extra cost in INR
      }

      // Simulated book statuses
      let status: 'available' | 'booked' | 'selected' = 'available';
      // Randomly books seats, but guarantees some availability
      const rand = Math.random();
      if (rand < 0.35) {
        status = 'booked';
      }

      seats.push({
        id: `${row}${letter}`,
        row,
        letter,
        class: seatClass,
        status,
        priceModifier: mod
      });
    });
  });

  return seats;
}
