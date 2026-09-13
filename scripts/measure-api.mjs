/* scripts/measure-api.mjs — Telemetry & latency measurement probe (Phase 15E-B)
 *
 * Requirements (incorporating AD-15E-B-001):
 * - Node built-ins only (zero external dependencies)
 * - Configurable & sanitized --base:
 *   Rejects username, password, query params, hash fragments without echoing raw input/secrets
 * - Redirect policy: redirect: 'manual'; records redirect safely without follow-up request
 * - Safe allowlist only: getAvailableYears, getDashboardData, getRoutes
 * - getTerminalDetail excluded by policy (impure read / schema side-effect)
 * - Bounded max 3 sequential samples per endpoint (no concurrency/load testing)
 * - Global request bound: max 3 unique endpoints * max 3 samples = max 9 requests total
 * - Reject duplicate or overlong endpoint lists
 * - Zero secrets required or emitted
 * - Graceful reporting of NOT AVAILABLE for missing telemetry headers (old prod)
 * - Sanitized network error handling
 */

import { performance } from 'node:perf_hooks';

const SAFE_ALLOWLIST = ['getAvailableYears', 'getDashboardData', 'getRoutes'];

const EXCLUDED_REASONS = {
  getTerminalDetail: 'Excluded by policy: ensureTerminalDetailSheet_ performs conditional schema migration writes without locks (PHASE_15E_A_BASELINE_AUDIT.md Section 3.4)',
  saveRoute: 'Rejected: write endpoint violates read-only safety invariant',
  updateRoute: 'Rejected: write endpoint violates read-only safety invariant',
  deleteRoute: 'Rejected: write endpoint violates read-only safety invariant',
  saveTerminalDetail: 'Rejected: write endpoint violates read-only safety invariant',
  savePotretRows: 'Rejected: write endpoint violates read-only safety invariant',
  sinkronisasiProduksi: 'Rejected: heavy write/sync endpoint violates safety invariant'
};

const ENDPOINT_CONTRACTS = {
  getAvailableYears: {
    method: 'POST',
    body: { fn: 'getAvailableYears', args: [] }
  },
  getDashboardData: {
    method: 'POST',
    body: { fn: 'getDashboardData', args: [{}] }
  },
  getRoutes: {
    method: 'POST',
    body: { fn: 'getRoutes', args: [] }
  }
};

function parseArgs(argv) {
  const args = {
    base: 'https://geoportal-pages.pages.dev',
    samples: '3',
    pause: 1000,
    endpoints: [...SAFE_ALLOWLIST],
    json: false
  };

  let explicitEndpoints = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base' && i + 1 < argv.length) {
      args.base = argv[++i];
    } else if (arg.startsWith('--base=')) {
      args.base = arg.slice('--base='.length);
    } else if (arg === '--samples' && i + 1 < argv.length) {
      args.samples = argv[++i];
    } else if (arg.startsWith('--samples=')) {
      args.samples = arg.slice('--samples='.length);
    } else if (arg === '--pause' && i + 1 < argv.length) {
      args.pause = parseInt(argv[++i], 10);
    } else if (arg.startsWith('--pause=')) {
      args.pause = parseInt(arg.slice('--pause='.length), 10);
    } else if (arg === '--endpoint' && i + 1 < argv.length) {
      if (!explicitEndpoints) explicitEndpoints = [];
      explicitEndpoints.push(argv[++i]);
    } else if (arg.startsWith('--endpoint=')) {
      if (!explicitEndpoints) explicitEndpoints = [];
      explicitEndpoints.push(arg.slice('--endpoint='.length));
    } else if (arg === '--endpoints' && i + 1 < argv.length) {
      if (!explicitEndpoints) explicitEndpoints = [];
      explicitEndpoints.push(...argv[++i].split(',').map(s => s.trim()).filter(Boolean));
    } else if (arg.startsWith('--endpoints=')) {
      if (!explicitEndpoints) explicitEndpoints = [];
      explicitEndpoints.push(...arg.slice('--endpoints='.length).split(',').map(s => s.trim()).filter(Boolean));
    } else if (arg === '--json') {
      args.json = true;
    }
  }

  if (explicitEndpoints !== null) {
    args.endpoints = explicitEndpoints;
  }

  return args;
}

function validateAndSanitizeBase(rawBase) {
  let parsed;
  try {
    parsed = new URL(rawBase);
  } catch (e) {
    console.error('[ERROR] Invariant Violation: Invalid --base URL. Must be a valid HTTP or HTTPS URL.');
    process.exit(1);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    console.error(`[ERROR] Invariant Violation: Unsupported protocol in --base URL: '${parsed.protocol}'. Only http: and https: are allowed.`);
    process.exit(1);
  }

  if (parsed.username || parsed.password) {
    console.error('[ERROR] Invariant Violation: Embedded credentials in --base URL are forbidden.');
    process.exit(1);
  }

  if (parsed.search) {
    console.error('[ERROR] Invariant Violation: Query parameters in --base URL are forbidden.');
    process.exit(1);
  }

  if (parsed.hash) {
    console.error('[ERROR] Invariant Violation: Hash fragments in --base URL are forbidden.');
    process.exit(1);
  }

  const baseClean = `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, '');
  return baseClean.endsWith('/api') ? baseClean : `${baseClean}/api`;
}

function validateEndpoints(endpoints) {
  if (!endpoints || endpoints.length === 0) {
    console.error('[ERROR] Invariant Violation: No endpoints specified.');
    process.exit(1);
  }

  // Reject overlong endpoint list
  if (endpoints.length > SAFE_ALLOWLIST.length) {
    console.error(`[ERROR] Invariant Violation: Overlong endpoint list (${endpoints.length} > ${SAFE_ALLOWLIST.length}). Allowed unique safe endpoints count is at most ${SAFE_ALLOWLIST.length}.`);
    process.exit(1);
  }

  // Reject duplicate endpoints
  const seen = new Set();
  for (const ep of endpoints) {
    if (seen.has(ep)) {
      console.error(`[ERROR] Invariant Violation: Duplicate endpoint '${ep}' rejected. Endpoint list must contain unique items.`);
      process.exit(1);
    }
    seen.add(ep);

    if (!SAFE_ALLOWLIST.includes(ep)) {
      const reason = EXCLUDED_REASONS[ep] || `Endpoint '${ep}' is not in the safe allowlist: [${SAFE_ALLOWLIST.join(', ')}]`;
      console.error(`[ERROR] Invariant Violation: ${reason}`);
      process.exit(1);
    }
  }
}

function validateSamples(samples) {
  if (typeof samples !== 'string' || !/^[1-3]$/.test(samples)) {
    console.error('[ERROR] Invariant Violation: Requested samples value is invalid. Must be a complete integer from 1 to 3 (max 3 sequential probes).');
    process.exit(1);
  }
  return Number(samples);
}

function sanitizeNetworkError(err) {
  if (!err) return 'Unknown error';
  const code = err.code || err.name;
  if (code && typeof code === 'string') {
    return code;
  }
  const msg = String(err.message || err);
  return msg.split('?')[0].slice(0, 80);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseServerTiming(headerValue) {
  if (!headerValue || headerValue === 'NOT AVAILABLE') {
    return { raw: 'NOT AVAILABLE', upstream_ms: null, validation_ms: null, edge_ms: null };
  }
  const upstreamMatch = headerValue.match(/upstream;dur=([0-9.]+)/i);
  const validationMatch = headerValue.match(/validation;dur=([0-9.]+)/i);
  const edgeMatch = headerValue.match(/edge;dur=([0-9.]+)/i);
  return {
    raw: headerValue,
    upstream_ms: upstreamMatch ? Number(upstreamMatch[1]) : null,
    validation_ms: validationMatch ? Number(validationMatch[1]) : null,
    edge_ms: edgeMatch ? Number(edgeMatch[1]) : null
  };
}

function calculateStats(values) {
  if (!values.length) return { min: 0, median: 0, p95: 0, max: 0, mean: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  let median = 0;
  if (sorted.length % 2 === 1) {
    median = sorted[Math.floor(sorted.length / 2)];
  } else {
    const mid = sorted.length / 2;
    median = Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
  }
  const p95Idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(0.95 * sorted.length) - 1));
  const p95 = sorted[p95Idx];
  const mean = Number((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(1));
  return { min, median, p95, max, mean };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  // 1. Validasi & sanitasi parameter input
  const apiBase = validateAndSanitizeBase(options.base);
  validateEndpoints(options.endpoints);
  options.samples = validateSamples(options.samples);

  // Global request bound assertion
  const totalPlannedRequests = options.endpoints.length * options.samples;
  const GLOBAL_MAX_REQUESTS = 9;
  if (totalPlannedRequests > GLOBAL_MAX_REQUESTS) {
    console.error(`[ERROR] Invariant Violation: Total planned requests (${totalPlannedRequests}) exceeds global bound (${GLOBAL_MAX_REQUESTS}).`);
    process.exit(1);
  }

  if (!options.json) {
    console.log('================================================================================');
    console.log('GeoPORTAL BPTD Jabar — Phase 15E-B API Telemetry Measurement Probe');
    console.log('Architecture Decision: AD-15E-B-001 Compliant');
    console.log(`Target Base URL : ${apiBase}`);
    console.log(`Safe Endpoints  : ${options.endpoints.join(', ')}`);
    console.log(`Samples / Bound : ${options.samples} sequential samples (max 3, zero concurrency)`);
    console.log(`Global Requests : ${totalPlannedRequests} total max (bound: ${GLOBAL_MAX_REQUESTS})`);
    console.log(`Inter-sample    : ${options.pause} ms pause`);
    console.log('================================================================================\n');
  }

  const rawResults = [];
  const endpointSummaries = {};

  for (const ep of options.endpoints) {
    const contract = ENDPOINT_CONTRACTS[ep];
    const targetUrl = `${apiBase}/${ep}`;
    endpointSummaries[ep] = {
      samples: [],
      durations: [],
      payloadBytes: 0,
      statuses: [],
      requestIds: [],
      serverTimings: [],
      upstreamDurations: [],
      validationDurations: [],
      edgeDurations: []
    };

    for (let s = 1; s <= options.samples; s++) {
      const timestamp = new Date().toISOString();
      const tStart = performance.now();
      let status = 0;
      let okBody = false;
      let rawText = '';
      let bytes = 0;
      let requestId = 'NOT AVAILABLE';
      let serverTimingRaw = 'NOT AVAILABLE';
      let upstreamMs = 'NOT AVAILABLE';
      let validationMs = 'NOT AVAILABLE';
      let edgeMs = 'NOT AVAILABLE';
      let errorMsg = null;

      try {
        // Enforce manual redirect policy (no auto follow)
        const res = await fetch(targetUrl, {
          method: contract.method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(contract.body),
          redirect: 'manual'
        });

        status = res.status;
        requestId = res.headers.get('x-geoportal-request-id') || 'NOT AVAILABLE';
        serverTimingRaw = res.headers.get('server-timing') || 'NOT AVAILABLE';

        const parsedTiming = parseServerTiming(serverTimingRaw);
        if (parsedTiming.upstream_ms !== null) upstreamMs = parsedTiming.upstream_ms;
        if (parsedTiming.validation_ms !== null) validationMs = parsedTiming.validation_ms;
        if (parsedTiming.edge_ms !== null) edgeMs = parsedTiming.edge_ms;

        // If redirect occurred, do not follow; classify safely
        if (status >= 300 && status < 400) {
          const loc = res.headers.get('location') || '';
          errorMsg = `Redirect detected (${status}) - not followed`;
          bytes = 0;
          okBody = false;
        } else {
          rawText = await res.text();
          bytes = Buffer.byteLength(rawText, 'utf8');

          try {
            const parsed = JSON.parse(rawText);
            okBody = Boolean(parsed && parsed.ok);
            if (!okBody && parsed && parsed.error) {
              errorMsg = parsed.error;
            }
          } catch (parseErr) {
            okBody = false;
            errorMsg = 'Non-JSON response body';
          }
        }
      } catch (netErr) {
        status = 0;
        okBody = false;
        errorMsg = sanitizeNetworkError(netErr);
      }

      const tEnd = performance.now();
      const durationMs = Math.max(0, Number((tEnd - tStart).toFixed(1)));

      const sampleRecord = {
        endpoint: ep,
        sample: s,
        timestamp,
        status,
        bodyOk: okBody,
        durationMs,
        bytes,
        requestId,
        serverTiming: serverTimingRaw,
        upstreamMs,
        validationMs,
        edgeMs,
        errorMsg
      };

      rawResults.push(sampleRecord);
      endpointSummaries[ep].samples.push(sampleRecord);
      endpointSummaries[ep].durations.push(durationMs);
      endpointSummaries[ep].payloadBytes = bytes;
      endpointSummaries[ep].statuses.push(status);
      endpointSummaries[ep].requestIds.push(requestId);
      endpointSummaries[ep].serverTimings.push(serverTimingRaw);
      if (typeof upstreamMs === 'number') endpointSummaries[ep].upstreamDurations.push(upstreamMs);
      if (typeof validationMs === 'number') endpointSummaries[ep].validationDurations.push(validationMs);
      if (typeof edgeMs === 'number') endpointSummaries[ep].edgeDurations.push(edgeMs);

      if (!options.json) {
        console.log(`[SAMPLE] ${ep} #${s} -> HTTP ${status} (ok:${okBody}) in ${durationMs}ms | ${bytes}B | req_id: ${requestId} | timing: ${serverTimingRaw}${errorMsg ? ` | err: ${errorMsg}` : ''}`);
      }

      if (s < options.samples && options.pause > 0) {
        await sleep(options.pause);
      }
    }
  }

  // Ringkasan statistik
  const summaryReport = {};
  for (const ep of options.endpoints) {
    const data = endpointSummaries[ep];
    const durationStats = calculateStats(data.durations);
    const upstreamStats = data.upstreamDurations.length ? calculateStats(data.upstreamDurations) : null;
    const validationStats = data.validationDurations.length ? calculateStats(data.validationDurations) : null;
    const edgeStats = data.edgeDurations.length ? calculateStats(data.edgeDurations) : null;
    const successCount = data.samples.filter(s => s.status === 200 && s.bodyOk).length;
    const successPct = Math.round((successCount / data.samples.length) * 100);

    const hasRequestId = data.requestIds.some(id => id !== 'NOT AVAILABLE');
    const hasServerTiming = data.serverTimings.some(st => st !== 'NOT AVAILABLE');

    summaryReport[ep] = {
      samplesCount: data.samples.length,
      successPct,
      payloadBytes: data.payloadBytes,
      duration: durationStats,
      upstream: upstreamStats,
      validation: validationStats,
      edge: edgeStats,
      telemetry: {
        requestIdAvailable: hasRequestId,
        serverTimingAvailable: hasServerTiming
      }
    };
  }

  if (options.json) {
    console.log(JSON.stringify({ rawResults, summaryReport }, null, 2));
    return;
  }

  console.log('\n================================================================================');
  console.log('SUMMARY LATENCY & TELEMETRY STATISTICS');
  console.log('================================================================================');
  console.log(
    'Endpoint'.padEnd(20) +
    'Samples'.padStart(8) +
    'Success'.padStart(9) +
    'Bytes'.padStart(10) +
    'Min(ms)'.padStart(10) +
    'Med(ms)'.padStart(10) +
    'p95(ms)'.padStart(10) +
    'Max(ms)'.padStart(10) +
    'ReqId'.padStart(14) +
    'ServerTiming'.padStart(14)
  );
  console.log('-'.repeat(115));

  for (const ep of options.endpoints) {
    const s = summaryReport[ep];
    console.log(
      ep.padEnd(20) +
      String(s.samplesCount).padStart(8) +
      `${s.successPct}%`.padStart(9) +
      String(s.payloadBytes).padStart(10) +
      String(s.duration.min).padStart(10) +
      String(s.duration.median).padStart(10) +
      String(s.duration.p95).padStart(10) +
      String(s.duration.max).padStart(10) +
      (s.telemetry.requestIdAvailable ? 'AVAILABLE' : 'NOT AVAILABLE').padStart(14) +
      (s.telemetry.serverTimingAvailable ? 'AVAILABLE' : 'NOT AVAILABLE').padStart(14)
    );
  }

  console.log('================================================================================\n');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});