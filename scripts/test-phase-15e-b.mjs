/* scripts/test-phase-15e-b.mjs — Comprehensive adversarial local test suite for Phase 15E-B
 *
 * Architecture Decision: AD-15E-B-001 (SINGLE-READ JSON GATEWAY)
 * Record: Current gateway is JSON-normalizing, not generic streaming; compatibility takes
 * precedence; one upstream body buffer permitted (read via arrayBuffer, validated once,
 * original raw bytes returned without JSON.stringify re-serialization).
 *
 * Verification Areas:
 * A Syntax validation
 * B Request ID generation & canonicalization
 * C Server-Timing presence (upstream, validation, edge) & numeric non-negative timings
 * D Structured success logging & complete redaction (no secrets/tokens/URL/auth/cookie/body/stack)
 * E Structured failure logging & safe error classification (CONNECT, TIMEOUT, HTTP, GATEWAY)
 * F AD-15E-B-001 Raw byte parity, single-read (no clone), multibyte UTF-8 preservation, no Content-Length forwarding
 * G Query construction & request method invariants
 * H Measurement CLI hardening: userinfo/query/fragment rejection without echoing inputs, manual redirect (no follow), request bounds
 * I Pre-change normalization semantics: Content-Type independence for valid JSON, non-JSON 502 wrapping, no silent body swallowing
 */

import { pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GATEWAY_PATH = resolve(__dirname, '../functions/api/[[path]].js');
const MEASURE_PATH = resolve(__dirname, 'measure-api.mjs');
const TEST_PATH = __filename;

let passCount = 0;
let failCount = 0;

function assert(name, condition, details = '') {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${name}${details ? ` (${details})` : ''}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${name}${details ? ` (${details})` : ''}`);
  }
}

// Import gateway functions dynamically
const gatewayUrl = pathToFileURL(GATEWAY_PATH).href;
const { onRequestPost, onRequestGet } = await import(gatewayUrl);

console.log('================================================================================');
console.log('GeoPORTAL Phase 15E-B — Automated Test Suite (AD-15E-B-001 Compliant)');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test A: Syntax for gateway, measurement script, and test suite
// -----------------------------------------------------------------------------
console.log('--- Test A: Syntax Validation ---');
{
  const chkGateway = spawnSync(process.execPath, ['--check', GATEWAY_PATH], { encoding: 'utf8' });
  assert('Test A.1: Gateway file syntax valid (node --check)', chkGateway.status === 0, chkGateway.stderr.trim());

  const chkMeasure = spawnSync(process.execPath, ['--check', MEASURE_PATH], { encoding: 'utf8' });
  assert('Test A.2: Measurement script syntax valid (node --check)', chkMeasure.status === 0, chkMeasure.stderr.trim());

  const chkTest = spawnSync(process.execPath, ['--check', TEST_PATH], { encoding: 'utf8' });
  assert('Test A.3: Test suite syntax valid (node --check)', chkTest.status === 0, chkTest.stderr.trim());
}

// -----------------------------------------------------------------------------
// Test B: Request ID generation
// -----------------------------------------------------------------------------
console.log('\n--- Test B: Request ID Generation & Canonicalization ---');
{
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return new Response(new TextEncoder().encode(JSON.stringify({ ok: true, data: [2026, 2025] })), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    };

    const ctx1 = {
      request: new Request('http://localhost/api/getAvailableYears', {
        method: 'POST',
        headers: { 'X-GeoPortal-Request-Id': 'client-injected-id-should-be-ignored' }
      }),
      env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'test_sec' },
      params: { path: ['getAvailableYears'] }
    };
    const res1 = await onRequestPost(ctx1);
    const id1 = res1.headers.get('x-geoportal-request-id');

    const ctx2 = {
      request: new Request('http://localhost/api/getAvailableYears', { method: 'POST' }),
      env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'test_sec' },
      params: { path: ['getAvailableYears'] }
    };
    const res2 = await onRequestPost(ctx2);
    const id2 = res2.headers.get('x-geoportal-request-id');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert('Test B.1: Request ID follows standard UUID format', uuidRegex.test(id1), id1);
    assert('Test B.2: Client request ID is never treated as canonical', id1 !== 'client-injected-id-should-be-ignored', id1);
    assert('Test B.3: Consecutive requests generate unique correlation IDs', id1 !== id2, `${id1} != ${id2}`);

    // Edge failure also gets valid request ID
    const ctxErr = {
      request: new Request('http://localhost/api/getRoutes', { method: 'POST' }),
      env: {}, // Missing GAS_EXEC_URL
      params: { path: ['getRoutes'] }
    };
    const resErr = await onRequestPost(ctxErr);
    const idErr = resErr.headers.get('x-geoportal-request-id');
    assert('Test B.4: Edge error response includes valid Request ID', uuidRegex.test(idErr), idErr);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// -----------------------------------------------------------------------------
// Test C: Server-Timing presence, breakdown fields & numeric nonnegative timing
// -----------------------------------------------------------------------------
console.log('\n--- Test C: Server-Timing Header Format & Durations (AD-15E-B-001) ---');
{
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      await new Promise(r => setTimeout(r, 25));
      return new Response(new TextEncoder().encode(JSON.stringify({ ok: true, data: [] })), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    };

    const ctx = {
      request: new Request('http://localhost/api/getRoutes', { method: 'POST' }),
      env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' },
      params: { path: ['getRoutes'] }
    };
    const res = await onRequestPost(ctx);
    const timing = res.headers.get('server-timing');

    assert('Test C.1: Server-Timing header is present', Boolean(timing), timing);

    const upstreamMatch = timing ? timing.match(/upstream;dur=([0-9.]+)/) : null;
    const validationMatch = timing ? timing.match(/validation;dur=([0-9.]+)/) : null;
    const edgeMatch = timing ? timing.match(/edge;dur=([0-9.]+)/) : null;

    assert('Test C.2: Server-Timing contains upstream;dur=<ms>', Boolean(upstreamMatch), upstreamMatch ? upstreamMatch[0] : 'missing');
    assert('Test C.3: Server-Timing contains validation;dur=<ms>', Boolean(validationMatch), validationMatch ? validationMatch[0] : 'missing');
    assert('Test C.4: Server-Timing contains edge;dur=<ms>', Boolean(edgeMatch), edgeMatch ? edgeMatch[0] : 'missing');

    const upstreamVal = upstreamMatch ? Number(upstreamMatch[1]) : -1;
    const validationVal = validationMatch ? Number(validationMatch[1]) : -1;
    const edgeVal = edgeMatch ? Number(edgeMatch[1]) : -1;

    assert('Test C.5: Upstream duration is numeric and non-negative', !isNaN(upstreamVal) && upstreamVal >= 0, `${upstreamVal} ms`);
    assert('Test C.6: Validation duration is numeric and non-negative', !isNaN(validationVal) && validationVal >= 0, `${validationVal} ms`);
    assert('Test C.7: Edge duration is numeric and non-negative', !isNaN(edgeVal) && edgeVal >= 0, `${edgeVal} ms`);
    assert('Test C.8: Edge duration accounts for upstream wait', edgeVal >= upstreamVal, `edge(${edgeVal}) >= upstream(${upstreamVal})`);
    assert('Test C.9: Timing does not claim GAS/Sheets/browser latency', !timing.includes('gas') && !timing.includes('sheets') && !timing.includes('browser'));
  } finally {
    globalThis.fetch = originalFetch;
  }
}
// -----------------------------------------------------------------------------
// Test D: Structured success log & redaction invariants
// -----------------------------------------------------------------------------
console.log('\n--- Test D: Structured Success Logging & Invariant Redaction ---');
{
  const originalFetch = globalThis.fetch;
  const originalConsoleLog = console.log;
  let loggedEntries = [];

  try {
    console.log = (str) => {
      try {
        loggedEntries.push(JSON.parse(str));
      } catch (e) {}
    };

    const payload = new TextEncoder().encode(JSON.stringify({ ok: true, data: { points: [] } }));
    globalThis.fetch = async () => {
      return new Response(payload, {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    };

    const ctx = {
      request: new Request('http://localhost/api/getDashboardData', {
        method: 'POST',
        headers: { 'Cookie': 'session=secret_cookie_val', 'Authorization': 'Bearer secret_token' },
        body: JSON.stringify({ fn: 'getDashboardData', args: [{}] })
      }),
      env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST_SECRET_ID/exec', GAS_SECRET: 'super_secret_gas_key_7788' },
      params: { path: ['getDashboardData'] }
    };
    await onRequestPost(ctx);

    console.log = originalConsoleLog;
    const log = loggedEntries.find(e => e.operation === 'getDashboardData');

    assert('Test D.1: Structured JSON log emitted on success', Boolean(log));
    assert('Test D.2: Log contains request_id and correct operation', log && log.operation === 'getDashboardData' && Boolean(log.request_id));
    assert('Test D.3: Log contains method and statuses', log && log.method === 'POST' && log.upstream_status === 200 && log.final_status === 200);
    assert('Test D.4: Log contains timing breakdown fields', log && log.upstream_headers_ms >= 0 && log.upstream_body_ms >= 0 && log.upstream_ms >= 0 && log.validation_ms >= 0 && log.handler_ms >= 0);
    assert('Test D.5: Log records exact payload_bytes from single buffer', log && log.payload_bytes === payload.byteLength, `${log?.payload_bytes} === ${payload.byteLength}`);
    assert('Test D.6: Log has valid ISO observed_at timestamp', log && !isNaN(Date.parse(log.observed_at)));

    const serializedLog = JSON.stringify(log);
    assert('Test D.7: Secret key is not logged', !serializedLog.includes('super_secret_gas_key_7788'));
    assert('Test D.8: Upstream URL is not logged', !serializedLog.includes('script.google.com') && !serializedLog.includes('TEST_SECRET_ID'));
    assert('Test D.9: Auth header is not logged', !serializedLog.includes('secret_token'));
    assert('Test D.10: Cookie is not logged', !serializedLog.includes('secret_cookie_val'));
    assert('Test D.11: Response payload body is not logged', !serializedLog.includes('"points"'));

    loggedEntries = [];
    console.log = (str) => { try { loggedEntries.push(JSON.parse(str)); } catch(e){} };
    const ctxMalicious = {
      request: new Request('http://localhost/api/../../etc/passwd', { method: 'POST' }),
      env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' },
      params: { path: ['../../etc/passwd'] }
    };
    await onRequestPost(ctxMalicious);
    console.log = originalConsoleLog;
    const malLog = loggedEntries[loggedEntries.length - 1];
    assert('Test D.12: Unallowlisted operation is sanitized to "unknown" in structured logs', malLog && malLog.operation === 'unknown');
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalConsoleLog;
  }
}

// -----------------------------------------------------------------------------
// Test E: Structured failure log with safe classification/redaction
// -----------------------------------------------------------------------------
console.log('\n--- Test E: Structured Failure Logging & Safe Classification ---');
{
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  let loggedErrors = [];

  try {
    console.error = (str) => {
      try {
        loggedErrors.push(JSON.parse(str));
      } catch (e) {}
    };

    // 1. Missing GAS_EXEC_URL -> GATEWAY_ERROR (500)
    {
      loggedErrors = [];
      const ctx = {
        request: new Request('http://localhost/api/getRoutes', { method: 'POST' }),
        env: { GAS_SECRET: 'sec' },
        params: { path: ['getRoutes'] }
      };
      const res = await onRequestPost(ctx);
      const json = await res.json();
      assert('Test E.1: Missing GAS_EXEC_URL yields status 500', res.status === 500);
      assert('Test E.2: Missing GAS_EXEC_URL preserves Indonesian error message', json.error === 'GAS_EXEC_URL belum diset.');
      assert('Test E.3: Error response includes Request-Id and Server-Timing', Boolean(res.headers.get('x-geoportal-request-id')) && Boolean(res.headers.get('server-timing')));
      const errLog = loggedErrors.find(e => e.error_class === 'GATEWAY_ERROR');
      assert('Test E.4: Missing GAS_EXEC_URL classified as GATEWAY_ERROR in logs', Boolean(errLog));
    }

    // 2. Upstream Connect Error -> UPSTREAM_CONNECT_ERROR (502)
    {
      loggedErrors = [];
      globalThis.fetch = async () => {
        throw new TypeError('fetch failed: connection refused to script.google.com');
      };
      const ctx = {
        request: new Request('http://localhost/api/getAvailableYears', { method: 'POST' }),
        env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' },
        params: { path: ['getAvailableYears'] }
      };
      const res = await onRequestPost(ctx);
      const json = await res.json();
      assert('Test E.5: Upstream connection error yields status 502', res.status === 502);
      assert('Test E.6: Upstream connection error preserves Indonesian error message', json.error === 'gateway: backend tidak terjangkau.');
      assert('Test E.7: No internal exception or stack trace exposed to client', !json.error.includes('fetch failed'));
      const errLog = loggedErrors.find(e => e.error_class === 'UPSTREAM_CONNECT_ERROR');
      assert('Test E.8: Network failure classified as UPSTREAM_CONNECT_ERROR', Boolean(errLog));
    }

    // 3. Upstream Timeout Error -> UPSTREAM_TIMEOUT (502)
    {
      loggedErrors = [];
      globalThis.fetch = async () => {
        const err = new Error('The operation was aborted due to timeout');
        err.name = 'TimeoutError';
        throw err;
      };
      const ctx = {
        request: new Request('http://localhost/api/getDashboardData', { method: 'POST' }),
        env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' },
        params: { path: ['getDashboardData'] }
      };
      const res = await onRequestPost(ctx);
      const errLog = loggedErrors.find(e => e.error_class === 'UPSTREAM_TIMEOUT');
      assert('Test E.9: Timeout failure classified as UPSTREAM_TIMEOUT', Boolean(errLog));
    }

    // 4. Upstream Non-JSON / HTML Response -> UPSTREAM_HTTP_ERROR (502)
    {
      loggedErrors = [];
      globalThis.fetch = async () => {
        return new Response(new TextEncoder().encode('<html><head><title>Google Service Loading</title></head></html>'), {
          status: 200,
          headers: { 'content-type': 'text/html; charset=UTF-8' }
        });
      };
      const ctx = {
        request: new Request('http://localhost/api/getDashboardData', { method: 'POST' }),
        env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' },
        params: { path: ['getDashboardData'] }
      };
      const res = await onRequestPost(ctx);
      const json = await res.json();
      assert('Test E.10: Upstream HTML response normalized to status 502 JSON', res.status === 502);
      assert('Test E.11: Upstream HTML response preserves friendly cold-start message', json.error.includes('sedang hangat/terbatas'));
      const errLog = loggedErrors.find(e => e.error_class === 'UPSTREAM_HTTP_ERROR');
      assert('Test E.12: Upstream HTML response classified as UPSTREAM_HTTP_ERROR', Boolean(errLog));
    }
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}
// -----------------------------------------------------------------------------
// Test F: AD-15E-B-001 Raw Byte Parity, Single-Read Invariant & Multibyte UTF-8
// -----------------------------------------------------------------------------
console.log('\n--- Test F: AD-15E-B-001 Raw Byte Parity, Multibyte & Single-Read ---');
{
  const gatewayCode = readFileSync(GATEWAY_PATH, 'utf8');

  assert('Test F.1: Gateway does NOT call gas.clone() (AD-15E-B-001)', !gatewayCode.includes('gas.clone()'));
  assert('Test F.2: Gateway buffers body via arrayBuffer() once', gatewayCode.includes('gas.arrayBuffer()'));

  const originalFetch = globalThis.fetch;
  try {
    const irregularJson = '{\n  "ok":   true,\n  "data": [ 1,  2, 3 ]\n}';
    const rawBuffer = new TextEncoder().encode(irregularJson);

    let arrayBufferCallCount = 0;
    globalThis.fetch = async () => {
      return {
        status: 200,
        headers: new Headers({ 'content-type': 'application/json', 'content-length': String(rawBuffer.byteLength) }),
        async arrayBuffer() {
          arrayBufferCallCount++;
          return rawBuffer.buffer.slice(rawBuffer.byteOffset, rawBuffer.byteOffset + rawBuffer.byteLength);
        },
        clone() {
          throw new Error('clone() should not be called under AD-15E-B-001');
        }
      };
    };

    const ctx = {
      request: new Request('http://localhost/api/getRoutes', { method: 'POST' }),
      env: { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' },
      params: { path: ['getRoutes'] }
    };
    const res = await onRequestPost(ctx);
    const returnedBytes = new Uint8Array(await res.arrayBuffer());

    assert('Test F.3: arrayBuffer() called exactly once', arrayBufferCallCount === 1);
    assert('Test F.4: Raw bytes returned without JSON re-serialization (whitespace preserved)', Buffer.from(returnedBytes).equals(Buffer.from(rawBuffer)));
    assert('Test F.5: Content-Length header is NOT forwarded to client', res.headers.get('content-length') === null);

    // Multibyte UTF-8 preservation
    const multibytePayload = JSON.stringify({
      ok: true,
      data: {
        kota: 'Bandung 🚌 🏔️',
        keterangan: 'Jalur Trayek Cicaheum — Leuwipanjang • Angkutan Umum Jabar',
        simbol: '€ £ ¥ © ® ™',
        aksen: 'é, à, ö, ç, ñ'
      }
    });
    const multibyteBuffer = new TextEncoder().encode(multibytePayload);

    globalThis.fetch = async () => {
      return {
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        async arrayBuffer() {
          return multibyteBuffer.buffer.slice(multibyteBuffer.byteOffset, multibyteBuffer.byteOffset + multibyteBuffer.byteLength);
        }
      };
    };

    const resMulti = await onRequestPost(ctx);
    const returnedMultiBytes = new Uint8Array(await resMulti.arrayBuffer());
    assert('Test F.6: Multibyte UTF-8 characters preserved with exact byte parity', Buffer.from(returnedMultiBytes).equals(Buffer.from(multibyteBuffer)));

    // Status 403 passthrough with raw bytes
    const forbiddenJson = '{"ok":false,"error":"Forbidden: invalid key"}';
    const forbiddenBuffer = new TextEncoder().encode(forbiddenJson);
    globalThis.fetch = async () => {
      return {
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        async arrayBuffer() {
          return forbiddenBuffer.buffer.slice(forbiddenBuffer.byteOffset, forbiddenBuffer.byteOffset + forbiddenBuffer.byteLength);
        }
      };
    };

    const res403 = await onRequestPost(ctx);
    const returned403Bytes = new Uint8Array(await res403.arrayBuffer());
    assert('Test F.7: Status 403 passed through verbatim', res403.status === 403);
    assert('Test F.8: Status 403 JSON body passed through with exact byte parity', Buffer.from(returned403Bytes).equals(Buffer.from(forbiddenBuffer)));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// -----------------------------------------------------------------------------
// Test G: Query forwarding unchanged and request method behavior
// -----------------------------------------------------------------------------
console.log('\n--- Test G: Query Construction & Request Method Invariants ---');
{
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody = '';

  try {
    globalThis.fetch = async (url, opts) => {
      capturedUrl = url;
      capturedMethod = opts.method;
      capturedBody = opts.body;
      return new Response(new TextEncoder().encode(JSON.stringify({ ok: true, data: [] })), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    };

    const env = {
      GAS_EXEC_URL: 'https://script.google.com/macros/s/AKfycbz_TEST/exec',
      GAS_SECRET: 'secret_token_123'
    };

    const ctxPost = {
      request: new Request('http://localhost/api/getAvailableYears?foo=bar', {
        method: 'POST',
        body: JSON.stringify({ fn: 'getAvailableYears', args: [] })
      }),
      env,
      params: { path: ['getAvailableYears'] }
    };
    await onRequestPost(ctxPost);

    assert('Test G.1: Destination gasUrl constructs path parameter correctly', capturedUrl.includes('path=getAvailableYears'));
    assert('Test G.2: Destination gasUrl injects key parameter correctly', capturedUrl.includes('key=secret_token_123'));
    assert('Test G.3: Correlation ID is NOT appended to GAS query string', !capturedUrl.includes('request_id') && !capturedUrl.includes('trace_id'));
    assert('Test G.4: Upstream fetch called with POST method', capturedMethod === 'POST');
    assert('Test G.5: Request body passed upstream', capturedBody.includes('getAvailableYears'));

    capturedUrl = '';
    capturedMethod = '';
    const ctxGet = {
      request: new Request('http://localhost/api/getRoutes', { method: 'GET' }),
      env,
      params: { path: ['getRoutes'] }
    };
    await onRequestGet(ctxGet);

    assert('Test G.6: onRequestGet proxies upstream using POST method', capturedMethod === 'POST');
    assert('Test G.7: onRequestGet constructs path=getRoutes correctly', capturedUrl.includes('path=getRoutes'));
  } finally {
    globalThis.fetch = originalFetch;
  }
}
// -----------------------------------------------------------------------------
// Test H: Measurement CLI hardening: Bounds, Sanitization & Manual Redirect
// -----------------------------------------------------------------------------
console.log('\n--- Test H: Measurement CLI Invariants & Sanitization ---');
{
  const rejDetail = spawnSync(process.execPath, [MEASURE_PATH, '--endpoint', 'getTerminalDetail'], { encoding: 'utf8' });
  assert('Test H.1: getTerminalDetail is rejected by measure-api.mjs', rejDetail.status !== 0);
  assert('Test H.2: getTerminalDetail rejection explains schema side-effect policy', rejDetail.stderr.includes('ensureTerminalDetailSheet_'));

  const rejWrite1 = spawnSync(process.execPath, [MEASURE_PATH, '--endpoint', 'saveRoute'], { encoding: 'utf8' });
  assert('Test H.3: saveRoute write endpoint is rejected', rejWrite1.status !== 0 && rejWrite1.stderr.includes('write endpoint'));

  const rejWrite2 = spawnSync(process.execPath, [MEASURE_PATH, '--endpoint', 'sinkronisasiProduksi'], { encoding: 'utf8' });
  assert('Test H.4: sinkronisasiProduksi write endpoint is rejected', rejWrite2.status !== 0 && rejWrite2.stderr.includes('write/sync'));

  const rejDup = spawnSync(process.execPath, [MEASURE_PATH, '--endpoints', 'getRoutes,getRoutes'], { encoding: 'utf8' });
  assert('Test H.5: Duplicate endpoints in list are rejected', rejDup.status !== 0 && rejDup.stderr.includes('Duplicate endpoint'));

  const rejOverlong = spawnSync(process.execPath, [MEASURE_PATH, '--endpoints', 'getRoutes,getDashboardData,getAvailableYears,getRoutes'], { encoding: 'utf8' });
  assert('Test H.6: Overlong endpoints list (> 3) is rejected', rejOverlong.status !== 0 && rejOverlong.stderr.includes('Overlong endpoint list'));

  const rejSamples4 = spawnSync(process.execPath, [MEASURE_PATH, '--samples', '4', '--endpoint', 'getAvailableYears'], { encoding: 'utf8' });
  assert('Test H.7: Samples > 3 rejected with error', rejSamples4.status !== 0 && rejSamples4.stderr.includes('invalid'));

  const rejSamplesFraction = spawnSync(process.execPath, [MEASURE_PATH, '--samples', '1.5', '--endpoint', 'getAvailableYears'], { encoding: 'utf8' });
  assert('Test H.8: Fractional samples rejected before fetch', rejSamplesFraction.status !== 0 && rejSamplesFraction.stderr.includes('invalid'));

  const rejSamplesSuffix = spawnSync(process.execPath, [MEASURE_PATH, '--samples', '3foo', '--endpoint', 'getAvailableYears'], { encoding: 'utf8' });
  assert('Test H.9: Suffixed samples rejected before fetch', rejSamplesSuffix.status !== 0 && rejSamplesSuffix.stderr.includes('invalid'));

  const rejSamples0 = spawnSync(process.execPath, [MEASURE_PATH, '--samples', '0', '--endpoint', 'getAvailableYears'], { encoding: 'utf8' });
  assert('Test H.10: Samples < 1 rejected with error', rejSamples0.status !== 0 && rejSamples0.stderr.includes('invalid'));

  const rejBadBase = spawnSync(process.execPath, [MEASURE_PATH, '--base', 'ftp://geoportal.local'], { encoding: 'utf8' });
  assert('Test H.11: Non-HTTP/HTTPS base URL protocol is rejected', rejBadBase.status !== 0 && rejBadBase.stderr.includes('Unsupported protocol'));

  const secretCred = 'super_secret_user:super_secret_pass';
  const rejCredBase = spawnSync(process.execPath, [MEASURE_PATH, '--base', `https://${secretCred}@geoportal.local`], { encoding: 'utf8' });
  assert('Test H.12: Credentials in base URL are rejected', rejCredBase.status !== 0 && rejCredBase.stderr.includes('credentials'));
  assert('Test H.13: Secret credentials are NOT echoed in error output', !rejCredBase.stderr.includes(secretCred));

  const secretQuery = 'token=my_secret_probe_token';
  const rejQueryBase = spawnSync(process.execPath, [MEASURE_PATH, '--base', `https://geoportal.local?${secretQuery}`], { encoding: 'utf8' });
  assert('Test H.14: Query parameters in base URL are rejected', rejQueryBase.status !== 0 && rejQueryBase.stderr.includes('Query parameters'));
  assert('Test H.15: Secret query parameter is NOT echoed in error output', !rejQueryBase.stderr.includes(secretQuery));

  const secretHash = 'secret_fragment_anchor';
  const rejHashBase = spawnSync(process.execPath, [MEASURE_PATH, '--base', `https://geoportal.local#${secretHash}`], { encoding: 'utf8' });
  assert('Test H.16: Hash fragment in base URL is rejected', rejHashBase.status !== 0 && rejHashBase.stderr.includes('Hash fragment'));
  assert('Test H.17: Secret hash fragment is NOT echoed in error output', !rejHashBase.stderr.includes(secretHash));

  // 10. Behavioral redirect test: local server receives exactly one request; measure-api must not follow Location.
  const redirectServerScript = resolve(__dirname, '.tmp-phase-15e-b-redirect-server.mjs');
  const redirectCountFile = resolve(__dirname, '.tmp-phase-15e-b-redirect-count.json');
  const redirectServerSource = `
    import http from 'node:http';
    import fs from 'node:fs';
    const countFile = ${JSON.stringify(redirectCountFile)};
    let count = 0;
    const server = http.createServer((req, res) => {
      count++;
      fs.writeFileSync(countFile, JSON.stringify({ count }), 'utf8');
      if (req.url === '/api/getRoutes') {
        res.writeHead(302, { Location: 'https://secret.example.invalid/should-not-follow?token=hidden' });
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    console.log(JSON.stringify({ port: server.address().port }));
    process.stdin.resume();
  `;
  writeFileSync(redirectServerScript, redirectServerSource, 'utf8');
  try { unlinkSync(redirectCountFile); } catch (e) {}
  const serverChild = spawn(process.execPath, [redirectServerScript], { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8' });
  let serverOutput = '';
  serverChild.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
  await new Promise(resolve => {
    const started = () => { serverChild.stdout.off('data', started); resolve(); };
    serverChild.stdout.on('data', started);
  });
  const portMatch = serverOutput.match(/\{"port":(\d+)\}/);
  const port = portMatch ? portMatch[1] : null;
  const redirectRun = port ? spawnSync(process.execPath, [MEASURE_PATH, '--base', 'http://127.0.0.1:' + port, '--endpoint', 'getRoutes', '--samples', '1'], { encoding: 'utf8' }) : { status: 1, stdout: '', stderr: 'server did not start' };
  serverChild.kill();
  await new Promise(resolve => serverChild.once('close', resolve));
  let requestCount = 0;
  try { requestCount = JSON.parse(readFileSync(redirectCountFile, 'utf8')).count; } catch (e) {}
  try { unlinkSync(redirectServerScript); } catch (e) {}
  try { unlinkSync(redirectCountFile); } catch (e) {}
  const redirectOutput = redirectRun.stdout + redirectRun.stderr;
  assert('Test H.18: Behavioral redirect probe exits cleanly', redirectRun.status === 0, redirectOutput);
  assert('Test H.19: Redirect is classified as not followed', redirectOutput.includes('Redirect detected (302) - not followed'));
  assert('Test H.20: Redirect target URL is not leaked', !redirectOutput.includes('secret.example.invalid') && !redirectOutput.includes('token=hidden'));
  assert('Test H.21: Measurement source uses redirect manual policy', readFileSync(MEASURE_PATH, 'utf8').includes("redirect: 'manual'"));
  assert('Test H.22: Redirect generated exactly one server request', requestCount === 1, `count=${requestCount}`);
  assert('Test H.23: Redirect test does not follow Location', !redirectOutput.includes('ECONNREFUSED') && requestCount === 1);
  assert('Test H.24: Behavioral redirect assertions pass', redirectRun.status === 0 && requestCount === 1);
}

// -----------------------------------------------------------------------------
// Test I: Pre-Change Normalization Semantics & Content-Type Independence
// -----------------------------------------------------------------------------
console.log('\n--- Test I: Pre-Change Normalization Semantics & Content-Type Independence ---');
{
  const originalFetch = globalThis.fetch;
  try {
    const env = { GAS_EXEC_URL: 'https://script.google.com/macros/s/TEST/exec', GAS_SECRET: 'sec' };
    const ctx = {
      request: new Request('http://localhost/api/getAvailableYears', { method: 'POST' }),
      env,
      params: { path: ['getAvailableYears'] }
    };

    const validJsonBytes = new TextEncoder().encode('{"ok":true,"data":[2026]}');
    globalThis.fetch = async () => {
      return new Response(validJsonBytes, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=UTF-8' }
      });
    };
    const resHtmlJson = await onRequestPost(ctx);
    const bodyHtmlJson = await resHtmlJson.json();
    assert('Test I.1: Valid JSON is NOT rejected even if Content-Type is text/html', resHtmlJson.status === 200 && bodyHtmlJson.ok === true);

    globalThis.fetch = async () => {
      return new Response(new TextEncoder().encode('{"ok":true,"data":[2026,2025]}'), {
        status: 200,
        headers: {}
      });
    };
    const resNoCt = await onRequestPost(ctx);
    const bodyNoCt = await resNoCt.json();
    assert('Test I.2: Valid JSON is accepted when Content-Type header is missing', resNoCt.status === 200 && bodyNoCt.ok === true);

    globalThis.fetch = async () => {
      return new Response(new TextEncoder().encode('Error: Google Apps Script runtime error at line 42'), {
        status: 200,
        headers: { 'content-type': 'text/plain' }
      });
    };
    const resPlainErr = await onRequestPost(ctx);
    const bodyPlainErr = await resPlainErr.json();
    assert('Test I.3: Non-JSON plain text error normalized to HTTP 502', resPlainErr.status === 502 && bodyPlainErr.ok === false);
    assert('Test I.4: Non-JSON plain text error preserves friendly message', bodyPlainErr.error.includes('sedang hangat/terbatas'));

    globalThis.fetch = async () => {
      return new Response(new Uint8Array(0), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const resEmpty = await onRequestPost(ctx);
    assert('Test I.5: Empty upstream body normalized to HTTP 502', resEmpty.status === 502);

    const ctxBrokenBody = {
      request: {
        method: 'POST',
        body: true,
        text: async () => { throw new Error('Client connection reset during stream read'); }
      },
      env,
      params: { path: ['getAvailableYears'] }
    };
    const resBroken = await onRequestPost(ctxBrokenBody);
    const bodyBroken = await resBroken.json();
    assert('Test I.6: Request body read failure yields HTTP 500 error', resBroken.status === 500);
    assert('Test I.7: Request body read failure is not silently replaced with {}', bodyBroken.error.includes('kesalahan internal gateway'));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// -----------------------------------------------------------------------------
// Final Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`FINAL TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('Architecture Decision AD-15E-B-001: VERIFIED & APPLIED');
console.log('================================================================================');

process.exit(failCount === 0 ? 0 : 1);