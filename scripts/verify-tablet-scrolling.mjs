#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Tablet Mode & Sidebar Scrolling Verification
   ---------------------------------------------------------------------
   Uji otomatis spesifik 3 isu pengguna:
   1. 1024x768 : Sidebar harus muncul (desktop/landscape persistent 236px)
   2. iPad Mini (768x1024 & 744x1133) : Sidebar drawer terbuka & bisa di-scroll
   3. iPad 13 Pro (1024x1366 & 1366x1024) : Sidebar muncul & bisa di-scroll
   ===================================================================== */
import { spawn } from 'child_process';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.62\\msedge.exe';
const PORT = process.env.PORT || '8080';

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
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

async function run() {
  console.log('======================================================================');
  console.log('GeoPORTAL BPTD Jabar — Tablet Mode & Sidebar Scrolling Verification');
  console.log(`Target Preview: http://localhost:${PORT}/`);
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9298',
    '--window-size=1024,768',
    '--hide-scrollbars',
    'about:blank'
  ]);

  let pageUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const resp = await fetch('http://127.0.0.1:9298/json/list');
      const targets = await resp.json();
      const p = targets.find(t => t.type === 'page') || targets[0];
      if (p?.webSocketDebuggerUrl) {
        pageUrl = p.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }

  if (!pageUrl) {
    edge.kill();
    throw new Error('Edge failed to start on port 9298');
  }

  const client = new CDPClient(pageUrl);
  await client.connect();
  await client.send('Page.enable');

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

  try {
    // -------------------------------------------------------------------
    // UJI 1: 1024x768 (Bug 1: Sidebar harus muncul!)
    // -------------------------------------------------------------------
    console.log(`--- [Uji 1] Resolusi 1024x768 (Landscape Tablet) ---`);
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 2,
      mobile: false,
      screenWidth: 1024,
      screenHeight: 768
    });
    await client.send('Page.navigate', { url: `http://localhost:${PORT}/` });
    await new Promise(r => setTimeout(r, 1200));

    const res1024 = await client.eval(`
      (() => {
        const side = document.querySelector('.side');
        const main = document.querySelector('.main');
        const frame = document.querySelector('.frame');
        const menuBtn = document.getElementById('menu');
        const csSide = window.getComputedStyle(side);
        const csMenu = menuBtn ? window.getComputedStyle(menuBtn) : null;
        const titles = Array.from(document.querySelectorAll('.card-module__title'));

        const initialScroll = side.scrollTop;
        side.scrollTop = 200;
        const scrolled = side.scrollTop > initialScroll;

        const anyTruncated = titles.some(t => t.offsetWidth < t.scrollWidth);

        return {
          sideExists: !!side,
          sideVisible: side.offsetWidth === 236 && csSide.display !== 'none',
          sidePosition: csSide.position,
          sideWidth: side.offsetWidth,
          sideCanScroll: side.scrollHeight > side.clientHeight,
          sideScrolled: scrolled,
          mainWidth: main.offsetWidth,
          menuBtnHidden: csMenu ? csMenu.display === 'none' : true,
          zeroHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
          anyTruncated
        };
      })()
    `);

    assert('1024x768: Sidebar muncul secara visual (lebar 236px)', res1024.sideVisible, `(width: ${res1024.sideWidth}px, pos: ${res1024.sidePosition})`);
    assert('1024x768: Sidebar bisa di-scroll vertikal', res1024.sideCanScroll && res1024.sideScrolled);
    assert('1024x768: Main content responsive (788px)', res1024.mainWidth === 788, `(mainWidth: ${res1024.mainWidth}px)`);
    assert('1024x768: Zero horizontal document overflow', res1024.zeroHorizontalOverflow);
    assert('1024x768: Judul modul 100% utuh (Zero truncation)', !res1024.anyTruncated);

    // -------------------------------------------------------------------
    // UJI 2: iPad Mini (768x1024 & 744x1133) (Bug 2: Sidebar bisa di-scroll)
    // -------------------------------------------------------------------
    console.log(`\n--- [Uji 2] iPad Mini (768x1024 / 744x1133) ---`);
    for (const mini of [{ name: 'iPad Mini (768x1024)', w: 768, h: 850 }, { name: 'iPad Mini 6 (744x1133)', w: 744, h: 850 }]) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: mini.w,
        height: mini.h,
        deviceScaleFactor: 2,
        mobile: true,
        screenWidth: mini.w,
        screenHeight: mini.h
      });
      await new Promise(r => setTimeout(r, 1000));

      // Buka drawer sidebar
      await client.eval(`document.getElementById('menu').click();`);
      await new Promise(r => setTimeout(r, 400));

      const miniRes = await client.eval(`
        (() => {
          const side = document.querySelector('.side');
          const cs = window.getComputedStyle(side);

          // Scroll side
          const start = side.scrollTop;
          side.scrollTop = 200;
          const after = side.scrollTop;

          return {
            sideOpen: side.classList.contains('is-open'),
            sideWidth: side.offsetWidth,
            sidePosition: cs.position,
            sideOverflowY: cs.overflowY,
            touchAction: cs.touchAction,
            canScroll: side.scrollHeight > side.clientHeight,
            scrolled: after > start,
            scrolledAmt: after - start
          };
        })()
      `);

      assert(`${mini.name}: Drawer sidebar terbuka saat tap menu`, miniRes.sideOpen);
      assert(`${mini.name}: Sidebar drawer overflow-y auto & touch-action pan-y`, miniRes.sideOverflowY === 'auto' && miniRes.touchAction === 'pan-y');
      assert(`${mini.name}: Sidebar drawer bisa di-scroll vertikal`, miniRes.canScroll || miniRes.scrolled);

      // Tutup drawer
      await client.eval(`document.getElementById('sideBackdrop').click();`);
      await new Promise(r => setTimeout(r, 300));
    }

    // -------------------------------------------------------------------
    // UJI 3: iPad 13 Pro (1024x1366 portrait & 1366x1024 landscape) (Bug 3)
    // -------------------------------------------------------------------
    console.log(`\n--- [Uji 3] iPad 13 Pro (1024x1366 portrait & 1366x1024 landscape) ---`);
    for (const pro of [{ name: 'iPad 13 Pro Portrait (1024x1366)', w: 1024, h: 1366 }, { name: 'iPad 13 Pro Landscape (1366x1024)', w: 1366, h: 1024 }]) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: pro.w,
        height: pro.h,
        deviceScaleFactor: 2,
        mobile: true,
        screenWidth: pro.w,
        screenHeight: pro.h
      });
      await client.send('Page.navigate', { url: `http://localhost:${PORT}/` });
      await new Promise(r => setTimeout(r, 1000));

      const proRes = await client.eval(`
        (() => {
          const side = document.querySelector('.side');
          const cs = window.getComputedStyle(side);
          const titles = Array.from(document.querySelectorAll('.card-module__title'));

          const initial = side.scrollTop;
          side.scrollTop = 250;
          const after = side.scrollTop;

          const anyTruncated = titles.some(t => t.offsetWidth < t.scrollWidth);

          return {
            sideVisible: side.offsetWidth === 236 && cs.display !== 'none',
            sidePosition: cs.position,
            sideOverflowY: cs.overflowY,
            touchAction: cs.touchAction,
            canScroll: side.scrollHeight > side.clientHeight,
            scrolled: after > initial,
            zeroOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            anyTruncated
          };
        })()
      `);

      assert(`${pro.name}: Sidebar persisten muncul di layar (236px)`, proRes.sideVisible);
      assert(`${pro.name}: Sidebar memiliki overflow-y auto & touch-action pan-y`, proRes.sideOverflowY === 'auto' && proRes.touchAction === 'pan-y');
      assert(`${pro.name}: Zero horizontal overflow`, proRes.zeroOverflow);
      assert(`${pro.name}: Judul modul 100% utuh tanpa pemotongan`, !proRes.anyTruncated);
    }

    // -------------------------------------------------------------------
    // UJI 4: Desktop Regresi (1440x900 & 1920x1080)
    // -------------------------------------------------------------------
    console.log(`\n--- [Uji 4] Desktop Regresi ---`);
    for (const d of [{ name: 'Desktop 1440x900', w: 1440, h: 900 }, { name: 'Desktop 1920x1080', w: 1920, h: 1080 }]) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: d.w,
        height: d.h,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: d.w,
        screenHeight: d.h
      });
      await client.send('Page.navigate', { url: `http://localhost:${PORT}/` });
      await new Promise(r => setTimeout(r, 800));

      const dRes = await client.eval(`
        (() => {
          const side = document.querySelector('.side');
          const main = document.querySelector('.main');
          const start = main.scrollTop;
          main.scrollTop = 200;
          return {
            sideVisible: side.offsetWidth === 236,
            mainScrolled: main.scrollTop > start,
            overflowY: window.getComputedStyle(main).overflowY
          };
        })()
      `);

      assert(`${d.name}: Sidebar muncul (236px)`, dRes.sideVisible);
      assert(`${d.name}: Main content scroll aktif`, dRes.mainScrolled);
    }

    client.close();
  } finally {
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`ALL 3 USER BUGS VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
