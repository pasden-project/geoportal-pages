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

async function snap() {
  console.log('=== VERIFYING DUAL CATEGORY CHARTS (KIRI PENUMPANG, KANAN RITASE) ===\n');

  const remotePort = 9226;
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://127.0.0.1:8082/'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const res = await fetch(`http://127.0.0.1:${remotePort}/json`);
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await new Promise(r => setTimeout(r, 1500));

  // 1. Click Perintis
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.mode-btn[data-mode="perintis"]').click()`
  });
  await new Promise(r => setTimeout(r, 600));

  const perintisInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dualEl = document.getElementById('dualCharts');
        const chartEl = document.getElementById('chart');
        const leftPanel = dualEl ? dualEl.querySelector('.dual-panel--left') : null;
        const rightPanel = dualEl ? dualEl.querySelector('.dual-panel--right') : null;

        const leftTitle = leftPanel ? leftPanel.querySelector('.dual-panel__title').innerText.trim() : null;
        const leftUnit = leftPanel ? leftPanel.querySelector('.dual-panel__unit').innerText.trim() : null;
        const leftAxis = leftPanel ? Array.from(leftPanel.querySelectorAll('.dual-axis span')).map(s => s.textContent.trim()) : [];
        const leftCols = leftPanel ? leftPanel.querySelectorAll('.dual-cols .col').length : 0;

        const rightTitle = rightPanel ? rightPanel.querySelector('.dual-panel__title').innerText.trim() : null;
        const rightUnit = rightPanel ? rightPanel.querySelector('.dual-panel__unit').innerText.trim() : null;
        const rightAxis = rightPanel ? Array.from(rightPanel.querySelectorAll('.dual-axis span')).map(s => s.textContent.trim()) : [];
        const rightCols = rightPanel ? rightPanel.querySelectorAll('.dual-cols .col').length : 0;

        return {
          dualVisible: dualEl && window.getComputedStyle(dualEl).display !== 'none',
          chartHidden: chartEl && window.getComputedStyle(chartEl).display === 'none',
          left: { title: leftTitle, unit: leftUnit, axis: leftAxis, colCount: leftCols },
          right: { title: rightTitle, unit: rightUnit, axis: rightAxis, colCount: rightCols }
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Perintis Dual Category Result:');
  console.log(JSON.stringify(perintisInfo.value, null, 2));

  const outPath = path.join(ROOT_DIR, 'shot-perintis-dual-categories.png');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`\nSaved screenshot to: ${outPath}`);

  ws.close();
  edge.kill();
}

snap().catch(console.error);
