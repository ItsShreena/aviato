export interface InterceptedError {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  traceId?: string;
  details?: string;
}

type ErrorListener = (error: InterceptedError) => void;
const listeners = new Set<ErrorListener>();

/**
 * Register a callback to receive real-time intercepted API errors.
 * Returns an unsubscribe function.
 */
export const addErrorListener = (listener: ErrorListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Dispatch an intercepted error to all registered listeners.
 */
export const notifyListeners = (error: InterceptedError) => {
  listeners.forEach((listener) => {
    try {
      listener(error);
    } catch (e) {
      console.error('Error executing API error listener:', e);
    }
  });
};

let interceptorInitialized = false;

/**
 * Global fetch interceptor. Wraps native window.fetch to capture 404s and 500s 
 * from any /api call.
 */
export function initializeFetchInterceptor() {
  if (typeof window === 'undefined' || interceptorInitialized) return;
  interceptorInitialized = true;

  console.log('🔌 [Fetch Interceptor] Globalizing API error-capturing handler on window.fetch');

  const originalFetch = window.fetch;
  if (!originalFetch) {
    console.warn('⚠️ [Fetch Interceptor] window.fetch is not defined in this environment.');
    return;
  }

  const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : input.url;

    const method = init?.method || 'GET';

    try {
      const response = await originalFetch(input, init);

      // We specifically watch for 404 and 500+ error status codes on API routes
      if (urlString.includes('/api') && (response.status === 404 || response.status >= 500)) {
        try {
          // Clone response so we can read its json without exhausting the stream
          const clonedResponse = response.clone();
          const data = await clonedResponse.json().catch(() => null);

          // Build a clean descriptive error payload
          const interceptedError: InterceptedError = {
            id: `err-${Math.floor(100000 + Math.random() * 900000)}`,
            timestamp: new Date().toISOString(),
            url: urlString,
            method,
            status: response.status,
            statusText: response.statusText || (response.status === 404 ? 'Not Found' : 'Internal Server Error'),
            traceId: data?.traceId || data?.details?.traceId || undefined,
            details: typeof data === 'object' && data !== null 
              ? data.details || data.error || JSON.stringify(data) 
              : undefined,
          };

          console.warn(`🚨 [Fetch Interceptor] Caught API Error ${response.status} on ${method} ${urlString}`, interceptedError);
          notifyListeners(interceptedError);
        } catch (cloneErr) {
          console.error('⚠️ [Fetch Interceptor] Failed to extract JSON error details:', cloneErr);
          // Fallback log without payload
          notifyListeners({
            id: `err-${Math.floor(100000 + Math.random() * 900000)}`,
            timestamp: new Date().toISOString(),
            url: urlString,
            method,
            status: response.status,
            statusText: response.statusText,
          });
        }
      }

      return response;
    } catch (networkError: any) {
      // Also catch complete offline or network breakdown events for API routes
      if (urlString.includes('/api')) {
        const errorPayload: InterceptedError = {
          id: `err-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: new Date().toISOString(),
          url: urlString,
          method,
          status: 0,
          statusText: 'Network Connection Failed',
          details: networkError.message || String(networkError),
        };
        console.error(`🚨 [Fetch Interceptor] Network connection failed on ${method} ${urlString}`, networkError);
        notifyListeners(errorPayload);
      }
      throw networkError;
    }
  };

  // Attempt to override window.fetch using direct property assignment,
  // falling back to Object.defineProperty if it has only a getter.
  try {
    window.fetch = customFetch;
  } catch (err) {
    console.log('🔄 [Fetch Interceptor] Direct window.fetch assignment failed. Falling back to Object.defineProperty...');
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
      console.log('✅ [Fetch Interceptor] Successfully defined custom fetch property on window.');
    } catch (defErr: any) {
      console.error('🚨 [Fetch Interceptor] Failed to intercept window.fetch via defineProperty:', defErr.message || defErr);
    }
  }
}
