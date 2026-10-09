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

async function verifyKeterangan() {
  console.log('=== VERIFYING KETERANGAN PERIODE UNTUK 6 MODA ===\n');

  const remoteDebuggingPort = 9229;
  const userDataDir = path.join(ROOT_DIR, 'tmp-edge-keterangan-' + Date.now());
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

  const pagesRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json`);
  const pages = await pagesRes.json();
  const page = pages.find(p => p.type === 'page');

  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await new Promise(r => setTimeout(r, 1500));

  const modes = [
    { mode: 'akap', expected: 'YTD', label: 'AKAP / AKDP' },
    { mode: 'perintis', expected: 'Tahun 2025', label: 'Perintis' },
    { mode: 'barang', expected: 'YTD', label: 'Angkutan Barang' },
    { mode: 'brt', expected: 'Tahun 2025', label: 'BRT' },
    { mode: 'ajap', expected: 'Tahun 2025', label: 'AJAP / AJDP' },
    { mode: 'pariwisata', expected: 'Tahun 2025', label: 'Pariwisata' }
  ];

  try {
    for (const m of modes) {
      await client.eval(`document.querySelector('.mode-btn[data-mode="${m.mode}"]').click()`);
      await new Promise(r => setTimeout(r, 300));

      const res = await client.eval(`
        (() => {
          const yrLabel = document.getElementById('activeYearLabel');
          const heroSub = document.getElementById('heroSub');
          const btnBadge = document.querySelector('.mode-btn[data-mode="${m.mode}"] .mode-badge');
          return {
            yrText: yrLabel ? yrLabel.textContent.trim() : null,
            subText: heroSub ? heroSub.innerText.trim() : null,
            badgeText: btnBadge ? btnBadge.textContent.trim() : null
          };
        })()
      `);

      console.log(`[${m.label}] -> yrLabel: "${res.yrText}" | badge: "${res.badgeText}" | sub: "${res.subText}"`);
      if (res.yrText === m.expected) {
        console.log(`  -> PASS: Keterangan ${m.label} sesuai: "${m.expected}"`);
      } else {
        console.error(`  -> FAIL: Expected "${m.expected}", got "${res.yrText}"`);
      }
    }

    const shotPath = path.join(ROOT_DIR, 'shot-keterangan-verified.png');
    await client.screenshot(shotPath);
    console.log(`\nScreenshot saved: ${shotPath}`);

    client.close();
  } finally {
    edge.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

verifyKeterangan().catch(e => {
  console.error(e);
  process.exit(1);
});
