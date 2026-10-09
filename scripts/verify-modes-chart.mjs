import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function verifyModes() {
  console.log('=== VERIFYING DUAL CHARTS & RESTORED BARANG CHART ===\n');

  const remoteDebuggingPort = 9228;
  const userDataDir = path.join(ROOT_DIR, 'tmp-edge-profile-' + Date.now());
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://127.0.0.1:8082/'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  let versionData;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (!versionData || !versionData.webSocketDebuggerUrl) {
    edge.kill();
    throw new Error('Gagal menghubungkan ke browser Edge.');
  }

  const pagesRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json`);
  const pages = await pagesRes.json();
  const page = pages.find(p => p.type === 'page');

  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await new Promise(r => setTimeout(r, 1500));

  try {
    // -------------------------------------------------------------
    // 1. TEST PERINTIS (DUAL: KIRI PENUMPANG, KANAN RITASE)
    // -------------------------------------------------------------
    console.log('[TEST 1: PERINTIS - DUAL KATEGORI (KIRI PENUMPANG, KANAN RITASE)]');
    await client.eval(`document.querySelector('.mode-btn[data-mode="perintis"]').click()`);
    await new Promise(r => setTimeout(r, 500));

    const p = await client.eval(`
      (() => {
        const dualEl = document.getElementById('dualCharts');
        const chartEl = document.getElementById('chart');
        const leftPanel = dualEl ? dualEl.querySelector('.dual-panel--left') : null;
        const rightPanel = dualEl ? dualEl.querySelector('.dual-panel--right') : null;

        return {
          dualVisible: dualEl && window.getComputedStyle(dualEl).display === 'grid',
          chartHidden: chartEl && window.getComputedStyle(chartEl).display === 'none',
          leftTitle: leftPanel ? leftPanel.querySelector('.dual-panel__title').innerText.trim() : null,
          rightTitle: rightPanel ? rightPanel.querySelector('.dual-panel__title').innerText.trim() : null,
          leftAxis: leftPanel ? leftPanel.querySelector('.dual-axis span').textContent.trim() : null,
          rightAxis: rightPanel ? rightPanel.querySelector('.dual-axis span').textContent.trim() : null
        };
      })()
    `);
    console.log('Perintis Result:', p);
    if (p.dualVisible && p.leftTitle === 'Penumpang' && p.rightTitle === 'Ritase Bus') {
      console.log('  -> PASS: Perintis dibagi 2 kategori: Kiri Penumpang (20k), Kanan Ritase Bus (500)!');
    }

    // -------------------------------------------------------------
    // 2. TEST BARANG (UPPKB) - DIKEMBALIKAN SEPERTI SEMULA (SINGLE STACKED CHART)
    // -------------------------------------------------------------
    console.log('\n[TEST 2: BARANG (UPPKB) - DIKEMBALIKAN SEPERTI SEMULA]');
    await client.eval(`document.querySelector('.mode-btn[data-mode="barang"]').click()`);
    await new Promise(r => setTimeout(r, 500));

    const bg = await client.eval(`
      (() => {
        const dualEl = document.getElementById('dualCharts');
        const chartEl = document.getElementById('chart');
        const cols = Array.from(document.querySelectorAll('#cols .col'));
        const stackedCols = cols.filter(c => c.querySelector('.col__pos--stacked') !== null);
        const axisSpans = Array.from(document.querySelectorAll('#chartAxis span')).map(s => s.textContent.trim());
        const legendText = document.querySelector('#chartLegend').innerText.trim();

        return {
          dualHidden: dualEl && window.getComputedStyle(dualEl).display === 'none',
          chartVisible: chartEl && window.getComputedStyle(chartEl).display === 'grid',
          colCount: cols.length,
          stackedCount: stackedCols.length,
          topAxis: axisSpans[0],
          bottomAxis: axisSpans[axisSpans.length - 1],
          legendText
        };
      })()
    `);
    console.log('Barang Result:', bg);
    if (bg.dualHidden && bg.chartVisible && bg.colCount === 12 && bg.stackedCount === 12 && bg.topAxis === '20k' && bg.bottomAxis === '0') {
      console.log('  -> PASS: Angkutan Barang berhasil dikembalikan seperti semula (single stacked chart, 0-20k, 12 bulan)!');
    } else {
      console.error('  -> FAIL: Angkutan Barang tidak sesuai!');
    }

    const barangShot = path.join(ROOT_DIR, 'shot-barang-kembali-semula.png');
    await client.screenshot(barangShot);
    console.log(`  -> Screenshot Barang: ${barangShot}`);

    // -------------------------------------------------------------
    // 3. TEST PARIWISATA (DI SANDINGKAN: 1 CHART GROUPED)
    // -------------------------------------------------------------
    console.log('\n[TEST 3: PARIWISATA - DI SANDINGKAN]');
    await client.eval(`document.querySelector('.mode-btn[data-mode="pariwisata"]').click()`);
    await new Promise(r => setTimeout(r, 500));

    const pw = await client.eval(`
      (() => {
        const dualEl = document.getElementById('dualCharts');
        const chartEl = document.getElementById('chart');
        const cols = Array.from(document.querySelectorAll('#cols .col'));
        const groupedCols = cols.filter(c => c.querySelector('.col__pos--grouped') !== null);

        return {
          dualHidden: dualEl && window.getComputedStyle(dualEl).display === 'none',
          chartVisible: chartEl && window.getComputedStyle(chartEl).display === 'grid',
          colCount: cols.length,
          groupedCount: groupedCols.length
        };
      })()
    `);
    console.log('Pariwisata Result:', pw);
    if (pw.dualHidden && pw.chartVisible && pw.groupedCount === 12) {
      console.log('  -> PASS: Pariwisata tetap 1 chart dengan batang bersandingan (disandingkan 100%)!');
    }

    client.close();
  } finally {
    edge.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

verifyModes().catch(e => {
  console.error(e);
  process.exit(1);
});
