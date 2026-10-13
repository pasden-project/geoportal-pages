#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Mobile View Polish & Responsive UX Verification
   ---------------------------------------------------------------------
   Uji otomatis multi-viewport menggunakan Microsoft Edge Headless CDP:
   1. 360x800 (Compact Android)
   2. 390x844 (Standard iPhone 12/13/14/15)
   3. 412x915 (Large Android)

   Kriteria Evaluasi:
   - Zero Horizontal Document Overflow (scrollWidth <= innerWidth)
   - Topbar Fit Check (Theme Toggle, User Profile inside viewport)
   - Hero Balance Tools Fit Check (ChartViewToggle, Select Period)
   - Card Module Title Legibility (No "..." truncation)
   - GIS Maps (/maps/) Topbar Clearance (No element overlap)
   - Touch Target Standards (>= 36px/40px)
   ===================================================================== */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PORT = process.env.PORT || '8080';
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

  async screenshot(outPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res?.data) {
      fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    }
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true,
      screenWidth: width,
      screenHeight: height
    });
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

async function runMobilePolishVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL BPTD Jabar — Mobile View Polish Verification (CDP Headless)');
  console.log('Testing Resolutions: 360x800, 390x844, 412x915');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--window-size=360,800',
    '--hide-scrollbars',
    'about:blank'
  ]);

  let pageUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const resp = await fetch('http://127.0.0.1:9241/json/list');
      const targets = await resp.json();
      const p = targets.find(t => t.type === 'page') || targets[0];
      if (p && p.webSocketDebuggerUrl) {
        pageUrl = p.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }

  if (!pageUrl) {
    edge.kill();
    throw new Error('Edge headless failed to start on port 9241');
  }

  let totalTests = 0;
  let passedTests = 0;

  function assert(title, condition, extra = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  PASS: [${title}] ${extra}`);
    } else {
      console.error(`  FAIL: [${title}] ${extra}`);
    }
  }

  const client = new CDPClient(pageUrl);

  try {
    await client.connect();
    await client.send('Page.enable');
    await client.send('DOM.enable');

    const viewports = [
      { name: '360x800 (Compact Android)', width: 360, height: 800 },
      { name: '390x844 (Standard iPhone)', width: 390, height: 844 },
      { name: '412x915 (Large Android)', width: 412, height: 915 }
    ];

    // -------------------------------------------------------------------
    // 1. Dashboard Root Tests across 3 Viewports
    // -------------------------------------------------------------------
    for (const vp of viewports) {
      console.log(`\n--- [Viewport: ${vp.name}] Dashboard Root (/) Evaluation ---`);
      await client.setViewport(vp.width, vp.height);
      await client.send('Page.navigate', { url: `http://localhost:${PORT}/` });
      await new Promise(r => setTimeout(r, 1500));

      const res = await client.eval(`
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          const winWidth = window.innerWidth;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);

          // Topbar Elements
          const topbar = document.querySelector('.topbar');
          const themeToggle = document.getElementById('themeToggle');
          const userBtn = document.getElementById('userProfileBtn');
          const statusPill = document.querySelector('.status-pill');
          const clock = document.querySelector('.topbar-clock');

          const themeRect = themeToggle ? themeToggle.getBoundingClientRect() : null;
          const userRect = userBtn ? userBtn.getBoundingClientRect() : null;
          const topbarRect = topbar ? topbar.getBoundingClientRect() : null;

          // Hero Balance Controls
          const chartViewToggle = document.querySelector('.chart-view-toggle');
          const periodWrap = document.querySelector('.chart-period-select-wrap');
          const viewToggleRect = chartViewToggle ? chartViewToggle.getBoundingClientRect() : null;
          const periodRect = periodWrap ? periodWrap.getBoundingClientRect() : null;

          // Titles Truncation Check
          const titles = Array.from(document.querySelectorAll('.card-module__title')).map(t => t.textContent.trim());
          const hasEllipsisText = titles.some(t => t.endsWith('...'));

          // Rank Tabs Check
          const rankTabs = document.querySelector('.rank-tabs');
          const rankTabsStyle = rankTabs ? window.getComputedStyle(rankTabs) : null;
          const rankTabBtn = document.querySelector('.rank-tab-btn');
          const rankBtnRect = rankTabBtn ? rankTabBtn.getBoundingClientRect() : null;

          return {
            winWidth,
            scrollWidth,
            hasDocOverflow: scrollWidth > winWidth,
            themeToggle: {
              exists: !!themeToggle,
              visible: themeToggle ? window.getComputedStyle(themeToggle).display !== 'none' : false,
              right: themeRect ? themeRect.right : null,
              fitsInScreen: themeRect ? (themeRect.right <= winWidth && themeRect.left >= 0) : false
            },
            userBtn: {
              exists: !!userBtn,
              visible: userBtn ? window.getComputedStyle(userBtn).display !== 'none' : false,
              right: userRect ? userRect.right : null,
              fitsInScreen: userRect ? (userRect.right <= winWidth && userRect.left >= 0) : false
            },
            heroTools: {
              viewToggleFits: viewToggleRect ? viewToggleRect.right <= winWidth : false,
              viewToggleVisible: chartViewToggle ? window.getComputedStyle(chartViewToggle).display !== 'none' : false,
              periodWrapFits: periodRect ? periodRect.right <= winWidth : false
            },
            titles: {
              list: titles,
              hasEllipsisText
            },
            rankTabs: {
              display: rankTabsStyle ? rankTabsStyle.display : null,
              btnHeight: rankBtnRect ? rankBtnRect.height : null
            }
          };
        })()
      `);

      assert(`${vp.width}px: Document zero horizontal overflow`, !res.hasDocOverflow, `(scrollWidth: ${res.scrollWidth}, winWidth: ${res.winWidth})`);
      assert(`${vp.width}px: Theme Toggle fits inside screen`, res.themeToggle.fitsInScreen, `(right: ${res.themeToggle.right}, winWidth: ${res.winWidth})`);
      assert(`${vp.width}px: User Profile Button fits inside screen`, res.userBtn.fitsInScreen, `(right: ${res.userBtn.right}, winWidth: ${res.winWidth})`);
      assert(`${vp.width}px: Chart View Toggle fits inside screen`, res.heroTools.viewToggleFits, `(visible: ${res.heroTools.viewToggleVisible})`);
      assert(`${vp.width}px: Chart Period Select fits inside screen`, res.heroTools.periodWrapFits);
      assert(`${vp.width}px: Module titles fully legible (no '...' clipping)`, !res.titles.hasEllipsisText, `(titles: ${JSON.stringify(res.titles.list)})`);
      assert(`${vp.width}px: Rank tabs comfortable touch height >= 36px`, res.rankTabs.btnHeight >= 36, `(height: ${res.rankTabs.btnHeight}px)`);

      await client.screenshot(path.join(ROOT_DIR, `shot-mobile-${vp.width}-dashboard.png`));
    }

    // -------------------------------------------------------------------
    // 2. GIS Maps (/maps/) Collision & Clearance Check
    // -------------------------------------------------------------------
    for (const vp of [viewports[0], viewports[1]]) { // 360px & 390px
      console.log(`\n--- [Viewport: ${vp.name}] GIS Maps (/maps/) Evaluation ---`);
      await client.setViewport(vp.width, vp.height);
      await client.send('Page.navigate', { url: `http://localhost:${PORT}/maps/` });
      await new Promise(r => setTimeout(r, 2000));

      const mapsRes = await client.eval(`
        (() => {
          const winWidth = window.innerWidth;
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);

          const titleBlock = document.querySelector('.title-block');
          const titleH1 = document.querySelector('.title-block h1');
          const btnSearch = document.getElementById('btnSearch');
          const btnMenu = document.getElementById('btnMenu');
          const btnTheme = document.getElementById('btnTheme');
          const btnLegenda = document.getElementById('btnLegenda');
          const btnCC = document.getElementById('btnCommandCenter');

          const tRect = titleBlock ? titleBlock.getBoundingClientRect() : null;
          const sRect = btnSearch ? btnSearch.getBoundingClientRect() : null;
          const ccDisplay = btnCC ? window.getComputedStyle(btnCC).display : 'none';

          // Collision overlap between title and search button:
          // Overlap occurs if tRect.right > sRect.left
          const isCollidingWithSearch = (tRect && sRect) ? (tRect.right > sRect.left) : false;

          return {
            winWidth,
            scrollWidth,
            hasDocOverflow: scrollWidth > winWidth,
            isCollidingWithSearch,
            titleRight: tRect ? tRect.right : null,
            searchLeft: sRect ? sRect.left : null,
            ccHiddenOnMobile: ccDisplay === 'none'
          };
        })()
      `);

      assert(`${vp.width}px /maps/: Zero horizontal overflow`, !mapsRes.hasDocOverflow, `(scrollWidth: ${mapsRes.scrollWidth}, winWidth: ${mapsRes.winWidth})`);
      assert(`${vp.width}px /maps/: Title block does NOT collide with search button`, !mapsRes.isCollidingWithSearch, `(titleRight: ${mapsRes.titleRight}, searchLeft: ${mapsRes.searchLeft})`);
      assert(`${vp.width}px /maps/: Redundant Command Center button hidden on mobile topbar`, mapsRes.ccHiddenOnMobile);

      await client.screenshot(path.join(ROOT_DIR, `shot-mobile-${vp.width}-maps.png`));
    }

    // -------------------------------------------------------------------
    // 3. Command Center V2 Submodules Zero-Overflow Check at 360px
    // -------------------------------------------------------------------
    console.log(`\n--- [Viewport: 360x800] Submodules Zero-Overflow Verification ---`);
    await client.setViewport(360, 800);

    const submodules = [
      '/command-center/terminal/',
      '/command-center/trayek/',
      '/command-center/perintis/',
      '/command-center/uppkb/',
      '/command-center/od/',
      '/command-center/connectivity/',
      '/command-center/early-warning/',
      '/command-center/program/',
      '/command-center/laporan/',
      '/command-center/data-master/'
    ];

    for (const pathUrl of submodules) {
      await client.send('Page.navigate', { url: `http://localhost:${PORT}${pathUrl}` });
      await new Promise(r => setTimeout(r, 800));

      const subRes = await client.eval(`
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          const winWidth = window.innerWidth;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          return {
            scrollWidth,
            winWidth,
            hasOverflow: scrollWidth > winWidth
          };
        })()
      `);

      const modName = pathUrl.replace('/command-center/', '').replace('/', '');
      assert(`360px [${modName}]: Zero horizontal overflow`, !subRes.hasOverflow, `(scrollWidth: ${subRes.scrollWidth}, winWidth: ${subRes.winWidth})`);
    }

    client.close();
  } finally {
    // Explicit teardown as per CLAUDE.md section 11.1
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`MOBILE POLISH VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runMobilePolishVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
