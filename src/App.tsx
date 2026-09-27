/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, User, Mail, ShieldAlert, ArrowLeft, Heart, Compass, X, AlertTriangle, Key, ArrowRight, CreditCard, Loader2, Lock, ShieldCheck, Tag, Percent } from 'lucide-react';
import { Flight, Booking, Seat, SearchQuery, AuthUser } from './types';
import { AIRPORTS, FEATURED_FLIGHTS, generateFlightsForRoute, generateSeats } from './data';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SearchResultsPage from './pages/SearchResultsPage';
import FlightDetailsPage from './pages/FlightDetailsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TravelHubPage from './pages/TravelHubPage';
import AuthForm from './components/AuthForm';
import SeatSelector from './components/SeatSelector';
import BookingCard from './components/BookingCard';
import BookingProgressBar from './components/BookingProgressBar';
import BookingFlightSummary from './components/BookingFlightSummary';
import PassengerDetailsStep from './components/PassengerDetailsStep';
import BookingReviewStep from './components/BookingReviewStep';
import BookingConfirmationView from './components/BookingConfirmationView';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MyProfilePage from './pages/MyProfilePage';
import DiagnosticsConsole from './components/DiagnosticsConsole';
import { formatINR } from './utils/currency';

export function mapDbFlightToFrontend(dbFlight: any): Flight {
  if (!dbFlight) {
    return {
      id: '',
      flightNumber: '',
      airline: '',
      airlineCode: 'AV',
      departureAirport: 'JFK',
      departureCity: '',
      arrivalAirport: 'LHR',
      arrivalCity: '',
      departureTime: '',
      arrivalTime: '',
      date: '',
      duration: '',
      stops: 0,
      layovers: [],
      price: 0,
      seatAvailability: 12,
      routeScore: 9.5,
      co2Savings: '18% CO2 emission savings',
      aircraft: 'Gulfstream G650',
      providerSource: 'demo',
    };
  }
  return {
    id: dbFlight.id,
    flightNumber: dbFlight.flightNo || dbFlight.flightNumber || 'FLIGHT',
    airline: dbFlight.airline || 'Airline',
    airlineCode: dbFlight.airlineCode || 'AV',
    departureAirport: dbFlight.departureAirport?.code || dbFlight.departureAirportId || dbFlight.origin || 'DEL',
    departureCity: dbFlight.departureCity || 'Departure City',
    arrivalAirport: dbFlight.arrivalAirport?.code || dbFlight.arrivalAirportId || dbFlight.destination || 'BOM',
    arrivalCity: dbFlight.arrivalCity || 'Arrival City',
    departureTime: dbFlight.departureTime || '08:00 AM',
    arrivalTime: dbFlight.arrivalTime || '10:00 AM',
    date: dbFlight.date || '',
    duration: dbFlight.duration || '2h 00m',
    stops: typeof dbFlight.stops === 'number' ? dbFlight.stops : 0,
    layovers: dbFlight.layovers || [],
    price: dbFlight.price || 0,
    seatAvailability: dbFlight.availableSeats ? dbFlight.availableSeats.split(',').length : 12,
    routeScore: dbFlight.routeScore || 9.5,
    co2Savings: dbFlight.co2Savings || '18% CO2 emission savings',
    aircraft: dbFlight.aircraft?.name || dbFlight.aircraft?.model || (typeof dbFlight.aircraft === 'string' ? dbFlight.aircraft : 'Boeing 737'),
    availableSeats: dbFlight.availableSeats,
    providerSource: dbFlight.providerSource || 'demo',
    searchId: dbFlight.searchId,
    offerId: dbFlight.offerId,
    expiresAt: dbFlight.expiresAt,
  };
}

export function mapDbBookingToFrontend(dbBooking: any): Booking {
  return {
    id: dbBooking.id,
    passengerName: dbBooking.passengerName,
    passengerEmail: dbBooking.passengerEmail,
    passportNumber: dbBooking.passportNumber || '',
    seatNumber: dbBooking.seatId,
    bookingDate: dbBooking.createdAt ? dbBooking.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    status: dbBooking.status.toLowerCase() === 'confirmed' ? 'confirmed' : 'cancelled',
    totalPrice: dbBooking.totalPrice,
    flight: mapDbFlightToFrontend(dbBooking.flight),
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() => {
    const saved = localStorage.getItem('aviato_user');
    return saved ? 'travel_hub' : 'landing';
  });
  
  // Authentication & Persistent User Session
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('aviato_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Verify active JWT token on initial application load
  useEffect(() => {
    const token = localStorage.getItem('aviato_token');
    if (!token) return;

    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('aviato_user', JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          // Token expired or invalid, gracefully reset session
          localStorage.removeItem('aviato_token');
          localStorage.removeItem('aviato_user');
          setCurrentUser(null);
        }
      })
      .catch((err) => {
        console.warn('Could not verify active session token:', err);
      });
  }, []);

  // Intercept States for Booking and Navigation Flow
  const [bookingTargetFlight, setBookingTargetFlight] = useState<Flight | null>(null);
  const [pendingViewTarget, setPendingViewTarget] = useState<string | null>(null);

  // Authenticated Popups Modals Toggles
  const [showingBookingSummaryModal, setShowingBookingSummaryModal] = useState(false);
  const [showingLoginRequiredModal, setShowingLoginRequiredModal] = useState(false);
  const [showingAuthModal, setShowingAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'login' | 'signup'>('login');

  // Storage for flights (seeded with featured ones)
  const [flights, setFlights] = useState<Flight[]>([
    ...FEATURED_FLIGHTS,
    // Add additional standard routes to populate default searches
    ...generateFlightsForRoute('New York', 'London', '2026-06-25', 'economy'),
    ...generateFlightsForRoute('Paris', 'Tokyo', '2026-06-26', 'economy'),
    ...generateFlightsForRoute('Dubai', 'Singapore', '2026-06-28', 'economy'),
  ]);

  // Real user bookings and state management
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Search, Selection, and Seat States
  const [activeQuery, setActiveQuery] = useState<SearchQuery>({
    fromCity: 'New York',
    toCity: 'London',
    date: '2026-06-25',
    passengers: 1,
    cabinClass: 'economy',
  });
  
  const [searchResultFlights, setSearchResultFlights] = useState<Flight[]>([]);
  const [searchFeedbackError, setSearchFeedbackError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  // Checkout modal form states
  const [passengerName, setPassengerName] = useState('Alexander Vance');
  const [passengerEmail, setPassengerEmail] = useState('alex.vance@sovereign-holdings.com');
  const [passportNumber, setPassportNumber] = useState('US7748921C');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(null);
  const [showingCheckoutModal, setShowingCheckoutModal] = useState(false);

  // Promo Code states (for first-time users & first-time bookings)
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper to determine if a user/email is making their first-time booking
  const isUserFirstTimeBooking = (emailToCheck: string): boolean => {
    const normalized = (emailToCheck || '').trim().toLowerCase();
    if (!normalized) return true;

    // Check existing confirmed/pending bookings in memory
    const hasExistingBooking = bookings.some(b => {
      const bEmail = (b.passengerEmail || '').trim().toLowerCase();
      const isEmailMatch = bEmail === normalized;
      const isUserMatch = currentUser?.id && (b as any).userId === currentUser.id;
      return isEmailMatch || isUserMatch;
    });
    if (hasExistingBooking) return false;

    // Check localStorage flags indicating prior completed bookings
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem(`aviato_has_booked_${normalized}`) === 'true') {
          return false;
        }
        if (currentUser?.id && localStorage.getItem(`aviato_has_booked_${currentUser.id}`) === 'true') {
          return false;
        }
      } catch (e) {
        // Safe fallback if localStorage is restricted
      }
    }

    return true;
  };

  // Promo application handler
  const handleApplyPromo = () => {
    const trimmedCode = promoCode.trim().toUpperCase();
    if (!trimmedCode) {
      setPromoFeedback({ type: 'error', message: 'Please enter a promo code to apply.' });
      return;
    }

    if (!isUserFirstTimeBooking(passengerEmail)) {
      setAppliedPromo(null);
      setPromoFeedback({
        type: 'error',
        message: 'This promo code is only valid for first-time users and first-time bookings.'
      });
      return;
    }

    const eligiblePromoCodes = ['FIRST10', 'WELCOME10', 'AVIATO10', 'NEWFLYER', 'FIRST', 'NEW10', 'SAVE10'];
    const isEligibleCode = eligiblePromoCodes.includes(trimmedCode) || trimmedCode.includes('FIRST') || trimmedCode.includes('10');

    if (isEligibleCode) {
      setAppliedPromo(trimmedCode);
      setPromoFeedback({
        type: 'success',
        message: `Promo '${trimmedCode}' applied! 10% discount added to your first booking.`
      });
    } else {
      setAppliedPromo(null);
      setPromoFeedback({
        type: 'error',
        message: "Invalid promo code. Use code 'FIRST10' for 10% off your first flight."
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoFeedback(null);
  };

  // Razorpay & Mock Payment Integration States
  const [checkoutStep, setCheckoutStep] = useState<'passenger' | 'payment' | 'processing'>('passenger');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('382');
  const [cardName, setCardName] = useState('Alexander Vance');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Auto pre-fill passenger parameters when user state updates
  useEffect(() => {
    if (currentUser) {
      setPassengerName(currentUser.name);
      setPassengerEmail(currentUser.email);
      setPassportNumber(currentUser.passportNumber || 'US7748921C');
    }
  }, [currentUser]);

  // Active confirmation booking record
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null);
  const [emailConfirmationStatus, setEmailConfirmationStatus] = useState<{ sent: boolean; message?: string | null } | null>(null);

  // Computed pricing details for checkout modal
  const selectedSeatObj = seats.find(s => s.id === selectedSeatId);
  const checkoutSeatAddon = selectedSeatObj ? selectedSeatObj.priceModifier : 0;
  const checkoutBasePrice = selectedFlight ? selectedFlight.price + checkoutSeatAddon : 0;
  const isPassengerFirstTimeUser = isUserFirstTimeBooking(passengerEmail);
  const checkoutPromoDiscount = (appliedPromo && isPassengerFirstTimeUser) ? Math.round(checkoutBasePrice * 0.10) : 0;
  const checkoutFinalPrice = Math.max(0, checkoutBasePrice - checkoutPromoDiscount);

  // Live fetch and sync of user bookings
  const fetchUserBookings = useCallback(async () => {
    const token = localStorage.getItem('aviato_token');
    if (!token && !currentUser) {
      setBookings([]);
      setIsBookingsLoading(false);
      setBookingsError(null);
      return;
    }
    setIsBookingsLoading(true);
    setBookingsError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/bookings', { headers });
      if (!res.ok) {
        throw new Error("We couldn't load your bookings right now. Please try again.");
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookings(data.map(mapDbBookingToFrontend));
        }
      }
    } catch (err: any) {
      console.warn("Could not sync remote bookings:", err);
      setBookingsError(err?.message || "We couldn't load your bookings right now. Please try again.");
    } finally {
      setIsBookingsLoading(false);
    }
  }, [currentUser]);

  // Live Sync Effect
  useEffect(() => {
    if (currentUser) {
      fetchUserBookings();
    } else {
      setBookings([]);
      setIsBookingsLoading(false);
      setBookingsError(null);
    }

    fetch('/api/flights')
      .then(async res => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFlights(data.map(mapDbFlightToFrontend));
        }
      })
      .catch(err => console.warn("Could not sync remote segments:", err));
  }, [currentUser, fetchUserBookings]);

  // Trigger search pipeline on Dijkstra API
  const handleSearchFlights = async (query: SearchQuery) => {
    // Prevent accidental duplicate requests from rapid repeated clicks
    if (isSearching) return;
    setIsSearching(true);
    setActiveQuery(query);
    setSearchFeedbackError(null);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      if (response.ok) {
        const matches = await response.json();
        const mappedMatches = Array.isArray(matches) ? matches.map(mapDbFlightToFrontend) : [];
        setSearchResultFlights(mappedMatches);
        setFlights(prev => {
          const updated = [...prev];
          mappedMatches.forEach((m: Flight) => {
            if (!updated.some(uf => uf.id === m.id)) {
              updated.push(m);
            }
          });
          return updated;
        });
      } else {
        const errorData = await response.json().catch(() => null);
        setSearchFeedbackError(errorData?.error || 'Flight provider returned an error while searching for flights. Please try again.');
        setSearchResultFlights([]);
      }
    } catch (err) {
      console.error("Flight search API call failed:", err);
      setSearchFeedbackError('Network error: Unable to connect to flight search service.');
      setSearchResultFlights([]);
    } finally {
      setIsSearching(false);
    }
    setCurrentView('search_results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigating into details
  const handleViewFlightDetails = (flight: Flight) => {
    if ((flight as any).expiresAt && Date.now() > (flight as any).expiresAt) {
      alert('This flight offer has expired. Please search again for current fares.');
      return;
    }
    setSelectedFlight(flight);
    setCurrentView('flight_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Entering Seat Selection
  const getInitialSeatsForFlight = (flight: Flight) => {
    const allSeats = generateSeats();
    if (flight.availableSeats) {
      const rawList = flight.availableSeats.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      
      // Check if it's the legacy 10-seat placeholder
      const isLegacyPlaceholder = rawList.length <= 10 && rawList.every(s => 
        ['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','1A','2A','1B','2B','1C','2C','1D','2D','1E','2E'].includes(s)
      );

      if (!isLegacyPlaceholder && rawList.length > 0) {
        const canonical = (id: string) => {
          const matchRowFirst = id.match(/^(\d+)([A-Za-z])$/);
          if (matchRowFirst) return `${matchRowFirst[1]}${matchRowFirst[2].toUpperCase()}`;
          const matchLetterFirst = id.match(/^([A-Za-z])(\d+)$/);
          if (matchLetterFirst) return `${matchLetterFirst[2]}${matchLetterFirst[1].toUpperCase()}`;
          return id.toUpperCase();
        };

        const availableSet = new Set(rawList.map(canonical));

        allSeats.forEach(seat => {
          const seatCanonical = canonical(seat.id);
          seat.status = availableSet.has(seatCanonical) ? 'available' : 'booked';
        });
      }
    }
    return allSeats;
  };

  const handleProceedToSeat = (flight: Flight) => {
    if ((flight as any).expiresAt && Date.now() > (flight as any).expiresAt) {
      alert('This flight offer has expired. Please search again for current fares.');
      return;
    }
    setSelectedFlight(flight);
    setSeats(getInitialSeatsForFlight(flight));
    setSelectedSeatId(null);
    setBookingErrorMessage(null);

    if (!currentUser) {
      setBookingTargetFlight(flight);
      setShowingBookingSummaryModal(true);
      return;
    }

    // Pre-fill passenger parameters from profile if default
    if (currentUser.name && (!passengerName || passengerName === 'Alexander Vance')) {
      setPassengerName(currentUser.name);
    }
    if (currentUser.email && (!passengerEmail || passengerEmail === 'alex.vance@sovereign-holdings.com')) {
      setPassengerEmail(currentUser.email);
    }
    if (currentUser.passportNumber && (!passportNumber || passportNumber === 'US7748921C')) {
      setPassportNumber(currentUser.passportNumber);
    }

    setCurrentView('booking_passenger');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSeat = (seatId: string) => {
    setSelectedSeatId(prev => (prev === seatId ? null : seatId));
  };

  // Step 4 Review & Final Booking Action
  const handleExecuteBooking = async () => {
    if (isVerifyingPayment) return;
    if (!selectedFlight || !selectedSeatId) {
      setBookingErrorMessage('Please select an available seat on the cabin map to proceed.');
      return;
    }

    const chosenSeat = seats.find(s => s.id === selectedSeatId);
    if (!chosenSeat) {
      setBookingErrorMessage('Selected seat could not be identified. Please select a valid seat.');
      return;
    }

    const finalAddon = chosenSeat.priceModifier || 0;
    const basePrice = selectedFlight.price + finalAddon;
    const isFirstTime = isUserFirstTimeBooking(passengerEmail);
    const discountAmount = (appliedPromo && isFirstTime) ? Math.round(basePrice * 0.10) : 0;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    try {
      setIsVerifyingPayment(true);
      setBookingErrorMessage(null);
      setProcessingMessage('Connecting to Aviato Booking Gateway...');

      const token = localStorage.getItem('aviato_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          passengerName,
          passengerEmail,
          passportNumber,
          flightId: selectedFlight.id,
          seatId: selectedSeatId,
          seatClass: chosenSeat.class.toUpperCase(),
          totalPrice: finalPrice,
          phone: passengerPhone || undefined,
        })
      });

      if (response.ok) {
        const payload = await response.json();

        if (payload.useRazorpay) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            setBookingErrorMessage('Failed to load payment gateway SDK. Please check your internet connection and try again.');
            setIsVerifyingPayment(false);
            return;
          }

          const options = {
            key: payload.razorpayKeyId,
            amount: payload.razorpayAmount,
            currency: payload.razorpayCurrency || 'INR',
            name: 'Aviato Luxury Airlines',
            description: `Flight Reservation - Seat ${payload.booking.seatId}`,
            order_id: payload.razorpayOrderId,
            handler: async function (rzpResponse: any) {
              setProcessingMessage('Verifying payment signature with secure servers...');
              try {
                const verifyRes = await fetch('/api/book/verify', {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify({
                    bookingId: payload.booking.id,
                    razorpayOrderId: rzpResponse.razorpay_order_id,
                    razorpayPaymentId: rzpResponse.razorpay_payment_id,
                    razorpaySignature: rzpResponse.razorpay_signature,
                  }),
                });

                if (verifyRes.ok) {
                  const verifyPayload = await verifyRes.json();
                  const newBooking = mapDbBookingToFrontend(verifyPayload.booking);
                  setEmailConfirmationStatus({
                    sent: !!verifyPayload.emailSent,
                    message: verifyPayload.emailMessage || null
                  });
                  setBookings(prev => {
                    const exists = prev.some(b => b.id === newBooking.id);
                    return exists ? prev : [newBooking, ...prev];
                  });
                  setRecentBooking(newBooking);
                  setSeats(prev => prev.map(s => s.id === selectedSeatId ? { ...s, status: 'booked' } : s));
                  try {
                    localStorage.setItem(`aviato_has_booked_${passengerEmail.trim().toLowerCase()}`, 'true');
                    if (currentUser?.id) {
                      localStorage.setItem(`aviato_has_booked_${currentUser.id}`, 'true');
                    }
                  } catch (e) {}
                  setAppliedPromo(null);
                  setPromoCode('');
                  setPromoFeedback(null);
                  setCurrentView('confirmation');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  const verifyErr = await verifyRes.json().catch(() => ({}));
                  setBookingErrorMessage(`Payment verification failed: ${verifyErr.error || 'Payment signature could not be validated.'}`);
                }
              } catch (verifyErr) {
                console.error('Payment signature verification failed:', verifyErr);
                setBookingErrorMessage("We couldn't complete your booking. Please check your connection and try again.");
              } finally {
                setIsVerifyingPayment(false);
              }
            },
            prefill: {
              name: passengerName,
              email: passengerEmail,
            },
            theme: {
              color: '#0B3D91',
            },
            modal: {
              ondismiss: function () {
                setIsVerifyingPayment(false);
                setBookingErrorMessage('Payment window closed. Your reservation remains pending.');
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          setProcessingMessage('Creating immutable flight ledger booking blocks...');
          await new Promise(resolve => setTimeout(resolve, 500));

          const newBooking = mapDbBookingToFrontend(payload.booking);
          setEmailConfirmationStatus({
            sent: !!payload.emailSent,
            message: payload.emailMessage || null
          });
          setBookings(prev => {
            const exists = prev.some(b => b.id === newBooking.id);
            return exists ? prev : [newBooking, ...prev];
          });
          setRecentBooking(newBooking);
          setSeats(prev => prev.map(s => s.id === selectedSeatId ? { ...s, status: 'booked' } : s));
          try {
            localStorage.setItem(`aviato_has_booked_${passengerEmail.trim().toLowerCase()}`, 'true');
            if (currentUser?.id) {
              localStorage.setItem(`aviato_has_booked_${currentUser.id}`, 'true');
            }
          } catch (e) {}
          setAppliedPromo(null);
          setPromoCode('');
          setPromoFeedback(null);
          setIsVerifyingPayment(false);
          setCurrentView('confirmation');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        const errPayload = await response.json().catch(() => ({}));
        const rawMessage = (errPayload.error || errPayload.detail || '').toString();
        const lowerMessage = rawMessage.toLowerCase();
        setIsVerifyingPayment(false);

        if (lowerMessage.includes('booked') || lowerMessage.includes('occupied') || lowerMessage.includes('no longer available') || lowerMessage.includes('held')) {
          setBookingErrorMessage('That seat was just booked by another passenger. Please select another seat.');
          setSelectedSeatId(null);
          setCurrentView('seat_selection');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setBookingErrorMessage(errPayload.error || errPayload.detail || "We couldn't complete your booking. Please check your connection and try again.");
        }
      }
    } catch (err) {
      console.error("Purchase processing failed:", err);
      setIsVerifyingPayment(false);
      setBookingErrorMessage("We couldn't complete your booking. Please check your connection and try again.");
    }
  };

  // Passenger form submit, creates the Booking on backend
  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlight || !selectedSeatId) return;

    const chosenSeat = seats.find(s => s.id === selectedSeatId);
    if (!chosenSeat) return;

    const finalAddon = chosenSeat.priceModifier;
    const basePrice = selectedFlight.price + finalAddon;
    const isFirstTime = isUserFirstTimeBooking(passengerEmail);
    const discountAmount = (appliedPromo && isFirstTime) ? Math.round(basePrice * 0.10) : 0;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    try {
      setIsVerifyingPayment(true);
      const token = localStorage.getItem('aviato_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          passengerName,
          passengerEmail,
          passportNumber,
          flightId: selectedFlight.id,
          seatId: selectedSeatId,
          seatClass: chosenSeat.class.toUpperCase(),
          totalPrice: finalPrice
        })
      });
      
      if (response.ok) {
        const payload = await response.json();
        
        if (payload.useRazorpay) {
          // 1. Dynamic Razorpay Test Mode flow
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            alert('Failed to load Razorpay SDK. Please check your internet connection and try again.');
            setIsVerifyingPayment(false);
            return;
          }

          const options = {
            key: payload.razorpayKeyId,
            amount: payload.razorpayAmount,
            currency: payload.razorpayCurrency || 'INR',
            name: 'Aviato Fliers',
            description: `Luxury Flight Ticket - Seat ${payload.booking.seatId}`,
            order_id: payload.razorpayOrderId,
            handler: async function (rzpResponse: any) {
              setCheckoutStep('processing');
              setProcessingMessage('Verifying payment signature with secure servers...');
              try {
                const verifyRes = await fetch('/api/book/verify', {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify({
                    bookingId: payload.booking.id,
                    razorpayOrderId: rzpResponse.razorpay_order_id,
                    razorpayPaymentId: rzpResponse.razorpay_payment_id,
                    razorpaySignature: rzpResponse.razorpay_signature,
                  }),
                });

                if (verifyRes.ok) {
                  const verifyPayload = await verifyRes.json();
                  const newBooking = mapDbBookingToFrontend(verifyPayload.booking);
                  setEmailConfirmationStatus({
                    sent: !!verifyPayload.emailSent,
                    message: verifyPayload.emailMessage || null
                  });
                  setBookings(prev => [newBooking, ...prev]);
                  setRecentBooking(newBooking);
                  setSeats(prev => prev.map(s => s.id === selectedSeatId ? { ...s, status: 'booked' } : s));
                  try {
                    localStorage.setItem(`aviato_has_booked_${passengerEmail.trim().toLowerCase()}`, 'true');
                    if (currentUser?.id) {
                      localStorage.setItem(`aviato_has_booked_${currentUser.id}`, 'true');
                    }
                  } catch (e) {}
                  setAppliedPromo(null);
                  setPromoCode('');
                  setPromoFeedback(null);
                  setShowingCheckoutModal(false);
                  setCheckoutStep('passenger');
                  setCurrentView('confirmation');
                } else {
                  const verifyErr = await verifyRes.json();
                  alert(`Verification Failed: ${verifyErr.error || 'Payment could not be validated.'}`);
                }
              } catch (verifyErr) {
                console.error('Payment signature verification request failed:', verifyErr);
                alert('Connection to verification gateway timed out. Please check bookings history.');
              } finally {
                setIsVerifyingPayment(false);
              }
            },
            prefill: {
              name: passengerName,
              email: passengerEmail,
            },
            theme: {
              color: '#0B3D91',
            },
            modal: {
              ondismiss: function () {
                setIsVerifyingPayment(false);
                alert('Razorpay Checkout closed. Reservation remains pending.');
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // 2. Complete Premium Mock Payment Flow
          setCheckoutStep('payment');
          setIsVerifyingPayment(false);
          // Keep payload.booking stored for finalizing step
          (window as any)._pendingBookingPayload = payload.booking;
          (window as any)._pendingEmailStatus = {
            sent: !!payload.emailSent,
            message: payload.emailMessage || null
          };
        }
      } else {
        const errPayload = await response.json().catch(() => ({}));
        const errorMessage = errPayload.error || errPayload.detail || 'Could not register ticket details.';
        alert(errorMessage);
        setIsVerifyingPayment(false);
        setShowingCheckoutModal(false);
        setCheckoutStep('passenger');
        if (errorMessage.includes('booked by another traveler') || errorMessage.includes('no longer available') || errorMessage.includes('occupied')) {
          setSelectedSeatId(null);
        }
        return;
      }
    } catch (err) {
      console.error("Purchase processing failed, using local in-memory fallback:", err);
      // Fallback in-memory ticket securement
      const bookingId = "AV-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      const newBooking: Booking = {
        id: bookingId,
        passengerName,
        passengerEmail,
        passportNumber,
        flight: selectedFlight,
        seatNumber: selectedSeatId,
        bookingDate: new Date().toISOString().split('T')[0],
        status: 'confirmed',
        totalPrice: finalPrice,
      };
      
      // Let's also run mock payment for fallback
      setCheckoutStep('payment');
      setIsVerifyingPayment(false);
      (window as any)._pendingBookingPayload = { ...newBooking, id: bookingId };
    }
  };

  const handleCompleteMockPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('processing');
    
    // Series of beautiful luxury processing steps
    const messages = [
      'Establishing secure SSL connection to Aviato Gateway...',
      'Routing through Aviato High-Speed Clearinghouse...',
      'Verifying credit limits and anti-fraud credentials...',
      'Creating immutable flight ledger booking blocks...',
      'Success! Ticket secured.'
    ];

    for (let i = 0; i < messages.length; i++) {
      setProcessingMessage(messages[i]);
      await new Promise(resolve => setTimeout(resolve, i === messages.length - 1 ? 500 : 750));
    }

    const pendingBooking = (window as any)._pendingBookingPayload;
    const pendingEmail = (window as any)._pendingEmailStatus;
    if (pendingEmail) {
      setEmailConfirmationStatus(pendingEmail);
    }
    if (pendingBooking) {
      const newBooking = mapDbBookingToFrontend(pendingBooking);
      setBookings(prev => {
        // Prevent duplicate local state items
        const exists = prev.some(b => b.id === newBooking.id);
        return exists ? prev : [newBooking, ...prev];
      });
      setRecentBooking(newBooking);
      setSeats(prev => prev.map(s => s.id === selectedSeatId ? { ...s, status: 'booked' } : s));
      try {
        localStorage.setItem(`aviato_has_booked_${passengerEmail.trim().toLowerCase()}`, 'true');
        if (currentUser?.id) {
          localStorage.setItem(`aviato_has_booked_${currentUser.id}`, 'true');
        }
      } catch (e) {}
      setAppliedPromo(null);
      setPromoCode('');
      setPromoFeedback(null);
    }

    setShowingCheckoutModal(false);
    setCheckoutStep('passenger');
    setCurrentView('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel reservation
  const handleCancelBooking = async (bookingId: string) => {
    const confirmation = window.confirm('Are you sure you want to cancel this booking? This action is refundable under Aviato Supreme policy rules.');
    if (!confirmation) return;

    try {
      const token = localStorage.getItem('aviato_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/booking/${bookingId}`, {
        method: 'DELETE',
        headers,
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
        fetchUserBookings();
        alert("Boarding pass successfully marked cancelled.");
      } else {
        console.warn("Deletion transmission request returned failure. Performing local offline update.");
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
      }
    } catch (err) {
      console.error("Cancellation broadcast to backend failed:", err);
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    }
  };

  const activeConfirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

  // Profile update persistence handler calling PUT /api/auth/me
  const handleUpdateProfile = async (updatedData: { name: string; email: string; passportNumber: string }) => {
    try {
      const token = localStorage.getItem('aviato_token');
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile coordinates' };
      }

      const { user: updatedUser, token: newToken } = data;
      setCurrentUser(updatedUser);
      localStorage.setItem('aviato_user', JSON.stringify(updatedUser));
      if (newToken) {
        localStorage.setItem('aviato_token', newToken);
      }
      setPassengerName(updatedUser.name);
      setPassengerEmail(updatedUser.email);
      if (updatedUser.passportNumber) {
        setPassportNumber(updatedUser.passportNumber);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating profile' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aviato_token');
    localStorage.removeItem('aviato_user');
    setCurrentUser(null);
    setBookings([]);
    if (['my_profile', 'my_profile_edit', 'my_bookings', 'travel_hub', 'admin_dashboard'].includes(currentView)) {
      setCurrentView('landing');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('aviato_user', JSON.stringify(user));
    localStorage.setItem('aviato_token', token);
    setShowingAuthModal(false);

    if (bookingTargetFlight) {
      setSelectedFlight(bookingTargetFlight);
      setSeats(getInitialSeatsForFlight(bookingTargetFlight));
      setSelectedSeatId(null);
      setBookingErrorMessage(null);
      if (user.name) setPassengerName(user.name);
      if (user.email) setPassengerEmail(user.email);
      if (user.passportNumber) setPassportNumber(user.passportNumber);
      setCurrentView('booking_passenger');
      setBookingTargetFlight(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (pendingViewTarget) {
      const target = pendingViewTarget;
      setPendingViewTarget(null);
      if (target === 'admin_dashboard' && user.role !== 'ADMIN') {
        setCurrentView('travel_hub');
      } else {
        setCurrentView(target);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentView('travel_hub');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewChange = (view: string) => {
    if (['my_bookings', 'my_profile', 'my_profile_edit', 'travel_hub'].includes(view) && !currentUser) {
      setPendingViewTarget(view);
      setCurrentView('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'admin_dashboard') {
      if (!currentUser) {
        setPendingViewTarget('admin_dashboard');
        setCurrentView('login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (currentUser.role !== 'ADMIN') {
        setCurrentView('travel_hub');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="aviato-app-root" className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 selection:bg-sky-500 selection:text-white">
      
      {/* Global Navigation header */}
      <Navbar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        bookingCount={activeConfirmedBookingsCount}
        currentUser={currentUser}
        onLoginClick={() => {
          setPendingViewTarget(null);
          setCurrentView('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSignUpClick={() => {
          setPendingViewTarget(null);
          setCurrentView('signup');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Page Switcher */}
        {currentView === 'landing' && (
          <LandingPage
            onSearch={handleSearchFlights}
            isLoading={isSearching}
            onBookFeatured={handleProceedToSeat}
            onViewFeaturedDetails={handleViewFlightDetails}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            targetViewName={pendingViewTarget}
            onSuccess={handleAuthSuccess}
            onNavigateHome={() => setCurrentView('landing')}
            onNavigateSignup={() => setCurrentView('signup')}
          />
        )}

        {currentView === 'signup' && (
          <SignupPage
            onSuccess={handleAuthSuccess}
            onNavigateHome={() => setCurrentView('landing')}
            onNavigateLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'travel_hub' && (
          currentUser ? (
            <TravelHubPage
              currentUser={currentUser}
              bookings={bookings}
              isLoading={isBookingsLoading}
              isSearchLoading={isSearching}
              errorMessage={bookingsError}
              onRefresh={fetchUserBookings}
              onSearch={handleSearchFlights}
              onViewBooking={(_bookingId) => {
                setCurrentView('my_bookings');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewAllBookings={() => {
                setCurrentView('my_bookings');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToProfile={(editMode) => {
                setCurrentView(editMode ? 'my_profile_edit' : 'my_profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCancelBooking={handleCancelBooking}
            />
          ) : (
            <LoginPage
              targetViewName="travel_hub"
              onSuccess={handleAuthSuccess}
              onNavigateHome={() => setCurrentView('landing')}
              onNavigateSignup={() => setCurrentView('signup')}
            />
          )
        )}

        {(currentView === 'my_profile' || currentView === 'my_profile_edit') && (
          currentUser ? (
            <MyProfilePage
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              bookingCount={activeConfirmedBookingsCount}
              onLogout={handleLogout}
              onViewBookings={() => handleViewChange('my_bookings')}
              initialEditMode={currentView === 'my_profile_edit'}
            />
          ) : (
            <LoginPage
              targetViewName="my_profile"
              onSuccess={handleAuthSuccess}
              onNavigateHome={() => setCurrentView('landing')}
              onNavigateSignup={() => setCurrentView('signup')}
            />
          )
        )}

        {currentView === 'search_results' && (
          <SearchResultsPage
            query={activeQuery}
            flights={searchResultFlights}
            errorMessage={searchFeedbackError}
            isLoading={isSearching}
            onBack={() => setCurrentView('landing')}
            onSearch={handleSearchFlights}
            onBookFlight={handleProceedToSeat}
            onViewDetails={handleViewFlightDetails}
          />
        )}

        {currentView === 'flight_details' && selectedFlight && (
          <FlightDetailsPage
            flight={selectedFlight}
            onBack={() => setCurrentView('search_results')}
            onProceedToSeatSelection={() => handleProceedToSeat(selectedFlight)}
          />
        )}

        {currentView === 'booking_passenger' && selectedFlight && (
          <div id="booking-passenger-view" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
            <BookingProgressBar
              currentStep="passenger"
              onStepClick={(step) => {
                if (step === 'search') {
                  setCurrentView(searchResultFlights.length > 0 ? 'search_results' : 'landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />

            <PassengerDetailsStep
              flight={selectedFlight}
              initialData={{
                name: passengerName,
                email: passengerEmail,
                passportNumber: passportNumber,
                phone: passengerPhone,
              }}
              passengersCount={activeQuery.passengers || 1}
              onProceed={(data) => {
                setPassengerName(data.name);
                setPassengerEmail(data.email);
                setPassportNumber(data.passportNumber);
                if (data.phone) setPassengerPhone(data.phone);
                setCurrentView('seat_selection');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBack={() => {
                setCurrentView(searchResultFlights.length > 0 ? 'search_results' : 'landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentView === 'seat_selection' && selectedFlight && (
          <div id="booking-seat-selection-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
            <BookingProgressBar
              currentStep="seat"
              onStepClick={(step) => {
                if (step === 'search') {
                  setCurrentView(searchResultFlights.length > 0 ? 'search_results' : 'landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                if (step === 'passenger') {
                  setCurrentView('booking_passenger');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />

            <BookingFlightSummary
              flight={selectedFlight}
              selectedSeatNumber={selectedSeatId}
              selectedSeatClass={seats.find(s => s.id === selectedSeatId)?.class}
              seatPriceModifier={seats.find(s => s.id === selectedSeatId)?.priceModifier || 0}
            />

            <SeatSelector
              flight={selectedFlight}
              seats={seats}
              selectedSeatId={selectedSeatId}
              onSelectSeat={handleSelectSeat}
              onConfirm={() => {
                setBookingErrorMessage(null);
                setCurrentView('booking_review');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBack={() => {
                setCurrentView('booking_passenger');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentView === 'booking_review' && selectedFlight && selectedSeatId && (
          <div id="booking-review-view" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
            <BookingProgressBar
              currentStep="review"
              onStepClick={(step) => {
                if (step === 'search') {
                  setCurrentView(searchResultFlights.length > 0 ? 'search_results' : 'landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                if (step === 'passenger') {
                  setCurrentView('booking_passenger');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                if (step === 'seat') {
                  setCurrentView('seat_selection');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />

            <BookingFlightSummary
              flight={selectedFlight}
              selectedSeatNumber={selectedSeatId}
              selectedSeatClass={seats.find(s => s.id === selectedSeatId)?.class}
              seatPriceModifier={seats.find(s => s.id === selectedSeatId)?.priceModifier || 0}
            />

            <BookingReviewStep
              flight={selectedFlight}
              passenger={{
                name: passengerName,
                email: passengerEmail,
                passportNumber: passportNumber,
                phone: passengerPhone,
              }}
              selectedSeat={seats.find(s => s.id === selectedSeatId) || {
                id: selectedSeatId,
                row: 1,
                letter: 'A',
                class: 'economy',
                status: 'selected',
                priceModifier: 0,
              }}
              appliedPromo={appliedPromo}
              promoCode={promoCode}
              promoFeedback={promoFeedback}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
              onPromoCodeChange={(code) => setPromoCode(code)}
              isFirstTimeUser={isUserFirstTimeBooking(passengerEmail)}
              onConfirmBooking={handleExecuteBooking}
              onBackToSeat={() => {
                setCurrentView('seat_selection');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isProcessing={isVerifyingPayment}
              processingMessage={processingMessage}
              errorMessage={bookingErrorMessage}
              onClearError={() => setBookingErrorMessage(null)}
            />
          </div>
        )}

        {currentView === 'confirmation' && recentBooking && (
          <div id="booking-confirmation-container" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
            <BookingProgressBar
              currentStep="confirmed"
            />

            <BookingConfirmationView
              booking={recentBooking}
              emailStatus={emailConfirmationStatus}
              onViewMyBookings={() => {
                setCurrentView('my_bookings');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToTravelHub={() => {
                setCurrentView('travel_hub');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToHome={() => {
                setCurrentView('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCancelBooking={handleCancelBooking}
            />
          </div>
        )}

        {currentView === 'my_bookings' && (
          <div id="my-bookings-view" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 select-none">
            <div className="text-left border-b border-slate-100 pb-5">
              <h2 className="font-display font-black text-slate-900 text-2xl sm:text-3xl tracking-tight">My Historical Bookings</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage, check boarding passes, or initiate refunds for your Aviato flights.
              </p>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center space-y-6 max-w-xl mx-auto">
                <div className="mx-auto h-12 w-12 bg-sky-50 text-sky-650 rounded-2xl flex items-center justify-center border border-sky-100">
                  <Compass className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-extrabold text-slate-850 text-base">Schedules Empty</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    You have no flight paths booked yet. Hop back over to the search engine to optimize coordinates.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="bg-navy-900 text-white font-semibold text-xs tracking-wider uppercase py-3 px-5 rounded-xl hover:bg-sky-500 hover:text-navy-950 transition-colors cursor-pointer"
                >
                  Search Fares
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'admin_dashboard' && (
          <AdminDashboardPage
            flights={flights}
            setFlights={setFlights}
            bookings={bookings}
            onCancelBooking={handleCancelBooking}
          />
        )}

      </main>

      {/* Global Footer component */}
        {/* Checkout Modal Overlay Popup */}
      {showingCheckoutModal && selectedFlight && (
        <div id="checkout-modal" className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative animate-scaleUp">
            
            {checkoutStep === 'passenger' && (
              <>
                <div className="text-left space-y-2 mb-6">
                  <span className="text-[9px] font-black tracking-widest text-sky-620 uppercase">STEP 01 — PASSENGER DETAILS</span>
                  <h3 className="font-display font-extrabold text-slate-900 text-lg">Finalize Traveler Registration</h3>
                  <p className="text-xs text-slate-450 leading-relaxed font-light">
                    Secure your boarding codes with exact credentials. Under aviation safety standards, name parameters must match passports perfectly.
                  </p>
                </div>

                <form onSubmit={handleConfirmPurchase} className="space-y-4">
                  
                  {/* Full name input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1"> traveler official name</label>
                    <div className="flex items-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                      <User className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="e.g. Johnathan Doe"
                        className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Email address input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1"> email coordinate</label>
                    <div className="flex items-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                      <Mail className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="email"
                        required
                        value={passengerEmail}
                        onChange={(e) => {
                          const newEmail = e.target.value;
                          setPassengerEmail(newEmail);
                          if (appliedPromo && !isUserFirstTimeBooking(newEmail)) {
                            setAppliedPromo(null);
                            setPromoFeedback({
                              type: 'error',
                              message: 'Promo code removed: this email is not eligible for first-time user discount.'
                            });
                          }
                        }}
                        placeholder="e.g. travel@domain.com"
                        className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Passport details input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Passport Number identification</label>
                    <div className="flex items-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                      <ShieldAlert className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        value={passportNumber}
                        onChange={(e) => setPassportNumber(e.target.value)}
                        placeholder="e.g. US7748921"
                        className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Optional Promo Code input field (Step 1) */}
                  <div className="space-y-1.5 text-left pt-1">
                    <div className="flex items-center justify-between ml-1">
                      <label htmlFor="promo-code-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Promo Code <span className="text-slate-400/80 font-normal lowercase tracking-normal">(optional)</span>
                      </label>
                      {!appliedPromo && isPassengerFirstTimeUser && (
                        <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                          First booking? Try <span className="font-bold">FIRST10</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1 flex items-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                        <Tag className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                        <input
                          id="promo-code-input"
                          type="text"
                          value={promoCode}
                          disabled={!!appliedPromo}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            if (promoFeedback) setPromoFeedback(null);
                          }}
                          placeholder="e.g. FIRST10"
                          className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 disabled:text-slate-500"
                        />
                        {appliedPromo && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-1" />
                        )}
                      </div>

                      {appliedPromo ? (
                        <button
                          type="button"
                          id="remove-promo-btn"
                          onClick={handleRemovePromo}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="apply-promo-btn"
                          onClick={handleApplyPromo}
                          className="px-4 py-2.5 bg-navy-900 hover:bg-sky-500 hover:text-navy-950 text-white rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {/* Promo feedback banner */}
                    {promoFeedback && (
                      <div
                        id="promo-feedback-msg"
                        className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          promoFeedback.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-800'
                            : 'bg-amber-50 border border-amber-200/80 text-amber-900'
                        }`}
                      >
                        {promoFeedback.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-snug">{promoFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown Summary */}
                  <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 space-y-1.5 text-left text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Base Fare ({selectedFlight.departureAirport} → {selectedFlight.arrivalAirport})</span>
                      <span className="font-semibold text-slate-700">{formatINR(selectedFlight.price)}</span>
                    </div>

                    {selectedSeatObj && selectedSeatObj.priceModifier > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Seat Add-on ({selectedSeatObj.id} • {selectedSeatObj.class})</span>
                        <span className="font-semibold text-slate-700">+{formatINR(selectedSeatObj.priceModifier)}</span>
                      </div>
                    )}

                    {appliedPromo && checkoutPromoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-dashed border-slate-200">
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3 text-emerald-600" />
                          First-Time 10% Discount ({appliedPromo})
                        </span>
                        <span>-{formatINR(checkoutPromoDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Price</span>
                      <div className="text-right flex items-baseline gap-2">
                        {appliedPromo && checkoutPromoDiscount > 0 && (
                          <span className="text-xs line-through text-slate-400 font-normal">
                            {formatINR(checkoutBasePrice)}
                          </span>
                        )}
                        <span className={`text-base font-bold font-mono ${appliedPromo && checkoutPromoDiscount > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {formatINR(checkoutFinalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal controls action row */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      id="checkout-cancel-btn"
                      onClick={() => setShowingCheckoutModal(false)}
                      className="w-1/2 bg-slate-100 hover:bg-slate-150 text-slate-650 font-semibold text-xs tracking-wide py-3 px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="checkout-proceed-btn"
                      disabled={isVerifyingPayment}
                      className="w-1/2 bg-sky-500 hover:bg-sky-450 text-navy-950 font-semibold text-xs tracking-wide py-3 px-4 rounded-xl cursor-pointer transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-1.5"
                    >
                      {isVerifyingPayment ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-navy-950" />
                          <span>Preparing...</span>
                        </>
                      ) : (
                        <span>Proceed to Payment</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {checkoutStep === 'payment' && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-left space-y-1">
                    <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase">STEP 02 — MOCK GATEWAY</span>
                    <h3 className="font-display font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-sky-500" />
                      <span>Secure Card Terminal</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase block">Total Payable</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{formatINR(checkoutFinalPrice)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-450 leading-relaxed font-light text-left mb-4">
                  Razorpay keys are not configured. Proceeding via our secure mock sandbox to instantly simulate real transactions and download PDF boarding passes.
                </p>

                {/* Platinum Interactive Card Display */}
                <div className="w-full bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-5 text-white shadow-lg space-y-4 mb-4 relative overflow-hidden select-none border border-white/10">
                  <div className="absolute -right-12 -bottom-12 h-36 w-36 bg-sky-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute -left-12 -top-12 h-36 w-36 bg-amber-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-start">
                    <span className="font-display font-black text-xs tracking-wider text-sky-400">AVIATO SPECIAL EDITION</span>
                    <span className="text-[8px] font-mono tracking-widest text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">MOCK</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[7px] font-mono tracking-widest text-slate-400 uppercase block">Card Number</span>
                    <span className="font-mono text-base tracking-widest text-white block truncate">{cardNumber || '•••• •••• •••• ••••'}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="min-w-0">
                      <span className="text-[7px] font-mono tracking-widest text-slate-400 uppercase block">Cardholder</span>
                      <span className="font-display text-[10px] font-extrabold tracking-wider text-slate-100 block truncate max-w-[170px]">{cardName.toUpperCase() || 'ALEXANDER VANCE'}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[7px] font-mono tracking-widest text-slate-400 uppercase block">Expires</span>
                      <span className="font-mono text-[10px] font-bold text-slate-100 block">{cardExpiry || '12/28'}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCompleteMockPayment} className="space-y-3.5">
                  {/* Cardholder Name */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Cardholder Name</label>
                    <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white transition-all">
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="ALEXANDER VANCE"
                        className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Credit Card Number</label>
                    <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white transition-all font-mono">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const parts = [];
                          for (let i = 0, len = val.length; i < len; i += 4) {
                            parts.push(val.substring(i, i + 4));
                          }
                          setCardNumber(parts.length > 0 ? parts.join(' ') : val);
                        }}
                        placeholder="4111 2222 3333 4444"
                        className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Expiration date */}
                    <div className="space-y-1 text-left">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Expiration</label>
                      <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white transition-all font-mono">
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length >= 2) {
                              val = val.substring(0, 2) + '/' + val.substring(2, 4);
                            }
                            setCardExpiry(val);
                          }}
                          placeholder="MM/YY"
                          className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                        />
                      </div>
                    </div>

                    {/* CVV */}
                    <div className="space-y-1 text-left">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 font-mono">CVV / CVC Code</label>
                      <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-sky-500 focus-within:bg-white transition-all font-mono">
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="382"
                          className="bg-transparent text-xs font-semibold text-slate-850 focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal controls action row */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('passenger')}
                      className="w-1/3 bg-slate-100 hover:bg-slate-150 text-slate-650 font-semibold text-xs py-3 rounded-xl cursor-pointer transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      id="mock-payment-submit-btn"
                      className="w-2/3 bg-primary hover:bg-secondary text-white font-semibold text-xs py-3 px-3 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Complete Payment • {formatINR(checkoutFinalPrice)}</span>
                    </button>
                  </div>
                </form>
              </>
            )}

            {checkoutStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                <div className="relative h-16 w-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-100"></div>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                
                <div className="space-y-2 max-w-xs">
                  <h4 className="font-display font-extrabold text-slate-850 text-base">Processing Transaction</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-light font-mono h-12 flex items-center justify-center">
                    {processingMessage}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <Footer />

      {/* STEP 1: Booking Summary Modal overlay */}
      {showingBookingSummaryModal && bookingTargetFlight && (
        <div id="booking-summary-modal" className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-150 shadow-2xl relative animate-scaleUp space-y-6">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black tracking-widest text-[#FFB703] uppercase">STEP 01 — FLIGHT PREVIEW</span>
              <h3 className="font-display font-extrabold text-slate-900 text-xl tracking-tight">Booking Summary</h3>
              <p className="text-xs text-slate-450 leading-relaxed font-light">
                Review your optimized route choices before proceeding to lock in seating arrangements.
              </p>
            </div>

            {/* Structured specifications layout */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flight route</span>
                <div className="text-right font-display font-extrabold text-slate-850 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>{bookingTargetFlight.departureCity}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>{bookingTargetFlight.arrivalCity}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departure Date</span>
                <span className="font-mono text-xs font-bold text-slate-705">{bookingTargetFlight.date}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Travelers</span>
                <span className="text-xs font-bold text-slate-705">{activeQuery.passengers} Passenger{activeQuery.passengers > 1 ? 's' : ''}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cabin type</span>
                <span className="text-xs font-bold text-slate-705 capitalize bg-slate-200/50 px-2.5 py-0.5 rounded-full text-[10px]">{activeQuery.cabinClass}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BASE TICKET RATE</span>
                <span className="font-mono text-base sm:text-lg font-bold text-navy-950">{formatINR(bookingTargetFlight.price)}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowingBookingSummaryModal(false);
                  setBookingTargetFlight(null);
                }}
                className="w-1/2 bg-slate-100 hover:bg-slate-150 text-slate-650 font-semibold text-xs tracking-wide py-3.5 rounded-2xl cursor-pointer transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowingBookingSummaryModal(false);
                  setShowingLoginRequiredModal(true);
                }}
                className="w-1/2 bg-primary hover:bg-secondary text-white font-semibold text-xs tracking-wide py-3.5 rounded-2xl cursor-pointer transition-all text-center shadow-lg shadow-primary/10"
              >
                Continue Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Login Required Intermediary Modal */}
      {showingLoginRequiredModal && (
        <div id="login-required-modal" className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-150 shadow-2xl relative animate-scaleUp text-center space-y-6">
            <div className="mx-auto h-12 w-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100/60 shadow-sm">
              <AlertTriangle className="h-6 w-6 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-slate-900 text-lg tracking-tight">Authentication Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                "Login or create an Aviato account to complete your booking and manage your trips."
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowingLoginRequiredModal(false);
                  setAuthModalType('login');
                  setShowingAuthModal(true);
                }}
                className="w-full py-3 bg-primary hover:bg-secondary text-white font-bold text-xs tracking-wide uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setShowingLoginRequiredModal(false);
                  setAuthModalType('signup');
                  setShowingAuthModal(true);
                }}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-705 border border-slate-205 font-semibold text-xs tracking-wide uppercase rounded-xl transition-all cursor-pointer"
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  setShowingLoginRequiredModal(false);
                  setBookingTargetFlight(null);
                  setPendingViewTarget(null);
                }}
                className="w-full py-2 bg-transparent text-slate-450 hover:text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC SIGN IN & REGISTER POPUP */}
      {showingAuthModal && (
        <div id="credentials-popup" className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-150 shadow-2xl relative animate-scaleUp text-left">
            <AuthForm
              initialMode={authModalType}
              isModal={true}
              onCancel={() => {
                setShowingAuthModal(false);
                setBookingTargetFlight(null);
                setPendingViewTarget(null);
              }}
              onSuccess={handleAuthSuccess}
            />
          </div>
        </div>
      )}

      {/* Real-time Enterprise Error-Reporting & Diagnostic Console */}
      <DiagnosticsConsole />

    </div>
  );
}
