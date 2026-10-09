import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

async function runRoutingVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL — Routing Restructure Automated Verification Suite');
  console.log('======================================================================\n');

  const userDataDir = path.join(os.tmpdir(), 'edge-verify-routing-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9245',
    '--user-data-dir=' + userDataDir,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--disable-extensions',
    'http://localhost:8082/'
  ]);

  let passCount = 0;
  let failCount = 0;
  const consoleErrors = [];
  const network404s = [];

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
    for (let retry = 0; retry < 20; retry++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch('http://127.0.0.1:9245/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8082'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9245');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();

    cdp.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        const text = msg.params.args?.map(a => a.value || a.description).join(' ') || '';
        consoleErrors.push(text);
      }
      if (msg.method === 'Network.responseReceived') {
        const status = msg.params.response?.status;
        const url = msg.params.response?.url;
        if (status === 404) {
          network404s.push(url);
        }
      }
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    // =========================================================================
    // TEST 1: Entry Point Root / (Command Center)
    // =========================================================================
    console.log('--- Test 1: Entry Point Root / (Command Center) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 2000));

    const rootInfo = await cdp.eval(`
      (() => {
        const brand = document.querySelector('.brand');
        const kemenhub = document.querySelector('img[src*="logo-kemenhub"]');
        const hubdat = document.querySelector('img[src*="logo-hubdat"]');
        const title = document.title;
        const navPeta = document.querySelector('a[href="/maps/"]');
        return {
          title,
          brandFound: !!brand,
          kemenhubLoaded: kemenhub ? (kemenhub.complete && kemenhub.naturalWidth > 0) : false,
          hubdatLoaded: hubdat ? (hubdat.complete && hubdat.naturalWidth > 0) : false,
          navPetaFound: !!navPeta,
          navPetaText: navPeta ? navPeta.textContent.trim() : ''
        };
      })()
    `);

    assert('1.1 Root / memuat halaman Command Center', rootInfo?.brandFound, rootInfo?.title);
    assert('1.2 Logo Kemenhub terpasang dan loaded di root /', rootInfo?.kemenhubLoaded);
    assert('1.3 Logo Ditjen Hubdat terpasang dan loaded di root /', rootInfo?.hubdatLoaded);
    assert('1.4 Link "Peta Transportasi" dengan href="/maps/" ditemukan di root /', rootInfo?.navPetaFound, rootInfo?.navPetaText);
    assert('1.5 Tidak ada aset 404 pada root /', network404s.length === 0, network404s.join(', '));

    // =========================================================================
    // TEST 2: Navigasi dari Root / ke /maps/ via tombol
    // =========================================================================
    console.log('\n--- Test 2: Navigasi ke Peta GIS /maps/ ---');
    await cdp.eval(`
      (() => {
        const link = document.querySelector('a[href="/maps/"]');
        if (link) link.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    const mapsInfo = await cdp.eval(`
      (() => {
        const mapEl = document.getElementById('map');
        const leafletPane = document.querySelector('.leaflet-pane');
        const btnCc = document.getElementById('btnCommandCenter');
        const titleBlock = document.querySelector('.title-block h1');
        return {
          currentUrl: window.location.href,
          mapExists: !!mapEl,
          leafletLoaded: !!leafletPane,
          btnCcFound: !!btnCc,
          btnCcHref: btnCc ? btnCc.getAttribute('href') : null,
          titleText: titleBlock ? titleBlock.textContent.trim() : ''
        };
      })()
    `);

    assert('2.1 URL browser berpindah ke /maps/', mapsInfo?.currentUrl?.includes('/maps/'), mapsInfo?.currentUrl);
    assert('2.2 Kontainer peta #map ditemukan', mapsInfo?.mapExists);
    assert('2.3 Layer Leaflet terinisialisasi (.leaflet-pane aktif)', mapsInfo?.leafletLoaded);
    assert('2.4 Tombol shortcut "Command Center" di header topbar mengarah ke href="/"', mapsInfo?.btnCcHref === '/', mapsInfo?.btnCcHref);

    // =========================================================================
    // TEST 3: Integritas Data GIS di /maps/
    // =========================================================================
    console.log('\n--- Test 3: Integritas Data GIS di /maps/ ---');
    const dataTest = await cdp.eval(`
      (async () => {
        const resGeo = await fetch('data/Jabar_By_Kab.geojson');
        const resOd = await fetch('data/od-regional.json');
        return {
          geoStatus: resGeo.status,
          odStatus: resOd.status,
          geoOk: resGeo.ok,
          odOk: resOd.ok
        };
      })()
    `);

    assert('3.1 Fetch data/Jabar_By_Kab.geojson berstatus HTTP 200', dataTest?.geoStatus === 200, `Status ${dataTest?.geoStatus}`);
    assert('3.2 Fetch data/od-regional.json berstatus HTTP 200', dataTest?.odStatus === 200, `Status ${dataTest?.odStatus}`);

    // =========================================================================
    // TEST 4: Navigasi Balik dari /maps/ ke Root /
    // =========================================================================
    console.log('\n--- Test 4: Navigasi Balik dari /maps/ ke Root / ---');
    await cdp.eval(`
      (() => {
        const btn = document.getElementById('btnCommandCenter');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 2000));

    const backUrl = await cdp.eval(`window.location.pathname`);
    assert('4.1 Klik tombol Command Center kembali ke pathname "/"', backUrl === '/', `Current: ${backUrl}`);

    // =========================================================================
    // TEST 5: HTTP Redirect /command-center/ -> /
    // =========================================================================
    console.log('\n--- Test 5: Redirect Backward Compatibility /command-center/ ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/command-center/' });
    await new Promise(r => setTimeout(r, 2000));

    const redirectedUrl = await cdp.eval(`window.location.pathname`);
    assert('5.1 Akses /command-center/ otomatis ter-redirect ke "/"', redirectedUrl === '/', `Current: ${redirectedUrl}`);

    // =========================================================================
    // TEST 6: Submodul Command Center Tetap Berfungsi Penuh
    // =========================================================================
    console.log('\n--- Test 6: Akses Submodul /command-center/terminal/ ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/command-center/terminal/?embed=1' });
    await new Promise(r => setTimeout(r, 2000));

    const terminalInfo = await cdp.eval(`
      (() => {
        const brandLink = document.querySelector('.brand-link');
        const petaLink = document.querySelector('a[href="/maps/"]');
        return {
          brandHref: brandLink ? brandLink.getAttribute('href') : null,
          petaHref: petaLink ? petaLink.getAttribute('href') : null
        };
      })()
    `);

    assert('6.1 Submodul Terminal: brand-link mengarah ke "/"', terminalInfo?.brandHref === '/', terminalInfo?.brandHref);
    assert('6.2 Submodul Terminal: link Peta Transportasi mengarah ke "/maps/"', terminalInfo?.petaHref === '/maps/', terminalInfo?.petaHref);

    console.log('\n======================================================================');
    console.log(`Hasil Verifikasi Routing: ${passCount} PASS | ${failCount} FAIL`);
    console.log('======================================================================\n');

    cdp.close();
    edge.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}

    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('[Error Runner]', err);
    try { edge.kill(); } catch (_) {}
    process.exit(1);
  }
}

runRoutingVerification();
