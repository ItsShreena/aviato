/**
 * AVIATO Centralized Realistic Flight Pricing Engine (Frontend Client)
 * 
 * Computes realistic DEMO prices based on:
 * - Great-circle route distance (Haversine formula in km)
 * - Domestic vs International classification
 * - Short / Medium / Long-haul distance tiers
 * - Destination airport & market factor
 * - Number of stops (direct premium vs connecting discount)
 * - Airline carrier positioning
 * - Availability / seat demand factor
 * - Deterministic seed variation for guaranteed price stability
 * - Extreme value protection boundaries
 */

export interface AirportGeo {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export const AIRPORT_COORDINATES: Record<string, AirportGeo> = {
  // Indian Domestic Hubs
  DEL: { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', lat: 28.5562, lng: 77.1000 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  BLR: { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India', lat: 13.1986, lng: 77.7066 },
  HYD: { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India', lat: 17.2403, lng: 78.4294 },
  MAA: { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', lat: 12.9941, lng: 80.1709 },
  CCU: { code: 'CCU', name: 'Netaji Subhash Chandra Bose International', city: 'Kolkata', country: 'India', lat: 22.6520, lng: 88.4463 },
  PNQ: { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', lat: 18.5821, lng: 73.9197 },
  AMD: { code: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', country: 'India', lat: 23.0726, lng: 72.6347 },
  GOI: { code: 'GOI', name: 'Dabolim / Manohar International', city: 'Goa', country: 'India', lat: 15.3808, lng: 73.8313 },
  COK: { code: 'COK', name: 'Cochin International', city: 'Kochi', country: 'India', lat: 10.1520, lng: 76.4019 },
  JAI: { code: 'JAI', name: 'Jaipur International', city: 'Jaipur', country: 'India', lat: 26.8242, lng: 75.8122 },
  LKO: { code: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', country: 'India', lat: 26.7606, lng: 80.8893 },
  BHO: { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India', lat: 23.2874, lng: 77.3378 },
  IDR: { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India', lat: 22.7217, lng: 75.8011 },
  PAT: { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'India', lat: 25.5913, lng: 85.0880 },
  GAU: { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International', city: 'Guwahati', country: 'India', lat: 26.1061, lng: 91.5859 },
  SXR: { code: 'SXR', name: 'Sheikh ul-Alam International', city: 'Srinagar', country: 'India', lat: 33.9871, lng: 74.7742 },
  VNS: { code: 'VNS', name: 'Lal Bahadur Shastri International', city: 'Varanasi', country: 'India', lat: 25.4524, lng: 82.8593 },
  IXC: { code: 'IXC', name: 'Shaheed Bhagat Singh International', city: 'Chandigarh', country: 'India', lat: 30.6735, lng: 76.7885 },
  BBI: { code: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar', country: 'India', lat: 20.2444, lng: 85.8178 },
  NAG: { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International', city: 'Nagpur', country: 'India', lat: 21.0922, lng: 79.0472 },
  CJB: { code: 'CJB', name: 'Coimbatore International', city: 'Coimbatore', country: 'India', lat: 11.0300, lng: 77.0434 },
  IXR: { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', country: 'India', lat: 23.3143, lng: 85.3217 },
  ATQ: { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International', city: 'Amritsar', country: 'India', lat: 31.7096, lng: 74.7973 },

  // International Hubs & Gateways
  DXB: { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  SIN: { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  BKK: { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lng: 100.7501 },
  DOH: { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6080 },
  KUL: { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lng: 101.7072 },
  LHR: { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  CDG: { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  JFK: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781 },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  HND: { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', lat: 37.6213, lng: -122.3790 },
};

/**
 * Resolves an airport record by code, city name, or partial match
 */
export function resolveAirport(query: string): AirportGeo {
  if (!query) {
    return AIRPORT_COORDINATES.DEL;
  }
  const clean = query.trim().toUpperCase();
  if (AIRPORT_COORDINATES[clean]) {
    return AIRPORT_COORDINATES[clean];
  }

  const cleanLower = query.trim().toLowerCase();
  for (const item of Object.values(AIRPORT_COORDINATES)) {
    if (
      item.code.toLowerCase() === cleanLower ||
      item.city.toLowerCase() === cleanLower ||
      item.city.toLowerCase().includes(cleanLower) ||
      item.name.toLowerCase().includes(cleanLower)
    ) {
      return item;
    }
  }

  return {
    code: clean.substring(0, 3) || 'DEL',
    name: `${query} Airport`,
    city: query,
    country: 'India',
    lat: 28.5562,
    lng: 77.1000,
  };
}

/**
 * Calculates Great-Circle Distance (Haversine formula in km)
 */
export function calculateDistanceKm(originQuery: string, destQuery: string): number {
  const origin = resolveAirport(originQuery);
  const dest = resolveAirport(destQuery);

  if (!origin || !dest) return 1000;
  if (origin.code === dest.code) return 350;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((dest.lng - origin.lng) * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (dest.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(250, Math.round(R * c));
}

/**
 * Stable 32-bit string hashing for deterministic price generation
 */
function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface PricingOptions {
  origin: string; // airport code or city name
  destination: string; // airport code or city name
  cabinClass?: string; // 'economy' | 'business' | 'first'
  stops?: number;
  airlineCode?: string;
  departureTime?: string;
  availableSeatsCount?: number;
  flightId?: string;
}

/**
 * Computes a realistic, stable flight fare in INR
 */
export function calculateFlightPrice(options: PricingOptions): number {
  const {
    origin,
    destination,
    cabinClass = 'economy',
    stops = 0,
    airlineCode = 'AI',
    departureTime = '10:00 AM',
    availableSeatsCount = 12,
    flightId = '',
  } = options;

  const originGeo = resolveAirport(origin);
  const destGeo = resolveAirport(destination);
  const isDomestic = originGeo.country.toLowerCase() === 'india' && destGeo.country.toLowerCase() === 'india';
  const distanceKm = calculateDistanceKm(origin, destination);

  let baseFare = 0;

  if (isDomestic) {
    if (distanceKm < 700) {
      // Very Short Domestic: ₹2,500 – ₹6,000 (e.g., Bhopal → Delhi 586 km, Mumbai → Goa 425 km)
      baseFare = 2500 + distanceKm * 2.2;
    } else if (distanceKm < 1400) {
      // Medium Domestic: ₹3,500 – ₹9,000 (e.g., Delhi → Mumbai 1,137 km, Mumbai → Bengaluru 834 km)
      baseFare = 3200 + 700 * 2.1 + (distanceKm - 700) * 2.4;
    } else {
      // Long Domestic: ₹5,000 – ₹14,000 (e.g., Delhi → Bengaluru 1,740 km, Delhi → Chennai 1,759 km)
      baseFare = 4800 + 1400 * 1.9 + (distanceKm - 1400) * 2.5;
    }
  } else {
    // International
    if (distanceKm < 3500) {
      // Short International (e.g., Dubai 2,183 km, Doha, Bangkok): ₹15,000 – ₹35,000
      baseFare = 13000 + distanceKm * 3.8;
    } else if (distanceKm < 5000) {
      // Medium International (e.g., Singapore 3,921 km, Kuala Lumpur): ₹18,000 – ₹40,000
      baseFare = 15000 + distanceKm * 3.4;
    } else if (distanceKm < 8000) {
      // Long-haul International (e.g., London 6,731 km, Paris, JFK → LHR 5,540 km): ₹45,000 – ₹90,000+
      baseFare = 24000 + distanceKm * 5.2;
    } else {
      // Ultra Long-haul International (e.g., New York 11,755 km, Sydney 10,159 km, Toronto, Tokyo): ₹60,000 – ₹1,25,000+
      baseFare = 30000 + distanceKm * 5.0;
    }
  }

  // 1. Destination Market Multiplier
  const premiumGlobalHubs = ['LHR', 'JFK', 'SFO', 'CDG', 'YYZ', 'HND'];
  const regionalTransitHubs = ['DXB', 'SIN', 'DOH', 'BKK', 'KUL'];
  const majorDomesticHubs = ['DEL', 'BOM', 'BLR'];

  let destFactor = 1.0;
  if (premiumGlobalHubs.includes(destGeo.code)) {
    destFactor = 1.12;
  } else if (regionalTransitHubs.includes(destGeo.code)) {
    destFactor = 1.05;
  } else if (isDomestic && majorDomesticHubs.includes(destGeo.code)) {
    destFactor = 1.03;
  }

  // 2. Stops Factor (Direct flights have a modest premium, connecting flights get discount)
  const stopsFactor = stops === 0 ? 1.06 : 0.93;

  // 3. Airline Positioning Multiplier
  const cleanAirlineCode = (airlineCode || 'AI').trim().toUpperCase();
  const airlineFactors: Record<string, number> = {
    AV: 1.10, // Aviato Supreme (Luxury flag)
    EK: 1.08, // Emirates Executive
    BA: 1.06, // British Airways
    SQ: 1.07, // Singapore Airlines
    UK: 1.04, // Vistara Royal
    AE: 1.03, // Apex Elite
    AI: 0.98, // Air India
    OA: 0.97, // Oceanic
    '6E': 0.90, // IndiGo (Low cost carrier)
  };
  const airlineFactor = airlineFactors[cleanAirlineCode] || 1.0;

  // 4. Availability / Demand Surge Factor
  let demandFactor = 1.0;
  if (availableSeatsCount <= 4) {
    demandFactor = 1.10;
  } else if (availableSeatsCount <= 10) {
    demandFactor = 1.05;
  } else if (availableSeatsCount <= 18) {
    demandFactor = 1.02;
  }

  // 5. Deterministic Price Variation (Variance range: -5% to +7%)
  const seedString = flightId || `${cleanAirlineCode}-${originGeo.code}-${destGeo.code}-${departureTime}`;
  const hash = deterministicHash(seedString);
  const variance = -0.05 + (hash % 120) / 1000;

  // 6. Cabin Class Multiplier
  let classMultiplier = 1.0;
  const normalizedClass = (cabinClass || '').toLowerCase();
  if (normalizedClass === 'business') {
    classMultiplier = 2.2;
  } else if (normalizedClass === 'first') {
    classMultiplier = 3.2;
  }

  let calculatedPrice =
    baseFare *
    destFactor *
    stopsFactor *
    airlineFactor *
    demandFactor *
    (1 + variance) *
    classMultiplier;

  // Extreme Value Protection & Natural Fare Rounding
  let finalPrice = calculatedPrice;

  if (isDomestic) {
    // Domestic economy bounds: ₹2,499 – ₹24,999
    finalPrice = Math.round(finalPrice / 50) * 50 - 1; // e.g., ₹5,649, ₹4,899
    if (finalPrice < 2499) {
      finalPrice = 2499;
    } else if (finalPrice > 24999 * classMultiplier) {
      finalPrice = Math.round(24999 * classMultiplier);
    }
  } else {
    // International bounds
    finalPrice = Math.round(finalPrice / 100) * 100; // e.g., ₹23,500, ₹72,600
    const minBound = distanceKm < 5000 ? 14900 : 42000;
    const maxBound = (distanceKm < 5000 ? 48000 : 165000) * classMultiplier;

    if (finalPrice < minBound) {
      finalPrice = minBound;
    } else if (finalPrice > maxBound) {
      finalPrice = Math.round(maxBound);
    }
  }

  return Math.round(finalPrice);
}

export default calculateFlightPrice;
