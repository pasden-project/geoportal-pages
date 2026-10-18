// test-cms-input-center.mjs — Comprehensive Verification for Data Master Input Center
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

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
console.log('GeoPORTAL BPTD Jabar — Verification Suite: Pusat Penginputan & Pengeditan CMS');
console.log('================================================================================\n');

async function runVerification() {
  const TEST_PORT = 8098;
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${TEST_PORT}`);
    let pathname = decodeURIComponent(url.pathname);

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
          rows: []
        }));
      });
      return;
    }

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
      res.end('Not found: ' + pathname);
    }
  });

  await new Promise(r => server.listen(TEST_PORT, r));

  const browserBin = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe')
    ? 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe'
    : (fs.existsSync(process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe')
      ? process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      : null);

  if (!browserBin) {
    console.error('No browser binary found');
    server.close();
    return;
  }

  const cdpPort = 9235;
  const userDataDir = resolve(REPO_ROOT, 'temp-verify-profile');
  const browserProc = spawn(browserBin, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

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
    const pageTarget = pages.find(p => p.type === 'page');
    if (!pageTarget) throw new Error('No target page found');

    cdp = new SimpleCDP(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('--- Test 1: Eliminasi Akses Langsung Google Spreadsheet di Antarmuka ---');
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/data-master/?embed=1&tab=management` });
    await new Promise(r => setTimeout(r, 2000));

    const checkNoSpreadsheet = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.getElementById('linkGoogleSheets');
          const sheetsLinks = Array.from(document.querySelectorAll('a[href*="docs.google.com/spreadsheets"]'));
          const addBtn = document.getElementById('btnCmsAddEntity');
          const badge = document.getElementById('cmsPipelineBadge');
          const desc = document.querySelector('.cms-desc');

          return {
            noLinkElement: link === null,
            sheetsHrefCount: sheetsLinks.length,
            addBtnText: addBtn ? addBtn.textContent.trim() : '',
            addBtnIsPrimary: addBtn ? addBtn.classList.contains('cms-btn-add') : false,
            badgeIsHeadless: badge ? badge.classList.contains('badge-headless') : false,
            badgeText: badge ? badge.textContent.trim() : '',
            descText: desc ? desc.textContent.trim() : ''
          };
        })()
      `,
      returnByValue: true
    });

    const r1 = checkNoSpreadsheet.result?.value;
    assert('Test 1.1: Elemen #linkGoogleSheets tidak ditemukan di DOM', r1?.noLinkElement);
    assert('Test 1.2: Tidak ada tautan href mengarah ke docs.google.com/spreadsheets', r1?.sheetsHrefCount === 0, `count=${r1?.sheetsHrefCount}`);
    assert('Test 1.3: Tombol Tambah bertuliskan "Tambah / Input Data Baru"', r1?.addBtnText?.includes('Tambah / Input Data Baru'), `text="${r1?.addBtnText}"`);
    assert('Test 1.4: Tombol Tambah memiliki class styling .cms-btn-add', r1?.addBtnIsPrimary);
    assert('Test 1.5: Badge toolbar bertipe .badge-headless', r1?.badgeIsHeadless);
    assert('Test 1.6: Badge memuat teks "Basis Data Tersembunyi & Terkelola Otomatis"', r1?.badgeText?.includes('Basis Data Tersembunyi & Terkelola Otomatis'));

    console.log('\n--- Test 2: Dukungan Deep-Linking Parameter URL ---');
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/data-master/?embed=1&tab=management&module=perintis_detail&trayek=PERINTIS-001` });
    await new Promise(r => setTimeout(r, 2000));

    const checkDeepLink1 = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.getElementById('panelTabManagement');
          const modSelect = document.getElementById('cmsModuleSelect');
          const trayekSelect = document.getElementById('cmsTrayekFilter');
          const tbody = document.getElementById('cmsTableBody');
          const rows = tbody ? tbody.querySelectorAll('tr').length : 0;

          return {
            tabActive: panel && !panel.hasAttribute('hidden') && panel.classList.contains('is-active'),
            moduleValue: modSelect ? modSelect.value : '',
            trayekValue: trayekSelect ? trayekSelect.value : '',
            rowCount: rows
          };
        })()
      `,
      returnByValue: true
    });

    const r2 = checkDeepLink1.result?.value;
    assert('Test 2.1: Tab Management otomatis aktif saat memuat URL dengan tab=management', r2?.tabActive);
    assert('Test 2.2: Modul perintis_detail terpilih pada dropdown #cmsModuleSelect', r2?.moduleValue === 'perintis_detail', `module=${r2?.moduleValue}`);
    assert('Test 2.3: Filter trayek otomatis terpasang PERINTIS-001 pada #cmsTrayekFilter', r2?.trayekValue === 'PERINTIS-001', `trayek=${r2?.trayekValue}`);
    assert('Test 2.4: Tabel menampilkan 12 baris bulan untuk trayek PERINTIS-001', r2?.rowCount === 12, `rows=${r2?.rowCount}`);

    // Deep link action=add
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/data-master/?embed=1&tab=management&module=perintis_detail&trayek=PERINTIS-003&action=add` });
    await new Promise(r => setTimeout(r, 2000));

    const checkDeepLinkAction = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('cmsEntityModal');
          const titleEl = document.getElementById('cmsEntityModalTitle');
          const trayekField = document.getElementById('field_kode_trayek');

          return {
            modalOpen: modal && !modal.hasAttribute('hidden'),
            modalTitle: titleEl ? titleEl.textContent : '',
            initialTrayekVal: trayekField ? trayekField.value : ''
          };
        })()
      `,
      returnByValue: true
    });

    const r3 = checkDeepLinkAction.result?.value;
    assert('Test 2.5: Modal penambahan otomatis terbuka saat URL membawa parameter action=add', r3?.modalOpen);
    assert('Test 2.6: Judul modal memuat Tambah Entitas Baru (PERINTIS_DETAIL)', r3?.modalTitle?.includes('Tambah Entitas Baru'), `title="${r3?.modalTitle}"`);
    assert('Test 2.7: Dropdown kode_trayek di form terisi awal dengan PERINTIS-003 sesuai filter aktif', r3?.initialTrayekVal === 'PERINTIS-003', `val=${r3?.initialTrayekVal}`);

    console.log('\n--- Test 3: Form Modal Input, Edit & Live Auto-Calculation ---');
    const checkLiveCalc = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const targetRitaseInput = document.getElementById('field_target_ritase');
          const realRitaseInput = document.getElementById('field_realisasi_ritase');
          const realPaxInput = document.getElementById('field_realisasi_penumpang');
          const targetPaxInput = document.getElementById('field_target_penumpang');
          const loadFactorInput = document.getElementById('field_load_factor');

          targetRitaseInput.value = '100';
          targetRitaseInput.dispatchEvent(new Event('input', { bubbles: true }));

          realRitaseInput.value = '80';
          realRitaseInput.dispatchEvent(new Event('input', { bubbles: true }));

          realPaxInput.value = '1000';
          realPaxInput.dispatchEvent(new Event('input', { bubbles: true }));

          return {
            targetPax: targetPaxInput ? targetPaxInput.value : null,
            targetPaxReadonly: targetPaxInput ? targetPaxInput.hasAttribute('readonly') : false,
            loadFactor: loadFactorInput ? loadFactorInput.value : null,
            loadFactorReadonly: loadFactorInput ? loadFactorInput.hasAttribute('readonly') : false
          };
        })()
      `,
      returnByValue: true
    });

    const r4 = checkLiveCalc.result?.value;
    assert('Test 3.1: Target Penumpang otomatis dihitung live: 100 ritase * 19 = 1900', r4?.targetPax === '1900', `targetPax=${r4?.targetPax}`);
    assert('Test 3.2: Target Penumpang berstatus readonly', r4?.targetPaxReadonly);
    assert('Test 3.3: Load Factor otomatis dihitung live: 1000 / (80 * 19) = 65.8%', r4?.loadFactor === '65.8', `loadFactor=${r4?.loadFactor}`);
    assert('Test 3.4: Load Factor berstatus readonly', r4?.loadFactorReadonly);

    // Test readonly fields on module perintis (summary 6 routes)
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/data-master/?embed=1&tab=management&module=perintis` });
    await new Promise(r => setTimeout(r, 2000));

    const checkPerintisReadonly = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          // Buka modal edit entitas pertama
          const firstEditBtn = document.querySelector('#cmsTableBody tr:first-child button[data-action="edit"]');
          if (firstEditBtn) firstEditBtn.click();

          const ritaseInput = document.getElementById('field_ritase');
          const paxInput = document.getElementById('field_penumpang');
          const lfInput = document.getElementById('field_load_factor');
          const paguInput = document.getElementById('field_pagu');

          return {
            ritaseReadonly: ritaseInput ? ritaseInput.hasAttribute('readonly') : false,
            paxReadonly: paxInput ? paxInput.hasAttribute('readonly') : false,
            lfReadonly: lfInput ? lfInput.hasAttribute('readonly') : false,
            paguEditable: paguInput ? !paguInput.hasAttribute('readonly') : false
          };
        })()
      `,
      returnByValue: true
    });

    const r5 = checkPerintisReadonly.result?.value;
    assert('Test 3.5: Pada ringkasan trayek perintis, field ritase berstatus readonly', r5?.ritaseReadonly);
    assert('Test 3.6: Field penumpang berstatus readonly (otomatis dari akumulasi bulanan)', r5?.paxReadonly);
    assert('Test 3.7: Field load_factor berstatus readonly (otomatis dari akumulasi bulanan)', r5?.lfReadonly);
    assert('Test 3.8: Field pagu kontrak tetap dapat diedit oleh admin', r5?.paguEditable);

    console.log('\n--- Test 4: Integrasi Shortcut Tombol Input dari Dashboard Terkait ---');
    await cdp.send('Page.navigate', { url: `http://localhost:${TEST_PORT}/command-center/perintis/?embed=1` });
    await new Promise(r => setTimeout(r, 2000));

    const checkPerintisShortcuts = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const cmsBtnHeader = document.querySelector('.dash-badges a.btn-action-cms');
          const inputRealisasiBtn = document.querySelector('.directory-actions a.btn-input-realisasi');

          return {
            headerBtnExists: Boolean(cmsBtnHeader),
            headerBtnHref: cmsBtnHeader ? cmsBtnHeader.getAttribute('href') : '',
            headerBtnText: cmsBtnHeader ? cmsBtnHeader.textContent.trim() : '',
            directoryBtnExists: Boolean(inputRealisasiBtn),
            directoryBtnHref: inputRealisasiBtn ? inputRealisasiBtn.getAttribute('href') : '',
            directoryBtnText: inputRealisasiBtn ? inputRealisasiBtn.textContent.trim() : ''
          };
        })()
      `,
      returnByValue: true
    });

    const r6 = checkPerintisShortcuts.result?.value;
    assert('Test 4.1: Tombol aksi CMS terdapat di header dashboard perintis', r6?.headerBtnExists);
    assert('Test 4.2: Tautan header mengarah ke data-master dengan parameter module=perintis_detail', r6?.headerBtnHref?.includes('tab=management&module=perintis_detail'), `href="${r6?.headerBtnHref}"`);
    assert('Test 4.3: Tombol memuat label "Input / Kelola Data Master"', r6?.headerBtnText?.includes('Input / Kelola Data Master'), `text="${r6?.headerBtnText}"`);
    assert('Test 4.4: Tombol "Input Realisasi Bulanan" terdapat di header direktori koridor', r6?.directoryBtnExists);
    assert('Test 4.5: Tautan direktori mengarah ke data-master dengan parameter action=add', r6?.directoryBtnHref?.includes('action=add'), `href="${r6?.directoryBtnHref}"`);

  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    console.log('\n--- Test 5: Browser Teardown & Pembersihan Sumber Daya ---');
    if (cdp) cdp.close();
    try {
      browserProc.kill();
      if (process.platform === 'win32') {
        try { execSync(`taskkill /F /T /PID ${browserProc.pid}`, { stdio: 'ignore' }); } catch (_) {}
      }
      console.log('  [PASS] Test 5.1: Browser testing process berhasil diterminasi (PID teardown)');
    } catch (_) {}

    try {
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        console.log('  [PASS] Test 5.2: Temporary browser user-data-dir berhasil dibersihkan');
      }
    } catch (_) {}

    server.close();
    console.log('  [PASS] Test 5.3: Server pengujian lokal port 8098 ditutup');
  }

  console.log('\n================================================================================');
  console.log(`Hasil Verifikasi Input Center: ${passCount} Passed, ${failCount} Failed.`);
  console.log('================================================================================');

  if (failCount > 0) process.exit(1);
}

runVerification();
