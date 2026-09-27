import { useState, useEffect, useRef, useCallback } from 'react';

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem('aviato_seat_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('aviato_seat_session_id', sid);
  }
  return sid;
}

// Normalizes seat representation for UI mapping (e.g., "1D" vs "D1")
export function normalizeSeatCode(seat: string): string {
  if (!seat) return '';
  const trimmed = seat.trim().toUpperCase();
  const matchNumFirst = trimmed.match(/^(\d+)([A-Z])$/);
  if (matchNumFirst) return `${matchNumFirst[1]}${matchNumFirst[2]}`;
  const matchLetterFirst = trimmed.match(/^([A-Z])(\d+)$/);
  if (matchLetterFirst) return `${matchLetterFirst[2]}${matchLetterFirst[1]}`;
  return trimmed;
}

export interface UseRealtimeSeatsOptions {
  flightId: string | null;
  selectedSeatId: string | null;
  onSeatTaken?: (seatId: string, message: string) => void;
}

export function useRealtimeSeats({
  flightId,
  selectedSeatId,
  onSeatTaken,
}: UseRealtimeSeatsOptions) {
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [lockedSeats, setLockedSeats] = useState<Map<string, { isSelf: boolean; expiresAt: number }>>(new Map());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);
  const selectedSeatRef = useRef<string | null>(selectedSeatId);
  selectedSeatRef.current = selectedSeatId;

  const sessionId = getSessionId();

  // Helper to fetch authoritative state from REST endpoint
  const fetchSeatState = useCallback(async () => {
    if (!flightId) return;
    try {
      const res = await fetch(`/api/flights/${flightId}/seats?sessionId=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.bookedSeats)) {
          const bookedSet = new Set<string>(data.bookedSeats.map((s: string) => normalizeSeatCode(s)));
          setBookedSeats(bookedSet);

          const locksMap = new Map<string, { isSelf: boolean; expiresAt: number }>();
          if (Array.isArray(data.lockedSeats)) {
            for (const item of data.lockedSeats) {
              const code = normalizeSeatCode(item.seatId);
              locksMap.set(code, {
                isSelf: item.isSelf,
                expiresAt: item.expiresAt,
              });
            }
          }
          setLockedSeats(locksMap);

          // Check if current user's selected seat was booked by someone else in the background
          if (selectedSeatRef.current) {
            const canonicalSelected = normalizeSeatCode(selectedSeatRef.current);
            if (bookedSet.has(canonicalSelected)) {
              onSeatTaken?.(selectedSeatRef.current, `Seat ${selectedSeatRef.current} was just booked by another passenger. Please select another seat.`);
            } else {
              const lockInfo = locksMap.get(canonicalSelected);
              if (lockInfo && !lockInfo.isSelf) {
                onSeatTaken?.(selectedSeatRef.current, `Seat ${selectedSeatRef.current} is currently held by another passenger. Please select another seat.`);
              }
            }
          }
        }
      }
    } catch (err) {
      // Degrade gracefully - no crash
    }
  }, [flightId, sessionId, onSeatTaken]);

  // Connect WebSocket
  useEffect(() => {
    if (!flightId) {
      setBookedSeats(new Set());
      setLockedSeats(new Map());
      setIsLiveConnected(false);
      return;
    }

    // Immediately fetch initial state via REST
    fetchSeatState();

    let isMounted = true;

    function connectWs() {
      if (!isMounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsLiveConnected(true);
          setLiveError(null);

          // Subscribe to flight seat updates
          ws.send(JSON.stringify({
            type: 'SUBSCRIBE_FLIGHT',
            flightId,
            sessionId,
          }));

          // Start keepalive ping
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'FLIGHT_SEATS_STATE' && data.flightId === flightId) {
              const bookedSet = new Set<string>((data.bookedSeats || []).map((s: string) => normalizeSeatCode(s)));
              setBookedSeats(bookedSet);

              const locksMap = new Map<string, { isSelf: boolean; expiresAt: number }>();
              if (Array.isArray(data.lockedSeats)) {
                for (const item of data.lockedSeats) {
                  locksMap.set(normalizeSeatCode(item.seatId), {
                    isSelf: item.isSelf,
                    expiresAt: item.expiresAt,
                  });
                }
              }
              setLockedSeats(locksMap);

              // Validate selected seat
              if (selectedSeatRef.current) {
                const canonicalSelected = normalizeSeatCode(selectedSeatRef.current);
                if (bookedSet.has(canonicalSelected)) {
                  onSeatTaken?.(selectedSeatRef.current, `Seat ${selectedSeatRef.current} was just booked by another passenger. Please select another seat.`);
                }
              }
            } else if (data.type === 'SEAT_UPDATED' && data.flightId === flightId) {
              const seatCode = normalizeSeatCode(data.seatId);

              if (data.status === 'booked') {
                setBookedSeats(prev => new Set(prev).add(seatCode));
                setLockedSeats(prev => {
                  const copy = new Map(prev);
                  copy.delete(seatCode);
                  return copy;
                });

                if (selectedSeatRef.current && normalizeSeatCode(selectedSeatRef.current) === seatCode) {
                  onSeatTaken?.(selectedSeatRef.current, `Seat ${selectedSeatRef.current} was just booked by another passenger. Please select another seat.`);
                }
              } else if (data.status === 'locked') {
                setLockedSeats(prev => {
                  const copy = new Map(prev);
                  copy.set(seatCode, {
                    isSelf: !!data.isSelf,
                    expiresAt: Date.now() + 5 * 60 * 1000,
                  });
                  return copy;
                });
                setBookedSeats(prev => {
                  const copy = new Set(prev);
                  copy.delete(seatCode);
                  return copy;
                });

                if (selectedSeatRef.current && normalizeSeatCode(selectedSeatRef.current) === seatCode && !data.isSelf) {
                  onSeatTaken?.(selectedSeatRef.current, 'This seat was just held by another traveler. Please select another seat.');
                }
              } else if (data.status === 'available') {
                setBookedSeats(prev => {
                  const copy = new Set(prev);
                  copy.delete(seatCode);
                  return copy;
                });
                setLockedSeats(prev => {
                  const copy = new Map(prev);
                  copy.delete(seatCode);
                  return copy;
                });
              }
            }
          } catch (parseErr) {
            console.warn('⚠️ [Realtime Hook] Could not parse WebSocket payload:', parseErr);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsLiveConnected(false);
          clearInterval(pingIntervalRef.current);

          // Attempt reconnection after 3 seconds
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connectWs();
          }, 3000);
        };

        ws.onerror = (e) => {
          setIsLiveConnected(false);
        };
      } catch (err: any) {
        setIsLiveConnected(false);
      }
    }

    connectWs();

    // Fallback sync polling every 3 seconds to guarantee freshness
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchSeatState();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pingIntervalRef.current);
      clearInterval(pollIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);

      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(JSON.stringify({
              type: 'UNSUBSCRIBE_FLIGHT',
              flightId,
            }));
          } catch (e) {}
        }
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [flightId, fetchSeatState]);

  // Method to lock a seat
  const lockSeat = useCallback(async (seatId: string): Promise<{ success: boolean; error?: string }> => {
    if (!flightId) return { success: false, error: 'No flight selected' };

    const canonical = normalizeSeatCode(seatId);

    // 1. Try via WebSocket first if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          type: 'LOCK_SEAT',
          flightId,
          seatId: canonical,
          sessionId,
        }));
      } catch (e) {}
    }

    // 2. Also execute REST lock to guarantee authoritative server response & race condition prevention
    try {
      const res = await fetch(`/api/flights/${flightId}/seats/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId: canonical, sessionId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'This seat was just booked by another traveler. Please select another seat.';
        setLiveError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setLockedSeats(prev => {
        const copy = new Map(prev);
        copy.set(canonical, { isSelf: true, expiresAt: data.expiresAt || (Date.now() + 300000) });
        return copy;
      });

      return { success: true };
    } catch (err: any) {
      // In case of offline/network glitch, allow local proceed
      return { success: true };
    }
  }, [flightId, sessionId]);

  // Method to unlock a seat
  const unlockSeat = useCallback(async (seatId: string) => {
    if (!flightId) return;
    const canonical = normalizeSeatCode(seatId);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          type: 'UNLOCK_SEAT',
          flightId,
          seatId: canonical,
          sessionId,
        }));
      } catch (e) {}
    }

    try {
      await fetch(`/api/flights/${flightId}/seats/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId: canonical, sessionId }),
      });
    } catch (e) {}

    setLockedSeats(prev => {
      const copy = new Map(prev);
      copy.delete(canonical);
      return copy;
    });
  }, [flightId, sessionId]);

  // Check the dynamic live status of any seat
  const getSeatStatus = useCallback((seatId: string): 'available' | 'booked' | 'locked' | 'selected' => {
    const canonical = normalizeSeatCode(seatId);

    if (bookedSeats.has(canonical)) {
      return 'booked';
    }

    const lock = lockedSeats.get(canonical);
    if (lock) {
      if (lock.isSelf) {
        return 'selected';
      }
      return 'locked';
    }

    if (selectedSeatRef.current && normalizeSeatCode(selectedSeatRef.current) === canonical) {
      return 'selected';
    }

    return 'available';
  }, [bookedSeats, lockedSeats]);

  return {
    bookedSeats,
    lockedSeats,
    isLiveConnected,
    liveError,
    lockSeat,
    unlockSeat,
    getSeatStatus,
    refreshSeats: fetchSeatState,
  };
}
