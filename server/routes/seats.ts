import { Router } from 'express';
import { getFlightSeatsState, lockSeat, unlockSeat } from '../services/realtimeSeats';

const router = Router();

// GET /api/flights/:flightId/seats - Authoritative seat state
router.get('/:flightId/seats', async (req, res) => {
  try {
    const { flightId } = req.params;
    const sessionId = (req.query.sessionId as string) || '';

    const state = await getFlightSeatsState(flightId, sessionId);
    return res.json(state);
  } catch (err: any) {
    console.error('❌ [Seats Router] Error fetching seat state:', err);
    return res.status(500).json({ error: 'Failed to retrieve flight seat availability.' });
  }
});

// POST /api/flights/:flightId/seats/lock - Hold a seat for 5 mins
router.post('/:flightId/seats/lock', async (req, res) => {
  try {
    const { flightId } = req.params;
    const { seatId, sessionId } = req.body;

    if (!seatId || !sessionId) {
      return res.status(400).json({ error: 'Both seatId and sessionId are required to lock a seat.' });
    }

    const result = await lockSeat(flightId, seatId, sessionId);
    if (!result.success) {
      return res.status(409).json({ success: false, error: result.error });
    }

    return res.json({ success: true, seatId, expiresAt: result.expiresAt });
  } catch (err: any) {
    console.error('❌ [Seats Router] Error locking seat:', err);
    return res.status(500).json({ error: 'Could not process seat reservation hold.' });
  }
});

// POST /api/flights/:flightId/seats/unlock - Release hold
router.post('/:flightId/seats/unlock', async (req, res) => {
  try {
    const { flightId } = req.params;
    const { seatId, sessionId } = req.body;

    if (!seatId || !sessionId) {
      return res.status(400).json({ error: 'Both seatId and sessionId are required to unlock a seat.' });
    }

    const success = unlockSeat(flightId, seatId, sessionId);
    return res.json({ success });
  } catch (err: any) {
    console.error('❌ [Seats Router] Error unlocking seat:', err);
    return res.status(500).json({ error: 'Could not release seat hold.' });
  }
});

export default router;
