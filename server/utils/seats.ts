// Seat normalization and inventory management utility for Aviato

/**
 * Normalizes any seat identifier representation into canonical aviation format:
 * <RowNumber><ColumnLetter> (e.g., '1D', '2A', '10F').
 * Handles reversed legacy formats like 'D1' -> '1D', case variations like '1d' -> '1D', etc.
 */
export function normalizeSeat(seat: string | null | undefined): string {
  if (!seat) return '';
  const trimmed = seat.trim().toUpperCase();
  
  // Standard format: Row number followed by column letter, e.g. "1D", "10F"
  const rowFirst = trimmed.match(/^(\d+)([A-Z])$/);
  if (rowFirst) {
    return `${rowFirst[1]}${rowFirst[2]}`;
  }
  
  // Reversed format: Column letter followed by row number, e.g. "D1", "F10"
  const letterFirst = trimmed.match(/^([A-Z])(\d+)$/);
  if (letterFirst) {
    return `${letterFirst[2]}${letterFirst[1]}`;
  }
  
  return trimmed;
}

/**
 * Generates the complete standard cabin seat map (10 rows x 6 columns A-F = 60 seats).
 */
export function getFullCabinSeats(): string[] {
  const seats: string[] = [];
  for (let row = 1; row <= 10; row++) {
    for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
      seats.push(`${row}${col}`);
    }
  }
  return seats;
}

/**
 * Checks whether an availableSeats string is the legacy 10-item placeholder
 * (e.g. 'A1,A2,B1,B2,C1,C2,D1,D2,E1,E2') or missing.
 */
export function isLegacySeatString(availableSeats?: string | null): boolean {
  if (!availableSeats) return true;
  const cleaned = availableSeats.trim().toUpperCase().replace(/\s+/g, '');
  return cleaned === 'A1,A2,B1,B2,C1,C2,D1,D2,E1,E2' || cleaned.length === 0;
}

/**
 * Parses availableSeats string into a clean list of normalized available seat IDs.
 * If the string is empty or is the legacy 10-seat placeholder, defaults to the full cabin seat inventory.
 */
export function parseAvailableSeats(availableSeats?: string | null): string[] {
  if (!availableSeats || isLegacySeatString(availableSeats)) {
    return getFullCabinSeats();
  }
  
  const rawList = availableSeats.split(',').map(s => s.trim()).filter(Boolean);
  const normalized = rawList.map(s => normalizeSeat(s)).filter(Boolean);
  
  // If the list had very few seats because of legacy seeding, ensure full cabin is respected
  if (normalized.length <= 10 && normalized.every(s => ['1A','2A','1B','2B','1C','2C','1D','2D','1E','2E'].includes(s))) {
    return getFullCabinSeats();
  }
  
  return Array.from(new Set(normalized));
}

/**
 * Validates whether a requested seat is available.
 * Considers both the flight's availableSeats list and any already booked seats.
 */
export function checkSeatAvailable(
  availableSeatsStr: string | null | undefined,
  requestedSeat: string,
  alreadyBookedSeats: string[] = []
): boolean {
  const target = normalizeSeat(requestedSeat);
  if (!target) return false;

  // 1. Check if seat is in the already booked active reservations
  const normalizedBooked = alreadyBookedSeats.map(s => normalizeSeat(s));
  if (normalizedBooked.includes(target)) {
    return false;
  }

  // 2. Check if seat exists in the available seats inventory
  const availableList = parseAvailableSeats(availableSeatsStr);
  return availableList.includes(target);
}

/**
 * Deducts the booked seat from the flight's availableSeats string,
 * returning the updated comma-separated string.
 */
export function deductSeatFromAvailability(
  availableSeatsStr: string | null | undefined,
  seatToDeduct: string
): string {
  const target = normalizeSeat(seatToDeduct);
  const currentList = parseAvailableSeats(availableSeatsStr);
  const remaining = currentList.filter(s => s !== target);
  return remaining.join(',');
}
