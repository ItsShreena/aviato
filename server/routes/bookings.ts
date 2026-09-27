import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import jwt from 'jsonwebtoken';
import { prisma, isDatabaseAvailable } from '../db';
import { authenticateJWT, optionalAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import Razorpay from 'razorpay';
import { normalizeSeat, getFullCabinSeats, checkSeatAvailable, deductSeatFromAvailability } from '../utils/seats';
import { FALLBACK_FEATURED_FLIGHTS } from './flights';
import { fallbackBookingsMap, fallbackFlightsMap } from '../fallbackStore';
import { sendBookingConfirmationEmail } from '../services/email';
import { confirmSeatBooked, broadcastSeatUpdate } from '../services/realtimeSeats';
import { calculateFlightPrice } from '../utils/pricing';

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_super_secret_jwt_key_aviato_2026';

const router = Router();

// Lazy Razorpay Initialization & Active Verification
let razorpay: any = null;
let razorpayVerified: boolean | null = null;

async function isRazorpayRouterGatewayActive(): Promise<boolean> {
  if (razorpayVerified !== null) {
    return razorpayVerified;
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    razorpayVerified = false;
    return false;
  }
  try {
    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    await rzp.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'probe_router',
    });
    razorpay = rzp;
    razorpayVerified = true;
    return true;
  } catch (probeErr) {
    razorpayVerified = false;
    razorpay = null;
    return false;
  }
}

function getRazorpay(): any {
  return razorpayVerified ? razorpay : null;
}

// Create a booking (and generate Razorpay Order / Simulator)
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { flightId, passengerName, passengerEmail, passportNumber, seatId, seatClass, totalPrice } = req.body;
    const userId = req.user?.id;
    console.log(`📥 [Booking Router] Received booking request for flightId: ${flightId}, Passenger: ${passengerName}, User ID: ${userId}`);

    if (!flightId || !passengerName || !passengerEmail || !passportNumber || !seatId || !seatClass || !totalPrice) {
      return res.status(400).json({ error: 'All passenger details, seat selection, and price are required' });
    }

    console.log(`🔍 [Booking Router] Looking up flight ID: ${flightId}`);
    const dbOnline = await isDatabaseAvailable();
    let flight: any = null;

    if (dbOnline) {
      try {
        flight = await prisma.flight.findUnique({
          where: { id: flightId },
          include: { aircraft: true },
        });
      } catch (fErr) {
        console.warn('⚠️ [Booking Router] DB flight lookup error:', fErr);
      }
    }

    if (!flight && dbOnline) {
      console.log(`⚠️ [Booking Router] Flight with ID ${flightId} not found in DB. Attempting dynamic lookup / auto-creation...`);
      
      // If the flight starts with dynamic-, we can parse it and auto-create the flight record in the DB!
      if (flightId.startsWith('dynamic-')) {
        try {
          // Format is typically dynamic-DEP-ARR-index. E.g. dynamic-JFK-LHR-1
          const parts = flightId.split('-');
          const depCode = parts[1] || 'JFK';
          const arrCode = parts[2] || 'LHR';
          const index = parseInt(parts[3]) || 1;
          
          // Let's resolve the airports and aircraft
          const depAirport = await prisma.airport.findFirst({ where: { code: depCode } }).catch(() => null);
          const arrAirport = await prisma.airport.findFirst({ where: { code: arrCode } }).catch(() => null);
          const aircraft = await prisma.aircraft.findFirst({ where: { status: 'ACTIVE' } }).catch(() => null);
          
          if (depAirport && arrAirport && aircraft) {
            const calculatedPrice = calculateFlightPrice({
              origin: depAirport.code,
              destination: arrAirport.code,
              stops: 0,
              airlineCode: 'AV',
              departureTime: '10:00 AM',
              flightId,
              cabinClass: 'economy',
            });
            flight = await prisma.flight.create({
              data: {
                id: flightId, // Explicitly set the ID so it matches the requested flightId!
                flightNo: `AV-DYN${index}${Math.floor(100 + Math.random() * 900)}`,
                airline: 'Aviato Supreme',
                airlineCode: 'AV',
                departureCity: depAirport.city,
                arrivalCity: arrAirport.city,
                departureAirportId: depAirport.id,
                arrivalAirportId: arrAirport.id,
                departureTime: '10:00 AM',
                arrivalTime: '06:00 PM',
                price: calculatedPrice,
                date: new Date().toISOString().split('T')[0], // default to today
                duration: '8h 00m',
                cabinClass: 'First',
                stops: 0,
                aircraftId: aircraft.id,
                availableSeats: getFullCabinSeats().join(','),
              },
              include: { aircraft: true }
            });
            console.log(`✅ [Booking Router] Dynamic flight ${flightId} auto-created on-the-fly with authoritative price ₹${calculatedPrice}.`);
          }
        } catch (createErr) {
          console.error('🚨 Failed to auto-create dynamic flight record during booking:', createErr);
        }
      }
    }

    if (!flight) {
      // Check fallback flights
      flight = fallbackFlightsMap.get(flightId) || FALLBACK_FEATURED_FLIGHTS.find(f => f.id === flightId) as any;
    }

    if (!flight) {
      console.error(`❌ [Booking Router] Flight with ID ${flightId} not found.`);
      return res.status(404).json({ error: 'Flight route could not be found' });
    }

    console.log(`✈️ [Booking Router] Found flight ${flight.flightNo} (${flight.departureCity} ➔ ${flight.arrivalCity})`);

    // Validate seat availability using normalized seat comparison
    const finalSeatId = normalizeSeat(seatId);
    console.log(`💺 [Booking Router] Validating seat: requested=${seatId}, normalized=${finalSeatId} on flight ${flight.flightNo}`);

    let existingFlightBookings: { seatId: string }[] = [];
    if (dbOnline) {
      try {
        existingFlightBookings = await prisma.booking.findMany({
          where: { flightId, status: { not: 'CANCELLED' } },
          select: { seatId: true }
        });
      } catch (bErr) {
        console.warn('⚠️ Could not check existing reservations in DB:', bErr);
      }
    }

    const memFlightBookings = Array.from(fallbackBookingsMap.values())
      .filter(b => b.flightId === flightId && b.status !== 'CANCELLED')
      .map(b => normalizeSeat(b.seatId));

    const alreadyBookedSeats = [...existingFlightBookings.map(b => normalizeSeat(b.seatId)), ...memFlightBookings];

    if (!checkSeatAvailable(flight.availableSeats, finalSeatId, alreadyBookedSeats)) {
      console.error(`❌ [Booking Router] Seat ${seatId} (${finalSeatId}) is occupied or invalid on flight ${flight.flightNo}.`);
      return res.status(400).json({ error: 'This seat was just booked by another traveler. Please select another seat.' });
    }

    // Deduct seat
    const updatedSeatsString = deductSeatFromAvailability(flight.availableSeats, finalSeatId);
    console.log(`🔄 [Booking Router] Deducting seat ${finalSeatId}. Remaining seats count: ${updatedSeatsString ? updatedSeatsString.split(',').length : 0}`);
    
    if (dbOnline) {
      try {
        await prisma.flight.update({
          where: { id: flightId },
          data: { availableSeats: updatedSeatsString },
        });
      } catch (upErr) {
        console.warn('⚠️ Could not update flight availableSeats in DB:', upErr);
      }
    }

    const memFlight = fallbackFlightsMap.get(flightId);
    if (memFlight) {
      memFlight.availableSeats = updatedSeatsString;
    }

    // Generate a unique luxurious booking number
    const bookingNo = `AV-${Math.floor(100000 + Math.random() * 900000)}`;

    // Calculate authoritative booking price based on flight price and seat modifier
    let seatModifier = 0;
    const normSeatClass = (seatClass || '').toUpperCase();
    if (normSeatClass.includes('FIRST')) {
      seatModifier = 1500;
    } else if (normSeatClass.includes('BUSINESS')) {
      seatModifier = 750;
    }
    if (finalSeatId.endsWith('A') || finalSeatId.endsWith('F')) {
      seatModifier += 200; // window seat
    }
    const authoritativeBaseTotal = flight.price + seatModifier;
    let authoritativeTotalPrice = authoritativeBaseTotal;
    // Check if valid first-time promo discount is requested
    if (totalPrice && Math.abs(Number(totalPrice) - Math.round(authoritativeBaseTotal * 0.90)) <= 10) {
      authoritativeTotalPrice = Math.round(authoritativeBaseTotal * 0.90);
    }

    const useRazorpay = await isRazorpayRouterGatewayActive();
    const rzpInstance = getRazorpay();

    console.log(`✍️ [Booking Router] Persisting booking ${bookingNo} with authoritative total ₹${authoritativeTotalPrice}...`);
    let booking: any = null;

    if (dbOnline) {
      try {
        booking = await prisma.booking.create({
          data: {
            bookingNo,
            flightId,
            userId,
            passengerName,
            passengerEmail,
            passportNumber,
            seatId: finalSeatId,
            seatClass,
            totalPrice: authoritativeTotalPrice,
            status: useRazorpay ? 'PENDING' : 'CONFIRMED',
          },
          include: {
            flight: {
              include: {
                aircraft: true,
                departureAirport: true,
                arrivalAirport: true,
              }
            }
          }
        });
      } catch (dbErr) {
        console.warn('⚠️ [Booking Router] DB offline, creating fallback in-memory booking:', dbErr);
      }
    }

    if (!booking) {
      booking = {
        id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookingNo,
        flightId,
        userId,
        passengerName,
        passengerEmail,
        passportNumber,
        seatId: finalSeatId,
        seatClass,
        totalPrice: authoritativeTotalPrice,
        status: 'CONFIRMED',
        flight,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (booking) {
      fallbackBookingsMap.set(booking.id, booking);
      confirmSeatBooked(flightId, finalSeatId);
    }

    console.log(`✅ [Booking Router] Booking ${bookingNo} created successfully with status: ${booking.status}`);

    let razorpayOrderId: string | null = null;
    let razorpayAmount: number | null = null;
    let razorpayCurrency: string | null = null;

    if (useRazorpay) {
      try {
        // In INR, 1 INR = 100 paise
        const amountInPaise = Math.round(authoritativeTotalPrice * 100);
        const currency = 'INR';

        const order = await rzpInstance.orders.create({
          amount: amountInPaise,
          currency: currency,
          receipt: bookingNo,
        });

        razorpayOrderId = order.id;
        razorpayAmount = amountInPaise;
        razorpayCurrency = currency;

        if (dbOnline && !booking.id.startsWith('bk-')) {
          try {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { razorpayOrderId: order.id },
            });
          } catch (uErr) {
            console.warn('⚠️ Could not update booking razorpayOrderId in DB:', uErr);
          }
        } else {
          const memB = fallbackBookingsMap.get(booking.id);
          if (memB) memB.razorpayOrderId = order.id;
        }
      } catch (rzpErr: any) {
        razorpayVerified = false;
        console.log(`💳 [Booking Router] Operating in Aviato Direct Settlement mode, confirming reservation directly.`);
        if (dbOnline && !booking.id.startsWith('bk-')) {
          try {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { status: 'CONFIRMED' },
            });
          } catch (cErr) {
            console.warn('⚠️ Could not update booking status in DB:', cErr);
          }
        } else {
          const memB = fallbackBookingsMap.get(booking.id);
          if (memB) memB.status = 'CONFIRMED';
        }
        booking.status = 'CONFIRMED';
      }
    }

    // Real Email Dispatch (Non-blocking: failure does not roll back booking)
    let emailSent = false;
    let emailMessage: string | null = null;
    if (booking.status === 'CONFIRMED') {
      try {
        const emailRes = await sendBookingConfirmationEmail({
          bookingNo: booking.bookingNo,
          passengerName: booking.passengerName,
          passengerEmail: booking.passengerEmail,
          passportNumber: booking.passportNumber,
          flightNo: flight.flightNo,
          airline: flight.airline,
          departureCity: flight.departureCity,
          departureAirportCode: flight.departureAirport?.code,
          arrivalCity: flight.arrivalCity,
          arrivalAirportCode: flight.arrivalAirport?.code,
          departureDate: flight.date,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          seatId: booking.seatId,
          seatClass: booking.seatClass,
          totalPrice: booking.totalPrice,
          status: booking.status,
          duration: flight.duration,
          aircraftName: flight.aircraft?.name,
        });
        emailSent = emailRes.success;
        emailMessage = emailRes.error || (emailRes.success ? 'SENT' : 'NOT_SENT');
      } catch (emErr: any) {
        console.warn('⚠️ [Booking Router Email] Failed to deliver confirmation email:', emErr?.message || emErr);
        emailSent = false;
        emailMessage = emErr?.message || 'EMAIL_DELIVERY_FAILED';
      }
    }

    res.status(201).json({
      booking,
      emailSent,
      emailMessage,
      useRazorpay: useRazorpay && !!razorpayOrderId,
      razorpayOrderId,
      razorpayAmount,
      razorpayCurrency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    const traceId = (req as any).bookingTraceId || 'N/A';
    console.error(`🚨 [Prisma Booking Error] [${traceId}] Booking router failed with database error:`, err.message || err);
    if (err.stack) {
      console.error(`🥞 [Prisma Booking Error] Stack Trace:`, err.stack);
    }
    res.status(500).json({ 
      error: 'Failed to record reservation', 
      traceId,
      details: err.message || String(err)
    });
  }
});

// Verify Razorpay payment signature
router.post('/verify', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing verification parameters' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured' });
    }

    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Update booking status to CONFIRMED
    const dbOnline = await isDatabaseAvailable();
    let updatedBooking: any = null;

    if (dbOnline && !bookingId.startsWith('bk-')) {
      try {
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          },
          include: {
            flight: {
              include: {
                aircraft: true,
                departureAirport: true,
                arrivalAirport: true,
              }
            }
          }
        });
      } catch (dbErr) {
        console.warn('⚠️ Could not update booking in DB during verify:', dbErr);
      }
    }

    if (!updatedBooking) {
      const fallbackBooking = fallbackBookingsMap.get(bookingId);
      if (fallbackBooking) {
        fallbackBooking.status = 'CONFIRMED';
        fallbackBooking.razorpayOrderId = razorpayOrderId;
        fallbackBooking.razorpayPaymentId = razorpayPaymentId;
        fallbackBooking.razorpaySignature = razorpaySignature;
        updatedBooking = fallbackBooking;
      }
    }

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found for payment verification' });
    }

    let emailSent = false;
    let emailMessage: string | null = null;
    try {
      const flight = updatedBooking.flight || fallbackFlightsMap.get(updatedBooking.flightId);
      const emailRes = await sendBookingConfirmationEmail({
        bookingNo: updatedBooking.bookingNo,
        passengerName: updatedBooking.passengerName,
        passengerEmail: updatedBooking.passengerEmail,
        passportNumber: updatedBooking.passportNumber,
        flightNo: flight?.flightNo || 'AV-VIP',
        airline: flight?.airline || 'Aviato Supreme',
        departureCity: flight?.departureCity || 'Origin',
        departureAirportCode: flight?.departureAirport?.code,
        arrivalCity: flight?.arrivalCity || 'Destination',
        arrivalAirportCode: flight?.arrivalAirport?.code,
        departureDate: flight?.date || 'Confirmed',
        departureTime: flight?.departureTime || 'Scheduled',
        arrivalTime: flight?.arrivalTime || 'Scheduled',
        seatId: updatedBooking.seatId,
        seatClass: updatedBooking.seatClass,
        totalPrice: updatedBooking.totalPrice,
        status: 'CONFIRMED',
        duration: flight?.duration,
        aircraftName: flight?.aircraft?.name,
      });
      emailSent = emailRes.success;
      emailMessage = emailRes.error || (emailRes.success ? 'SENT' : 'NOT_SENT');
    } catch (emErr: any) {
      console.warn('⚠️ [Verify Email Dispatch] Failed to deliver confirmation email:', emErr?.message || emErr);
      emailSent = false;
      emailMessage = emErr?.message || 'EMAIL_DELIVERY_FAILED';
    }

    res.json({ success: true, booking: updatedBooking, emailSent, emailMessage });
  } catch (err) {
    console.error('Razorpay verification error:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});


// Fetch active traveler's booking history
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let userRole = 'CUSTOMER';
    let userEmail: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        userRole = decoded.role;
        userEmail = decoded.email;
      } catch (tokenErr) {
        // Token invalid or expired - proceed as guest
      }
    }

    // Unauthenticated guest travelers must not see any private bookings
    if (!userId && userRole !== 'ADMIN') {
      return res.json([]);
    }

    const dbOnline = await isDatabaseAvailable();
    if (dbOnline) {
      const filter: any = userRole === 'ADMIN' ? {} : {
        OR: [
          { userId },
          ...(userEmail ? [{ passengerEmail: { equals: userEmail, mode: 'insensitive' } }] : [])
        ]
      };
      const bookings = await prisma.booking.findMany({
        where: filter,
        include: {
          flight: {
            include: {
              aircraft: true,
              departureAirport: true,
              arrivalAirport: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(bookings);
    }

    // Database is offline: return matching in-memory reservations for this user
    const allFallback = Array.from(fallbackBookingsMap.values());
    if (userRole === 'ADMIN') {
      return res.json(allFallback);
    }
    const userBookings = allFallback.filter(b => 
      b.userId === userId || (userEmail && b.passengerEmail?.toLowerCase() === userEmail.toLowerCase())
    );
    return res.json(userBookings);
  } catch (err) {
    console.warn('Bookings fetch error:', err);
    res.status(500).json({ error: "We couldn't load your bookings right now. Please try again." });
  }
});

// Fetch specific booking details
router.get('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let userRole = 'CUSTOMER';
    let userEmail: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        userRole = decoded.role;
        userEmail = decoded.email;
      } catch (tokenErr) {}
    }

    const dbOnline = await isDatabaseAvailable();
    let booking: any = null;
    if (dbOnline) {
      booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
          flight: {
            include: {
              aircraft: true,
              departureAirport: true,
              arrivalAirport: true,
            },
          },
        },
      });
    }

    if (!booking) {
      booking = fallbackBookingsMap.get(req.params.id);
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking record not found' });
    }

    // Strict security check: verify the booking belongs to the requesting user or user is admin
    if (booking.userId && userRole !== 'ADMIN') {
      const isOwner = (userId && booking.userId === userId) || 
                      (userEmail && booking.passengerEmail?.toLowerCase() === userEmail.toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ error: 'Access denied: unauthorized booking view' });
      }
    }

    return res.json(booking);
  } catch (err) {
    console.error('Fetch booking error:', err);
    res.status(500).json({ error: 'Failed to load booking details' });
  }
});

// Cancel Booking
router.post('/:id/cancel', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    let booking: any = null;

    if (dbOnline) {
      try {
        booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
      } catch (dbErr) {
        console.warn('⚠️ DB error looking up booking for cancel:', dbErr);
      }
    }

    if (!booking) {
      booking = fallbackBookingsMap.get(req.params.id);
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify owner or admin
    if (req.user?.role !== 'ADMIN' && booking.userId && req.user?.id && booking.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    let updated: any = null;
    if (dbOnline && !booking.id.startsWith('bk-')) {
      try {
        updated = await prisma.booking.update({
          where: { id: req.params.id },
          data: { status: 'CANCELLED' },
          include: {
            flight: true,
          },
        });
      } catch (upErr) {
        console.warn('⚠️ DB error updating booking status to CANCELLED:', upErr);
      }
    }

    if (!updated) {
      booking.status = 'CANCELLED';
      fallbackBookingsMap.set(booking.id, booking);
      updated = booking;
    }

    if (booking?.flightId && booking?.seatId) {
      broadcastSeatUpdate(booking.flightId, booking.seatId, 'available');
    }

    res.json({ message: 'Reservation successfully cancelled', booking: updated });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// Rebook Flight Booking
router.post('/:id/rebook', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    let originalBooking: any = null;

    if (dbOnline) {
      try {
        originalBooking = await prisma.booking.findUnique({
          where: { id: req.params.id },
          include: { flight: true },
        });
      } catch (dbErr) {
        console.warn('⚠️ DB error finding booking for rebook:', dbErr);
      }
    }

    if (!originalBooking) {
      originalBooking = fallbackBookingsMap.get(req.params.id);
    }

    if (!originalBooking) {
      return res.status(404).json({ error: 'Original booking not found' });
    }

    if (req.user?.role !== 'ADMIN' && originalBooking.userId && req.user?.id && originalBooking.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to rebook' });
    }

    // Generate a fresh luxurious booking identifier
    const bookingNo = `AV-${Math.floor(100000 + Math.random() * 900000)}`;
    let newBooking: any = null;

    if (dbOnline) {
      try {
        newBooking = await prisma.booking.create({
          data: {
            bookingNo,
            flightId: originalBooking.flightId,
            userId: originalBooking.userId,
            passengerName: originalBooking.passengerName,
            passengerEmail: originalBooking.passengerEmail,
            passportNumber: originalBooking.passportNumber,
            seatId: originalBooking.seatId,
            seatClass: originalBooking.seatClass,
            totalPrice: originalBooking.totalPrice,
            status: 'CONFIRMED',
          },
          include: {
            flight: {
              include: {
                aircraft: true,
              },
            },
          },
        });
      } catch (dbErr) {
        console.warn('⚠️ DB error creating rebooking:', dbErr);
      }
    }

    if (!newBooking) {
      newBooking = {
        id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookingNo,
        flightId: originalBooking.flightId,
        userId: originalBooking.userId,
        passengerName: originalBooking.passengerName,
        passengerEmail: originalBooking.passengerEmail,
        passportNumber: originalBooking.passportNumber,
        seatId: originalBooking.seatId,
        seatClass: originalBooking.seatClass,
        totalPrice: originalBooking.totalPrice,
        status: 'CONFIRMED',
        flight: originalBooking.flight,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackBookingsMap.set(newBooking.id, newBooking);
    }

    res.status(201).json({ message: 'Flight successfully rebooked', booking: newBooking });
  } catch (err) {
    console.error('Rebooking error:', err);
    res.status(500).json({ error: 'Failed to rebook flight reservation' });
  }
});

// Stream Boarding Pass PDF
router.get('/:id/boarding-pass', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const dbOnline = await isDatabaseAvailable();
    let booking: any = null;

    if (dbOnline) {
      try {
        booking = await prisma.booking.findFirst({
          where: {
            OR: [
              { id: req.params.id },
              { bookingNo: req.params.id }
            ]
          },
          include: {
            flight: {
              include: {
                aircraft: true,
                departureAirport: true,
                arrivalAirport: true,
              },
            },
          },
        });
      } catch (dbErr) {
        console.warn('⚠️ DB error fetching boarding pass data:', dbErr);
      }
    }

    if (!booking) {
      booking = fallbackBookingsMap.get(req.params.id);
      if (!booking) {
        for (const b of fallbackBookingsMap.values()) {
          if (b.bookingNo === req.params.id || b.id === req.params.id) {
            booking = b;
            break;
          }
        }
      }
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking pass details not found' });
    }

    if (req.user && req.user.role !== 'ADMIN' && booking.userId && req.user.id && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: unauthorized booking pass' });
    }

    const flight = booking.flight || fallbackFlightsMap.get(booking.flightId) || FALLBACK_FEATURED_FLIGHTS[0];

    // Safely resolve airport codes, names, timings, and parameters
    const depCode = (typeof flight.departureAirport === 'object' ? flight.departureAirport?.code : flight.departureAirport) 
      || flight.departureAirportCode 
      || (flight.departureCity ? flight.departureCity.substring(0, 3).toUpperCase() : 'DEL');
    const arrCode = (typeof flight.arrivalAirport === 'object' ? flight.arrivalAirport?.code : flight.arrivalAirport) 
      || flight.arrivalAirportCode 
      || (flight.arrivalCity ? flight.arrivalCity.substring(0, 3).toUpperCase() : 'BOM');
    const depCity = flight.departureCity || 'Origin';
    const arrCity = flight.arrivalCity || 'Destination';
    const depTime = flight.departureTime || '08:45 PM';
    const arrTime = flight.arrivalTime || '10:16 PM';
    const flightNum = flight.flightNo || flight.flightNumber || 'AV-100';
    const flightDate = flight.date || new Date().toISOString().split('T')[0];
    const flightDuration = flight.duration || '2h 15m';
    const flightAirline = flight.airline || 'Aviato Supreme';
    const passenger = (booking.passengerName || 'VALUED TRAVELER').toUpperCase();
    const seatNo = (booking.seatId || booking.seatNumber || '12A').toUpperCase();
    const seatClass = (booking.seatClass || 'ECONOMY').toUpperCase();
    const bookingPnr = booking.bookingNo || (booking.id ? (booking.id.startsWith('AV-') ? booking.id : `AV-${booking.id.substring(0, 6).toUpperCase()}`) : 'AV-DEMO12');
    const isSandbox = flight.providerSource === 'letsfg_sandbox';
    const providerText = isSandbox ? 'LETSFG SANDBOX  |  TEST ENVIRONMENT' : 'DEMO FALLBACK  |  TEST ENVIRONMENT';

    // Create a PDF Document using authentic boarding pass aspect ratio (720 x 350 pt)
    const doc = new PDFDocument({ size: [720, 350], margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BoardingPass-${bookingPnr}.pdf`);

    doc.pipe(res);

    // 1. Page Background & Outer Boarding Pass Card
    doc.rect(0, 0, 720, 350).fill('#F1F5F9');
    
    // Main Pass Container
    doc.roundedRect(15, 15, 690, 320, 10)
       .fillAndStroke('#FFFFFF', '#CBD5E1');

    // 2. MAIN SECTION: Header Bar (Deep Aviato Navy)
    doc.roundedRect(15, 15, 495, 54, 10).fill('#071329');
    doc.rect(15, 40, 495, 29).fill('#071329'); // Flatten bottom corners of header

    // Brand Name
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(20)
       .text('AVIATO', 35, 24);

    doc.fillColor('#38BDF8')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('FLY SMARTER', 36, 46);

    // Demo Boarding Pass Title on Right
    doc.fillColor('#F59E0B')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('DEMO BOARDING PASS', 255, 24, { width: 240, align: 'right' });

    doc.fillColor('#94A3B8')
       .font('Helvetica')
       .fontSize(8)
       .text('Aviato Demo Simulator  |  Not an airline ticket', 255, 42, { width: 240, align: 'right' });

    // 3. Sub-header Banner (Environment & Safety Tag)
    doc.rect(15, 69, 495, 22).fill('#FFFBEB');
    doc.fillColor('#B45309')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text(providerText, 35, 76);

    doc.fillColor('#64748B')
       .font('Helvetica')
       .fontSize(7.5)
       .text('SIMULATION USE ONLY  |  NON-COMMERCIAL', 255, 76, { width: 240, align: 'right' });

    // 4. Passenger Name & Operating Carrier Row
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('PASSENGER NAME', 35, 100);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(passenger, 35, 112);

    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('OPERATING CARRIER', 330, 100);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(flightAirline, 330, 112);

    // Divider Line
    doc.strokeColor('#E2E8F0')
       .lineWidth(1)
       .moveTo(35, 134)
       .lineTo(495, 134)
       .stroke();

    // 5. Route Section: FROM → TO with Departure & Arrival Times
    // FROM Column
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('FROM', 35, 142);

    doc.fillColor('#071329')
       .font('Helvetica-Bold')
       .fontSize(28)
       .text(depCode, 35, 154);

    doc.fillColor('#64748B')
       .font('Helvetica')
       .fontSize(9)
       .text(depCity, 35, 186);

    doc.fillColor('#0284C7')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('DEPARTURE', 35, 202);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(depTime, 35, 214);

    // Center Flight Path
    doc.fillColor('#0284C7')
       .font('Helvetica-Bold')
       .fontSize(9)
       .text(flightDuration, 175, 158, { width: 140, align: 'center' });

    doc.strokeColor('#38BDF8')
       .lineWidth(1.5)
       .moveTo(195, 174)
       .lineTo(290, 174)
       .stroke();

    doc.fillColor('#0284C7')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('>', 288, 168);

    doc.fillColor('#64748B')
       .font('Helvetica')
       .fontSize(8)
       .text(flight.stops === 0 ? 'NONSTOP' : `${flight.stops} STOP`, 175, 184, { width: 140, align: 'center' });

    // TO Column
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('TO', 340, 142);

    doc.fillColor('#071329')
       .font('Helvetica-Bold')
       .fontSize(28)
       .text(arrCode, 340, 154);

    doc.fillColor('#64748B')
       .font('Helvetica')
       .fontSize(9)
       .text(arrCity, 340, 186);

    doc.fillColor('#0284C7')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('ARRIVAL', 340, 202);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(arrTime, 340, 214);

    // Divider Line
    doc.strokeColor('#E2E8F0')
       .lineWidth(1)
       .moveTo(35, 234)
       .lineTo(495, 234)
       .stroke();

    // 6. Flight Info Grid: FLIGHT, DATE, SEAT, CLASS
    // Flight
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('FLIGHT', 35, 240);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(flightNum, 35, 252);

    // Date
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('DATE', 145, 240);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(flightDate, 145, 252);

    // Seat with distinct badge
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('SEAT', 260, 240);

    doc.roundedRect(260, 250, 48, 20, 4)
       .fillAndStroke('#E0F2FE', '#BAE6FD');

    doc.fillColor('#0369A1')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(seatNo, 260, 254, { width: 48, align: 'center' });

    // Class
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('CLASS', 360, 240);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(seatClass, 360, 252);

    // 7. PNR Container & Clear Safety Disclaimer
    doc.roundedRect(35, 280, 180, 42, 6)
       .fillAndStroke('#F8FAFC', '#E2E8F0');

    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('PNR / BOOKING REFERENCE (DEMO)', 43, 286);

    doc.fillColor('#071329')
       .font('Helvetica-Bold')
       .fontSize(15)
       .text(bookingPnr, 43, 298);

    doc.fillColor('#94A3B8')
       .font('Helvetica')
       .fontSize(7.2)
       .text('DEMO SIMULATION RESERVATION  |  FOR DEMONSTRATION & TESTING ONLY  |  CANNOT BE USED FOR ACTUAL AIRPORT BOARDING OR COMMERCIAL GATE ACCESS.', 230, 286, { width: 265, lineGap: 2 });

    // 8. Perforation Notches & Dashed Divider Line (Dividing Main Pass & Stub)
    doc.circle(510, 15, 8).fill('#F1F5F9');
    doc.circle(510, 335, 8).fill('#F1F5F9');

    doc.save()
       .dash(4, { space: 4 })
       .strokeColor('#CBD5E1')
       .lineWidth(1.5)
       .moveTo(510, 25)
       .lineTo(510, 325)
       .stroke()
       .restore();

    // 9. PASSENGER STUB SECTION (Right Side)
    // Stub Header
    doc.roundedRect(510, 15, 195, 54, 10).fill('#071329');
    doc.rect(510, 40, 195, 29).fill('#071329');

    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text('AVIATO', 525, 24);

    doc.fillColor('#38BDF8')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('PASSENGER STUB (DEMO)', 525, 42);

    // Stub Content Rows
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('PASSENGER', 525, 76);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(passenger, 525, 88, { width: 165, ellipsis: true });

    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('ROUTE', 525, 108);

    doc.fillColor('#071329')
       .font('Helvetica-Bold')
       .fontSize(13)
       .text(`${depCode} -> ${arrCode}`, 525, 120);

    // Flight & Seat Row
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('FLIGHT', 525, 142);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(flightNum, 525, 153);

    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('SEAT', 615, 142);

    doc.fillColor('#0284C7')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(seatNo, 615, 152);

    // Timing
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('DEPARTURE', 525, 174);

    doc.fillColor('#0F172A')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text(`${depTime}  |  ${flightDate}`, 525, 185);

    // PNR
    doc.fillColor('#64748B')
       .font('Helvetica-Bold')
       .fontSize(7.5)
       .text('PNR (DEMO)', 525, 206);

    doc.fillColor('#071329')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(bookingPnr, 525, 218);

    // 10. Decorative Non-Scannable Demonstration Barcode Bars
    const barX = 525;
    const barY = 246;
    const barWidths = [1, 2.5, 1, 3, 1.5, 1, 2, 3, 1, 2.5, 1.5, 3, 1, 2, 1, 2.5, 3, 1, 2, 1.5, 2.5, 1, 3, 1.5, 2];
    let curX = barX;
    for (const w of barWidths) {
      doc.rect(curX, barY, w, 28).fill('#CBD5E1');
      curX += w + 2;
    }

    doc.fillColor('#94A3B8')
       .font('Helvetica-Bold')
       .fontSize(6.5)
       .text('DEMO PASS  |  NON-SCANNABLE', 525, 282, { width: 165, align: 'center' });

    doc.fillColor('#CBD5E1')
       .font('Helvetica')
       .fontSize(6)
       .text('LETSFG SANDBOX SIMULATOR', 525, 292, { width: 165, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF boarding pass error:', err);
    res.status(500).json({ error: 'Boarding pass generation failed' });
  }
});

export default router;
