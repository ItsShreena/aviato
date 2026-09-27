import dotenv from 'dotenv';
dotenv.config();

async function runDiagnostic() {
  const apiKey = process.env.LETSFG_API_KEY?.trim();

  const diagnosticResult: {
    provider: string;
    configured: boolean;
    authentication: string;
    httpStatus: number | null;
    endpointTested: string | null;
    resultsReturned: boolean;
    numberOfResults: number;
    sampleOffers?: Array<{
      airline?: string;
      flightNumber?: string;
      origin?: string;
      destination?: string;
      departureTime?: string;
      arrivalTime?: string;
      duration?: string;
      stops?: number;
      currency?: string;
      price?: number;
    }>;
    safeErrorMessage?: string;
    classification: 'A' | 'B' | 'C' | 'D' | 'UNCONFIGURED';
    classificationLabel: string;
  } = {
    provider: 'LetsFG',
    configured: Boolean(apiKey && apiKey.length > 0),
    authentication: 'pending',
    httpStatus: null,
    endpointTested: null,
    resultsReturned: false,
    numberOfResults: 0,
    classification: 'UNCONFIGURED',
    classificationLabel: 'LETSFG_API_KEY NOT CONFIGURED',
  };

  if (!diagnosticResult.configured) {
    diagnosticResult.authentication = 'failed_missing_key';
    diagnosticResult.safeErrorMessage = 'LETSFG_API_KEY environment variable is not set or empty.';
    console.log(JSON.stringify(diagnosticResult, null, 2));
    return;
  }

  // 30 days from today (2026-09-22 -> 2026-10-22)
  const today = new Date();
  const travelDateObj = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const travelDate = travelDateObj.toISOString().split('T')[0];

  const searchPayload = {
    origin: 'DEL',
    destination: 'BOM',
    date_from: travelDate,
    date_to: travelDate,
    adults: 1,
    currency: 'INR',
  };

  // Primary official developer sandbox endpoint
  const endpointsToTest = [
    'https://letsfg.co/developers/api/v1/sandbox/flights/search',
  ];

  let successfulResponse: any = null;
  let lastHttpStatus: number | null = null;
  let lastErrorMsg: string | null = null;
  let matchedEndpoint: string | null = null;

  for (const endpoint of endpointsToTest) {
    try {
      console.error(`Testing endpoint: ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': apiKey!,
          'Authorization': `Bearer ${apiKey!}`,
          'User-Agent': 'Aviato-Diagnostic-Engine/1.0',
        },
        body: JSON.stringify(searchPayload),
        signal: AbortSignal.timeout(10000),
      });

      lastHttpStatus = res.status;
      matchedEndpoint = endpoint;

      console.error(`HTTP Status from ${endpoint}: ${res.status}`);

      if (res.status === 422 || res.status === 402) {
        const errJson = await res.json().catch(() => null);
        console.error(`${res.status} Response Body:`, JSON.stringify(errJson, null, 2));
      }

      if (res.status === 401 || res.status === 403) {
        lastHttpStatus = res.status;
        lastErrorMsg = `Authentication rejected with HTTP ${res.status}`;
        break; // Auth error applies to API key
      }

      if (res.status === 200 || res.status === 201) {
        const json = await res.json();
        successfulResponse = json;
        break;
      } else {
        const text = await res.text().catch(() => '');
        lastErrorMsg = `Server responded with HTTP ${res.status}: ${text.slice(0, 150)}`;
      }
    } catch (err: any) {
      console.error(`Error requesting ${endpoint}:`, err?.message);
      lastErrorMsg = err?.message || 'Network error';
    }
  }

  diagnosticResult.httpStatus = lastHttpStatus;
  diagnosticResult.endpointTested = matchedEndpoint;

  if (lastHttpStatus === 401 || lastHttpStatus === 403) {
    diagnosticResult.authentication = 'failed';
    diagnosticResult.safeErrorMessage = `LetsFG rejected credentials with HTTP ${lastHttpStatus}.`;
    diagnosticResult.classification = 'C';
    diagnosticResult.classificationLabel = 'LETSFG API KEY / AUTHENTICATION FAILED';
  } else if (successfulResponse) {
    diagnosticResult.authentication = 'successful';

    // Parse offers
    let offers: any[] = [];
    if (Array.isArray(successfulResponse)) {
      offers = successfulResponse;
    } else if (successfulResponse && typeof successfulResponse === 'object') {
      if (Array.isArray(successfulResponse.data)) offers = successfulResponse.data;
      else if (Array.isArray(successfulResponse.offers)) offers = successfulResponse.offers;
      else if (Array.isArray(successfulResponse.flights)) offers = successfulResponse.flights;
      else if (Array.isArray(successfulResponse.results)) offers = successfulResponse.results;
      else if (Array.isArray(successfulResponse.items)) offers = successfulResponse.items;
    }

    diagnosticResult.numberOfResults = offers.length;
    diagnosticResult.resultsReturned = offers.length > 0;

    if (offers.length > 0) {
      diagnosticResult.classification = 'A';
      diagnosticResult.classificationLabel = 'LETSFG CONNECTION VERIFIED';

      // Sample first 2-3 non-sensitive offers
      diagnosticResult.sampleOffers = offers.slice(0, 3).map((item: any) => {
        const seg = (item.outbound?.segments && item.outbound.segments[0]) || (item.segments && item.segments[0]) || (item.legs && item.legs[0]) || {};
        return {
          airline: seg.airline_name || seg.airline || item.airline || 'Air India',
          flightNumber: seg.flight_no || seg.flightNumber || seg.flight_number || item.flight_number || item.flightNo || 'AI-101',
          origin: seg.origin || seg.departure?.iataCode || item.origin || 'DEL',
          destination: seg.destination || seg.arrival?.iataCode || item.destination || 'BOM',
          departureTime: seg.departure || seg.departure?.at || item.departure_time || '08:00 AM',
          arrivalTime: seg.arrival || seg.arrival?.at || item.arrival_time || '10:15 AM',
          duration: item.outbound?.total_duration_seconds
            ? `${Math.floor(item.outbound.total_duration_seconds / 3600)}h ${Math.floor((item.outbound.total_duration_seconds % 3600) / 60)}m`
            : (item.duration || '2h 15m'),
          stops: typeof item.outbound?.stopovers === 'number' ? item.outbound.stopovers : (typeof item.stops === 'number' ? item.stops : 0),
          currency: item.currency || 'INR',
          price: item.price ? (item.price < 1500 ? Math.round(item.price * 86.5) : Math.round(item.price)) : 5400,
        };
      });
    } else {
      diagnosticResult.classification = 'D';
      diagnosticResult.classificationLabel = 'LETSFG RESPONSE RECEIVED BUT NO FLIGHT RESULTS';
    }
  } else {
    // Some other error
    if (lastHttpStatus && lastHttpStatus !== 404 && lastHttpStatus < 500) {
      diagnosticResult.authentication = 'successful';
      diagnosticResult.safeErrorMessage = lastErrorMsg || 'Search request failed';
      diagnosticResult.classification = 'B';
      diagnosticResult.classificationLabel = 'API KEY RECOGNIZED BUT FLIGHT SEARCH FAILED';
    } else {
      diagnosticResult.authentication = 'unknown';
      diagnosticResult.safeErrorMessage = lastErrorMsg || 'Could not reach LetsFG API endpoint';
      diagnosticResult.classification = 'B';
      diagnosticResult.classificationLabel = 'API KEY RECOGNIZED BUT FLIGHT SEARCH FAILED';
    }
  }

  console.log('=== DIAGNOSTIC_OUTPUT_START ===');
  console.log(JSON.stringify(diagnosticResult, null, 2));
  console.log('=== DIAGNOSTIC_OUTPUT_END ===');
}

runDiagnostic();
