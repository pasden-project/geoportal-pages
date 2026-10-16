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
  return 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.62\\msedge.exe';
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
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

async function runVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Multi-Year Terminal Ranking Automated Verification');
  console.log('======================================================================\n');

  const debugPort = 9228;
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--window-size=1440,1050',
    '--hide-scrollbars',
    'http://localhost:8080/'
  ]);

  let passCount = 0;
  let failCount = 0;
  const consoleErrors = [];

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${title} ${detail ? '(' + detail + ')' : ''}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${title} ${detail ? '(' + detail + ')' : ''}`);
      failCount++;
    }
  }

  let cdp = null;

  try {
    let targetTab = null;
    for (let retry = 0; retry < 15; retry++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json`);
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8080'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error(`Target tab not found on port ${debugPort}`);

    cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();

    // Listen to console errors
    cdp.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
          consoleErrors.push(msg.params.args?.map(a => a.value || a.description).join(' '));
        }
      } catch (_) {}
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8080/' });

    // Wait for initial render of terminal ranking items
    let loaded = false;
    for (let i = 0; i < 40; i++) {
      const count = await cdp.eval(`document.querySelectorAll('#terminalRankList .rank-item').length`);
      if (count === 5) {
        loaded = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    assert('Test 0: Inisialisasi awal dashboard berhasil memuat 5 item peringkat', loaded);

    // Helper to get card ranking items
    async function getRankingItems() {
      return await cdp.eval(`
        (() => {
          const card = document.getElementById('cardTerminalRank');
          if (!card) return null;
          const items = Array.from(card.querySelectorAll('#terminalRankList .rank-item')).map(el => ({
            name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
            sub: el.querySelector('.rank-item__sub')?.textContent?.trim() || '',
            val: el.querySelector('.rank-item__val')?.textContent?.trim() || '',
            share: el.querySelector('.rank-item__share')?.textContent?.trim() || ''
          }));
          const footer = card.querySelector('#terminalRankFooter')?.textContent?.trim() || '';
          return { items, footer };
        })()
      `);
    }

    // Helper to set metric tab
    async function setMetricTab(metric) {
      await cdp.eval(`
        (() => {
          const btn = document.querySelector('#terminalRankTabs .rank-tab-btn[data-metric="${metric}"]');
          if (btn) btn.click();
        })()
      `);
      const expectedUnit = (metric === 'penumpang') ? 'pnp' : 'knd';
      for (let i = 0; i < 20; i++) {
        const firstVal = await cdp.eval(`document.querySelector('#terminalRankList .rank-item .rank-item__val')?.textContent || ''`);
        if (firstVal.includes(expectedUnit)) break;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Helper to switch year
    async function switchYear(year) {
      await cdp.eval(`
        (() => {
          const sel = document.getElementById('yearSelect');
          if (sel) {
            sel.value = String(${year});
            sel.dispatchEvent(new Event('change'));
          }
        })()
      `);
      await new Promise(r => setTimeout(r, 400));
    }

    // ==========================================
    // 1. SCENARIO 1: YEAR 2026 (Live YTD Baseline)
    // ==========================================
    console.log('\n--- Skenario 1: Verifikasi Mode 2026 (YTD Baseline) ---');
    const yr2026Pnp = await getRankingItems();
    assert('Test 1.1: Mode 2026 Penumpang memuat 5 peringkat teratas', yr2026Pnp && yr2026Pnp.items.length === 5, `count: ${yr2026Pnp?.items?.length}`);
    assert('Test 1.2: #1 Leuwipanjang (1.626.514 pnp)',
      yr2026Pnp?.items[0]?.name.includes('Leuwipanjang') && yr2026Pnp?.items[0]?.val.includes('1.626.514'),
      `${yr2026Pnp?.items[0]?.name} - ${yr2026Pnp?.items[0]?.val}`);
    assert('Test 1.3: #2 Garut / Guntur Melati (1.090.828 pnp)',
      (yr2026Pnp?.items[1]?.name.includes('Guntur') || yr2026Pnp?.items[1]?.sub.includes('Garut') || yr2026Pnp?.items[1]?.name.includes('Garut')) && yr2026Pnp?.items[1]?.val.includes('1.090.828'),
      `${yr2026Pnp?.items[1]?.name} - ${yr2026Pnp?.items[1]?.val}`);
    assert('Test 1.4: #3 Tasikmalaya / Indihiang (701.273 pnp)',
      (yr2026Pnp?.items[2]?.name.includes('Indihiang') || yr2026Pnp?.items[2]?.sub.includes('Tasikmalaya') || yr2026Pnp?.items[2]?.name.includes('Tasikmalaya')) && yr2026Pnp?.items[2]?.val.includes('701.273'),
      `${yr2026Pnp?.items[2]?.name} - ${yr2026Pnp?.items[2]?.val}`);
    assert('Test 1.5: Total terpetakan Penumpang 2026 sesuai grand total (6.743.004 pnp)',
      yr2026Pnp?.footer.includes('6.743.004'), yr2026Pnp?.footer);

    // Toggle Kendaraan 2026
    await setMetricTab('kendaraan');
    const yr2026Knd = await getRankingItems();
    assert('Test 1.6: Mode 2026 Kendaraan #1 Leuwipanjang (134.044 knd)',
      yr2026Knd?.items[0]?.name.includes('Leuwipanjang') && yr2026Knd?.items[0]?.val.includes('134.044'),
      `${yr2026Knd?.items[0]?.name} - ${yr2026Knd?.items[0]?.val}`);
    assert('Test 1.7: Mode 2026 Kendaraan #2 Tasikmalaya / Indihiang (100.676 knd)',
      (yr2026Knd?.items[1]?.name.includes('Indihiang') || yr2026Knd?.items[1]?.sub.includes('Tasikmalaya') || yr2026Knd?.items[1]?.name.includes('Tasikmalaya')) && yr2026Knd?.items[1]?.val.includes('100.676'),
      `${yr2026Knd?.items[1]?.name} - ${yr2026Knd?.items[1]?.val}`);
    assert('Test 1.8: Total terpetakan Kendaraan 2026 sesuai grand total (753.257 knd)',
      yr2026Knd?.footer.includes('753.257'), yr2026Knd?.footer);

    await setMetricTab('penumpang');

    // ==========================================
    // 2. SCENARIO 2: YEAR 2025 (Rekap 12 Bulan)
    // ==========================================
    console.log('\n--- Skenario 2: Verifikasi Mode 2025 (Rekap 12 Bulan) ---');
    await switchYear(2025);
    const yr2025Pnp = await getRankingItems();
    assert('Test 2.1: Mode 2025 Penumpang memuat 5 peringkat teratas', yr2025Pnp && yr2025Pnp.items.length === 5, `count: ${yr2025Pnp?.items?.length}`);
    assert('Test 2.2: #1 Leuwipanjang (2.478.900 pnp)',
      yr2025Pnp?.items[0]?.name.includes('Leuwipanjang') && yr2025Pnp?.items[0]?.val.includes('2.478.900'),
      `${yr2025Pnp?.items[0]?.name} - ${yr2025Pnp?.items[0]?.val}`);
    assert('Test 2.3: #2 Garut / Guntur Melati (1.309.199 pnp)',
      (yr2025Pnp?.items[1]?.name.includes('Guntur') || yr2025Pnp?.items[1]?.sub.includes('Garut')) && yr2025Pnp?.items[1]?.val.includes('1.309.199'),
      `${yr2025Pnp?.items[1]?.name} - ${yr2025Pnp?.items[1]?.val}`);
    assert('Test 2.4: #3 Tasikmalaya / Indihiang (940.847 pnp)',
      (yr2025Pnp?.items[2]?.name.includes('Indihiang') || yr2025Pnp?.items[2]?.sub.includes('Tasikmalaya')) && yr2025Pnp?.items[2]?.val.includes('940.847'),
      `${yr2025Pnp?.items[2]?.name} - ${yr2025Pnp?.items[2]?.val}`);
    assert('Test 2.5: #4 Sukabumi / KH Ahmad Sanusi (840.023 pnp)',
      (yr2025Pnp?.items[3]?.name.includes('Sanusi') || yr2025Pnp?.items[3]?.sub.includes('Sukabumi')) && yr2025Pnp?.items[3]?.val.includes('840.023'),
      `${yr2025Pnp?.items[3]?.name} - ${yr2025Pnp?.items[3]?.val}`);
    assert('Test 2.6: #5 Sumedang / Ciakar (398.946 pnp)',
      (yr2025Pnp?.items[4]?.name.includes('Ciakar') || yr2025Pnp?.items[4]?.sub.includes('Sumedang')) && yr2025Pnp?.items[4]?.val.includes('398.946'),
      `${yr2025Pnp?.items[4]?.name} - ${yr2025Pnp?.items[4]?.val}`);
    assert('Test 2.7: Total terpetakan Penumpang 2025 sesuai grand total (7.099.215 pnp)',
      yr2025Pnp?.footer.includes('7.099.215'), yr2025Pnp?.footer);

    // Toggle Kendaraan 2025
    await setMetricTab('kendaraan');
    const yr2025Knd = await getRankingItems();
    assert('Test 2.8: Mode 2025 Kendaraan #1 Leuwipanjang (177.460 knd)',
      yr2025Knd?.items[0]?.name.includes('Leuwipanjang') && yr2025Knd?.items[0]?.val.includes('177.460'),
      `${yr2025Knd?.items[0]?.name} - ${yr2025Knd?.items[0]?.val}`);
    assert('Test 2.9: Mode 2025 Kendaraan #2 Tasikmalaya / Indihiang (145.275 knd)',
      (yr2025Knd?.items[1]?.name.includes('Indihiang') || yr2025Knd?.items[1]?.sub.includes('Tasikmalaya')) && yr2025Knd?.items[1]?.val.includes('145.275'),
      `${yr2025Knd?.items[1]?.name} - ${yr2025Knd?.items[1]?.val}`);
    assert('Test 2.10: Mode 2025 Kendaraan #3 Garut / Guntur Melati (103.550 knd)',
      (yr2025Knd?.items[2]?.name.includes('Guntur') || yr2025Knd?.items[2]?.sub.includes('Garut')) && yr2025Knd?.items[2]?.val.includes('103.550'),
      `${yr2025Knd?.items[2]?.name} - ${yr2025Knd?.items[2]?.val}`);
    assert('Test 2.11: Total terpetakan Kendaraan 2025 sesuai grand total (820.646 knd)',
      yr2025Knd?.footer.includes('820.646'), yr2025Knd?.footer);

    // Pastikan tidak ada terminal dengan nilai 0
    const noZero2025 = yr2025Knd?.items.every(i => !i.val.includes(' 0 ') && !i.val.startsWith('0'));
    assert('Test 2.12: Seluruh peringkat terminal terisi tanpa nilai 0', noZero2025);

    await setMetricTab('penumpang');

    // ==========================================
    // 3. SCENARIO 3: YEAR 2024 (Rekap Tahunan)
    // ==========================================
    console.log('\n--- Skenario 3: Verifikasi Mode 2024 (Rekap Tahunan) ---');
    await switchYear(2024);
    const yr2024Pnp = await getRankingItems();
    assert('Test 3.1: Mode 2024 Penumpang memuat 5 peringkat teratas', yr2024Pnp && yr2024Pnp.items.length === 5, `count: ${yr2024Pnp?.items?.length}`);
    assert('Test 3.2: #1 Leuwipanjang (2.070.365 pnp)',
      yr2024Pnp?.items[0]?.name.includes('Leuwipanjang') && yr2024Pnp?.items[0]?.val.includes('2.070.365'),
      `${yr2024Pnp?.items[0]?.name} - ${yr2024Pnp?.items[0]?.val}`);
    assert('Test 3.3: #2 Tasikmalaya / Indihiang (1.238.286 pnp)',
      (yr2024Pnp?.items[1]?.name.includes('Indihiang') || yr2024Pnp?.items[1]?.sub.includes('Tasikmalaya')) && yr2024Pnp?.items[1]?.val.includes('1.238.286'),
      `${yr2024Pnp?.items[1]?.name} - ${yr2024Pnp?.items[1]?.val}`);
    assert('Test 3.4: #3 Garut / Guntur Melati (1.076.289 pnp)',
      (yr2024Pnp?.items[2]?.name.includes('Guntur') || yr2024Pnp?.items[2]?.sub.includes('Garut')) && yr2024Pnp?.items[2]?.val.includes('1.076.289'),
      `${yr2024Pnp?.items[2]?.name} - ${yr2024Pnp?.items[2]?.val}`);
    assert('Test 3.5: Total terpetakan Penumpang 2024 sesuai grand total (6.420.938 pnp)',
      yr2024Pnp?.footer.includes('6.420.938'), yr2024Pnp?.footer);

    // Toggle Kendaraan 2024
    await setMetricTab('kendaraan');
    const yr2024Knd = await getRankingItems();
    assert('Test 3.6: Mode 2024 Kendaraan #1 Leuwipanjang (220.159 knd)',
      yr2024Knd?.items[0]?.name.includes('Leuwipanjang') && yr2024Knd?.items[0]?.val.includes('220.159'),
      `${yr2024Knd?.items[0]?.name} - ${yr2024Knd?.items[0]?.val}`);
    assert('Test 3.7: Mode 2024 Kendaraan #2 Tasikmalaya / Indihiang (180.808 knd)',
      (yr2024Knd?.items[1]?.name.includes('Indihiang') || yr2024Knd?.items[1]?.sub.includes('Tasikmalaya')) && yr2024Knd?.items[1]?.val.includes('180.808'),
      `${yr2024Knd?.items[1]?.name} - ${yr2024Knd?.items[1]?.val}`);
    assert('Test 3.8: Total terpetakan Kendaraan 2024 sesuai grand total (849.010 knd)',
      yr2024Knd?.footer.includes('849.010'), yr2024Knd?.footer);

    // ==========================================
    // 4. SCENARIO 4: LEAFLET MAP & ACTIVITY FEED
    // ==========================================
    console.log('\n--- Skenario 4: Verifikasi Peta Leaflet & Feed Aktivitas ---');
    const markerCounts = await cdp.eval(`
      (() => {
        const terminalMarkers = document.querySelectorAll('.rivet-marker--terminal').length;
        const uppkbMarkers = document.querySelectorAll('.rivet-marker--uppkb').length;
        const totalMarkers = document.querySelectorAll('.leaflet-marker-icon').length;
        return { terminalMarkers, uppkbMarkers, totalMarkers };
      })()
    `);
    assert('Test 4.1: Marker Leaflet terisi marker terminal (>= 10) & UPPKB (6)',
      markerCounts && markerCounts.terminalMarkers >= 10 && markerCounts.uppkbMarkers >= 6,
      `terminals: ${markerCounts?.terminalMarkers}, uppkb: ${markerCounts?.uppkbMarkers}`);

    // ==========================================
    // 5. SCENARIO 5: CONSOLE ERRORS & SCREENSHOT
    // ==========================================
    console.log('\n--- Skenario 5: Log Konsol & Screenshot Bukti ---');
    assert('Test 5.1: Nol error konsol browser selama seluruh pengujian', consoleErrors.length === 0, `errors: ${consoleErrors.join(' | ')}`);

    // Capture visual proof of Card 1
    const cardBox = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardTerminalRank');
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return { x: Math.max(0, rect.x - 4), y: Math.max(0, rect.y - 4), width: rect.width + 8, height: rect.height + 8 };
      })()
    `);
    if (cardBox) {
      const shot = await cdp.send('Page.captureScreenshot', { clip: { ...cardBox, scale: 2 } });
      const shotPath = path.resolve('Geo12-pages/shot-terminal-rank-multiyear.png');
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      assert('Test 5.2: Screenshot kartu peringkat multi-tahun tersimpan', fs.existsSync(shotPath), `saved: ${shotPath}`);
    }

    cdp.close();
  } catch (err) {
    console.error('CDP verification error:', err);
    failCount++;
  } finally {
    if (cdp) cdp.close();
    edge.kill();
    // Teardown assurance: kill any lingering msedge processes on debug port
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runVerification();
