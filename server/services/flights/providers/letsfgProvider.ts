import { RealFlightProvider, CachedLetsFGOffer, letsFGOfferCache } from './realFlightProvider';

/**
 * LetsFGFlightProvider alias for RealFlightProvider.
 * Authenticates directly with LetsFG Flight API using LETSFG_API_KEY.
 */
export const LetsFGFlightProvider = RealFlightProvider;
export type LetsFGFlightProvider = RealFlightProvider;
export type { CachedLetsFGOffer };
export { letsFGOfferCache };
