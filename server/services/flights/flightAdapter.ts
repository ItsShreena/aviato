import { AirportRecord, FlightRecord, FALLBACK_AIRPORTS } from '../../fallbackStore';
import { getFullCabinSeats } from '../../utils/seats';
import { calculateFlightPrice } from '../../utils/pricing';
import { NormalizedFlightOffer } from './types';

/**
 * Generic external flight payload representation
 * Compatible with modern flight aggregator APIs (e.g., Amadeus, Duffel, Skyscanner, AviationStack)
 */
export interface RawExternalFlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime e.g. "2026-06-25T06:00:00"
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime e.g. "2026-06-25T08:15:00"
  };
  carrierCode: string;
  airlineName?: string;
  flightNumber: string;
  aircraft?: {
    code?: string;
    name?: string;
  };
  duration?: string;
  stops?: number;
}

export interface RawExternalFlightOffer {
  id: string;
  price: {
    total: number | string;
    currency: string;
  };
  segments: RawExternalFlightSegment[];
  cabinClass?: string;
  sourceProvider?: string;
  validatingCarrier?: string;
}

/**
 * Resolves an IATA airport code against AVIATO's internal airport registry
 */
export function resolveAirport(iataCode: string): AirportRecord {
  const normalized = (iataCode || '').toUpperCase().trim();
  const matched = FALLBACK_AIRPORTS.find(a => a.code.toUpperCase() === normalized);
  if (matched) {
    return matched;
  }
  return {
    id: `ap-${normalized.toLowerCase()}`,
    code: normalized,
    name: `${normalized} International Airport`,
    city: normalized,
    country: 'International',
  };
}

/**
 * Formats an ISO datetime string into AVIATO's standard 12-hour display format: e.g. "06:00 AM"
 */
export function formatFlightTime(isoString: string): string {
  if (!isoString) return '10:00 AM';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      // If already "HH:MM AM/PM"
      if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(isoString.trim())) {
        return isoString.trim().toUpperCase();
      }
      return '10:00 AM';
    }
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '10:00 AM';
  }
}

/**
 * Extracts standard YYYY-MM-DD date string from ISO datetime
 */
export function extractFlightDate(isoString: string): string {
  if (!isoString) return '2026-06-25';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '2026-06-25';
    return d.toISOString().split('T')[0];
  } catch {
    return '2026-06-25';
  }
}

/**
 * Calculates human-readable duration from two ISO datetime strings (e.g. "2h 15m")
 */
export function calculateFlightDuration(departureIso: string, arrivalIso: string): string {
  try {
    const dep = new Date(departureIso).getTime();
    const arr = new Date(arrivalIso).getTime();
    if (!isNaN(dep) && !isNaN(arr) && arr > dep) {
      const diffMinutes = Math.round((arr - dep) / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
  } catch {
    // Fall back to default
  }
  return '2h 15m';
}

export function parseIsoDuration(durationStr?: string): string {
  if (!durationStr) return '2h 15m';
  if (/^\d+h\s*\d+m$/i.test(durationStr.trim())) {
    return durationStr.trim();
  }
  // Match ISO 8601 duration e.g. PT2H15M, PT1H, PT45M
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (match) {
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return durationStr;
}

const BASE_EXCHANGE_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 86.5,
  EUR: 92.5,
  GBP: 110.0,
  AED: 23.5,
  SGD: 64.5,
};

export function convertToINR(amount: number, currency: string = 'INR'): { inrPrice: number; originalPrice: number; originalCurrency: string } {
  const normCurr = (currency || 'INR').toUpperCase().trim();
  const rate = BASE_EXCHANGE_RATES_TO_INR[normCurr] || 86.5; // fallback USD rate if unknown currency

  let inrPrice: number;
  if (normCurr === 'INR') {
    // If the provider returned a price in USD scale (< 1500 for a commercial airline flight)
    if (amount > 0 && amount < 1500) {
      inrPrice = Math.round(amount * 86.5);
    } else {
      inrPrice = Math.round(amount);
    }
  } else {
    inrPrice = Math.round(amount * rate);
  }

  // Ensure minimum realistic price floor for commercial aviation
  if (inrPrice < 3000) {
    inrPrice = Math.max(inrPrice * 2, 3499);
  }

  return {
    inrPrice,
    originalPrice: amount,
    originalCurrency: normCurr,
  };
}

/**
 * Normalizes an external raw flight offer into AVIATO's internal FlightRecord.
 * This adapter ensures the rest of AVIATO (backend & frontend) receives
 * an authoritative FlightRecord with full backward compatibility.
 */
export function normalizeExternalFlight(raw: RawExternalFlightOffer): NormalizedFlightOffer {
  const firstSegment = raw.segments[0] || {
    departure: { iataCode: 'DEL', at: new Date().toISOString() },
    arrival: { iataCode: 'BOM', at: new Date(Date.now() + 2 * 3600 * 1000).toISOString() },
    carrierCode: 'AV',
    flightNumber: '101',
  };

  const lastSegment = raw.segments[raw.segments.length - 1] || firstSegment;
  const depAirport = resolveAirport(firstSegment.departure.iataCode);
  const arrAirport = resolveAirport(lastSegment.arrival.iataCode);

  const stops = Math.max(0, raw.segments.length - 1);
  const rawTotal = typeof raw.price.total === 'number'
    ? raw.price.total
    : parseFloat(String(raw.price.total)) || 5400;

  const { inrPrice, originalPrice, originalCurrency } = convertToINR(rawTotal, raw.price.currency);

  const depTime = formatFlightTime(firstSegment.departure.at);
  const arrTime = formatFlightTime(lastSegment.arrival.at);
  const flightDate = extractFlightDate(firstSegment.departure.at);
  const duration = parseIsoDuration(firstSegment.duration) || calculateFlightDuration(firstSegment.departure.at, lastSegment.arrival.at);

  const carrier = firstSegment.carrierCode || raw.validatingCarrier || 'AV';
  const flightNumber = firstSegment.flightNumber.includes('-')
    ? firstSegment.flightNumber
    : `${carrier}-${firstSegment.flightNumber}`;

  // Deterministic safe internal ID
  const internalId = raw.id.startsWith('ext-')
    ? raw.id
    : `ext-${carrier.toLowerCase()}-${flightNumber.replace(/\s+/g, '')}-${Date.now().toString(36)}`;

  return {
    id: internalId,
    flightNo: flightNumber,
    airline: firstSegment.airlineName || `Airline (${carrier})`,
    airlineCode: carrier,
    departureCity: depAirport.city,
    arrivalCity: arrAirport.city,
    departureAirport: depAirport,
    arrivalAirport: arrAirport,
    departureTime: depTime,
    arrivalTime: arrTime,
    date: flightDate,
    duration,
    stops,
    price: inrPrice,
    cabinClass: raw.cabinClass || 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: {
      name: firstSegment.aircraft?.name || 'Airbus A350-900',
      model: firstSegment.aircraft?.code || 'A350',
      status: 'ACTIVE',
    },
    providerSource: raw.sourceProvider || 'external-flight-api',
    providerOfferId: raw.id,
    originalPrice,
    originalCurrency,
    expiresAt: Date.now() + 30 * 60 * 1000, // Offer lifetime: 30 minutes
    rawProviderPayload: raw,
  };
}

/**
 * Normalizes an Amadeus Flight Offers Search v2 response object into AVIATO's NormalizedFlightOffer
 */
export function normalizeAmadeusFlightOffer(
  offer: any,
  carrierDictionary: Record<string, string> = {},
  aircraftDictionary: Record<string, string> = {}
): NormalizedFlightOffer {
  const itinerary = offer.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || firstSegment;

  const carrierCode = firstSegment.carrierCode || offer.validatingAirlineCodes?.[0] || 'AI';
  const airlineName = carrierDictionary[carrierCode] || `Airline (${carrierCode})`;

  const depAirport = resolveAirport(firstSegment.departure?.iataCode || 'DEL');
  const arrAirport = resolveAirport(lastSegment.arrival?.iataCode || 'BOM');

  const depTime = formatFlightTime(firstSegment.departure?.at);
  const arrTime = formatFlightTime(lastSegment.arrival?.at);
  const flightDate = extractFlightDate(firstSegment.departure?.at);
  const duration = parseIsoDuration(itinerary?.duration) || calculateFlightDuration(firstSegment.departure?.at, lastSegment.arrival?.at);

  const rawTotal = parseFloat(offer.price?.total) || 5400;
  const currency = offer.price?.currency || 'INR';
  const { inrPrice, originalPrice, originalCurrency } = convertToINR(rawTotal, currency);

  const flightNumber = `${carrierCode}-${firstSegment.number || '101'}`;
  const aircraftCode = firstSegment.aircraft?.code || '359';
  const aircraftName = aircraftDictionary[aircraftCode] || `Boeing / Airbus (${aircraftCode})`;

  const internalId = `ext-amadeus-${carrierCode.toLowerCase()}-${firstSegment.number || '101'}-${offer.id}`;

  return {
    id: internalId,
    flightNo: flightNumber,
    airline: airlineName,
    airlineCode: carrierCode,
    departureCity: depAirport.city,
    arrivalCity: arrAirport.city,
    departureAirport: depAirport,
    arrivalAirport: arrAirport,
    departureTime: depTime,
    arrivalTime: arrTime,
    date: flightDate,
    duration,
    stops: Math.max(0, segments.length - 1),
    price: inrPrice,
    cabinClass: 'First',
    availableSeats: getFullCabinSeats().join(','),
    aircraft: {
      name: aircraftName,
      model: aircraftCode,
      status: 'ACTIVE',
    },
    providerSource: 'amadeus-flight-api',
    providerOfferId: String(offer.id),
    originalPrice,
    originalCurrency,
    expiresAt: Date.now() + 30 * 60 * 1000,
    rawProviderPayload: offer,
  };
}

/**
 * Normalizes a flight offer from the LetsFG Flight API into AVIATO's NormalizedFlightOffer
 */
export function normalizeLetsFGFlightOffer(
  rawOffer: any,
  queryOrigin?: string,
  queryDestination?: string,
  queryDate?: string,
  queryCabin?: string,
  searchId?: string
): NormalizedFlightOffer {
  // 1. Resolve Segments or Direct Legs
  const segments: any[] = Array.isArray(rawOffer.segments) && rawOffer.segments.length > 0
    ? rawOffer.segments
    : Array.isArray(rawOffer.outbound?.segments) && rawOffer.outbound.segments.length > 0
    ? rawOffer.outbound.segments
    : Array.isArray(rawOffer.legs) && rawOffer.legs.length > 0
    ? rawOffer.legs
    : Array.isArray(rawOffer.slices) && rawOffer.slices.length > 0
    ? rawOffer.slices
    : [];

  const firstSegment = segments[0] || {};
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : firstSegment;

  // 2. Resolve Airports & IATA
  const rawDepCode = firstSegment.departure?.iataCode ||
    firstSegment.departure?.airport ||
    firstSegment.origin ||
    firstSegment.origin_city ||
    rawOffer.departure_airport ||
    rawOffer.origin ||
    rawOffer.departure_id ||
    queryOrigin ||
    'DEL';

  const rawArrCode = lastSegment.arrival?.iataCode ||
    lastSegment.arrival?.airport ||
    lastSegment.destination ||
    lastSegment.destination_city ||
    rawOffer.arrival_airport ||
    rawOffer.destination ||
    rawOffer.arrival_id ||
    queryDestination ||
    'BOM';

  const depAirport = resolveAirport(String(rawDepCode));
  const arrAirport = resolveAirport(String(rawArrCode));

  // 3. Airline & Flight Number
  const carrierCode = (
    firstSegment.airline ||
    rawOffer.owner_airline ||
    (Array.isArray(rawOffer.airlines) ? rawOffer.airlines[0] : null) ||
    rawOffer.airline_code ||
    rawOffer.carrier_code ||
    rawOffer.carrier ||
    firstSegment.carrierCode ||
    firstSegment.carrier ||
    (typeof rawOffer.flight_number === 'string' ? rawOffer.flight_number.split(/[- ]/)[0] : '') ||
    'AI'
  ).toString().toUpperCase().trim();

  const knownAirlines: Record<string, string> = {
    AI: 'Air India',
    '6E': 'IndiGo',
    UK: 'Vistara',
    BA: 'British Airways',
    EK: 'Emirates',
    AA: 'American Airlines',
    UA: 'United Airlines',
    DL: 'Delta Air Lines',
    LH: 'Lufthansa',
    SQ: 'Singapore Airlines',
    QR: 'Qatar Airways',
    AF: 'Air France',
    KL: 'KLM',
    QF: 'Qantas',
    EY: 'Etihad Airways',
    SG: 'SpiceJet',
    G8: 'Go First',
    QP: 'Akasa Air',
    G4: 'Allegiant Air',
    F9: 'Frontier Airlines',
    VY: 'Vueling',
    B6: 'JetBlue Airways',
    NK: 'Spirit Airlines',
    WN: 'Southwest Airlines',
    D8: 'Norwegian Air',
    FR: 'Ryanair',
    W6: 'Wizz Air',
    U2: 'easyJet',
    AZ: 'ITA Airways',
    IB: 'Iberia',
  };

  const airlineName = firstSegment.airline_name ||
    rawOffer.airline_name ||
    rawOffer.airline ||
    rawOffer.carrier_name ||
    firstSegment.airlineName ||
    knownAirlines[carrierCode] ||
    `Airline (${carrierCode})`;

  let rawFlightNum = firstSegment.flight_no ||
    rawOffer.flight_no ||
    rawOffer.flight_number ||
    rawOffer.number ||
    firstSegment.flightNumber ||
    firstSegment.number ||
    '805';

  let flightNo = String(rawFlightNum).trim();
  if (flightNo.includes('-')) {
    // Already formatted e.g. "AI-805"
  } else if (carrierCode && flightNo.toUpperCase().startsWith(carrierCode.toUpperCase())) {
    const numPart = flightNo.slice(carrierCode.length);
    flightNo = `${carrierCode}-${numPart}`;
  } else if (/^[A-Z]{2,3}\d+$/i.test(flightNo)) {
    const match = flightNo.match(/^([A-Z]{2,3})(\d+)$/i);
    if (match) {
      flightNo = `${match[1].toUpperCase()}-${match[2]}`;
    }
  } else {
    flightNo = `${carrierCode}-${flightNo}`;
  }

  // 4. Departure & Arrival Times (Guard against String.prototype.at)
  const rawDepTime = (typeof firstSegment.departure === 'string' ? firstSegment.departure : firstSegment.departure?.at) ||
    firstSegment.departure_time ||
    rawOffer.departure_time ||
    rawOffer.departureTime;
  const rawArrTime = (typeof lastSegment.arrival === 'string' ? lastSegment.arrival : lastSegment.arrival?.at) ||
    lastSegment.arrival_time ||
    rawOffer.arrival_time ||
    rawOffer.arrivalTime;

  const depTime = formatFlightTime(rawDepTime);
  const arrTime = formatFlightTime(rawArrTime);

  // 5. Date & Duration
  const flightDate = extractFlightDate(rawDepTime || rawOffer.date || rawOffer.outbound_date || queryDate);

  let duration = '';
  if (typeof rawOffer.outbound?.total_duration_seconds === 'number' && rawOffer.outbound.total_duration_seconds > 0) {
    const sec = rawOffer.outbound.total_duration_seconds;
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    duration = `${hours}h ${mins.toString().padStart(2, '0')}m`;
  } else if (typeof firstSegment.duration_seconds === 'number' && firstSegment.duration_seconds > 0) {
    const sec = firstSegment.duration_seconds;
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    duration = `${hours}h ${mins.toString().padStart(2, '0')}m`;
  } else {
    duration = parseIsoDuration(rawOffer.duration || firstSegment.duration) ||
      calculateFlightDuration(rawDepTime, rawArrTime);
  }

  const stops = typeof rawOffer.outbound?.stopovers === 'number'
    ? rawOffer.outbound.stopovers
    : typeof rawOffer.stops === 'number'
    ? rawOffer.stops
    : Math.max(0, segments.length - 1);

  // 6. Price Extraction & Realistic Fallback
  let rawTotal: number | null = null;
  let currency = 'INR';

  if (typeof rawOffer.price === 'number') {
    rawTotal = rawOffer.price;
  } else if (rawOffer.price && typeof rawOffer.price === 'object') {
    rawTotal = parseFloat(rawOffer.price.total || rawOffer.price.amount || rawOffer.price.value) || null;
    currency = rawOffer.price.currency || currency;
  } else if (rawOffer.fare) {
    rawTotal = parseFloat(typeof rawOffer.fare === 'object' ? (rawOffer.fare.total || rawOffer.fare.amount) : rawOffer.fare) || null;
    currency = (typeof rawOffer.fare === 'object' ? rawOffer.fare.currency : null) || currency;
  } else if (rawOffer.total_price) {
    rawTotal = parseFloat(rawOffer.total_price) || null;
  }

  if (rawOffer.currency) {
    currency = rawOffer.currency;
  }

  let inrPrice: number;
  let originalPrice = rawTotal || 0;
  let originalCurrency = currency;

  if (rawTotal && rawTotal > 0 && !isNaN(rawTotal)) {
    // Perform standard currency conversion to INR
    const converted = convertToINR(rawTotal, currency);
    inrPrice = converted.inrPrice;
    originalPrice = converted.originalPrice;
    originalCurrency = converted.originalCurrency;
  } else {
    // Preserve realistic pricing logic for destinations where provider does not return a usable live fare
    inrPrice = calculateFlightPrice({
      origin: depAirport.code,
      destination: arrAirport.code,
      departureTime: depTime,
      stops,
      airlineCode: carrierCode,
      cabinClass: queryCabin || rawOffer.cabin_class || 'Economy',
    });
    originalPrice = inrPrice;
    originalCurrency = 'INR';
  }

  // 7. Cabin Class
  const cabinClass = rawOffer.cabin_class ||
    rawOffer.travel_class ||
    rawOffer.cabin ||
    queryCabin ||
    'Economy';

  // 8. Aircraft model
  const rawAircraft = firstSegment.aircraft || rawOffer.aircraft?.name || rawOffer.aircraft || firstSegment.aircraft?.code || 'Airbus A350-900';
  const aircraftModel = String(rawAircraft);
  const aircraftName = aircraftModel.includes(' ') ? aircraftModel : `Boeing / Airbus (${aircraftModel})`;

  // 9. Identifier - Use real provider offer ID directly without generating fake IDs
  const providerOfferId = rawOffer.id || rawOffer.offer_id || rawOffer.flight_id;
  const actualOfferId = providerOfferId
    ? String(providerOfferId)
    : `letsfg-${carrierCode.toLowerCase()}-${flightNo.replace(/\s+/g, '')}`;

  const isSandbox = rawOffer.source === 'sandbox' || rawOffer.source_tier === 'sandbox';

  return {
    id: actualOfferId,
    flightNo,
    airline: airlineName,
    airlineCode: carrierCode,
    departureCity: depAirport.city,
    arrivalCity: arrAirport.city,
    departureAirport: depAirport,
    arrivalAirport: arrAirport,
    departureTime: depTime,
    arrivalTime: arrTime,
    date: flightDate,
    duration,
    stops,
    price: inrPrice,
    cabinClass: cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1),
    availableSeats: getFullCabinSeats().join(','),
    aircraft: {
      name: aircraftName,
      model: aircraftModel,
      status: 'ACTIVE',
    },
    providerSource: isSandbox ? 'letsfg_sandbox' : 'letsfg',
    providerOfferId: actualOfferId,
    offerId: actualOfferId,
    searchId: searchId || rawOffer.search_id || rawOffer.searchId || undefined,
    originalPrice,
    originalCurrency,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 min lifetime
    rawProviderPayload: rawOffer,
  };
}
