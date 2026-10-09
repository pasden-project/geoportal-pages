// Geo12-pages/scripts/test-gateway-hotfix.mjs
// Automated verification for Gateway write-blocking & secret sanitization hotfix

import fs from 'node:fs';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/[[path]].js';

console.log('=== TEST SUITE: Gateway Hotfix Verification (FASE 0 / GATE G0) ===\n');

let fetchCalls = [];
const originalFetch = globalThis.fetch;

// Mock upstream fetch
globalThis.fetch = async (url, options) => {
  fetchCalls.push({ url: String(url), options });
  return new Response(JSON.stringify({ ok: true, data: [2024, 2025] }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

const fakeEnv = {
  GAS_EXEC_URL: 'https://script.google.com/macros/s/AKfycbxTestGateway/exec'
};

async function runTests() {
  let passedCount = 0;

  // Test 1: Operasi tulis (saveRoute) diblokir fail-closed (HTTP 403) tanpa upstream fetch
  {
    console.log('[TEST 1] Operasi tulis (saveRoute) harus diblokir (HTTP 403)...');
    fetchCalls = [];
    const context = {
      request: new Request('https://geoportal.test/api/saveRoute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ route: 'test' })
      }),
      env: fakeEnv,
      params: { path: ['saveRoute'] }
    };

    const res = await onRequestPost(context);
    assert.equal(res.status, 403, `Expected status 403, got ${res.status}`);
    const data = await res.json();
    assert.deepEqual(data, { ok: false, error: 'Operasi tulis dinonaktifkan sementara.' });
    assert.equal(fetchCalls.length, 0, 'Fetch upstream must NOT be called for write operations');
    console.log('  -> PASS: HTTP 403 returned, upstream fetch not called, error message matches.');
    passedCount++;
  }

  // Test 1b: Uji seluruh sisa WRITE_OPERATIONS untuk memastikan semua diblokir
  {
    const allWriteOps = [
      'updateRoute',
      'deleteRoute',
      'saveTerminalDetail',
      'savePotretRows',
      'sinkronisasiProduksi'
    ];
    for (const op of allWriteOps) {
      fetchCalls = [];
      const res = await onRequestPost({
        request: new Request(`https://geoportal.test/api/${op}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}'
        }),
        env: fakeEnv,
        params: { path: [op] }
      });
      assert.equal(res.status, 403, `Expected status 403 for ${op}, got ${res.status}`);
      assert.equal(fetchCalls.length, 0, `Fetch upstream must NOT be called for ${op}`);
    }
    console.log(`  -> PASS: Seluruh 6 WRITE_OPERATIONS terbukti diblokir HTTP 403 fail-closed.`);
  }

  // Test 2: Operasi tidak dikenal (fooBar) ditolak (HTTP 404) tanpa upstream fetch
  {
    console.log('\n[TEST 2] Operasi tidak dikenal (fooBar) harus ditolak (HTTP 404)...');
    fetchCalls = [];
    const context = {
      request: new Request('https://geoportal.test/api/fooBar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}'
      }),
      env: fakeEnv,
      params: { path: ['fooBar'] }
    };

    const res = await onRequestPost(context);
    assert.equal(res.status, 404, `Expected status 404, got ${res.status}`);
    const data = await res.json();
    assert.deepEqual(data, { ok: false, error: 'endpoint tidak dikenal' });
    assert.equal(fetchCalls.length, 0, 'Fetch upstream must NOT be called for unknown endpoints');
    console.log('  -> PASS: HTTP 404 returned, upstream fetch not called, error message matches.');
    passedCount++;
  }

  // Test 3: Operasi baca (getAvailableYears) diteruskan tanpa query param key
  {
    console.log('\n[TEST 3] Operasi baca (getAvailableYears) harus diteruskan tanpa param key...');
    fetchCalls = [];
    const context = {
      request: new Request('https://geoportal.test/api/getAvailableYears', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}'
      }),
      env: fakeEnv,
      params: { path: ['getAvailableYears'] }
    };

    const res = await onRequestPost(context);
    assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(fetchCalls.length, 1, 'Upstream fetch must be called exactly once');

    const calledUrl = fetchCalls[0].url;
    assert.ok(calledUrl.includes('path=getAvailableYears'), `URL must contain path=getAvailableYears: ${calledUrl}`);
    assert.ok(!calledUrl.includes('key='), `URL must NOT contain key parameter: ${calledUrl}`);
    console.log(`  -> PASS: HTTP 200 returned, upstream called URL: ${calledUrl}`);
    console.log('  -> PASS: Parameter key= terbukti TIDAK diteruskan ke upstream.');
    passedCount++;
  }

  // Test 4: Verifikasi sanitasi source code functions/api/[[path]].js bebas "&key=" dan "GAS_SECRET"
  {
    console.log('\n[TEST 4] Verifikasi sanitasi source code functions/api/[[path]].js bebas "&key=" dan "GAS_SECRET"...');
    const gatewayPath = new URL('../functions/api/[[path]].js', import.meta.url);
    const sourceContent = await fs.promises.readFile(gatewayPath, 'utf8');
    assert.ok(!sourceContent.includes('&key='), 'Source code must NOT contain "&key="');
    assert.ok(!sourceContent.includes('GAS_SECRET'), 'Source code must NOT contain "GAS_SECRET"');
    console.log('  -> PASS: Source code functions/api/[[path]].js terbukti bersih dari "&key=" dan "GAS_SECRET".');
    passedCount++;
  }

  console.log(`\n=== HASIL: ${passedCount}/4 Skenario Utama LULUS (Semua pengujian berhasil) ===`);
}

try {
  await runTests();
} finally {
  globalThis.fetch = originalFetch;
}
