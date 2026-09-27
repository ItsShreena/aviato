import { IFlightProvider, FlightSearchCriteria, NormalizedFlightOffer } from '../types';
import { FlightRecord, fallbackFlightsMap, FALLBACK_AIRPORTS } from '../../../fallbackStore';
import { normalizeLetsFGFlightOffer } from '../flightAdapter';
import { DemoFlightProvider } from './demoProvider';

/**
 * City name to IATA code resolution map for major Indian and international hubs
 */
const CITY_TO_IATA_MAP: Record<string, string> = {
  DELHI: 'DEL',
  'NEW DELHI': 'DEL',
  MUMBAI: 'BOM',
  BOMBAY: 'BOM',
  BANGALORE: 'BLR',
  BENGALURU: 'BLR',
  GOA: 'GOI',
  VASCO: 'GOI',
  MOPA: 'GOX',
  HYDERABAD: 'HYD',
  CHENNAI: 'MAA',
  MADRAS: 'MAA',
  KOLKATA: 'CCU',
  CALCUTTA: 'CCU',
  DUBAI: 'DXB',
  LONDON: 'LHR',
  'NEW YORK': 'JFK',
  SINGAPORE: 'SIN',
  AHMEDABAD: 'AMD',
  PUNE: 'PNQ',
  JAIPUR: 'JAI',
  KOCHI: 'COK',
  COCHIN: 'COK',
};

export function resolveCityOrCodeToIATA(input?: string): string {
  if (!input) return 'DEL';
  const trimmed = input.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(trimmed)) {
    return trimmed;
  }
  if (CITY_TO_IATA_MAP[trimmed]) {
    return CITY_TO_IATA_MAP[trimmed];
  }
  const matched = FALLBACK_AIRPORTS.find(
    a => a.code.toUpperCase() === trimmed || a.city.toUpperCase() === trimmed || a.name.toUpperCase().includes(trimmed)
  );
  if (matched) {
    return matched.code.toUpperCase();
  }
  return trimmed.substring(0, 3);
}

/**
 * Server-side persistent cache for LetsFG flight offers and search sessions.
 * Preserves the provider-specific search_id and offer ID so that
 * Search -> Flight details -> Seat/review -> Revalidation -> Booking
 * continue using the exact LetsFG offer without generating fake IDs.
 */
export interface CachedLetsFGOffer {
  searchId?: string;
  offerId: string;
  flight: NormalizedFlightOffer;
  rawPayload: any;
  cachedAt: number;
  expiresAt: number;
}

export const letsFGOfferCache = new Map<string, CachedLetsFGOffer>();

/**
 * RealFlightProvider for AVIATO
 * 
 * Direct server-side integration with the official LetsFG Flight API.
 * - Authenticates using LETSFG_API_KEY via 'X-API-Key' request header.
 * - Base endpoint: https://letsfg.co/developers/api/v1 (or optional LETSFG_BASE_URL).
 * - Implements resilient error handling with DemoFlightProvider fallback:
 *     DemoFlightProvider (fallback)
 *             ↑
 *     RealFlightProvider
 *             ↓
 *         LetsFG API
 */
export class RealFlightProvider implements IFlightProvider {
  public readonly name = 'letsfg';
  private demoProvider = new DemoFlightProvider();

  /**
   * Secure server-side accessor for LETSFG_API_KEY.
   * Never exposed to client-side code, logs, or UI.
   */
  private get apiKey(): string | undefined {
    return process.env.LETSFG_API_KEY?.trim();
  }

  /**
   * Provider mode: 'demo' | 'letsfg_sandbox' | 'letsfg_production'.
   * Configurable via FLIGHT_PROVIDER_MODE or LETSFG_MODE.
   * Defaults to 'letsfg_sandbox' during this testing phase.
   */
  public get mode(): 'demo' | 'letsfg_sandbox' | 'letsfg_production' {
    const raw = (process.env.FLIGHT_PROVIDER_MODE || process.env.LETSFG_MODE || 'letsfg_sandbox').toLowerCase().trim();
    if (raw === 'demo') return 'demo';
    if (raw === 'letsfg_production' || raw === 'production' || raw === 'prod') return 'letsfg_production';
    return 'letsfg_sandbox';
  }

  /**
   * Official LetsFG API base URL.
   * Sandbox endpoint: https://letsfg.co/developers/api/v1/sandbox
   * Production endpoint: https://letsfg.co/developers/api/v1
   */
  private get baseUrl(): string {
    const custom = process.env.LETSFG_BASE_URL?.trim();
    if (custom) return custom.replace(/\/+$/, '');
    if (this.mode === 'letsfg_production') {
      return 'https://letsfg.co/developers/api/v1';
    }
    return 'https://letsfg.co/developers/api/v1/sandbox';
  }

  /**
   * Returns true if LETSFG_API_KEY is securely configured in server environment.
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Executes a flight search against the LetsFG Flight API (Sandbox or Production).
   * If the provider is unconfigured, times out, or encounters errors,
   * it falls back gracefully to the DemoFlightProvider.
   */
  public async searchFlights(criteria: FlightSearchCriteria): Promise<FlightRecord[]> {
    const originCode = resolveCityOrCodeToIATA(criteria.fromCity || 'DEL');
    const destinationCode = resolveCityOrCodeToIATA(criteria.toCity || 'BOM');
    const flightDate = criteria.date && /^\d{4}-\d{2}-\d{2}$/.test(criteria.date)
      ? criteria.date
      : '2026-06-25';
    const travelers = Math.max(1, criteria.travelers || 1);
    const cabinClass = (criteria.cabinClass || 'Economy').toLowerCase();

    // Explicit DEMO mode
    if (this.mode === 'demo') {
      console.log('✈️ [RealFlightProvider] Configured in DEMO mode. Serving route via demo provider.');
      return this.demoProvider.searchFlights(criteria);
    }

    // 1. Missing LETSFG_API_KEY -> Graceful fallback to demo provider
    if (!this.isConfigured()) {
      console.warn('⚠️ [RealFlightProvider] Config check failed: Provider: letsfg | Endpoint Category: sandbox_search | Error Category: MISSING_CONFIG. Serving route via Demo Fallback.');
      const fallbackResults = await this.demoProvider.searchFlights(criteria);
      return fallbackResults.map(f => ({
        ...f,
        providerSource: 'demo',
        providerNotice: 'Flight provider is unconfigured. Displaying Demo Fallback flights.',
      })) as unknown as FlightRecord[];
    }

    console.log(
      `✈️ [RealFlightProvider] Initiating LetsFG (${this.mode}) search: ${originCode} ➔ ${destinationCode} on ${flightDate} (Travelers: ${travelers}, Cabin: ${cabinClass})`
    );

    const payload = {
      origin: originCode,
      destination: destinationCode,
      date_from: flightDate,
      date_to: flightDate,
      departure_id: originCode,
      arrival_id: destinationCode,
      date: flightDate,
      departure_date: flightDate,
      outbound_date: flightDate,
      adults: travelers,
      passengers: { adults: travelers },
      cabin_class: cabinClass,
      travel_class: cabinClass,
      currency: 'INR',
    };

    // The LetsFG API uses X-API-Key in the request header
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKey!,
      'User-Agent': 'AviatoFlightEngine/2.0',
    };

    // 12-second abort timeout protection
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 12000);

    try {
      const searchUrl = `${this.baseUrl}/flights/search`;

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      // 2. Authentication failure (HTTP 401 or 403)
      if (response.status === 401 || response.status === 403) {
        console.warn(`⚠️ [RealFlightProvider] Auth failure: Provider: letsfg | Endpoint Category: sandbox_search | HTTP Status: ${response.status} | Error Category: AUTH_CONFIG_FAILURE. Activating Demo Fallback.`);
        const fallbackResults = await this.demoProvider.searchFlights(criteria);
        return fallbackResults.map(f => ({
          ...f,
          providerSource: 'demo',
          providerNotice: `Flight provider authentication failed (HTTP ${response.status}). Displaying Demo Fallback flights.`,
        })) as unknown as FlightRecord[];
      }

      // 3. Payment-required / Account-gating response (HTTP 402)
      if (response.status === 402) {
        console.warn(`⚠️ [RealFlightProvider] Tier gating: Provider: letsfg | Endpoint Category: sandbox_search | HTTP Status: 402 | Error Category: ACCOUNT_TIER_GATING. Activating Demo Fallback.`);
        const fallbackResults = await this.demoProvider.searchFlights(criteria);
        return fallbackResults.map(f => ({
          ...f,
          providerSource: 'demo',
          providerNotice: 'Flight provider requires account tier upgrade. Displaying Demo Fallback flights.',
        })) as unknown as FlightRecord[];
      }

      // 4. Rate limiting (HTTP 429)
      if (response.status === 429) {
        console.warn(`⚠️ [RealFlightProvider] Rate limited: Provider: letsfg | Endpoint Category: sandbox_search | HTTP Status: 429 | Error Category: RATE_LIMIT_EXCEEDED. Activating Demo Fallback.`);
        const fallbackResults = await this.demoProvider.searchFlights(criteria);
        return fallbackResults.map(f => ({
          ...f,
          providerSource: 'demo',
          providerNotice: 'Flight provider rate limit reached. Displaying Demo Fallback flights.',
        })) as unknown as FlightRecord[];
      }

      // 5. Upstream 5xx or server error
      if (!response.ok) {
        console.warn(`⚠️ [RealFlightProvider] Upstream error: Provider: letsfg | Endpoint Category: sandbox_search | HTTP Status: ${response.status} | Error Category: UPSTREAM_SERVER_ERROR. Activating Demo Fallback.`);
        const fallbackResults = await this.demoProvider.searchFlights(criteria);
        return fallbackResults.map(f => ({
          ...f,
          providerSource: 'demo',
          providerNotice: `Flight provider temporarily unavailable (HTTP ${response.status}). Displaying Demo Fallback flights.`,
        })) as unknown as FlightRecord[];
      }

      // 6. Malformed provider response handling
      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.warn('⚠️ [RealFlightProvider] Malformed JSON: Provider: letsfg | Endpoint Category: sandbox_search | Error Category: MALFORMED_RESPONSE. Activating Demo Fallback.');
        const fallbackResults = await this.demoProvider.searchFlights(criteria);
        return fallbackResults.map(f => ({
          ...f,
          providerSource: 'demo',
          providerNotice: 'Malformed response received from provider. Displaying Demo Fallback flights.',
        })) as unknown as FlightRecord[];
      }

      // Extract search_id from LetsFG response
      const searchId = data?.search_id || data?.searchId || data?.id || undefined;

      // Extract flight offers
      let rawOffers: any[] = [];
      if (Array.isArray(data)) {
        rawOffers = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) rawOffers = data.data;
        else if (Array.isArray(data.offers)) rawOffers = data.offers;
        else if (Array.isArray(data.flights)) rawOffers = data.flights;
        else if (Array.isArray(data.results)) rawOffers = data.results;
        else if (Array.isArray(data.items)) rawOffers = data.items;
      }

      // 7. Empty results handling: When LetsFG genuinely returns 0 offers, DO NOT generate fake flights.
      if (rawOffers.length === 0) {
        console.log(`ℹ️ [RealFlightProvider] Provider: letsfg | Endpoint Category: sandbox_search | Result: 0 offers returned for ${originCode} ➔ ${destinationCode} on ${flightDate}. Category: ZERO_RESULTS.`);
        return [];
      }

      console.log(`✈️ [RealFlightProvider] Successfully received and normalizing ${rawOffers.length} real flight offers from LetsFG.`);

      // Normalize offers and persist provider-specific offer ID and search_id
      const normalizedFlights: NormalizedFlightOffer[] = rawOffers.map((rawOffer: any) => {
        const normalized = normalizeLetsFGFlightOffer(
          rawOffer,
          originCode,
          destinationCode,
          flightDate,
          criteria.cabinClass,
          searchId
        );

        const realOfferId = normalized.providerOfferId || normalized.id;

        // Persist to server cache
        const cacheEntry: CachedLetsFGOffer = {
          searchId,
          offerId: realOfferId,
          flight: normalized,
          rawPayload: rawOffer,
          cachedAt: Date.now(),
          expiresAt: normalized.expiresAt || (Date.now() + 30 * 60 * 1000),
        };

        letsFGOfferCache.set(normalized.id, cacheEntry);
        fallbackFlightsMap.set(normalized.id, normalized);

        if (realOfferId !== normalized.id) {
          letsFGOfferCache.set(realOfferId, cacheEntry);
          fallbackFlightsMap.set(realOfferId, normalized);
        }

        return normalized;
      });

      return normalizedFlights;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      const errorCat = isAbort ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR';
      console.warn(
        `⚠️ [RealFlightProvider] Network failure: Provider: letsfg | Endpoint Category: sandbox_search | Error Category: ${errorCat} | Reason: ${isAbort ? 'Timeout after 12s' : 'Connection failed'}. Activating Demo Fallback.`
      );
      const fallbackResults = await this.demoProvider.searchFlights(criteria);
      return fallbackResults.map(f => ({
        ...f,
        providerSource: 'demo',
        providerNotice: isAbort
          ? 'Flight provider request timed out. Displaying Demo Fallback flights.'
          : 'Flight provider is temporarily unreachable. Displaying Demo Fallback flights.',
      })) as unknown as FlightRecord[];
    }
  }

  /**
   * Retrieves a flight offer by ID from server cache, ensuring revalidation and expiration checks.
   */
  public async getFlightById(id: string): Promise<FlightRecord | null> {
    // 1. Check LetsFG cached offers
    const cachedEntry = letsFGOfferCache.get(id);
    if (cachedEntry) {
      if (cachedEntry.expiresAt && Date.now() > cachedEntry.expiresAt) {
        throw new Error('OFFER_EXPIRED: Flight offer has expired. Please run a fresh search.');
      }
      return cachedEntry.flight;
    }

    // 2. Check fallback flights map
    const flight = fallbackFlightsMap.get(id) as NormalizedFlightOffer | undefined;
    if (flight) {
      if (flight.expiresAt && Date.now() > flight.expiresAt) {
        throw new Error('OFFER_EXPIRED: Flight offer has expired. Please run a fresh search.');
      }
      return flight;
    }

    // 3. Fallback to demo provider
    return this.demoProvider.getFlightById(id);
  }
}
