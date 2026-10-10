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

const MENUS = [
  { id: 'overview', index: 1, name: 'Menu 1: Dashboard Overview', path: '/', isSubmodule: false, isMap: false },
  { id: 'maps', index: 2, name: 'Menu 2: Peta Transportasi', path: '/maps/', isSubmodule: false, isMap: true },
  { id: 'terminal', index: 3, name: 'Menu 3: Terminal Penumpang', path: '/command-center/terminal/', isSubmodule: true, isMap: false },
  { id: 'trayek', index: 4, name: 'Menu 4: Trayek Angkutan Jalan', path: '/command-center/trayek/', isSubmodule: true, isMap: false },
  { id: 'perintis', index: 5, name: 'Menu 5: Angkutan Perintis PSO', path: '/command-center/perintis/', isSubmodule: true, isMap: false },
  { id: 'uppkb', index: 6, name: 'Menu 6: UPPKB / Barang', path: '/command-center/uppkb/', isSubmodule: true, isMap: false },
  { id: 'od', index: 7, name: 'Menu 7: OD Intelligence', path: '/command-center/od/', isSubmodule: true, isMap: false },
  { id: 'connectivity', index: 8, name: 'Menu 8: Connectivity Multimoda', path: '/command-center/connectivity/', isSubmodule: true, isMap: false },
  { id: 'early-warning', index: 9, name: 'Menu 9: Early Warning System', path: '/command-center/early-warning/', isSubmodule: true, isMap: false },
  { id: 'program', index: 10, name: 'Menu 10: Program & Kinerja PSO', path: '/command-center/program/', isSubmodule: true, isMap: false },
  { id: 'laporan', index: 11, name: 'Menu 11: Laporan Realisasi', path: '/command-center/laporan/', isSubmodule: true, isMap: false },
  { id: 'data-master', index: 12, name: 'Menu 12: Data Master Transportasi', path: '/command-center/data-master/', isSubmodule: true, isMap: false }
];

async function runAudit() {
  console.log('======================================================================');
  console.log('GeoPORTAL — Audit 12 Menu Lengkap: Double Sidebar & Sinkronisasi Tema');
  console.log('Port 8082 Live CDP Chrome/Edge Verification Suite');
  console.log('======================================================================\n');

  const userDataDir = path.join(os.tmpdir(), 'edge-verify-12menu-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9288',
    '--user-data-dir=' + userDataDir,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let passCount = 0;
  let failCount = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${title} -> ${detail}`);
      failCount++;
    }
  }

  const shotsDir = path.resolve('Geo12-pages', 'dark-rivet-shots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  try {
    let targetTab = null;
    for (let retry = 0; retry < 20; retry++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch('http://127.0.0.1:9288/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page') || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target browser page tab not found on port 9288');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('\n======================================================================');
    console.log('BAGIAN 1: AUDIT DOUBLE SIDEBAR & ISOLASI SHELL (12/12 MENU)');
    console.log('======================================================================');

    // 1. Audit Dashboard Overview (Menu 1)
    {
      const menu = MENUS[0];
      console.log(`\n--- [1/12] ${menu.name} (${menu.path}) ---`);
      await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
      await new Promise(r => setTimeout(r, 1800));

      const overviewState = await cdp.eval(`
        (() => {
          const outerSidebar = document.querySelector('aside#side, aside.side');
          const isOuterVisible = outerSidebar && window.getComputedStyle(outerSidebar).display !== 'none';
          const innerSidebar = document.querySelector('.app-sidebar, #appSidebar');
          const isInnerVisible = innerSidebar && window.getComputedStyle(innerSidebar).display !== 'none';
          const outerHeader = document.querySelector('.top-bar, .app-header');
          const isHeaderVisible = outerHeader && window.getComputedStyle(outerHeader).display !== 'none';
          return {
            hasOuterSidebar: !!outerSidebar,
            isOuterVisible,
            hasInnerSidebar: !!innerSidebar,
            isInnerVisible,
            hasHeader: !!outerHeader,
            isHeaderVisible
          };
        })()
      `);

      assert('Menu 1: Outer Dark Rivet persistent sidebar terlihat', overviewState.isOuterVisible);
      assert('Menu 1: Tidak ada inner submodule sidebar di overview', !overviewState.isInnerVisible);
      assert('Menu 1: Zero double sidebar (Tepat 1 Persistent Sidebar)', overviewState.isOuterVisible && !overviewState.isInnerVisible);
    }

    // 2. Audit Peta Transportasi (Menu 2)
    {
      const menu = MENUS[1];
      console.log(`\n--- [2/12] ${menu.name} (${menu.path}) ---`);
      await cdp.send('Page.navigate', { url: 'http://localhost:8082/maps/' });
      await new Promise(r => setTimeout(r, 2000));

      const mapState = await cdp.eval(`
        (() => {
          const mapEl = document.getElementById('map');
          const leafletPane = document.querySelector('.leaflet-pane');
          const subSidebar = document.querySelector('.app-sidebar, #appSidebar');
          const isSubSidebarVisible = subSidebar && window.getComputedStyle(subSidebar).display !== 'none';
          return {
            hasMap: !!mapEl,
            hasLeaflet: !!leafletPane,
            hasSubSidebar: !!subSidebar,
            isSubSidebarVisible
          };
        })()
      `);

      assert('Menu 2: Kontainer peta GIS #map aktif', mapState.hasMap);
      assert('Menu 2: Leaflet basemap terinisialisasi', mapState.hasLeaflet);
      assert('Menu 2: Tidak ada double sidebar di peta fullscreen', !mapState.isSubSidebarVisible);
    }

    // 3. Audit 10 Submodul Command Center di dalam Persistent Shell
    // Kita uji navigasi via SPA shell dan inspeksi iframe DOM
    for (let i = 2; i < MENUS.length; i++) {
      const menu = MENUS[i];
      console.log(`\n--- [${menu.index}/12] ${menu.name} (${menu.path}) ---`);

      // Navigasikan shell induk ke rute submodul
      await cdp.eval(`
        (() => {
          if (typeof navigateTo === 'function') {
            navigateTo('${menu.path}', true);
          } else {
            window.location.href = '/#${menu.path}';
          }
        })()
      `);
      await new Promise(r => setTimeout(r, 2200));

      const subState = await cdp.eval(`
        (() => {
          const outerSidebar = document.querySelector('aside#side, aside.side');
          const isOuterVisible = outerSidebar && window.getComputedStyle(outerSidebar).display !== 'none';

          const frame = document.getElementById('submoduleFrame');
          if (!frame) return { error: 'submoduleFrame not found' };

          const frameVisible = window.getComputedStyle(frame).display !== 'none';
          const frameSrc = frame.getAttribute('src') || '';

          const doc = frame.contentDocument;
          if (!doc) return { error: 'contentDocument inaccessible', frameVisible, frameSrc };

          const html = doc.documentElement;
          const body = doc.body;

          const isHtmlEmbedded = html.classList.contains('is-embedded');
          const isBodyEmbedded = body ? body.classList.contains('is-embedded') : false;

          const innerSidebar = doc.querySelector('.app-sidebar, #appSidebar, aside.side');
          let innerSidebarDisplay = 'none';
          let innerSidebarWidth = 0;
          if (innerSidebar) {
            const cs = window.getComputedStyle(innerSidebar);
            innerSidebarDisplay = cs.display;
            innerSidebarWidth = Math.round(innerSidebar.getBoundingClientRect().width);
          }

          const innerHeader = doc.querySelector('.app-header, .top-bar, header.app-header');
          let innerHeaderDisplay = 'none';
          if (innerHeader) {
            const cs = window.getComputedStyle(innerHeader);
            innerHeaderDisplay = cs.display;
          }

          const main = doc.querySelector('.app-shell, .command-center-layout, .app-main, main');
          let mainMarginLeft = '0px';
          let mainWidth = 0;
          if (main) {
            const cs = window.getComputedStyle(main);
            mainMarginLeft = cs.marginLeft;
            mainWidth = Math.round(main.getBoundingClientRect().width);
          }

          return {
            isOuterVisible,
            frameVisible,
            frameSrc,
            isHtmlEmbedded,
            isBodyEmbedded,
            hasInnerSidebar: !!innerSidebar,
            innerSidebarDisplay,
            innerSidebarWidth,
            hasInnerHeader: !!innerHeader,
            innerHeaderDisplay,
            mainMarginLeft,
            mainWidth
          };
        })()
      `);

      assert(`${menu.name} — Outer Persistent Sidebar Dark Rivet aktif & terlihat`, subState.isOuterVisible);
      assert(`${menu.name} — Frame submodul terbuka dan visible`, subState.frameVisible);
      assert(`${menu.name} — Submodul memiliki class is-embedded`, subState.isHtmlEmbedded || subState.isBodyEmbedded);
      assert(`${menu.name} — Inner sidebar tersembunyi (display: none & width: 0)`,
        subState.innerSidebarDisplay === 'none' || subState.innerSidebarWidth === 0,
        `display=${subState.innerSidebarDisplay}, width=${subState.innerSidebarWidth}`);
      assert(`${menu.name} — Inner duplicate header tersembunyi (display: none)`,
        subState.innerHeaderDisplay === 'none',
        `display=${subState.innerHeaderDisplay}`);
      assert(`${menu.name} — Zero Double Sidebar (100% Single Persistent Sidebar)`,
        subState.isOuterVisible && (subState.innerSidebarDisplay === 'none' || subState.innerSidebarWidth === 0));
    }

    console.log('\n======================================================================');
    console.log('BAGIAN 2: AUDIT SINKRONISASI TEMA GELAP & TERANG (DARK & LIGHT MODE)');
    console.log('======================================================================');

    // 1. Audit Dark Mode di Shell dan Submodul
    {
      console.log('\n--- 2.1 Audit Dark Mode (Dark Obsidian Canvas & Neon Accents) ---');
      await cdp.eval(`
        (() => {
          const btn = document.getElementById('themeToggle');
          const cur = document.documentElement.getAttribute('data-theme');
          if (cur === 'light' && btn) btn.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 1200));

      const darkAudit = await cdp.eval(`
        (() => {
          const rootTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          const frame = document.getElementById('submoduleFrame');
          const doc = frame?.contentDocument;
          const frameTheme = doc ? (doc.documentElement.getAttribute('data-theme') || 'dark') : 'dark';

          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const frameBodyBg = doc ? window.getComputedStyle(doc.body).backgroundColor : '';

          return {
            rootTheme,
            frameTheme,
            bodyBg,
            frameBodyBg
          };
        })()
      `);

      assert('Dark Mode: Root shell data-theme bernilai dark', darkAudit.rootTheme === 'dark');
      assert('Dark Mode: Frame submodul data-theme bernilai dark', darkAudit.frameTheme === 'dark');
      assert('Dark Mode: Canvas utama bernuansa Dark Obsidian',
        darkAudit.bodyBg.includes('5, 5, 7') || darkAudit.bodyBg.includes('8, 9, 12') || darkAudit.bodyBg.includes('13, 14, 18'),
        `bodyBg=${darkAudit.bodyBg}`);
    }

    // 2. Audit Switch to Light Mode (Kemenhub Royal Navy & Bone White)
    {
      console.log('\n--- 2.2 Audit Switch ke Light Mode (Bone White & Navy) ---');
      await cdp.eval(`
        (() => {
          const btn = document.getElementById('themeToggle');
          if (btn) btn.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 1500));

      const lightAudit = await cdp.eval(`
        (() => {
          const rootTheme = document.documentElement.getAttribute('data-theme');
          const rootHasClass = document.documentElement.classList.contains('theme-light');

          const frame = document.getElementById('submoduleFrame');
          const doc = frame?.contentDocument;
          const frameTheme = doc ? doc.documentElement.getAttribute('data-theme') : '';
          const frameHasClass = doc ? (doc.documentElement.classList.contains('theme-light') || doc.body.classList.contains('theme-light')) : false;

          const storedGeoportal = localStorage.getItem('geoportal-theme');
          const storedGeoterminal = localStorage.getItem('geoterminal_theme');

          return {
            rootTheme,
            rootHasClass,
            frameTheme,
            frameHasClass,
            storedGeoportal,
            storedGeoterminal
          };
        })()
      `);

      assert('Light Mode: Root shell data-theme bernilai light', lightAudit.rootTheme === 'light');
      assert('Light Mode: Root shell memuat class theme-light', lightAudit.rootHasClass);
      assert('Light Mode: Frame submodul data-theme bernilai light', lightAudit.frameTheme === 'light');
      assert('Light Mode: Frame submodul memuat class theme-light', lightAudit.frameHasClass);
      assert('Light Mode: localStorage geoportal-theme tersimpan sebagai light', lightAudit.storedGeoportal === 'light');
      assert('Light Mode: localStorage geoterminal_theme tersinkronisasi sebagai light', lightAudit.storedGeoterminal === 'light');
    }

    // 3. Audit GIS Map Light Mode Synchronization
    {
      console.log('\n--- 2.3 Audit Peta GIS (/maps/) Sinkronisasi Light Mode ---');
      await cdp.send('Page.navigate', { url: 'http://localhost:8082/maps/' });
      await new Promise(r => setTimeout(r, 2000));

      const mapLightState = await cdp.eval(`
        (() => {
          const rootTheme = document.documentElement.getAttribute('data-theme');
          const isLight = (rootTheme === 'light') || document.documentElement.classList.contains('theme-light');
          const tilePane = document.querySelector('.leaflet-tile-pane');
          const filter = tilePane ? window.getComputedStyle(tilePane).filter : 'none';
          const hasInvert = filter.includes('invert');
          return {
            rootTheme,
            isLight,
            filter,
            hasInvert
          };
        })()
      `);

      assert('Peta GIS: Terbuka dalam mode light mengikuti pilihan shell', mapLightState.isLight);
      assert('Peta GIS: Filter basemap natural (tidak ada filter invert)', !mapLightState.hasInvert, `filter=${mapLightState.filter}`);
    }

    // 4. Kembalikan ke Dark Mode
    {
      console.log('\n--- 2.4 Restorasi Default ke Dark Mode ---');
      await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
      await new Promise(r => setTimeout(r, 1500));
      await cdp.eval(`
        (() => {
          const btn = document.getElementById('themeToggle');
          const cur = document.documentElement.getAttribute('data-theme');
          if (cur === 'light' && btn) btn.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 1000));

      const restoredState = await cdp.eval(`
        (() => {
          return {
            theme: document.documentElement.getAttribute('data-theme'),
            geoportal: localStorage.getItem('geoportal-theme'),
            geoterminal: localStorage.getItem('geoterminal_theme')
          };
        })()
      `);

      assert('Restorasi: Root shell kembali ke dark', restoredState.theme === 'dark');
      assert('Restorasi: Storage geoportal kembali ke dark', restoredState.geoportal === 'dark');
      assert('Restorasi: Storage geoterminal kembali ke dark', restoredState.geoterminal === 'dark');
    }

    console.log('\n======================================================================');
    console.log(`AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED.`);
    console.log('======================================================================');

    cdp.close();
    edge.kill();

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during audit:', err);
    try { edge.kill(); } catch (_) {}
    process.exit(1);
  }
}

runAudit();
