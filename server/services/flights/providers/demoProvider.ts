import { IFlightProvider, FlightSearchCriteria } from '../types';
import { FlightRecord, fallbackFlightsMap, FALLBACK_FLIGHTS, getOrCreateFallbackFlightsForRoute } from '../../../fallbackStore';
import { prisma, isDatabaseAvailable } from '../../../db';

export class DemoFlightProvider implements IFlightProvider {
  public readonly name = 'demo';

  public async searchFlights(criteria: FlightSearchCriteria): Promise<FlightRecord[]> {
    const { fromCity, toCity, date, cabinClass } = criteria;
    const dbOnline = await isDatabaseAvailable();

    if (!dbOnline) {
      let flights: FlightRecord[] = Array.from(fallbackFlightsMap.values());
      if (fromCity) {
        flights = flights.filter(f =>
          f.departureCity.toLowerCase().includes(fromCity.toLowerCase()) ||
          (f.departureAirport && f.departureAirport.code.toLowerCase() === fromCity.toLowerCase())
        );
      }
      if (toCity) {
        flights = flights.filter(f =>
          f.arrivalCity.toLowerCase().includes(toCity.toLowerCase()) ||
          (f.arrivalAirport && f.arrivalAirport.code.toLowerCase() === toCity.toLowerCase())
        );
      }
      if (cabinClass) {
        flights = flights.filter(f => f.cabinClass.toLowerCase() === cabinClass.toLowerCase());
      }
      if (flights.length === 0 && fromCity && toCity) {
        flights = getOrCreateFallbackFlightsForRoute(fromCity, toCity, date || '2026-06-25');
      }
      return (flights.length > 0 ? flights : FALLBACK_FLIGHTS).map(f => ({ ...f, providerSource: 'demo' })) as unknown as FlightRecord[];
    }

    try {
      const filter: any = {};
      if (fromCity) {
        filter.departureCity = { contains: fromCity, mode: 'insensitive' };
      }
      if (toCity) {
        filter.arrivalCity = { contains: toCity, mode: 'insensitive' };
      }
      if (date) {
        filter.date = date;
      }
      if (cabinClass) {
        filter.cabinClass = cabinClass;
      }

      let flights = await prisma.flight.findMany({
        where: filter,
        include: {
          aircraft: true,
          departureAirport: true,
          arrivalAirport: true,
        },
        orderBy: { price: 'asc' },
      });

      if (flights.length === 0 && fromCity && toCity) {
        flights = getOrCreateFallbackFlightsForRoute(fromCity, toCity, date || '2026-06-25') as any;
      }

      return (flights.length > 0 ? flights : FALLBACK_FLIGHTS).map(f => ({ ...f, providerSource: 'demo' })) as unknown as FlightRecord[];
    } catch (err) {
      console.warn('⚠️ [DemoFlightProvider] DB search error, using fallback flights:', err);
      if (fromCity && toCity) {
        return getOrCreateFallbackFlightsForRoute(fromCity, toCity, date || '2026-06-25').map(f => ({ ...f, providerSource: 'demo' })) as unknown as FlightRecord[];
      }
      return FALLBACK_FLIGHTS.map(f => ({ ...f, providerSource: 'demo' })) as unknown as FlightRecord[];
    }
  }

  public async getFlightById(id: string): Promise<FlightRecord | null> {
    const dbOnline = await isDatabaseAvailable();
    if (dbOnline) {
      try {
        const flight = await prisma.flight.findUnique({
          where: { id },
          include: {
            aircraft: true,
            departureAirport: true,
            arrivalAirport: true,
          },
        });
        if (flight) {
          return flight as unknown as FlightRecord;
        }
      } catch (err) {
        console.warn('⚠️ [DemoFlightProvider] DB lookup error:', err);
      }
    }

    const fallbackFlight = fallbackFlightsMap.get(id) || FALLBACK_FLIGHTS.find(f => f.id === id);
    return fallbackFlight || null;
  }
}
