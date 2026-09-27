import bcrypt from 'bcryptjs';
import { getFullCabinSeats } from './utils/seats';
import { calculateFlightPrice } from './utils/pricing';

export interface AircraftRecord {
  id: string;
  name: string;
  model: string;
  capacity: number;
  range: number;
  speed: number;
  amenities: string;
  interiorImage: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AirportRecord {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightRecord {
  id: string;
  flightNo: string;
  airline: string;
  airlineCode: string;
  departureCity: string;
  arrivalCity: string;
  departureAirportId?: string;
  departureAirport: AirportRecord;
  arrivalAirportId?: string;
  arrivalAirport: AirportRecord;
  departureTime: string;
  arrivalTime: string;
  date: string;
  duration: string;
  stops: number;
  price: number;
  cabinClass: string;
  availableSeats: string;
  aircraftId?: string;
  aircraft: {
    id?: string;
    name: string;
    model: string;
    status: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRecord {
  id: string;
  email: string;
  password: string; // bcrypt hash
  name: string;
  passportNumber?: string;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRecord {
  id: string;
  bookingNo: string;
  flightId: string;
  flight: FlightRecord;
  userId?: string;
  passengerName: string;
  passengerEmail: string;
  passportNumber: string;
  seatId: string;
  seatClass: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  totalPrice: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 1. Curated Fleet of 15 Luxury Aircraft
export const FALLBACK_AIRCRAFT: AircraftRecord[] = [
  {
    id: 'ac-1',
    name: 'Gulfstream G650ER',
    model: 'G650ER',
    capacity: 19,
    range: 13890,
    speed: 956,
    amenities: 'Private Suite,Master Bath,High-Speed Wi-Fi,Full Galley,Dining Area,Sleep Configurations',
    interiorImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ac-2',
    name: 'Bombardier Global 7500',
    model: 'Global 7500',
    capacity: 19,
    range: 14260,
    speed: 982,
    amenities: 'Four Living Spaces,Dedicated Crew Suite,Full-Size Bed,En-Suite Shower,Ka-band Connectivity',
    interiorImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ac-3',
    name: 'Dassault Falcon 8X',
    model: 'Falcon 8X',
    capacity: 16,
    range: 11945,
    speed: 900,
    amenities: 'Quietest Cabin in Class,Advanced Acoustic Insulation,Shower,Tri-Jet Redundancy,Ergonomic Lounge',
    interiorImage: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ac-4',
    name: 'Boeing 787-9 Dreamliner',
    model: 'Boeing 787-9',
    capacity: 32,
    range: 14140,
    speed: 903,
    amenities: 'Presidential Suite,High Ceiling Architecture,Dimming Windows,Culinary Galley,Lie-flat Suites',
    interiorImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ac-5',
    name: 'Airbus A350-1000 Sovereign',
    model: 'Airbus A350-1000',
    capacity: 28,
    range: 16100,
    speed: 910,
    amenities: 'En-Suite Bedroom,Private Conference Suite,Quiet Airflow Technology,Bespoke Champagne Cellar',
    interiorImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const fallbackAircraftMap = new Map<string, AircraftRecord>();
FALLBACK_AIRCRAFT.forEach(a => fallbackAircraftMap.set(a.id, a));

// 2. Airports Directory (24 Indian + 12 International Hubs)
export const FALLBACK_AIRPORTS: AirportRecord[] = [
  // Major Indian Destinations
  { id: 'ap-del', code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { id: 'ap-bom', code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
  { id: 'ap-blr', code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
  { id: 'ap-hyd', code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
  { id: 'ap-maa', code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India' },
  { id: 'ap-ccu', code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India' },
  { id: 'ap-pnq', code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India' },
  { id: 'ap-amd', code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India' },
  { id: 'ap-goi', code: 'GOI', name: 'Dabolim / Manohar International Airport', city: 'Goa', country: 'India' },
  { id: 'ap-cok', code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India' },
  { id: 'ap-jai', code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India' },
  { id: 'ap-lko', code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India' },
  { id: 'ap-bho', code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India' },
  { id: 'ap-idr', code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India' },
  { id: 'ap-pat', code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'India' },
  { id: 'ap-gau', code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', country: 'India' },
  { id: 'ap-sxr', code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', country: 'India' },
  { id: 'ap-vns', code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'India' },
  { id: 'ap-ixc', code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', country: 'India' },
  { id: 'ap-bbi', code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', country: 'India' },
  { id: 'ap-nag', code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', country: 'India' },
  { id: 'ap-cjb', code: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore', country: 'India' },
  { id: 'ap-ixr', code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', country: 'India' },
  { id: 'ap-atq', code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', country: 'India' },

  // Major International Destinations
  { id: 'ap-dxb', code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
  { id: 'ap-sin', code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { id: 'ap-bkk', code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { id: 'ap-doh', code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
  { id: 'ap-kul', code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia' },
  { id: 'ap-lhr', code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { id: 'ap-cdg', code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { id: 'ap-jfk', code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
  { id: 'ap-yyz', code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
  { id: 'ap-syd', code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
  { id: 'ap-hnd', code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan' },
  { id: 'ap-sfo', code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States' },
];

const findAirport = (code: string) => FALLBACK_AIRPORTS.find(a => a.code === code) || FALLBACK_AIRPORTS[0];

// 3. Curated Flights (Extensive coverage of Indian Hubs and Global Gateways)
export const FALLBACK_FLIGHTS: FlightRecord[] = [
  // Delhi <-> Mumbai
  {
    id: 'fl-del-bom-1',
    flightNo: 'AI-805',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Delhi',
    arrivalCity: 'Mumbai',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BOM'),
    departureTime: '06:00 AM',
    arrivalTime: '08:15 AM',
    date: '2026-06-25',
    duration: '2h 15m',
    stops: 0,
    price: 140,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A350-900', model: 'A350-900', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-bom-2',
    flightNo: '6E-204',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Delhi',
    arrivalCity: 'Mumbai',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BOM'),
    departureTime: '09:30 AM',
    arrivalTime: '11:40 AM',
    date: '2026-06-25',
    duration: '2h 10m',
    stops: 0,
    price: 95,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A321neo', model: 'A321neo', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-bom-3',
    flightNo: 'UK-955',
    airline: 'Vistara Royal',
    airlineCode: 'UK',
    departureCity: 'Delhi',
    arrivalCity: 'Mumbai',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BOM'),
    departureTime: '02:15 PM',
    arrivalTime: '04:30 PM',
    date: '2026-06-25',
    duration: '2h 15m',
    stops: 0,
    price: 165,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 787-9 Dreamliner', model: '787-9', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-bom-4',
    flightNo: 'AV-411',
    airline: 'Aviato Supreme',
    airlineCode: 'AV',
    departureCity: 'Delhi',
    arrivalCity: 'Mumbai',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BOM'),
    departureTime: '07:45 PM',
    arrivalTime: '09:55 PM',
    date: '2026-06-25',
    duration: '2h 10m',
    stops: 0,
    price: 240,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Gulfstream G650ER', model: 'G650ER', status: 'ACTIVE' }
  },

  // Mumbai <-> Delhi
  {
    id: 'fl-bom-del-1',
    flightNo: 'AI-806',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Mumbai',
    arrivalCity: 'Delhi',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('DEL'),
    departureTime: '07:00 AM',
    arrivalTime: '09:10 AM',
    date: '2026-06-25',
    duration: '2h 10m',
    stops: 0,
    price: 135,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A350-900', model: 'A350-900', status: 'ACTIVE' }
  },
  {
    id: 'fl-bom-del-2',
    flightNo: '6E-205',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Mumbai',
    arrivalCity: 'Delhi',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('DEL'),
    departureTime: '01:30 PM',
    arrivalTime: '03:45 PM',
    date: '2026-06-25',
    duration: '2h 15m',
    stops: 0,
    price: 105,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A321neo', model: 'A321neo', status: 'ACTIVE' }
  },

  // Mumbai <-> Bengaluru
  {
    id: 'fl-bom-blr-1',
    flightNo: '6E-512',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Mumbai',
    arrivalCity: 'Bengaluru',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('BLR'),
    departureTime: '08:15 AM',
    arrivalTime: '10:00 AM',
    date: '2026-06-25',
    duration: '1h 45m',
    stops: 0,
    price: 88,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },
  {
    id: 'fl-bom-blr-2',
    flightNo: 'AI-608',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Mumbai',
    arrivalCity: 'Bengaluru',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('BLR'),
    departureTime: '12:45 PM',
    arrivalTime: '02:30 PM',
    date: '2026-06-25',
    duration: '1h 45m',
    stops: 0,
    price: 110,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 787-9 Dreamliner', model: '787-9', status: 'ACTIVE' }
  },
  {
    id: 'fl-bom-blr-3',
    flightNo: 'AV-312',
    airline: 'Aviato Supreme',
    airlineCode: 'AV',
    departureCity: 'Mumbai',
    arrivalCity: 'Bengaluru',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('BLR'),
    departureTime: '06:30 PM',
    arrivalTime: '08:15 PM',
    date: '2026-06-25',
    duration: '1h 45m',
    stops: 0,
    price: 195,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Bombardier Global 7500', model: 'Global 7500', status: 'ACTIVE' }
  },

  // Bengaluru <-> Mumbai
  {
    id: 'fl-blr-bom-1',
    flightNo: '6E-513',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Bengaluru',
    arrivalCity: 'Mumbai',
    departureAirport: findAirport('BLR'),
    arrivalAirport: findAirport('BOM'),
    departureTime: '10:45 AM',
    arrivalTime: '12:30 PM',
    date: '2026-06-25',
    duration: '1h 45m',
    stops: 0,
    price: 92,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },

  // Delhi <-> Bengaluru
  {
    id: 'fl-del-blr-1',
    flightNo: 'UK-801',
    airline: 'Vistara Royal',
    airlineCode: 'UK',
    departureCity: 'Delhi',
    arrivalCity: 'Bengaluru',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BLR'),
    departureTime: '06:15 AM',
    arrivalTime: '09:00 AM',
    date: '2026-06-25',
    duration: '2h 45m',
    stops: 0,
    price: 160,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A321neo', model: 'A321neo', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-blr-2',
    flightNo: '6E-2115',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Delhi',
    arrivalCity: 'Bengaluru',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BLR'),
    departureTime: '04:00 PM',
    arrivalTime: '06:45 PM',
    date: '2026-06-25',
    duration: '2h 45m',
    stops: 0,
    price: 125,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },

  // Delhi <-> Bhopal
  {
    id: 'fl-del-bho-1',
    flightNo: 'AI-433',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Delhi',
    arrivalCity: 'Bhopal',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BHO'),
    departureTime: '06:20 AM',
    arrivalTime: '07:45 AM',
    date: '2026-06-25',
    duration: '1h 25m',
    stops: 0,
    price: 90,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-bho-2',
    flightNo: '6E-219',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Delhi',
    arrivalCity: 'Bhopal',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BHO'),
    departureTime: '05:10 PM',
    arrivalTime: '06:35 PM',
    date: '2026-06-25',
    duration: '1h 25m',
    stops: 0,
    price: 78,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-bho-3',
    flightNo: 'AV-108',
    airline: 'Aviato Supreme',
    airlineCode: 'AV',
    departureCity: 'Delhi',
    arrivalCity: 'Bhopal',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('BHO'),
    departureTime: '08:30 PM',
    arrivalTime: '09:50 PM',
    date: '2026-06-25',
    duration: '1h 20m',
    stops: 0,
    price: 180,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Cessna Citation Longitude', model: 'Longitude', status: 'ACTIVE' }
  },

  // Bhopal <-> Delhi
  {
    id: 'fl-bho-del-1',
    flightNo: 'AI-434',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Bhopal',
    arrivalCity: 'Delhi',
    departureAirport: findAirport('BHO'),
    arrivalAirport: findAirport('DEL'),
    departureTime: '08:30 AM',
    arrivalTime: '09:55 AM',
    date: '2026-06-25',
    duration: '1h 25m',
    stops: 0,
    price: 92,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },

  // Delhi <-> Hyderabad
  {
    id: 'fl-del-hyd-1',
    flightNo: '6E-554',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Delhi',
    arrivalCity: 'Hyderabad',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('HYD'),
    departureTime: '07:30 AM',
    arrivalTime: '09:40 AM',
    date: '2026-06-25',
    duration: '2h 10m',
    stops: 0,
    price: 110,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A321neo', model: 'A321neo', status: 'ACTIVE' }
  },

  // Mumbai <-> Goa
  {
    id: 'fl-bom-goi-1',
    flightNo: '6E-677',
    airline: 'IndiGo',
    airlineCode: '6E',
    departureCity: 'Mumbai',
    arrivalCity: 'Goa',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('GOI'),
    departureTime: '11:00 AM',
    arrivalTime: '12:15 PM',
    date: '2026-06-25',
    duration: '1h 15m',
    stops: 0,
    price: 75,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A320neo', model: 'A320neo', status: 'ACTIVE' }
  },

  // Delhi <-> Dubai
  {
    id: 'fl-del-dxb-1',
    flightNo: 'EK-511',
    airline: 'Emirates Executive',
    airlineCode: 'EK',
    departureCity: 'Delhi',
    arrivalCity: 'Dubai',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('DXB'),
    departureTime: '10:00 AM',
    arrivalTime: '12:30 PM',
    date: '2026-06-25',
    duration: '3h 30m',
    stops: 0,
    price: 450,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 777-300ER', model: '777-300ER', status: 'ACTIVE' }
  },
  {
    id: 'fl-del-dxb-2',
    flightNo: 'AI-995',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Delhi',
    arrivalCity: 'Dubai',
    departureAirport: findAirport('DEL'),
    arrivalAirport: findAirport('DXB'),
    departureTime: '08:15 PM',
    arrivalTime: '10:45 PM',
    date: '2026-06-25',
    duration: '3h 30m',
    stops: 0,
    price: 320,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 787-9 Dreamliner', model: '787-9', status: 'ACTIVE' }
  },

  // Mumbai <-> London
  {
    id: 'fl-bom-lhr-1',
    flightNo: 'BA-198',
    airline: 'British Airways',
    airlineCode: 'BA',
    departureCity: 'Mumbai',
    arrivalCity: 'London',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('LHR'),
    departureTime: '01:45 PM',
    arrivalTime: '06:30 PM',
    date: '2026-06-25',
    duration: '9h 15m',
    stops: 0,
    price: 780,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 777-300ER', model: '777-300ER', status: 'ACTIVE' }
  },
  {
    id: 'fl-bom-lhr-2',
    flightNo: 'AI-131',
    airline: 'Air India',
    airlineCode: 'AI',
    departureCity: 'Mumbai',
    arrivalCity: 'London',
    departureAirport: findAirport('BOM'),
    arrivalAirport: findAirport('LHR'),
    departureTime: '06:30 AM',
    arrivalTime: '11:30 AM',
    date: '2026-06-25',
    duration: '9h 30m',
    stops: 0,
    price: 640,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 787-9 Dreamliner', model: '787-9', status: 'ACTIVE' }
  },

  // New York <-> London (Flagship Curated)
  {
    id: 'feat-1',
    flightNo: 'AV-202',
    airline: 'Aviato Supreme',
    airlineCode: 'AV',
    departureCity: 'New York',
    arrivalCity: 'London',
    departureAirport: findAirport('JFK'),
    arrivalAirport: findAirport('LHR'),
    departureTime: '08:30 PM',
    arrivalTime: '08:45 AM',
    date: '2026-06-25',
    duration: '7h 15m',
    stops: 0,
    price: 620,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Boeing 787-9 Dreamliner', model: 'Boeing 787-9', status: 'ACTIVE' }
  },
  {
    id: 'fl-jfk-lhr-2',
    flightNo: 'BA-178',
    airline: 'British Airways',
    airlineCode: 'BA',
    departureCity: 'New York',
    arrivalCity: 'London',
    departureAirport: findAirport('JFK'),
    arrivalAirport: findAirport('LHR'),
    departureTime: '09:00 AM',
    arrivalTime: '09:15 PM',
    date: '2026-06-25',
    duration: '7h 15m',
    stops: 0,
    price: 590,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A350-1000', model: 'A350-1000', status: 'ACTIVE' }
  },

  // Paris <-> Tokyo
  {
    id: 'feat-2',
    flightNo: 'AV-880',
    airline: 'Sovereign Wings',
    airlineCode: 'SW',
    departureCity: 'Paris',
    arrivalCity: 'Tokyo',
    departureAirport: findAirport('CDG'),
    arrivalAirport: findAirport('HND'),
    departureTime: '01:15 PM',
    arrivalTime: '08:50 AM',
    date: '2026-06-26',
    duration: '11h 35m',
    stops: 0,
    price: 940,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Airbus A350-1000', model: 'Airbus A350-1000', status: 'ACTIVE' }
  },

  // Dubai <-> Singapore
  {
    id: 'feat-3',
    flightNo: 'AV-305',
    airline: 'Aviato Express',
    airlineCode: 'AV',
    departureCity: 'Dubai',
    arrivalCity: 'Singapore',
    departureAirport: findAirport('DXB'),
    arrivalAirport: findAirport('SIN'),
    departureTime: '10:10 AM',
    arrivalTime: '09:30 PM',
    date: '2026-06-28',
    duration: '7h 20m',
    stops: 0,
    price: 480,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: { name: 'Gulfstream G650ER', model: 'Gulfstream G650ER', status: 'ACTIVE' }
  }
];

// In-memory dynamic flights map with authoritative realistic pricing
export const fallbackFlightsMap = new Map<string, FlightRecord>();
FALLBACK_FLIGHTS.forEach(f => {
  f.price = calculateFlightPrice({
    origin: f.departureAirport.code,
    destination: f.arrivalAirport.code,
    stops: f.stops,
    airlineCode: f.airlineCode,
    departureTime: f.departureTime,
    flightId: f.id,
    cabinClass: 'economy',
  });
  fallbackFlightsMap.set(f.id, f);
});

// 4. Default Seeded Users
const defaultAdminHash = bcrypt.hashSync('admin123', 10);
const defaultTravelerHash = bcrypt.hashSync('traveler123', 10);

export const fallbackUsersMap = new Map<string, UserRecord>();

const initialUsers: UserRecord[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@aviato.vip',
    password: defaultAdminHash,
    name: 'Victoria Stirling',
    role: 'ADMIN',
    passportNumber: 'US-987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'usr-traveler-1',
    email: 'traveler@aviato.vip',
    password: defaultTravelerHash,
    name: 'Julian Sterling',
    role: 'CUSTOMER',
    passportNumber: 'US-123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'usr-alex-1',
    email: 'alex.vance@sovereign-holdings.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Alexander Vance',
    role: 'CUSTOMER',
    passportNumber: 'US-7748921C',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'usr-mani-1',
    email: 'mani.23bsa10066@vitbhopal.ac.in',
    password: defaultTravelerHash,
    name: 'Mani Vance',
    role: 'CUSTOMER',
    passportNumber: 'US-7748921C',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

initialUsers.forEach(u => fallbackUsersMap.set(u.email.toLowerCase(), u));

// 5. In-Memory Bookings Map
export const fallbackBookingsMap = new Map<string, BookingRecord>();

// Pre-seed a couple of initial confirmed bookings for demonstration
const initialBooking1: BookingRecord = {
  id: 'bk-init-1',
  bookingNo: 'AV-104921',
  flightId: 'feat-1',
  flight: FALLBACK_FLIGHTS[0],
  userId: 'usr-traveler-1',
  passengerName: 'Sarah Jenkins',
  passengerEmail: 'sarah.jenkins@elite-travel.com',
  passportNumber: 'N6739981A',
  seatId: '3A',
  seatClass: 'Business Class',
  status: 'CONFIRMED',
  totalPrice: 695,
  createdAt: new Date(Date.now() - 86400000 * 2),
  updatedAt: new Date(Date.now() - 86400000 * 2),
};

const initialBooking2: BookingRecord = {
  id: 'bk-init-2',
  bookingNo: 'AV-294012',
  flightId: 'feat-2',
  flight: FALLBACK_FLIGHTS[1],
  userId: 'usr-traveler-1',
  passengerName: 'John Jenkins',
  passengerEmail: 'john@jenkins-holdings.co',
  passportNumber: 'A8830113B',
  seatId: '1F',
  seatClass: 'First Class',
  status: 'CONFIRMED',
  totalPrice: 1110,
  createdAt: new Date(Date.now() - 86400000),
  updatedAt: new Date(Date.now() - 86400000),
};

fallbackBookingsMap.set(initialBooking1.id, initialBooking1);
fallbackBookingsMap.set(initialBooking2.id, initialBooking2);

// Dynamic Route Generator (Generates multiple choices per route with independent seat inventories)
export function getOrCreateFallbackFlightsForRoute(fromCity: string, toCity: string, dateStr: string = '2026-06-25'): FlightRecord[] {
  // Check if existing pre-seeded flights match
  const matched = Array.from(fallbackFlightsMap.values()).filter(f =>
    (f.departureCity.toLowerCase().includes(fromCity.toLowerCase()) || f.departureAirport.code.toLowerCase() === fromCity.toLowerCase()) &&
    (f.arrivalCity.toLowerCase().includes(toCity.toLowerCase()) || f.arrivalAirport.code.toLowerCase() === toCity.toLowerCase())
  );

  if (matched.length >= 2) {
    return matched;
  }

  const depAirport = FALLBACK_AIRPORTS.find(a => 
    a.city.toLowerCase().includes(fromCity.toLowerCase()) || 
    a.code.toLowerCase() === fromCity.toLowerCase()
  ) || {
    id: `ap-dep-${Date.now()}`,
    code: fromCity.substring(0, 3).toUpperCase(),
    name: `${fromCity} Airport`,
    city: fromCity,
    country: 'India'
  };

  const arrAirport = FALLBACK_AIRPORTS.find(a => 
    a.city.toLowerCase().includes(toCity.toLowerCase()) || 
    a.code.toLowerCase() === toCity.toLowerCase()
  ) || {
    id: `ap-arr-${Date.now()}`,
    code: toCity.substring(0, 3).toUpperCase(),
    name: `${toCity} Airport`,
    city: toCity,
    country: 'India'
  };

  const isDomestic = depAirport.country === 'India' && arrAirport.country === 'India';

  const dynamicAirlines = isDomestic ? [
    { name: 'Air India', code: 'AI' },
    { name: 'IndiGo', code: '6E' },
    { name: 'Vistara Royal', code: 'UK' },
    { name: 'Aviato Supreme', code: 'AV' }
  ] : [
    { name: 'Aviato Supreme', code: 'AV' },
    { name: 'Emirates Executive', code: 'EK' },
    { name: 'British Airways', code: 'BA' },
    { name: 'Singapore Airlines', code: 'SQ' }
  ];

  const schedules = isDomestic ? [
    { dep: '06:30 AM', arr: '08:45 AM', dur: '2h 15m', basePrice: 90, stops: 0 },
    { dep: '11:15 AM', arr: '01:25 PM', dur: '2h 10m', basePrice: 110, stops: 0 },
    { dep: '04:45 PM', arr: '07:05 PM', dur: '2h 20m', basePrice: 140, stops: 0 },
    { dep: '08:30 PM', arr: '10:40 PM', dur: '2h 10m', basePrice: 175, stops: 0 },
  ] : [
    { dep: '08:00 AM', arr: '03:30 PM', dur: '7h 30m', basePrice: 580, stops: 0 },
    { dep: '01:30 PM', arr: '09:45 PM', dur: '8h 15m', basePrice: 640, stops: 0 },
    { dep: '06:15 PM', arr: '07:30 AM', dur: '9h 15m', basePrice: 720, stops: 0 },
    { dep: '10:45 PM', arr: '02:15 PM', dur: '11h 30m', basePrice: 850, stops: 1 },
  ];

  const aircraftOptions = [
    { name: 'Airbus A321neo', model: 'A321neo' },
    { name: 'Boeing 787-9 Dreamliner', model: '787-9' },
    { name: 'Airbus A350-900', model: 'A350-900' },
    { name: 'Gulfstream G650ER', model: 'G650ER' },
  ];

  const generatedList: FlightRecord[] = [...matched];

  for (let i = matched.length; i < 4; i++) {
    const flightId = `dyn-${depAirport.code.toLowerCase()}-${arrAirport.code.toLowerCase()}-${i + 1}`;
    const airline = dynamicAirlines[i % dynamicAirlines.length];
    const sched = schedules[i % schedules.length];
    const aircraft = aircraftOptions[i % aircraftOptions.length];

    const calculatedPrice = calculateFlightPrice({
      origin: depAirport.code,
      destination: arrAirport.code,
      stops: sched.stops,
      airlineCode: airline.code,
      departureTime: sched.dep,
      availableSeatsCount: 20,
      flightId,
      cabinClass: 'economy',
    });

    const newFlight: FlightRecord = {
      id: flightId,
      flightNo: `${airline.code}-${Math.floor(200 + Math.random() * 799)}`,
      airline: airline.name,
      airlineCode: airline.code,
      departureCity: depAirport.city,
      arrivalCity: arrAirport.city,
      departureAirport: depAirport,
      arrivalAirport: arrAirport,
      departureTime: sched.dep,
      arrivalTime: sched.arr,
      date: dateStr,
      duration: sched.dur,
      stops: sched.stops,
      price: calculatedPrice,
      cabinClass: 'First',
      availableSeats: getFullCabinSeats().join(','), // Independent seat inventory per flight
      aircraft: {
        name: aircraft.name,
        model: aircraft.model,
        status: 'ACTIVE'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    fallbackFlightsMap.set(flightId, newFlight);
    generatedList.push(newFlight);
  }

  return generatedList;
}

export function getOrCreateFallbackFlight(fromCity: string, toCity: string, dateStr: string = '2026-06-25'): FlightRecord {
  const flights = getOrCreateFallbackFlightsForRoute(fromCity, toCity, dateStr);
  return flights[0];
}
