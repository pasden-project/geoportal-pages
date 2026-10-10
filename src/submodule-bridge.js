/**
 * GeoPORTAL BPTD Jabar — Dark Rivet Submodule Bridge
 * =====================================================================
 * Script pendukung client-side yang diinjeksi pada seluruh submodul Command
 * Center di Port 8082:
 * 1. Mengganti sidebar legasi menjadi 100% otentik Dark Rivet (<aside class="side" id="side">).
 * 2. Menginjeksi RIVET SVG Sprite (ikon akordeon, grid, peta, chart, buku, dll.).
 * 3. Menangani interaktivitas akordeon (Activity & Moda, Intelligence, Laporan & Master).
 * 4. Menyinkronkan status menu aktif sesuai URL berjalan.
 * 5. Mengeliminasi kontras tabrakan & bilah pastel terang secara dinamis.
 * 6. Menjaga jam live WIB, API status pill, dan Leaflet dark matter map filter.
 * =====================================================================
 */

(function () {
  'use strict';
  // 0. Deteksi Status Embedded / Standalone Secara Pre-Paint
  var isPreEmbedded = (window.self !== window.top) || window.location.search.includes('embed=1');
  if (isPreEmbedded) {
    document.documentElement.classList.add('is-embedded');
    if (document.body) {
      document.body.classList.add('is-embedded');
    }
  } else {
    // Standalone access (buka langsung di address bar):
    // Redirect ke single persistent shell dengan deep-link hash
    try {
      var currentPath = window.location.pathname;
      if (currentPath && currentPath.startsWith('/command-center/')) {
        window.location.replace('/#' + currentPath);
        return;
      }
    } catch (_) {}
  }


  // 1. Injeksi SVG Sprite Otentik Dark Rivet (Bila Belum Tersedia)
  function ensureRivetSvgSprite() {
    if (document.getElementById('i-grid')) return;

    const spriteContainer = document.createElement('div');
    spriteContainer.innerHTML = `
      <svg class="sprite" aria-hidden="true" focusable="false" style="display:none; position:absolute; width:0; height:0;">
        <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></symbol>
        <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11.5A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5v-10Z"/><path d="M14.5 12.5h6v4h-6a2 2 0 0 1 0-4Z"/></symbol>
        <symbol id="i-activity" viewBox="0 0 24 24"><path d="M3.5 12h3.6l2.6-6.5 4.6 13 2.6-6.5h3.6"/></symbol>
        <symbol id="i-flow" viewBox="0 0 24 24"><path d="M4 8h12.5l-3-3M20 16H7.5l3 3"/></symbol>
        <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></symbol>
        <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 19.5h16M6.5 15.5v-4M11 15.5V8M15.5 15.5v-6M20 15.5V5"/></symbol>
        <symbol id="i-book" viewBox="0 0 24 24"><path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h4.5c.8 0 1.5.7 1.5 1.5V20c0-1-.7-1.6-1.5-1.6H4.5v-13ZM19.5 5.5A1.5 1.5 0 0 0 18 4h-4.5c-.8 0-1.5.7-1.5 1.5V20c0-1 .7-1.6 1.5-1.6h6v-13Z"/></symbol>
        <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="m6 6 3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5"/></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5l1.5-1.5ZM10 20.5a2 2 0 0 0 4 0"/></symbol>
        <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-chev-d" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></symbol>
        <symbol id="i-chev-l" viewBox="0 0 24 24"><path d="m14 7-5 5 5 5"/></symbol>
        <symbol id="i-chev-r" viewBox="0 0 24 24"><path d="m10 7 5 5-5 5"/></symbol>
        <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6L13 3Z"/></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></symbol>
        <symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></symbol>
        <symbol id="i-bars" viewBox="0 0 24 24"><path d="M7 18V10M12 18V6M17 18v-4"/></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3.5 19 6.5v5c0 4.6-3 8.2-7 9.5-4-1.3-7-4.9-7-9.5v-5l7-3Z"/><path d="m9 12 2 2 4-4"/></symbol>
        <symbol id="i-plane" viewBox="0 0 24 24"><path d="M10 14 4 12l16-8-4 16-4-6ZM10 14l10-10"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-topup" viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/></symbol>
      </svg>
    `;
    document.body.prepend(spriteContainer.firstElementChild);
  }

  // 2. Buat dan Pasang 100% Sidebar Otentik Dark Rivet
  function buildAuthenticSidebar() {
    const existingSidebar = document.querySelector('.app-sidebar, aside.side, #appSidebar');
    if (!existingSidebar) return;

    // Jika sudah menggunakan struktur otentik Dark Rivet dengan group akordeon, jangan duplikasi
    if (existingSidebar.querySelector('#group-transport')) {
      setupSidebarInteractivity(existingSidebar);
      return;
    }

    const currentPath = window.location.pathname.replace(/\/$/, '') + '/';

    const authenticMarkup = `
      <div style="display: flex; align-items: center; justify-content: space-between; padding-right: 4px; margin-bottom: 12px;">
        <a class="brand" href="/" aria-label="GeoPORTAL Home" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
          <span class="brand__mark" aria-hidden="true">
            <img src="/assets/logo-kemenhub.svg" alt="Logo Kemenhub" class="brand__logo-img brand__logo-img--kemenhub" />
            <img src="/assets/logo-hubdat.png" alt="Logo Ditjen Hubdat" class="brand__logo-img brand__logo-img--hubdat" />
          </span>
          <span class="brand__name">
            <span class="brand__title">GeoPORTAL</span>
            <span class="brand__instansi">BPTD Jabar</span>
            <span class="brand__tag">Angkutan</span>
          </span>
        </a>
        <button class="side__close" type="button" id="sideClose" aria-label="Tutup menu" style="background: transparent; border: 1px solid var(--hair, rgba(255,255,255,0.08)); border-radius: 6px; color: var(--dim, #aab0c2); cursor: pointer; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;"><svg class="ico" style="width: 14px; height: 14px; stroke: currentColor;"><use href="#i-x"/></svg></button>
      </div>

      <nav class="nav" aria-label="Sections" style="flex: 1; display: flex; flex-direction: column;">
        <span class="nav__pill" id="navPill" aria-hidden="true"></span>
        
        <!-- MAIN NAVIGATION LIST -->
        <ul class="nav__list" style="list-style: none; margin: 0; padding: 0;">
          <li><a class="nav__item" href="/" data-nav data-route="/"><svg class="ico"><use href="#i-grid"/></svg><span>Dashboard</span></a></li>
          <li><a class="nav__item" href="/peta/" target="_blank" data-nav data-route="/peta/"><svg class="ico"><use href="#i-flow"/></svg><span>Peta GeoPORTAL</span></a></li>
          <li><a class="nav__item" href="/command-center/terminal/" data-nav data-route="/command-center/terminal/"><svg class="ico"><use href="#i-wallet"/></svg><span>Terminal</span></a></li>
          <li><a class="nav__item" href="/command-center/trayek/" data-nav data-route="/command-center/trayek/"><svg class="ico"><use href="#i-activity"/></svg><span>Trayek</span></a></li>

          <!-- EXPANDABLE ACCORDION 1: ACTIVITY & MODA TRANSPORTATION -->
          <li class="nav__group is-open" id="group-transport">
            <button class="nav__item nav__item--toggle" type="button" data-nav aria-expanded="true" aria-controls="sub-transport">
              <svg class="ico"><use href="#i-bars"/></svg><span>Activity & Moda</span>
              <svg class="ico ico--chev"><use href="#i-chev-d"/></svg>
            </button>
            <div class="nav__sub" id="sub-transport">
              <ul style="list-style: none; margin: 0; padding: 0;">
                <li><a class="nav__subitem" href="/command-center/trayek/" data-route="/command-center/trayek/">AKAP / AKDP <span class="badge">12</span></a></li>
                <li><a class="nav__subitem" href="/command-center/perintis/" data-route="/command-center/perintis/">Perintis PSO <span class="badge" style="background: rgba(212, 255, 63, 0.2); color: var(--n-lime, #d4ff3f);">6</span></a></li>
                <li><a class="nav__subitem" href="/command-center/uppkb/" data-route="/command-center/uppkb/">UPPKB Barang <span class="badge" style="background: rgba(255, 190, 77, 0.2); color: var(--n-amber, #ffbe4d);">6</span></a></li>
                <li><a class="nav__subitem" href="javascript:void(0)" data-modal-target="modal-brt">BRT Trans Metro</a></li>
                <li><a class="nav__subitem" href="javascript:void(0)" data-modal-target="modal-ajap">AJAP / AJDP</a></li>
                <li><a class="nav__subitem" href="javascript:void(0)" data-modal-target="modal-pariwisata">Pariwisata</a></li>
              </ul>
            </div>
          </li>

          <!-- EXPANDABLE ACCORDION 2: INTELLIGENCE -->
          <li class="nav__group is-open" id="group-intel">
            <button class="nav__item nav__item--toggle" type="button" data-nav aria-expanded="true" aria-controls="sub-intel">
              <svg class="ico"><use href="#i-chart"/></svg><span>Intelligence</span>
              <svg class="ico ico--chev"><use href="#i-chev-d"/></svg>
            </button>
            <div class="nav__sub" id="sub-intel">
              <ul style="list-style: none; margin: 0; padding: 0;">
                <li><a class="nav__subitem" href="/command-center/od/" data-route="/command-center/od/">OD Matrix</a></li>
                <li><a class="nav__subitem" href="/command-center/connectivity/" data-route="/command-center/connectivity/">Connectivity</a></li>
                <li><a class="nav__subitem" href="/command-center/early-warning/" data-route="/command-center/early-warning/">Early Warning <span class="badge badge--amber" style="background: rgba(255, 190, 77, 0.25); color: var(--n-amber, #ffbe4d); font-size: 8.5px; padding: 0 4px;">(DEMO)</span></a></li>
              </ul>
            </div>
          </li>
        </ul>

        <!-- DIVIDER -->
        <hr class="nav__sep" style="border: none; border-top: 1px solid var(--hair, rgba(255,255,255,0.08)); margin: 12px 0;">

        <!-- EXPANDABLE ACCORDION 3: LAPORAN & MASTER (UTILITY) -->
        <ul class="nav__list nav__list--secondary" style="list-style: none; margin: 0; padding: 0;">
          <li class="nav__group is-open" id="group-utility">
            <button class="nav__item nav__item--toggle" type="button" data-nav aria-expanded="true" aria-controls="sub-utility">
              <svg class="ico"><use href="#i-book"/></svg><span>Laporan & Master</span>
              <svg class="ico ico--chev"><use href="#i-chev-d"/></svg>
            </button>
            <div class="nav__sub" id="sub-utility">
              <ul style="list-style: none; margin: 0; padding: 0;">
                <li><a class="nav__subitem" href="/command-center/program/" data-route="/command-center/program/">Kinerja PSO <span class="badge badge--amber" style="background: rgba(255, 190, 77, 0.25); color: var(--n-amber, #ffbe4d); font-size: 8.5px; padding: 0 4px;">(DEMO)</span></a></li>
                <li><a class="nav__subitem" href="/command-center/laporan/" data-route="/command-center/laporan/">Laporan Realisasi</a></li>
                <li><a class="nav__subitem" href="/command-center/data-master/" data-route="/command-center/data-master/">Data Master</a></li>
                <li><a class="nav__subitem" href="javascript:void(0)" data-modal-target="modal-profil">Profil BPTD</a></li>
              </ul>
            </div>
          </li>
        </ul>

        <div class="side__foot" style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--hair, rgba(255,255,255,0.08));">
          <div style="font-size: 11px; color: var(--dim, #aab0c2); display: flex; align-items: center; gap: 6px;">
            <span class="status-dot-pulse"></span>
            <span>API Gateway Live</span>
          </div>
          <span style="font-size: 10px; color: var(--faint, #60687a); display: block; margin-top: 2px;">16 Menu Terintegrasi</span>
        </div>
      </nav>
    `;

    // Pastikan elemen sidebar memiliki class dan atribut yang sesuai
    existingSidebar.className = 'side app-sidebar';
    existingSidebar.id = 'side';
    existingSidebar.innerHTML = authenticMarkup;

    setupSidebarInteractivity(existingSidebar);
  }

  // 3. Interaktivitas Akordeon, Highlight Rute Aktif & Mobile Drawer
  function setupSidebarInteractivity(sidebar) {
    const currentPath = window.location.pathname.replace(/\/$/, '') + '/';

    // Highlight tautan aktif
    let matchFound = false;
    const allLinks = sidebar.querySelectorAll('a[data-route]');
    allLinks.forEach(link => {
      const route = link.getAttribute('data-route');
      const isDirectMatch = route === currentPath;
      const isRootMatch = (route === '/' && (currentPath === '/' || currentPath === '/command-center/'));
      
      if (isDirectMatch || isRootMatch) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
        matchFound = true;

        // Buka grup akordeon bila link berada di dalam submenu
        const parentGroup = link.closest('.nav__group');
        if (parentGroup) {
          parentGroup.classList.add('is-open');
          const toggle = parentGroup.querySelector('.nav__item--toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });

    // Fallback: jika URL cocok dengan submodul tertentu
    if (!matchFound) {
      if (currentPath.includes('/terminal/')) {
        const item = sidebar.querySelector('[data-route*="terminal"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/trayek/')) {
        const item = sidebar.querySelector('[data-route*="trayek"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/perintis/')) {
        const item = sidebar.querySelector('[data-route*="perintis"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/uppkb/')) {
        const item = sidebar.querySelector('[data-route*="uppkb"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/od/')) {
        const item = sidebar.querySelector('[data-route*="od"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/connectivity/')) {
        const item = sidebar.querySelector('[data-route*="connectivity"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/early-warning/')) {
        const item = sidebar.querySelector('[data-route*="early-warning"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/program/')) {
        const item = sidebar.querySelector('[data-route*="program"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/laporan/')) {
        const item = sidebar.querySelector('[data-route*="laporan"]');
        if (item) item.classList.add('is-active');
      } else if (currentPath.includes('/data-master/')) {
        const item = sidebar.querySelector('[data-route*="data-master"]');
        if (item) item.classList.add('is-active');
      }
    }

    // Pasang toggle click pada .nav__item--toggle
    sidebar.querySelectorAll('.nav__item--toggle').forEach(toggle => {
      // Hapus listener lama jika ada
      toggle.replaceWith(toggle.cloneNode(true));
    });

    sidebar.querySelectorAll('.nav__item--toggle').forEach(toggle => {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const group = toggle.closest('.nav__group');
        if (!group) return;
        const isOpen = group.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    });

    // Setup Backdrop Drawer Mobile
    let backdrop = document.getElementById('sideBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'sideBackdrop';
      backdrop.className = 'side-backdrop';
      document.body.appendChild(backdrop);
    }

    function openMobileSidebar() {
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-open');
    }

    function closeMobileSidebar() {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
    }

    const sideCloseBtn = sidebar.querySelector('#sideClose');
    if (sideCloseBtn) sideCloseBtn.addEventListener('click', closeMobileSidebar);
    backdrop.addEventListener('click', closeMobileSidebar);

    // Hubungkan tombol pembuka drawer pada topbar / header
    const toggleBtns = document.querySelectorAll('#sidebarToggle, #menu, .header-menu-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (sidebar.classList.contains('is-open')) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
        closeMobileSidebar();
      }
    });
  }

  // 4. Sanitizer DOM: Eliminasi Kontras Tabrakan & Normalisasi Bilah Pastel
  function sanitizePastelColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.documentElement.classList.contains('theme-light') || (document.body && document.body.classList.contains('theme-light'));
    if (isLight) return;
    const pastelSignatures = [
      { target: '#fef2f2', bg: 'rgba(255, 92, 138, 0.15)', col: '#ff5c8a', border: 'rgba(255, 92, 138, 0.3)' },
      { target: '#fef3c7', bg: 'rgba(255, 190, 77, 0.15)', col: '#ffbe4d', border: 'rgba(255, 190, 77, 0.3)' },
      { target: '#e0f2fe', bg: 'rgba(62, 242, 255, 0.15)', col: '#3ef2ff', border: 'rgba(62, 242, 255, 0.3)' },
      { target: '#dcfce7', bg: 'rgba(212, 255, 63, 0.15)', col: '#d4ff3f', border: 'rgba(212, 255, 63, 0.3)' },
      { target: '#ede9fe', bg: 'rgba(169, 139, 255, 0.15)', col: '#a98bff', border: 'rgba(169, 139, 255, 0.3)' },
      { target: '#f3e8ff', bg: 'rgba(169, 139, 255, 0.15)', col: '#a98bff', border: 'rgba(169, 139, 255, 0.3)' },
      { target: '254, 226, 226', bg: 'rgba(255, 92, 138, 0.15)', col: '#ff5c8a', border: 'rgba(255, 92, 138, 0.3)' },
      { target: '254, 242, 242', bg: 'rgba(255, 92, 138, 0.15)', col: '#ff5c8a', border: 'rgba(255, 92, 138, 0.3)' },
      { target: '254, 243, 199', bg: 'rgba(255, 190, 77, 0.15)', col: '#ffbe4d', border: 'rgba(255, 190, 77, 0.3)' },
      { target: '224, 242, 254', bg: 'rgba(62, 242, 255, 0.15)', col: '#3ef2ff', border: 'rgba(62, 242, 255, 0.3)' },
      { target: '220, 252, 231', bg: 'rgba(212, 255, 63, 0.15)', col: '#d4ff3f', border: 'rgba(212, 255, 63, 0.3)' },
      { target: '243, 232, 255', bg: 'rgba(169, 139, 255, 0.15)', col: '#a98bff', border: 'rgba(169, 139, 255, 0.3)' },
      { target: '237, 233, 254', bg: 'rgba(169, 139, 255, 0.15)', col: '#a98bff', border: 'rgba(169, 139, 255, 0.3)' }
    ];

    document.querySelectorAll('.kpi-icon-wrap, [style*="background"]').forEach(el => {
      const styleAttr = el.getAttribute('style') || '';
      if (!styleAttr) return;

      for (let i = 0; i < pastelSignatures.length; i++) {
        const sig = pastelSignatures[i];
        if (styleAttr.includes(sig.target)) {
          el.style.backgroundColor = sig.bg;
          el.style.color = sig.col;
          el.style.borderColor = sig.border;
          el.style.borderWidth = '1px';
          el.style.borderStyle = 'solid';
          break;
        }
      }
    });

    // Batasi dimensi .kpi-icon-wrap agar tidak pernah merentang menjadi bilah lebar
    document.querySelectorAll('.kpi-icon-wrap').forEach(wrap => {
      wrap.style.width = '38px';
      wrap.style.height = '38px';
      wrap.style.minWidth = '38px';
      wrap.style.maxWidth = '38px';
      wrap.style.display = 'inline-flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.borderRadius = '8px';
      wrap.style.marginBottom = '10px';
      wrap.style.flexShrink = '0';
    });

    // Pastikan kontainer berlatar putih dinetralkan ke #0d0e12
    document.querySelectorAll('div, section, article, table, tr, td, th').forEach(el => {
      const bg = el.style.backgroundColor || el.style.background;
      if (bg && (bg.includes('255, 255, 255') || bg.includes('#fff') || bg.includes('white'))) {
        el.style.backgroundColor = '#0d0e12';
      }
    });
  }

  // 5. Sinkronisasi Jam Digital WIB
  function updateWibClock() {
    const timeElem = document.getElementById('current-time') || document.getElementById('liveClock');
    const dateElem = document.getElementById('current-date');
    if (!timeElem && !dateElem) return;

    const now = new Date();
    const optionsTime = { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const optionsDate = { timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };

    try {
      const timeStr = new Intl.DateTimeFormat('id-ID', optionsTime).format(now);
      const dateStr = new Intl.DateTimeFormat('id-ID', optionsDate).format(now);
      if (timeElem) timeElem.textContent = `${timeStr} WIB`;
      if (dateElem) dateElem.textContent = dateStr;
    } catch (_) {
      const pad = n => String(n).padStart(2, '0');
      if (timeElem) timeElem.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())} WIB`;
    }
  }

  // 6. Sinkronisasi Status API Pill
  function syncApiPills() {
    const apiOk = document.getElementById('apiStatusOk');
    const apiErr = document.getElementById('apiStatusErr');
    if (apiOk && apiErr) {
      function checkPills() {
        if (apiOk.hasAttribute('hidden')) apiOk.style.display = 'none';
        else apiOk.style.display = 'inline-flex';
        if (apiErr.hasAttribute('hidden')) apiErr.style.display = 'none';
        else apiErr.style.display = 'inline-flex';
      }
      checkPills();
      const obs = new MutationObserver(checkPills);
      obs.observe(apiOk, { attributes: true, attributeFilter: ['hidden'] });
      obs.observe(apiErr, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  // 7. Intersepsi Tile Layer Leaflet & Filter Basemap Dark Obsidian
  function interceptLeafletBasemaps() {
    if (window.L && L.tileLayer && !window.__L_carto_patched) {
      window.__L_carto_patched = true;
      const origTileLayer = L.tileLayer;
      L.tileLayer = function (url, options) {
        if (typeof url === 'string' && url.includes('cartocdn.com')) {
          url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
          options = options || {};
          options.attribution = options.attribution || '&copy; OpenStreetMap contributors';
        }
        return origTileLayer.call(this, url, options);
      };
    }
  }

  function applyLeafletDarkMatter() {
    interceptLeafletBasemaps();
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.documentElement.classList.contains('theme-light') || (document.body && document.body.classList.contains('theme-light'));
    document.querySelectorAll('.leaflet-tile-pane').forEach(tilePane => {
      // Pastikan ubin cartocdn lama dialihkan ke OSM jika ada
      tilePane.querySelectorAll('img.leaflet-tile').forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src.includes('cartocdn.com')) {
          img.src = src.replace(/https?:\/\/[a-d]\.basemaps\.cartocdn\.com\/dark_all/g, 'https://tile.openstreetmap.org').replace(/@\d+x|\.png.*$/g, '.png');
        }
      });
      // Terapkan filter sesuai mode
      if (isLight) {
        tilePane.style.filter = 'contrast(1.05) saturate(0.85) brightness(0.98)';
      } else {
        tilePane.style.filter = 'brightness(0.55) invert(1) contrast(2.6) hue-rotate(205deg) saturate(0.25) brightness(0.72)';
      }
    });
  }

  // Sinkronisasi Tema Otomatis dengan Shell Induk
  function applyThemeToSubmodule(theme) {
    const isLight = (theme === 'light');
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    document.documentElement.classList.toggle('theme-light', isLight);
    if (document.body) {
      document.body.classList.toggle('theme-light', isLight);
    }
    applyLeafletDarkMatter();
    if (!isLight) {
      sanitizePastelColors();
    }
  }

  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.type === 'GEO_THEME_CHANGE') {
      applyThemeToSubmodule(e.data.theme);
    }
  });

  // Inisialisasi Utama
  function initSubmoduleBridge() {
    interceptLeafletBasemaps();
    let currentTheme = 'dark';
    try {
      currentTheme = localStorage.getItem('geoportal-theme') || localStorage.getItem('geoterminal_theme') || 'dark';
    } catch (_) {}
    applyThemeToSubmodule(currentTheme);

    const isEmbedded = (window.self !== window.top) || window.location.search.includes('embed=1');
    if (isEmbedded) {
      document.documentElement.classList.add('is-embedded');
      if (document.body) document.body.classList.add('is-embedded');

      const existingSidebars = document.querySelectorAll('.app-sidebar, aside.side, #appSidebar');
      existingSidebars.forEach(function (el) { el.style.display = 'none'; });

      const existingHeaders = document.querySelectorAll('.app-header, .top-bar, .topbar, header');
      existingHeaders.forEach(function (el) { el.style.display = 'none'; });

      // Delegasi navigasi internal ke shell induk tanpa reload sidebar
      document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('javascript:') || href === '#') return;

        // Tautan peta didelegasikan ke window parent /maps/
        if (href.startsWith('/maps') || href === '/maps' || href === '/maps/') {
          e.preventDefault();
          try {
            window.parent.location.href = '/maps/';
          } catch (_) {
            window.location.href = '/maps/';
          }
          return;
        }

        // Tautan modul lain didelegasikan ke shell induk via postMessage
        if (href.startsWith('/command-center/') || href === '/' || href.startsWith('./') || href.startsWith('../')) {
          e.preventDefault();
          const targetPath = link.pathname || href;
          window.parent.postMessage({ type: 'GEO_NAVIGATE', path: targetPath }, '*');
        }
      }, true);
    } else {
      ensureRivetSvgSprite();
      buildAuthenticSidebar();
    }

    sanitizePastelColors();
    updateWibClock();
    syncApiPills();
    applyLeafletDarkMatter();

    setInterval(updateWibClock, 1000);
    setTimeout(applyLeafletDarkMatter, 1500);
    setTimeout(applyLeafletDarkMatter, 3500);
    setTimeout(sanitizePastelColors, 800);
    setTimeout(sanitizePastelColors, 2000);

    // Amati perubahan DOM untuk sanitasi elemen dinamis & jaga kestabilan tema
    const domObserver = new MutationObserver(function () {
      let curTheme = 'dark';
      try { curTheme = localStorage.getItem('geoportal-theme') || localStorage.getItem('geoterminal_theme') || 'dark'; } catch(_) {}
      if (curTheme === 'light') {
        if (document.documentElement.getAttribute('data-theme') !== 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        }
        if (!document.documentElement.classList.contains('theme-light')) {
          document.documentElement.classList.add('theme-light');
        }
      }
      sanitizePastelColors();
      applyLeafletDarkMatter();
    });
    domObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubmoduleBridge);
  } else {
    initSubmoduleBridge();
  }
})();
