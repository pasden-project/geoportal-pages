/* functions/api/[[path]].js — Cloudflare Pages API gateway (jalan utama)
 *
 * Frontend (src/) memanggil:  POST /api/<fn>   (lihat src/api.js, apiBase '/api')
 * File ini menangkap "/api/*" dan meneruskan ke Google Apps Script /exec,
 * menyisipkan kunci rahasia (dari env Pages) di query — tidak pernah di UI publik.
 *
 * Architecture Decision: AD-15E-B-001 (SINGLE-READ JSON GATEWAY)
 * Current gateway is JSON-normalizing, not generic streaming; compatibility takes precedence;
 * one upstream body buffer permitted.
 * Read upstream bytes once (arrayBuffer), decode UTF-8 once for JSON validation,
 * and on valid JSON return the original buffered bytes, not JSON.stringify output.
 * Preserves exact prior semantics: valid JSON accepted regardless of Content-Type;
 * invalid/non-JSON normalized to existing HTTP 502 JSON error body/status.
 * Zero response.clone() or duplicate body reads.
 *
 * Telemetry & Timing Fields:
 * - upstream_headers_ms: fetch start to headers resolved
 * - upstream_body_ms: headers resolved to body buffered
 * - upstream_ms: upstream_headers_ms + upstream_body_ms
 * - validation_ms: TextDecoder + JSON.parse verification
 * - handler_ms: total gateway execution time
 * - Server-Timing: upstream;dur=<ms>, validation;dur=<ms>, edge;dur=<ms>
 *
 * ENV yang harus diatur di Cloudflare Pages (Settings → Environment variables):
 *   GAS_EXEC_URL : https://script.google.com/macros/s/<id>/exec
 *   GAS_SECRET   : nilai ScriptProperty REST_SECRET milik Apps Script
 */

const ALLOWED_OPERATIONS = new Set([
  'getAvailableYears',
  'getDashboardData',
  'getAllRawData',
  'getRoutes',
  'getTerminalDetail',
  'getPotretRows',
  'getPotretBarangMeta',
  'saveRoute',
  'updateRoute',
  'deleteRoute',
  'saveTerminalDetail',
  'savePotretRows',
  'sinkronisasiProduksi'
]);

const utf8Decoder = new TextDecoder('utf-8', { fatal: false });

function generateRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function logStructured(entry) {
  const jsonStr = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(jsonStr);
  } else if (entry.level === 'warn') {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}

async function proxy(context) {
  const handlerStart = performance.now();
  const requestId = generateRequestId();
  let observedOperation = 'unknown';
  let method = 'POST';

  try {
    const { request, env, params } = context || {};
    const rawName = (params && params.path && params.path[0]) ? params.path[0] : 'getDashboardData';
    const name = typeof rawName === 'string' ? rawName : 'getDashboardData';
    observedOperation = ALLOWED_OPERATIONS.has(name) ? name : 'unknown';
    method = (request && request.method) ? request.method : 'POST';

    // 1. Guard konfigurasi upstream GAS_EXEC_URL
    if (!env || !env.GAS_EXEC_URL) {
      const handlerEnd = performance.now();
      const handler_ms = Math.max(0, Number((handlerEnd - handlerStart).toFixed(1)));
      logStructured({
        level: 'error',
        request_id: requestId,
        operation: observedOperation,
        method: method,
        upstream_status: null,
        final_status: 500,
        upstream_headers_ms: 0,
        upstream_body_ms: 0,
        upstream_ms: 0,
        validation_ms: 0,
        handler_ms: handler_ms,
        payload_bytes: 'unknown',
        observed_at: new Date().toISOString(),
        error_class: 'GATEWAY_ERROR'
      });
      return new Response(JSON.stringify({ ok: false, error: 'GAS_EXEC_URL belum diset.' }), {
        status: 500,
        headers: {
          'content-type': 'application/json',
          'X-GeoPortal-Request-Id': requestId,
          'Server-Timing': `edge;dur=${handler_ms}`
        }
      });
    }

    // 2. Konstruksi gasUrl presisi (tanpa trace/request ID di query ke GAS)
    const gasUrl = env.GAS_EXEC_URL +
      (env.GAS_EXEC_URL.indexOf('?') >= 0 ? '&' : '?') +
      'path=' + encodeURIComponent(name) +
      '&key=' + encodeURIComponent(env.GAS_SECRET || '');

    // 3. Baca body request masuk (hanya payload RPC kecil dari frontend; tidak menelan error)
    let body = '{}';
    if (request && request.body) {
      body = await request.text();
    }

    // 4. Dispatch upstream fetch dengan pengukuran bertahap (headers vs body)
    let gas;
    const fetchStart = performance.now();
    try {
      gas = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: body
      });
    } catch (e) {
      const headersEnd = performance.now();
      const upstream_headers_ms = Math.max(0, Number((headersEnd - fetchStart).toFixed(1)));
      const handlerEnd = performance.now();
      const handler_ms = Math.max(0, Number((handlerEnd - handlerStart).toFixed(1)));
      const isTimeout = Boolean(
        e && (e.name === 'TimeoutError' || (e.message && /timeout|timed out/i.test(e.message)) || e.code === 23)
      );
      const errorClass = isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_CONNECT_ERROR';

      logStructured({
        level: 'error',
        request_id: requestId,
        operation: observedOperation,
        method: method,
        upstream_status: null,
        final_status: 502,
        upstream_headers_ms: upstream_headers_ms,
        upstream_body_ms: 0,
        upstream_ms: upstream_headers_ms,
        validation_ms: 0,
        handler_ms: handler_ms,
        payload_bytes: 'unknown',
        observed_at: new Date().toISOString(),
        error_class: errorClass
      });

      return new Response(JSON.stringify({ ok: false, error: 'gateway: backend tidak terjangkau.' }), {
        status: 502,
        headers: {
          'content-type': 'application/json',
          'X-GeoPortal-Request-Id': requestId,
          'Server-Timing': `upstream;dur=${upstream_headers_ms}, edge;dur=${handler_ms}`
        }
      });
    }

    const headersEnd = performance.now();
    const upstream_headers_ms = Math.max(0, Number((headersEnd - fetchStart).toFixed(1)));

    // 5. Single-Read (AD-15E-B-001): baca arrayBuffer upstream tepat sekali
    let rawBuffer;
    try {
      rawBuffer = await gas.arrayBuffer();
    } catch (readErr) {
      const bodyEnd = performance.now();
      const upstream_body_ms = Math.max(0, Number((bodyEnd - headersEnd).toFixed(1)));
      const upstream_ms = Math.max(0, Number((upstream_headers_ms + upstream_body_ms).toFixed(1)));
      const handlerEnd = performance.now();
      const handler_ms = Math.max(0, Number((handlerEnd - handlerStart).toFixed(1)));

      logStructured({
        level: 'error',
        request_id: requestId,
        operation: observedOperation,
        method: method,
        upstream_status: gas.status,
        final_status: 502,
        upstream_headers_ms: upstream_headers_ms,
        upstream_body_ms: upstream_body_ms,
        upstream_ms: upstream_ms,
        validation_ms: 0,
        handler_ms: handler_ms,
        payload_bytes: 'unknown',
        observed_at: new Date().toISOString(),
        error_class: 'UPSTREAM_CONNECT_ERROR'
      });

      return new Response(JSON.stringify({ ok: false, error: 'gateway: backend tidak terjangkau.' }), {
        status: 502,
        headers: {
          'content-type': 'application/json',
          'X-GeoPortal-Request-Id': requestId,
          'Server-Timing': `upstream;dur=${upstream_ms}, edge;dur=${handler_ms}`
        }
      });
    }

    const bodyEnd = performance.now();
    const upstream_body_ms = Math.max(0, Number((bodyEnd - headersEnd).toFixed(1)));
    const upstream_ms = Math.max(0, Number((upstream_headers_ms + upstream_body_ms).toFixed(1)));
    const payloadBytes = rawBuffer.byteLength;

    // 6. Validasi JSON (AD-15E-B-001): decode UTF-8 sekali & parse
    const valStart = performance.now();
    let isJson = false;
    try {
      const decodedText = utf8Decoder.decode(rawBuffer);
      JSON.parse(decodedText);
      isJson = true;
    } catch (e) {
      isJson = false;
    }
    const valEnd = performance.now();
    const validation_ms = Math.max(0, Number((valEnd - valStart).toFixed(1)));

    const handlerEnd = performance.now();
    const handler_ms = Math.max(0, Number((handlerEnd - handlerStart).toFixed(1)));

    // Jika upstream bukan JSON valid (HTML/error text/empty)
    if (!isJson) {
      logStructured({
        level: 'error',
        request_id: requestId,
        operation: observedOperation,
        method: method,
        upstream_status: gas.status,
        final_status: 502,
        upstream_headers_ms: upstream_headers_ms,
        upstream_body_ms: upstream_body_ms,
        upstream_ms: upstream_ms,
        validation_ms: validation_ms,
        handler_ms: handler_ms,
        payload_bytes: payloadBytes,
        observed_at: new Date().toISOString(),
        error_class: 'UPSTREAM_HTTP_ERROR'
      });

      return new Response(
        JSON.stringify({ ok: false, error: 'Backend tidak merespons JSON (sedang hangat/terbatas). Coba lagi.' }),
        {
          status: 502,
          headers: {
            'content-type': 'application/json',
            'X-GeoPortal-Request-Id': requestId,
            'Server-Timing': `upstream;dur=${upstream_ms}, validation;dur=${validation_ms}, edge;dur=${handler_ms}`
          }
        }
      );
    }

    // 7. JSON valid: kembalikan byte asli dari rawBuffer (AD-15E-B-001 byte parity)
    // Tidak forward Content-Length; status asli upstream; inject telemetry headers
    const isHttpErr = gas.status >= 400;
    const logEntry = {
      level: isHttpErr ? 'warn' : 'info',
      request_id: requestId,
      operation: observedOperation,
      method: method,
      upstream_status: gas.status,
      final_status: gas.status,
      upstream_headers_ms: upstream_headers_ms,
      upstream_body_ms: upstream_body_ms,
      upstream_ms: upstream_ms,
      validation_ms: validation_ms,
      handler_ms: handler_ms,
      payload_bytes: payloadBytes,
      observed_at: new Date().toISOString()
    };
    if (isHttpErr) {
      logEntry.error_class = 'UPSTREAM_HTTP_ERROR';
    }
    logStructured(logEntry);

    return new Response(rawBuffer, {
      status: gas.status,
      headers: {
        'content-type': 'application/json',
        'X-GeoPortal-Request-Id': requestId,
        'Server-Timing': `upstream;dur=${upstream_ms}, validation;dur=${validation_ms}, edge;dur=${handler_ms}`
      }
    });

  } catch (err) {
    const handlerEnd = performance.now();
    const handler_ms = Math.max(0, Number((handlerEnd - handlerStart).toFixed(1)));
    logStructured({
      level: 'error',
      request_id: requestId,
      operation: observedOperation,
      method: method,
      upstream_status: null,
      final_status: 500,
      upstream_headers_ms: 0,
      upstream_body_ms: 0,
      upstream_ms: 0,
      validation_ms: 0,
      handler_ms: handler_ms,
      payload_bytes: 'unknown',
      observed_at: new Date().toISOString(),
      error_class: 'GATEWAY_ERROR'
    });
    return new Response(JSON.stringify({ ok: false, error: 'gateway: kesalahan internal gateway.' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'X-GeoPortal-Request-Id': requestId,
        'Server-Timing': `edge;dur=${handler_ms}`
      }
    });
  }
}

export async function onRequestPost(context) { return proxy(context); }
export async function onRequestGet(context) { return proxy(context); }