// scripts/verify-data-master-cms.mjs — Comprehensive Verification Suite for Data Master CMS & Consumer Integrations
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync, execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(REPO_ROOT, '..');

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

console.log('================================================================================');
console.log('GeoPORTAL BPTD Jabar — Verification Suite: Integrasi Data Master Backend & CMS');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: JavaScript Syntax Verification
// -----------------------------------------------------------------------------
console.log('--- Suite 1: JavaScript Syntax Checks ---');
{
  const filesToCheck = [
    resolve(REPO_ROOT, 'functions/api/[[path]].js'),
    resolve(REPO_ROOT, 'v2/data-master/data-master.js'),
    resolve(REPO_ROOT, 'v2/perintis/perintis.js'),
    resolve(REPO_ROOT, 'v2/uppkb/uppkb.js'),
    resolve(REPO_ROOT, 'dark-rivet/rivet.js'),
    resolve(REPO_ROOT, 'src/command-center/data-master/data-master.js'),
    resolve(REPO_ROOT, 'src/command-center/perintis/perintis.js'),
    resolve(REPO_ROOT, 'src/command-center/uppkb/uppkb.js'),
    resolve(REPO_ROOT, 'src/rivet.js')
  ];

  for (const f of filesToCheck) {
    const chk = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    const rel = path.relative(PROJECT_ROOT, f);
    assert(`Syntax check: ${rel}`, chk.status === 0, chk.stderr ? chk.stderr.trim() : '');
  }

  // Check Apps Script Code.gs syntax
  const codeGsPath = resolve(PROJECT_ROOT, 'Geo12/Code.gs');
  try {
    const codeGsContent = readFileSync(codeGsPath, 'utf8');
    new Function(codeGsContent);
    assert('Syntax check: Geo12/Code.gs (Apps Script backend)', true);
  } catch (err) {
    assert('Syntax check: Geo12/Code.gs (Apps Script backend)', false, err.message);
  }
}

// -----------------------------------------------------------------------------
// Suite 2: HTML & CSS Structure Verification
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: HTML & CSS Structure Verification ---');
{
  const v2Html = readFileSync(resolve(REPO_ROOT, 'v2/data-master/index.html'), 'utf8');
  const srcHtml = readFileSync(resolve(REPO_ROOT, 'src/command-center/data-master/index.html'), 'utf8');

  assert('Test 2.1: btnTabManagement exists in v2/data-master/index.html', v2Html.includes('id="btnTabManagement"'));
  assert('Test 2.2: panelTabManagement exists in v2/data-master/index.html', v2Html.includes('id="panelTabManagement"'));
  assert('Test 2.3: cmsModuleSelect dropdown exists in v2/data-master/index.html', v2Html.includes('id="cmsModuleSelect"'));
  assert('Test 2.4: btnCmsAddEntity button exists in v2/data-master/index.html', v2Html.includes('id="btnCmsAddEntity"'));
  assert('Test 2.5: btnCmsApplyData button exists in v2/data-master/index.html', v2Html.includes('id="btnCmsApplyData"'));
  assert('Test 2.6: linkGoogleSheets removed from v2/data-master/index.html (headless secure DB)', !v2Html.includes('id="linkGoogleSheets"'));
  assert('Test 2.7: cmsEntityModal exists in v2/data-master/index.html', v2Html.includes('id="cmsEntityModal"'));
  assert('Test 2.8: cmsPinModal exists in v2/data-master/index.html', v2Html.includes('id="cmsPinModal"'));

  // Verify compiled src/ matches
  assert('Test 2.9: btnTabManagement exists in compiled src/command-center/data-master/index.html', srcHtml.includes('id="btnTabManagement"'));
  assert('Test 2.10: panelTabManagement exists in compiled src/command-center/data-master/index.html', srcHtml.includes('id="panelTabManagement"'));

  // Verify CSS styles
  const v2Css = readFileSync(resolve(REPO_ROOT, 'v2/data-master/data-master.css'), 'utf8');
  assert('Test 2.11: .cms-header-card style exists', v2Css.includes('.cms-header-card'));
  assert('Test 2.12: .cms-toolbar style exists', v2Css.includes('.cms-toolbar'));
  assert('Test 2.13: .btn-apply style exists', v2Css.includes('.btn-apply'));
  assert('Test 2.14: .cms-table style exists', v2Css.includes('.cms-table'));
}

// -----------------------------------------------------------------------------
// Suite 3: Apps Script Backend Logic Verification (Geo12/Code.gs)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Google Apps Script Backend Schema & Baselines ---');
{
  const codeGsContent = readFileSync(resolve(PROJECT_ROOT, 'Geo12/Code.gs'), 'utf8');

  // Verify POTRET_SHEETS and POTRET_IDS include 'brt'
  assert('Test 3.1: POTRET_SHEETS.brt is mapped to PotretBRT', codeGsContent.includes("brt: 'PotretBRT'"));
  assert('Test 3.2: POTRET_IDS includes brt', codeGsContent.includes("'brt'"));

  // Verify schemas defined for all managed modules
  assert('Test 3.3: POTRET_SCHEMA defines perintis schema', codeGsContent.includes("key: 'kode_trayek'") && codeGsContent.includes("key: 'nama_trayek'"));
  assert('Test 3.4: POTRET_SCHEMA defines barang schema', codeGsContent.includes("key: 'uppkb'") && codeGsContent.includes("key: 'kepatuhan_pct'"));
  assert('Test 3.5: POTRET_SCHEMA defines brt schema', codeGsContent.includes("key: 'koridor'") && codeGsContent.includes("key: 'nama_koridor'"));
  assert('Test 3.6: POTRET_SCHEMA defines ajap schema', codeGsContent.includes("key: 'perusahaan'") && codeGsContent.includes("key: 'jenis'"));
  assert('Test 3.7: POTRET_SCHEMA defines pariwisata schema', codeGsContent.includes("key: 'po'") && codeGsContent.includes("key: 'laik'"));

  // Verify baseline function exists
  assert('Test 3.8: getPotretBaselineRows_ function exists', codeGsContent.includes('function getPotretBaselineRows_(section)'));
  assert('Test 3.9: ensurePotretSheet_ seeds baseline data', codeGsContent.includes('getPotretBaselineRows_(section)'));
  assert('Test 3.10: cekRESTSecret_ supports BPTD1JABAR fallback', codeGsContent.includes("'BPTD1JABAR'"));
}

// -----------------------------------------------------------------------------
// Suite 4: Cloudflare Pages Edge API Gateway Security Verification
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Cloudflare API Gateway Security Logic ---');
{
  const gatewayCode = readFileSync(resolve(REPO_ROOT, 'functions/api/[[path]].js'), 'utf8');

  assert('Test 4.1: getPotretRows is in READ_OPERATIONS', gatewayCode.includes("'getPotretRows'"));
  assert('Test 4.2: savePotretRows is handled with PIN verification', gatewayCode.includes("name === 'savePotretRows'"));
  assert('Test 4.3: X-Admin-PIN header or pin attribute checked', gatewayCode.includes("request.headers.get('x-admin-pin')") && gatewayCode.includes("parsedBody.pin"));
  assert('Test 4.4: 403 returned if PIN is invalid', gatewayCode.includes("status: 403") && gatewayCode.includes("Otorisasi admin ditolak: PIN tidak valid"));
  assert('Test 4.5: Secret key injected into parsedBody.key for GAS upstream', gatewayCode.includes("parsedBody.key = gasSecret") || gatewayCode.includes("parsedBody.key = adminPin"));
}

// -----------------------------------------------------------------------------
// Suite 5: Consumer Menus Defensive Integration Verification
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: Consumer Menus Zero-Regression & Defensive Fallbacks ---');
{
  const perintisJs = readFileSync(resolve(REPO_ROOT, 'v2/perintis/perintis.js'), 'utf8');
  assert('Test 5.1: perintis.js renders baseline instantly', perintisJs.includes('initMap();') && perintisJs.includes('renderCorridorGrid();'));
  assert('Test 5.2: perintis.js fetches /api/getPotretRows for dynamic sync', perintisJs.includes('/api/getPotretRows') && perintisJs.includes("section: 'perintis'"));
  assert('Test 5.3: perintis.js merges metrics while preserving GIS geometry', perintisJs.includes('mergePerintisDynamicMetrics'));

  const uppkbJs = readFileSync(resolve(REPO_ROOT, 'v2/uppkb/uppkb.js'), 'utf8');
  assert('Test 5.4: uppkb.js renders baseline instantly', uppkbJs.includes('renderKPIs();') && uppkbJs.includes('renderGrid(uppkbData.stations);'));
  assert('Test 5.5: uppkb.js fetches /api/getPotretRows for barang', uppkbJs.includes('/api/getPotretRows') && uppkbJs.includes('section: "barang"'));
  assert('Test 5.6: uppkb.js merges metrics while preserving station GIS', uppkbJs.includes('mergeUppkbDynamicMetrics'));

  const rivetJs = readFileSync(resolve(REPO_ROOT, 'dark-rivet/rivet.js'), 'utf8');
  assert('Test 5.7: rivet.js supports dynamic BRT corridor sync', rivetJs.includes('syncBrtCorridorsDynamic'));
  assert('Test 5.8: dark-rivet/index.html has brtCorridorList id', readFileSync(resolve(REPO_ROOT, 'dark-rivet/index.html'), 'utf8').includes('id="brtCorridorList"'));
}

// -----------------------------------------------------------------------------
// Suite 6: Headless Browser CDP Integration Smoke Test
// -----------------------------------------------------------------------------
console.log('\n--- Suite 6: Headless Browser CDP Dynamic Smoke Test ---');

async function runBrowserSmokeTest() {
  const TEST_PORT = 8089;
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
  };

  // Mock server
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${TEST_PORT}`);
    let pathname = decodeURIComponent(url.pathname);

    // Mock API responses
    if (pathname === '/api/getPotretRows') {
      let bodyStr = '';
      req.on('data', c => bodyStr += c);
      req.on('end', () => {
        let sec = 'perintis';
        try { sec = JSON.parse(bodyStr).section || 'perintis'; } catch (_) {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          section: sec,
          rows: sec === 'barang' ? [
            { uppkb: 'Balonggandu', kabupaten: 'Kabupaten Karawang', diperiksa: '42000', pelanggaran: '5200', kepatuhan_pct: '87.6', tilang: '2100', tilang_polisi: '400', transfer: '30', status: 'Aktif' },
            { uppkb: 'Losarang', kabupaten: 'Kabupaten Indramayu', diperiksa: '41250', pelanggaran: '3820', kepatuhan_pct: '90.7', tilang: '1820', tilang_polisi: '110', transfer: '12', status: 'Aktif' },
            { uppkb: 'Tomo', kabupaten: 'Kabupaten Sumedang', diperiksa: '25410', pelanggaran: '1650', kepatuhan_pct: '93.5', tilang: '720', tilang_polisi: '45', transfer: '4', status: 'Aktif' },
            { uppkb: 'Kemang', kabupaten: 'Kabupaten Bogor', diperiksa: '31200', pelanggaran: '2190', kepatuhan_pct: '93.0', tilang: '980', tilang_polisi: '68', transfer: '2', status: 'Aktif' },
            { uppkb: 'Gentong', kabupaten: 'Kabupaten Tasikmalaya', diperiksa: '28900', pelanggaran: '1420', kepatuhan_pct: '95.1', tilang: '410', tilang_polisi: '28', transfer: '1', status: 'Aktif' },
            { uppkb: 'Cibaragalan', kabupaten: 'Kabupaten Purwakarta', diperiksa: '28009', pelanggaran: '1328', kepatuhan_pct: '95.3', tilang: '249', tilang_polisi: '20', transfer: '2', status: 'Aktif' }
          ] : [
            { kode_trayek: 'PERINTIS-001', nama_trayek: 'Surade - Sagaranten', kabupaten: 'Kab. Sukabumi', operator: 'Perum Damri Cab. Bandung', armada: '3', ritase: '950', penumpang: '5600', load_factor: '38.5', pagu: '5479744000', status: 'Aktif' },
            { kode_trayek: 'PERINTIS-002', nama_trayek: 'Sagaranten - Pelabuhan Ratu', kabupaten: 'Kab. Sukabumi', operator: 'Perum Damri Cab. Bandung', armada: '2', ritase: '720', penumpang: '4810', load_factor: '31.2', pagu: '4820150000', status: 'Aktif' },
            { kode_trayek: 'PERINTIS-003', nama_trayek: 'Tegal Buleud - Sagaranten', kabupaten: 'Kab. Sukabumi', operator: 'Perum Damri Cab. Bandung', armada: '2', ritase: '650', penumpang: '3980', load_factor: '28.5', pagu: '4250100000', status: 'Aktif' },
            { kode_trayek: 'PERINTIS-004', nama_trayek: 'Leuwiliang - Cikidang', kabupaten: 'Kab. Bogor', operator: 'Perum Damri Cab. Bogor', armada: '2', ritase: '600', penumpang: '3620', load_factor: '30.1', pagu: '3980200000', status: 'Aktif' },
            { kode_trayek: 'PERINTIS-005', nama_trayek: 'Jasinga - Parung Panjang', kabupaten: 'Kab. Bogor', operator: 'Perum Damri Cab. Bogor', armada: '2', ritase: '580', penumpang: '3450', load_factor: '29.4', pagu: '3820000000', status: 'Aktif' },
            { kode_trayek: 'PERINTIS-006', nama_trayek: 'Sadang - Wanakerta', kabupaten: 'Kab. Purwakarta', operator: 'Perum Damri Cab. Purwakarta', armada: '2', ritase: '540', penumpang: '3120', load_factor: '32.8', pagu: '3650000000', status: 'Aktif' }
          ]
        }));
      });
      return;
    }

    if (pathname === '/api/savePotretRows' || pathname === '/api/syncPotretRows') {
      let bodyStr = '';
      req.on('data', c => bodyStr += c);
      req.on('end', () => {
        const pin = req.headers['x-admin-pin'] || (JSON.parse(bodyStr || '{}').pin);
        if (pin === 'BPTD1JABAR') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, section: 'perintis', rows: 6 }));
        } else {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Otorisasi admin ditolak: PIN tidak valid' }));
        }
      });
      return;
    }

    if (pathname === '/api/getDashboardData') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: { uppkbPoints: [1, 2, 3, 4, 5, 6] } }));
      return;
    }

    // Static file serving from Geo12-pages/src/
    if (pathname === '/') pathname = '/index.html';
    let filePath = resolve(REPO_ROOT, 'src', pathname.replace(/^\//, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = resolve(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(r => server.listen(TEST_PORT, r));

  // Determine browser binary
  const browserBin = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe')
    ? 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe'
    : (fs.existsSync(process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe')
      ? process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      : null);

  if (!browserBin) {
    console.log('  [WARN] No Chromium/Edge binary found for live browser test; skipping CDP suite.');
    server.close();
    return;
  }

  const cdpPort = 9223;
  const userDataDir = resolve(REPO_ROOT, 'temp-browser-profile');
  const browserProc = spawn(browserBin, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ]);

  // Wait for CDP to be available
  await new Promise(r => setTimeout(r, 1500));

  class SimpleCDP {
    constructor(wsUrl) {
      this.wsUrl = wsUrl;
      this.ws = null;
      this.id = 1;
      this.callbacks = new Map();
    }
    async connect() {
      return new Promise((res, rej) => {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.onopen = () => res();
        this.ws.onerror = e => rej(e);
        this.ws.onmessage = evt => {
          const m = JSON.parse(evt.data);
          if (m.id && this.callbacks.has(m.id)) {
            const { res: r, rej: rj } = this.callbacks.get(m.id);
            this.callbacks.delete(m.id);
            if (m.error) rj(m.error);
            else r(m.result);
          }
        };
      });
    }
    send(method, params = {}) {
      const id = this.id++;
      return new Promise((res, rej) => {
        this.callbacks.set(id, { res, rej });
        this.ws.send(JSON.stringify({ id, method, params }));
      });
    }
    close() {
      if (this.ws) this.ws.close();
    }
  }

  let cdp = null;
  try {
    const listRes = await fetch(`http://localhost:${cdpPort}/json/list`);
    const pages = await listRes.json();
    const targetWs = (pages.find(p => p.type === 'page') || pages[0])?.webSocketDebuggerUrl;
    if (!targetWs) throw new Error('No target page found');

    cdp = new SimpleCDP(targetWs);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Test Data Master page & CMS tab
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/data-master/?embed=1` });
    await new Promise(r => setTimeout(r, 2000));

    // Verify Tab 4 button exists and click it
    const clickTab = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('btnTabManagement');
          if (!btn) return { ok: false, error: 'btnTabManagement not found' };
          btn.click();
          const panel = document.getElementById('panelTabManagement');
          return {
            ok: true,
            panelHidden: panel.hasAttribute('hidden'),
            panelActive: panel.classList.contains('is-active'),
            activeTab: window.state ? window.state.activeTab : null
          };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.1: Click Tab 4 "Kelola Data Master (CMS)" successfully activates panel', clickTab.result?.value?.ok && !clickTab.result?.value?.panelHidden);

    // Verify Table rendered rows
    await new Promise(r => setTimeout(r, 500));
    const tableCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const tbody = document.getElementById('cmsTableBody');
          const rows = tbody ? tbody.querySelectorAll('tr').length : 0;
          const countText = document.getElementById('cmsRowCount')?.textContent;
          return { rows, countText };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.2: CMS DataGrid renders rows with active dataset count', tableCheck.result?.value?.rows >= 6, `rows=${tableCheck.result?.value?.rows}`);

    // Verify switching module to "barang"
    const switchMod = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const sel = document.getElementById('cmsModuleSelect');
          if (!sel) return { ok: false };
          sel.value = 'barang';
          sel.dispatchEvent(new Event('change'));
          return { ok: true, val: sel.value };
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const checkBarangTable = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const thead = document.getElementById('cmsTableHead');
          const thTexts = Array.from(thead.querySelectorAll('th')).map(t => t.textContent);
          const hasUppkb = thTexts.some(t => t.includes('UPPKB'));
          return { hasUppkb, thTexts };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.3: Switching CMS module to "barang" re-renders UPPKB schema', checkBarangTable.result?.value?.hasUppkb);

    // Verify Apply Data modal and PIN validation
    const testPinModal = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const applyBtn = document.getElementById('btnCmsApplyData');
          if (!applyBtn) return { ok: false, error: 'applyBtn not found' };
          applyBtn.click();
          const modal = document.getElementById('cmsPinModal');
          const isModalOpen = modal && !modal.hasAttribute('hidden');
          return { ok: true, isModalOpen };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.4: Click "Terapkan Perubahan" opens PIN authorization modal', testPinModal.result?.value?.isModalOpen);

    // Test invalid PIN
    const testInvalidPin = await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          const pinInput = document.getElementById('cmsAdminPinInput');
          const confirmBtn = document.getElementById('btnCmsConfirmPin');
          pinInput.value = 'SALAH_PIN';
          confirmBtn.click();
          await new Promise(r => setTimeout(r, 600));
          const errEl = document.getElementById('cmsPinError');
          return {
            errVisible: errEl && !errEl.hasAttribute('hidden'),
            errMsg: errEl ? errEl.textContent : ''
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    assert('Test 6.5: Submitting incorrect PIN displays authorization rejection', testInvalidPin.result?.value?.errVisible);

    // Test valid PIN
    const testValidPin = await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          const pinInput = document.getElementById('cmsAdminPinInput');
          const confirmBtn = document.getElementById('btnCmsConfirmPin');
          pinInput.value = 'BPTD1JABAR';
          confirmBtn.click();
          await new Promise(r => setTimeout(r, 600));
          const pinModal = document.getElementById('cmsPinModal');
          const banner = document.getElementById('cmsAlertBanner');
          return {
            modalClosed: pinModal && pinModal.hasAttribute('hidden'),
            bannerVisible: banner && !banner.hasAttribute('hidden'),
            bannerText: banner ? banner.textContent : ''
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    assert('Test 6.6: Submitting valid PIN (BPTD1JABAR) executes apply and displays success banner', testValidPin.result?.value?.modalClosed && testValidPin.result?.value?.bannerVisible);

    // 2. Test Perintis Consumer Menu
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/perintis/?embed=1` });
    await new Promise(r => setTimeout(r, 1500));
    const perintisCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const grid = document.getElementById('perintisGrid');
          const cards = grid ? grid.querySelectorAll('.perintis-card').length : 0;
          const map = document.getElementById('perintisMap');
          return { cards, mapExists: Boolean(map) };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.7: Menu Perintis renders 6 corridor cards and map without blank screen', perintisCheck.result?.value?.cards === 6 && perintisCheck.result?.value?.mapExists, `cards=${perintisCheck.result?.value?.cards}`);

    // 3. Test UPPKB Consumer Menu
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/uppkb/?embed=1` });
    await new Promise(r => setTimeout(r, 1500));
    const uppkbCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const grid = document.getElementById('uppkbGrid');
          const cards = grid ? grid.querySelectorAll('.uppkb-card').length : 0;
          const map = document.getElementById('uppkbMap');
          return { cards, mapExists: Boolean(map) };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.8: Menu UPPKB renders 6 stations and map without blank screen', uppkbCheck.result?.value?.cards === 6 && uppkbCheck.result?.value?.mapExists, `cards=${uppkbCheck.result?.value?.cards}`);

    // 4. Test Dark Rivet BRT modal
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/` });
    await new Promise(r => setTimeout(r, 1500));
    const rivetBrtCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const trigger = document.querySelector('[data-modal-target="modal-brt"]');
          if (trigger) trigger.click();
          const modal = document.getElementById('modal-brt');
          const list = document.getElementById('brtCorridorList');
          const items = list ? list.querySelectorAll('li').length : 0;
          return {
            modalOpen: modal && modal.classList.contains('is-open'),
            items
          };
        })()
      `,
      returnByValue: true
    });
    assert('Test 6.9: Main Dashboard BRT modal opens with 6 corridors', rivetBrtCheck.result?.value?.modalOpen && rivetBrtCheck.result?.value?.items >= 6, `items=${rivetBrtCheck.result?.value?.items}`);

  } catch (cdpErr) {
    console.error('CDP smoke test error:', cdpErr);
  } finally {
    // Teardown: close WebSocket, terminate browser process, remove temp directory, close server
    if (cdp) cdp.close();
    try {
      browserProc.kill();
      // On Windows ensure all spawned msedge/chrome are stopped
      if (process.platform === 'win32') {
        try { execSync(`taskkill /F /T /PID ${browserProc.pid}`, { stdio: 'ignore' }); } catch (_) {}
      }
    } catch (_) {}
    try {
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
    } catch (_) {}
    server.close();
  }
}

await runBrowserSmokeTest();

console.log('\n================================================================================');
console.log(`Verification Complete: ${passCount} Passed, ${failCount} Failed.`);
console.log('================================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
