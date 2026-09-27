/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking } from '../types';
import { formatINR } from './currency';

/**
 * Downloads an official Aviato flight ticket/boarding pass file.
 * First tries the server PDF streaming endpoint.
 * If unavailable, generates a pristine standalone electronic ticket file with barcode,
 * flight telemetry, and print-ready stylesheet.
 */
export async function downloadTicketFile(booking: Booking): Promise<{ success: boolean; filename: string }> {
  const bookingCode = booking.bookingNo || booking.id.toUpperCase();
  const pdfFilename = `Aviato-BoardingPass-${bookingCode}.pdf`;

  // 1. Try server-side PDF generator
  try {
    const token = localStorage.getItem('aviato_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/bookings/${booking.id}/boarding-pass`, {
      headers,
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        if (blob.size > 0) {
          triggerBrowserDownload(blob, pdfFilename);
          return { success: true, filename: pdfFilename };
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Server PDF download endpoint unavailable, generating client electronic ticket document:', err);
  }

  // 2. Fallback: Generate authoritative standalone electronic ticket file (.html with auto-print & luxury styling)
  const htmlFilename = `Aviato-eTicket-${bookingCode}.html`;
  const ticketHtml = generateStandaloneTicketHtml(booking);
  const blob = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' });
  triggerBrowserDownload(blob, htmlFilename);

  return { success: true, filename: htmlFilename };
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
  }, 200);
}

function generateStandaloneTicketHtml(booking: Booking): string {
  const flight = booking.flight;
  const bookingCode = booking.bookingNo || booking.id.toUpperCase();
  const seatClassLabel = (booking.seatClass || 'economy').toUpperCase();
  const isSandbox = flight.providerSource === 'letsfg_sandbox';
  const providerLabel = isSandbox ? 'LETSFG SANDBOX • TEST ENVIRONMENT' : 'DEMO FALLBACK • TEST ENVIRONMENT';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviato Demo Boarding Pass - ${bookingCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    body { background: #0f172a; color: #1e293b; padding: 32px 16px; display: flex; justify-content: center; min-height: 100vh; }
    .wrapper { width: 100%; max-width: 860px; display: flex; flex-direction: column; align-items: center; }
    .top-controls { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; color: #94a3b8; font-size: 13px; font-weight: 600; }
    .print-btn { padding: 9px 20px; background: #0284c7; hover:bg-sky-500; color: white; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; transition: background 0.2s; box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
    .print-btn:hover { background: #0369a1; }
    
    /* Boarding Pass Shell with Perforation */
    .boarding-pass { width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: row; border: 1px solid #cbd5e1; position: relative; }
    
    /* Left / Main Section */
    .main-pass { flex: 1 1 68%; min-width: 0; display: flex; flex-direction: column; }
    
    /* Right / Passenger Stub */
    .stub-pass { flex: 0 0 32%; min-width: 250px; background: #fafafa; border-left: 2px dashed #cbd5e1; position: relative; display: flex; flex-direction: column; }
    
    /* Perforation Cutouts */
    .stub-pass::before { content: ''; position: absolute; top: -12px; left: -12px; width: 22px; height: 22px; background: #0f172a; border-radius: 50%; z-index: 5; }
    .stub-pass::after { content: ''; position: absolute; bottom: -12px; left: -12px; width: 22px; height: 22px; background: #0f172a; border-radius: 50%; z-index: 5; }
    
    /* Header Bar */
    .pass-header { background: #071329; color: #ffffff; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; }
    .brand-group { display: flex; align-items: center; gap: 10px; }
    .brand-name { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff; }
    .brand-sub { font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; }
    
    .demo-title-block { text-align: right; }
    .demo-title-badge { font-size: 13px; font-weight: 900; letter-spacing: 1.5px; color: #f59e0b; text-transform: uppercase; }
    .demo-sub-label { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    
    /* Environment Notice Strip */
    .env-strip { background: #fffbeb; border-bottom: 1px solid #fef3c7; padding: 10px 28px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* Main Content */
    .pass-content { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; flex: 1; }
    
    /* Passenger Row */
    .passenger-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .field-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .field-value { font-size: 15px; font-weight: 800; color: #0f172a; }
    
    /* Route Grid: FROM -> TO with Big Codes & Times */
    .route-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 16px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
    .airport-code { font-size: 34px; font-weight: 900; font-family: monospace; color: #071329; line-height: 1; }
    .city-name { font-size: 13px; font-weight: 600; color: #64748b; margin-top: 4px; }
    .flight-time-group { margin-top: 10px; }
    .flight-time-label { font-size: 9px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
    .flight-time-val { font-size: 17px; font-weight: 800; color: #0f172a; font-family: monospace; }
    
    .flight-path-middle { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .duration-val { font-size: 11px; font-weight: 700; color: #0284c7; font-family: monospace; }
    .flight-track { width: 100px; height: 2px; background: #e2e8f0; position: relative; margin: 8px 0; border-radius: 2px; }
    .flight-track-plane { position: absolute; top: -7px; left: calc(50% - 8px); font-size: 14px; color: #0284c7; }
    .stops-val { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    
    /* Details Grid: FLIGHT, DATE, SEAT, CLASS */
    .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: center; }
    .seat-badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 8px; font-family: monospace; font-weight: 900; font-size: 14px; display: inline-block; border: 1px solid #bae6fd; }
    
    /* PNR & Safety Footer */
    .pnr-box-container { display: flex; justify-content: space-between; align-items: center; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; margin-top: auto; }
    .pnr-block .pnr-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .pnr-block .pnr-code { font-size: 18px; font-weight: 900; font-family: monospace; color: #071329; letter-spacing: 1px; }
    .disclaimer-text { font-size: 9.5px; color: #94a3b8; line-height: 1.4; max-width: 320px; text-align: right; }
    
    /* Stub Content */
    .stub-header { background: #071329; color: #ffffff; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .stub-brand { font-size: 16px; font-weight: 900; letter-spacing: 1px; }
    .stub-type { font-size: 9px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; }
    
    .stub-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
    
    .barcode-area { margin-top: auto; padding-top: 14px; border-top: 1px dashed #e2e8f0; text-align: center; }
    .barcode-bars { height: 28px; display: flex; justify-content: center; gap: 2px; }
    .barcode-bar { background: #94a3b8; height: 100%; border-radius: 1px; }
    .barcode-label { font-size: 8px; color: #94a3b8; font-weight: 800; letter-spacing: 1.5px; margin-top: 6px; text-transform: uppercase; }

    @media print {
      body { background: white; padding: 0; }
      .boarding-pass { box-shadow: none; max-width: 100%; border: 1px solid #94a3b8; }
      .no-print { display: none !important; }
      .stub-pass::before, .stub-pass::after { display: none; }
    }

    @media (max-width: 768px) {
      .boarding-pass { flex-direction: column; }
      .stub-pass { border-left: none; border-top: 2px dashed #cbd5e1; }
      .stub-pass::before, .stub-pass::after { display: none; }
      .details-grid { grid-template-columns: repeat(2, 1fr); }
      .pnr-box-container { flex-direction: column; align-items: flex-start; }
      .disclaimer-text { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="no-print top-controls">
      <span>AVIATO • DEMO BOARDING PASS SIMULATOR</span>
      <button class="print-btn" onclick="window.print()">🖨️ Print Pass</button>
    </div>

    <div class="boarding-pass">
      <!-- MAIN PASS SECTION -->
      <div class="main-pass">
        <div class="pass-header">
          <div class="brand-group">
            <div>
              <div class="brand-name">AVIATO</div>
              <div class="brand-sub">FLY SMARTER</div>
            </div>
          </div>
          <div class="demo-title-block">
            <div class="demo-title-badge">DEMO BOARDING PASS</div>
            <div class="demo-sub-label">Aviato Demo Simulator • Not an airline ticket</div>
          </div>
        </div>

        <div class="env-strip">
          <span>${providerLabel}</span>
          <span>SIMULATION USE ONLY • NON-COMMERCIAL</span>
        </div>

        <div class="pass-content">
          <div class="passenger-row">
            <div>
              <div class="field-label">Passenger Name</div>
              <div class="field-value">${booking.passengerName.toUpperCase()}</div>
            </div>
            <div style="text-align: right;">
              <div class="field-label">Operating Carrier</div>
              <div class="field-value" style="font-size: 13px;">${flight.airline}</div>
            </div>
          </div>

          <div class="route-row">
            <div>
              <div class="field-label">From</div>
              <div class="airport-code">${flight.departureAirport}</div>
              <div class="city-name">${flight.departureCity}</div>
              <div class="flight-time-group">
                <div class="flight-time-label">Departure</div>
                <div class="flight-time-val">${flight.departureTime}</div>
              </div>
            </div>

            <div class="flight-path-middle">
              <div class="duration-val">${flight.duration}</div>
              <div class="flight-track">
                <span class="flight-track-plane">✈</span>
              </div>
              <div class="stops-val">${flight.stops === 0 ? 'Nonstop' : flight.stops + ' Stop'}</div>
            </div>

            <div style="text-align: right;">
              <div class="field-label">To</div>
              <div class="airport-code">${flight.arrivalAirport}</div>
              <div class="city-name">${flight.arrivalCity}</div>
              <div class="flight-time-group">
                <div class="flight-time-label">Arrival</div>
                <div class="flight-time-val">${flight.arrivalTime}</div>
              </div>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="field-label">Flight</div>
              <div class="field-value" style="font-family: monospace;">${flight.flightNumber}</div>
            </div>
            <div>
              <div class="field-label">Date</div>
              <div class="field-value" style="font-size: 14px;">${flight.date}</div>
            </div>
            <div>
              <div class="field-label">Seat</div>
              <div class="seat-badge">${booking.seatNumber}</div>
            </div>
            <div>
              <div class="field-label">Class</div>
              <div class="field-value" style="font-size: 14px;">${seatClassLabel}</div>
            </div>
          </div>

          <div class="pnr-box-container">
            <div class="pnr-block">
              <div class="pnr-label">PNR / Booking Reference (Demo)</div>
              <div class="pnr-code">${bookingCode}</div>
            </div>
            <div class="disclaimer-text">
              DEMO SIMULATION RESERVATION • FOR DEMONSTRATION &amp; TESTING PURPOSES ONLY • CANNOT BE USED FOR ACTUAL AIRPORT BOARDING OR COMMERCIAL GATE ACCESS.
            </div>
          </div>
        </div>
      </div>

      <!-- PASSENGER STUB SECTION -->
      <div class="stub-pass">
        <div class="stub-header">
          <div class="stub-brand">AVIATO</div>
          <div class="stub-type">PASSENGER STUB (DEMO)</div>
        </div>

        <div class="stub-content">
          <div>
            <div class="field-label">Passenger</div>
            <div class="field-value" style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${booking.passengerName.toUpperCase()}
            </div>
          </div>

          <div>
            <div class="field-label">Route</div>
            <div class="field-value" style="font-size: 16px; font-family: monospace;">
              ${flight.departureAirport} ➔ ${flight.arrivalAirport}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <div>
              <div class="field-label">Flight</div>
              <div class="field-value" style="font-size: 12px; font-family: monospace;">${flight.flightNumber}</div>
            </div>
            <div>
              <div class="field-label">Seat</div>
              <div class="seat-badge" style="padding: 2px 8px; font-size: 12px;">${booking.seatNumber}</div>
            </div>
          </div>

          <div>
            <div class="field-label">Departure</div>
            <div class="field-value" style="font-size: 12px; font-family: monospace;">${flight.departureTime} • ${flight.date}</div>
          </div>

          <div>
            <div class="field-label">PNR (Demo)</div>
            <div class="field-value" style="font-size: 13px; font-family: monospace;">${bookingCode}</div>
          </div>

          <div class="barcode-area">
            <div class="barcode-bars">
              <div class="barcode-bar" style="width: 2px;"></div>
              <div class="barcode-bar" style="width: 5px;"></div>
              <div class="barcode-bar" style="width: 2px;"></div>
              <div class="barcode-bar" style="width: 4px;"></div>
              <div class="barcode-bar" style="width: 1px;"></div>
              <div class="barcode-bar" style="width: 6px;"></div>
              <div class="barcode-bar" style="width: 3px;"></div>
              <div class="barcode-bar" style="width: 2px;"></div>
              <div class="barcode-bar" style="width: 5px;"></div>
              <div class="barcode-bar" style="width: 1px;"></div>
              <div class="barcode-bar" style="width: 4px;"></div>
              <div class="barcode-bar" style="width: 2px;"></div>
              <div class="barcode-bar" style="width: 6px;"></div>
              <div class="barcode-bar" style="width: 3px;"></div>
              <div class="barcode-bar" style="width: 2px;"></div>
              <div class="barcode-bar" style="width: 4px;"></div>
              <div class="barcode-bar" style="width: 1px;"></div>
              <div class="barcode-bar" style="width: 5px;"></div>
            </div>
            <div class="barcode-label">DEMO PASS • NON-SCANNABLE</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
