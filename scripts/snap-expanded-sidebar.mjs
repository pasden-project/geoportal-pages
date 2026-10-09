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

async function capture() {
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1440,1050',
    '--hide-scrollbars',
    'http://localhost:8082/'
  ]);

  try {
    let targetTab = null;
    for (let retry = 0; retry < 25; retry++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9227/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.url && t.url.includes('8082')) || tabs.find(t => t.type === 'page' && !t.url.includes('about:blank')) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await new Promise(r => setTimeout(r, 2000));

    // 1. Capture Light Mode
    await cdp.eval(`
      (() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
        localStorage.setItem('geoportal-theme', 'light');

        document.querySelectorAll('.nav__group').forEach(g => g.classList.add('is-open'));
        document.querySelectorAll('.nav__item, .nav__subitem').forEach(el => el.classList.remove('is-active'));
        const uppkb = document.querySelector('a[href*="uppkb"]');
        if (uppkb) uppkb.classList.add('is-active');
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const shotLight = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 220, height: 780, scale: 2 }
    });
    fs.writeFileSync('Geo12-pages/shot-expanded-sidebar-light.png', Buffer.from(shotLight.data, 'base64'));
    console.log('Saved shot-expanded-sidebar-light.png');

    // 2. Capture Dark Mode
    await cdp.eval(`
      (() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.remove('theme-light');
        document.body.classList.remove('theme-light');
        localStorage.setItem('geoportal-theme', 'dark');

        document.querySelectorAll('.nav__group').forEach(g => g.classList.add('is-open'));
        document.querySelectorAll('.nav__item, .nav__subitem').forEach(el => el.classList.remove('is-active'));
        const uppkb = document.querySelector('a[href*="uppkb"]');
        if (uppkb) uppkb.classList.add('is-active');
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const shotDark = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 220, height: 780, scale: 2 }
    });
    fs.writeFileSync('Geo12-pages/shot-expanded-sidebar-dark.png', Buffer.from(shotDark.data, 'base64'));
    console.log('Saved shot-expanded-sidebar-dark.png');

    // Restore to default
    await cdp.eval(`
      (() => {
        document.querySelectorAll('.nav__item, .nav__subitem').forEach(el => el.classList.remove('is-active'));
        document.querySelector('.side .nav__item')?.classList.add('is-active');
      })()
    `);

    cdp.close();
  } catch (e) {
    console.error('Error capturing sidebar:', e);
  } finally {
    edge.kill();
  }
}

capture();
