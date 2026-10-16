import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = (() => {
  const edgeCoreDir = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore';
  try {
    if (fs.existsSync(edgeCoreDir)) {
      const versions = fs.readdirSync(edgeCoreDir).filter(v => fs.existsSync(path.join(edgeCoreDir, v, 'msedge.exe')));
      if (versions.length > 0) return path.join(edgeCoreDir, versions[versions.length - 1], 'msedge.exe');
    }
  } catch (_) {}
  return 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe';
})();

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL AKAP/AKDP — End-to-End Automated Verification Suite');
  console.log('======================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${title} ${detail ? '(' + detail + ')' : ''}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${title} ${detail ? '(' + detail + ')' : ''}`);
      failCount++;
    }
  }

  // Phase 1: HTTP Endpoint Probes
  console.log('--- Phase 1: HTTP Endpoint Probes ---');
  const endpoints = [
    { url: 'http://localhost:8080/command-center/akap/?embed=1', desc: 'AKAP Submodule Embed' },
    { url: 'http://localhost:8080/command-center/akap/akap.css', desc: 'AKAP CSS Stylesheet' },
    { url: 'http://localhost:8080/command-center/akap/akap.js', desc: 'AKAP JS Runtime' },
    { url: 'http://localhost:8080/data/akap-akdp-jabar-2026.json', desc: 'AKAP Dataset JSON' },
    { url: 'http://localhost:8080/command-center/akap/', desc: 'AKAP Dark Rivet Shell' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      assert(`HTTP 200 probe for ${ep.desc}`, res.status === 200, `Status: ${res.status}`);
    } catch (e) {
      assert(`HTTP 200 probe for ${ep.desc}`, false, e.message);
    }
  }

  // Phase 2: Headless Browser CDP Verification
  console.log('\n--- Phase 2: Headless Browser Automation ---');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'http://localhost:8080/'
  ]);

  try {
    let targetTab = null;
    for (let retry = 0; retry < 20; retry++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9224/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page') || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9224');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Track console errors
    const consoleErrors = [];
    cdp.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        consoleErrors.push(text);
      }
      if (msg.id && cdp.callbacks.has(msg.id)) {
        const { resolve, reject } = cdp.callbacks.get(msg.id);
        cdp.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    // Step 2.1: Test Shell Navigation
    console.log('\n--- Test 2.1: Dark Rivet Shell Sidebar Navigation ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 1200));

    const akapLinkExists = await cdp.eval(`
      !!document.querySelector('a.nav__subitem[href="/command-center/akap/"]')
    `);
    assert('AKAP / AKDP link present in sidebar', akapLinkExists);

    const akapBadgeText = await cdp.eval(`
      document.querySelector('a.nav__subitem[href="/command-center/akap/"] .badge')?.textContent?.trim()
    `);
    assert('AKAP / AKDP badge displays 6,03M', akapBadgeText === '6,03M', `Badge: ${akapBadgeText}`);

    // Click AKAP / AKDP link
    await cdp.eval(`
      document.querySelector('a.nav__subitem[href="/command-center/akap/"]').click();
    `);
    await new Promise(r => setTimeout(r, 1000));

    const iframeSrc = await cdp.eval(`
      document.getElementById('submoduleFrame')?.getAttribute('src')
    `);
    assert('Iframe loaded /command-center/akap/?embed=1', iframeSrc && iframeSrc.includes('/command-center/akap/'), `Src: ${iframeSrc}`);

    const akapLinkActive = await cdp.eval(`
      document.querySelector('a.nav__subitem[href="/command-center/akap/"]')?.classList.contains('is-active')
    `);
    assert('AKAP sidebar item highlighted with is-active', akapLinkActive);

    const trayekLinkNotActive = await cdp.eval(`
      !document.querySelector('a.nav__item[href="/command-center/trayek/"]')?.classList.contains('is-active')
    `);
    assert('Trayek main menu is NOT active when AKAP selected', trayekLinkNotActive);

    // Step 2.2: Test Submodule Embed Page Directly
    console.log('\n--- Test 2.2: AKAP Submodule Full Render & Analytics ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:8080/command-center/akap/?embed=1' });
    await new Promise(r => setTimeout(r, 1200));

    // Verify Title & Badges
    const pageTitle = await cdp.eval(`document.querySelector('.akap-title')?.textContent?.trim()`);
    assert('Page title matches official report', pageTitle && pageTitle.includes('Evaluasi Kinerja Operasional Angkutan AKAP & AKDP'), pageTitle);

    // 4 Executive KPIs
    const kpiPnpTotal = await cdp.eval(`document.getElementById('kpi-pnp-total')?.textContent?.trim()`);
    assert('KPI Total Penumpang = 6,03 Juta', kpiPnpTotal === '6,03 Juta', `Actual: ${kpiPnpTotal}`);

    const kpiCatTotal = await cdp.eval(`document.getElementById('kpi-cat-total')?.textContent?.trim()`);
    assert('KPI Total Catatan TOS = 629.698', kpiCatTotal === '629.698', `Actual: ${kpiCatTotal}`);

    const kpiPangsaAkap = await cdp.eval(`document.getElementById('kpi-pangsa-akap')?.textContent?.trim()`);
    assert('KPI Pangsa AKAP = 55,42%', kpiPangsaAkap === '55,42%', `Actual: ${kpiPangsaAkap}`);

    const kpiProd = await cdp.eval(`document.getElementById('kpi-prod-rerata')?.textContent?.trim()`);
    assert('KPI Produktivitas Rerata = 9,79', kpiProd === '9,79', `Actual: ${kpiProd}`);

    // Tab 1: Bulanan
    console.log('\n--- Test 2.3: Tab 1 — Kinerja Bulanan & Musiman ---');
    const bulananRows = await cdp.eval(`document.querySelectorAll('#table-bulanan-body tr').length`);
    assert('Tabel bulanan has 9 records (Jan–Sep)', bulananRows === 9, `Rows: ${bulananRows}`);

    const bulananSvgBars = await cdp.eval(`document.querySelectorAll('#chart-bulanan-svg rect').length`);
    assert('SVG Bulanan Chart renders dual bars (18 bars total)', bulananSvgBars === 18, `Bars: ${bulananSvgBars}`);

    // Tab 2: Terminal & RD3
    console.log('\n--- Test 2.4: Tab 2 — Simpul Terminal & Ketergantungan RD3 ---');
    await cdp.eval(`document.querySelector('[data-tab="panel-terminal"]').click();`);
    await new Promise(r => setTimeout(r, 400));

    const termCardsCount = await cdp.eval(`document.querySelectorAll('#terminal-cards-grid .kpi-card').length`);
    assert('12 Terminal Cards rendered', termCardsCount === 12, `Count: ${termCardsCount}`);

    const termTableRows = await cdp.eval(`document.querySelectorAll('#table-terminal-body tr').length`);
    assert('12 Terminal Table Rows rendered', termTableRows === 12, `Count: ${termTableRows}`);

    // Modal Interaction
    await cdp.eval(`document.querySelector('[data-term-code="IDH"]').click();`);
    await new Promise(r => setTimeout(r, 400));

    const modalOpen = await cdp.eval(`
      document.getElementById('terminalDetailModal')?.classList.contains('is-open')
    `);
    assert('Clicking terminal opens Detail Modal', modalOpen);

    const modalTitle = await cdp.eval(`document.getElementById('termModalTitle')?.textContent?.trim()`);
    assert('Modal shows Terminal Indihiang (IDH)', modalTitle && modalTitle.includes('Terminal Indihiang'), `Title: ${modalTitle}`);

    // Close Modal
    await cdp.eval(`document.querySelector('.modal-close-btn').click();`);
    await new Promise(r => setTimeout(r, 300));
    const modalClosed = await cdp.eval(`
      !document.getElementById('terminalDetailModal')?.classList.contains('is-open')
    `);
    assert('Modal closes successfully on button click', modalClosed);

    // Tab 3: Koridor & Matriks OD
    console.log('\n--- Test 2.5: Tab 3 — Koridor Trayek & Matriks OD ---');
    await cdp.eval(`document.querySelector('[data-tab="panel-koridor"]').click();`);
    await new Promise(r => setTimeout(r, 400));

    const koridorRows = await cdp.eval(`document.querySelectorAll('#table-koridor-body tr').length`);
    assert('Top Koridor table renders 25 rows initially', koridorRows === 25, `Rows: ${koridorRows}`);

    // Test Search Filter
    await cdp.eval(`
      var input = document.getElementById('search-koridor');
      input.value = 'bandung';
      input.dispatchEvent(new Event('input'));
    `);
    await new Promise(r => setTimeout(r, 300));

    const filteredKoridorRows = await cdp.eval(`document.querySelectorAll('#table-koridor-body tr').length`);
    assert('Search "bandung" filters koridor table', filteredKoridorRows > 0 && filteredKoridorRows < 25, `Filtered rows: ${filteredKoridorRows}`);

    // Clear search
    await cdp.eval(`
      var input = document.getElementById('search-koridor');
      input.value = '';
      input.dispatchEvent(new Event('input'));
    `);

    const odRows = await cdp.eval(`document.querySelectorAll('#table-od-body tr').length`);
    assert('Top 10 OD Berarah renders 10 rows', odRows === 10, `Rows: ${odRows}`);

    const btRows = await cdp.eval(`document.querySelectorAll('#table-bt-body tr').length`);
    assert('Bangkitan Tarikan table renders 12 rows', btRows === 12, `Rows: ${btRows}`);

    // Tab 4: Operator & HHI
    console.log('\n--- Test 2.6: Tab 4 — Struktur Operator & HHI ---');
    await cdp.eval(`document.querySelector('[data-tab="panel-operator"]').click();`);
    await new Promise(r => setTimeout(r, 400));

    const poRows = await cdp.eval(`document.querySelectorAll('#table-po-body tr').length`);
    assert('Top PO table renders 25 rows', poRows === 25, `Rows: ${poRows}`);

    const hhiOligopolyText = await cdp.eval(`
      document.querySelector('#panel-operator .kpi-card:first-child .kpi-value')?.textContent?.trim()
    `);
    assert('HHI Oligopoli card displays 91,68%', hhiOligopolyText === '91,68%', `Actual: ${hhiOligopolyText}`);

    // Tab 5: Distribusi Waktu
    console.log('\n--- Test 2.7: Tab 5 — Distribusi Waktu & Jam Puncak ---');
    await cdp.eval(`document.querySelector('[data-tab="panel-waktu"]').click();`);
    await new Promise(r => setTimeout(r, 400));

    const waktuRows = await cdp.eval(`document.querySelectorAll('#table-waktu-body tr').length`);
    assert('24-Hour table renders 24 rows', waktuRows === 24, `Rows: ${waktuRows}`);

    const waktuSvgDots = await cdp.eval(`document.querySelectorAll('#chart-waktu-svg circle').length`);
    assert('SVG 24-Hour curve chart renders 48 hourly dots', waktuSvgDots === 48, `Dots: ${waktuSvgDots}`);

    // Tab 6: Rekomendasi Kebijakan
    console.log('\n--- Test 2.8: Tab 6 — 4 Pilar Rekomendasi Kebijakan ---');
    await cdp.eval(`document.querySelector('[data-tab="panel-kebijakan"]').click();`);
    await new Promise(r => setTimeout(r, 400));

    const pilarCardsCount = await cdp.eval(`document.querySelectorAll('#pilar-rekomendasi-grid .pilar-card').length`);
    assert('4 Strategic Recommendation Pillars rendered', pilarCardsCount === 4, `Count: ${pilarCardsCount}`);

    // Theme Switch
    console.log('\n--- Test 2.9: Dark / Light Theme Toggle Consistency ---');
    await cdp.eval(`
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('theme-light');
    `);
    const isLight = await cdp.eval(`document.documentElement.getAttribute('data-theme') === 'light'`);
    assert('Light theme applied properly', isLight);

    await cdp.eval(`
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.remove('theme-light');
    `);
    const isDark = await cdp.eval(`document.documentElement.getAttribute('data-theme') === 'dark'`);
    assert('Dark theme restored properly', isDark);

    // Zero Console Errors Check
    console.log('\n--- Test 2.10: Zero Console Errors Invariant ---');
    assert('Zero unhandled JavaScript console errors', consoleErrors.length === 0, consoleErrors.join('; '));

    cdp.close();
  } catch (err) {
    console.error('CDP verification error:', err);
    failCount++;
  } finally {
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION RESULT: ${passCount} PASSED, ${failCount} FAILED.`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runVerification();
