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

async function runVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL — All 12 Menus & Modals Light Mode Automated Verification');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1440,1050',
    '--hide-scrollbars',
    'http://localhost:8082/'
  ]);

  let passCount = 0;
  let failCount = 0;
  const consoleErrors = [];

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
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9227/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.url && t.url.includes('8082')) || tabs.find(t => t.type === 'page' && !t.url.includes('about:blank')) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9227');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();

    cdp.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        const text = msg.params.args?.map(a => a.value || a.description).join(' ') || '';
        if (!text.includes('favicon') && !text.includes('socket')) {
          consoleErrors.push(text);
        }
      }
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 2500));

    // Aktifkan Light Mode
    console.log('--- Inisialisasi: Mengaktifkan Light Mode (Off-White & Kemenhub Navy) ---');
    await cdp.eval(`
      (() => {
        const cur = document.documentElement.getAttribute('data-theme');
        if (cur !== 'light') {
          document.getElementById('themeToggle')?.click();
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 800));

    // Audit function definition (injected directly into evaluations)
    const auditSnippet = `
      function runColorHarmonizationAudit(scopeEl) {
        function parseRgb(colorStr) {
          if (!colorStr) return null;
          const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          return match ? { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]), a: match[4] !== undefined ? parseFloat(match[4]) : 1 } : null;
        }
        function isNeon(c) {
          if (!c) return false;
          // Neon Lime #d4ff3f approx rgb(212, 255, 63)
          if (c.r > 180 && c.g > 230 && c.b < 100) return true;
          // Neon Cyan #3ef2ff approx rgb(62, 242, 255)
          if (c.r < 100 && c.g > 220 && c.b > 230) return true;
          return false;
        }
        function isDarkObsidian(c) {
          if (!c) return false;
          // Translucent elements like hairline grid lines (a < 0.35) are not dark patches
          if (c.a < 0.35) return false;
          return (c.r < 32 && c.g < 35 && c.b < 45);
        }

        const root = scopeEl || document;
        const all = Array.from(root.querySelectorAll('*'));
        let darkPatches = [];
        let neonTexts = [];

        for (const el of all) {
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT' || el.tagName === 'SVG' || el.tagName === 'PATH') continue;
          if (el.closest('.side') || el.closest('#sidebar')) continue; // Sidebar intentionally Kemenhub Navy gradient
          if (el.closest('.is-embedded header') || el.closest('.is-embedded .app-header')) continue;
          if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;

          const st = window.getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;

          const bgObj = parseRgb(st.backgroundColor);
          if (bgObj && st.backgroundColor !== 'rgba(0, 0, 0, 0)' && !st.backgroundColor.startsWith('rgba(0, 0, 0, 0.')) {
            if (isDarkObsidian(bgObj)) {
              darkPatches.push({ tag: el.tagName, cls: el.className, id: el.id, bg: st.backgroundColor });
            }
          }

          const txt = el.innerText?.trim();
          if (txt && txt.length > 0) {
            const fgObj = parseRgb(st.color);
            if (fgObj && isNeon(fgObj)) {
              neonTexts.push({ tag: el.tagName, cls: el.className, id: el.id, color: st.color, text: txt.slice(0, 24) });
            }
          }
        }
        return {
          darkPatchesCount: darkPatches.length,
          darkPatches: darkPatches.slice(0, 3),
          neonTextsCount: neonTexts.length,
          neonTexts: neonTexts.slice(0, 3)
        };
      }
    `;

    // 1. Menu 1: Dashboard Overview
    console.log('\n--- [1/12] Menu: Dashboard Overview (/) ---');
    const overviewState = await cdp.eval(`
      (() => {
        ${auditSnippet}
        const html = document.documentElement;
        const theme = html.getAttribute('data-theme');
        const frameBg = window.getComputedStyle(document.querySelector('.frame')).backgroundColor;
        const cardBg = window.getComputedStyle(document.querySelector('.card')).backgroundColor;
        const sideBg = window.getComputedStyle(document.querySelector('.side')).backgroundImage;
        const activeItem = document.querySelector('.side .nav__item.is-active, .side .nav__subitem.is-active');
        const activeColor = activeItem ? window.getComputedStyle(activeItem).color : '';
        const heroPaxColor = window.getComputedStyle(document.getElementById('heroPax')).color;
        const pillBg = window.getComputedStyle(document.querySelector('.side .nav__pill')).backgroundColor;

        // Specific harmonized controls in Overview
        const periodWrap = document.querySelector('.chart-period-select-wrap');
        const periodWrapBg = periodWrap ? window.getComputedStyle(periodWrap).backgroundColor : '';
        const viewToggle = document.querySelector('.chart-view-toggle');
        const viewToggleBg = viewToggle ? window.getComputedStyle(viewToggle).backgroundColor : '';
        const activeViewBtn = document.querySelector('.view-btn.is-active');
        const activeViewBtnColor = activeViewBtn ? window.getComputedStyle(activeViewBtn).color : '';
        const activeViewBtnBg = activeViewBtn ? window.getComputedStyle(activeViewBtn).backgroundColor : '';

        const modLink = document.querySelector('.card-module__link');
        const modLinkColor = modLink ? window.getComputedStyle(modLink).color : '';

        const barIncome = document.querySelector('.bar--income') || document.querySelector('.dual-panel--left .bar');
        const barIncomeBg = barIncome ? window.getComputedStyle(barIncome).backgroundColor : '';
        const barSavings = document.querySelector('.bar--savings') || document.querySelector('.dual-panel--right .bar');
        const barSavingsBg = barSavings ? window.getComputedStyle(barSavings).backgroundColor : '';

        const boardEl = document.querySelector('.board') || document.querySelector('.stage');
        const audit = runColorHarmonizationAudit(boardEl);

        return {
          theme,
          frameBg,
          cardBg,
          sideBg,
          activeColor,
          heroPaxColor,
          pillBg,
          periodWrapBg,
          viewToggleBg,
          activeViewBtnColor,
          activeViewBtnBg,
          modLinkColor,
          barIncomeBg,
          barSavingsBg,
          audit
        };
      })()
    `);

    assert('1.1 Overview: Tema data-theme adalah "light"', overviewState?.theme === 'light', overviewState?.theme);
    assert('1.2 Overview: Frame canvas bernuansa soft bone (#EEF2F6)', overviewState?.frameBg?.includes('238, 242, 246'), overviewState?.frameBg);
    assert('1.3 Overview: Card bernuansa off-white anti-silau (#F8FAFC)', overviewState?.cardBg === 'rgb(248, 250, 252)', overviewState?.cardBg);
    assert('1.4 Overview: Sidebar memiliki gradien Kemenhub Navy', overviewState?.sideBg?.includes('7, 28, 61'), overviewState?.sideBg?.slice(0, 60));
    assert('1.5 Overview: Hero Pax bertinta Kemenhub Navy (#0A2F73)', overviewState?.heroPaxColor === 'rgb(10, 47, 115)', overviewState?.heroPaxColor);
    assert('1.6 Overview: Nav pill sidebar tidak bocor warna putih (berwarna navy/cyan transparan)', !overviewState?.pillBg?.includes('255, 255, 255') && !overviewState?.pillBg?.includes('238, 242, 246'), overviewState?.pillBg);
    assert('1.7 Overview: Kontrol periode grafik berlatar soft bone (#EEF2F6), bukan obsidian gelap', overviewState?.periodWrapBg === 'rgb(238, 242, 246)', overviewState?.periodWrapBg);
    assert('1.8 Overview: Toggle view grafik berlatar soft bone (#EEF2F6)', overviewState?.viewToggleBg === 'rgb(238, 242, 246)', overviewState?.viewToggleBg);
    assert('1.9 Overview: View button aktif bertinta Kemenhub Navy (#0A2F73), bukan neon lime', overviewState?.activeViewBtnColor === 'rgb(10, 47, 115)', overviewState?.activeViewBtnColor);
    assert('1.10 Overview: Tautan modul berwibawa Kemenhub Navy (#0A2F73)', overviewState?.modLinkColor === 'rgb(10, 47, 115)' || overviewState?.modLinkColor === 'rgb(18, 55, 113)', overviewState?.modLinkColor);
    if (overviewState?.audit?.darkPatchesCount > 0) {
      console.log('    [DIAG Overview darkPatches]:', JSON.stringify(overviewState?.audit?.darkPatches));
    }
    assert('1.11 Overview: Batang grafik bar--income bernuansa Kemenhub Navy (#0A2F73)', overviewState?.barIncomeBg === 'rgb(10, 47, 115)', overviewState?.barIncomeBg);
    assert('1.12 Overview: Audit 1 — Zero Dark Obsidian Background Patches di panggung', overviewState?.audit?.darkPatchesCount === 0, `Dark patches: ${overviewState?.audit?.darkPatchesCount}`);
    assert('1.13 Overview: Audit 2 — Zero Unreadable Neon Text di atas kartu terang', overviewState?.audit?.neonTextsCount === 0, `Neon texts: ${overviewState?.audit?.neonTextsCount}`);
    const shotOverview = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('Geo12-pages/shot-light-menu-01-overview.png', Buffer.from(shotOverview.data, 'base64'));
    assert('1.14 Screenshot Menu Overview tersimpan', fs.existsSync('Geo12-pages/shot-light-menu-01-overview.png'));

    // 2. Menu 2: Peta GeoPORTAL (/peta/)
    console.log('\n--- [2/12] Menu: Peta Interaktif GeoPORTAL (/peta/) ---');
    await cdp.eval(`
      (() => {
        const frame = document.getElementById('submoduleFrame');
        if (frame) {
          frame.style.display = 'block';
          document.querySelector('.board').style.display = 'none';
          frame.src = '/peta/';
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    const petaState = await cdp.eval(`
      (() => {
        ${auditSnippet}
        const frame = document.getElementById('submoduleFrame');
        const doc = frame?.contentDocument;
        if (!doc) return null;
        const html = doc.documentElement;
        const theme = html.getAttribute('data-theme') || (html.classList.contains('theme-light') ? 'light' : '');
        const tilePane = doc.querySelector('.leaflet-tile-pane');
        const tileFilter = tilePane ? window.getComputedStyle(tilePane).filter : '';
        const audit = runColorHarmonizationAudit(doc.body);
        return {
          theme,
          tileFilter,
          audit
        };
      })()
    `);

    assert('2.1 Peta: Dokumen iframe mewarisi data-theme="light"', petaState?.theme === 'light', petaState?.theme);
    assert('2.2 Peta: Filter ubin OSM Leaflet tidak menggunakan invert gelap (mode natural)', !petaState?.tileFilter?.includes('invert(1)'), petaState?.tileFilter);
    assert('2.3 Peta: Audit 1 — Zero Dark Background Patches', petaState?.audit?.darkPatchesCount === 0, `Dark patches: ${petaState?.audit?.darkPatchesCount}`);
    assert('2.4 Peta: Audit 2 — Zero Unreadable Neon Text', petaState?.audit?.neonTextsCount === 0, `Neon texts: ${petaState?.audit?.neonTextsCount}`);

    const shotPeta = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('Geo12-pages/shot-light-menu-02-peta.png', Buffer.from(shotPeta.data, 'base64'));
    assert('2.5 Screenshot Menu Peta GeoPORTAL tersimpan', fs.existsSync('Geo12-pages/shot-light-menu-02-peta.png'));

    // Daftar 10 Submodul Command Center
    const submodules = [
      { id: '03', name: 'Terminal Simpul Tipe A', path: '/command-center/terminal/' },
      { id: '04', name: 'Trayek AKAP/AKDP', path: '/command-center/trayek/' },
      { id: '05', name: 'Angkutan Perintis PSO', path: '/command-center/perintis/' },
      { id: '06', name: 'UPPKB Angkutan Barang', path: '/command-center/uppkb/' },
      { id: '07', name: 'Matriks Asal-Tujuan (OD)', path: '/command-center/od/' },
      { id: '08', name: 'Connectivity Wilayah', path: '/command-center/connectivity/' },
      { id: '09', name: 'Early Warning System', path: '/command-center/early-warning/' },
      { id: '10', name: 'Kinerja PSO & Evaluasi', path: '/command-center/program/' },
      { id: '11', name: 'Laporan Realisasi Operasional', path: '/command-center/laporan/' },
      { id: '12', name: 'Data Master Transportasi', path: '/command-center/data-master/' }
    ];

    let menuIndex = 3;
    for (const sub of submodules) {
      console.log(`\n--- [${menuIndex}/12] Menu Submodul: ${sub.name} (${sub.path}) ---`);
      
      await cdp.eval(`
        (() => {
          const frame = document.getElementById('submoduleFrame');
          if (frame) {
            frame.style.display = 'block';
            document.querySelector('.board').style.display = 'none';
            frame.src = '${sub.path}?embed=1';
          }
        })()
      `);
      await new Promise(r => setTimeout(r, 2600));

      const subState = await cdp.eval(`
        (() => {
          ${auditSnippet}
          const frame = document.getElementById('submoduleFrame');
          const doc = frame?.contentDocument;
          if (!doc) return null;
          const html = doc.documentElement;
          const body = doc.body;
          const theme = html.getAttribute('data-theme') || (html.classList.contains('theme-light') ? 'light' : '') || (body.classList.contains('theme-light') ? 'light' : '');
          const bodyBg = window.getComputedStyle(body).backgroundColor;

          // Cek kartu atau panel di dalam submodul
          const card = doc.querySelector('.card, .kpi-card, .panel, .ranking-card, .table-card, .map-panel, .official-doc-sheet, .overview-card, .box') || doc.querySelector('section, article');
          const cardBg = card ? window.getComputedStyle(card).backgroundColor : '';
          const cardColor = card ? window.getComputedStyle(card).color : '';

          // Cek judul heading yang tampak di panggung
          const allHeadings = Array.from(doc.querySelectorAll('.app-content h1, .app-content h2, .app-content h3, .dash-title, .section-title, .card-title, .panel-title, .map-heading, h1, h2, h3'));
          const visibleHeading = allHeadings.find(h => {
            const style = window.getComputedStyle(h);
            const parent = h.closest('.app-header');
            return style.display !== 'none' && (!parent || window.getComputedStyle(parent).display !== 'none');
          }) || allHeadings[0];
          const headingColor = visibleHeading ? window.getComputedStyle(visibleHeading).color : '';

          const isWhiteOnWhite = (cardBg.includes('248, 250, 252') || cardBg.includes('238, 242, 246') || cardBg.includes('255, 255, 255')) &&
                                 (headingColor === 'rgb(255, 255, 255)');

          // Check tabs if present
          const tabBtn = doc.querySelector('.tab-btn, .od-tab-btn, .connectivity-tab-btn, .report-tab-btn');
          const tabBg = tabBtn ? window.getComputedStyle(tabBtn).backgroundColor : '';
          const activeTab = doc.querySelector('.tab-btn.is-active, .od-tab-btn.is-active, .connectivity-tab-btn.is-active, .report-tab-btn.is-active');
          const activeTabColor = activeTab ? window.getComputedStyle(activeTab).color : '';

          // Check demo notice if present
          const notice = doc.querySelector('.demo-notice, .info-banner, .alert-box, .scope-notice');
          const noticeBg = notice ? window.getComputedStyle(notice).backgroundColor : '';

          const audit = runColorHarmonizationAudit(doc.body);

          return {
            theme,
            bodyBg,
            cardBg,
            cardColor,
            headingColor,
            isWhiteOnWhite,
            hasCard: !!card,
            hasHeading: !!visibleHeading,
            hasTab: !!tabBtn,
            tabBg,
            hasActiveTab: !!activeTab,
            activeTabColor,
            hasNotice: !!notice,
            noticeBg,
            audit
          };
        })()
      `);

      assert(`${menuIndex}.1 ${sub.name}: Tema iframe adalah "light"`, subState?.theme === 'light', subState?.theme);
      assert(`${menuIndex}.2 ${sub.name}: Background panggung adalah soft bone (#EEF2F6)`, subState?.bodyBg?.includes('238, 242, 246'), subState?.bodyBg);
      assert(`${menuIndex}.3 ${sub.name}: Permukaan kartu adalah off-white teduh (#F8FAFC) atau panel selaras`, 
        subState?.cardBg === 'rgb(248, 250, 252)' || subState?.cardBg?.includes('238, 242, 246') || subState?.cardBg === 'rgba(0, 0, 0, 0)', 
        subState?.cardBg);
      assert(`${menuIndex}.4 ${sub.name}: Teks judul berkontras tajam & tidak terjadi tabrakan putih di atas putih`, !subState?.isWhiteOnWhite, `Heading col: ${subState?.headingColor}`);
      if (subState?.audit?.darkPatchesCount > 0) {
        console.log(`    [DIAG ${sub.name} darkPatches]:`, JSON.stringify(subState?.audit?.darkPatches));
      }
      if (subState?.audit?.neonTextsCount > 0) {
        console.log(`    [DIAG ${sub.name} neonTexts]:`, JSON.stringify(subState?.audit?.neonTexts));
      }
      assert(`${menuIndex}.5 ${sub.name}: Audit 1 — Zero Dark Background Patches di komponen submodul`, subState?.audit?.darkPatchesCount === 0, `Dark patches: ${subState?.audit?.darkPatchesCount}`);
      assert(`${menuIndex}.6 ${sub.name}: Audit 2 — Zero Unreadable Neon Text`, subState?.audit?.neonTextsCount === 0, `Neon texts: ${subState?.audit?.neonTextsCount}`);

      if (subState?.hasTab) {
        assert(`${menuIndex}.7 ${sub.name}: Tab submodul berlatar soft bone (#EEF2F6), bukan hitam obsidian`, subState?.tabBg?.includes('238, 242, 246') || subState?.tabBg?.includes('248, 250, 252') || subState?.tabBg?.includes('255, 255, 255') || subState?.tabBg === 'rgba(0, 0, 0, 0)', subState?.tabBg);
      }
      if (subState?.hasActiveTab) {
        assert(`${menuIndex}.8 ${sub.name}: Tab aktif bertinta Kemenhub Navy (#0A2F73), bukan neon lime`, subState?.activeTabColor === 'rgb(10, 47, 115)', subState?.activeTabColor);
      }
      if (subState?.hasNotice) {
        assert(`${menuIndex}.9 ${sub.name}: Scope banner berlatar warm amber (#FEF3C7), bukan gelap`, subState?.noticeBg?.includes('254, 243, 199'), subState?.noticeBg);
      }

      const shotSub = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const shotPath = `Geo12-pages/shot-light-menu-${sub.id}-${sub.path.split('/')[2]}.png`;
      fs.writeFileSync(shotPath, Buffer.from(shotSub.data, 'base64'));
      assert(`${menuIndex}.10 Screenshot tersimpan`, fs.existsSync(shotPath), shotPath);

      menuIndex++;
    }

    // 13. Verifikasi 4 Dialog Modal dalam Light Mode
    console.log('\n--- Verifikasi 4 Dialog Modal dalam Light Mode ---');
    await cdp.eval(`
      (() => {
        const frame = document.getElementById('submoduleFrame');
        if (frame) frame.style.display = 'none';
        const board = document.querySelector('.board');
        if (board) board.style.display = '';
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const modals = [
      { id: 'modal-brt', title: 'BRT Trans Metro Pasundan', target: 'modal-brt' },
      { id: 'modal-ajap', title: 'AJAP / AJDP (Shuttle Resmi)', target: 'modal-ajap' },
      { id: 'modal-pariwisata', title: 'Angkutan Pariwisata', target: 'modal-pariwisata' },
      { id: 'modal-profil', title: 'Profil BPTD Kelas I Jabar', target: 'modal-profil' }
    ];

    for (const m of modals) {
      console.log(`\n  Menguji Dialog Modal: ${m.title} (#${m.id})...`);
      await cdp.eval(`
        (() => {
          const overlay = document.getElementById('${m.id}');
          if (overlay) overlay.classList.add('is-open');
        })()
      `);
      await new Promise(r => setTimeout(r, 400));

      const modalState = await cdp.eval(`
        (() => {
          ${auditSnippet}
          const overlay = document.getElementById('${m.id}');
          const modal = overlay ? overlay.querySelector('.rivet-modal') : null;
          if (!modal) return null;
          const modalBg = window.getComputedStyle(modal).backgroundColor;
          const heading = modal.querySelector('h3');
          const headingColor = heading ? window.getComputedStyle(heading).color : '';
          const firstLi = modal.querySelector('ul li');
          const liBg = firstLi ? window.getComputedStyle(firstLi).backgroundColor : '';

          const btnNeon = modal.querySelector('.btn--neon');
          const btnNeonBg = btnNeon ? window.getComputedStyle(btnNeon).backgroundColor : '';
          const btnNeonColor = btnNeon ? window.getComputedStyle(btnNeon).color : '';

          const audit = runColorHarmonizationAudit(modal);

          return {
            isOpen: overlay.classList.contains('is-open'),
            modalBg,
            headingColor,
            liBg,
            hasBtnNeon: !!btnNeon,
            btnNeonBg,
            btnNeonColor,
            audit
          };
        })()
      `);

      assert(`Modal ${m.title}: Berstatus is-open`, modalState?.isOpen === true);
      assert(`Modal ${m.title}: Latar modal adalah off-white anti-silau (#F8FAFC)`, modalState?.modalBg === 'rgb(248, 250, 252)', modalState?.modalBg);
      assert(`Modal ${m.title}: Judul bertinta slate kontras tinggi (#0F172A), bukan putih`, modalState?.headingColor === 'rgb(15, 23, 42)', modalState?.headingColor);
      assert(`Modal ${m.title}: Inset list item berlatar soft bone (#EEF2F6)`, !modalState?.liBg || modalState?.liBg?.includes('238, 242, 246'), modalState?.liBg);
      if (modalState?.hasBtnNeon) {
        assert(`Modal ${m.title}: Tombol aksi bertema Kemenhub Navy (#0A2F73), bukan neon lime`, modalState?.btnNeonBg === 'rgb(10, 47, 115)', modalState?.btnNeonBg);
      }
      assert(`Modal ${m.title}: Audit 1 — Zero Dark Patches di dalam modal`, modalState?.audit?.darkPatchesCount === 0, `Dark patches: ${modalState?.audit?.darkPatchesCount}`);
      assert(`Modal ${m.title}: Audit 2 — Zero Neon Text di dalam modal`, modalState?.audit?.neonTextsCount === 0, `Neon texts: ${modalState?.audit?.neonTextsCount}`);

      const shotModal = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`Geo12-pages/shot-light-${m.id}.png`, Buffer.from(shotModal.data, 'base64'));
      assert(`Modal ${m.title}: Screenshot tersimpan`, fs.existsSync(`Geo12-pages/shot-light-${m.id}.png`));

      await cdp.eval(`
        (() => {
          const overlay = document.getElementById('${m.id}');
          if (overlay) overlay.classList.remove('is-open');
        })()
      `);
      await new Promise(r => setTimeout(r, 200));
    }

    // Kembalikan ke mode default (dark) agar clean state
    await cdp.eval(`document.getElementById('themeToggle')?.click()`);
    await new Promise(r => setTimeout(r, 500));

    console.log('\n--- Pemeriksaan Konsol Browser ---');
    assert('Zero critical browser console errors', consoleErrors.length === 0, consoleErrors.join('; '));

    cdp.close();
  } catch (err) {
    console.error('CDP verification error:', err);
    failCount++;
  } finally {
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runVerification();
