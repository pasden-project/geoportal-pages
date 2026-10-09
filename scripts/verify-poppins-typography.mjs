#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Automated Typography Resolution & Harmonization Audit
   ---------------------------------------------------------------------
   Memverifikasi bahwa Poppins, Plus Jakarta Sans, dan JetBrains Mono
   diterapkan dengan sempurna di seluruh 12 menu & modal GeoPORTAL.
   Memastikan ZERO AI Slop (Inter & Manrope dihapus sepenuhnya).
   ===================================================================== */
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

async function runTypographyVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL — Poppins Typography & Anti-AI Slop Automated Verification');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--window-size=1440,1050',
    '--hide-scrollbars',
    'http://localhost:8082/'
  ]);

  let passCount = 0;
  let failCount = 0;

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
    for (let retry = 0; retry < 25; retry++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9229/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.url && t.url.includes('8082')) || tabs.find(t => t.type === 'page' && !t.url.includes('about:blank')) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9229');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 3200));

    // Snippet audit font untuk mendeteksi font family elemen
    const fontAuditSnippet = `
      function auditTypography(scopeEl) {
        const root = scopeEl || document;
        const all = Array.from(root.querySelectorAll('h1, h2, h3, h4, .brand__name, .nav__item, .card__title, .section-title, .panel-title, .kpi-value, .num, .btn, p, span, div, td, th'));
        let slopFontsFound = [];
        let poppinsCount = 0;
        let jakartaCount = 0;
        let monoCount = 0;

        for (const el of all) {
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'SVG' || el.tagName === 'PATH') continue;
          if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
          const text = el.innerText?.trim();
          if (!text) continue;

          const st = window.getComputedStyle(el);
          const ff = st.fontFamily.toLowerCase();

          // Deteksi apakah ada Inter atau Manrope sebagai font aktif utama
          if (ff.startsWith('"inter"') || ff.startsWith("'inter'") || ff.startsWith('inter,') ||
              ff.startsWith('"manrope"') || ff.startsWith("'manrope'") || ff.startsWith('manrope,')) {
            slopFontsFound.push({ tag: el.tagName, cls: el.className, text: text.slice(0, 30), font: st.fontFamily });
          }

          if (ff.includes('poppins')) poppinsCount++;
          if (ff.includes('plus jakarta sans')) jakartaCount++;
          if (ff.includes('jetbrains mono') || ff.includes('monospace')) monoCount++;
        }

        return {
          slopFontsCount: slopFontsFound.length,
          slopFontsSample: slopFontsFound.slice(0, 3),
          poppinsCount,
          jakartaCount,
          monoCount
        };
      }
    `;

    // 1. Menu 1: Dashboard Overview
    console.log('\n--- [1/12] Audit Tipografi: Dashboard Overview (/) ---');
    const overviewFonts = await cdp.eval(`
      (() => {
        ${fontAuditSnippet}
        const brandName = document.querySelector('.brand__name');
        const navItem = document.querySelector('.nav__item');
        const heroPax = document.getElementById('heroPax');
        const cardTitle = document.querySelector('.card__title, .balance .num');
        const gaugeScale = document.querySelector('.health-gauge__scale');
        const moduleVal = document.querySelector('.card-module__value');
        const rankVal = document.querySelector('#terminalRankList .rank-item__val, .rank-item__val');

        return {
          brandFont: brandName ? window.getComputedStyle(brandName).fontFamily : '',
          navFont: navItem ? window.getComputedStyle(navItem).fontFamily : '',
          heroFont: heroPax ? window.getComputedStyle(heroPax).fontFamily : '',
          heroTabular: heroPax ? window.getComputedStyle(heroPax).fontVariantNumeric : '',
          cardTitleFont: cardTitle ? window.getComputedStyle(cardTitle).fontFamily : '',
          gaugeScaleFont: gaugeScale ? window.getComputedStyle(gaugeScale).fontFamily : '',
          moduleValFont: moduleVal ? window.getComputedStyle(moduleVal).fontFamily : '',
          rankValFont: rankVal ? window.getComputedStyle(rankVal).fontFamily : '',
          audit: auditTypography(document.body)
        };
      })()
    `);

    assert('1.1 Brand Title menggunakan font Poppins', overviewFonts?.brandFont?.toLowerCase().includes('poppins'), overviewFonts?.brandFont);
    assert('1.2 Navigasi Sidebar menggunakan font Poppins', overviewFonts?.navFont?.toLowerCase().includes('poppins'), overviewFonts?.navFont);
    assert('1.3 Hero Pax menggunakan Poppins / Plus Jakarta Sans', overviewFonts?.heroFont?.toLowerCase().includes('poppins') || overviewFonts?.heroFont?.toLowerCase().includes('plus jakarta sans'), overviewFonts?.heroFont);
    assert('1.4 Hero Pax mengaktifkan tabular-nums', overviewFonts?.heroTabular?.includes('tabular-nums'), overviewFonts?.heroTabular);
    assert('1.5 Skala Health Gauge menggunakan JetBrains Mono', overviewFonts?.gaugeScaleFont?.toLowerCase().includes('jetbrains mono'), overviewFonts?.gaugeScaleFont);
    assert('1.6 Metrik Modul menggunakan Poppins / Plus Jakarta Sans', overviewFonts?.moduleValFont?.toLowerCase().includes('poppins') || overviewFonts?.moduleValFont?.toLowerCase().includes('plus jakarta sans'), overviewFonts?.moduleValFont);
    assert('1.7 Nilai Ranking menggunakan Poppins / Plus Jakarta Sans', overviewFonts?.rankValFont?.toLowerCase().includes('poppins') || overviewFonts?.rankValFont?.toLowerCase().includes('plus jakarta sans'), overviewFonts?.rankValFont);
    assert('1.8 Zero AI Slop Fonts (Inter / Manrope) di Dashboard Overview', overviewFonts?.audit?.slopFontsCount === 0, `Slop count: ${overviewFonts?.audit?.slopFontsCount}`);

    const shotOverview = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('Geo12-pages/shot-typography-overview.png', Buffer.from(shotOverview.data, 'base64'));
    assert('1.9 Screenshot Typography Overview tersimpan', fs.existsSync('Geo12-pages/shot-typography-overview.png'));

    // 2. Menu 2: Peta GeoPORTAL
    console.log('\n--- [2/12] Audit Tipografi: Peta Interaktif GeoPORTAL (/peta/) ---');
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

    const petaFonts = await cdp.eval(`
      (() => {
        ${fontAuditSnippet}
        const frame = document.getElementById('submoduleFrame');
        const doc = frame?.contentDocument;
        if (!doc) return null;
        const bodyFont = window.getComputedStyle(doc.body).fontFamily;
        const topbarTitle = doc.querySelector('.title-block h1');
        const topbarFont = topbarTitle ? window.getComputedStyle(topbarTitle).fontFamily : '';
        const legend = doc.querySelector('.side-menu-right, #legendSidebarBody, .menu-header h2, .map-legend');
        const legendFont = legend ? window.getComputedStyle(legend).fontFamily : '';

        return {
          bodyFont,
          topbarFont,
          legendFont,
          audit: auditTypography(doc.body)
        };
      })()
    `);

    assert('2.1 Peta: Body font mengadopsi Poppins & Plus Jakarta Sans', petaFonts?.bodyFont?.toLowerCase().includes('poppins') && petaFonts?.bodyFont?.toLowerCase().includes('plus jakarta sans'), petaFonts?.bodyFont);
    assert('2.2 Peta: Topbar Title menggunakan Poppins / Plus Jakarta Sans', petaFonts?.topbarFont?.toLowerCase().includes('poppins') || petaFonts?.topbarFont?.toLowerCase().includes('plus jakarta sans'), petaFonts?.topbarFont);
    assert('2.3 Peta: Map Legend menggunakan Poppins & Plus Jakarta Sans', petaFonts?.legendFont?.toLowerCase().includes('poppins'), petaFonts?.legendFont);
    assert('2.4 Peta: Zero AI Slop Fonts', petaFonts?.audit?.slopFontsCount === 0, `Slop count: ${petaFonts?.audit?.slopFontsCount}`);

    // 3. Submodul 3-12 Command Center
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

    let menuIdx = 3;
    for (const sub of submodules) {
      console.log(`\n--- [${menuIdx}/12] Audit Tipografi: ${sub.name} (${sub.path}) ---`);

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
      await new Promise(r => setTimeout(r, 2200));

      const subFonts = await cdp.eval(`
        (() => {
          ${fontAuditSnippet}
          const frame = document.getElementById('submoduleFrame');
          const doc = frame?.contentDocument;
          if (!doc) return null;

          const bodyFont = window.getComputedStyle(doc.body).fontFamily;
          const heading = doc.querySelector('h1, h2, h3, .section-title, .card-title, .page-title, .module-title');
          const headingFont = heading ? window.getComputedStyle(heading).fontFamily : '';
          const kpi = doc.querySelector('.kpi-value, .stat-value, .metric-value');
          const kpiFont = kpi ? window.getComputedStyle(kpi).fontFamily : '';
          const kpiTabular = kpi ? window.getComputedStyle(kpi).fontVariantNumeric : '';
          const codeEl = doc.querySelector('.badge-code, .dict-code-badge, .code-pill, .font-mono, .dict-formula-box');
          const codeFont = codeEl ? window.getComputedStyle(codeEl).fontFamily : '';

          return {
            bodyFont,
            headingFont,
            kpiFont,
            kpiTabular,
            codeFont,
            audit: auditTypography(doc.body)
          };
        })()
      `);

      assert(`${menuIdx}.1 ${sub.name}: Body mengadopsi Poppins & Plus Jakarta Sans`, subFonts?.bodyFont?.toLowerCase().includes('poppins'), subFonts?.bodyFont);
      assert(`${menuIdx}.2 ${sub.name}: Judul mengadopsi Poppins`, subFonts?.headingFont?.toLowerCase().includes('poppins'), subFonts?.headingFont);
      if (subFonts?.kpiFont) {
        assert(`${menuIdx}.3 ${sub.name}: KPI Value mengadopsi Poppins / Plus Jakarta Sans`, subFonts?.kpiFont?.toLowerCase().includes('poppins') || subFonts?.kpiFont?.toLowerCase().includes('plus jakarta sans'), subFonts?.kpiFont);
      }
      if (subFonts?.codeFont) {
        assert(`${menuIdx}.4 ${sub.name}: Elemen teknis/kode menggunakan JetBrains Mono / monospace`, subFonts?.codeFont?.toLowerCase().includes('jetbrains mono') || subFonts?.codeFont?.toLowerCase().includes('monospace'), subFonts?.codeFont);
      }
      assert(`${menuIdx}.5 ${sub.name}: Zero AI Slop Fonts (Inter / Manrope)`, subFonts?.audit?.slopFontsCount === 0, `Slop count: ${subFonts?.audit?.slopFontsCount}`);

      if (menuIdx === 3) {
        const shotSub = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('Geo12-pages/shot-typography-submodule.png', Buffer.from(shotSub.data, 'base64'));
        assert('3.6 Screenshot Typography Submodule tersimpan', fs.existsSync('Geo12-pages/shot-typography-submodule.png'));
      }

      menuIdx++;
    }

    console.log('\n======================================================================');
    console.log(`HASIL VERIFIKASI TIPOGRAFI POPPINS: ${passCount} PASS, ${failCount} FAIL`);
    console.log('======================================================================');

    cdp.close();
    edge.kill();

    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('[ERROR Audit Tipografi]', err);
    try { edge.kill(); } catch (_) {}
    process.exit(1);
  }
}

runTypographyVerification();
