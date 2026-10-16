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

async function runTest() {
  console.log('======================================================================');
  console.log('GeoPORTAL — Multi-Year (2026/2025/2024) Accuracy Verification Suite');
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

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'http://localhost:8080/'
  ]);

  try {
    let targetTab = null;
    for (let retry = 0; retry < 20; retry++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9226/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page') || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9226');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

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

    await cdp.send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 1500));

    // Test 1: 2026 Default Accuracy
    console.log('--- Test 1: 2026 YTD Accurate Official Numbers ---');
    const heroPax2026 = await cdp.eval(`document.getElementById('heroPax')?.textContent?.trim()`);
    assert('2026 Hero Penumpang displays accurate 6.030.494 (not 6.743.004)', heroPax2026 === '6.030.494', `Actual: ${heroPax2026}`);

    const statVehicles2026 = await cdp.eval(`document.getElementById('statVehicles')?.textContent?.trim()`);
    assert('2026 Kendaraan displays accurate 629.698 (not 753.257)', statVehicles2026 === '629.698', `Actual: ${statVehicles2026}`);

    const heroSub2026 = await cdp.eval(`document.getElementById('activeYearLabel')?.textContent?.trim()`);
    assert('2026 Label shows YTD 2026', heroSub2026 === 'YTD 2026', `Actual: ${heroSub2026}`);

    const delta2026 = await cdp.eval(`document.getElementById('statDelta1')?.textContent?.trim()`);
    assert('2026 Delta compares vs 2025 YTD', delta2026 && delta2026.includes('+15.2% vs 2025 YTD'), `Actual: ${delta2026}`);

    // Test 2: Switch to 2025
    console.log('\n--- Test 2: Year Selection 2025 (Full 12 Months REKAP) ---');
    await cdp.eval(`document.querySelector('#cardYearSeg button[data-year="2025"]')?.click();`);
    await new Promise(r => setTimeout(r, 800));

    const heroPax2025 = await cdp.eval(`document.getElementById('heroPax')?.textContent?.trim()`);
    assert('2025 Hero Penumpang displays accurate 7.099.215 (not 757k)', heroPax2025 === '7.099.215', `Actual: ${heroPax2025}`);

    const statVehicles2025 = await cdp.eval(`document.getElementById('statVehicles')?.textContent?.trim()`);
    assert('2025 Kendaraan displays accurate 820.646', statVehicles2025 === '820.646', `Actual: ${statVehicles2025}`);

    const heroSub2025 = await cdp.eval(`document.getElementById('activeYearLabel')?.textContent?.trim()`);
    assert('2025 Label shows Tahun 2025', heroSub2025 === 'Tahun 2025', `Actual: ${heroSub2025}`);

    const topbarSelect2025 = await cdp.eval(`document.getElementById('yearSelect')?.value`);
    assert('Topbar dropdown synchronized to 2025', topbarSelect2025 === '2025', `Actual: ${topbarSelect2025}`);

    const cols2025Count = await cdp.eval(`
      Array.from(document.querySelectorAll('#cols .col')).filter(c => {
        var h = c.querySelector('.bar--income')?.style?.height || '';
        return h && parseFloat(h) > 0;
      }).length
    `);
    assert('2025 Chart renders all 12 active monthly bars', cols2025Count === 12, `Active bars: ${cols2025Count}`);

    // Test 3: Switch to 2024
    console.log('\n--- Test 3: Year Selection 2024 (Annual Master REKAP) ---');
    await cdp.eval(`document.querySelector('#cardYearSeg button[data-year="2024"]')?.click();`);
    await new Promise(r => setTimeout(r, 800));

    const heroPax2024 = await cdp.eval(`document.getElementById('heroPax')?.textContent?.trim()`);
    assert('2024 Hero Penumpang displays accurate 6.420.938', heroPax2024 === '6.420.938', `Actual: ${heroPax2024}`);

    const statVehicles2024 = await cdp.eval(`document.getElementById('statVehicles')?.textContent?.trim()`);
    assert('2024 Kendaraan displays accurate 849.010', statVehicles2024 === '849.010', `Actual: ${statVehicles2024}`);

    const heroSub2024 = await cdp.eval(`document.getElementById('activeYearLabel')?.textContent?.trim()`);
    assert('2024 Label shows Tahun 2024', heroSub2024 === 'Tahun 2024', `Actual: ${heroSub2024}`);

    const topbarSelect2024 = await cdp.eval(`document.getElementById('yearSelect')?.value`);
    assert('Topbar dropdown synchronized to 2024', topbarSelect2024 === '2024', `Actual: ${topbarSelect2024}`);

    // Test 4: Topbar Select Switch to 2026
    console.log('\n--- Test 4: Topbar Select Switch to 2026 ---');
    await cdp.eval(`
      var sel = document.getElementById('yearSelect');
      sel.value = '2026';
      sel.dispatchEvent(new Event('change'));
    `);
    await new Promise(r => setTimeout(r, 800));

    const cardBtn2026Active = await cdp.eval(`
      document.querySelector('#cardYearSeg button[data-year="2026"]')?.classList.contains('is-active')
    `);
    assert('Card year button 2026 reflects is-active from topbar change', cardBtn2026Active);

    const heroPaxBack2026 = await cdp.eval(`document.getElementById('heroPax')?.textContent?.trim()`);
    assert('Hero Penumpang restored to 6.030.494', heroPaxBack2026 === '6.030.494', `Actual: ${heroPaxBack2026}`);

    // Test 5: Metric Toggle to Kendaraan
    console.log('\n--- Test 5: Metric Toggle to Kendaraan ---');
    await cdp.eval(`document.querySelector('#metricSeg button[data-metric="secondary"]')?.click();`);
    await new Promise(r => setTimeout(r, 600));

    const heroVeh2026 = await cdp.eval(`document.getElementById('heroPax')?.textContent?.trim()`);
    assert('Hero switches to Kendaraan 629.698', heroVeh2026 === '629.698', `Actual: ${heroVeh2026}`);
    // Test 6: Zero Console Errors
    console.log('\n--- Test 6: Console Error Invariant ---');
    assert('Zero console errors throughout multi-year switching', consoleErrors.length === 0, consoleErrors.join('; '));

    cdp.close();
  } catch (err) {
    console.error('Test execution error:', err);
    failCount++;
  } finally {
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`MULTI-YEAR TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED.`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runTest();
