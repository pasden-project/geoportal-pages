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
    if (this.ws) this.ws.close();
  }
}

async function runVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Automated CDP Verification Suite');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'http://localhost:8082/'
  ]);

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

  try {
    let targetTab = null;
    for (let retry = 0; retry < 15; retry++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch('http://127.0.0.1:9223/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8082'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 1500));
    console.log('--- Test 1: Sidebar Navigation Verification ---');
    const navItems = await cdp.eval(`
      Array.from(document.querySelectorAll('.nav__list:first-of-type > li > .nav__item:not(.nav__item--toggle)')).map(a => ({
        text: a.querySelector('span')?.textContent.trim(),
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        isActive: a.classList.contains('is-active')
      }))
    `);

    assert('Test 1.1: Exact 4 main nav items exist in Overview group', navItems.length === 4, `found ${navItems.length}`);
    assert('Test 1.2: Item 1 is Dashboard (href: / or ./) and is-active', (navItems[0]?.text === 'Dashboard') && (navItems[0]?.href === './' || navItems[0]?.href === '/') && navItems[0]?.isActive === true);
    assert('Test 1.3: Item 2 is Peta Transportasi (href: /maps/)', (navItems[1]?.text === 'Peta Transportasi' || navItems[1]?.text === 'Peta GeoPORTAL') && (navItems[1]?.href === '/maps/' || navItems[1]?.href === '/peta/'));
    assert('Test 1.4: Item 3 is Terminal (href: /command-center/terminal/)', navItems[2]?.text === 'Terminal' && navItems[2]?.href === '/command-center/terminal/');
    assert('Test 1.5: Item 4 is Trayek (href: /command-center/trayek/)', navItems[3]?.text === 'Trayek' && navItems[3]?.href === '/command-center/trayek/');

    console.log('\n--- Test 2: Leaflet Map Strict 12 Terminal Tipe A Filter ---');
    // Wait for Leaflet markers to render
    await new Promise(r => setTimeout(r, 1000));
    const markerCounts = await cdp.eval(`
      ({
        terminals: document.querySelectorAll('.rivet-marker--terminal').length,
        uppkb: document.querySelectorAll('.rivet-marker--uppkb').length,
        total: document.querySelectorAll('.rivet-marker').length
      })
    `);

    assert('Test 2.1: Exactly 12 Terminal Tipe A markers rendered', markerCounts.terminals === 12, `found ${markerCounts.terminals}`);
    assert('Test 2.2: Exactly 6 UPPKB facility markers rendered', markerCounts.uppkb === 6, `found ${markerCounts.uppkb}`);
    assert('Test 2.3: Total markers on map is exactly 18 (12 + 6, no 130+ clutter)', markerCounts.total === 18, `found ${markerCounts.total}`);

    console.log('\n--- Test 3: Multi-Mode Transport Mode Bar & Reactive Switching ---');
    const modeButtons = await cdp.eval(`
      Array.from(document.querySelectorAll('#transportModeBar .mode-btn')).map(b => ({
        mode: b.getAttribute('data-mode'),
        text: b.textContent.trim(),
        active: b.classList.contains('is-active')
      }))
    `);

    assert('Test 3.1: Mode bar contains exactly 6 transport modes', modeButtons.length === 6, `found ${modeButtons.length}`);
    assert('Test 3.2: Initial active mode is AKAP / AKDP', modeButtons[0]?.mode === 'akap' && modeButtons[0]?.active === true);

    // Switch to Perintis
    await new Promise(r => setTimeout(r, 1000));
    await cdp.eval(`document.querySelector('#transportModeBar .mode-btn[data-mode="perintis"]').click()`);
    await new Promise(r => setTimeout(r, 1200));

    const perintisState = await cdp.eval(`
      ({
        heroPax: document.getElementById('heroPax')?.textContent.trim(),
        heroSub: document.getElementById('heroSub')?.textContent.trim(),
        stat1Label: document.getElementById('statLabel1')?.textContent.trim(),
        stat1Val: document.getElementById('statVehicles')?.textContent.trim(),
        stat2Label: document.getElementById('statLabel2')?.textContent.trim(),
        stat2Val: document.getElementById('statTerminals')?.textContent.trim(),
        stat3Label: document.getElementById('statLabel3')?.textContent.trim(),
        stat3Val: document.getElementById('statUppkb')?.textContent.trim(),
        metricButtons: Array.from(document.querySelectorAll('#metricSeg .seg__btn')).map(b => b.textContent.trim())
      })
    `);

    assert('Test 3.3: Perintis hero metric is 148.620', perintisState.heroPax === '148.620', `value: ${perintisState.heroPax}`);
    assert('Test 3.4: Perintis hero subtitle updated', perintisState.heroSub.includes('Realisasi Angkutan Jalan Perintis PSO Jabar'), perintisState.heroSub);
    assert('Test 3.5: Perintis Right Stat 1 is 4.896 Trip', perintisState.stat1Val === '4.896 Trip', `value: ${perintisState.stat1Val}`);
    assert('Test 3.6: Perintis Right Stat 2 is 6 Trayek PSO', perintisState.stat2Val === '6 Trayek PSO', `value: ${perintisState.stat2Val}`);
    assert('Test 3.7: Perintis Right Stat 3 is 74.8%', perintisState.stat3Val === '74.8%', `value: ${perintisState.stat3Val}`);
    assert('Test 3.8: Segmented control shows Penumpang & Ritase Bus', perintisState.metricButtons.includes('Penumpang') && perintisState.metricButtons.includes('Ritase Bus'));

    await new Promise(r => setTimeout(r, 1000));
    console.log('\n  >> Clicking mode button: [Barang]...');
    await cdp.eval(`document.querySelector('#transportModeBar .mode-btn[data-mode="barang"]').click()`);
    await new Promise(r => setTimeout(r, 1200));

    const barangState = await cdp.eval(`
      ({
        heroPax: document.getElementById('heroPax')?.textContent.trim(),
        heroSub: document.getElementById('heroSub')?.textContent.trim(),
        stat1Val: document.getElementById('statVehicles')?.textContent.trim(),
        stat2Val: document.getElementById('statTerminals')?.textContent.trim(),
        stat3Val: document.getElementById('statUppkb')?.textContent.trim(),
        metricButtons: Array.from(document.querySelectorAll('#metricSeg .seg__btn')).map(b => b.textContent.trim())
      })
    `);

    assert('Test 3.9: Barang hero metric is 194.392 (truk diperiksa)', barangState.heroPax === '194.392', `value: ${barangState.heroPax}`);
    assert('Test 3.10: Barang hero subtitle updated', barangState.heroSub.includes('Operasional Penimbangan Muatan Truk UPPKB'), barangState.heroSub);
    assert('Test 3.11: Barang Right Stat 1 is 16.308 Truk (pelanggaran)', barangState.stat1Val === '16.308 Truk', `value: ${barangState.stat1Val}`);
    assert('Test 3.12: Barang Right Stat 2 is 6 Unit WIM', barangState.stat2Val === '6 Unit WIM', `value: ${barangState.stat2Val}`);
    assert('Test 3.13: Barang Right Stat 3 is 91.8%', barangState.stat3Val === '91.8%', `value: ${barangState.stat3Val}`);
    await new Promise(r => setTimeout(r, 1000));
    // Switch back to AKAP
    console.log('\n  >> Clicking mode button: [AKAP / AKDP]...');
    await cdp.eval(`document.querySelector('#transportModeBar .mode-btn[data-mode="akap"]').click()`);
    await new Promise(r => setTimeout(r, 1200));

    const akapState = await cdp.eval(`
      ({
        heroPax: document.getElementById('heroPax')?.textContent.trim(),
        stat1Val: document.getElementById('statVehicles')?.textContent.trim(),
        stat2Val: document.getElementById('statTerminals')?.textContent.trim()
      })
    `);

    assert('Test 3.14: AKAP hero returns to live volume (>3M pnp)', parseInt(akapState.heroPax.replace(/\D/g, ''), 10) > 3000000, `value: ${akapState.heroPax}`);
    assert('Test 3.15: AKAP terminal stat is 12 Simpul Tipe A', akapState.stat2Val === '12 Simpul Tipe A', `value: ${akapState.stat2Val}`);

    console.log('\n--- Test 4: Visual Screenshot Capture ---');
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = fs.existsSync(path.resolve('Geo12-pages')) ? path.resolve('Geo12-pages/dark-rivet-screenshot-1440.png') : path.resolve('dark-rivet-screenshot-1440.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    assert('Test 4.1: High-resolution desktop screenshot captured', fs.existsSync(screenshotPath), `saved to ${screenshotPath}`);

    cdp.close();
  } catch (err) {
    console.error('CDP test error:', err);
    failCount++;
  } finally {
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`CDP VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runVerification();
