/*
JS.html - FINAL MANUAL ROUTE
Semua fungsi diperbaiki, routing manual (tanpa OSRM)
*/
let map, chartTrendPnp, chartTrendKnd, chartBarPnp, chartBarKnd;
let allPoints = [], markerRefs = {}, selectedKode = null, markersByTipe = {}, markersCluster;
let routesLayer = null, uppkbMarkers = [], legendControl = null, routePolylines = {}, savedRoutesData = [];
let basemapLayer = null;
let routeBuilder = {
  active: false,
  viaMarkers: [],
  viaPoints: [],
  routePolyline: null,
  origin: { lat: -6.9450, lng: 107.5938 },
  lastRouteResult: null,
  lastOriginCode: '',
  lastDestCode: '',
  // Fitur edit + salin titik: id trayek yang sedang diedit, dan titik yang disalin.
  editRouteId: null,
  clipboardPoints: []
};
let currentProfileKode = '';
let rawDataLoaded = false;
// State foto profil: URL yang tersimpan di DB + data base64 sementara (jika user memilih file baru).
let profileFotoUrl = '';
let profileFotoData = null;
let legendState = { simpul: { visible: true }, trayek: { visible: false }, uppkb: { visible: true }, choropleth: true };
let routeColor = '#3b82f6';
const PALETTE_COLOR_TRAYEK = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Whitelist: hanya 10 trayek teratas (berdasarkan jumlah kendaraan dari data OD) yang ditampilkan
const TOP_10_TRAYEK = [
  'BANDUNG - SUKABUMI',
  'BANDUNG-BEKASI',
  'TERMINAL KAMPUNG RAMBUTAN (JAKARTA TIMUR) - TERMINAL GUNTUR MELATI (GARUT)',
  'TERMINAL KAMPUNG RAMBUTAN (JAKARTA TIMUR) - TERMINAL INDIHIANG (TASIKMALAYA)',
  'BANDUNG - CIKARANG',
  'TERMINAL GUNTUR MELATI (GARUT) - TERMINAL BARANANGSIANG (BOGOR)',
  'TERMINAL GUNTUR MELATI (GARUT) - TERMINAL INDUK BEKASI (BEKASI)',
  'KOTA BEKASI - TASIKMALAYA',
  'TERMINAL KAMPUNG RAMBUTAN (JAKARTA TIMUR) - TERMINAL CIAKAR (SUMEDANG)',
  'BOGOR - BANDUNG'
];

const warnaTipe = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', KA: '#8b5cf6', BANDARA: '#ef4444' };
const labelTipe = { A: 'Terminal Tipe A', B: 'Terminal Tipe B', C: 'Terminal Tipe C', KA: 'Stasiun KA', BANDARA: 'Bandara' };
const ICON_BUS_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#fff"><path d="M4 16.5c0 .8.32 1.53.84 2.06V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.44c.52-.53.84-1.26.84-2.06V6.5C19.68 3 16.02 2.5 12 2.5S4.32 3 4.32 6.5H4v10zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM6 12V7h12v5H6z"/></svg>';
const ICON_TRAIN_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#fff"><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="6" y="5" width="12" height="4" rx="1"/><circle cx="7.5" cy="18" r="2"/><circle cx="16.5" cy="18" r="2"/><rect x="17" y="6" width="1.5" height="3" rx="0.5"/></svg>';
const ICON_PLANE_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#fff"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
const ICON_MAP = { A: ICON_BUS_SVG, B: ICON_BUS_SVG, C: ICON_BUS_SVG, KA: ICON_TRAIN_SVG, BANDARA: ICON_PLANE_SVG };

// Peringkat juara → ikon MAHKOTA (tanpa angka). Warna mengikuti peringkat.
const RANK_CROWN = {
  1: { color: '#fbbf24', label: 'Juara 1', metal: 'Gold' },
  2: { color: '#cbd5e1', label: 'Juara 2', metal: 'Silver' },
  3: { color: '#cd7f32', label: 'Juara 3', metal: 'Bronze' }
};
function buatMahkotaSVG(color) {
  return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M12 3.4l2.5 4.3 4.9-2.1-1.8 5.8H6.4L4.6 5.6l4.9 2.1L12 3.4z" fill="' + color + '" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>' +
    '<rect x="4" y="16.6" width="16" height="4.2" rx="1.3" fill="' + color + '" stroke="#fff" stroke-width="1"/>' +
    '</svg>';
}
function buatIconTerminal(color, iconSvg, size, rank) {
  size = size || 34;
  const iconS = Math.round(size * 0.52);
  const crown = rank && RANK_CROWN[rank]
    ? '<span class="terminal-marker-crown" title="' + RANK_CROWN[rank].label + ' ' + RANK_CROWN[rank].metal + '" style="--crown:' + RANK_CROWN[rank].color + '">' + buatMahkotaSVG(RANK_CROWN[rank].color) + '</span>'
    : '';
  return L.divIcon({
    html: '<div class="terminal-marker-pin" style="width:' + size + 'px;height:' + size + 'px;background:' + color + '"><div class="terminal-marker-icon" style="width:' + iconS + 'px;height:' + iconS + 'px;">' + (iconSvg || ICON_BUS_SVG) + '</div>' + '<span class="terminal-marker-blink"></span></div>' + crown,
    className: 'terminal-marker-wrap',
    iconSize: [size, size],
    iconAnchor: [size / 2, size * 0.94],
    tooltipAnchor: [0, -size * 0.82]
  });
}
function volumeTerminal(p) {
  if (!p || !p.stats) return 0;
  return (Number(p.stats.kedatangan_penumpang) || 0) + (Number(p.stats.keberangkatan_penumpang) || 0);
}
function buatIconLokasiSaya() {
  return L.divIcon({
    html: '<div class="gmaps-location-dot"><div class="gmaps-pulse-ring"></div><div class="gmaps-dot"></div></div>',
    className: 'gmaps-location-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function initMap() {
  map = L.map('map', { zoomControl: false, attributionControl: false, preferCanvas: true }).setView([-6.9, 107.6], 8);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  basemapLayer = L.tileLayer(getBasemapUrl(), { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
  markersCluster = L.markerClusterGroup({ maxClusterRadius: 40, spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true });
  map.addLayer(markersCluster);
  routesLayer = L.layerGroup().addTo(map);
  Object.keys(warnaTipe).forEach(t => markersByTipe[t] = []);
  // Tombol lokasi
  const lb = L.control({ position: 'bottomright' });
  lb.onAdd = function () {
    const d = L.DomUtil.create('div', 'leaflet-bar leaflet-control locate-btn-container');
    d.innerHTML = '<a href="#" title="Lokasi Saya" class="locate-btn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg></a>';
    d.onclick = function (e) { e.preventDefault(); map.locate({ setView: true, maxZoom: 16 }); };
    L.DomEvent.disableClickPropagation(d);
    return d;
  };
  lb.addTo(map);
  let um, uar;
  map.on('locationfound', function (e) {
    if (um) map.removeLayer(um);
    if (uar) map.removeLayer(uar);
    if (e.accuracy > 0) uar = L.circle(e.latlng, { radius: e.accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, opacity: 0.3 }).addTo(map);
    um = L.marker(e.latlng, { icon: buatIconLokasiSaya(), zIndexOffset: 10000 }).addTo(map);
    um.bindTooltip("Anda di sini", { direction: 'top', offset: [0, -14] });
  });
  map.on('locationerror', function () { alert("Gagal mendapat lokasi. Pastikan GPS aktif."); });
  map.on('click', function (e) {
    if (routeBuilder.active) { addViaPoint(e); return; }
    if (selectedKode !== null) pilihSemuaTerminal();
    else expandSheet(false);
  });
  setTimeout(buatLegenda, 500);
}

function buatLegenda() {
  if (legendControl) map.removeControl(legendControl);

  function terapkanGrupSimpul() {
    const vis = legendState.simpul.visible;
    Object.keys(warnaTipe).forEach(t => {
      const cb = document.getElementById('leg-' + t);
      if (!cb) return;
      if (vis && cb.checked) markersCluster.addLayers(markersByTipe[t]);
      else markersCluster.removeLayers(markersByTipe[t]);
    });
    const types = Object.keys(warnaTipe);
    const cbs = types.map(t => document.getElementById('leg-' + t)).filter(Boolean);
    const g = document.getElementById('leg-group-simpul');
    if (g) {
      g.checked = vis;
      g.indeterminate = vis && cbs.some(cb => cb.checked) && cbs.some(cb => !cb.checked);
    }
  }

  function terapkanGrupTrayek() {
    const vis = legendState.trayek.visible;
    const rc = document.querySelectorAll('#legGrp-trayek input[data-route-id]');
    Array.from(rc).forEach(cb => {
      const p = routePolylines[cb.getAttribute('data-route-id')];
      if (!p) return;
      if (vis && cb.checked) routesLayer.addLayer(p);
      else routesLayer.removeLayer(p);
    });
    const g = document.getElementById('leg-group-trayek');
    if (g && rc.length) {
      const arr = Array.from(rc);
      g.checked = vis;
      g.indeterminate = vis && arr.some(c => c.checked) && arr.some(c => !c.checked);
    }
  }

  function buatGrup(key, nama) {
    const gp = document.createElement('div');
    gp.className = 'legend-group';
    gp.id = 'legGrp-' + key;
    const hdr = document.createElement('div');
    hdr.className = 'legend-group-header';
    const cbId = 'leg-group-' + key;
    hdr.innerHTML = '<span class="legend-caret"></span>' +
      '<span class="legend-group-name">' + nama + '</span>' +
      '<label class="legend-group-title" title="Tampilkan/sembunyikan seluruh ' + nama + '"><input type="checkbox" id="' + cbId + '" checked></label>';
    const body = document.createElement('div');
    body.className = 'legend-group-body';
    gp.appendChild(hdr);
    gp.appendChild(body);
    L.DomEvent.on(hdr, 'click', function (e) {
      if (e.target && e.target.tagName === 'INPUT') return;
      gp.classList.toggle('collapsed');
    });
    return { gp, hdr, body };
  }

  function renderSidebarLegenda() {
    const d = document.getElementById('legendSidebarBody');
    if (!d) return;
    d.innerHTML = '';
    // Kontrol choropleth
    const ctl = document.createElement('div');
    ctl.className = 'chp-controls';
    ctl.innerHTML = '<h3 class="card-title" style="font-size:14px;margin-bottom:8px">🗺️ Peta Bangkitan/Tarikan</h3>' +
      '<div class="chp-seg"><button id="chpBang" class="active">Bangkitan</button><button id="chpTar">Tarikan</button></div>' +
      '<div class="chp-scale"><span>0</span><span class="bar"></span><span>max</span></div>' +
      '<label class="chp-show"><input type="checkbox" id="chpShow" checked> Tampilkan lapisan</label>';
    d.appendChild(ctl);
    const ttl = document.createElement('div');
    ttl.className = 'legend-title';
    ttl.textContent = 'Tampilkan';
    d.appendChild(ttl);

      // Grup Simpul Transportasi
      const gSimpul = buatGrup('simpul', 'Simpul Transportasi');
      Object.keys(warnaTipe).forEach(t => {
        const r = document.createElement('label');
        r.className = 'legend-item';
        r.innerHTML = '<input type="checkbox" id="leg-' + t + '"' + (t === 'A' ? ' checked' : '') + ' data-tipe="' + t + '"><span class="legend-dot" style="background:' + warnaTipe[t] + '"></span><span>' + labelTipe[t] + '</span>';
        gSimpul.body.appendChild(r);
      });
      gSimpul.body.querySelectorAll('input[data-tipe]').forEach(cb => {
        L.DomEvent.on(cb, 'change', terapkanGrupSimpul);
      });
      L.DomEvent.on(gSimpul.hdr.querySelector('#leg-group-simpul'), 'change', function () {
        legendState.simpul.visible = this.checked;
        terapkanGrupSimpul();
      });
      d.appendChild(gSimpul.gp);
      terapkanGrupSimpul();

      // Grup UPPKB (Angkutan Barang)
      const gUppkb = buatGrup('uppkb', 'UPPKB (Angkutan Barang)');
      const itU = document.createElement('label');
      itU.className = 'legend-item';
      itU.innerHTML = '<input type="checkbox" id="leg-uppkb" checked><span class="legend-dot" style="background:#f59e0b"></span><span>UPPKB</span>';
      gUppkb.body.appendChild(itU);
      L.DomEvent.on(itU.querySelector('#leg-uppkb'), 'change', terapkanGrupUppkb);
      L.DomEvent.on(gUppkb.hdr.querySelector('#leg-group-uppkb'), 'change', function () {
        legendState.uppkb.visible = this.checked;
        terapkanGrupUppkb();
      });
      d.appendChild(gUppkb.gp);
      terapkanGrupUppkb();

      // Pemisah
      const sep = document.createElement('div');
      sep.className = 'legend-sep';
      d.appendChild(sep);

      // Grup Trayek
      const gTray = buatGrup('trayek', 'Trayek');
      const gTrayMaster = gTray.hdr.querySelector('#leg-group-trayek');
      if (gTrayMaster) gTrayMaster.checked = false;
      if (savedRoutesData && savedRoutesData.length > 0) {
        savedRoutesData.forEach(r => {
          const ro = document.createElement('label');
          ro.className = 'legend-item';
          ro.innerHTML = '<input type="checkbox" id="leg-route-' + r.id + '" data-route-id="' + r.id + '"><span class="legend-dot" style="background:' + (r.color || '#3b82f6') + '"></span><span>' + (r.name || 'Trayek') + '</span>';
          gTray.body.appendChild(ro);
        });
        gTray.body.querySelectorAll('input[data-route-id]').forEach(cb => {
          L.DomEvent.on(cb, 'change', terapkanGrupTrayek);
        });
        L.DomEvent.on(gTray.hdr.querySelector('#leg-group-trayek'), 'change', function () {
          legendState.trayek.visible = this.checked;
          terapkanGrupTrayek();
        });
      } else {
        const e = document.createElement('div');
        e.style.cssText = 'font-size:12px;color:#64748b;padding:4px 0;';
        e.textContent = 'Belum ada trayek';
        gTray.body.appendChild(e);
      }
      d.appendChild(gTray.gp);
      terapkanGrupTrayek();

      const rankNote = document.createElement('div');
      rankNote.className = 'legend-note';
      rankNote.textContent = '👑 di pin = 3 peringkat penumpang teratas (Emas · Perak · Perunggu)';
      d.appendChild(rankNote);

      const bBang = d.querySelector('#chpBang');
      const bTar = d.querySelector('#chpTar');
      if (bBang) bBang.addEventListener('click', function () { bBang.classList.add('active'); bTar.classList.remove('active'); setChoroplethMetric('bangkitan'); });
      if (bTar) bTar.addEventListener('click', function () { bTar.classList.add('active'); bBang.classList.remove('active'); setChoroplethMetric('tarikan'); });
      const chpShow = d.querySelector('#chpShow');
      if (chpShow) chpShow.addEventListener('change', function () {
        legendState.choropleth = this.checked;
        if (!choroplethLayer) return;
        if (this.checked) choroplethLayer.addTo(map); else map.removeLayer(choroplethLayer);
      });
    }
    renderSidebarLegenda();
    function bukaLegenda() { var o = document.getElementById('legendOverlay'); if (o) o.classList.remove('hidden'); }
    function tutupLegenda() { var o = document.getElementById('legendOverlay'); if (o) o.classList.add('hidden'); }
    var btnL = document.getElementById('btnLegenda'); if (btnL) btnL.addEventListener('click', bukaLegenda);
    var btnT = document.getElementById('btnTutupLegenda'); if (btnT) btnT.addEventListener('click', tutupLegenda);
  }

// ===== ROUTES =====
function loadRoutes(callback) {
  Backend.getRoutes().then(function (routes) {
      if (!routes || !routes.length) {
        if (callback) callback();
        return;
      }
      // Filter: hanya tampilkan 10 trayek teratas
      const filtered = routes.filter(function (r) {
        return TOP_10_TRAYEK.some(function (name) {
          return (r.name || '').toUpperCase() === name.toUpperCase();
        });
      });
      savedRoutesData = filtered;
      routesLayer.clearLayers();
      routePolylines = {};
      filtered.forEach(function (r) {
        if (r.polyline && r.polyline.length) drawRouteFromData(r);
      });
      renderRouteLib();
      if (callback) callback();
    })
    .catch(function (err) {
      console.error('loadRoutes error:', err);
      if (callback) callback();
    });
}

// Ketebalan garis proporsional volume penumpang (10 trayek teratas). Rentang 2–10.
function ketebalanTrayek(rd) {
  let maxVol = 0;
  (savedRoutesData || []).forEach(r => { const v = Number(r.volume) || 0; if (v > maxVol) maxVol = v; });
  const vol = Number(rd.volume) || 0;
  if (!maxVol || !vol) return 4; // trayek manual / tanpa volume → tebal standar
  return Math.round((2 + 8 * (vol / maxVol)) * 10) / 10;
}

function drawRouteFromData(rd) {
  const p = L.polyline(rd.polyline.map(pt => [pt[0], pt[1]]), {
    color: rd.color || '#3b82f6',
    weight: ketebalanTrayek(rd),
    opacity: 0.9
  }).addTo(routesLayer);
  const info = (rd.volume || rd.perjalanan || rd.jarak_km)
    ? '<div class="rute-info">👥 ' + formatSingkat(rd.volume) + ' penumpang · 🚌 ' + formatSingkat(rd.perjalanan) + ' perjalanan · 📏 ' + (Number(rd.jarak_km) || 0).toLocaleString('id-ID') + ' km</div>'
    : '';
  const pp = '<div style="font-family:Plus Jakarta Sans,sans-serif;min-width:170px;"><strong>' + (rd.name || 'Trayek') + '</strong>' + info + '<br><button class="btn-hapus-rute-popup" data-id="' + rd.id + '" style="margin-top:8px;background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;width:100%;">🗑 Hapus</button></div>';
  p.bindPopup(pp);
  p.on('popupopen', function () {
    setTimeout(function () {
      const b = document.querySelector('.btn-hapus-rute-popup[data-id="' + rd.id + '"]');
      if (b) {
        b.onclick = function (e) {
          e.preventDefault();
          if (confirm('Hapus "' + (rd.name || '') + '" ?')) {
            routesLayer.removeLayer(p);
            Backend.deleteRoute(rd.id).then(function () {
                savedRoutesData = savedRoutesData.filter(r => r.id !== rd.id);
                buatLegenda();
                map.closePopup();
            }).catch(function (err) {
                console.error('deleteRoute error:', err);
            });
          }
        };
      }
    }, 50);
  });
  routePolylines[rd.id] = p;
}

// Bangun HTML tooltip hover marker (foto + nama + peringkat + tipe/kabkota + alamat).
// Dipakai renderMarkers & perbaruiTooltipMarker agar satu sumber kebenaran.
function buildTooltipHtml(p, rank) {
  const crownLabel = rank && RANK_CROWN[rank] ? '<em class="mt-rank" style="color:' + RANK_CROWN[rank].color + '">👑 ' + RANK_CROWN[rank].label + ' ' + RANK_CROWN[rank].metal + '</em>' : '';
  // onerror: bila foto Drive gagal dimuat (mis. belum sharing), sembunyikan agar tidak tampak rusak.
  const fotoHover = p.foto_url ? '<img class="mt-foto" src="' + p.foto_url + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '';
  const alamatHover = p.alamat ? '<span class="mt-alamat">' + p.alamat + '</span>' : '';
  return '<div class="mini-tooltip' + (fotoHover ? ' has-foto' : '') + '">' + fotoHover + '<div class="mt-body"><strong>' + (p.nama_terminal || '') + '</strong>' + crownLabel + '<small>' + 'Tipe ' + (p.tipe || '-') + ' · ' + (p.kabupaten_kota || '') + '</small>' + alamatHover + '</div></div>';
}
// Perbarui tooltip satu marker (dipakai setelah foto profil berubah) tanpa reload halaman.
function perbaruiTooltipMarker(kode) {
  const m = markerRefs[kode];
  const p = allPoints.find(x => x.kode_terminal === kode);
  if (!m || !p) return;
  m.setTooltipContent(buildTooltipHtml(p, p._rank));
}

// ===== MARKER RENDER =====
function renderMarkers(points, uppkbPoints) {
  allPoints = points;
  markerRefs = {};
  markersCluster.clearLayers();
  uppkbMarkers = [];
  Object.keys(warnaTipe).forEach(t => markersByTipe[t] = []);
  const bounds = [];
  // Ukuran marker NORMAL (tidak proporsional penumpang)
  // Peringkat terminal (top 3): ikon MAHKOTA (tanpa angka); emas/perak/perunggu.
  const ranked = points
    .map(p => ({ k: p.kode_terminal, v: volumeTerminal(p) }))
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v);
  const rankMap = {};
  ranked.slice(0, 3).forEach((x, i) => { rankMap[x.k] = i + 1; });
  points.forEach(p => {
    if (!p.lat || !p.lng) return;
    const t = (p.tipe || 'A').toUpperCase();
    const c = warnaTipe[t] || '#94a3b8';
    const size = 34; // ukuran normal
    const rank = rankMap[p.kode_terminal];
    const m = L.marker([p.lat, p.lng], { icon: buatIconTerminal(c, ICON_MAP[t] || ICON_BUS_SVG, size, rank) });
    // Hover preview: foto + nama + alamat + kabupaten/kota (muncul saat hover, hilang saat keluar).
    p._rank = rank;
    m.bindTooltip(buildTooltipHtml(p, rank), { direction: 'top', offset: [0, -Math.round(size * 0.5)], className: 'custom-mini-tooltip' });
    m.on('mouseover', function () {
      const el = this.getElement();
      if (el && selectedKode !== p.kode_terminal) el.classList.add('is-hover');
    });
    m.on('mouseout', function () {
      const el = this.getElement();
      if (el) el.classList.remove('is-hover');
    });
    m.on('click', function (e) {
      L.DomEvent.stopPropagation(e);
      if (routeBuilder.active) { alert('Nonaktifkan mode via point dulu.'); return; }
      pilihTerminal(p.kode_terminal);
    });
    if (markersByTipe[t]) markersByTipe[t].push(m);
    markerRefs[p.kode_terminal] = m;
    bounds.push([p.lat, p.lng]);
  });
  // Tambahkan ke cluster sesuai checkbox + status visibilitas grup
  Object.keys(warnaTipe).forEach(ti => {
    const cb = document.getElementById('leg-' + ti);
    if (legendState.simpul.visible && (!cb || cb.checked)) markersCluster.addLayers(markersByTipe[ti]);
  });
  renderUppkbMarkers(uppkbPoints, bounds);
  initRouteBuilderSelects(points);
  if (bounds.length && !selectedKode) {
    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 });
  }
}

// Marker UPPKB (Angkutan Barang) di peta utama — memakai koordinat yang sudah ada.
function buatIconUppkb() {
  return L.divIcon({
    html: '<div class="uppkb-marker">🚛</div>',
    className: 'uppkb-marker-wrap',
    iconSize: [30, 30],
    iconAnchor: [15, 27],
    tooltipAnchor: [0, -24]
  });
}
function renderUppkbMarkers(list, bounds) {
  uppkbMarkers = [];
  (list || []).forEach(function (u) {
    if (!u.lat || !u.lng) return;
    const m = L.marker([u.lat, u.lng], { icon: buatIconUppkb() });
    const s = u.stats || {};
    m.bindTooltip('<div class="mini-tooltip"><strong>🚛 ' + (u.nama || '') + '</strong><small>' + (u.kabupaten || '') + ' · Diperiksa ' + formatAngka(s.diperiksa) + '</small></div>', { direction: 'top', offset: [0, -26], className: 'custom-mini-tooltip' });
    m.on('click', function (e) {
      L.DomEvent.stopPropagation(e);
      bukaSheetUppkb(u);
    });
    uppkbMarkers.push(m);
    if (bounds) bounds.push([u.lat, u.lng]);
  });
  terapkanGrupUppkb();
}
// Toggle visibilitas marker UPPKB (masuk/keluar dari cluster, seperti marker Terminal).
function terapkanGrupUppkb() {
  const vis = legendState.uppkb.visible;
  const cb = document.getElementById('leg-uppkb');
  const on = vis && (!cb || cb.checked);
  if (on) markersCluster.addLayers(uppkbMarkers);
  else markersCluster.removeLayers(uppkbMarkers);
  const g = document.getElementById('leg-group-uppkb');
  if (g) { g.checked = vis; g.indeterminate = vis && cb && !cb.checked; }
}

// ===== CHART & UI =====
function formatAngka(n) { return Number(n || 0).toLocaleString('id-ID'); }
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.color = '#64748b';

function renderKPI(s) {
  animateValue('kpiKedatanganKendaraan', 0, s.kedatangan_kendaraan, 800);
  animateValue('kpiKedatanganPenumpang', 0, s.kedatangan_penumpang, 800);
  animateValue('kpiKeberangkatanKendaraan', 0, s.keberangkatan_kendaraan, 800);
  animateValue('kpiKeberangkatanPenumpang', 0, s.keberangkatan_penumpang, 800);
  // Rekap total YTD — kosongkan slot "% vs bulan lalu"
  ['deltaKedatanganKendaraan', 'deltaKedatanganPenumpang', 'deltaKeberangkatanKendaraan', 'deltaKeberangkatanPenumpang'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
}
function setKpiDelta(id, pct, bulanDari) {
  const el = document.getElementById(id);
  if (!el) return;
  if (pct === null || pct === undefined || isNaN(pct)) { el.innerHTML = ''; return; }
  const up = pct >= 0;
  const arrow = up ? '▲' : '▼';
  el.innerHTML = '<span class="kpi-delta-val ' + (up ? 'up' : 'down') + '">' + arrow + ' ' + Math.abs(pct).toFixed(1) + '%</span><span class="kpi-delta-bulan"> vs ' + (bulanDari || 'bln lalu') + '</span>';
}
function formatSingkat(n) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  if (n >= 1000000) return (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (n >= 1000) return (n / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' rb';
  return formatAngka(n);
}
function renderInsights(insights, ranking, isTunggal) {
  const row = document.getElementById('insightRow');
  if (!row) return;
  row.innerHTML = '';
  if (!insights) return;
  const cards = [];
  if (isTunggal && ranking && ranking.posisi && ranking.total > 1) {
    cards.push({ icon: '🏆', value: '#' + ranking.posisi + '/' + ranking.total, label: 'Peringkat penumpang se-Jabar' });
  } else if (!isTunggal && ranking && ranking.pemuncak) {
    cards.push({ icon: '🏆', value: ranking.pemuncak, label: 'Terminal tersibuk · ' + formatSingkat(ranking.nilaiPemuncak) + ' pnp' });
  }
  if (insights.loadFactor > 0) {
    cards.push({ icon: '🚌', value: insights.loadFactor.toLocaleString('id-ID', { maximumFractionDigits: 1 }), label: 'Penumpang per kendaraan' });
  }
  if (insights.puncakBulan && insights.puncakBulan.penumpang > 0) {
    cards.push({ icon: '📅', value: insights.puncakBulan.nama, label: 'Puncak arus · ' + formatSingkat(insights.puncakBulan.penumpang) + ' pnp' });
  }
  if (!cards.length) return;
  cards.forEach(c => {
    const d = document.createElement('div');
    d.className = 'insight-card' + (c.tone ? ' tone-' + c.tone : '');
    d.innerHTML = '<div class="insight-icon">' + c.icon + '</div><div class="insight-body"><div class="insight-value">' + c.value + '</div><div class="insight-label">' + c.label + '</div></div>';
    row.appendChild(d);
  });
}
function animateValue(id, s, e, d) {
  const el = document.getElementById(id);
  if (!el) return;
  if (s === e) { el.textContent = formatAngka(e); return; }
  let c = s,
    inc = e > s ? Math.ceil((e - s) / (d / 16)) : -1,
    st = Math.abs(Math.floor(d / (e - s)));
  if (st < 16) st = 16;
  let t = setInterval(function () {
    c += inc;
    if ((inc > 0 && c >= e) || (inc < 0 && c <= e)) { c = e;
      clearInterval(t); }
    el.textContent = formatAngka(c);
  }, st);
}
// ===== GRAFIK GARIS (line chart) — 2 seri per grafik =====
function buatLineDua(chatCtx, labels, seriA, seriB) {
  function grad(color) {
    const g = chatCtx.getContext('2d').createLinearGradient(0, 0, 0, 250);
    g.addColorStop(0, color + '33');
    g.addColorStop(1, color + '00');
    return g;
  }
  function ds(s) {
    return {
      label: s.label,
      data: s.data,
      borderColor: s.color,
      backgroundColor: grad(s.color),
      borderWidth: 2.6,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: s.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      spanGaps: true
    };
  }
  return new Chart(chatCtx, {
    type: 'line',
    data: { labels: labels, datasets: [ds(seriA), ds(seriB)] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + formatAngka(c.raw); } } }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { callback: function (v) { return formatSingkat(v); } } },
        x: { grid: { display: false } }
      }
    }
  });
}
// A. Tren Kedatangan vs Keberangkatan Penumpang (12 bulan)
function renderTrendPenumpang(trend) {
  const ctx = document.getElementById('chartTrendPenumpang');
  if (!ctx) return;
  if (chartTrendPnp) chartTrendPnp.destroy();
  chartTrendPnp = buatLineDua(ctx, (trend || []).map(t => t.bulan),
    { label: 'Kedatangan Penumpang', data: (trend || []).map(t => t.kedatangan_penumpang), color: '#06b6d4' },
    { label: 'Keberangkatan Penumpang', data: (trend || []).map(t => t.keberangkatan_penumpang), color: '#10b981' });
}
// B. Tren Kedatangan vs Keberangkatan Kendaraan (12 bulan)
function renderTrendKendaraan(trend) {
  const ctx = document.getElementById('chartTrendKendaraan');
  if (!ctx) return;
  if (chartTrendKnd) chartTrendKnd.destroy();
  chartTrendKnd = buatLineDua(ctx, (trend || []).map(t => t.bulan),
    { label: 'Kedatangan Kendaraan', data: (trend || []).map(t => t.kedatangan_kendaraan), color: '#3b82f6' },
    { label: 'Keberangkatan Kendaraan', data: (trend || []).map(t => t.keberangkatan_kendaraan), color: '#f59e0b' });
}

// ===== GRAFIK BATANG (bar chart per terminal) =====
// Plugin kecil untuk label nilai di atas batang (tanpa dependensi eksternal).
const barLabelPlugin = {
  id: 'barValueLabels',
  afterDatasetsDraw: function (chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach(function (ds, di) {
      const meta = chart.getDatasetMeta(di);
      if (!meta || !meta.data) return;
      meta.data.forEach(function (bar, i) {
        const v = Number(ds.data[i]) || 0;
        if (!v) return;
        ctx.save();
        ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = 'rgba(71, 85, 105, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(formatSingkat(v), bar.x, bar.y - 5);
        ctx.restore();
      });
    });
  }
};
// Data per Terminal Tipe-A (agregasi otomatis dari stats per terminal),
// diurutkan menurun & dibatasi 12 teratas — tanpa hardcode nama.
function topTerminalData(points, limit) {
  return (points || [])
    .filter(function (p) { return (p.tipe || '').toUpperCase() === 'A'; })
    .map(function (p) {
      const s = p.stats || {};
      return {
        nama: p.nama_terminal || p.kode_terminal || '-',
        kp: Number(s.kedatangan_penumpang) || 0,
        bp: Number(s.keberangkatan_penumpang) || 0,
        kk: Number(s.kedatangan_kendaraan) || 0,
        bk: Number(s.keberangkatan_kendaraan) || 0,
        total: (Number(s.kedatangan_penumpang) || 0) + (Number(s.keberangkatan_penumpang) || 0) + (Number(s.kedatangan_kendaraan) || 0) + (Number(s.keberangkatan_kendaraan) || 0)
      };
    })
    .filter(function (d) { return d.total > 0; })
    .sort(function (a, b) { return b.total - a.total; })
    .slice(0, limit || 12);
}
function renderBarPenumpang(points) {
  const ctx = document.getElementById('chartBarPenumpang');
  if (!ctx) return;
  if (chartBarPnp) chartBarPnp.destroy();
  const arr = topTerminalData(points, 12);
  if (!arr.length) { chartBarPnp = null; return; }
  chartBarPnp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: arr.map(d => d.nama),
      datasets: [
        { label: 'Kedatangan Penumpang', data: arr.map(d => d.kp), backgroundColor: '#06b6d4' },
        { label: 'Keberangkatan Penumpang', data: arr.map(d => d.bp), backgroundColor: '#10b981' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + formatAngka(c.raw); } } }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { callback: function (v) { return formatSingkat(v); } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 0 } }
      }
    },
    plugins: [barLabelPlugin]
  });
}
function renderBarKendaraan(points) {
  const ctx = document.getElementById('chartBarKendaraan');
  if (!ctx) return;
  if (chartBarKnd) chartBarKnd.destroy();
  const arr = topTerminalData(points, 12);
  if (!arr.length) { chartBarKnd = null; return; }
  chartBarKnd = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: arr.map(d => d.nama),
      datasets: [
        { label: 'Kedatangan Kendaraan', data: arr.map(d => d.kk), backgroundColor: '#3b82f6' },
        { label: 'Keberangkatan Kendaraan', data: arr.map(d => d.bk), backgroundColor: '#f59e0b' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + formatAngka(c.raw); } } }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { callback: function (v) { return formatSingkat(v); } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 0 } }
      }
    },
    plugins: [barLabelPlugin]
  });
}

const proporsiCharts = {};
function buatDoughnut(chartCtx, labels, values, colors) {
  const t = values.reduce(function (a, b) { return a + (Number(b) || 0); }, 0);
  return new Chart(chartCtx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values.map(Number), backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: function (c) {
              const v = Number(c.raw) || 0;
              return ' ' + c.label + ': ' + formatAngka(v) + (t > 0 ? ' (' + ((v / t) * 100).toFixed(1) + '%)' : '');
            }
          }
        }
      }
    }
  });
}
function renderDoughnutProporsi(id, labels, values, colors) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (proporsiCharts[id]) proporsiCharts[id].destroy();
  proporsiCharts[id] = buatDoughnut(ctx, labels, values, colors);
}
// A. Proporsi Arus Kendaraan — memakai kategori yang tersedia di model data saat ini.
//    Pecahan per jenis (AKAP/AKDP/Pariwisata/Angkot/Kendaraan Pribadi) memerlukan kolom
//    "jenis kendaraan" di sheet Produksi; lihat catatan implementasi.
function renderProporsiKendaraan(s) {
  renderDoughnutProporsi('chartProporsiKendaraan',
    ['Datang Kendaraan', 'Berangkat Kendaraan'],
    [s.kedatangan_kendaraan, s.keberangkatan_kendaraan],
    ['#3b82f6', '#f59e0b']);
}
// B. Proporsi Arus Penumpang
function renderProporsiPenumpang(s) {
  renderDoughnutProporsi('chartProporsiPenumpang',
    ['Penumpang Datang', 'Penumpang Berangkat'],
    [s.kedatangan_penumpang, s.keberangkatan_penumpang],
    ['#06b6d4', '#10b981']);
}
function renderTabel(rows) {
  const tb = document.querySelector('#tabelRincian tbody');
  if (!tb) return;
  tb.innerHTML = '';
  if (!rows || !rows.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Tidak ada data</td></tr>'; return; }
  const f = document.createDocumentFragment();
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + r.tanggal + '</td><td><b>' + r.nama_terminal + '</b></td><td class="num">' + formatAngka(r.kedatangan_kendaraan) + '</td><td class="num">' + formatAngka(r.kedatangan_penumpang) + '</td><td class="num">' + formatAngka(r.keberangkatan_kendaraan) + '</td><td class="num">' + formatAngka(r.keberangkatan_penumpang) + '</td>';
    f.appendChild(tr);
  });
  tb.appendChild(f);
}
function renderRekapBulan(trend) {
  const wrap = document.getElementById('rekapBulanWrap');
  if (!wrap || !trend) return;
  const nb = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  let html = '<h2 class="card-title">📅 Rekap Total per Bulan</h2><div class="table-wrap"><table><thead><tr><th>Bulan</th><th class="num">Datang (K)</th><th class="num">Datang (P)</th><th class="num">Brgkt (K)</th><th class="num">Brgkt (P)</th><th class="num">Total Kendaraan</th><th class="num">Total Penumpang</th></tr></thead><tbody>';
  let tot = { kk: 0, kp: 0, bk: 0, bp: 0 };
  trend.forEach((t, i) => {
    const kk = t.kedatangan_kendaraan || 0, kp = t.kedatangan_penumpang || 0, bk = t.keberangkatan_kendaraan || 0, bp = t.keberangkatan_penumpang || 0;
    tot.kk += kk; tot.kp += kp; tot.bk += bk; tot.bp += bp;
    const tk = kk + bk; // Total Kendaraan = Datang(K) + Brgkt(K)
    const tp = kp + bp; // Total Penumpang = Datang(P) + Brgkt(P)
    html += '<tr><td>' + (t.bulan || nb[i]) + '</td><td class="num">' + formatAngka(kk) + '</td><td class="num">' + formatAngka(kp) + '</td><td class="num">' + formatAngka(bk) + '</td><td class="num">' + formatAngka(bp) + '</td><td class="num">' + formatAngka(tk) + '</td><td class="num">' + formatAngka(tp) + '</td></tr>';
  });
  html += '<tr class="rekap-total"><td><b>TOTAL</b></td><td class="num"><b>' + formatAngka(tot.kk) + '</b></td><td class="num"><b>' + formatAngka(tot.kp) + '</b></td><td class="num"><b>' + formatAngka(tot.bk) + '</b></td><td class="num"><b>' + formatAngka(tot.bp) + '</b></td><td class="num"><b>' + formatAngka(tot.kk + tot.bk) + '</b></td><td class="num"><b>' + formatAngka(tot.kp + tot.bp) + '</b></td></tr>';
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
  wrap.style.marginBottom = '16px';
  wrap.style.paddingBottom = '20px';
}
function renderInfoTerminal(p) {
  const b = document.getElementById('infoTerminal');
  if (!b) return;
  if (!p) { b.classList.add('hidden'); return; }
  b.classList.remove('hidden');
  document.getElementById('infoAlamat').textContent = p.alamat || '-';
  document.getElementById('infoKabkota').textContent = p.kabupaten_kota || '-';
  document.getElementById('infoTipe').textContent = 'Tipe ' + (p.tipe || '-');
  document.getElementById('infoStatus').textContent = p.status || '-';
}

// ===== DATA FETCH =====
function showLoading() { document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }

function filterAktif(extra) {
  const f = {};
  const b = document.getElementById('filterBulan').value,
    y = document.getElementById('filterTahun').value;
  if (b) f.bulan = parseInt(b, 10);
  if (y) f.tahun = parseInt(y, 10);
  if (extra) Object.assign(f, extra);
  return f;
}

function muatData(filter, isTunggal, namaTerminal, dataTerminal, autoExpand, callback) {
  if (autoExpand === undefined) autoExpand = true;
  showLoading();
  Backend.getDashboardData(filter).then(function (data) {
      try {
        if (!isTunggal) renderMarkers(data.points, data.uppkbPoints);
        renderKPI(data.summary);
        renderInsights(data.insights, data.ranking, !!isTunggal);
        renderTrendPenumpang(data.trend);
        renderTrendKendaraan(data.trend);
        renderBarPenumpang(data.points);
        renderBarKendaraan(data.points);
        renderRekapBulan(data.trend);
        renderProporsiKendaraan(data.summary);
        renderProporsiPenumpang(data.summary);
        renderTabel(data.tabel);
        if (isTunggal) {
          document.getElementById('sheetEyebrow').textContent = 'DETAIL TERMINAL';
          document.getElementById('sheetTitle').textContent = namaTerminal;
          document.getElementById('sheetSubtitle').innerHTML = (dataTerminal.kabupaten_kota || '') + ' &middot; Terminal Penumpang';
          document.getElementById('btnKembali').classList.remove('hidden');
          renderInfoTerminal(dataTerminal);
          const be = document.getElementById('btnEditProfile');
          if (be) be.style.display = 'flex';
        } else {
          document.getElementById('sheetEyebrow').textContent = 'RINGKASAN TOTAL';
          document.getElementById('sheetTitle').textContent = 'Semua Terminal';
          document.getElementById('sheetSubtitle').textContent = 'Ketuk titik marker di peta untuk analitik spesifik';
          document.getElementById('btnKembali').classList.add('hidden');
          renderInfoTerminal(null);
          const be = document.getElementById('btnEditProfile');
          if (be) be.style.display = 'none';
        }
      } catch (e) {
        console.error('muatData error:', e);
        alert('Error: ' + e.message);
      } finally {
        hideLoading();
        if (autoExpand) expandSheet(true);
        if (callback) callback();
      }
    })
    .catch(function (err) {
      hideLoading();
      alert('Gagal memuat data. Error: ' + (err && err.message ? err.message : err));
      console.error('getDashboardData error:', err);
    });
}

function pilihTerminal(kode) {
  if (!kode) return;
  tutupSheetUppkb();
  const m = markerRefs[kode];
  if (!m) return;
  selectedKode = kode;
  tandaiMarkerTerpilih(kode);
  const ll = m.getLatLng();
  map.panTo([ll.lat - 0.1, ll.lng], { animate: true, duration: 0.5 });
  const p = allPoints.find(x => x.kode_terminal === kode);
  if (!p) return;
  const tipe = (p.tipe || '').toUpperCase();
  if (tipe === 'A') {
    muatData(filterAktif({ kode_terminal: kode }), true, p.nama_terminal, p);
  } else {
    expandSheet(false);
    tampilkanProfile(p);
  }
}

function pilihSemuaTerminal() {
  tutupSheetUppkb();
  if (selectedKode === null) { expandSheet(true); return; }
  selectedKode = null;
  tandaiMarkerTerpilih(null);
  muatData(filterAktif(), false);
  const b = [];
  allPoints.forEach(p => { if (p.lat && p.lng) b.push([p.lat, p.lng]); });
  if (b.length) map.fitBounds(b, { padding: [50, 50], animate: true });
  const be = document.getElementById('btnEditProfile');
  if (be) be.style.display = 'none';
}

function tandaiMarkerTerpilih(kode) {
  Object.keys(markerRefs).forEach(k => {
    const m = markerRefs[k],
      s = k === kode,
      el = m.getElement();
    if (el) el.classList.toggle('is-selected', s);
    m.setZIndexOffset(s ? 1000 : 0);
  });
}

function updateChipFilter() {
  const b = document.getElementById('filterBulan'),
    y = document.getElementById('filterTahun').value,
    c = document.getElementById('filterChip');
  if (b.value || y) {
    c.textContent = 'Filter: ' + (b.value ? b.options[b.selectedIndex].text : 'Semua Bln') + ' ' + (y || '');
    c.classList.remove('hidden');
  } else c.classList.add('hidden');
}

// ===== UPDATE DATA (tombol "Update Data" → sinkronisasi produksi) =====
const LAST_UPDATE_KEY = 'geoterminal_last_update';
function formatWIBParts(iso) {
  try {
    const d = new Date(iso);
    const tgl = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    const jam = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    return { date: tgl, time: jam + ' WIB' };
  } catch (e) {
    const d = new Date(iso);
    return { date: d.toLocaleDateString('id-ID'), time: d.toLocaleTimeString('id-ID') };
  }
}
function tampilkanLastUpdate() {
  // Elemen berada di dalam top bar (id #lastUpdateValue).
  const val = document.getElementById('lastUpdateValue');
  if (!val) return;
  let iso = null;
  try { iso = localStorage.getItem(LAST_UPDATE_KEY); } catch (e) {}
  if (!iso) { val.classList.add('hidden'); return; }
  const p = formatWIBParts(iso);
  const luDate = val.querySelector('.lu-date'); if (luDate) luDate.textContent = p.date;
  const luTime = val.querySelector('.lu-time'); if (luTime) luTime.textContent = p.time;
  val.classList.remove('hidden');
}
function tampilkanNotif(ok, msg) {
  const el = document.createElement('div');
  el.className = 'toast-notif ' + (ok ? 'ok' : 'err');
  el.textContent = (ok ? '✅ ' : '⚠️ ') + msg;
  document.body.appendChild(el);
  setTimeout(function () { el.classList.add('show'); }, 20);
  setTimeout(function () {
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  }, 3800);
}
function jalankanUpdateData() {
  const btn = document.getElementById('btnUpdateData');
  if (!btn) return;
  if (btn.disabled) return;
  const sel = document.getElementById('filterTahun');
  const tahun = sel && sel.value ? parseInt(sel.value, 10) : new Date().getFullYear();
  btn.disabled = true;
  btn.classList.add('loading');
  btn.setAttribute('aria-busy', 'true');
  showLoading();
  Backend.sinkronisasiProduksi(tahun).then(function (res) {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.setAttribute('aria-busy', 'false');
      if (res && res.ok) {
        try { localStorage.setItem(LAST_UPDATE_KEY, res.timestamp || new Date().toISOString()); } catch (e) {}
        tampilkanLastUpdate();
        rawDataLoaded = false;
        const pesanOk = 'Sinkronisasi data produksi ' + (res.tahun || tahun) + ' berhasil.';
        if (selectedKode !== null && markerRefs[selectedKode]) {
          // Overlay loading & hideLoading dikelola oleh pilihTerminal → muatData.
          pilihTerminal(selectedKode);
          tampilkanNotif(true, pesanOk);
        } else {
          selectedKode = null;
          // Muat ulang data dashboard; toast sukses muncul SETELAH reload selesai
          // (callbacks muatData). Menghindari pesan "berhasil" padahal reload gagal.
          muatData(filterAktif(), false, null, null, false, function () {
            tampilkanNotif(true, pesanOk);
          });
        }
      } else {
        hideLoading();
        tampilkanNotif(false, (res && res.pesan) ? 'Sinkronisasi gagal: ' + res.pesan : 'Sinkronisasi gagal.');
      }
    })
    .catch(function (err) {
      hideLoading();
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.setAttribute('aria-busy', 'false');
      tampilkanNotif(false, 'Error sinkronisasi: ' + (err && err.message ? err.message : err));
      console.error('sinkronisasiProduksi error:', err);
    });
}

// ===== NAVIGASI =====
function aktifkanView(viewId) {
  if (viewId !== 'route') {
    document.getElementById('routeBuilderOverlay').classList.add('hidden');
    resetRouteBuilder();
  }
  document.querySelectorAll('.menu-item').forEach(m => {
    const v = m.getAttribute('data-view');
    m.classList.toggle('active', v === (viewId === 'route' ? 'home' : viewId));
  });
  if (viewId === 'home' || viewId === 'gis') {
    document.getElementById('dataViewContainer').classList.add('hidden');
    expandSheet(true);
    if (viewId === 'gis') {
      document.getElementById('filterBulan').value = '';
      const sel = document.getElementById('filterTahun');
      if (sel.options.length > 0) sel.value = sel.options[0].value;
      updateChipFilter();
      pilihSemuaTerminal();
    }
  } else if (viewId === 'data') {
    document.getElementById('dataViewContainer').classList.remove('hidden');
    expandSheet(false);
    muatDataMentah();
  } else if (viewId === 'od') {
    document.getElementById('dataViewContainer').classList.remove('hidden');
    expandSheet(false);
    muatDataOD();
  } else if (viewId === 'route') {
    document.getElementById('routeBuilderOverlay').classList.remove('hidden');
    ciutkanRouteBuilder(false);
    if (document.getElementById('routeOriginSelect').options.length <= 1) initRouteBuilderSelects(allPoints);
    resetRouteBuilder();
    expandSheet(false);
    document.getElementById('dataViewContainer').classList.add('hidden');
    document.getElementById('map').style.cursor = '';
  }
}

let odDataLoaded = false;
function muatDataOD() {
  if (odDataLoaded) return;
  showLoading();
  fetch('data/od-analisis.json').then(function (res) { return res.json(); }).then(function (data) {
    hideLoading();
    odDataLoaded = true;
    const container = document.getElementById('dataViewContainer');

    // KPI Summary
    let html = '<h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:var(--navy);">📊 Data Asal-Tujuan (OD) Jawa Barat</h2>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">' +
        '<div class="kpi-card bg-blue-light"><div class="kpi-header"><div class="kpi-icon text-blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div><span class="kpi-label">Total Perjalanan</span></div><div class="kpi-value text-blue">' + data.total.perjalanan.toLocaleString('id-ID') + '</div></div>' +
        '<div class="kpi-card bg-green-light"><div class="kpi-header"><div class="kpi-icon text-green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div><span class="kpi-label">Total Volume</span></div><div class="kpi-value text-green">' + data.total.volume.toLocaleString('id-ID') + '</div></div>' +
        '<div class="kpi-card bg-yellow-light"><div class="kpi-header"><div class="kpi-icon text-yellow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div><span class="kpi-label">Terminal</span></div><div class="kpi-value text-yellow">' + data.total.terminal + '</div></div>' +
        '<div class="kpi-card bg-cyan-light"><div class="kpi-header"><div class="kpi-icon text-cyan"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><span class="kpi-label">Periode</span></div><div class="kpi-value text-cyan">' + data.total.bulan + ' Bulan (2026)</div></div>' +
      '</div>';

    // Tabel Trayek (semua trayek, bukan hanya top 15)
    html += '<div class="card" style="margin-bottom:24px;"><h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:var(--navy);">🚌 Data Per Trayek (' + data.perTrayek.length + ' Trayek)</h3>' +
      '<div class="table-wrap"><table id="tabelODTrayek"><thead><tr>' +
      '<th style="min-width:300px;">Nama Trayek</th>' +
      '<th class="num">Perjalanan</th>' +
      '<th class="num">Volume Total</th>' +
      '<th class="num">Avg/Trip</th>' +
      '</tr></thead><tbody>';

    data.perTrayek.forEach(function (tr) {
      var trayekName = tr.trayek === '(tanpa trayek)' ? '<i style="color:var(--gray-text);">Tanpa Trayek</i>' : tr.trayek;
      html += '<tr>' +
        '<td><b>' + trayekName + '</b></td>' +
        '<td class="num">' + tr.perjalanan.toLocaleString('id-ID') + '</td>' +
        '<td class="num"><b>' + tr.volume.toLocaleString('id-ID') + '</b></td>' +
        '<td class="num">' + tr.avgPerTrip.toFixed(2) + '</td>' +
      '</tr>';
    });
    html += '</tbody></table></div></div>';

    // Tabel Regional (bangkitan/tarikan per kota)
    html += '<div class="card"><h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:var(--navy);">🗺️ Bangkitan & Tarikan Per Kota/Kabupaten (' + data.regional.length + ' Wilayah)</h3>' +
      '<div class="table-wrap"><table id="tabelODRegional"><thead><tr>' +
      '<th style="min-width:180px;">Kota/Kabupaten</th>' +
      '<th class="num">Bangkitan</th>' +
      '<th class="num">Tarikan</th>' +
      '<th class="num">Total</th>' +
      '</tr></thead><tbody>';

    data.regional.forEach(function (r) {
      html += '<tr>' +
        '<td><b>' + r.kota + '</b></td>' +
        '<td class="num">' + r.bangkitan.toLocaleString('id-ID') + '</td>' +
        '<td class="num">' + r.tarikan.toLocaleString('id-ID') + '</td>' +
        '<td class="num"><b>' + r.total.toLocaleString('id-ID') + '</b></td>' +
      '</tr>';
    });
    html += '</tbody></table></div></div>';

    container.innerHTML = html;

    // Load OD Matrix Terminal A
    fetch('data/od-matrix-terminal-a.json').then(function (res) { return res.json(); }).then(function (matrix) {
      let matrixHtml = '<div class="card" style="margin-top:24px;"><h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:var(--navy);">📍 Matriks OD ke Terminal Tipe A Jawa Barat (' + matrix.origins.length + ' Origin × ' + matrix.terminals.length + ' Terminal A)</h3>' +
        '<div class="table-wrap"><table id="tabelODMatrix"><thead><tr>' +
        '<th style="min-width:200px;position:sticky;left:0;background:var(--card-bg);z-index:2;">Origin</th>' +
        '<th class="num" style="min-width:80px;">Total</th>';

      // Header terminal destinations
      matrix.terminals.forEach(function (term) {
        matrixHtml += '<th class="num" style="min-width:100px;">' + term + '</th>';
      });
      matrixHtml += '</tr></thead><tbody>';

      // Data rows
      matrix.origins.forEach(function (row) {
        matrixHtml += '<tr>' +
          '<td style="position:sticky;left:0;background:var(--card-bg);z-index:1;"><b>' + row.origin + '</b></td>' +
          '<td class="num"><b>' + row.total.toLocaleString('id-ID') + '</b></td>';

        matrix.terminals.forEach(function (term) {
          var val = row.destinations[term] || 0;
          var cellClass = val > 0 ? 'num' : 'num' + ' style="color:var(--gray-text);"';
          matrixHtml += '<td class="' + cellClass + '">' + (val > 0 ? val.toLocaleString('id-ID') : '-') + '</td>';
        });
        matrixHtml += '</tr>';
      });

      matrixHtml += '</tbody></table></div></div>';
      container.innerHTML += matrixHtml;
    }).catch(function (err) {
      console.warn('Gagal memuat OD Matrix:', err);
    });

  }).catch(function (err) {
    hideLoading();
    alert('Gagal memuat data OD: ' + (err.message || err));
  });
}

function muatDataMentah() {
  if (rawDataLoaded) return;
  showLoading();
  Backend.getAllRawData().then(function (data) {
      const tb = document.querySelector('#tabelRawData tbody');
      tb.innerHTML = '';
      data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + r.tanggal + '</td><td><b>' + r.nama_terminal + '</b></td><td>' + r.tipe + '</td><td class="num">' + formatAngka(r.kedatangan_kendaraan) + '</td><td class="num">' + formatAngka(r.kedatangan_penumpang) + '</td><td class="num">' + formatAngka(r.keberangkatan_kendaraan) + '</td><td class="num">' + formatAngka(r.keberangkatan_penumpang) + '</td>';
        tb.appendChild(tr);
      });
      rawDataLoaded = true;
      hideLoading();
    })
    .catch(function (err) {
      hideLoading();
      alert('Gagal memuat data mentah: ' + (err && err.message ? err.message : err));
    });
}

// ===== BOTTOM SHEET =====
const sheet = document.getElementById('sheet'),
  sheetBody = document.querySelector('.sheet-body');

function expandSheet(ex) {
  if (ex === false) { sheet.classList.remove('expanded'); return; }
  sheet.classList.add('expanded');
  if (sheetBody) sheetBody.scrollTop = 0;
}
function toggleSheet() { sheet.classList.toggle('expanded'); }
document.getElementById('sheetHandle').addEventListener('click', toggleSheet);

(function enableDrag() {
  const h = document.getElementById('sheetHandle'),
    hd = document.querySelector('.sheet-header');
  let sy = 0,
    cy = 0,
    d = false;
  function onS(y) { d = true;
    sy = y;
    sheet.style.transition = 'none'; }
  function onM(y) {
    if (!d) return;
    cy = y - sy;
    if (cy < 0) cy *= 0.2;
    sheet.style.transform = 'translateY(calc(' + (sheet.classList.contains('expanded') ? 0 : (window.innerHeight * 0.9 - 130)) + 'px + ' + cy + 'px))';
  }
  function onE() {
    if (!d) return;
    d = false;
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (sheet.classList.contains('expanded') && cy > 80) expandSheet(false);
    else if (!sheet.classList.contains('expanded') && cy < -30) expandSheet(true);
    cy = 0;
  }
  h.addEventListener('touchstart', e => onS(e.touches[0].clientY), { passive: true });
  hd.addEventListener('touchstart', e => { if (e.target.tagName !== 'BUTTON') onS(e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchmove', e => { if (d) onM(e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchend', onE);
  h.addEventListener('mousedown', e => onS(e.clientY));
  hd.addEventListener('mousedown', e => { if (e.target.tagName !== 'BUTTON') onS(e.clientY); });
  window.addEventListener('mousemove', e => { if (d) onM(e.clientY); });
  window.addEventListener('mouseup', onE);
})();

// ===== BOTTOM SHEET UPPKB (Angkutan Barang) =====
let uppkbCharts = [];
function insightKalimat(u, p, pct) {
  const pk = Number(p.diperiksa) || 0;
  const rate = (pct.pelanggaran || 0).toFixed(1);
  const nm = u.nama || 'UPPKB ini';
  if (pk >= 1) return nm + ' menempati peringkat ke-' + pk + ' pemeriksaan di antara 6 UPPKB, dengan tingkat pelanggaran ' + rate + '%.';
  return nm + ' memiliki tingkat pelanggaran ' + rate + '% dari kendaraan yang diperiksa.';
}
function renderSheetUppkb(u) {
  const body = document.getElementById('sheetUppkbBody');
  if (!body) return;
  uppkbCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
  uppkbCharts = [];
  const s = u.stats || {};
  body.innerHTML = '';

  // 1. KPI grid
  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'kpi-grid';
  const kpis = [
    { cls: 'bg-blue-light', txt: 'text-blue', label: 'Diperiksa', val: s.diperiksa },
    { cls: 'bg-cyan-light', txt: 'text-cyan', label: 'Pelanggaran', val: s.pelanggaran },
    { cls: 'bg-yellow-light', txt: 'text-yellow', label: 'Peringatan', val: s.peringatan },
    { cls: 'bg-green-light', txt: 'text-green', label: 'Tilang', val: (Number(s.tilang) || 0) + (Number(s.tilang_lain) || 0) + (Number(s.tilang_polisi) || 0) }
  ];
  kpis.forEach(function (k) {
    const c = document.createElement('div');
    c.className = 'kpi-card ' + k.cls;
    c.innerHTML = '<div class="kpi-header"><span class="kpi-label">' + k.label + '</span></div><div class="kpi-value ' + k.txt + '">' + formatAngka(k.val) + '</div>';
    kpiGrid.appendChild(c);
  });
  body.appendChild(kpiGrid);

  // 2. Kartu insight
  const p = u.peringkat || {};
  const pct = u.pct || {};
  const share = u.share || {};
  const insightCard = document.createElement('div');
  insightCard.className = 'card uppkb-insight';
  insightCard.innerHTML =
    '<h2 class="card-title">💡 Analisis</h2>' +
    '<div class="insight-line">' + insightKalimat(u, p, pct) + '</div>' +
    '<div class="insight-chips">' +
      '<div class="chip-stat"><span class="cs-label">Peringkat Diperiksa</span><span class="cs-val">#' + (p.diperiksa || '-') + ' dari 6</span></div>' +
      '<div class="chip-stat"><span class="cs-label">Tingkat Pelanggaran</span><span class="cs-val">' + (pct.pelanggaran || 0).toFixed(1) + '%</span></div>' +
      '<div class="chip-stat"><span class="cs-label">Share Diperiksa</span><span class="cs-val">' + (share.diperiksa || 0).toFixed(1) + '%</span></div>' +
      '<div class="chip-stat"><span class="cs-label">Share Pelanggaran</span><span class="cs-val">' + (share.pelanggaran || 0).toFixed(1) + '%</span></div>' +
    '</div>';
  body.appendChild(insightCard);

  // 3. Donut komposisi penindakan
  const komp = [
    { label: 'Peringatan', v: Number(s.peringatan) || 0 },
    { label: 'Transfer', v: Number(s.transfer) || 0 },
    { label: 'Tilang', v: Number(s.tilang) || 0 },
    { label: 'Tilang Lain', v: Number(s.tilang_lain) || 0 },
    { label: 'Tilang Polisi', v: Number(s.tilang_polisi) || 0 }
  ];
  const totK = komp.reduce((a, x) => a + x.v, 0);
  if (totK > 0) {
    const card = document.createElement('div');
    card.className = 'card uppkb-chart-card';
    card.innerHTML = '<h2 class="card-title">🍩 Komposisi Penindakan</h2><div class="uppkb-chart-wrap"><canvas id="uppkbDonut"></canvas></div>';
    body.appendChild(card);
    uppkbCharts.push(new Chart(document.getElementById('uppkbDonut'), {
      type: 'doughnut',
      data: { labels: komp.map(x => x.label), datasets: [{ data: komp.map(x => x.v), backgroundColor: ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ef4444'], borderWidth: 0, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '66%', animation: { duration: 800, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: function (c) { const v = Number(c.raw) || 0; return ' ' + c.label + ': ' + formatAngka(v) + (totK > 0 ? ' (' + ((v / totK) * 100).toFixed(1) + '%)' : ''); } } } } }
    }));
  }

  // 4. Line tren bulanan per UPPKB
  const tren = u.tren || [];
  const adaTren = tren.some(t => (Number(t.diperiksa) || 0) > 0 || (Number(t.pelanggaran) || 0) > 0);
  if (adaTren) {
    const card = document.createElement('div');
    card.className = 'card uppkb-chart-card';
    card.innerHTML = '<h2 class="card-title">📈 Tren Bulanan</h2><div class="uppkb-chart-wrap"><canvas id="uppkbTren"></canvas></div>';
    body.appendChild(card);
    uppkbCharts.push(new Chart(document.getElementById('uppkbTren'), {
      type: 'line',
      data: {
        labels: tren.map(t => t.bulan),
        datasets: [
          { label: 'Diperiksa', data: tren.map(t => Number(t.diperiksa) || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 2.6, fill: true, tension: 0.4, pointRadius: 3, spanGaps: true },
          { label: 'Pelanggaran', data: tren.map(t => Number(t.pelanggaran) || 0), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 2.6, fill: true, tension: 0.4, pointRadius: 3, spanGaps: true }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + formatAngka(c.raw); } } } }, scales: { y: { beginAtZero: true, grid: { borderDash: [4, 4] }, ticks: { callback: function (v) { return formatSingkat(v); } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
    }));
  }

  // 5. Tabel detail
  const tableCard = document.createElement('div');
  tableCard.className = 'card';
  const metrics = [
    ['Kabupaten/Kota', u.kabupaten || '-'],
    ['Kendaraan Diperiksa', formatAngka(s.diperiksa)],
    ['Total Pelanggaran', formatAngka(s.pelanggaran)],
    ['Peringatan', formatAngka(s.peringatan)],
    ['Transfer Muatan', formatAngka(s.transfer)],
    ['Tilang', formatAngka(s.tilang)],
    ['Tilang UPPKB Lain', formatAngka(s.tilang_lain)],
    ['Tilang Polisi', formatAngka(s.tilang_polisi)]
  ];
  tableCard.innerHTML = '<h2 class="card-title">Detail Kinerja UPPKB</h2><div class="table-wrap"><table><thead><tr><th>Metrik</th><th class="num">Nilai</th></tr></thead><tbody>' +
    metrics.map(function (m) { return '<tr><td>' + m[0] + '</td><td class="num">' + m[1] + '</td></tr>'; }).join('') +
    '</tbody></table></div>';
  body.appendChild(tableCard);
}
function bukaSheetUppkb(u) {
  if (!u) return;
  document.getElementById('sheetUppkbTitle').textContent = '🚛 ' + (u.nama || 'UPPKB');
  document.getElementById('sheetUppkbSubtitle').textContent = (u.kabupaten || '') + ' · Unit Pengawasan Kendaraan Bermotor';
  renderSheetUppkb(u);
  expandSheet(false); // tutup sheet terminal agar tidak bertumpuk
  const su = document.getElementById('sheetUppkb');
  su.classList.add('uppkb-open');
  const sb = document.getElementById('sheetUppkbBody');
  if (sb) sb.scrollTop = 0;
}
function tutupSheetUppkb() {
  const su = document.getElementById('sheetUppkb');
  if (su) su.classList.remove('uppkb-open');
}
(function enableUppkbDrag() {
  const h = document.getElementById('sheetUppkbHandle');
  const hd = document.querySelector('#sheetUppkb .sheet-header');
  const su = document.getElementById('sheetUppkb');
  if (!h || !hd || !su) return;
  let sy = 0, cy = 0, d = false;
  function onS(y) { d = true; sy = y; su.style.transition = 'none'; }
  function onM(y) { if (!d) return; cy = y - sy; if (cy < 0) cy *= 0.2; su.style.transform = 'translateY(calc(' + (su.classList.contains('uppkb-open') ? 0 : (window.innerHeight * 1.1)) + 'px + ' + cy + 'px))'; }
  function onE() {
    if (!d) return; d = false; su.style.transition = ''; su.style.transform = '';
    if (su.classList.contains('uppkb-open') && cy > 80) tutupSheetUppkb();
    else if (!su.classList.contains('uppkb-open') && cy < -30) su.classList.add('uppkb-open');
    cy = 0;
  }
  h.addEventListener('touchstart', function (e) { onS(e.touches[0].clientY); }, { passive: true });
  hd.addEventListener('touchstart', function (e) { if (e.target.tagName !== 'BUTTON') onS(e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (d) onM(e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchend', onE);
  h.addEventListener('mousedown', function (e) { onS(e.clientY); });
  hd.addEventListener('mousedown', function (e) { if (e.target.tagName !== 'BUTTON') onS(e.clientY); });
  window.addEventListener('mousemove', function (e) { if (d) onM(e.clientY); });
  window.addEventListener('mouseup', onE);
})();
document.getElementById('btnTutupUppkb').addEventListener('click', tutupSheetUppkb);

// ===== BUAT TRAYEK (MANUAL ROUTE) =====
function initRouteBuilderSelects(points) {
  const os = document.getElementById('routeOriginSelect'),
    ds = document.getElementById('routeDestSelect');
  if (!os || !ds) return;
  const co = os.value,
    cd = ds.value;
  os.innerHTML = '<option value="">-- Pilih Asal --</option>';
  ds.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
  points.forEach(p => {
    const o1 = document.createElement('option');
    o1.value = p.kode_terminal;
    o1.textContent = p.nama_terminal + ' (' + p.kabupaten_kota + ')';
    o1.dataset.lat = p.lat;
    o1.dataset.lng = p.lng;
    os.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = p.kode_terminal;
    o2.textContent = p.nama_terminal + ' (' + p.kabupaten_kota + ')';
    o2.dataset.lat = p.lat;
    o2.dataset.lng = p.lng;
    ds.appendChild(o2);
  });
  if (co && os.querySelector('option[value="' + co + '"]')) os.value = co;
  else if (points.length > 0) {
    os.value = points[0].kode_terminal;
    routeBuilder.origin = { lat: points[0].lat, lng: points[0].lng };
    routeBuilder.lastOriginCode = points[0].kode_terminal;
  }
  if (cd && ds.querySelector('option[value="' + cd + '"]')) ds.value = cd;
  os.onchange = function () {
    const s = os.options[os.selectedIndex];
    if (s && s.value) {
      routeBuilder.origin = { lat: parseFloat(s.dataset.lat), lng: parseFloat(s.dataset.lng) };
      routeBuilder.lastOriginCode = s.value;
    }
  };
  ds.onchange = function () {
    const s = ds.options[ds.selectedIndex];
    if (s && s.value) routeBuilder.lastDestCode = s.value;
  };
}

function toggleViaMode() {
  const btn = document.getElementById('btnToggleViaMode');
  if (!routeBuilder.active) {
    routeBuilder.active = true;
    btn.textContent = '⏹️ Hentikan Tambah Via';
    btn.style.background = '#ef4444';
    document.getElementById('routeStatus').textContent = 'Klik titik pada peta untuk menambahkan via point.';
    document.getElementById('map').style.cursor = 'crosshair';
  } else {
    routeBuilder.active = false;
    btn.textContent = '➕ Tambah Via Point';
    btn.style.background = '';
    document.getElementById('routeStatus').textContent = 'Mode tambah via nonaktif.';
    document.getElementById('map').style.cursor = '';
  }
  // Panel TIDAK menciut otomatis: karena latar transparan, peta tetap bisa
  // diklik walau panel terbuka. Pengguna bisa ciutkan manual lewat tombol ▾.
}

// Marker titik via: bisa DISERET (edit poin) dan DIKLIK (hapus poin).
function buatViaMarker(lat, lng) {
  const m = L.marker([lat, lng], {
    draggable: true,
    icon: L.divIcon({ className: 'via-dot', html: '<div class="via-dot-inner"></div>', iconSize: [14, 14], iconAnchor: [7, 7] })
  }).addTo(map);
  m.buatLabel = function (ii) { m.setTooltipContent('Via #' + (ii + 1)); };
  m.buatLabel(routeBuilder.viaPoints.length);
  m.on('click', function () {
    const i = routeBuilder.viaMarkers.indexOf(m);
    if (i < 0) return;
    if (!confirm('Hapus titik via #' + (i + 1) + '?')) return;
    removeViaAt(i);
  });
  m.on('drag', function () {
    const i = routeBuilder.viaMarkers.indexOf(m);
    if (i < 0) return;
    routeBuilder.viaPoints[i] = { lat: m.getLatLng().lat, lng: m.getLatLng().lng };
    redrawRoutePolyline();
  });
  m.on('dragend', function () {
    const i = routeBuilder.viaMarkers.indexOf(m);
    if (i < 0) return;
    routeBuilder.viaPoints[i] = { lat: m.getLatLng().lat, lng: m.getLatLng().lng };
    updateViaStatus();
  });
  return m;
}

function addViaPoint(e) {
  if (!routeBuilder.active || !e.latlng) return;
  const m = buatViaMarker(e.latlng.lat, e.latlng.lng);
  routeBuilder.viaMarkers.push(m);
  routeBuilder.viaPoints.push({ lat: e.latlng.lat, lng: e.latlng.lng });
  routeBuilder.viaMarkers.forEach(function (mm, ii) { if (mm.buatLabel) mm.buatLabel(ii); });
  updateViaStatus();
}

function removeViaAt(i) {
  if (i < 0 || i >= routeBuilder.viaMarkers.length) return;
  map.removeLayer(routeBuilder.viaMarkers[i]);
  routeBuilder.viaMarkers.splice(i, 1);
  routeBuilder.viaPoints.splice(i, 1);
  routeBuilder.viaMarkers.forEach(function (mm, ii) { if (mm.buatLabel) mm.buatLabel(ii); });
  redrawRoutePolyline();
  updateViaStatus();
}

function clearViaPoints() {
  routeBuilder.viaMarkers.forEach(m => map.removeLayer(m));
  routeBuilder.viaMarkers = [];
  routeBuilder.viaPoints = [];
  updateViaStatus();
  if (routeBuilder.routePolyline) { map.removeLayer(routeBuilder.routePolyline);
    routeBuilder.routePolyline = null;
    routeBuilder.lastRouteResult = null; }
  document.getElementById('btnSaveRoute').style.display = 'none';
}

function updateViaStatus() {
  const n = routeBuilder.viaPoints.length;
  const el = document.getElementById('viaPointsStatus');
  const hint = routeBuilder.editRouteId ? '· seret untuk pindah · klik untuk hapus' : (n > 0 ? '· seret untuk pindah · klik untuk hapus' : '');
  el.textContent = n + ' titik via' + (n > 0 ? ' ' + hint : '');
}

function ambilDestPoint() {
  const ds = document.getElementById('routeDestSelect');
  if (ds && ds.selectedIndex >= 0) {
    const s = ds.options[ds.selectedIndex];
    if (s && s.value && s.dataset.lat) return { lat: parseFloat(s.dataset.lat), lng: parseFloat(s.dataset.lng) };
  }
  return null;
}

// Bangun ulang polyline dari asal + via + tujuan (TANPA fitBounds, agar tak
// me-lompat saat menyeret titik).
function redrawRoutePolyline() {
  const o = routeBuilder.origin, d = ambilDestPoint();
  if (!o || !d) return;
  const latlngs = [[o.lat, o.lng]];
  routeBuilder.viaPoints.forEach(p => latlngs.push([p.lat, p.lng]));
  latlngs.push([d.lat, d.lng]);
  if (routeBuilder.routePolyline) map.removeLayer(routeBuilder.routePolyline);
  routeBuilder.routePolyline = L.polyline(latlngs, {
    color: routeColor, weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round'
  }).addTo(map);
  routeBuilder.lastRouteResult = { polyline: latlngs, distance: hitungJarakKm(latlngs) * 1000, duration: 0 };
}

// Ganti seluruh isi titik via (dipakai saat muat trayek utk edit & tempel titik).
function setViaPoints(points) {
  clearViaPoints();
  (points || []).forEach(p => {
    const m = buatViaMarker(parseFloat(p.lat), parseFloat(p.lng));
    routeBuilder.viaMarkers.push(m);
    routeBuilder.viaPoints.push({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) });
  });
  routeBuilder.viaMarkers.forEach(function (mm, ii) { if (mm.buatLabel) mm.buatLabel(ii); });
  updateViaStatus();
}

// Perkiraan jarak garis lurus antar titik (km).
function hitungJarakKm(latlngs) {
  let totalDist = 0;
  for (let i = 0; i < latlngs.length - 1; i++) {
    const p1 = latlngs[i], p2 = latlngs[i + 1];
    const R = 6371;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    totalDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return totalDist;
}

// ===== Library trayek tersimpan (edit poin / salin titik) =====
function renderRouteLib() {
  const box = document.getElementById('routeLibList');
  const empty = document.getElementById('routeLibEmpty');
  if (!box) return;
  box.innerHTML = '';
  if (!savedRoutesData || !savedRoutesData.length) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  savedRoutesData.forEach(function (r) {
    const row = document.createElement('div');
    row.className = 'route-lib-row';
    const colorDot = document.createElement('span');
    colorDot.className = 'route-lib-dot';
    colorDot.style.background = r.color || '#3b82f6';
    const nameBox = document.createElement('div');
    nameBox.className = 'route-lib-namebox';
    const lbl = document.createElement('span');
    lbl.className = 'route-lib-name';
    lbl.textContent = r.name || 'Trayek';
    lbl.title = (r.origin_code || '?') + ' → ' + (r.dest_code || '?') + ' · ' + (r.waypoints ? r.waypoints.length : 0) + ' titik via';
    nameBox.appendChild(lbl);
    if (r.volume || r.perjalanan || r.jarak_km) {
      const sub = document.createElement('span');
      sub.className = 'route-lib-sub';
      sub.textContent = '👥 ' + formatSingkat(r.volume) + ' · 🚌 ' + formatSingkat(r.perjalanan) + ' · ' + (Number(r.jarak_km) || 0).toLocaleString('id-ID') + ' km';
      nameBox.appendChild(sub);
    }
    const btns = document.createElement('div');
    btns.className = 'route-lib-actions';
    const bEdit = document.createElement('button');
    bEdit.textContent = '✏️';
    bEdit.className = 'route-lib-btn';
    bEdit.title = 'Edit poin trayek ini';
    bEdit.onclick = function () { muatTrayekKeBuilder(r); };
    const bCopy = document.createElement('button');
    bCopy.textContent = '📋';
    bCopy.className = 'route-lib-btn';
    bCopy.title = 'Salin titik trayek ini, lalu buat trayek baru dan tempel';
    bCopy.onclick = function () { salinkanTitikTrayek(r.waypoints); };
    btns.appendChild(bEdit);
    btns.appendChild(bCopy);
    row.appendChild(colorDot);
    row.appendChild(nameBox);
    row.appendChild(btns);
    box.appendChild(row);
  });
}

// Muat trayek tersimpan ke builder utk DIEDIT poinnya (asal/tujuan/via ditarik).
function muatTrayekKeBuilder(r) {
  const o = document.getElementById('routeBuilderOverlay');
  if (o) { o.classList.remove('hidden'); o.classList.remove('route-minimized'); sembunyikanMiniRoute(); }
  const os = document.getElementById('routeOriginSelect');
  if (r.origin_code && os.querySelector('option[value="' + r.origin_code + '"]')) {
    os.value = r.origin_code;
    const s = os.options[os.selectedIndex];
    routeBuilder.origin = { lat: parseFloat(s.dataset.lat), lng: parseFloat(s.dataset.lng) };
    routeBuilder.lastOriginCode = r.origin_code;
  }
  const ds = document.getElementById('routeDestSelect');
  if (r.dest_code && ds.querySelector('option[value="' + r.dest_code + '"]')) ds.value = r.dest_code;
  setViaPoints(r.waypoints || []);
  redrawRoutePolyline();
  if (routeBuilder.routePolyline) map.fitBounds(routeBuilder.routePolyline.getBounds(), { padding: [40, 40] });
  routeBuilder.editRouteId = r.id;
  routeColor = r.color || '#3b82f6';
  applyRouteColorUI();
  document.getElementById('btnSaveRoute').style.display = 'block';
  document.getElementById('routeStatus').textContent = '✏️ Edit "' + (r.name || 'Trayek') + '": seret titik untuk pindah, klik titik untuk hapus, klik peta (mode via) untuk tambah, lalu 💾 Simpan.';
}

// Sinkronkan swatch palet yang aktif sesuai routeColor.
function applyRouteColorUI() {
  const csws = document.querySelectorAll('.csw');
  csws.forEach(b => b.classList.toggle('active', b.getAttribute('data-c') === routeColor));
}

// ===== Salin / tempel titik antar trayek =====
function updateClipboardCount() {
  const n = routeBuilder.clipboardPoints.length;
  const pc = document.getElementById('pasteViaCount');
  if (pc) pc.textContent = n ? '(' + n + ')' : '';
  const btn = document.getElementById('btnPasteViaTip');
  if (btn) btn.style.opacity = n ? '1' : '0.55';
}

function salinTitikDraft() {
  const pts = routeBuilder.viaPoints.map(p => ({ lat: p.lat, lng: p.lng }));
  if (!pts.length) { alert('Belum ada titik via untuk disalin.'); return; }
  routeBuilder.clipboardPoints = pts;
  document.getElementById('salinViaCount').textContent = '✅';
  updateClipboardCount();
  alert('Titik tersalin (' + pts.length + ' titik) — klik "📌 Tempel Titik" pada trayek baru.');
}

function salinkanTitikTrayek(points) {
  const pts = (points || []).map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));
  if (!pts.length) { alert('Trayek tidak memiliki titik via.'); return; }
  routeBuilder.clipboardPoints = pts;
  document.getElementById('salinViaCount').textContent = '✅ ' + pts.length;
  updateClipboardCount();
  alert('Titik trayek disalin (' + pts.length + ' titik). Buka Buat Trayek baru lalu klik "📌 Tempel Titik", dan lanjutkan via point.');
}

function tempelTitik() {
  if (!routeBuilder.clipboardPoints.length) { alert('Tidak ada titik tersalin. Salin dulu dari trayek tersimpan (📋) atau rute ini (📋 Salin Titik).'); return; }
  routeBuilder.viaMarkers.forEach(m => map.removeLayer(m));
  routeBuilder.viaMarkers = [];
  routeBuilder.viaPoints = routeBuilder.clipboardPoints.map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));
  routeBuilder.viaPoints.forEach(p => { routeBuilder.viaMarkers.push(buatViaMarker(p.lat, p.lng)); });
  routeBuilder.viaMarkers.forEach(function (mm, ii) { if (mm.buatLabel) mm.buatLabel(ii); });
  if (routeBuilder.origin && ambilDestPoint()) redrawRoutePolyline();
  updateViaStatus();
  document.getElementById('routeStatus').textContent = '✅ ' + routeBuilder.viaPoints.length + ' titik ditempel. Hidupkan mode via lalu klik peta untuk melanjutkan titik berikutnya.';
}

// ----- Panel trayek: ciutkan/ekspansi ke pill kecil (agar peta terlihat) -----
function sembunyikanMiniRoute() {
  const p = document.getElementById('routeMini');
  if (p) p.classList.add('hidden');
}
function tampilkanMiniRoute() {
  const p = document.getElementById('routeMini');
  if (p) p.classList.remove('hidden');
}
function ciutkanRouteBuilder(ciut) {
  const o = document.getElementById('routeBuilderOverlay');
  if (!o) return;
  o.classList.toggle('route-minimized', !!ciut);
  if (ciut) tampilkanMiniRoute(); else sembunyikanMiniRoute();
}

// ----- ROUTE MANUAL (tanpa OSRM) -----
function routeNow() {
  const os = document.getElementById('routeOriginSelect'),
    ds = document.getElementById('routeDestSelect');
  const oo = os.options[os.selectedIndex],
    do_ = ds.options[ds.selectedIndex];
  if (!oo || !oo.value) { alert('Pilih asal!'); return; }
  if (!do_ || !do_.value) { alert('Pilih tujuan!'); return; }

  // Set asal dari dropdown, lalu gambar polyline via helper bersama.
  routeBuilder.origin = { lat: parseFloat(oo.dataset.lat), lng: parseFloat(oo.dataset.lng) };
  routeBuilder.lastDestCode = do_.value;
  redrawRoutePolyline();
  if (!routeBuilder.routePolyline) return;

  const latlngs = routeBuilder.lastRouteResult.polyline;
  const totalDist = hitungJarakKm(latlngs);

  map.fitBounds(routeBuilder.routePolyline.getBounds(), { padding: [40, 40] });

  document.getElementById('routeStatus').textContent = '✅ Rute manual: ' + totalDist.toFixed(1) + ' km (garis lurus)';

  // Tooltip jarak + jumlah titik pada poliline
  const mid = latlngs[Math.floor(latlngs.length / 2)];
  routeBuilder.routePolyline.bindTooltip('🚌 ' + totalDist.toFixed(1) + ' km · ' + latlngs.length + ' titik', { direction: 'center', offset: [0, -6] });
  routeBuilder.routePolyline.openTooltip(mid);

  document.getElementById('btnSaveRoute').style.display = 'block';
}

function saveCurrentRoute() {
  if (!routeBuilder.lastRouteResult) { alert('Tidak ada rute.'); return; }
  const name = prompt('Nama trayek:', 'Trayek ' + new Date().toLocaleDateString());
  if (!name) return;
  const isEdit = !!routeBuilder.editRouteId;
  const payload = {
    name: name,
    origin_code: document.getElementById('routeOriginSelect').value,
    dest_code: document.getElementById('routeDestSelect').value,
    waypoints: routeBuilder.viaPoints,
    polyline: routeBuilder.lastRouteResult.polyline,
    color: routeColor
  };
  if (isEdit) payload.id = routeBuilder.editRouteId;

  const onOk = function (res) {
    hideLoading();
    if (!(res && res.ok)) { alert('Gagal simpan.'); return; }
    if (isEdit) {
      alert('Trayek "' + name + '" diperbarui.');
      const idx = savedRoutesData.findIndex(x => x.id === payload.id);
      const nr = { id: payload.id, name: name, origin_code: payload.origin_code, dest_code: payload.dest_code, waypoints: payload.waypoints, polyline: payload.polyline, color: payload.color };
      if (idx >= 0) savedRoutesData[idx] = nr;
    } else {
      alert('Trayek "' + name + '" disimpan.');
      const nr = { id: res.id, name: name, origin_code: payload.origin_code, dest_code: payload.dest_code, waypoints: payload.waypoints, polyline: payload.polyline, color: payload.color };
      savedRoutesData.push(nr);
    }
    // Redraw semua trayek + perbarui library panel + legenda.
    routesLayer.clearLayers(); routePolylines = {};
    savedRoutesData.forEach(rr => drawRouteFromData(rr));
    renderRouteLib();
    buatLegenda();
    document.getElementById('btnSaveRoute').style.display = 'none';
    resetRouteBuilder();
  };
  const onFail = function (err) {
    hideLoading();
    alert('Error: ' + (err && err.message ? err.message : err));
  };

  showLoading();
  if (isEdit) {
    Backend.updateRoute(payload).then(onOk).catch(onFail);
  } else {
    Backend.saveRoute(payload).then(onOk).catch(onFail);
  }
}

function resetRouteBuilder() {
  if (routeBuilder.active) {
    routeBuilder.active = false;
    const btn = document.getElementById('btnToggleViaMode');
    if (btn) { btn.textContent = '➕ Tambah Via Point';
      btn.style.background = ''; }
  }
  clearViaPoints();
  const os = document.getElementById('routeOriginSelect');
  if (os) {
    const def = Array.from(os.options).find(o => o.text && o.text.toLowerCase().includes('leuwipanjang'));
    if (def && def.value) { os.value = def.value;
      routeBuilder.origin = { lat: parseFloat(def.dataset.lat), lng: parseFloat(def.dataset.lng) };
      routeBuilder.lastOriginCode = def.value; } else if (os.options.length > 1) { os.selectedIndex = 1; const f = os.options[1];
      routeBuilder.origin = { lat: parseFloat(f.dataset.lat), lng: parseFloat(f.dataset.lng) };
      routeBuilder.lastOriginCode = f.value; }
  }
  if (routeBuilder.routePolyline) { map.removeLayer(routeBuilder.routePolyline);
    routeBuilder.routePolyline = null; }
  routeBuilder.lastRouteResult = null;
  routeBuilder.editRouteId = null;
  updateClipboardCount();
  const sc = document.getElementById('salinViaCount'); if (sc) sc.textContent = '';
  const pc = document.getElementById('pasteViaCount'); if (pc) pc.textContent = '';
  document.getElementById('routeStatus').textContent = 'Klik peta untuk menambahkan titik via (gerbang tol, simpang, dll.)';
  document.getElementById('map').style.cursor = '';
}

// ===== PROFILE CARD =====
function tampilkanProfile(p) {
  if (!p) return;
  currentProfileKode = p.kode_terminal;
  const tipe = (p.tipe || '-').toUpperCase(),
    warna = warnaTipe[tipe] || '#94a3b8',
    label = labelTipe[tipe] || tipe;
  document.getElementById('profileBadge').textContent = label;
  document.getElementById('profileBadge').style.background = warna + '22';
  document.getElementById('profileBadge').style.color = warna;
  document.getElementById('profileTitle').textContent = p.nama_terminal || '-';
  document.getElementById('profileKabkota').textContent = (p.kabupaten_kota || '-') + ' · ' + label;
  document.getElementById('pfAlamat').value = p.alamat || '';
  document.getElementById('pfKoordinat').value = (p.lat || '-') + ', ' + (p.lng || '-');
  muatProfileDariServer(p);
  document.getElementById('profileOverlay').classList.remove('hidden');
}

function muatProfileDariServer(p) {
  showLoading();
  Backend.getTerminalDetail(p.kode_terminal).then(function (detail) {
      hideLoading();
      if (detail) {
        profileFotoUrl = detail.foto_url || '';
        profileFotoData = null;
        // Alamat diambil dari detail tersimpan (lebih baru dari data Terminal) — jangan timpa dengan nilai lama.
        document.getElementById('pfAlamat').value = detail.alamat || document.getElementById('pfAlamat').value;
        document.getElementById('pfDeskripsi').value = detail.deskripsi || '';
        document.getElementById('pfLuasWilayah').value = detail.luas_wilayah || '';
        document.getElementById('pfLuasBangunan').value = detail.luas_bangunan || '';
        document.getElementById('pfKontak').value = detail.kontak || '';
        document.getElementById('pfJamOperasi').value = detail.jam_operasi || '';
        document.getElementById('pfWebsite').value = detail.website || '';
        if (detail.foto_url) {
          document.getElementById('profileFoto').src = detail.foto_url;
          document.getElementById('profileFoto').style.display = 'block';
          document.getElementById('profileFotoPlaceholder').style.display = 'none';
        } else {
          document.getElementById('profileFoto').style.display = 'none';
          document.getElementById('profileFotoPlaceholder').style.display = 'block';
        }
        renderExtraFields(detail.extra_fields || {});
      } else {
        profileFotoUrl = '';
        profileFotoData = null;
        document.getElementById('pfDeskripsi').value = '';
        document.getElementById('pfLuasWilayah').value = '';
        document.getElementById('pfLuasBangunan').value = '';
        document.getElementById('pfKontak').value = '';
        document.getElementById('pfJamOperasi').value = '';
        document.getElementById('pfWebsite').value = '';
        document.getElementById('profileFoto').style.display = 'none';
        document.getElementById('profileFotoPlaceholder').style.display = 'block';
        renderExtraFields({});
      }
    })
    .catch(function (err) {
      hideLoading();
      alert('Gagal memuat profil: ' + (err && err.message ? err.message : err));
    });
}

function renderExtraFields(extra) {
  const c = document.getElementById('extraFieldsList');
  c.innerHTML = '';
  Object.keys(extra).forEach(function (k) { tambahBarisExtraField(k, extra[k]); });
}

function tambahBarisExtraField(key, val) {
  const c = document.getElementById('extraFieldsList');
  const d = document.createElement('div');
  d.className = 'extra-field-row';
  d.innerHTML = '<input type="text" class="ef-key" placeholder="Nama field" value="' + (key || '') + '"><input type="text" class="ef-val" placeholder="Nilai" value="' + (val || '') + '"><button class="extra-field-del" onclick="this.parentElement.remove()">×</button>';
  c.appendChild(d);
}

// Kompres foto (resize ke lebar maksimal + ubah ke JPEG) supaya payload base64 tidak membengkak.
function kecilkanFoto(file, maxW, cb) {
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = new Image();
    img.onload = function () {
      try {
        const w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        const scale = w > maxW ? maxW / w : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = (file.type === 'image/png') ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82);
        cb(out);
      } catch (e) { cb(ev.target.result); }
    };
    img.onerror = function () { cb(ev.target.result); };
    img.src = ev.target.result;
  };
  reader.onerror = function () { cb(null); };
  reader.readAsDataURL(file);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  document.getElementById('btnUpdateData').addEventListener('click', jalankanUpdateData);
  document.getElementById('btnEditPotret').addEventListener('click', bukaEditorPotret);
  document.getElementById('btnSimpanPotret').addEventListener('click', simpanPotret);
  document.getElementById('btnBatalPotret').addEventListener('click', tutupEditorPotret);
  document.getElementById('btnTutupEditPotret').addEventListener('click', tutupEditorPotret);
  document.getElementById('editPotretOverlay').addEventListener('click', function (e) { if (e.target === this) tutupEditorPotret(); });
  document.getElementById('btnTambahBarisPotret').addEventListener('click', function () {
    potretEditRows.push({});
    renderPotretEditor();
  });
  document.getElementById('potretEditBody').addEventListener('input', function (e) {
    if (!e.target.classList || !e.target.classList.contains('pe-in')) return;
    const i = Number(e.target.getAttribute('data-i'));
    const c = e.target.getAttribute('data-c');
    if (potretEditRows[i]) potretEditRows[i][c] = e.target.value;
  });
  document.getElementById('potretEditBody').addEventListener('click', function (e) {
    if (!e.target.classList || !e.target.classList.contains('pe-del')) return;
    const i = Number(e.target.getAttribute('data-i'));
    potretEditRows.splice(i, 1);
    renderPotretEditor();
  });
  document.getElementById('btnFilter').addEventListener('click', function () { document.getElementById('filterOverlay').classList.remove('hidden'); });
  document.getElementById('btnTutupFilter').addEventListener('click', function () { document.getElementById('filterOverlay').classList.add('hidden'); });
  document.getElementById('filterOverlay').addEventListener('click', function (e) { if (e.target === this) this.classList.add('hidden'); });
  document.getElementById('btnTerapkan').addEventListener('click', function () {
    document.getElementById('filterOverlay').classList.add('hidden');
    updateChipFilter();
    rawDataLoaded = false;
    if (selectedKode !== null) pilihTerminal(selectedKode);
    else muatData(filterAktif(), false);
  });
  document.getElementById('btnKembali').addEventListener('click', pilihSemuaTerminal);
  document.getElementById('btnEditProfile').addEventListener('click', function () {
    const p = allPoints.find(x => x.kode_terminal === selectedKode);
    if (p) tampilkanProfile(p);
  });
  document.getElementById('btnMenu').addEventListener('click', function () { document.getElementById('sideMenuOverlay').classList.remove('hidden'); });
  document.getElementById('btnTutupMenu').addEventListener('click', function () { document.getElementById('sideMenuOverlay').classList.add('hidden'); });
  document.getElementById('sideMenuOverlay').addEventListener('click', function (e) { if (e.target === this) this.classList.add('hidden'); });
  document.getElementById('btnSearch').addEventListener('click', function () { document.getElementById('searchOverlay').classList.remove('hidden');
    document.getElementById('searchInput').focus(); });
  document.getElementById('btnTutupSearch').addEventListener('click', function () { document.getElementById('searchOverlay').classList.add('hidden'); });
  let st = null;
  document.getElementById('searchInput').addEventListener('input', function (e) {
    clearTimeout(st);
    const v = e.target.value.toLowerCase();
    st = setTimeout(function () {
      const rc = document.getElementById('searchResults');
      rc.innerHTML = '';
      if (!v) return;
      const fl = allPoints.filter(p => (p.nama_terminal && p.nama_terminal.toLowerCase().includes(v)) || (p.kabupaten_kota && p.kabupaten_kota.toLowerCase().includes(v))).slice(0, 40);
      if (!fl.length) { rc.innerHTML = '<div style="padding:16px;text-align:center;color:var(--gray-text);">Tidak ditemukan</div>'; return; }
      fl.forEach(p => {
        const d = document.createElement('div');
        d.className = 'search-result-item';
        d.innerHTML = '<b>' + p.nama_terminal + '</b><small>' + p.kabupaten_kota + ' · Tipe ' + (p.tipe || '-') + '</small>';
        d.onclick = function () { document.getElementById('searchOverlay').classList.add('hidden');
          aktifkanView('home');
          pilihTerminal(p.kode_terminal); };
        rc.appendChild(d);
      });
    }, 180);
  });
  // Menu item click handler
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function () {
      document.getElementById('sideMenuOverlay').classList.add('hidden');
      const potret = this.getAttribute('data-potret');
      if (potret) { bukaPotret(potret); return; }
      aktifkanView(this.getAttribute('data-view'));
    });
  });

  // Menu group accordion toggle
  document.querySelectorAll('.menu-group-header').forEach(header => {
    header.addEventListener('click', function () {
      const group = this.parentElement;
      group.classList.toggle('collapsed');
    });
  });
  document.getElementById('btnTutupRouteBuilder').addEventListener('click', function () {
    document.getElementById('routeBuilderOverlay').classList.add('hidden');
    sembunyikanMiniRoute();
    resetRouteBuilder();
    aktifkanView('home');
  });
  // Ciutkan/ekspansi panel trayek (agar peta tetap terlihat)
  document.getElementById('btnMinimizeRoute').addEventListener('click', function () { ciutkanRouteBuilder(true); });
  document.getElementById('routeMini').addEventListener('click', function () { ciutkanRouteBuilder(false); });
  document.getElementById('btnToggleViaMode').addEventListener('click', toggleViaMode);
  document.getElementById('btnClearVia').addEventListener('click', clearViaPoints);
  document.getElementById('btnRouteNow').addEventListener('click', routeNow);
  document.getElementById('btnSaveRoute').addEventListener('click', saveCurrentRoute);
  document.getElementById('btnSalinViaTip').addEventListener('click', salinTitikDraft);
  document.getElementById('btnPasteViaTip').addEventListener('click', tempelTitik);
  // Palette warna trayek
  const csws = document.querySelectorAll('.csw');
  csws.forEach(b => {
    b.addEventListener('click', function () {
      csws.forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      routeColor = this.getAttribute('data-c');
      if (routeBuilder.routePolyline) routeBuilder.routePolyline.setStyle({ color: routeColor });
    });
  });
  // Toggle tema
  document.getElementById('btnTheme').addEventListener('click', function () {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    terapkanTema(dark ? 'light' : 'dark');
  });
  // Profile
  document.getElementById('btnTutupProfile').addEventListener('click', function () { document.getElementById('profileOverlay').classList.add('hidden'); });
  document.getElementById('btnTutupProfileBawah').addEventListener('click', function () { document.getElementById('profileOverlay').classList.add('hidden'); });
  document.getElementById('profileOverlay').addEventListener('click', function (e) { if (e.target === this) this.classList.add('hidden'); });
  document.getElementById('btnTambahField').addEventListener('click', function () { tambahBarisExtraField('', ''); });
  // Tambah/ubah foto: pilih file → kompres → pratinjau → diupload saat tombol Simpan.
  document.getElementById('profileFotoWrap').addEventListener('click', function (e) {
    if (e.target.tagName === 'INPUT') return;
    document.getElementById('profileFotoInput').click();
  });
  document.getElementById('profileFotoInput').addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { alert('Pilih file gambar (jpg, png, webp, dll).'); this.value = ''; return; }
    if (file.size > 3 * 1024 * 1024) { alert('Ukuran foto maksimal 3 MB. Pilih foto lain.'); this.value = ''; return; }
    kecilkanFoto(file, 900, function (dataUrl) {
      profileFotoData = dataUrl;
      document.getElementById('profileFoto').src = dataUrl;
      document.getElementById('profileFoto').style.display = 'block';
      document.getElementById('profileFotoPlaceholder').style.display = 'none';
    });
  });
  document.getElementById('btnSimpanProfile').addEventListener('click', function () {
    var extra = {};
    document.querySelectorAll('.extra-field-row').forEach(function (row) {
      var k = row.querySelector('.ef-key').value.trim();
      var v = row.querySelector('.ef-val').value.trim();
      if (k) extra[k] = v;
    });
    var payload = {
      kode_terminal: currentProfileKode,
      alamat: document.getElementById('pfAlamat').value,
      foto_url: profileFotoUrl,
      foto_data: profileFotoData || '',
      deskripsi: document.getElementById('pfDeskripsi').value,
      luas_wilayah: document.getElementById('pfLuasWilayah').value,
      luas_bangunan: document.getElementById('pfLuasBangunan').value,
      kontak: document.getElementById('pfKontak').value,
      jam_operasi: document.getElementById('pfJamOperasi').value,
      website: document.getElementById('pfWebsite').value,
      extra_fields: extra
    };
    showLoading();
    Backend.saveTerminalDetail(payload).then(function (res) {
        hideLoading();
        if (res && res.ok) {
          profileFotoData = null; // jangan re-upload foto yang sama saat save berulang
          if (res.foto_url) {
            profileFotoUrl = res.foto_url;
            // Perbarui data marker + tooltip hover foto langsung, tanpa refresh halaman.
            const pt = allPoints.find(x => x.kode_terminal === currentProfileKode);
            if (pt) { pt.foto_url = res.foto_url; perbaruiTooltipMarker(currentProfileKode); }
          }
          alert('Data berhasil disimpan! ✅');
        } else alert('Gagal menyimpan.');
      })
      .catch(function (err) {
        hideLoading();
        alert('Error: ' + (err.message || err));
      });
  });
}

// ===== TOPBAR AUTO-HIDE (saat scroll konten sheet) =====
(function topbarAutoHide() {
  const topbar = document.querySelector('.topbar');
  const sb = document.querySelector('.sheet-body');
  if (!topbar || !sb) return;
  let lastSt = 0;
  sb.addEventListener('scroll', function () {
    const st = sb.scrollTop;
    if (st > 80 && st > lastSt) topbar.classList.add('hide');
    else if (st < lastSt || st < 160) topbar.classList.remove('hide');
    lastSt = st;
  }, { passive: true });
})();

// ===== TEMA TERANG / GELAP =====
const THEME_KEY = 'geoterminal_theme';
const SVG_SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
const SVG_MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
// ===== CHOROPLETH KABUPATEN/KOTA (bangkitan & tarikan) =====
let choroplethLayer = null, choroplethData = {}, choroplethMetric = 'bangkitan';
let choroplethMax = { bangkitan: 1, tarikan: 1 };

function loadChoropleth() {
  Promise.all([
    fetch('data/Jabar_By_Kab.geojson').then(function (r) { return r.ok ? r.json() : null; }),
    fetch('data/od-regional.json').then(function (r) { return r.ok ? r.json() : null; })
  ]).then(function (res) {
    const geo = res[0], od = res[1];
    if (!geo || !od) { console.warn('choropleth data tidak tersedia'); return; }
    choroplethData = {};
    od.forEach(function (x) { choroplethData[x.kabkot] = x; });
    choroplethMax.bangkitan = Math.max.apply(null, od.map(function (x) { return x.bangkitan; })) || 1;
    choroplethMax.tarikan = Math.max.apply(null, od.map(function (x) { return x.tarikan; })) || 1;
    choroplethLayer = L.geoJSON(geo, { style: choroplethStyle, onEachFeature: choroplethOnEach });
    if (legendState.choropleth !== false) choroplethLayer.addTo(map);
    choroplethLayer.bringToBack();
  }).catch(function (e) { console.error('choropleth load:', e); });
}
function choroplethStyle(f) {
  const nm = (f.properties && f.properties.KABKOT) || '';
  const d = choroplethData[nm];
  const v = d ? (Number(d[choroplethMetric]) || 0) : 0;
  if (v <= 0) return { fillColor: '#94a3b8', fillOpacity: 0.1, weight: 0.5, opacity: 0.65, color: '#ef4444' };
  return { fillColor: choroplethColor(v), weight: 1, opacity: 0.65, color: '#ef4444', fillOpacity: 0.72 };
}
function choroplethColor(v) {
  const t = Math.min(1, v / (choroplethMax[choroplethMetric] || 1));
  const g = Math.round(240 - t * 190), b = Math.round(90 - t * 60);
  return 'rgb(255,' + g + ',' + b + ')';
}
function choroplethOnEach(f, layer) {
  const nm = (f.properties && f.properties.KABKOT) || '';
  layer.on('mouseover', function () {
    const d = choroplethData[nm] || {};
    const v = Number(d[choroplethMetric]) || 0;
    layer.setStyle(v > 0 ? { fillOpacity: 1, weight: 2 } : { fillColor: '#cbd5e1', fillOpacity: 0.75, weight: 2 });
    layer.bindTooltip('<strong>' + nm + '</strong><br>Bangkitan: ' + (Number(d.bangkitan) || 0).toLocaleString('id-ID') + '<br>Tarikan: ' + (Number(d.tarikan) || 0).toLocaleString('id-ID'), { sticky: true }).openTooltip();
  });
  layer.on('mouseout', function () { if (choroplethLayer) choroplethLayer.resetStyle(layer); });
}
function terapkanChoropleth() { if (!choroplethLayer) return; choroplethLayer.eachLayer(function (l) { l.setStyle(choroplethStyle(l.feature)); }); }
function setChoroplethMetric(m) { choroplethMetric = (m === 'tarikan') ? 'tarikan' : 'bangkitan'; terapkanChoropleth(); }

function getBasemapUrl() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
}
function inisialisasiTema() {
  let t = null;
  try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
  terapkanTema(t === 'dark' ? 'dark' : 'light');
}
function terapkanTema(tema) {
  const root = document.documentElement;
  if (tema === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  const btn = document.getElementById('btnTheme');
  if (btn) btn.innerHTML = (tema === 'dark' ? SVG_SUN : SVG_MOON);
  if (basemapLayer) basemapLayer.setUrl(getBasemapUrl());
  try { localStorage.setItem(THEME_KEY, tema); } catch (e) {}
}

// ============================================================
//  POTRET ANGKUTAN — data dari PPT / sumber BPTD Kelas I Jawa Barat
//  5 bidang: Barang, Pariwisata, Perintis, AJAP/AJDP, Analisis AKAP/AKDP
// ============================================================
const POTRET_LOKASI = {
  kabupaten: {
    'Bandung Raya': [-6.92, 107.60], 'Bekasi': [-6.24, 107.00], 'Bogor': [-6.60, 106.80],
    'Ciamis': [-7.33, 108.35], 'Cianjur': [-6.82, 107.14], 'Cirebon': [-6.72, 108.56],
    'Indramayu': [-6.33, 108.32], 'Karawang': [-6.30, 107.30], 'Depok': [-6.40, 106.82],
    'Tasikmalaya': [-7.33, 108.22], 'Kuningan': [-6.98, 108.48], 'Majalengka': [-6.85, 108.23],
    'Purwakarta': [-6.55, 107.45], 'Subang': [-6.57, 107.76], 'Sukabumi': [-6.92, 106.93],
    'Garut': [-7.22, 107.90], 'Sumedang': [-6.86, 107.92]
  },
  uppkb: {
    'Balonggandu': [-6.37733, 107.51488], 'Losarang': [-6.38535, 108.14003], 'Tomo': [-6.76096, 108.14228],
    'Kemang': [-6.51892, 106.75827], 'Gentong': [-7.11956, 108.13575], 'Cibaragalan': [-6.50387, 107.46548]
  },
  trayek: {
    'Surade': [-7.30, 106.55], 'Sagaranteun': [-7.22, 106.85], 'Pelabuhan Ratu': [-6.98, 106.55],
    'Tegal Buleud': [-7.15, 106.62], 'Leuwiliang': [-6.55, 106.60], 'Cikidang': [-6.85, 106.47],
    'Jasinga': [-6.47, 106.42], 'Parung Panjang': [-6.35, 106.38], 'Sadang': [-6.80, 107.20],
    'Wanakerta': [-6.28, 107.30]
  },
  terminal: {
    'Jatijajar': [-6.38, 106.85], 'Klari': [-6.29, 107.37], 'Subang': [-6.57, 107.76],
    'Banjar': [-7.37, 108.54], 'Leuwipanjang': [-6.93, 107.58], 'Sukabumi': [-6.92, 106.93],
    'Garut': [-7.22, 107.90]
  }
};

// Data default Potret Angkutan (fallback untuk render KPI/insight/grafik/peta).
// Data utama yang dapat diedit disimpan sebagai TABEL di sheet khusus tiap bidang
// (lihat getPotretRows/savePotretRows di Code.gs), bukan sebagai JSON utuh.
const POTRET_DEFAULT = {
  barang: {
    meta: { title: 'Angkutan Barang', icon: '🚚', color: '#f59e0b', desc: 'Pengawasan muatan & penindakan di 6 UPPKB se-Jawa Barat (perbandingan 2024 vs 2025) · Sumber: Potret Angkutan Barang (Feb 2026)' },
    kpi: [
      { icon: '🏢', label: 'Perusahaan Terdaftar', value: 154, color: '#f59e0b' },
      { icon: '👤', label: 'Pemilik Perorangan', value: 95, color: '#f59e0b' },
      { icon: '🛃', label: 'Kendaraan Diperiksa 2025', value: 194392, color: '#3b82f6' },
      { icon: '⚠️', label: 'Total Pelanggaran 2025', value: 16308, color: '#ef4444' }
    ],
    insights: [
      'Penurunan volume pemeriksaan di hampir semua UPPKB (kecuali Cibaragalan ▲116%).',
      'Total pelanggaran turun drastis, Gentong ▼79% dan Losarang ▼47%.',
      'Kelebihan muatan >5% dari JBI → tilang & dilarang meneruskan perjalanan.'
    ],
    charts: [
      { title: 'Perusahaan & Pemilik Perorangan per Daerah', type: 'bar', labels: ['Bekasi', 'Bandung', 'Cirebon', 'Tasikmalaya', 'Bogor', 'Sukabumi', 'Depok'], datasets: [
        { label: 'Perusahaan', data: [76, 33, 25, 9, 7, 3, 1], color: '#f59e0b' },
        { label: 'Perorangan', data: [34, 27, 27, 3, 1, 1, 1], color: '#94a3b8' }
      ] },
      { title: 'Kendaraan Diperiksa per UPPKB (2024 vs 2025)', type: 'bar', labels: ['Balonggandu', 'Losarang', 'Tomo', 'Kemang', 'Gentong', 'Cibaragalan'], datasets: [
        { label: '2024', data: [56965, 42468, 44889, 51265, 42157, 8865], color: '#94a3b8' },
        { label: '2025', data: [39623, 39194, 35550, 39756, 21034, 19235], color: '#f59e0b' }
      ] },
      { title: 'Pelanggaran per UPPKB (2024 vs 2025)', type: 'bar', labels: ['Balonggandu', 'Losarang', 'Tomo', 'Kemang', 'Gentong', 'Cibaragalan'], datasets: [
        { label: '2024', data: [6052, 10372, 2461, 3752, 4374, 640], color: '#94a3b8' },
        { label: '2025', data: [5900, 5470, 1253, 1993, 909, 783], color: '#ef4444' }
      ] }
    ],
    table: {
      title: 'Produksi UPPKB 2025',
      columns: ['UPPKB', 'Diperiksa', 'Pelanggaran', 'Peringatan', 'Transfer', 'Tilang', 'Tilang Lain', 'Tilang Polisi'],
      rows: [
        ['Balonggandu', 39623, 5900, 22, 32, 2384, 3107, 427],
        ['Losarang', 39194, 5470, 3263, 7, 869, 1083, 271],
        ['Tomo', 35550, 1253, 542, 0, 708, 0, 0],
        ['Kemang', 39756, 1993, 623, 14, 1137, 218, 0],
        ['Gentong', 21034, 909, 5, 0, 898, 11, 0],
        ['Cibaragalan', 19235, 783, 190, 0, 567, 22, 0]
      ]
    },
    map: {
      title: 'Lokasi UPPKB se-Jawa Barat (perkiraan)',
      mode: 'marker',
      color: '#f59e0b',
      items: [
        { label: 'Balonggandu', sub: 'Indramayu', val: '39.623 diperiksa' },
        { label: 'Losarang', sub: 'Indramayu', val: '39.194 diperiksa' },
        { label: 'Tomo', sub: 'Sumedang', val: '35.550 diperiksa' },
        { label: 'Kemang', sub: 'Bogor', val: '39.756 diperiksa' },
        { label: 'Gentong', sub: 'Cirebon', val: '21.034 diperiksa' },
        { label: 'Cibaragalan', sub: 'Bandung', val: '19.235 diperiksa' }
      ]
    }
  },
  pariwisata: {
    meta: { title: 'Angkutan Pariwisata', icon: '🚌', color: '#10b981', desc: 'Perusahaan & armada angkutan pariwisata se-Jawa Barat + hasil rampcheck · Sumber: Potret Angkutan Pariwisata' },
    kpi: [
      { icon: '🏢', label: 'Perusahaan (SPIONAM)', value: 215, color: '#10b981' },
      { icon: '✅', label: 'Sudah Rampcheck (PO)', value: 139, color: '#10b981' },
      { icon: '🚌', label: 'Armada (SPIONAM)', value: 3379, color: '#10b981' },
      { icon: '🛠️', label: 'Armada Dirackcheck', value: 1211, color: '#10b981' }
    ],
    insights: [
      'Bandung Raya pusat perusahaan pariwisata (92 perusahaan, 154 armada dirackcheck).',
      'Majalengka: 283 armada terdata namun hanya 21 laik — mayoritas di tempat lain/dijual.',
      'Selisih data SPIONAM vs rampcheck armada: 36% (3.379 → 1.211 unit).'
    ],
    charts: [
      { title: 'Perusahaan Pariwisata per Kabupaten/Kota', type: 'bar', labels: ['Bandung Raya', 'Bekasi', 'Bogor', 'Ciamis', 'Indramayu', 'Cirebon', 'Majalengka', 'Cianjur', 'Depok', 'Tasikmalaya', 'Karawang', 'Kuningan', 'Subang', 'Purwakarta', 'Sukabumi'], datasets: [
        { label: 'Perusahaan', data: [92, 49, 27, 23, 21, 15, 12, 11, 9, 7, 7, 6, 4, 3, 3], color: '#10b981' }
      ] },
      { title: 'Status Rampcheck Armada (2025)', type: 'doughnut', labels: ['Laik', 'Tidak Laik', 'Beroperasi', 'Di Tempat Lain'], datasets: [
        { data: [279, 178, 263, 491], colors: ['#10b981', '#ef4444', '#3b82f6', '#94a3b8'] }
      ] },
      { title: 'Armada Laik vs Tidak Laik per Wilayah', type: 'bar', labels: ['Bandung Raya', 'Majalengka', 'Bogor', 'Indramayu', 'Cianjur', 'Cirebon', 'Sukabumi', 'Subang', 'Tasikmalaya', 'Garut', 'Ciamis', 'Sumedang', 'Purwakarta', 'Kuningan', 'Karawang', 'Bekasi Depok'], datasets: [
        { label: 'Laik', data: [49, 21, 11, 39, 17, 19, 17, 33, 12, 7, 15, 5, 5, 14, 10, 5], color: '#10b981' },
        { label: 'Tidak Laik', data: [69, 9, 7, 10, 6, 12, 3, 1, 36, 18, 2, 2, 2, 1, 0, 0], color: '#ef4444' }
      ] }
    ],
    table: {
      title: 'Hasil Rampcheck per Wilayah (per Mei 2024)',
      columns: ['Wilayah', 'PO', 'Armada', 'Laik', 'Tidak Laik', 'Beroperasi', 'Di Tempat Lain'],
      rows: [
        ['Bandung Raya', 28, 154, 49, 69, 0, 36],
        ['Majalengka', 10, 283, 21, 9, 69, 184],
        ['Bogor', 12, 179, 11, 7, 120, 41],
        ['Karawang', 5, 112, 10, 0, 29, 73],
        ['Cirebon', 11, 89, 19, 12, 0, 58],
        ['Cianjur', 5, 53, 17, 6, 0, 30],
        ['Indramayu', 16, 52, 39, 10, 0, 3],
        ['Tasikmalaya', 18, 48, 12, 36, 0, 0],
        ['Subang', 3, 48, 33, 1, 4, 10],
        ['Garut', 4, 45, 7, 18, 13, 7],
        ['Sumedang', 5, 37, 5, 2, 14, 16],
        ['Purwakarta', 5, 32, 5, 2, 10, 15],
        ['Sukabumi', 3, 25, 17, 3, 4, 1],
        ['Ciamis', 4, 21, 15, 2, 0, 4],
        ['Kuningan', 5, 15, 14, 1, 0, 0],
        ['Bekasi Depok', 5, 18, 5, 0, 0, 13]
      ]
    },
    map: {
      title: 'Perusahaan Pariwisata per Kabupaten (ukuran = jumlah perusahaan)',
      mode: 'bubble',
      color: '#10b981',
      key: 'kabupaten',
      items: [
        { label: 'Bandung Raya', val: 92 }, { label: 'Bekasi', val: 49 }, { label: 'Bogor', val: 27 },
        { label: 'Ciamis', val: 23 }, { label: 'Indramayu', val: 21 }, { label: 'Cirebon', val: 15 },
        { label: 'Majalengka', val: 12 }, { label: 'Cianjur', val: 11 }, { label: 'Depok', val: 9 },
        { label: 'Tasikmalaya', val: 7 }, { label: 'Karawang', val: 7 }, { label: 'Kuningan', val: 6 },
        { label: 'Subang', val: 4 }, { label: 'Purwakarta', val: 3 }, { label: 'Sukabumi', val: 3 }
      ]
    }
  },
  perintis: {
    meta: { title: 'Angkutan Perintis', icon: '🚐', color: '#8b5cf6', desc: '6 trayek angkutan perintis bersubsidi se-Jawa Barat (realisasi 2026) · Sumber: Potret Angkutan Keperintisan' },
    kpi: [
      { icon: '🛣️', label: 'Trayek Perintis', value: 6, color: '#8b5cf6' },
      { icon: '📏', label: 'Total Jarak', value: '612 km', color: '#8b5cf6' },
      { icon: '👥', label: 'Penumpang 2026', value: '6.689', suffix: '(Jan–Jun)', color: '#3b82f6' },
      { icon: '💸', label: 'Realisasi Anggaran', value: 'Rp1,69 M', suffix: '(33,6%)', color: '#10b981' }
    ],
    insights: [
      'Produksi penumpang 2026 turun 53% dibanding 2025 (6.689 vs 14.745 orang, Jan–Jun).',
      'Load factor terbaik: Jasinga–Parung Panjang (14,2%); terendah: Sadang–Wanakerta (0%).',
      'Kendala: sparepart, BBM subsidi terbatas, umur armada >10 tahun, & portal penghalang trayek Sadang.'
    ],
    charts: [
      { title: 'Realisasi Anggaran 2026 per Trayek (juta Rp)', type: 'bar', labels: ['Leuwiliang–Cikidang', 'Surade–Sagaranteun', 'Tegal Buled–Sagntn', 'Sagaranteun–Pel. Ratu', 'Jasinga–Parung', 'Sadang–Wanakerta'], datasets: [
        { label: 'Realisasi (jt)', data: [383, 375, 375, 121, 254, 186], color: '#8b5cf6' }
      ] },
      { title: 'Load Factor per Trayek (%)', type: 'bar', labels: ['Jasinga–Parung', 'Sagntn–Pel. Ratu', 'Surade–Sagntn', 'Leuwiliang–Cikidang', 'Tegal Buled–Sagntn', 'Sadang–Wanakerta'], datasets: [
        { label: 'Load Factor %', data: [14.2, 6.8, 6.3, 5.0, 4.3, 0], color: '#06b6d4' }
      ] },
      { title: 'Produksi Penumpang per Tahun', type: 'bar', labels: ['2025', '2026 (Jan–Jun)'], datasets: [
        { label: 'Penumpang (orang)', data: [14745, 6689], color: '#8b5cf6' },
        { label: 'Ritase', data: [4655, 2760], color: '#94a3b8' }
      ] }
    ],
    table: {
      title: 'Trayek & Realisasi 2026',
      columns: ['Trayek', 'Jarak km', 'Renc. Ritase', 'Besaran Subsidi', 'Realisasi (sd. Jun)'],
      rows: [
        ['Surade – Sagaranteun', 116, 1336, 'Rp1,06 M', 'Rp375,3 jt'],
        ['Sagaranteun – Pelabuhan Ratu', 158, 334, 'Rp406,2 jt', 'Rp121,5 jt'],
        ['Tegal Buled – Sagaranteun', 122, 1336, 'Rp1,09 M', 'Rp374,5 jt'],
        ['Leuwiliang – Cikidang', 130, 1336, 'Rp1,14 M', 'Rp383,4 jt'],
        ['Jasinga – Parung Panjang', 66, 1336, 'Rp771,9 jt', 'Rp254,2 jt'],
        ['Sadang – Wanakerta', 20, 2004, 'Rp572,6 jt', 'Rp185,9 jt']
      ]
    },
    map: {
      title: 'Peta Trayek Perintis (garis = trayek)',
      mode: 'route',
      color: '#8b5cf6',
      routes: [
        { nama: 'Surade – Sagaranteun', pts: ['Surade', 'Sagaranteun'] },
        { nama: 'Sagaranteun – Pelabuhan Ratu', pts: ['Sagaranteun', 'Pelabuhan Ratu'] },
        { nama: 'Tegal Buleud – Sagaranteun', pts: ['Tegal Buleud', 'Sagaranteun'] },
        { nama: 'Leuwiliang – Cikidang', pts: ['Leuwiliang', 'Cikidang'] },
        { nama: 'Jasinga – Parung Panjang', pts: ['Jasinga', 'Parung Panjang'] },
        { nama: 'Sadang – Wanakerta', pts: ['Sadang', 'Wanakerta'] }
      ]
    }
  },
  ajap: {
    meta: { title: 'AJAP / AJDP', icon: '🚗', color: '#06b6d4', desc: 'Angkutan Antar Jemput Antar Provinsi (AJAP) & Dalam Provinsi (AJDP) — proses perizinan & pengawasan · Sumber: Potret Angkutan AJAP' },
    kpi: [
      { icon: '📋', label: 'Tahap Perizinan (OSS)', value: 8, color: '#06b6d4' },
      { icon: '📜', label: 'Dasar Hukum', value: 9, suffix: 'regulasi', color: '#06b6d4' },
      { icon: '🔍', label: 'Inspeksi Rampcheck', value: 'Aktif', suffix: '· Libur Sekolah 2026', color: '#06b6d4' }
    ],
    insights: [
      'Perizinan AJAP/AJDP terpusat via OSS (Online Single Submission).',
      'Pengawasan kendaraan AJAP & Pariwisata sesuai Surat Dirjen Angkutan Jalan No. AJ.003/17/10/AJ/2025.',
      'Sosialisasi SPM & teguran untuk perusahaan yang mengganggu arus lalu lintas.'
    ],
    charts: [],
    table: {
      title: 'Alur Perizinan Angkutan Orang Tidak Dalam Trayek (OSS)',
      columns: ['#', 'Langkah'],
      rows: [
        [1, 'Pemohon mengajukan permohonan berusaha secara elektronik (OSS)'],
        [2, 'Petugas verifikasi kelengkapan & keabsahan persyaratan administrasi'],
        [3, 'Petugas verifikasi persyaratan teknis'],
        [4, 'DPMPTSP menerima & menindaklanjuti pengaduan layanan jika tidak ada kesesuaian'],
        [5, 'Pejabat berwenang menerbitkan izin penyelenggaraan angkutan orang tidak dalam trayek'],
        [6, 'Izin yang terbit diserahkan kepada pemohon melalui OSS'],
        [7, 'Setelah terbit, perizinan dipantau melalui sistem elektronik'],
        [8, 'DPMPTSP berkoordinasi dengan perangkat daerah/instansi terkait aspek tertentu']
      ]
    },
    map: null
  },
  akap: {
    meta: { title: 'Analisis AKAP / AKDP', icon: '📊', color: '#ef4444', desc: 'Kinerja antar-terminal AKAP & AKDP se-Jawa Barat — rasio, okupansi, kuadran kinerja · Sumber: Analisis Tambahan BPTD Jabar (YTD s.d. 20 Apr 2026)' },
    kpi: [
      { icon: '🏆', label: 'Okupansi Tertinggi', value: 'Leuwipanjang', suffix: '· Sukabumi · Garut', color: '#10b981' },
      { icon: '🔻', label: 'Okupansi Terendah', value: 'Jatijajar', suffix: '· Banjar', color: '#ef4444' },
      { icon: '🟣', label: 'Dominan AKAP', value: 'Jatijajar', suffix: '· Klari', color: '#8b5cf6' },
      { icon: '🟢', label: 'Dominan AKDP', value: 'Subang', suffix: '· Banjar', color: '#10b981' }
    ],
    insights: [
      'Jatijajar & Klari nyaris murni AKAP — basis Jabodetabek, mayoritas tujuan lintas provinsi.',
      'Subang & Banjar dominan AKDP — simpul regional dalam provinsi.',
      'Leuwipanjang, Sukabumi & Garut paling efisien (armada sedikit, penumpang banyak) — potensi kekurangan kapasitas.',
      'Jatijajar paling ekstrem di kuadran merah — anomali pencatatan, perlu verifikasi lapangan.'
    ],
    charts: [],
    table: {
      title: 'Klasifikasi Terminal (analisis BPTD Jabar)',
      columns: ['Terminal', 'Karakter', 'Insight'],
      rows: [
        ['Jatijajar', 'Dominan AKAP · okupansi rendah', 'Basis Jabodetabek; anomali pencatatan → verifikasi'],
        ['Klari', 'Dominan AKAP', 'Mayoritas tujuan lintas provinsi'],
        ['Leuwipanjang', 'Okupansi tinggi', 'Armada sedikit, penumpang banyak → potensi kurang kapasitas'],
        ['Sukabumi', 'Okupansi tinggi', 'Efisiensi pemakaian armada baik'],
        ['Garut', 'Okupansi tinggi', 'Efisiensi pemakaian armada baik'],
        ['Subang', 'Dominan AKDP', 'Simpul regional dalam provinsi → domain kebijakan provinsi'],
        ['Banjar', 'Dominan AKDP · okupansi rendah', 'Perlu ditelusuri; kendaraan tinggi tapi penumpang sedikit']
      ]
    },
    map: {
      title: 'Terminal yang Dianalisis',
      mode: 'marker',
      color: '#ef4444',
      key: 'terminal',
      items: [
        { label: 'Leuwipanjang', sub: 'Okupansi tinggi' },
        { label: 'Sukabumi', sub: 'Okupansi tinggi' },
        { label: 'Garut', sub: 'Okupansi tinggi' },
        { label: 'Jatijajar', sub: 'Dominan AKAP · okupansi rendah' },
        { label: 'Klari', sub: 'Dominan AKAP' },
        { label: 'Subang', sub: 'Dominan AKDP' },
        { label: 'Banjar', sub: 'Dominan AKDP' }
      ]
    }
  }
};

// ---- State & helpers render Potret ----
let potretCharts = [];
let potretMap = null;
// Data potret yang sedang aktif (bisa diubah user). key = id bidang (barang, pariwisata, ...).
let potretData = {};
let potretIdAktif = null;
// Tabel data potret dari SHEET khusus bidang (baris = entri). key = id bidang.
let potRows = {};
let potretCols = {};
let potretEditRows = []; // salinan kerja saat editor tabel dibuka
// Skema kolom per bidang — harus MIRIP dengan POTRET_SCHEMA di Code.gs. Dipakai
// sebagai fallback sebelum data sheet termuat (atau bila load gagal).
const POTRET_COLS_FALLBACK = {
  barang: [
    { key: 'uppkb', label: 'UPPKB' },
    { key: 'kabupaten', label: 'Kabupaten/Kota' },
    { key: 'diperiksa', label: 'Kendaraan Diperiksa' },
    { key: 'pelanggaran', label: 'Pelanggaran' },
    { key: 'peringatan', label: 'Peringatan' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'tilang', label: 'Tilang' },
    { key: 'tilang_lain', label: 'Tilang Lain' },
    { key: 'tilang_polisi', label: 'Tilang Polisi' }
  ],
  pariwisata: [
    { key: 'wilayah', label: 'Wilayah/Kabupaten' },
    { key: 'po', label: 'Perusahaan (PO)' },
    { key: 'armada', label: 'Jumlah Armada' },
    { key: 'laik', label: 'Laik' },
    { key: 'tidak_laik', label: 'Tidak Laik' },
    { key: 'beroperasi', label: 'Beroperasi' },
    { key: 'di_tempat_lain', label: 'Di Tempat Lain' }
  ],
  perintis: [
    { key: 'trayek', label: 'Trayek' },
    { key: 'jarak', label: 'Jarak (km)' },
    { key: 'ritase', label: 'Rencana Ritase' },
    { key: 'subsidi', label: 'Besaran Subsidi' },
    { key: 'realisasi', label: 'Realisasi (sd. Jun)' }
  ],
  ajap: [
    { key: 'perusahaan', label: 'Perusahaan' },
    { key: 'jenis', label: 'Jenis Izin (AJAP/AJDP)' },
    { key: 'jumlah', label: 'Jumlah Kendaraan' },
    { key: 'wilayah', label: 'Wilayah/Trayek' },
    { key: 'status', label: 'Status' },
    { key: 'keterangan', label: 'Keterangan' }
  ],
  akap: [
    { key: 'terminal', label: 'Terminal' },
    { key: 'karakter', label: 'Karakter (AKAP/AKDP)' },
    { key: 'okupansi', label: 'Status Okupansi' },
    { key: 'insight', label: 'Keterangan/Insight' }
  ],
  _default: [
    { key: 'nama', label: 'Nama' },
    { key: 'jumlah', label: 'Jumlah Armada' },
    { key: 'satuan', label: 'Satuan/Jenis' },
    { key: 'kondisi', label: 'Kondisi' },
    { key: 'trayek', label: 'Trayek' },
    { key: 'status', label: 'Status' },
    { key: 'keterangan', label: 'Keterangan' }
  ]
};

function fmtPotret(n) {
  if (typeof n === 'string') return n;
  if (n === null || n === undefined || isNaN(n)) return '-';
  return n.toLocaleString('id-ID');
}
function buatChartPotret(canvas, spec) {
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: spec.type === 'doughnut' ? { position: 'right', labels: { usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 11 } } } : { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11 } } },
      tooltip: { callbacks: { label: function (ctx) { var lbl = (ctx.dataset && ctx.dataset.label) ? ctx.dataset.label : (ctx.label || ''); return ' ' + lbl + ': ' + fmtPotret(ctx.raw); } } }
    },
    scales: spec.type === 'doughnut' ? undefined : {
      y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { callback: function (v) { return fmtPotret(v); } } },
      x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
    }
  };
  if (spec.type === 'doughnut') {
    const ds = spec.datasets[0];
    return new Chart(canvas, { type: 'doughnut', data: { labels: spec.labels, datasets: [{ data: ds.data, backgroundColor: ds.colors, borderWidth: 0, hoverOffset: 6 }] }, options: opts });
  }
  return new Chart(canvas, {
    type: spec.type,
    data: { labels: spec.labels, datasets: spec.datasets.map(ds => ({
      label: ds.label, data: ds.data,
      backgroundColor: ds.color + '88', borderColor: ds.color, borderWidth: 2,
      tension: 0.35, fill: false
    })) },
    options: opts
  });
}

function renderPotretKPI(kpis, color) {
  const row = document.createElement('div');
  row.className = 'potret-kpis';
  kpis.forEach(k => {
    const d = document.createElement('div');
    d.className = 'potret-kpi';
    d.style.setProperty('--potret-color', k.color || color);
    d.innerHTML = '<div class="potret-kpi-ico">' + k.icon + '</div><div class="potret-kpi-val">' + fmtPotret(k.value) + '</div><div class="potret-kpi-label">' + k.label + (k.suffix ? ' <small>' + k.suffix + '</small>' : '') + '</div>';
    row.appendChild(d);
  });
  return row;
}
function renderPotretInsights(items) {
  const sec = document.createElement('div');
  sec.className = 'card potret-insights';
  sec.innerHTML = '<h3 class="card-title">💡 Insight</h3>';
  const ul = document.createElement('ul');
  items.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  sec.appendChild(ul);
  return sec;
}
function renderPotretCharts(charts) {
  const wrap = document.createElement('div');
  wrap.className = 'potret-charts';
  charts.forEach((spec, i) => {
    const card = document.createElement('div');
    card.className = 'card potret-chart-card';
    card.innerHTML = '<h3 class="card-title">' + spec.title + '</h3><div class="potret-chart-wrap"><canvas id="potretCanvas_' + i + '"></canvas></div>';
    wrap.appendChild(card);
  });
  return wrap;
}
function renderPotretTable(tbl) {
  const sec = document.createElement('div');
  sec.className = 'card potret-table-card';
  sec.innerHTML = '<h3 class="card-title">' + tbl.title + '</h3><div class="table-wrap"><table><thead><tr>' + tbl.columns.map(c => '<th' + (/^[\d#]/.test(c) ? ' class="num"' : '') + '>' + c + '</th>').join('') + '</tr></thead><tbody>' +
    tbl.rows.map(r => '<tr>' + r.map((cell, ci) => '<td' + (ci > 0 && typeof cell === 'number' ? ' class="num"' : '') + '>' + fmtPotret(cell) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
  return sec;
}
function initPotretMap(mapSpec) {
  const sec = document.createElement('div');
  sec.className = 'card potret-map-card';
  sec.innerHTML = '<h3 class="card-title">🗺️ ' + mapSpec.title + '</h3><div id="potretMapDiv" class="potret-map"></div>';
  document.getElementById('potretBody').appendChild(sec);
  const div = document.getElementById('potretMapDiv');
  potretMap = L.map(div, { zoomControl: false }).setView([-6.9, 107.6], 8);
  L.tileLayer(getBasemapUrl(), { maxZoom: 19, subdomains: 'abcd' }).addTo(potretMap);
  L.control.zoom({ position: 'bottomright' }).addTo(potretMap);
  const color = mapSpec.color || '#3b82f6';
  const bounds = [];
  if (mapSpec.mode === 'route') {
    mapSpec.routes.forEach(r => {
      const pts = r.pts.map(t => POTRET_LOKASI.trayek[t]).filter(Boolean);
      if (pts.length < 2) return;
      L.polyline(pts, { color: color, weight: 4, opacity: 0.85, dashArray: '6 6' }).addTo(potretMap).bindPopup('<b>' + r.nama + '</b>');
      pts.forEach((pt, i) => {
        bounds.push(pt);
        L.circleMarker(pt, { radius: 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(potretMap)
          .bindTooltip(r.pts[i], { direction: 'top' });
      });
    });
  } else if (mapSpec.mode === 'bubble') {
    const maxV = Math.max.apply(null, mapSpec.items.map(it => it.val));
    mapSpec.items.forEach(it => {
      const loc = POTRET_LOKASI[mapSpec.key || 'kabupaten'][it.label];
      if (!loc) return;
      bounds.push(loc);
      const r = Math.max(6, Math.round(Math.sqrt(it.val / maxV) * 34));
      L.circleMarker(loc, { radius: r, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.75 })
        .addTo(potretMap)
        .bindPopup('<b>' + it.label + '</b><br>' + it.val + ' perusahaan');
    });
  } else {
    (mapSpec.items || []).forEach(it => {
      const loc = POTRET_LOKASI[mapSpec.key || 'uppkb'][it.label];
      if (!loc) return;
      bounds.push(loc);
      L.marker(loc, { icon: buatIconTerminal(color, ICON_BUS_SVG, 34) })
        .addTo(potretMap)
        .bindPopup('<b>' + it.label + '</b>' + (it.sub ? '<br>' + it.sub : '') + (it.val ? '<br><b>' + it.val + '</b>' : ''));
    });
  }
  if (bounds.length) potretMap.fitBounds(bounds, { padding: [40, 40] });
  setTimeout(function () { if (potretMap) potretMap.invalidateSize(); }, 120);
}

// Render LIVE Potret Angkutan Barang dari data sinkronisasi (potRows['barang']).
// KPI + grafik batang per UPPKB + peta UPPKB memakai koordinat yang sudah ada.
function renderBarangLive(body) {
  const rows = potRows['barang'] || [];
  if (!rows.length) return false;
  const tot = rows.reduce(function (a, r) {
    a.diperiksa += Number(r.diperiksa) || 0;
    a.pelanggaran += Number(r.pelanggaran) || 0;
    a.tilang += (Number(r.tilang) || 0) + (Number(r.tilang_lain) || 0) + (Number(r.tilang_polisi) || 0);
    a.peringatan += Number(r.peringatan) || 0;
    return a;
  }, { diperiksa: 0, pelanggaran: 0, tilang: 0, peringatan: 0 });
  const pct = tot.diperiksa > 0 ? (tot.pelanggaran / tot.diperiksa * 100) : 0;

  body.appendChild(renderPotretKPI([
    { icon: '🚛', label: 'Kendaraan Diperiksa', value: tot.diperiksa },
    { icon: '⚠️', label: 'Total Pelanggaran', value: tot.pelanggaran },
    { icon: '📊', label: '% Pelanggaran', value: pct.toFixed(1), suffix: '%' },
    { icon: '🛑', label: 'Total Tilang', value: tot.tilang }
  ], '#f59e0b'));

  const barCard = document.createElement('div');
  barCard.className = 'card potret-chart-card';
  barCard.innerHTML = '<h3 class="card-title">Diperiksa vs Pelanggaran per UPPKB</h3><div class="potret-chart-wrap"><canvas id="barangChart"></canvas></div>';
  body.appendChild(barCard);
  const labels = rows.map(r => r.uppkb || r.nama || '-');
  potretCharts.push(new Chart(document.getElementById('barangChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Diperiksa', data: rows.map(r => Number(r.diperiksa) || 0), backgroundColor: '#3b82f6' },
        { label: 'Pelanggaran', data: rows.map(r => Number(r.pelanggaran) || 0), backgroundColor: '#ef4444' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + formatAngka(c.raw); } } }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { callback: function (v) { return formatSingkat(v); } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  }));

  // Map UPPKB (koordinat yang sudah ada), ukuran bubble = jumlah diperiksa
  const maxV = Math.max.apply(null, rows.map(r => Number(r.diperiksa) || 0)) || 1;
  const sec = document.createElement('div');
  sec.className = 'card potret-map-card';
  sec.innerHTML = '<h3 class="card-title">🗺️ Lokasi UPPKB</h3><div id="potretMapDiv" class="potret-map"></div>';
  body.appendChild(sec);
  const div = document.getElementById('potretMapDiv');
  potretMap = L.map(div, { zoomControl: false }).setView([-6.9, 107.6], 8);
  L.tileLayer(getBasemapUrl(), { maxZoom: 19, subdomains: 'abcd' }).addTo(potretMap);
  L.control.zoom({ position: 'bottomright' }).addTo(potretMap);
  const bounds = [];
  rows.forEach(function (row) {
    const nm = String(row.uppkb || '').trim();
    let loc = null;
    if (row.lat && row.lng) loc = [Number(row.lat), Number(row.lng)];
    else { const key = nm.charAt(0).toUpperCase() + nm.slice(1).toLowerCase(); loc = POTRET_LOKASI.uppkb[key]; }
    if (!loc) return;
    bounds.push(loc);
    const v = Number(row.diperiksa) || 0;
    const radius = Math.max(6, Math.round(Math.sqrt(v / maxV) * 34));
    L.circleMarker(loc, { radius: radius, color: '#fff', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.75 })
      .addTo(potretMap)
      .bindPopup('<b>' + nm + '</b><br>' + (row.kabupaten || '') + '<br><b>' + formatAngka(v) + '</b> diperiksa');
  });
  if (bounds.length) potretMap.fitBounds(bounds, { padding: [40, 40] });
  setTimeout(function () { if (potretMap) potretMap.invalidateSize(); }, 120);
  return true;
}

// Render metadata grafik Potret Barang: tren bulanan (Jan-Des) + doughnut jenis pelanggaran.
function renderBarangMeta(body, meta) {
  if (!body || !meta) return;
  const tren = meta.tren || [];
  const pel = meta.pelanggaran || [];

  if (tren.length) {
    const card = document.createElement('div');
    card.className = 'card potret-chart-card';
    card.innerHTML = '<h3 class="card-title">📈 Tren Bulanan Diperiksa & Pelanggaran</h3><div class="potret-chart-wrap"><canvas id="barangTrenChart"></canvas></div>';
    body.appendChild(card);
    potretCharts.push(new Chart(document.getElementById('barangTrenChart'), {
      type: 'line',
      data: {
        labels: tren.map(t => t.bulan),
        datasets: [
          { label: 'Diperiksa', data: tren.map(t => Number(t.diperiksa) || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 2.6, fill: true, tension: 0.4, pointRadius: 3, spanGaps: true },
          { label: 'Pelanggaran', data: tren.map(t => Number(t.pelanggaran) || 0), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 2.6, fill: true, tension: 0.4, pointRadius: 3, spanGaps: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + formatAngka(c.raw); } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { callback: function (v) { return formatSingkat(v); } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    }));
  }

  if (pel.length) {
    const totJ = pel.reduce(function (a, p) { return a + (Number(p.nilai) || 0); }, 0);
    if (totJ > 0) {
      const card = document.createElement('div');
      card.className = 'card potret-chart-card';
      card.innerHTML = '<h3 class="card-title">🍩 Proporsi Jenis Pelanggaran</h3><div class="potret-chart-wrap"><canvas id="barangPelChart"></canvas></div>';
      body.appendChild(card);
      potretCharts.push(new Chart(document.getElementById('barangPelChart'), {
        type: 'doughnut',
        data: {
          labels: pel.map(p => p.jenis),
          datasets: [{ data: pel.map(p => Number(p.nilai) || 0), backgroundColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'], borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '66%', animation: { duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11 } } },
            tooltip: { callbacks: { label: function (c) { const v = Number(c.raw) || 0; return ' ' + c.label + ': ' + formatAngka(v) + (totJ > 0 ? ' (' + ((v / totJ) * 100).toFixed(1) + '%)' : ''); } } }
          }
        }
      }));
    }
  }
}


// ============================================================
// DATASET ANGKUTAN PERINTIS 2025 (Sheet 'JABAR' Source)
// ============================================================
const PERINTIS_DATASET_2025 = {
  "title": "Progres Realisasi Layanan Angkutan Jalan Perintis 2025",
  "instansi": "BPTD Class I Jawa Barat",
  "tahun": 2025,
  "total_trayek": 6,
  "routes": [
    {
      "id": "PERINTIS-001",
      "no": 1,
      "name": "Surade - Sagaranten",
      "kabupaten": "Kab. Sukabumi",
      "operator": "Perum Damri Cab. Bandung",
      "pagu": 5479744000.0,
      "target_kontrak": 1013786489.0,
      "realisasi_keuangan_ytd": 864491991.0,
      "no_kontrak": "PL.107/050/BPTD-JABAR/V/2025",
      "tgl_mulai": "9 Mei 2025",
      "tgl_selesai": "31 Desember 2025",
      "ppk": "Hardika Pratama",
      "pencairan": "Perbulan",
      "armada": {
        "jumlah": 2,
        "cadangan": 1,
        "kapasitas": 19,
        "umur": "9 Tahun"
      },
      "summary_ytd": {
        "total_penumpang": 5251,
        "total_ritase": 888,
        "avg_load_factor": 0.3558
      },
      "geometry": {
        "origin_name": "Surade",
        "dest_name": "Sagaranten",
        "origin_coord": [
          -7.348,
          106.586
        ],
        "dest_coord": [
          -7.214,
          106.885
        ],
        "polyline": [
          [
            -7.348,
            106.586
          ],
          [
            -7.31,
            106.65
          ],
          [
            -7.26,
            106.77
          ],
          [
            -7.214,
            106.885
          ]
        ]
      },
      "monthly": {
        "Januari": {
          "keuangan": {
            "target": 55077575.0,
            "realisasi": 55077575.0
          },
          "ritase": {
            "target": 20,
            "realisasi": 20
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.8026
          },
          "penumpang": {
            "target": 380,
            "realisasi": 305
          },
          "keterangan": "Januari menggunakan skema Pengadaan Langsung untuk menghindari kekosongan pelayanan"
        },
        "Februari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Maret": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "April": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Mei": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 91608000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 92
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 524
          },
          "keterangan": "0.5549199085"
        },
        "Juni": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 87352000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 120
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 684
          },
          "keterangan": "0.5862573099"
        },
        "Juli": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 91397000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 108
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 615
          },
          "keterangan": "0.6351526966"
        },
        "Agustus": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 94087000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 108
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 615
          },
          "keterangan": "0.4532163743"
        },
        "September": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 111242604.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 110
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 627
          },
          "keterangan": "0.5789473684"
        },
        "Oktober": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 111242604.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 110
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 627
          },
          "keterangan": "0.4657097289"
        },
        "November": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 111242604.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 110
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 627
          },
          "keterangan": "0.4657097289"
        },
        "Desember": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 111242604.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 110
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 627
          },
          "keterangan": "0.639553429"
        }
      }
    },
    {
      "id": "PERINTIS-002",
      "no": 2,
      "name": "Sagaranten - Pelabuhan Ratu",
      "kabupaten": "Kab. Sukabumi",
      "operator": "Perum DAMRI Cab. Bandung",
      "pagu": 0.0,
      "target_kontrak": 754888453.0,
      "realisasi_keuangan_ytd": 681054587.0,
      "no_kontrak": "PL.107/052/BPTD-JABAR/V/2025",
      "tgl_mulai": "9 Mei 2025",
      "tgl_selesai": "31 Desember 2025",
      "ppk": "Hardika Pratama",
      "pencairan": "Perbulan",
      "armada": {
        "jumlah": 2,
        "cadangan": 1,
        "kapasitas": 19,
        "umur": "9 Tahun"
      },
      "summary_ytd": {
        "total_penumpang": 2735,
        "total_ritase": 482,
        "avg_load_factor": 0.2968
      },
      "geometry": {
        "origin_name": "Sagaranten",
        "dest_name": "Pelabuhan Ratu",
        "origin_coord": [
          -7.214,
          106.885
        ],
        "dest_coord": [
          -6.985,
          106.544
        ],
        "polyline": [
          [
            -7.214,
            106.885
          ],
          [
            -7.12,
            106.75
          ],
          [
            -7.02,
            106.62
          ],
          [
            -6.985,
            106.544
          ]
        ]
      },
      "monthly": {
        "Januari": {
          "keuangan": {
            "target": 53056775.0,
            "realisasi": 53056775.0
          },
          "ritase": {
            "target": 20,
            "realisasi": 20
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.2711
          },
          "penumpang": {
            "target": 380,
            "realisasi": 103
          },
          "keterangan": ""
        },
        "Februari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Maret": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "April": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Mei": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 82177000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 46
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 262
          },
          "keterangan": "0.03051106026"
        },
        "Juni": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 65172000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 342
          },
          "keterangan": "0.0730994152"
        },
        "Juli": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 62551000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 58
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 330
          },
          "keterangan": "0.07864488808"
        },
        "Agustus": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 62740000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 58
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 330
          },
          "keterangan": "0.09679370841"
        },
        "September": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 88839453.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 342
          },
          "keterangan": "0.1666666667"
        },
        "Oktober": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 88839453.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 342
          },
          "keterangan": "0.2251461988"
        },
        "November": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 88839453.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 342
          },
          "keterangan": "0.2251461988"
        },
        "Desember": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 88839453.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 342
          },
          "keterangan": "0.0730994152"
        }
      }
    },
    {
      "id": "PERINTIS-003",
      "no": 3,
      "name": "Tegal Buleud - Sagaranten",
      "kabupaten": "Kab. Sukabumi",
      "operator": "Perum DAMRI Cab. Bandung",
      "pagu": 0.0,
      "target_kontrak": 893366270.0,
      "realisasi_keuangan_ytd": 723443502.0,
      "no_kontrak": "PL.107/053/BPTD-JABAR/V/2025",
      "tgl_mulai": "9 Mei 2025",
      "tgl_selesai": "31 Desember 2025",
      "ppk": "Hardika Pratama",
      "pencairan": "Perbulan",
      "armada": {
        "jumlah": 2,
        "cadangan": 1,
        "kapasitas": 19,
        "umur": "9 Tahun"
      },
      "summary_ytd": {
        "total_penumpang": 3619,
        "total_ritase": 645,
        "avg_load_factor": 0.2891
      },
      "geometry": {
        "origin_name": "Tegal Buleud",
        "dest_name": "Sagaranten",
        "origin_coord": [
          -7.426,
          106.772
        ],
        "dest_coord": [
          -7.214,
          106.885
        ],
        "polyline": [
          [
            -7.426,
            106.772
          ],
          [
            -7.35,
            106.81
          ],
          [
            -7.28,
            106.85
          ],
          [
            -7.214,
            106.885
          ]
        ]
      },
      "monthly": {
        "Januari": {
          "keuangan": {
            "target": 66034726.0,
            "realisasi": 66034726.0
          },
          "ritase": {
            "target": 30,
            "realisasi": 30
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.2018
          },
          "penumpang": {
            "target": 570,
            "realisasi": 115
          },
          "keterangan": ""
        },
        "Februari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Maret": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "April": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Mei": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 73894000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 69
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 393
          },
          "keterangan": "0.8771929825"
        },
        "Juni": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 80167000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 90
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 513
          },
          "keterangan": "0.7115009747"
        },
        "Juli": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 69543000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 68
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 1,
            "realisasi": 387
          },
          "keterangan": "1.093911249"
        },
        "Agustus": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 67442000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 68
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 1,
            "realisasi": 387
          },
          "keterangan": "1.124871001"
        },
        "September": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 87090694.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.9035087719"
        },
        "Oktober": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 93090694.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.8026315789"
        },
        "November": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 93090694.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.8026315789"
        },
        "Desember": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 93090694.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.8004385965"
        }
      }
    },
    {
      "id": "PERINTIS-004",
      "no": 4,
      "name": "Leuwiliang - Cikidang",
      "kabupaten": "Kab. Bogor",
      "operator": "Perum DAMRI Cab. Bandung",
      "pagu": 0.0,
      "target_kontrak": 868789513.0,
      "realisasi_keuangan_ytd": 705857410.0,
      "no_kontrak": "PL.107/054/BPTD-JABAR/V/2025",
      "tgl_mulai": "9 Mei 2025",
      "tgl_selesai": "31 Desember 2025",
      "ppk": "Hardika Pratama",
      "pencairan": "Perbulan",
      "armada": {
        "jumlah": 2,
        "cadangan": 1,
        "kapasitas": 19,
        "umur": "9 Tahun"
      },
      "summary_ytd": {
        "total_penumpang": 3593,
        "total_ritase": 657,
        "avg_load_factor": 0.2708
      },
      "geometry": {
        "origin_name": "Leuwiliang",
        "dest_name": "Cikidang",
        "origin_coord": [
          -6.568,
          106.63
        ],
        "dest_coord": [
          -6.858,
          106.643
        ],
        "polyline": [
          [
            -6.568,
            106.63
          ],
          [
            -6.66,
            106.635
          ],
          [
            -6.76,
            106.64
          ],
          [
            -6.858,
            106.643
          ]
        ]
      },
      "monthly": {
        "Januari": {
          "keuangan": {
            "target": 66946742.0,
            "realisasi": 66946742.0
          },
          "ritase": {
            "target": 30,
            "realisasi": 30
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0368
          },
          "penumpang": {
            "target": 570,
            "realisasi": 21
          },
          "keterangan": ""
        },
        "Februari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Maret": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "April": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Mei": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 76326000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 69
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 2,
            "realisasi": 393
          },
          "keterangan": "2.491736588"
        },
        "Juni": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 73025000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 90
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 513
          },
          "keterangan": "0.8479532164"
        },
        "Juli": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 70313000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 74
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 421
          },
          "keterangan": "0.8487434803"
        },
        "Agustus": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 68154000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 74
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 421
          },
          "keterangan": "0.929350403"
        },
        "September": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 80273167.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.8026315789"
        },
        "Oktober": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 90273167.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.7960526316"
        },
        "November": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 90273167.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.7960526316"
        },
        "Desember": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 90273167.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 80
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 456
          },
          "keterangan": "0.9539473684"
        }
      }
    },
    {
      "id": "PERINTIS-005",
      "no": 5,
      "name": "Jasinga - Parung Panjang",
      "kabupaten": "Kab. Bogor",
      "operator": "Perum DAMRI Cab. Bandung",
      "pagu": 0.0,
      "target_kontrak": 696607315.0,
      "realisasi_keuangan_ytd": 463004280.0,
      "no_kontrak": "PL.107/055/BPTD-JABAR/V/2025",
      "tgl_mulai": "9 Mei 2025",
      "tgl_selesai": "31 Desember 2025",
      "ppk": "Hardika Pratama",
      "pencairan": "Perbulan",
      "armada": {
        "jumlah": 2,
        "cadangan": 1,
        "kapasitas": 19,
        "umur": "9 Tahun"
      },
      "summary_ytd": {
        "total_penumpang": 4090,
        "total_ritase": 662,
        "avg_load_factor": 0.3618
      },
      "geometry": {
        "origin_name": "Jasinga",
        "dest_name": "Parung Panjang",
        "origin_coord": [
          -6.49,
          106.452
        ],
        "dest_coord": [
          -6.349,
          106.567
        ],
        "polyline": [
          [
            -6.49,
            106.452
          ],
          [
            -6.44,
            106.49
          ],
          [
            -6.39,
            106.53
          ],
          [
            -6.349,
            106.567
          ]
        ]
      },
      "monthly": {
        "Januari": {
          "keuangan": {
            "target": 51048728.0,
            "realisasi": 51048728.0
          },
          "ritase": {
            "target": 30,
            "realisasi": 30
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.8561
          },
          "penumpang": {
            "target": 570,
            "realisasi": 488
          },
          "keterangan": ""
        },
        "Februari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Maret": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "April": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Mei": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 58806000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 92
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 3,
            "realisasi": 524
          },
          "keterangan": "3.209382151"
        },
        "Juni": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 63102000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 120
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 684
          },
          "keterangan": "0.9356725146"
        },
        "Juli": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 55907000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 90
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 1,
            "realisasi": 513
          },
          "keterangan": "1.475633528"
        },
        "Agustus": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 54708000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 90
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 513
          },
          "keterangan": "0.61208577"
        },
        "September": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 56858138.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 1,
            "realisasi": 342
          },
          "keterangan": "1.421052632"
        },
        "Oktober": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 40858138.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 1,
            "realisasi": 342
          },
          "keterangan": "1.812865497"
        },
        "November": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 40858138.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 342
          },
          "keterangan": "1.812865497"
        },
        "Desember": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 40858138.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 60
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 1,
            "realisasi": 342
          },
          "keterangan": "1.871345029"
        }
      }
    },
    {
      "id": "PERINTIS-006",
      "no": 6,
      "name": "Sadang - Wanakerta",
      "kabupaten": "Kab. Purwakarta",
      "operator": "Perum DAMRI Cab. Bandung",
      "pagu": 0.0,
      "target_kontrak": 525071234.0,
      "realisasi_keuangan_ytd": 451409649.0,
      "no_kontrak": "PL.107/056/BPTD-JABAR/V/2025",
      "tgl_mulai": "9 Mei 2025",
      "tgl_selesai": "31 Desember 2025",
      "ppk": "Hardika Pratama",
      "pencairan": "Perbulan",
      "armada": {
        "jumlah": 2,
        "cadangan": 1,
        "kapasitas": 19,
        "umur": "9 Tahun"
      },
      "summary_ytd": {
        "total_penumpang": 7527,
        "total_ritase": 1321,
        "avg_load_factor": 0.3
      },
      "geometry": {
        "origin_name": "Sadang",
        "dest_name": "Wanakerta",
        "origin_coord": [
          -6.516,
          107.452
        ],
        "dest_coord": [
          -6.425,
          107.442
        ],
        "polyline": [
          [
            -6.516,
            107.452
          ],
          [
            -6.48,
            107.448
          ],
          [
            -6.45,
            107.445
          ],
          [
            -6.425,
            107.442
          ]
        ]
      },
      "monthly": {
        "Januari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Februari": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Maret": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "April": {
          "keuangan": {
            "target": 0.0,
            "realisasi": 0.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 0
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.0
          },
          "penumpang": {
            "target": 0,
            "realisasi": 0
          },
          "keterangan": ""
        },
        "Mei": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 47574000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 138
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 786
          },
          "keterangan": "0.008899059242"
        },
        "Juni": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 45281000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 180
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 1026
          },
          "keterangan": "0.01169590643"
        },
        "Juli": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 49867000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 156
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 889
          },
          "keterangan": "0.002249212776"
        },
        "Agustus": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 53537000.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 156
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 889
          },
          "keterangan": "0"
        },
        "September": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 63510726.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 172
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 980
          },
          "keterangan": "0"
        },
        "Oktober": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 64618471.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 175
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 997
          },
          "keterangan": "0"
        },
        "November": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 63510726.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 172
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 980
          },
          "keterangan": "0"
        },
        "Desember": {
          "keuangan": {
            "target": 1.0,
            "realisasi": 63510726.0
          },
          "ritase": {
            "target": 0,
            "realisasi": 172
          },
          "load_factor": {
            "target": 0.3,
            "realisasi": 0.3
          },
          "penumpang": {
            "target": 0,
            "realisasi": 980
          },
          "keterangan": "0.00203998368"
        }
      }
    }
  ]
};

function renderPerintisLive(body) {
  const ds = PERINTIS_DATASET_2025;
  if (!ds || !ds.routes) return;
  
  let totTargetKontrak = 0;
  let totRealisasiKeuangan = 0;
  let totPenumpang = 0;
  let totArmadaUtama = 0;
  let totArmadaCadangan = 0;
  let sumLF = 0;

  ds.routes.forEach(r => {
    totTargetKontrak += r.target_kontrak || 0;
    totRealisasiKeuangan += r.realisasi_keuangan_ytd || 0;
    totPenumpang += r.summary_ytd.total_penumpang || 0;
    totArmadaUtama += r.armada.jumlah || 2;
    totArmadaCadangan += r.armada.cadangan || 1;
    sumLF += r.summary_ytd.avg_load_factor || 0;
  });

  const avgLF = (sumLF / ds.routes.length * 100).toFixed(1);
  const pctKeuangan = (totRealisasiKeuangan / (totTargetKontrak || 1) * 100).toFixed(1);

  // 1. KPI Cards
  const kpis = [
    { icon: '🛣️', label: 'Trayek Perintis 2025', value: ds.routes.length, suffix: ' (3 Kab)', color: '#8b5cf6' },
    { icon: '🚌', label: 'Armada Bus DAMRI', value: (totArmadaUtama + totArmadaCadangan), suffix: ` (${totArmadaUtama} Utm + ${totArmadaCadangan} Cad)`, color: '#0ea5e9' },
    { icon: '👥', label: 'Total Penumpang YTD', value: formatAngka(totPenumpang), suffix: ' orang', color: '#10b981' },
    { icon: '💸', label: 'Realisasi Keuangan', value: 'Rp ' + formatSingkat(totRealisasiKeuangan), suffix: ` (${pctKeuangan}%)`, color: '#f59e0b' }
  ];
  body.appendChild(renderPotretKPI(kpis, '#8b5cf6'));

  // 2. Map View Card
  const mapCard = document.createElement('div');
  mapCard.className = 'card potret-map-card';
  mapCard.innerHTML = '<h3 class="card-title">🗺️ Peta Interaktif Lintasan Trayek Perintis 2025</h3><p style="font-size:12px;color:var(--text-muted);margin:-4px 0 10px 0;">Warna rute berbasis keterisian (Load Factor): <span style="color:#10b981;font-weight:600;">🟢 &gt;50%</span> · <span style="color:#f59e0b;font-weight:600;">🟡 30-50%</span> · <span style="color:#ef4444;font-weight:600;">🔴 &lt;30%</span> (LineString Presisi / KML-KMZ Compatible)</p><div id="potretMapDiv" class="potret-map" style="height:380px;"></div>';
  body.appendChild(mapCard);

  const div = document.getElementById('potretMapDiv');
  if (div) {
    potretMap = L.map(div, { zoomControl: false }).setView([-7.0, 106.8], 9);
    L.tileLayer(getBasemapUrl(), { maxZoom: 19, subdomains: 'abcd' }).addTo(potretMap);
    L.control.zoom({ position: 'bottomright' }).addTo(potretMap);

    const bounds = [];
    ds.routes.forEach(r => {
      const lf = r.summary_ytd.avg_load_factor * 100;
      let color = '#ef4444';
      if (lf >= 50) color = '#10b981';
      else if (lf >= 30) color = '#f59e0b';

      const poly = r.geometry.polyline;
      poly.forEach(pt => bounds.push(pt));

      const pl = L.polyline(poly, { color: color, weight: 5, opacity: 0.9 }).addTo(potretMap);

      const popupHtml = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px;">
          <h4 style="margin:0 0 6px 0;color:#0f172a;font-size:14px;">🚐 ${r.name}</h4>
          <div style="font-size:12px;color:#475569;line-height:1.5;">
            <b>Kabupaten:</b> ${r.kabupaten}<br>
            <b>Operator:</b> ${r.operator}<br>
            <b>Armada:</b> ${r.armada.jumlah} Bus Utama (+${r.armada.cadangan} Cadangan), Cap: ${r.armada.kapasitas} Seat<br>
            <b>Target Kontrak:</b> Rp ${formatSingkat(r.target_kontrak)}<br>
            <b>Realisasi YTD:</b> Rp ${formatSingkat(r.realisasi_keuangan_ytd)}<br>
            <b>Penumpang 2025:</b> ${formatAngka(r.summary_ytd.total_penumpang)} orang<br>
            <b>Avg Load Factor:</b> <span style="font-weight:700;color:${color}">${(r.summary_ytd.avg_load_factor*100).toFixed(1)}%</span> (Target 30%)
          </div>
        </div>
      `;
      pl.bindPopup(popupHtml);

      L.circleMarker(poly[0], { radius: 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(potretMap)
        .bindTooltip(r.geometry.origin_name + ' (Asal)', { direction: 'top' });
      L.circleMarker(poly[poly.length - 1], { radius: 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(potretMap)
        .bindTooltip(r.geometry.dest_name + ' (Tujuan)', { direction: 'top' });
    });

    if (bounds.length) potretMap.fitBounds(bounds, { padding: [30, 30] });
    setTimeout(function() { if (potretMap) potretMap.invalidateSize(); }, 120);
  }

  // 3. Analytics Charts
  const chartCard = document.createElement('div');
  chartCard.className = 'card potret-chart-card';
  chartCard.innerHTML = '<h3 class="card-title">📊 Kinerja Load Factor & Penyerapan Keuangan Perintis 2025</h3><div class="potret-chart-wrap" style="height:290px;"><canvas id="perintisChart"></canvas></div>';
  body.appendChild(chartCard);

  const labels = ds.routes.map(r => r.name.replace(' - ', '–'));
  const lfData = ds.routes.map(r => Number((r.summary_ytd.avg_load_factor * 100).toFixed(1)));
  const keuData = ds.routes.map(r => Number((((r.realisasi_keuangan_ytd || 0) / (r.target_kontrak || 1)) * 100).toFixed(1)));
  const targetLine = ds.routes.map(() => 30);

  const barValuePlugin = {
    id: 'barValuePlugin',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (meta.type === 'line') return;
        meta.data.forEach((bar, index) => {
          const val = dataset.data[index];
          if (val !== undefined && val !== null) {
            ctx.save();
            ctx.fillStyle = dataset.backgroundColor || '#0f172a';
            ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(val + '%', bar.x, bar.y - 3);
            ctx.restore();
          }
        });
      });
    }
  };

  potretCharts.push(new Chart(document.getElementById('perintisChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Avg Load Factor (%)', data: lfData, backgroundColor: '#8b5cf6', borderRadius: 4 },
        { label: 'Penyerapan Keuangan (%)', data: keuData, backgroundColor: '#0ea5e9', borderRadius: 4 },
        { label: 'Target Minimal Load Factor (30%)', data: targetLine, type: 'line', borderColor: '#ef4444', borderWidth: 2, borderDash: [4, 4], pointRadius: 0 }
      ]
    },
    plugins: [barValuePlugin],
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.raw + '%' } }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { borderDash: [4, 4], color: '#e2e8f0' },
          ticks: { callback: v => v + '%' }
        },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  }));

  // 4. Data Table Card (Hapus Kolom Pagu / Kontrak & Realisasi Keuangan)
  const tblCard = document.createElement('div');
  tblCard.className = 'card potret-table-card';
  let tHtml = '<h3 class="card-title">📋 Matriks Realisasi 6 Lintasan Perintis 2025</h3>';
  tHtml += '<div class="table-responsive"><table class="data-table"><thead><tr><th>No</th><th>Lintasan Trayek</th><th>Kabupaten</th><th>Armada</th><th>Penumpang YTD</th><th>Avg Load Factor</th></tr></thead><tbody>';

  ds.routes.forEach(r => {
    const lfPct = (r.summary_ytd.avg_load_factor * 100).toFixed(1);
    const badgeColor = lfPct >= 50 ? '#10b981' : (lfPct >= 30 ? '#f59e0b' : '#ef4444');
    tHtml += `<tr>
      <td><b>${r.no}</b></td>
      <td><b>${r.name}</b><br><small style="color:var(--text-muted);">${r.no_kontrak}</small></td>
      <td>${r.kabupaten}</td>
      <td>${r.armada.jumlah} Utama (+${r.armada.cadangan} Cad) · ${r.armada.kapasitas} seat</td>
      <td><b>${formatAngka(r.summary_ytd.total_penumpang)}</b> orang</td>
      <td><span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${badgeColor}22;color:${badgeColor};font-weight:700;font-size:12px;">${lfPct}%</span></td>
    </tr>`;
  });
  tHtml += '</tbody></table></div>';
  tblCard.innerHTML = tHtml;
  body.appendChild(tblCard);
}

function renderPotretBody(id) {
  const cfg = potretData[id] || POTRET_DEFAULT[id];
  const body = document.getElementById('potretBody');
  if (!cfg || !body) return;
  body.innerHTML = '';
  potretCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
  potretCharts = [];
  if (potretMap) { try { potretMap.remove(); } catch (e) {} potretMap = null; }
  const isBarangLive = (id === 'barang') && (potRows['barang'] || []).length;
  if (isBarangLive) {
    // Potret Barang: tampilan LIVE dari data sinkronisasi + tabel editable.
    try { renderBarangLive(body); } catch (e) { console.error('Barang live render:', e); }
    try { body.appendChild(renderPotretTabelSheet('barang')); } catch (e) { console.error('Barang table:', e); }
  } else if (id === 'perintis') {
    try { renderPerintisLive(body); } catch (e) { console.error('Perintis live render:', e); }
  } else {
    try { body.appendChild(renderPotretKPI(cfg.kpi, cfg.meta.color)); } catch (e) { console.error('Potret KPI:', e); }
    try { if (cfg.insights && cfg.insights.length) body.appendChild(renderPotretInsights(cfg.insights)); } catch (e) { console.error('Potret insight:', e); }
    try {
      if (cfg.charts && cfg.charts.length) {
        body.appendChild(renderPotretCharts(cfg.charts));
        cfg.charts.forEach((spec, i) => {
          const cv = document.getElementById('potretCanvas_' + i);
          if (cv) potretCharts.push(buatChartPotret(cv, spec));
        });
      }
    } catch (e) { console.error('Potret chart:', e); }
    try {
      if ((potRows[id] || []).length) body.appendChild(renderPotretTabelSheet(id));
      else if (cfg.table) body.appendChild(renderPotretTable(cfg.table));
    } catch (e) { console.error('Potret table:', e); }
    try { if (cfg.map) initPotretMap(cfg.map); } catch (e) { console.error('Potret map:', e); }
  }
  body.scrollTop = 0;
}

function bukaPotret(id) {
  const def = POTRET_DEFAULT[id];
  if (!def) return;
  potretIdAktif = id;
  if (!potretData[id]) potretData[id] = JSON.parse(JSON.stringify(def)); // klon default
  if (!potRows[id]) potRows[id] = [];
  if (!potretCols[id]) potretCols[id] = POTRET_COLS_FALLBACK[id] || POTRET_COLS_FALLBACK._default;
  document.getElementById('dataViewContainer').classList.add('hidden');
  document.getElementById('routeBuilderOverlay').classList.add('hidden');
  resetRouteBuilder();
  expandSheet(false);
  document.getElementById('potretIcon').textContent = potretData[id].meta.icon || def.meta.icon;
  document.getElementById('potretTitle').textContent = potretData[id].meta.title || def.meta.title;
  document.getElementById('potretSubtitle').textContent = potretData[id].meta.desc || '';
  document.getElementById('potretContainer').classList.remove('hidden');
  document.querySelectorAll('.menu-item').forEach(m => {
    m.classList.toggle('active', m.getAttribute('data-potret') === id);
  });
  renderPotretBody(id);
  // Ambil tabel dari SHEET khusus bidang ini (baris = entri).
  // Data ini bisa diedit dari dashboard maupun langsung di Google Sheets.
  Backend.getPotretRows(id).then(function (data) {
      if (potretIdAktif !== id || !data) return;
      potRows[id] = data.rows || [];
      potretCols[id] = (data.columns && data.columns.length) ? data.columns : (POTRET_COLS_FALLBACK[id] || POTRET_COLS_FALLBACK._default);
      renderPotretBody(id);
      // Potret Barang: muat metadata grafik (tren bulanan + jenis pelanggaran) dari sinkronisasi.
      if (id === 'barang' && (potRows[id] || []).length) {
        Backend.getPotretBarangMeta(new Date().getFullYear()).then(function (meta) {
            if (potretIdAktif === id) renderBarangMeta(document.getElementById('potretBody'), meta);
          })
          .catch(function (err) { console.error('getPotretBarangMeta error:', err); });
      }
    })
    .catch(function (err) { console.error('getPotretRows error:', err); });
}
function tutupPotret() {
  potretIdAktif = null;
  document.getElementById('potretContainer').classList.add('hidden');
  potretCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
  potretCharts = [];
  if (potretMap) { try { potretMap.remove(); } catch (e) {} potretMap = null; }
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  tutupEditorPotret();
  expandSheet(true);
}
document.getElementById('btnTutupPotret').addEventListener('click', tutupPotret);

// ===== EDITOR POTRET ANGKUTAN (tabel seperti spreadsheet, langsung terhubung ke sheet) =====
function escPotret(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function potretColDefs(id) {
  if (potretCols[id] && potretCols[id].length) return potretCols[id];
  return POTRET_COLS_FALLBACK[id] || POTRET_COLS_FALLBACK._default;
}
function renderPotretTabelSheet(id) {
  const rows = potRows[id] || [];
  const sec = document.createElement('div');
  sec.className = 'card potret-table-card';
  if (!rows.length) {
    sec.innerHTML = '<h3 class="card-title">📋 Data</h3><p style="font-size:13px;color:var(--gray-text);">Belum ada data. Klik <b>✏️ Edit Data</b> untuk menambah baris (tersimpan ke sheet <b>Potret' + (id.charAt(0).toUpperCase() + id.slice(1)) + '</b>).</p>';
    return sec;
  }
  const cols = potretColDefs(id);
  const head = cols.map(function (c) { return '<th>' + escPotret(c.label) + '</th>'; }).join('');
  const tbody = rows.map(function (o) {
    return '<tr>' + cols.map(function (c) { return '<td>' + escPotret(o[c.key]) + '</td>'; }).join('') + '</tr>';
  }).join('');
  sec.innerHTML = '<h3 class="card-title">📋 Data <small style="font-weight:500;color:var(--gray-text);">(edit lewat tombol Edit Data)</small></h3><div class="table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + tbody + '</tbody></table></div>';
  return sec;
}
function renderPotretEditor() {
  const id = potretIdAktif;
  if (!id) return;
  const cols = potretColDefs(id);
  document.getElementById('potretEditHead').innerHTML = '<tr>' + cols.map(function (c) { return '<th>' + escPotret(c.label) + '</th>'; }).join('') + '<th></th></tr>';
  const tbody = document.getElementById('potretEditBody');
  tbody.innerHTML = potretEditRows.map(function (o, i) {
    const tds = cols.map(function (c) {
      return '<td><input class="pe-in" data-i="' + i + '" data-c="' + c.key + '" value="' + escPotret(o[c.key]) + '"></td>';
    }).join('');
    return '<tr>' + tds + '<td class="pe-del-cell"><button type="button" class="pe-del" data-i="' + i + '" title="Hapus baris">×</button></td></tr>';
  }).join('');
}
function bukaEditorPotret() {
  const id = potretIdAktif;
  const cfg = potretData[id] || POTRET_DEFAULT[id];
  if (!id || !cfg) return;
  document.getElementById('editPotretTitle').textContent = 'Edit Data — ' + ((cfg.meta && cfg.meta.title) || id);
  potretEditRows = JSON.parse(JSON.stringify(potRows[id] || []));
  if (!potretEditRows.length) potretEditRows = [{}];
  renderPotretEditor();
  document.getElementById('editPotretOverlay').classList.remove('hidden');
}
function tutupEditorPotret() {
  const el = document.getElementById('editPotretOverlay');
  if (el) el.classList.add('hidden');
}
function simpanPotret() {
  const id = potretIdAktif;
  if (!id) return;
  const bersih = potretEditRows.filter(function (o) {
    return o && Object.keys(o).some(function (k) { return o[k] && String(o[k]).trim() !== ''; });
  });
  if (!bersih.length) { alert('Belum ada data untuk disimpan.'); return; }
  showLoading();
  Backend.savePotretRows(id, bersih).then(function (res) {
      hideLoading();
      if (res && res.ok) {
        potRows[id] = bersih;
        tutupEditorPotret();
        renderPotretBody(id);
        tampilkanNotif(true, 'Data potret berhasil disimpan (' + bersih.length + ' baris).');
      } else {
        tampilkanNotif(false, 'Gagal menyimpan data potret.');
      }
    })
    .catch(function (err) {
      hideLoading();
      tampilkanNotif(false, 'Error: ' + (err && err.message ? err.message : err));
    });
}

// ===== INISIALISASI =====
window.addEventListener('DOMContentLoaded', function () {
  const th = document.getElementById('tahunHeader');
  inisialisasiTema();
  tampilkanLastUpdate();
  if (th) th.textContent = new Date().getFullYear();
  document.getElementById('tahunFooter').textContent = new Date().getFullYear();
  setupEventListeners();
  initMap();
  loadChoropleth();
  Backend.getAvailableYears().then(function (years) {
      const sel = document.getElementById('filterTahun');
      sel.innerHTML = '';
      years.forEach(function (y) {
        const o = document.createElement('option');
        o.value = y;
        o.textContent = y;
        sel.appendChild(o);
      });
      muatData(filterAktif(), false, null, null, false, function () {
        loadRoutes(function () {
          buatLegenda();
        });
      });
    })
    .catch(function (err) {
      alert('Gagal inisialisasi: ' + (err && err.message ? err.message : err));
      hideLoading();
    });
});

