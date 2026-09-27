import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { prisma, isDatabaseAvailable } from '../db';
import { fallbackBookingsMap, fallbackFlightsMap } from '../fallbackStore';
import { normalizeSeat } from '../utils/seats';

export interface SeatLock {
  flightId: string;
  seatId: string; // canonical normalized (e.g., "1D")
  sessionId: string;
  lockedAt: number;
  expiresAt: number;
}

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// In-memory seat locks map: key = `${flightId}:${seatId}`
const activeLocks = new Map<string, SeatLock>();

// Subscribed WebSocket clients per flightId
const flightSubscribers = new Map<string, Set<WebSocket>>();

// Associate WebSocket connection with session ID
const clientSessions = new WeakMap<WebSocket, string>();

let wssInstance: WebSocketServer | null = null;

// Periodic cleanup of expired locks
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of activeLocks.entries()) {
    if (lock.expiresAt <= now) {
      activeLocks.delete(key);
      console.log(`⏰ [Realtime Seats] Hold expired for seat ${lock.seatId} on flight ${lock.flightId}`);
      broadcastSeatUpdate(lock.flightId, lock.seatId, 'available');
    }
  }
}, 10000);

export function broadcastToFlight(flightId: string, message: any) {
  const subscribers = flightSubscribers.get(flightId);
  if (!subscribers || subscribers.size === 0) return;

  const payload = JSON.stringify(message);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.warn('⚠️ [Realtime Seats] Failed to send WS message to client:', err);
      }
    }
  }
}

export function broadcastSeatUpdate(flightId: string, seatId: string, status: 'available' | 'locked' | 'booked', lockedBySessionId?: string) {
  const canonical = normalizeSeat(seatId);
  const subscribers = flightSubscribers.get(flightId);
  if (!subscribers || subscribers.size === 0) return;

  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      const clientSession = clientSessions.get(client);
      const isSelf = lockedBySessionId ? clientSession === lockedBySessionId : false;

      const payload = JSON.stringify({
        type: 'SEAT_UPDATED',
        flightId,
        seatId: canonical,
        status,
        isSelf,
      });

      try {
        client.send(payload);
      } catch (err) {
        console.warn('⚠️ [Realtime Seats] Failed to broadcast seat update:', err);
      }
    }
  }
}

/**
 * Check if a seat is currently booked in the database or fallback store
 */
export async function isSeatBooked(flightId: string, seatId: string): Promise<boolean> {
  const canonical = normalizeSeat(seatId);
  const dbOnline = await isDatabaseAvailable();

  if (dbOnline) {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          flightId,
          status: { not: 'CANCELLED' },
        },
        select: { seatId: true },
      });

      if (booking) {
        const bookedList = await prisma.booking.findMany({
          where: {
            flightId,
            status: { not: 'CANCELLED' },
          },
          select: { seatId: true },
        });

        for (const b of bookedList) {
          if (normalizeSeat(b.seatId) === canonical) {
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [Realtime Seats] Error checking DB for booked seat:', err);
    }
  }

  // Check fallback store
  for (const b of fallbackBookingsMap.values()) {
    if (b.flightId === flightId && b.status !== 'CANCELLED' && normalizeSeat(b.seatId) === canonical) {
      return true;
    }
  }

  return false;
}

/**
 * Get all authoritative booked seats for a flight
 */
export async function getBookedSeatsForFlight(flightId: string): Promise<string[]> {
  const booked = new Set<string>();
  const dbOnline = await isDatabaseAvailable();

  if (dbOnline) {
    try {
      const list = await prisma.booking.findMany({
        where: {
          flightId,
          status: { not: 'CANCELLED' },
        },
        select: { seatId: true },
      });
      for (const b of list) {
        booked.add(normalizeSeat(b.seatId));
      }
    } catch (err) {
      console.warn('⚠️ [Realtime Seats] Error fetching booked seats from DB:', err);
    }
  }

  // Also check in-memory fallback store
  for (const b of fallbackBookingsMap.values()) {
    if (b.flightId === flightId && b.status !== 'CANCELLED') {
      booked.add(normalizeSeat(b.seatId));
    }
  }

  return Array.from(booked);
}

/**
 * Lock/Hold a seat for a user's session
 */
export async function lockSeat(
  flightId: string,
  seatId: string,
  sessionId: string
): Promise<{ success: boolean; error?: string; expiresAt?: number }> {
  const canonical = normalizeSeat(seatId);

  // 1. Verify seat is not already booked in DB or fallback
  const booked = await isSeatBooked(flightId, canonical);
  if (booked) {
    return {
      success: false,
      error: 'This seat was just booked by another traveler. Please select another seat.',
    };
  }

  // 2. Check if locked by another session
  const key = `${flightId}:${canonical}`;
  const now = Date.now();
  const existingLock = activeLocks.get(key);

  if (existingLock && existingLock.expiresAt > now && existingLock.sessionId !== sessionId) {
    return {
      success: false,
      error: 'This seat is currently held by another passenger. Please select another seat.',
    };
  }

  // 3. Release any other seat lock this session had on the same flight
  for (const [lockKey, lock] of activeLocks.entries()) {
    if (lock.flightId === flightId && lock.sessionId === sessionId && lock.seatId !== canonical) {
      activeLocks.delete(lockKey);
      broadcastSeatUpdate(flightId, lock.seatId, 'available');
    }
  }

  // 4. Create new lock
  const expiresAt = now + LOCK_DURATION_MS;
  const newLock: SeatLock = {
    flightId,
    seatId: canonical,
    sessionId,
    lockedAt: now,
    expiresAt,
  };

  activeLocks.set(key, newLock);
  console.log(`🔒 [Realtime Seats] Seat ${canonical} locked for flight ${flightId} by session ${sessionId}`);

  // 5. Broadcast update
  broadcastSeatUpdate(flightId, canonical, 'locked', sessionId);

  return { success: true, expiresAt };
}

/**
 * Unlock a seat
 */
export function unlockSeat(flightId: string, seatId: string, sessionId: string): boolean {
  const canonical = normalizeSeat(seatId);
  const key = `${flightId}:${canonical}`;
  const lock = activeLocks.get(key);

  if (lock && (lock.sessionId === sessionId || !sessionId)) {
    activeLocks.delete(key);
    console.log(`🔓 [Realtime Seats] Seat ${canonical} unlocked on flight ${flightId}`);
    broadcastSeatUpdate(flightId, canonical, 'available');
    return true;
  }
  return false;
}

/**
 * Confirm seat booking (permanently marked booked, release any hold)
 */
export function confirmSeatBooked(flightId: string, seatId: string) {
  const canonical = normalizeSeat(seatId);
  const key = `${flightId}:${canonical}`;
  activeLocks.delete(key);
  console.log(`🎟️ [Realtime Seats] Seat ${canonical} confirmed booked on flight ${flightId}`);
  broadcastSeatUpdate(flightId, canonical, 'booked');
}

/**
 * Get full state of seats for a flight
 */
export async function getFlightSeatsState(flightId: string, clientSessionId?: string) {
  const bookedSeats = await getBookedSeatsForFlight(flightId);
  const now = Date.now();
  const lockedSeats: { seatId: string; isSelf: boolean; expiresAt: number }[] = [];

  for (const lock of activeLocks.values()) {
    if (lock.flightId === flightId && lock.expiresAt > now) {
      lockedSeats.push({
        seatId: lock.seatId,
        isSelf: clientSessionId ? lock.sessionId === clientSessionId : false,
        expiresAt: lock.expiresAt,
      });
    }
  }

  return {
    flightId,
    bookedSeats,
    lockedSeats,
  };
}

/**
 * Initialize WebSocket Server for Realtime Seats
 */
export function initRealtimeServer(server: any): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wssInstance = wss;

  server.on('upgrade', (request: IncomingMessage, socket: any, head: any) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/ws' || url.pathname === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('🔌 [Realtime WS] Client connected to realtime seats WebSocket');

    let currentFlightId: string | null = null;

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'SUBSCRIBE_FLIGHT') {
          const { flightId, sessionId } = message;
          if (sessionId) {
            clientSessions.set(ws, sessionId);
          }

          if (currentFlightId && currentFlightId !== flightId) {
            flightSubscribers.get(currentFlightId)?.delete(ws);
          }

          currentFlightId = flightId;
          if (!flightSubscribers.has(flightId)) {
            flightSubscribers.set(flightId, new Set());
          }
          flightSubscribers.get(flightId)!.add(ws);

          console.log(`📡 [Realtime WS] Client subscribed to flight: ${flightId}`);

          // Send current state
          const state = await getFlightSeatsState(flightId, sessionId);
          ws.send(JSON.stringify({
            type: 'FLIGHT_SEATS_STATE',
            ...state,
          }));
        } else if (message.type === 'UNSUBSCRIBE_FLIGHT') {
          const { flightId } = message;
          if (flightId) {
            flightSubscribers.get(flightId)?.delete(ws);
          }
          currentFlightId = null;
        } else if (message.type === 'LOCK_SEAT') {
          const { flightId, seatId, sessionId } = message;
          const result = await lockSeat(flightId, seatId, sessionId);
          ws.send(JSON.stringify({
            type: 'LOCK_RESULT',
            flightId,
            seatId: normalizeSeat(seatId),
            ...result,
          }));
        } else if (message.type === 'UNLOCK_SEAT') {
          const { flightId, seatId, sessionId } = message;
          unlockSeat(flightId, seatId, sessionId);
        } else if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch (err) {
        console.warn('⚠️ [Realtime WS] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      if (currentFlightId) {
        flightSubscribers.get(currentFlightId)?.delete(ws);
      }
      console.log('🔌 [Realtime WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.warn('⚠️ [Realtime WS] Socket error:', err.message);
    });
  });

  console.log('✅ [Realtime WS] Real-time seat availability WebSocket service initialized.');
  return wss;
}
