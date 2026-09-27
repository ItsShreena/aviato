import React, { useState, useEffect } from 'react';
import { 
  Bug, X, Trash2, Terminal, AlertTriangle, Play, ShieldAlert,
  Database, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { addErrorListener, InterceptedError, notifyListeners } from '../utils/apiInterceptor';

export default function DiagnosticsConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<InterceptedError[]>(() => {
    // Optional: read previous session errors if desired, but keep simple
    return [];
  });
  const [hasNew, setHasNew] = useState(false);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Database check states
  const [dbStatus, setDbStatus] = useState<{
    loading: boolean;
    checked: boolean;
    status: string;
    latencyMs?: number;
    stats?: { flights: number; bookings: number; aircraft: number; airports: number };
    error?: string;
  }>({
    loading: false,
    checked: false,
    status: 'UNKNOWN'
  });

  // Listen to fetch interceptor
  useEffect(() => {
    const unsubscribe = addErrorListener((err) => {
      setErrors((prev) => [err, ...prev]);
      setHasNew(true);
      // Play a subtle notification or open automatically on first major error if needed
    });
    return unsubscribe;
  }, []);

  const clearLogs = () => {
    setErrors([]);
    setHasNew(false);
    setExpandedErrorId(null);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNew(false);
      checkDatabaseHealth();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedErrorId(expandedErrorId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Ping the custom backend diagnostic db-status endpoint we created
  const checkDatabaseHealth = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true, checked: true }));
    try {
      const response = await fetch('/api/debug/db-status');
      const data = await response.json();
      if (response.ok && data.status === 'online') {
        setDbStatus({
          loading: false,
          checked: true,
          status: 'ONLINE',
          latencyMs: data.latencyMs,
          stats: data.stats
        });
      } else {
        setDbStatus({
          loading: false,
          checked: true,
          status: 'OFFLINE',
          error: data.error || 'Server responded with failure code'
        });
      }
    } catch (err: any) {
      setDbStatus({
        loading: false,
        checked: true,
        status: 'OFFLINE',
        error: err.message || 'Network exception pinging diagnostics endpoint'
      });
    }
  };

  // Helper to trigger simulated errors so users can test immediately
  const triggerSimulatedError = async (statusCode: number) => {
    if (statusCode === 404) {
      // Intentionally trigger a 404
      await fetch('/api/flights/non-existent-flight-id-for-testing-123456');
    } else {
      // Trigger a 500 error on the booking endpoint with malformed payload
      await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: '99999-invalid-flight-route-segment',
          passengerName: 'Diagnostics Agent',
          passengerEmail: 'diagnostics@aviato-enterprise.com',
          passportNumber: 'ERR-500-TEST',
          seatNumber: '99X',
          totalPrice: -100
        })
      });
    }
  };

  return (
    <>


      {/* Slide-Over Drawer */}
      <div
        id="err-console-drawer"
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl flex flex-col transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-zinc-100 tracking-tight text-sm">Enterprise Diagnostics Console</span>
          </div>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <button
                id="err-console-clear-btn"
                onClick={clearLogs}
                title="Clear logs"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="err-console-close-btn"
              onClick={toggleOpen}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 font-sans">
          
          {/* Section 1: Database Status Monitor */}
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-zinc-300">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>DB Connection Status</span>
              </div>
              <button
                id="err-console-db-refresh-btn"
                onClick={checkDatabaseHealth}
                disabled={dbStatus.loading}
                className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-800 transition"
              >
                <RefreshCw className={`w-3 h-3 ${dbStatus.loading ? 'animate-spin' : ''}`} />
                <span>Verify DB</span>
              </button>
            </div>

            {dbStatus.checked ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dbStatus.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`font-mono text-xs font-bold ${dbStatus.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dbStatus.status}
                  </span>
                  {dbStatus.latencyMs !== undefined && (
                    <span className="font-mono text-[10px] text-zinc-500">
                      | latency: {dbStatus.latencyMs}ms
                    </span>
                  )}
                </div>

                {dbStatus.status === 'ONLINE' && dbStatus.stats && (
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/40 text-center font-mono">
                    <div className="bg-zinc-900 p-1.5 rounded">
                      <div className="text-[10px] text-zinc-500">Flights</div>
                      <div className="text-xs font-bold text-zinc-300">{dbStatus.stats.flights}</div>
                    </div>
                    <div className="bg-zinc-900 p-1.5 rounded">
                      <div className="text-[10px] text-zinc-500">Bookings</div>
                      <div className="text-xs font-bold text-zinc-300">{dbStatus.stats.bookings}</div>
                    </div>
                    <div className="bg-zinc-900 p-1.5 rounded">
                      <div className="text-[10px] text-zinc-500">Fleet</div>
                      <div className="text-xs font-bold text-zinc-300">{dbStatus.stats.aircraft}</div>
                    </div>
                    <div className="bg-zinc-900 p-1.5 rounded">
                      <div className="text-[10px] text-zinc-500">Hubs</div>
                      <div className="text-xs font-bold text-zinc-300">{dbStatus.stats.airports}</div>
                    </div>
                  </div>
                )}

                {dbStatus.status === 'OFFLINE' && (
                  <div className="text-xs text-rose-300 font-mono bg-rose-950/20 p-2.5 rounded border border-rose-500/20">
                    <span className="font-bold">Error:</span> {dbStatus.error}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-mono">
                Verify the live state of your database using the diagnostic suite above.
              </div>
            )}
          </div>

          {/* Section 2: Simulator Action Deck */}
          <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
            <div className="font-mono text-xs font-semibold text-zinc-300 mb-2.5">
              🚀 Diagnostic Test Suite
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              Force fake API exceptions to verify the full real-time capture lifecycle, tracing, and response outputs.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="simulate-404-btn"
                onClick={() => triggerSimulatedError(404)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 rounded-lg text-amber-200 font-mono text-xs font-medium transition duration-200"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate 404 Route</span>
              </button>
              <button
                id="simulate-500-btn"
                onClick={() => triggerSimulatedError(500)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-200 font-mono text-xs font-medium transition duration-200"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate 500 Booking</span>
              </button>
            </div>
          </div>

          {/* Section 3: Intercepted Logs */}
          <div>
            <div className="font-mono text-xs font-semibold text-zinc-300 mb-3 flex justify-between items-center">
              <span>Captured API Error Logs ({errors.length})</span>
              {errors.length > 0 && <span className="text-[10px] text-zinc-500 font-normal">Newest first</span>}
            </div>

            {errors.length === 0 ? (
              <div className="border border-dashed border-zinc-800 rounded-xl py-10 px-4 text-center">
                <Terminal className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 font-semibold mb-1">No captured failures</p>
                <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                  All requests are currently passing cleanly. Use the diagnostic simulator above to verify captures.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {errors.map((err) => {
                  const isExpanded = expandedErrorId === err.id;
                  const is404 = err.status === 404;
                  return (
                    <div
                      key={err.id}
                      className={`border rounded-xl bg-zinc-900/80 shadow transition-colors overflow-hidden ${
                        isExpanded
                          ? 'border-zinc-700'
                          : is404
                            ? 'border-amber-500/20 hover:border-amber-500/30'
                            : 'border-rose-500/20 hover:border-rose-500/30'
                      }`}
                    >
                      {/* Header row */}
                      <div
                        onClick={() => toggleExpand(err.id)}
                        className="p-3.5 flex items-start gap-3 cursor-pointer select-none"
                      >
                        <div className={`p-1.5 rounded-lg mt-0.5 ${is404 ? 'bg-amber-950/40 text-amber-400' : 'bg-rose-950/40 text-rose-400'}`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              is404 ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'
                            }`}>
                              HTTP {err.status}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">
                              {new Date(err.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="font-mono text-xs font-bold text-zinc-200 mt-1 truncate">
                            {err.method} {err.url}
                          </div>
                        </div>
                        <button className="text-zinc-500 hover:text-zinc-300 p-0.5">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Detail row */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-zinc-800/80 bg-zinc-950 font-mono text-xs space-y-3">
                          <div className="grid grid-cols-4 gap-2 text-[10px] text-zinc-500 py-1.5 border-b border-zinc-800/40">
                            <div>
                              <div className="font-semibold text-zinc-400">STATUS</div>
                              <div className="text-zinc-300 mt-0.5">{err.status} {err.statusText}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="font-semibold text-zinc-400">TRACE ID</div>
                              {err.traceId ? (
                                <div className="flex items-center gap-1 text-emerald-400 font-bold mt-0.5">
                                  <span>{err.traceId}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(err.traceId!, `${err.id}-trace`);
                                    }}
                                    className="hover:text-white"
                                    title="Copy trace ID"
                                  >
                                    {copiedId === `${err.id}-trace` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-zinc-600 mt-0.5">Unavailable</div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-400">TIMESTAMP</div>
                              <div className="text-zinc-300 mt-0.5">
                                {new Date(err.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          {/* Raw response details */}
                          {err.details && (
                            <div>
                              <div className="text-[10px] font-semibold text-zinc-400 mb-1">RESPONSE BODY</div>
                              <pre className="bg-zinc-900 p-3 rounded-lg text-rose-300/90 text-[11px] overflow-x-auto border border-zinc-800/50 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                                {err.details}
                              </pre>
                            </div>
                          )}

                          {/* Troubleshooting recommendations */}
                          <div className="bg-amber-950/10 border border-amber-500/20 p-3 rounded-lg text-amber-200/90 leading-relaxed text-[11px]">
                            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-400 mb-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Recommended Action</span>
                            </div>
                            {is404 ? (
                              <span>
                                The endpoint returned a <strong>404 Not Found</strong>. Confirm that the flight route exists in the system or that the flight list was properly initialized. Try refreshing or reseeding via the Admin Panel.
                              </span>
                            ) : (
                              <span>
                                The server failed with a database/Prisma constraint. Inspect your terminal logs for trace ID <strong>{err.traceId || 'your transaction'}</strong> to view the precise SQL query parameters and schema bottlenecks.
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 text-center font-mono text-[10px] text-zinc-500">
          Aviato Enterprise Diagnostic Suite • Local Time {new Date().toLocaleTimeString()}
        </div>
      </div>
    </>
  );
}
