import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const bookingStorage = new AsyncLocalStorage<{ traceId: string }>();

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ Warning: DATABASE_URL is not set. Prisma queries will fail.');
} else {
  const host = process.env.DATABASE_URL.includes('@') 
    ? process.env.DATABASE_URL.split('@')[1].split('/')[0] 
    : 'Local/Unidentified Host';
  console.log(`🔌 [Prisma] Initializing connection to: ${host}`);
}

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'info' }
  ],
});

// Suppress unhandled noisy stdout dumps for known unavailable external hosts
(prisma as any).$on('error', (e: any) => {
  if (!e.message?.includes('ENOTFOUND') && !e.message?.includes('tenant/user')) {
    console.warn('⚠️ [Prisma Alert]:', e.message);
  }
});

// Subscribe to query events to log execution times & help isolate search/booking issues
(prisma as any).$on('query', (e: any) => {
  const duration = e.duration;
  const timestamp = new Date().toISOString();
  const store = bookingStorage.getStore();
  const tracePrefix = store ? `[${store.traceId}] ` : '';
  console.log(`⏱️ [Prisma Query] ${tracePrefix}[${timestamp}] ${e.query} | Params: ${e.params} | Duration: ${duration}ms`);
});

// Export database connection state helper with fast timeout & caching
let cachedDbOnline: boolean | null = null;
let lastCheckTime = 0;

export async function checkPrismaConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl || dbUrl.includes('postgres.gcvijfclmaxoosbngwfy')) {
    cachedDbOnline = false;
    lastCheckTime = Date.now();
    return { success: false, error: 'Database tenant is not configured or host unreachable' };
  }

  const start = Date.now();
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout (1500ms)')), 1500)
    );
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeoutPromise
    ]);
    cachedDbOnline = true;
    lastCheckTime = Date.now();
    return { success: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    cachedDbOnline = false;
    lastCheckTime = Date.now();
    return { success: false, error: err.message || String(err) };
  }
}

export async function isDatabaseAvailable(): Promise<boolean> {
  const now = Date.now();
  if (cachedDbOnline !== null && now - lastCheckTime < 20000) {
    return cachedDbOnline;
  }
  const res = await checkPrismaConnection();
  return res.success;
}


