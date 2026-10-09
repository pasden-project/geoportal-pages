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

  async screenshot(filePath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function verify() {
  console.log('=== VERIFYING BAR CHART HEIGHTS & MAP ICONS ===\n');

  const remoteDebuggingPort = 9223;
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://127.0.0.1:8082/'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  let versionData;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {
      await new Promise(r => setTimeout(r, 400));
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

  // Tunggu data live & peta Leaflet selesai di-render
  await new Promise(r => setTimeout(r, 2000));

  try {
    // 1. Verifikasi Bar Chart
    const chartInfo = await client.eval(`
      (() => {
        const cols = Array.from(document.querySelectorAll('#cols .col'));
        const axisSpans = Array.from(document.querySelectorAll('#chartAxis span')).map(s => s.textContent.trim());
        const data = cols.map((col, i) => {
          const savings = col.querySelector('.bar--savings');
          const income = col.querySelector('.bar--income');
          const sHeight = savings ? parseFloat(savings.style.height) : 0;
          const iHeight = income ? parseFloat(income.style.height) : 0;
          return {
            monthIndex: i + 1,
            sHeight,
            iHeight,
            totalHeight: parseFloat((sHeight + iHeight).toFixed(2))
          };
        });
        return {
          columnCount: cols.length,
          axisSpans,
          data
        };
      })()
    `);

    console.log('[CHART DATA]');
    console.log('Axis Spans:', chartInfo.axisSpans);
    console.log('Columns count:', chartInfo.columnCount);
    chartInfo.data.forEach((d, idx) => {
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      console.log(`  ${mNames[idx]}: Income=${d.iHeight}% + Savings=${d.sHeight}% -> Total=${d.totalHeight}%`);
    });

    const apr = chartInfo.data[3]; // Apr
    const feb = chartInfo.data[1]; // Feb
    const jan = chartInfo.data[0]; // Jan

    console.log('\n[CHART ASSERTIONS]');
    console.log(`- April (${apr.totalHeight}%) vs Feb (${feb.totalHeight}%): diff = ${(apr.totalHeight - feb.totalHeight).toFixed(2)}%`);
    if (apr.totalHeight > feb.totalHeight + 15) {
      console.log('  -> PASS: April puncak mudik terlihat jauh lebih tinggi daripada Februari!');
    } else {
      console.error('  -> FAIL: April tidak terlihat lebih tinggi!');
    }

    if (chartInfo.axisSpans[chartInfo.axisSpans.length - 1] === '0') {
      console.log('  -> PASS: Baseline bawah adalah 0!');
    } else {
      console.error('  -> FAIL: Baseline bawah bukan 0!');
    }

    // 2. Verifikasi Map Markers & Legend
    const mapInfo = await client.eval(`
      (() => {
        const terminalMarkers = Array.from(document.querySelectorAll('.rivet-marker--terminal'));
        const uppkbMarkers = Array.from(document.querySelectorAll('.rivet-marker--uppkb'));
        const legendText = document.querySelector('.map-legend') ? document.querySelector('.map-legend').innerText.trim() : '';

        const terminalHasSvg = terminalMarkers.every(m => m.querySelector('svg') !== null);
        const uppkbHasSvg = uppkbMarkers.every(m => m.querySelector('svg') !== null);
        const terminalHasT = terminalMarkers.some(m => m.textContent.trim() === 'T');
        const uppkbHasW = uppkbMarkers.some(m => m.textContent.trim() === 'W');

        return {
          terminalCount: terminalMarkers.length,
          uppkbCount: uppkbMarkers.length,
          terminalHasSvg,
          uppkbHasSvg,
          terminalHasT,
          uppkbHasW,
          legendText
        };
      })()
    `);

    console.log('\n[MAP ASSERTIONS]');
    console.log('Terminal Markers count:', mapInfo.terminalCount);
    console.log('UPPKB Markers count:', mapInfo.uppkbCount);
    console.log('Map Legend text:', JSON.stringify(mapInfo.legendText));
    console.log('Terminal markers contain SVG icon:', mapInfo.terminalHasSvg);
    console.log('Terminal markers contains "T":', mapInfo.terminalHasT);
    console.log('UPPKB markers contain SVG icon:', mapInfo.uppkbHasSvg);
    console.log('UPPKB markers contains "W":', mapInfo.uppkbHasW);

    if (!mapInfo.terminalHasT && mapInfo.terminalHasSvg) {
      console.log('  -> PASS: Logo "T" berhasil diganti dengan ikon Terminal!');
    } else {
      console.error('  -> FAIL: Logo "T" masih ada atau SVG absen!');
    }

    if (!mapInfo.uppkbHasW && mapInfo.uppkbHasSvg) {
      console.log('  -> PASS: Logo "W" berhasil diganti dengan ikon Angkutan Barang!');
    } else {
      console.error('  -> FAIL: Logo "W" masih ada atau SVG absen!');
    }

    if (mapInfo.legendText.includes('Terminal') && mapInfo.legendText.includes('Angkutan Barang')) {
      console.log('  -> PASS: Legenda peta berhasil diperbarui menampilkan "Terminal" dan "Angkutan Barang"!');
    } else {
      console.error('  -> FAIL: Legenda tidak sesuai!');
    }

    // Capture screenshots
    const shotPath = path.join(ROOT_DIR, 'dark-rivet-verification-updated.png');
    await client.screenshot(shotPath);
    console.log('\n[SCREENSHOT]');
    console.log(`Saved screenshot to: ${shotPath}`);

    client.close();
  } finally {
    edge.kill();
  }
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
