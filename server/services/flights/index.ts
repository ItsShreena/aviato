import { IFlightProvider } from './types';
import { DemoFlightProvider } from './providers/demoProvider';
import { RealFlightProvider } from './providers/realFlightProvider';
import { LetsFGFlightProvider } from './providers/letsfgProvider';

export * from './types';
export * from './flightAdapter';
export * from './providers/demoProvider';
export * from './providers/realFlightProvider';
export * from './providers/letsfgProvider';

let activeProviderInstance: IFlightProvider | null = null;

/**
 * Returns the active flight provider instance.
 * AVIATO utilizes RealFlightProvider (LetsFG API) backed by DemoFlightProvider as fallback.
 * Authenticates using LETSFG_API_KEY.
 */
export function getFlightProvider(): IFlightProvider {
  if (!activeProviderInstance) {
    const mode = (process.env.FLIGHT_PROVIDER_MODE || process.env.LETSFG_MODE || 'letsfg_sandbox').toLowerCase().trim();
    if (mode === 'demo') {
      activeProviderInstance = new DemoFlightProvider();
      console.log('✈️ [Flight Provider] Initialized DemoFlightProvider (DEMO mode)');
    } else {
      activeProviderInstance = new RealFlightProvider();
      console.log(`✈️ [Flight Provider] Initialized RealFlightProvider (LetsFG API - ${mode})`);
    }
  }

  return activeProviderInstance;
}
