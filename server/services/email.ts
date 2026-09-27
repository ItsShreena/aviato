import { formatINR } from '../utils/currency';

export interface BookingEmailData {
  bookingNo: string;
  passengerName: string;
  passengerEmail: string;
  passportNumber?: string;
  flightNo: string;
  airline: string;
  departureCity: string;
  departureAirportCode?: string;
  arrivalCity: string;
  arrivalAirportCode?: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string;
  seatId: string;
  seatClass?: string;
  totalPrice: number;
  status: string;
  duration?: string;
  stops?: number;
  aircraftName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend';
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<SendEmailResult> {
  const apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
  const rawFrom = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();
  const fromEmail = rawFrom.includes('<') ? rawFrom : `AVIATO Reservations <${rawFrom}>`;

  if (!apiKey) {
    console.log('ℹ️ [Email Service] EMAIL_API_KEY not configured in environment. Skipping outbound email transmission.');
    return {
      success: false,
      error: 'EMAIL_API_KEY_NOT_CONFIGURED',
      provider: 'resend',
    };
  }

  const toEmail = (data.passengerEmail || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!toEmail || !emailRegex.test(toEmail)) {
    console.log(`ℹ️ [Email Service] Skipping outbound email: Invalid recipient address format '${data.passengerEmail}'.`);
    return {
      success: false,
      error: 'Invalid recipient email address format',
      provider: 'resend',
    };
  }

  const depCode = data.departureAirportCode || data.departureCity.substring(0, 3).toUpperCase();
  const arrCode = data.arrivalAirportCode || data.arrivalCity.substring(0, 3).toUpperCase();
  const formattedPrice = formatINR(data.totalPrice);
  const seatDisplay = data.seatId.toUpperCase();
  const seatClassDisplay = data.seatClass || 'First Class';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AVIATO Booking Confirmation - ${data.bookingNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a; }
    .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0a192f 0%, #0f274c 100%); padding: 36px 32px; color: #ffffff; text-align: center; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 0.15em; margin: 0; color: #ffffff; text-transform: uppercase; }
    .brand-subtitle { font-size: 11px; letter-spacing: 0.25em; color: #38bdf8; text-transform: uppercase; margin-top: 6px; font-weight: 700; }
    .pnr-box { background-color: rgba(255, 255, 255, 0.1); border: 1px dashed rgba(255, 255, 255, 0.25); border-radius: 14px; padding: 14px 20px; margin-top: 22px; display: inline-block; }
    .pnr-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; font-weight: 700; margin: 0; }
    .pnr-number { font-size: 24px; font-weight: 800; color: #ffffff; font-family: monospace; letter-spacing: 0.1em; margin: 4px 0 0 0; }
    .content { padding: 32px; }
    .route-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 24px; }
    .route-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
    .city-block { flex: 1; }
    .city-code { font-size: 28px; font-weight: 900; color: #0a192f; margin: 0; font-family: monospace; }
    .city-name { font-size: 13px; color: #64748b; margin: 2px 0 0 0; font-weight: 600; }
    .route-arrow { text-align: center; padding: 0 16px; color: #0284c7; font-size: 22px; font-weight: bold; }
    .flight-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .meta-item { background: #ffffff; border: 1px solid #f1f5f9; padding: 12px 16px; border-radius: 12px; }
    .meta-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin: 0; }
    .meta-val { font-size: 13px; color: #0f172a; font-weight: 700; margin: 3px 0 0 0; }
    .passenger-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 24px; margin-bottom: 24px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #0a192f; font-weight: 800; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .badge-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; }
    .footer a { color: #0284c7; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">AVIATO</h1>
      <div class="brand-subtitle">Private Concierge & Flight Operations</div>
      <div class="pnr-box">
        <div class="pnr-label">Booking Reference / PNR</div>
        <div class="pnr-number">${data.bookingNo}</div>
      </div>
    </div>

    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge-confirmed">● Reservation Status: Confirmed</span>
      </div>

      <div class="route-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
          <tr>
            <td style="width: 40%; vertical-align: top;">
              <div class="city-code">${depCode}</div>
              <div class="city-name">${data.departureCity}</div>
            </td>
            <td style="width: 20%; text-align: center; vertical-align: middle;">
              <div style="color: #0284c7; font-size: 20px;">✈</div>
              <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">${data.duration || 'Direct'}</div>
            </td>
            <td style="width: 40%; text-align: right; vertical-align: top;">
              <div class="city-code">${arrCode}</div>
              <div class="city-name">${data.arrivalCity}</div>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px;">
          <tr>
            <td style="color: #64748b;">Flight:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.flightNo} (${data.airline})</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Aircraft:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.aircraftName || 'Gulfstream G650ER'}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Departure:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.departureDate} at ${data.departureTime}</td>
          </tr>
          ${data.arrivalTime ? `
          <tr>
            <td style="color: #64748b;">Estimated Arrival:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.arrivalTime}</td>
          </tr>` : ''}
          <tr>
            <td style="color: #64748b;">Cabin Class:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${seatClassDisplay}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Confirmed Seat:</td>
            <td style="font-weight: 800; color: #0284c7; text-align: right; font-size: 14px; font-family: monospace;">${seatDisplay}</td>
          </tr>
        </table>
      </div>

      <div class="passenger-card">
        <h3 class="section-title">Passenger Details</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px;">
          <tr>
            <td style="color: #64748b;">Passenger Name:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.passengerName}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Passenger Email:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.passengerEmail}</td>
          </tr>
          ${data.passportNumber ? `
          <tr>
            <td style="color: #64748b;">Passport / ID:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">${data.passportNumber}</td>
          </tr>` : ''}
          <tr>
            <td style="color: #64748b;">Total Passengers:</td>
            <td style="font-weight: 700; color: #0f172a; text-align: right;">1 Traveler</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Total Fare:</td>
            <td style="font-weight: 800; color: #0a192f; text-align: right; font-size: 14px;">${formattedPrice}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">This email serves as official confirmation of your reservation with <strong>AVIATO</strong>.</p>
      <p style="margin: 0;">You can view and manage your reservation anytime in <a href="#">My Bookings</a>.</p>
      <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 10px;">&copy; 2026 AVIATO Operations Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
AVIATO BOOKING CONFIRMATION
========================================
Booking / PNR Number: ${data.bookingNo}
Status: CONFIRMED

Passenger Details:
- Name: ${data.passengerName}
- Email: ${data.passengerEmail}
- Passport/ID: ${data.passportNumber || 'N/A'}

Flight Details:
- Flight: ${data.flightNo} (${data.airline})
- Route: ${data.departureCity} (${depCode}) -> ${data.arrivalCity} (${arrCode})
- Departure Date: ${data.departureDate}
- Departure Time: ${data.departureTime}
- Arrival Time: ${data.arrivalTime || 'Standard schedule'}
- Aircraft: ${data.aircraftName || 'Gulfstream G650ER'}
- Cabin Class: ${seatClassDisplay}
- Seat: ${seatDisplay}
- Number of Passengers: 1
- Total Fare: ${formattedPrice}

You can view complete reservation details and boarding passes anytime in your AVIATO My Bookings portal.
========================================
AVIATO Concierge & Flight Operations
  `.trim();

  try {
    console.log(`✉️ [Email Service] Dispatching booking confirmation email to ${toEmail} via Resend...`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `AVIATO Booking Confirmation - ${data.flightNo} (${depCode} → ${arrCode}) [PNR: ${data.bookingNo}]`,
        html: htmlContent,
        text: textContent,
      }),
    });

    const resData: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = resData?.message || resData?.error?.message || `HTTP ${res.status}`;
      console.log(`ℹ️ [Email Service] Outbound delivery notice: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
        provider: 'resend',
      };
    }

    console.log(`✅ [Email Service] Confirmation email dispatched successfully. ID: ${resData?.id}`);
    return {
      success: true,
      messageId: resData?.id,
      provider: 'resend',
    };
  } catch (err: any) {
    console.log(`ℹ️ [Email Service] Network delivery note: ${err?.message || err}`);
    return {
      success: false,
      error: err?.message || 'Email delivery failure',
      provider: 'resend',
    };
  }
}
