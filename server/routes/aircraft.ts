import { Router } from 'express';
import { prisma, isDatabaseAvailable } from '../db';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { FALLBACK_AIRCRAFT, fallbackAircraftMap } from '../fallbackStore';

const router = Router();

// Get list of all aircraft in fleet (public or logged in users)
router.get('/', async (req, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    if (dbOnline) {
      const aircraft = await prisma.aircraft.findMany({
        orderBy: { model: 'asc' },
      });
      return res.json(aircraft.length > 0 ? aircraft : FALLBACK_AIRCRAFT);
    }
    res.json(FALLBACK_AIRCRAFT);
  } catch (err) {
    res.json(FALLBACK_AIRCRAFT);
  }
});

// Get detailed parameters for a single aircraft
router.get('/:id', async (req, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    if (dbOnline) {
      const plane = await prisma.aircraft.findUnique({
        where: { id: req.params.id },
      });

      if (plane) {
        return res.json(plane);
      }
    }

    const fallbackPlane = FALLBACK_AIRCRAFT.find(a => a.id === req.params.id || a.model === req.params.id);
    if (fallbackPlane) {
      return res.json(fallbackPlane);
    }

    return res.status(404).json({ error: 'Aircraft not found' });
  } catch (err) {
    const fallbackPlane = FALLBACK_AIRCRAFT.find(a => a.id === req.params.id || a.model === req.params.id);
    if (fallbackPlane) {
      return res.json(fallbackPlane);
    }
    res.status(500).json({ error: 'Failed to load aircraft specifications' });
  }
});

// Admin ONLY: Register new Luxury Aircraft
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, model, capacity, range, speed, amenities, interiorImage, status } = req.body;

    if (!name || !model || !capacity || !range || !speed || !interiorImage || !status) {
      return res.status(400).json({ error: 'All primary aircraft specifications are required' });
    }

    const dbOnline = await isDatabaseAvailable();
    let plane: any = null;

    if (dbOnline) {
      try {
        plane = await prisma.aircraft.create({
          data: {
            name,
            model,
            capacity: Number(capacity),
            range: Number(range),
            speed: Number(speed),
            amenities: Array.isArray(amenities) ? amenities.join(',') : amenities,
            interiorImage,
            status,
          },
        });
      } catch (dbErr) {
        console.warn('⚠️ DB error creating aircraft:', dbErr);
      }
    }

    if (!plane) {
      plane = {
        id: `craft-${Date.now()}`,
        name,
        model,
        capacity: Number(capacity),
        range: Number(range),
        speed: Number(speed),
        amenities: Array.isArray(amenities) ? amenities.join(',') : amenities,
        interiorImage,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    fallbackAircraftMap.set(plane.id, plane);
    res.status(201).json(plane);
  } catch (err) {
    console.error('Aircraft registration error:', err);
    res.status(500).json({ error: 'Failed to register the new fleet member' });
  }
});

// Admin ONLY: Edit Aircraft Specifications
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, model, capacity, range, speed, amenities, interiorImage, status } = req.body;
    const dbOnline = await isDatabaseAvailable();
    let existing: any = null;

    if (dbOnline) {
      try {
        existing = await prisma.aircraft.findUnique({ where: { id: req.params.id } });
      } catch (e) {}
    }

    if (!existing) {
      existing = fallbackAircraftMap.get(req.params.id);
    }

    if (!existing) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }

    let updated: any = null;
    if (dbOnline && !existing.id.startsWith('craft-')) {
      try {
        updated = await prisma.aircraft.update({
          where: { id: req.params.id },
          data: {
            name: name !== undefined ? name : existing.name,
            model: model !== undefined ? model : existing.model,
            capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
            range: range !== undefined ? Number(range) : existing.range,
            speed: speed !== undefined ? Number(speed) : existing.speed,
            amenities: amenities !== undefined ? (Array.isArray(amenities) ? amenities.join(',') : amenities) : existing.amenities,
            interiorImage: interiorImage !== undefined ? interiorImage : existing.interiorImage,
            status: status !== undefined ? status : existing.status,
          },
        });
      } catch (e) {}
    }

    if (!updated) {
      updated = {
        ...existing,
        name: name !== undefined ? name : existing.name,
        model: model !== undefined ? model : existing.model,
        capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
        range: range !== undefined ? Number(range) : existing.range,
        speed: speed !== undefined ? Number(speed) : existing.speed,
        amenities: amenities !== undefined ? (Array.isArray(amenities) ? amenities.join(',') : amenities) : existing.amenities,
        interiorImage: interiorImage !== undefined ? interiorImage : existing.interiorImage,
        status: status !== undefined ? status : existing.status,
      };
    }

    fallbackAircraftMap.set(updated.id, updated);
    res.json(updated);
  } catch (err) {
    console.error('Aircraft update error:', err);
    res.status(500).json({ error: 'Failed to update aircraft parameters' });
  }
});

// Admin ONLY: Decommission/Delete Aircraft
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    let existing: any = null;

    if (dbOnline) {
      try {
        existing = await prisma.aircraft.findUnique({ where: { id: req.params.id } });
        if (existing) {
          await prisma.aircraft.delete({ where: { id: req.params.id } });
        }
      } catch (e) {}
    }

    if (!existing) {
      existing = fallbackAircraftMap.get(req.params.id);
    }

    if (!existing) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }

    fallbackAircraftMap.delete(req.params.id);
    res.json({ message: `Aircraft ${existing.name} successfully decommissioned from service` });
  } catch (err) {
    console.error('Aircraft delete error:', err);
    res.status(500).json({ error: 'Failed to decommission aircraft' });
  }
});

export default router;
