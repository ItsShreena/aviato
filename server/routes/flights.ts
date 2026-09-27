import { Router } from 'express';
import { prisma, isDatabaseAvailable } from '../db';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { getFullCabinSeats } from '../utils/seats';
import { FALLBACK_FLIGHTS, fallbackFlightsMap, fallbackAircraftMap, getOrCreateFallbackFlightsForRoute } from '../fallbackStore';
import { getFlightProvider } from '../services/flights';

const router = Router();

export const FALLBACK_FEATURED_FLIGHTS = FALLBACK_FLIGHTS;

// Search and list flights via provider abstraction
router.get('/', async (req, res) => {
  try {
    const { departureCity, arrivalCity, date, cabinClass } = req.query;
    const provider = getFlightProvider();

    const flights = await provider.searchFlights({
      fromCity: departureCity ? String(departureCity) : undefined,
      toCity: arrivalCity ? String(arrivalCity) : undefined,
      date: date ? String(date) : undefined,
      cabinClass: cabinClass ? String(cabinClass) : undefined,
    });

    res.json(flights.length > 0 ? flights : FALLBACK_FLIGHTS);
  } catch (err: any) {
    if (err?.message && (err.message.includes('REAL_PROVIDER') || err.message.includes('OFFER_EXPIRED'))) {
      return res.status(err.message.includes('OFFER_EXPIRED') ? 410 : 503).json({
        error: err.message,
        providerError: true,
      });
    }
    if (req.query.departureCity && req.query.arrivalCity) {
      const fb = getOrCreateFallbackFlightsForRoute(String(req.query.departureCity), String(req.query.arrivalCity), String(req.query.date || '2026-06-25'));
      return res.json(fb);
    }
    res.json(FALLBACK_FLIGHTS);
  }
});

// Dedicated flight search endpoint (POST /api/flights/search)
router.post('/search', async (req, res) => {
  try {
    const fromCity = String(req.body.fromCity || req.body.origin || req.body.departureCity || '').trim();
    const toCity = String(req.body.toCity || req.body.destination || req.body.arrivalCity || '').trim();
    const date = String(req.body.date || req.body.departureDate || req.body.outboundDate || '').trim();
    const returnDate = req.body.returnDate || req.body.return_date;
    const cabinClass = req.body.cabinClass || req.body.travelClass || req.body.cabin;
    const travelers = req.body.travelers !== undefined ? req.body.travelers : (req.body.passengers !== undefined ? req.body.passengers : req.body.adults);

    // Validate inputs before invoking provider
    if (!fromCity || !toCity) {
      return res.status(400).json({ error: 'Please specify both an origin and a destination.' });
    }
    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      return res.status(400).json({ error: 'Origin and destination cannot be identical.' });
    }
    if (travelers !== undefined && (Number(travelers) < 1 || Number(travelers) > 9 || isNaN(Number(travelers)))) {
      return res.status(400).json({ error: 'Passenger count must be between 1 and 9.' });
    }
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid departure date format. Please use YYYY-MM-DD.' });
      }
      const todayStr = new Date().toISOString().split('T')[0];
      if (date < todayStr) {
        return res.status(400).json({ error: 'Departure date cannot be in the past.' });
      }
    }

    const provider = getFlightProvider();
    const flights = await provider.searchFlights({
      fromCity,
      toCity,
      date,
      cabinClass,
      travelers: travelers ? Number(travelers) : 1,
    });

    res.json(flights);
  } catch (err: any) {
    if (err?.message && (err.message.includes('REAL_PROVIDER') || err.message.includes('OFFER_EXPIRED'))) {
      return res.status(err.message.includes('OFFER_EXPIRED') ? 410 : 503).json({
        error: err.message,
        providerError: true,
      });
    }
    res.status(500).json({
      error: 'Flight search provider encountered an error: ' + (err?.message || 'Unknown error'),
      providerError: true,
    });
  }
});

// Backend health and configuration check endpoint (reports only provider and configured status)
router.get(['/config', '/health', '/provider-status'], (req, res) => {
  const mode = (process.env.FLIGHT_PROVIDER_MODE || process.env.LETSFG_MODE || 'letsfg_sandbox').toLowerCase().trim();
  res.json({
    provider: 'letsfg',
    mode,
    configured: Boolean(process.env.LETSFG_API_KEY && process.env.LETSFG_API_KEY.trim().length > 0),
    endpoint: mode === 'letsfg_production'
      ? 'https://letsfg.co/developers/api/v1/flights/search'
      : 'https://letsfg.co/developers/api/v1/sandbox/flights/search',
  });
});

// Get individual flight coordinates via provider abstraction
router.get('/:id', async (req, res) => {
  try {
    const provider = getFlightProvider();
    const flight = await provider.getFlightById(req.params.id);

    if (flight) {
      return res.json(flight);
    }

    return res.status(404).json({ error: 'Selected flight route could not be found' });
  } catch (err: any) {
    if (err?.message && err.message.includes('OFFER_EXPIRED')) {
      return res.status(410).json({
        error: err.message,
        expired: true,
      });
    }
    const fallbackFlight = fallbackFlightsMap.get(req.params.id) || FALLBACK_FLIGHTS.find(f => f.id === req.params.id);
    if (fallbackFlight) {
      return res.json(fallbackFlight);
    }
    res.status(500).json({ error: 'Failed to load route parameters' });
  }
});

// Admin ONLY: Schedule a new dynamic flight
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {
      flightNo,
      airline,
      airlineCode,
      departureCity,
      arrivalCity,
      departureAirportId,
      arrivalAirportId,
      departureTime,
      arrivalTime,
      price,
      date,
      duration,
      cabinClass,
      stops,
      aircraftId,
      availableSeats,
    } = req.body;

    if (!flightNo || !airline || !departureCity || !arrivalCity || !departureTime || !arrivalTime || !price || !date || !duration || !cabinClass) {
      return res.status(400).json({ error: 'All primary flight telemetry attributes are required' });
    }

    const seatsPattern = availableSeats || getFullCabinSeats().join(',');
    const dbOnline = await isDatabaseAvailable();
    let flight: any = null;

    if (dbOnline) {
      try {
        flight = await prisma.flight.create({
          data: {
            flightNo,
            airline,
            airlineCode: airlineCode || 'AV',
            departureCity,
            arrivalCity,
            departureAirportId,
            arrivalAirportId,
            departureTime,
            arrivalTime,
            price: Number(price),
            date,
            duration,
            cabinClass,
            stops: stops !== undefined ? Number(stops) : 0,
            aircraftId,
            availableSeats: Array.isArray(seatsPattern) ? seatsPattern.join(',') : seatsPattern,
          },
          include: {
            aircraft: true,
          },
        });
      } catch (dbErr: any) {
        if (dbErr.code === 'P2002') {
          return res.status(409).json({ error: 'A flight with this exact number identification is already registered' });
        }
        console.warn('⚠️ DB error creating flight:', dbErr);
      }
    }

    if (!flight) {
      const aircraft = aircraftId ? fallbackAircraftMap.get(aircraftId) : Array.from(fallbackAircraftMap.values())[0];
      flight = {
        id: `fl-${Date.now()}`,
        flightNo,
        airline,
        airlineCode: airlineCode || 'AV',
        departureCity,
        arrivalCity,
        departureAirportId,
        arrivalAirportId,
        departureTime,
        arrivalTime,
        price: Number(price),
        date,
        duration,
        cabinClass,
        stops: stops !== undefined ? Number(stops) : 0,
        aircraftId: aircraft?.id || aircraftId,
        aircraft: aircraft || null,
        availableSeats: Array.isArray(seatsPattern) ? seatsPattern.join(',') : seatsPattern,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    fallbackFlightsMap.set(flight.id, flight);
    res.status(201).json(flight);
  } catch (err: any) {
    console.error('Flight schedule error:', err);
    res.status(500).json({ error: 'Failed to schedule new route' });
  }
});

// Admin ONLY: Edit Flight Schedules
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {
      flightNo,
      airline,
      airlineCode,
      departureCity,
      arrivalCity,
      departureAirportId,
      arrivalAirportId,
      departureTime,
      arrivalTime,
      price,
      date,
      duration,
      cabinClass,
      stops,
      aircraftId,
      availableSeats,
    } = req.body;

    const dbOnline = await isDatabaseAvailable();
    let existing: any = null;

    if (dbOnline) {
      try {
        existing = await prisma.flight.findUnique({ where: { id: req.params.id } });
      } catch (e) {}
    }

    if (!existing) {
      existing = fallbackFlightsMap.get(req.params.id);
    }

    if (!existing) {
      return res.status(404).json({ error: 'Flight route not found' });
    }

    let updated: any = null;
    if (dbOnline && !existing.id.startsWith('fl-') && !existing.id.startsWith('fallback-')) {
      try {
        updated = await prisma.flight.update({
          where: { id: req.params.id },
          data: {
            flightNo: flightNo !== undefined ? flightNo : existing.flightNo,
            airline: airline !== undefined ? airline : existing.airline,
            airlineCode: airlineCode !== undefined ? airlineCode : existing.airlineCode,
            departureCity: departureCity !== undefined ? departureCity : existing.departureCity,
            arrivalCity: arrivalCity !== undefined ? arrivalCity : existing.arrivalCity,
            departureAirportId: departureAirportId !== undefined ? departureAirportId : existing.departureAirportId,
            arrivalAirportId: arrivalAirportId !== undefined ? arrivalAirportId : existing.arrivalAirportId,
            departureTime: departureTime !== undefined ? departureTime : existing.departureTime,
            arrivalTime: arrivalTime !== undefined ? arrivalTime : existing.arrivalTime,
            price: price !== undefined ? Number(price) : existing.price,
            date: date !== undefined ? date : existing.date,
            duration: duration !== undefined ? duration : existing.duration,
            cabinClass: cabinClass !== undefined ? cabinClass : existing.cabinClass,
            stops: stops !== undefined ? Number(stops) : existing.stops,
            aircraftId: aircraftId !== undefined ? aircraftId : existing.aircraftId,
            availableSeats: availableSeats !== undefined ? (Array.isArray(availableSeats) ? availableSeats.join(',') : availableSeats) : existing.availableSeats,
          },
          include: {
            aircraft: true,
          },
        });
      } catch (e) {}
    }

    if (!updated) {
      const aircraft = aircraftId ? fallbackAircraftMap.get(aircraftId) : existing.aircraft;
      updated = {
        ...existing,
        flightNo: flightNo !== undefined ? flightNo : existing.flightNo,
        airline: airline !== undefined ? airline : existing.airline,
        airlineCode: airlineCode !== undefined ? airlineCode : existing.airlineCode,
        departureCity: departureCity !== undefined ? departureCity : existing.departureCity,
        arrivalCity: arrivalCity !== undefined ? arrivalCity : existing.arrivalCity,
        departureAirportId: departureAirportId !== undefined ? departureAirportId : existing.departureAirportId,
        arrivalAirportId: arrivalAirportId !== undefined ? arrivalAirportId : existing.arrivalAirportId,
        departureTime: departureTime !== undefined ? departureTime : existing.departureTime,
        arrivalTime: arrivalTime !== undefined ? arrivalTime : existing.arrivalTime,
        price: price !== undefined ? Number(price) : existing.price,
        date: date !== undefined ? date : existing.date,
        duration: duration !== undefined ? duration : existing.duration,
        cabinClass: cabinClass !== undefined ? cabinClass : existing.cabinClass,
        stops: stops !== undefined ? Number(stops) : existing.stops,
        aircraftId: aircraftId !== undefined ? aircraftId : existing.aircraftId,
        aircraft: aircraft || existing.aircraft,
        availableSeats: availableSeats !== undefined ? (Array.isArray(availableSeats) ? availableSeats.join(',') : availableSeats) : existing.availableSeats,
      };
    }

    fallbackFlightsMap.set(updated.id, updated);
    res.json(updated);
  } catch (err) {
    console.error('Flight update error:', err);
    res.status(500).json({ error: 'Failed to update flight parameters' });
  }
});

// Admin ONLY: Delete/Cancel Flights
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    let existing: any = null;

    if (dbOnline) {
      try {
        existing = await prisma.flight.findUnique({ where: { id: req.params.id } });
        if (existing) {
          await prisma.flight.delete({ where: { id: req.params.id } });
        }
      } catch (e) {}
    }

    if (!existing) {
      existing = fallbackFlightsMap.get(req.params.id);
    }

    if (!existing) {
      return res.status(404).json({ error: 'Flight route not found' });
    }

    fallbackFlightsMap.delete(req.params.id);
    res.json({ message: `Flight route ${existing.flightNo} successfully cancelled and purged` });
  } catch (err) {
    console.error('Flight delete error:', err);
    res.status(500).json({ error: 'Failed to remove flight route' });
  }
});

export default router;
