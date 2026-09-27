import { FlightRecord, AirportRecord } from '../../fallbackStore';

export interface FlightSearchCriteria {
  fromCity?: string;
  toCity?: string;
  date?: string;
  cabinClass?: string;
  travelers?: number;
  stops?: number;
  maxPrice?: number;
}

/**
 * Normalized flight offer produced by any external or internal flight provider.
 * Extends FlightRecord to guarantee 100% backward compatibility with AVIATO's
 * existing database models, booking engine, seat layout, and frontend UI.
 */
export interface NormalizedFlightOffer extends FlightRecord {
  /**
   * Optional provider metadata to trace source of flight offer (e.g. 'demo', 'amadeus', 'duffel')
   */
  providerSource?: string;
  /**
   * External provider's raw offer/order ID
   */
  providerOfferId?: string;
  /**
   * Provider specific offer ID
   */
  offerId?: string;
  /**
   * Provider specific search ID
   */
  searchId?: string;
  /**
   * Original fare in provider currency before any normalization
   */
  originalPrice?: number;
  /**
   * Provider's native currency code (e.g. "USD", "EUR", "INR")
   */
  originalCurrency?: string;
  /**
   * Epoch timestamp (ms) when this external offer expires
   */
  expiresAt?: number;
  /**
   * Optional raw provider payload preserved for ticketing or price-validation
   */
  rawProviderPayload?: unknown;
}

/**
 * Abstract interface for flight data providers.
 * Allows AVIATO to seamlessly switch between Demo (current mock/database)
 * and Real Flight APIs (Amadeus, Duffel, AviationStack, etc.) without
 * changing any frontend UI, booking logic, or seat selection code.
 */
export interface IFlightProvider {
  readonly name: string;
  searchFlights(criteria: FlightSearchCriteria): Promise<FlightRecord[]>;
  getFlightById(id: string): Promise<FlightRecord | null>;
}
