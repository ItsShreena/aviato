import { Request, Response, NextFunction } from 'express';
import { bookingStorage } from '../db';

export interface LoggedRequest extends Request {
  bookingTraceId?: string;
  bookingStartTime?: number;
}

/**
 * Express middleware to capture and log the complete request lifecycle,
 * headers, body, and timestamp for all booking-related endpoints (/api/book or /api/bookings).
 */
export function bookingLogger(req: LoggedRequest, res: Response, next: NextFunction) {
  // Generate a trace ID to link incoming request logs with subsequent database actions
  const traceId = `trace-bk-${Math.floor(100000 + Math.random() * 900000)}`;
  req.bookingTraceId = traceId;
  req.bookingStartTime = Date.now();
  const timestamp = new Date().toISOString();

  const method = req.method;
  const url = req.originalUrl;

  console.log(`\n============== 📥 [Booking Req Start - ${traceId}] ==============`);
  console.log(`📅 Timestamp : ${timestamp}`);
  console.log(`🌐 Endpoint  : ${method} ${url}`);
  console.log(`👤 Client IP : ${req.ip || req.socket.remoteAddress || 'Unknown'}`);
  
  // Log request headers (selective and clean)
  const headersToLog = { ...req.headers };
  // Redact or mask Auth header details to keep them safe but indicate presence
  if (headersToLog.authorization) {
    headersToLog.authorization = `${headersToLog.authorization.substring(0, 15)}... [REDACTED]`;
  }
  if (headersToLog.cookie) {
    headersToLog.cookie = '[REDACTED_FOR_SECURITY]';
  }
  console.log(`📇 Headers   :`, JSON.stringify(headersToLog, null, 2));

  // Log request body (masking secrets)
  const bodyCopy = { ...req.body };
  if (bodyCopy.passportNumber) {
    bodyCopy.passportNumber = `${bodyCopy.passportNumber.substring(0, 3)}***** [MASKED]`;
  }
  if (bodyCopy.password) {
    bodyCopy.password = '******** [MASKED]';
  }
  console.log(`📦 Body Args  :`, JSON.stringify(bodyCopy, null, 2));
  console.log(`=================================================================\n`);

  // Monitor response lifecycle to log execution times
  res.on('finish', () => {
    const elapsed = Date.now() - (req.bookingStartTime || Date.now());
    const status = res.statusCode;
    const isSuccess = status < 400;
    
    console.log(`\n============== 📤 [Booking Req End - ${traceId}] ==============`);
    console.log(`📊 Response Code : ${status}`);
    console.log(`⏱️ Elapsed Time   : ${elapsed}ms`);
    console.log(`=================================================================\n`);
  });

  // Execute downstream route and middleware handlers inside the storage context so Prisma queries inherit the trace ID
  bookingStorage.run({ traceId }, () => {
    next();
  });
}

