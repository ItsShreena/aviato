/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departureAirport: string;
  departureCity: string;
  arrivalAirport: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  duration: string;
  stops: number;
  layovers: string[];
  price: number;
  seatAvailability: number;
  isCheapest?: boolean;
  isFastest?: boolean;
  routeScore: number; // 1-10 route efficiency rating
  co2Savings: string; // e.g. "18% CO2 reductions"
  aircraft: string; // e.g. "Airbus A350-1000"
  availableSeats?: string;
  providerSource?: 'letsfg_sandbox' | 'letsfg' | 'demo' | string;
  providerNotice?: string;
  searchId?: string;
  offerId?: string;
  expiresAt?: number;
}

export interface Booking {
  id: string;
  bookingNo?: string;
  passengerName: string;
  passengerEmail: string;
  passportNumber: string;
  flight: Flight;
  seatNumber: string;
  seatClass?: string;
  bookingDate: string;
  status: 'confirmed' | 'cancelled';
  totalPrice: number;
}

export interface Seat {
  id: string; // e.g. "5A"
  row: number;
  letter: string;
  class: 'first' | 'business' | 'economy';
  status: 'available' | 'booked' | 'selected' | 'locked';
  priceModifier: number;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export interface SearchQuery {
  fromCity: string;
  toCity: string;
  date: string;
  passengers: number;
  cabinClass: 'economy' | 'business' | 'first';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passportNumber?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt?: string;
}

export interface DashboardStats {
  totalFlights: number;
  totalBookings: number;
  activePassengers: number;
  revenue: number;
}
