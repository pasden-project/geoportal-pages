/**
 * GeoPORTAL BPTD Jabar — Dark Rivet Application Engine
 * ---------------------------------------------------------------------
 * Mengendalikan data live API gateway, animasi GSAP-style Power3 Out,
 * peta Leaflet Dark Basemap (CARTO Dark Matter tanpa watermark),
 * toggle metrik penumpang/kendaraan, peringkat simpul dinamis,
 * log aktivitas terminal & UPPKB, dan modal dialog interaktif.
 */

(function () {
  'use strict';

  var currentYear = 2026;
  var currentMode = 'akap'; // 'akap' | 'perintis' | 'barang' | 'brt' | 'ajap' | 'pariwisata'
  var currentMetric = 'primary'; // 'primary' | 'secondary'
  var currentChartPeriod = '12m'; // '12m' | 's1' | 's2' | 'q1' | 'q2' | 'q3' | 'q4'
  var currentChartView = 'bar'; // 'bar' | 'line'
  var dashboardData = null;
  var mapInstance = null;
  var markerLayerGroup = null;

  var monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  function getPeriodMonths(period) {
    switch (period) {
      case 's1': return [1, 2, 3, 4, 5, 6];
      case 's2': return [7, 8, 9, 10, 11, 12];
      case 'q1': return [1, 2, 3];
      case 'q2': return [4, 5, 6];
      case 'q3': return [7, 8, 9];
      case 'q4': return [10, 11, 12];
      case '12m':
      default:
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
  }
  // Baseline Data Verifikasi Produksi Resmi 2026
  var baselineData = {
    summary: {
      keberangkatan_penumpang: 3878703,
      kedatangan_penumpang: 3362251,
      total_penumpang: 7240954,
      keberangkatan_kendaraan: 424243,
      kedatangan_kendaraan: 377760,
      total_kendaraan: 802003
    },
    trend: [
      { bulan: "Jan", keberangkatan_penumpang: 370002, kedatangan_penumpang: 323925, keberangkatan_kendaraan: 43581, kedatangan_kendaraan: 36587 },
      { bulan: "Feb", keberangkatan_penumpang: 298410, kedatangan_penumpang: 268420, keberangkatan_kendaraan: 34120, kedatangan_kendaraan: 29840 },
      { bulan: "Mar", keberangkatan_penumpang: 331200, kedatangan_penumpang: 299800, keberangkatan_kendaraan: 37800, kedatangan_kendaraan: 33100 },
      { bulan: "Apr", keberangkatan_penumpang: 489500, kedatangan_penumpang: 442100, keberangkatan_kendaraan: 52400, kedatangan_kendaraan: 48900 },
      { bulan: "Mei", keberangkatan_penumpang: 388900, kedatangan_penumpang: 351200, keberangkatan_kendaraan: 41200, kedatangan_kendaraan: 37400 },
      { bulan: "Jun", keberangkatan_penumpang: 372100, kedatangan_penumpang: 339400, keberangkatan_kendaraan: 39800, kedatangan_kendaraan: 36200 },
      { bulan: "Jul", keberangkatan_penumpang: 412500, kedatangan_penumpang: 375600, keberangkatan_kendaraan: 44100, kedatangan_kendaraan: 39500 },
      { bulan: "Agu", keberangkatan_penumpang: 384200, kedatangan_penumpang: 348900, keberangkatan_kendaraan: 40900, kedatangan_kendaraan: 36800 },
      { bulan: "Sep", keberangkatan_penumpang: 358900, kedatangan_penumpang: 326700, keberangkatan_kendaraan: 38500, kedatangan_kendaraan: 34700 },
      { bulan: "Okt", keberangkatan_penumpang: 344100, kedatangan_penumpang: 315400, keberangkatan_kendaraan: 36700, kedatangan_kendaraan: 33200 },
      { bulan: "Nov", keberangkatan_penumpang: 332400, kedatangan_penumpang: 308900, keberangkatan_kendaraan: 35400, kedatangan_kendaraan: 32100 },
      { bulan: "Des", keberangkatan_penumpang: 446491, kedatangan_penumpang: 411906, keberangkatan_kendaraan: 49742, kedatangan_kendaraan: 44433 }
    ]
  };

  // Baseline Data Multi-Moda Transportasi Jawa Barat (Tahun 2026)
  var transportModes = {
    akap: {
      id: 'akap',
      name: 'AKAP / AKDP',
      periodKeterangan: 'YTD',
      title: 'Pergerakan Angkutan AKAP & AKDP (<span id="activeYearLabel">YTD</span>)',
      primaryLabel: 'Penumpang',
      secondaryLabel: 'Kendaraan',
      primaryUnit: ' pnp',
      secondaryUnit: ' knd',
      legendPrimary: 'Keberangkatan',
      legendSecondary: 'Kedatangan',
      primaryValue: 7240954,
      secondaryValue: 802003,
      stats: {
        s1Label: 'Pergerakan Kendaraan',
        s1Value: '802.003',
        s1Delta: '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>+8.4%</b> vs 2025',
        s2Value: '12 Simpul Tipe A',
        s2Delta: 'Wilayah BPTD Jabar',
        s2DeltaColor: 'var(--n-cyan)',
        s3Label: 'Trayek Berizin',
        s3Value: '1.248 Trayek',
        s3Delta: 'Aktif Beroperasi',
        s3DeltaColor: 'var(--n-lime)'
      },
      trend: [
        { bulan: "Jan", primary: 370002, secondary: 323925, altPrimary: 43581, altSecondary: 36587 },
        { bulan: "Feb", primary: 298410, secondary: 268420, altPrimary: 34120, altSecondary: 29840 },
        { bulan: "Mar", primary: 331200, secondary: 299800, altPrimary: 37800, altSecondary: 33100 },
        { bulan: "Apr", primary: 489500, secondary: 442100, altPrimary: 52400, altSecondary: 48900 },
        { bulan: "Mei", primary: 388900, secondary: 351200, altPrimary: 41200, altSecondary: 37400 },
        { bulan: "Jun", primary: 372100, secondary: 339400, altPrimary: 39800, altSecondary: 36200 },
        { bulan: "Jul", primary: 412500, secondary: 375600, altPrimary: 44100, altSecondary: 39500 },
        { bulan: "Agu", primary: 384200, secondary: 348900, altPrimary: 40900, altSecondary: 36800 },
        { bulan: "Sep", primary: 358900, secondary: 326700, altPrimary: 38500, altSecondary: 34700 },
        { bulan: "Okt", primary: 344100, secondary: 315400, altPrimary: 36700, altSecondary: 33200 },
        { bulan: "Nov", primary: 332400, secondary: 308900, altPrimary: 35400, altSecondary: 32100 },
        { bulan: "Des", primary: 446491, secondary: 411906, altPrimary: 49742, altSecondary: 44433 }
      ]
    },
    perintis: {
      id: 'perintis',
      name: 'Perintis PSO',
      periodKeterangan: 'Tahun 2025',
      title: 'Realisasi Angkutan Jalan Perintis PSO Jabar (<span id="activeYearLabel">Tahun 2025</span>)',
      primaryLabel: 'Penumpang',
      secondaryLabel: 'Ritase Bus',
      primaryUnit: ' pnp',
      secondaryUnit: ' trip',
      legendPrimary: 'Penumpang',
      legendSecondary: 'Ritase Operasi',
      primaryValue: 148620,
      secondaryValue: 4896,
      stats: {
        s1Label: 'Operasional Bus',
        s1Value: '4.896 Trip',
        s1Delta: '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>100%</b> Target PSO',
        s1DeltaClass: 'delta--up',
        s2Label: 'Trayek Pelayanan',
        s2Value: '6 Trayek PSO',
        s2Delta: 'Terlayani Penuh',
        s2DeltaColor: 'var(--n-lime)',
        s3Label: 'Tingkat Keterisian',
        s3Value: '74.8%',
        s3Delta: 'Load Factor Rata-rata',
        s3DeltaColor: 'var(--n-cyan)'
      },
      trend: [
        { bulan: "Jan", primary: 11450, secondary: 392 },
        { bulan: "Feb", primary: 10680, secondary: 380 },
        { bulan: "Mar", primary: 12100, secondary: 412 },
        { bulan: "Apr", primary: 15200, secondary: 460 },
        { bulan: "Mei", primary: 13450, secondary: 428 },
        { bulan: "Jun", primary: 12900, secondary: 416 },
        { bulan: "Jul", primary: 14100, secondary: 434 },
        { bulan: "Agu", primary: 13200, secondary: 420 },
        { bulan: "Sep", primary: 12400, secondary: 408 },
        { bulan: "Okt", primary: 11940, secondary: 396 },
        { bulan: "Nov", primary: 11600, secondary: 388 },
        { bulan: "Des", primary: 14500, secondary: 442 }
      ]
    },
    barang: {
      id: 'barang',
      name: 'Barang (UPPKB)',
      periodKeterangan: 'YTD',
      title: 'Operasional Penimbangan Muatan Truk UPPKB (<span id="activeYearLabel">YTD</span>)',
      primaryLabel: 'Truk Diperiksa',
      secondaryLabel: 'Pelanggaran',
      primaryUnit: ' truk',
      secondaryUnit: ' pelanggaran',
      legendPrimary: 'Truk Diperiksa',
      legendSecondary: 'Pelanggaran ODOL',
      primaryValue: 194392,
      secondaryValue: 16308,
      stats: {
        s1Label: 'Pelanggaran ODOL',
        s1Value: '16.308 Truk',
        s1Delta: '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>8.4%</b> Tingkat Melanggar',
        s1DeltaClass: 'delta--up',
        s2Label: 'Fasilitas UPPKB',
        s2Value: '6 Unit WIM',
        s2Delta: 'Aktif Terpetakan',
        s2DeltaColor: 'var(--n-amber)',
        s3Label: 'Ketaatan Muatan',
        s3Value: '91.8%',
        s3Delta: 'Taat Muatan Jabar',
        s3DeltaColor: 'var(--n-lime)'
      },
      trend: [
        { bulan: "Jan", primary: 15820, secondary: 1390 },
        { bulan: "Feb", primary: 14210, secondary: 1210 },
        { bulan: "Mar", primary: 16400, secondary: 1410 },
        { bulan: "Apr", primary: 17950, secondary: 1580 },
        { bulan: "Mei", primary: 16800, secondary: 1420 },
        { bulan: "Jun", primary: 16200, secondary: 1360 },
        { bulan: "Jul", primary: 17400, secondary: 1480 },
        { bulan: "Agu", primary: 16900, secondary: 1410 },
        { bulan: "Sep", primary: 15900, secondary: 1320 },
        { bulan: "Okt", primary: 15400, secondary: 1280 },
        { bulan: "Nov", primary: 15100, secondary: 1230 },
        { bulan: "Des", primary: 18312, secondary: 1518 }
      ]
    },
    brt: {
      id: 'brt',
      name: 'BRT Trans Metro',
      periodKeterangan: 'Tahun 2025',
      title: 'Layanan Aglomerasi BRT Trans Metro Pasundan (<span id="activeYearLabel">Tahun 2025</span>)',
      primaryLabel: 'Penumpang',
      secondaryLabel: 'Ritase Bus',
      primaryUnit: ' pnp',
      secondaryUnit: ' trip',
      legendPrimary: 'Penumpang BRT',
      legendSecondary: 'Ritase Koridor',
      primaryValue: 2418500,
      secondaryValue: 89200,
      stats: {
        s1Label: 'Kesiapan Armada',
        s1Value: '87 Bus',
        s1Delta: '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>100%</b> Siap Guna',
        s1DeltaClass: 'delta--up',
        s2Label: 'Koridor Layanan',
        s2Value: '5 + 1 Feeder',
        s2Delta: 'Bandung Raya',
        s2DeltaColor: 'var(--n-cyan)',
        s3Label: 'Ketepatan Waktu',
        s3Value: '91.4%',
        s3Delta: 'On-Time Performance',
        s3DeltaColor: 'var(--n-lime)'
      },
      trend: [
        { bulan: "Jan", primary: 195400, secondary: 7200 },
        { bulan: "Feb", primary: 182100, secondary: 6900 },
        { bulan: "Mar", primary: 198500, secondary: 7350 },
        { bulan: "Apr", primary: 224000, secondary: 8100 },
        { bulan: "Mei", primary: 206200, secondary: 7600 },
        { bulan: "Jun", primary: 201800, secondary: 7450 },
        { bulan: "Jul", primary: 215400, secondary: 7900 },
        { bulan: "Agu", primary: 204100, secondary: 7550 },
        { bulan: "Sep", primary: 197800, secondary: 7300 },
        { bulan: "Okt", primary: 193200, secondary: 7150 },
        { bulan: "Nov", primary: 189000, secondary: 7000 },
        { bulan: "Des", primary: 231000, secondary: 8400 }
      ]
    },
    ajap: {
      id: 'ajap',
      name: 'AJAP / AJDP',
      periodKeterangan: 'Tahun 2025',
      title: 'Angkutan Antar Jemput Antar/Dalam Provinsi (<span id="activeYearLabel">Tahun 2025</span>)',
      primaryLabel: 'Penumpang',
      secondaryLabel: 'Perjalanan',
      primaryUnit: ' pnp',
      secondaryUnit: ' trip',
      legendPrimary: 'Penumpang Shuttle',
      legendSecondary: 'Perjalanan Trip',
      primaryValue: 864200,
      secondaryValue: 37800,
      stats: {
        s1Label: 'Armada Terdaftar',
        s1Value: '864 Unit',
        s1Delta: '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>+5.2%</b> vs 2025',
        s1DeltaClass: 'delta--up',
        s2Label: 'Perusahaan PO',
        s2Value: '42 PO Resmi',
        s2Delta: 'Izin Trayek Aktif',
        s2DeltaColor: 'var(--n-cyan)',
        s3Label: 'Kepatuhan SPM',
        s3Value: '96.2%',
        s3Delta: 'Standar Pelayanan Min',
        s3DeltaColor: 'var(--n-lime)'
      },
      trend: [
        { bulan: "Jan", primary: 69400, secondary: 3050 },
        { bulan: "Feb", primary: 64200, secondary: 2880 },
        { bulan: "Mar", primary: 71800, secondary: 3150 },
        { bulan: "Apr", primary: 84500, secondary: 3620 },
        { bulan: "Mei", primary: 74100, secondary: 3240 },
        { bulan: "Jun", primary: 72600, secondary: 3180 },
        { bulan: "Jul", primary: 77900, secondary: 3390 },
        { bulan: "Agu", primary: 73200, secondary: 3200 },
        { bulan: "Sep", primary: 70500, secondary: 3080 },
        { bulan: "Okt", primary: 68400, secondary: 2990 },
        { bulan: "Nov", primary: 66900, secondary: 2920 },
        { bulan: "Des", primary: 81700, secondary: 3500 }
      ]
    },
    pariwisata: {
      id: 'pariwisata',
      name: 'Pariwisata',
      periodKeterangan: 'Tahun 2025',
      title: 'Pengawasan Bus Pariwisata & Ramp Check KSPN Jabar (<span id="activeYearLabel">Tahun 2025</span>)',
      primaryLabel: 'Bus Diperiksa',
      secondaryLabel: 'Lulus Uji',
      primaryUnit: ' bus',
      secondaryUnit: ' bus',
      legendPrimary: 'Bus Diperiksa',
      legendSecondary: 'Lulus Rampcheck',
      primaryValue: 1240,
      secondaryValue: 1165,
      stats: {
        s1Label: 'Lulus Rampcheck',
        s1Value: '1.165 Bus',
        s1Delta: '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>94.0%</b> Kelayakan',
        s1DeltaClass: 'delta--up',
        s2Label: 'Kawasan Wisata',
        s2Value: '3 KSPN',
        s2Delta: 'Puncak, Garut, Pangandaran',
        s2DeltaColor: 'var(--n-cyan)',
        s3Label: 'Penindakan/Sanksi',
        s3Value: '75 Bus',
        s3Delta: 'Tilang / Tidak Laik',
        s3DeltaColor: 'var(--n-pink)'
      },
      trend: [
        { bulan: "Jan", primary: 95, secondary: 88 },
        { bulan: "Feb", primary: 82, secondary: 76 },
        { bulan: "Mar", primary: 98, secondary: 92 },
        { bulan: "Apr", primary: 165, secondary: 154 },
        { bulan: "Mei", primary: 124, secondary: 117 },
        { bulan: "Jun", primary: 118, secondary: 111 },
        { bulan: "Jul", primary: 142, secondary: 134 },
        { bulan: "Agu", primary: 110, secondary: 104 },
        { bulan: "Sep", primary: 92, secondary: 87 },
        { bulan: "Okt", primary: 86, secondary: 81 },
        { bulan: "Nov", primary: 80, secondary: 75 },
        { bulan: "Des", primary: 158, secondary: 146 }
      ]
    }
  };

  // Baseline 12 Terminal Tipe A Resmi
  var defaultTerminals = [
    { nama_terminal: "LEUWIPANJANG", kabupaten_kota: "Kota Bandung", tipe: "A", lat: -6.9472, lng: 107.5947, stats: { keberangkatan_penumpang: 715420, kedatangan_penumpang: 852514, keberangkatan_kendaraan: 71410, kedatangan_kendaraan: 71410 } },
    { nama_terminal: "BARANANGSIANG", kabupaten_kota: "Kota Bogor", tipe: "A", lat: -6.6022, lng: 106.8086, stats: { keberangkatan_penumpang: 284100, kedatangan_penumpang: 245200, keberangkatan_kendaraan: 51200, kedatangan_kendaraan: 47210 } },
    { nama_terminal: "GUNTUR MELATI", kabupaten_kota: "Kab. Garut", tipe: "A", lat: -7.1995, lng: 107.8988, stats: { keberangkatan_penumpang: 783627, kedatangan_penumpang: 1029987, keberangkatan_kendaraan: 41120, kedatangan_kendaraan: 43200 } },
    { nama_terminal: "CIAKAR", kabupaten_kota: "Kab. Sumedang", tipe: "A", lat: -6.8491, lng: 107.9304, stats: { keberangkatan_penumpang: 182300, kedatangan_penumpang: 154100, keberangkatan_kendaraan: 21050, kedatangan_kendaraan: 21100 } },
    { nama_terminal: "KH AHMAD SANUSI", kabupaten_kota: "Kota Sukabumi", tipe: "A", lat: -6.9388, lng: 106.9211, stats: { keberangkatan_penumpang: 312092, kedatangan_penumpang: 358638, keberangkatan_kendaraan: 26110, kedatangan_kendaraan: 28100 } },
    { nama_terminal: "JATIJAJAR", kabupaten_kota: "Kota Depok", tipe: "A", lat: -6.4267, lng: 106.8587, stats: { keberangkatan_penumpang: 172234, kedatangan_penumpang: 89054, keberangkatan_kendaraan: 13200, kedatangan_kendaraan: 11900 } },
    { nama_terminal: "INDIHIANG", kabupaten_kota: "Kota Tasikmalaya", tipe: "A", lat: -7.3006, lng: 108.1939, stats: { keberangkatan_penumpang: 664931, kedatangan_penumpang: 13920, keberangkatan_kendaraan: 9100, kedatangan_kendaraan: 9100 } },
    { nama_terminal: "KLARI", kabupaten_kota: "Kab. Karawang", tipe: "A", lat: -6.3402, lng: 107.3541, stats: { keberangkatan_penumpang: 142100, kedatangan_penumpang: 118400, keberangkatan_kendaraan: 4250, kedatangan_kendaraan: 4250 } },
    { nama_terminal: "BANJAR", kabupaten_kota: "Kota Banjar", tipe: "A", lat: -7.3732, lng: 108.5442, stats: { keberangkatan_penumpang: 266107, kedatangan_penumpang: 253305, keberangkatan_kendaraan: 3200, kedatangan_kendaraan: 3200 } },
    { nama_terminal: "SUBANG", kabupaten_kota: "Kab. Subang", tipe: "A", lat: -6.5641, lng: 107.7633, stats: { keberangkatan_penumpang: 124300, kedatangan_penumpang: 98400, keberangkatan_kendaraan: 1250, kedatangan_kendaraan: 1250 } },
    { nama_terminal: "HARJAMUKTI", kabupaten_kota: "Kota Cirebon", tipe: "A", lat: -6.7497, lng: 108.5524, stats: { keberangkatan_penumpang: 215400, kedatangan_penumpang: 187200, keberangkatan_kendaraan: 600, kedatangan_kendaraan: 600 } },
    { nama_terminal: "KERTAWANGUNAN", kabupaten_kota: "Kab. Kuningan", tipe: "A", lat: -6.9822, lng: 108.5133, stats: { keberangkatan_penumpang: 134200, kedatangan_penumpang: 112100, keberangkatan_kendaraan: 450, kedatangan_kendaraan: 450 } }
  ];
  // Baseline 6 Fasilitas UPPKB Resmi
  var defaultUppkb = [
    { nama: "Balonggandu", kabupaten: "Kab. Karawang (Pantura)", lat: -6.3773, lng: 107.5149, stats: { diperiksa: 49980, pelanggaran: 7709 } },
    { nama: "Losarang", kabupaten: "Kab. Indramayu (Pantura)", lat: -6.3982, lng: 108.1722, stats: { diperiksa: 38450, pelanggaran: 5410 } },
    { nama: "Gentong", kabupaten: "Kab. Tasikmalaya (Selatan)", lat: -7.1322, lng: 108.1834, stats: { diperiksa: 24120, pelanggaran: 3120 } },
    { nama: "Cibaragalan", kabupaten: "Kab. Purwakarta (Tengah)", lat: -6.5183, lng: 107.4522, stats: { diperiksa: 31400, pelanggaran: 4210 } },
    { nama: "Tomo", kabupaten: "Kab. Sumedang (Tengah)", lat: -6.7821, lng: 108.1402, stats: { diperiksa: 22100, pelanggaran: 2890 } },
    { nama: "Kemang", kabupaten: "Kab. Bogor (Barat)", lat: -6.5022, lng: 106.7412, stats: { diperiksa: 28900, pelanggaran: 3650 } }
  ];

  // --- 1. Live Clock ---
  function initClock() {
    var el = document.getElementById('liveClock');
    if (!el) return;
    function tick() {
      var now = new Date();
      var opt = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      el.textContent = now.toLocaleTimeString('id-ID', opt) + ' WIB';
    }
    tick();
    setInterval(tick, 1000);
  }

  // --- 2. Number Counter Animation (GSAP Style Power3 Out) ---
  function animateValue(el, start, end, duration, suffix) {
    if (!el) return;
    suffix = suffix || '';
    if (start === end || duration <= 0) {
      el.textContent = end.toLocaleString('id-ID') + suffix;
      return;
    }
    duration = duration || 400;
    if (el._animRaf) {
      cancelAnimationFrame(el._animRaf);
      el._animRaf = null;
    }
    if (el._animTimer) {
      clearTimeout(el._animTimer);
      el._animTimer = null;
    }

    var startTime = performance.now();
    function tick() {
      var now = performance.now();
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(start + (end - start) * eased);
      el.textContent = current.toLocaleString('id-ID') + suffix;
      if (progress < 1) {
        el._animRaf = requestAnimationFrame(tick);
      } else {
        el.textContent = end.toLocaleString('id-ID') + suffix;
        el._animRaf = null;
        if (el._animTimer) {
          clearTimeout(el._animTimer);
          el._animTimer = null;
        }
      }
    }

    el._animRaf = requestAnimationFrame(tick);
    el._animTimer = setTimeout(function () {
      if (el._animRaf) {
        cancelAnimationFrame(el._animRaf);
        el._animRaf = null;
      }
      el.textContent = end.toLocaleString('id-ID') + suffix;
      el._animTimer = null;
    }, duration + 50);
  }

  // --- 3. Sidebar Nav Pill & Accordion Submenu Engine ---
  var moveNavPill = null;

  function initNavPill() {
    var pill = document.getElementById('navPill');
    var navItems = document.querySelectorAll('.nav__item:not(.nav__item--toggle)');
    if (!pill || !navItems.length) return;

    moveNavPill = function (item) {
      if (!item) return;
      var nav = item.closest('.nav');
      if (!nav) return;
      var navRect = nav.getBoundingClientRect();
      var itemRect = item.getBoundingClientRect();
      pill.style.top = (itemRect.top - navRect.top) + 'px';
      pill.style.height = itemRect.height + 'px';
      pill.style.opacity = '1';
    };

    var active = document.querySelector('.nav__item.is-active') || navItems[0];
    if (active) moveNavPill(active);

    navItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        moveNavPill(item);
      });
      item.addEventListener('click', function () {
        if (item.getAttribute('href') === './' || item.getAttribute('href') === '#') {
          navItems.forEach(function (n) { n.classList.remove('is-active'); });
          item.classList.add('is-active');
        }
        moveNavPill(item);
      });
    });

    var navEl = document.querySelector('.nav');
    if (navEl) {
      navEl.addEventListener('mouseleave', function () {
        var currentActive = document.querySelector('.nav__item.is-active') || navItems[0];
        if (currentActive) moveNavPill(currentActive);
      });
    }
  }

  // --- 3b. Accordion Submenu Toggle Engine ---
  function initNavToggle() {
    var toggles = document.querySelectorAll('.nav__item--toggle');
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var group = toggle.closest('.nav__group');
        if (!group) return;
        var isOpen = group.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));

        // Re-align nav pill to current active item after accordion animation
        setTimeout(function () {
          var active = document.querySelector('.nav__item.is-active');
          if (active && typeof moveNavPill === 'function') {
            moveNavPill(active);
          }
        }, 150);
      });
    });
  }

  // --- 4. Authentic Dark Rivet Bar Chart (.col + .col__pos + .bar--savings + .bar--income) ---
  // --- Helper Formatter Skala Sumbu Y ---
  function formatAxisTick(val) {
    if (val <= 0) return '0';
    if (val >= 1000000) {
      var m = val / 1000000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (val >= 1000) {
      var k = val / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k';
    }
    return Math.round(val) + '';
  }

  function getNiceCeiling(max) {
    if (max <= 0) return 100;
    var mag = Math.pow(10, Math.floor(Math.log10(max)));
    var norm = max / mag;
    var niceNorm;
    if (norm <= 1.0) niceNorm = 1.0;
    else if (norm <= 1.25) niceNorm = 1.25;
    else if (norm <= 1.5) niceNorm = 1.5;
    else if (norm <= 2.0) niceNorm = 2.0;
    else if (norm <= 2.5) niceNorm = 2.5;
    else if (norm <= 3.0) niceNorm = 3.0;
    else if (norm <= 4.0) niceNorm = 4.0;
    else if (norm <= 5.0) niceNorm = 5.0;
    else if (norm <= 6.0) niceNorm = 6.0;
    else if (norm <= 7.5) niceNorm = 7.5;
    else if (norm <= 8.0) niceNorm = 8.0;
    else niceNorm = 10.0;
    return niceNorm * mag;
  }

  // --- 4. Authentic Dark Rivet Bar Chart (.col + .col__pos + .bar--savings + .bar--income) ---
  // --- 4. Sub-Chart Renderer untuk Dual Kategori (Di Bagi 2: Kiri Penumpang, Kanan Ritase) ---
  function renderDualCategoryCharts(cfg, activeMonths) {
    var dualContainer = document.getElementById('dualCharts');
    if (!dualContainer) return;
    dualContainer.innerHTML = '';

    var data = cfg.trend || [];
    var maxPri = 1;
    var maxSec = 1;
    var periodData = [];

    for (var i = 0; i < activeMonths.length; i++) {
      var mIdx = activeMonths[i];
      var mName = monthNames[mIdx - 1];
      var row = data.find(function (r) {
        return r.bulan === mIdx ||
               r.bulan === mName ||
               r.bulan === (mIdx + '') ||
               (typeof r.bulan === 'string' && r.bulan.toLowerCase().startsWith(mName.toLowerCase()));
      }) || {};

      var pVal = Number(row.primary) || 0;
      var sVal = Number(row.secondary) || 0;

      if (pVal > maxPri) maxPri = pVal;
      if (sVal > maxSec) maxSec = sVal;

      periodData.push({
        idx: mIdx,
        mName: mName,
        pVal: pVal,
        sVal: sVal
      });
    }

    var ceilPri = getNiceCeiling(maxPri);
    var ceilSec = getNiceCeiling(maxSec);

    var tip = document.getElementById('tip');
    var tipMonth = document.getElementById('tipMonth');
    var tipBerangkat = document.getElementById('tipBerangkat');
    var tipDatang = document.getElementById('tipDatang');
    var tipLabelBerangkat = document.getElementById('tipLabelBerangkat');
    var tipLabelDatang = document.getElementById('tipLabelDatang');
    var tipRowDatang = document.getElementById('tipRowDatang');
    var tipRowBerangkat = document.getElementById('tipRowBerangkat');

    function createPanel(side, title, unit, colorVar, ceiling, isSecondary) {
      var panel = document.createElement('div');
      panel.className = 'dual-panel dual-panel--' + side;

      var head = document.createElement('div');
      head.className = 'dual-panel__head';
      head.innerHTML =
        '<span class="dual-panel__title" style="color: ' + colorVar + ';">' +
        '  <i class="dot" style="background: ' + colorVar + ';"></i> ' + title +
        '</span>' +
        '<span class="dual-panel__unit">' + unit + '</span>';
      panel.appendChild(head);

      var body = document.createElement('div');
      body.className = 'dual-panel__body';

      var axis = document.createElement('div');
      axis.className = 'chart__axis dual-axis';
      axis.setAttribute('aria-hidden', 'true');
      axis.innerHTML =
        '<span>' + formatAxisTick(ceiling) + '</span>' +
        '<span>' + formatAxisTick(ceiling * 0.75) + '</span>' +
        '<span>' + formatAxisTick(ceiling * 0.5) + '</span>' +
        '<span>' + formatAxisTick(ceiling * 0.25) + '</span>' +
        '<span>0</span>';
      body.appendChild(axis);

      var plot = document.createElement('div');
      plot.className = 'chart__plot dual-plot';
      plot.innerHTML = '<div class="chart__grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i class="chart__zero"></i></div>';

      var cols = document.createElement('div');
      cols.className = 'chart__cols dual-cols';

      for (var j = 0; j < periodData.length; j++) {
        (function (item) {
          var val = isSecondary ? item.sVal : item.pVal;
          var pct = (val > 0) ? Math.max(((val / ceiling) * 100), 1.5) : 0;

          var col = document.createElement('div');
          col.className = 'col';
          col.setAttribute('data-i', item.idx);

          var colPos = document.createElement('div');
          colPos.className = 'col__pos';

          var bar = document.createElement('i');
          bar.className = 'bar';
          bar.style.height = pct.toFixed(2) + '%';
          bar.style.animationDelay = (100 + j * 35) + 'ms';

          colPos.appendChild(bar);
          col.appendChild(colPos);
          cols.appendChild(col);

          col.addEventListener('mouseenter', function () {
            var allCols = dualContainer.querySelectorAll('.col');
            allCols.forEach(function (c) { c.classList.remove('is-on'); });
            col.classList.add('is-on');

            if (tip) {
              var yrText = (cfg.periodKeterangan === 'YTD') ? (' ' + currentYear + ' (YTD)') : (' ' + (cfg.periodKeterangan || '2025'));
              tipMonth.textContent = item.mName + yrText;
              if (isSecondary) {
                if (tipRowDatang) tipRowDatang.style.display = 'flex';
                if (tipRowBerangkat) tipRowBerangkat.style.display = 'none';
                if (tipLabelDatang) tipLabelDatang.textContent = title;
                if (tipDatang) tipDatang.textContent = val.toLocaleString('id-ID') + ' ' + unit;
              } else {
                if (tipRowBerangkat) tipRowBerangkat.style.display = 'flex';
                if (tipRowDatang) tipRowDatang.style.display = 'none';
                if (tipLabelBerangkat) tipLabelBerangkat.textContent = title;
                if (tipBerangkat) tipBerangkat.textContent = val.toLocaleString('id-ID') + ' ' + unit;
              }

              var colRect = col.getBoundingClientRect();
              var boardEl = document.querySelector('.card--balance') || document.body;
              var boardRect = boardEl.getBoundingClientRect();
              var tipWidth = tip.offsetWidth || 165;
              var tipHeight = tip.offsetHeight || 80;
              var tipX = (colRect.left - boardRect.left) + (colRect.width / 2) - (tipWidth / 2);
              tipX = Math.max(8, Math.min(tipX, boardRect.width - tipWidth - 8));
              var tipY = (colRect.top - boardRect.top) - tipHeight - 12;
              if (tipY < 8) tipY = (colRect.top - boardRect.top) + 24;

              tip.style.transform = 'translate(' + Math.round(tipX) + 'px, ' + Math.round(tipY) + 'px)';
              tip.classList.add('is-open');
            }
          });

          col.addEventListener('mouseleave', function () {
            col.classList.remove('is-on');
            if (tip) tip.classList.remove('is-open');
          });
        })(periodData[j]);
      }

      plot.appendChild(cols);
      body.appendChild(plot);

      var labels = document.createElement('div');
      labels.className = 'chart__labels dual-labels';
      labels.setAttribute('aria-hidden', 'true');
      labels.innerHTML = activeMonths.map(function (m) {
        return '<span>' + monthNames[m - 1] + '</span>';
      }).join('');
      body.appendChild(labels);

      panel.appendChild(body);
      return panel;
    }

    // Panel Kiri: Metrik Utama (Penumpang)
    var leftPanel = createPanel('left', cfg.primaryLabel, (cfg.primaryUnit || 'pnp').trim(), 'var(--n-lime)', ceilPri, false);
    // Panel Kanan: Metrik Kedua (Ritase Bus / Perjalanan)
    var rightPanel = createPanel('right', cfg.secondaryLabel, (cfg.secondaryUnit || 'trip').trim(), 'var(--n-cyan)', ceilSec, true);

    dualContainer.appendChild(leftPanel);
    dualContainer.appendChild(rightPanel);
  }

  // --- 4b. Authentic Dark Rivet Bar Chart (.col + .col__pos + .bar--savings + .bar--income) ---
  function renderTrendChart(cfg, metric) {
    cfg = cfg || transportModes[currentMode] || transportModes.akap;
    metric = metric || currentMetric || 'primary';

    var chartEl = document.getElementById('chart');
    var dualChartsEl = document.getElementById('dualCharts');
    var chartLegend = document.getElementById('chartLegend');
    var activeMonths = getPeriodMonths(currentChartPeriod);

    // Mode Perintis, BRT, AJAP: Tampilan di bagi 2 kategori (Kiri Penumpang, Kanan Ritase)
    var isDual = (cfg.id === 'perintis' || cfg.id === 'brt' || cfg.id === 'ajap');
    if (isDual) {
      if (chartEl) chartEl.style.display = 'none';
      if (dualChartsEl) dualChartsEl.style.display = 'grid';
      if (chartLegend) chartLegend.style.display = 'none';
      renderDualCategoryCharts(cfg, activeMonths);
      return;
    }

    // Mode AKAP & Pariwisata: Tampilan Single Chart
    if (chartEl) chartEl.style.display = 'grid';
    if (dualChartsEl) dualChartsEl.style.display = 'none';
    if (chartLegend) chartLegend.style.display = 'flex';

    var cols = document.getElementById('cols');
    if (!cols) return;
    cols.innerHTML = '';

    var isAkap = (cfg.id === 'akap');
    var isPariwisata = (cfg.id === 'pariwisata');
    var isBarang = (cfg.id === 'barang');
    var isPri = (metric === 'primary');
    var data = (isAkap && dashboardData && dashboardData.trend && dashboardData.trend.length)
      ? dashboardData.trend
      : cfg.trend;

    var unit = isAkap
      ? (isPri ? ' pnp' : ' knd')
      : (isPri ? (cfg.primaryUnit || ' pnp') : (cfg.secondaryUnit || ' trip'));

    // Dynamic X-Axis labels based on period
    var labelsEl = document.getElementById('labels');
    if (labelsEl) {
      labelsEl.innerHTML = activeMonths.map(function (m) {
        return '<span>' + monthNames[m - 1] + '</span>';
      }).join('');
    }
    var maxVal = 1;
    var periodData = [];
    for (var i = 0; i < activeMonths.length; i++) {
      var mIdx = activeMonths[i];
      var mName = monthNames[mIdx - 1];
      var row = data.find(function (r) {
        return r.bulan === mIdx ||
               r.bulan === mName ||
               r.bulan === (mIdx + '') ||
               (typeof r.bulan === 'string' && r.bulan.toLowerCase().startsWith(mName.toLowerCase()));
      }) || {};

      var pVal = 0;
      var sVal = 0;
      var monthTotal = 0;

      if (isAkap || isBarang) {
        // AKAP & Barang: Stacked (Truk Diperiksa + Pelanggaran ODOL)
        if (isAkap) {
          pVal = isPri ? (row.keberangkatan_penumpang || row.primary || 0) : (row.keberangkatan_kendaraan || row.altPrimary || 0);
          sVal = isPri ? (row.kedatangan_penumpang || row.secondary || 0) : (row.kedatangan_kendaraan || row.altSecondary || 0);
        } else {
          pVal = Number(row.primary) || 0;
          sVal = Number(row.secondary) || 0;
        }
        monthTotal = pVal + sVal;
      } else if (isPariwisata) {
        // Pariwisata: Disandingkan (Bus Diperiksa vs Lulus Uji berdampingan)
        pVal = row.primary || 0;
        sVal = row.secondary || 0;
        monthTotal = Math.max(pVal, sVal);
      }

      if (monthTotal > maxVal) maxVal = monthTotal;

      periodData.push({
        idx: mIdx,
        mName: mName,
        pVal: pVal,
        sVal: sVal,
        total: monthTotal
      });
    }

    var chartCeiling = getNiceCeiling(maxVal);

    // Dynamic 5-step Y-Axis ticks (0 di garis paling bawah, max di garis paling atas)
    var chartAxis = document.getElementById('chartAxis');
    if (chartAxis) {
      chartAxis.innerHTML = '<span>' + formatAxisTick(chartCeiling) + '</span>' +
                            '<span>' + formatAxisTick(chartCeiling * 0.75) + '</span>' +
                            '<span>' + formatAxisTick(chartCeiling * 0.5) + '</span>' +
                            '<span>' + formatAxisTick(chartCeiling * 0.25) + '</span>' +
                            '<span>0</span>';
    }

    var tip = document.getElementById('tip');
    var tipMonth = document.getElementById('tipMonth');
    var tipBerangkat = document.getElementById('tipBerangkat');
    var tipDatang = document.getElementById('tipDatang');
    var tipLabelBerangkat = document.getElementById('tipLabelBerangkat');
    var tipLabelDatang = document.getElementById('tipLabelDatang');
    var tipRowDatang = document.getElementById('tipRowDatang');
    var tipRowBerangkat = document.getElementById('tipRowBerangkat');
    var chartEl = document.getElementById('chart');
    var plotEl = chartEl ? chartEl.querySelector('.chart__plot') : null;
    var existingLineSvg = document.getElementById('chartLineSvg');

    if (currentChartView === 'line' && plotEl && periodData.length > 0) {
      if (chartEl) chartEl.classList.add('chart--line');
      var lineSvg = existingLineSvg;
      if (!lineSvg) {
        lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        lineSvg.setAttribute('class', 'chart__line-svg');
        lineSvg.setAttribute('id', 'chartLineSvg');
        lineSvg.setAttribute('viewBox', '0 0 1000 220');
        lineSvg.setAttribute('preserveAspectRatio', 'none');
        plotEl.appendChild(lineSvg);
      }

      var n = periodData.length;
      var priPoints = [];
      var secPoints = [];

      for (var k = 0; k < n; k++) {
        var x = Math.round(((k + 0.5) / n) * 1000);
        var yPri = Math.round(220 - ((periodData[k].pVal / chartCeiling) * 220));
        var ySec = Math.round(220 - ((periodData[k].sVal / chartCeiling) * 220));
        priPoints.push({ x: x, y: yPri });
        secPoints.push({ x: x, y: ySec });
      }

      var buildPath = function (pts) {
        if (!pts.length) return '';
        var d = 'M ' + pts[0].x + ' ' + pts[0].y;
        for (var p = 1; p < pts.length; p++) {
          var cx = (pts[p - 1].x + pts[p].x) / 2;
          d += ' C ' + cx + ' ' + pts[p - 1].y + ', ' + cx + ' ' + pts[p].y + ', ' + pts[p].x + ' ' + pts[p].y;
        }
        return d;
      };
      var dPri = (isAkap || isPariwisata || isPri) ? buildPath(priPoints) : '';
      var dSec = (isAkap || isPariwisata || !isPri) ? buildPath(secPoints) : '';

      var circlesHtml = '';
      for (var c = 0; c < n; c++) {
        if (isAkap || isPariwisata || !isPri) {
          circlesHtml += '<circle cx="' + secPoints[c].x + '" cy="' + secPoints[c].y + '" r="4" fill="#3ef2ff" stroke="#08090c" stroke-width="2"/>';
        }
        if (isAkap || isPariwisata || isPri) {
          circlesHtml += '<circle cx="' + priPoints[c].x + '" cy="' + priPoints[c].y + '" r="4" fill="#d4ff3f" stroke="#08090c" stroke-width="2"/>';
        }
      }

      var svgContent =
        '<defs>' +
        '  <linearGradient id="gradPri" x1="0" y1="0" x2="0" y2="1">' +
        '    <stop offset="0%" stop-color="#d4ff3f" stop-opacity="0.25"/>' +
        '    <stop offset="100%" stop-color="#d4ff3f" stop-opacity="0.0"/>' +
        '  </linearGradient>' +
        '  <linearGradient id="gradSec" x1="0" y1="0" x2="0" y2="1">' +
        '    <stop offset="0%" stop-color="#3ef2ff" stop-opacity="0.2"/>' +
        '    <stop offset="100%" stop-color="#3ef2ff" stop-opacity="0.0"/>' +
        '  </linearGradient>' +
        '</defs>';

      if (dSec) {
        svgContent += '<path d="' + dSec + ' L ' + secPoints[n - 1].x + ' 220 L ' + secPoints[0].x + ' 220 Z" fill="url(#gradSec)" />';
      }
      if (dPri) {
        svgContent += '<path d="' + dPri + ' L ' + priPoints[n - 1].x + ' 220 L ' + priPoints[0].x + ' 220 Z" fill="url(#gradPri)" />';
      }
      if (dSec) {
        svgContent += '<path d="' + dSec + '" fill="none" stroke="#3ef2ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />';
      }
      if (dPri) {
        svgContent += '<path d="' + dPri + '" fill="none" stroke="#d4ff3f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />';
      }
      svgContent += circlesHtml;

      lineSvg.innerHTML = svgContent;
      if (chartEl) chartEl.classList.remove('chart--line');
      if (existingLineSvg) existingLineSvg.remove();
    }

    for (var j = 0; j < periodData.length; j++) {
      (function (item, colIndex) {
        var idx = item.idx;
        var mName = item.mName;
        var pVal = item.pVal;
        var sVal = item.sVal;
        var col = document.createElement('div');
        col.className = 'col';
        col.setAttribute('data-i', idx);

        var colPos = document.createElement('div');

        if (isPariwisata) {
          // --- PARIWISATA: DISANDINGKAN (Grouped side-by-side bars) ---
          colPos.className = 'col__pos col__pos--grouped';

          var pctIncome = Math.max((pVal / chartCeiling) * 100, (pVal > 0 ? 1.5 : 0));
          var pctSavings = Math.max((sVal / chartCeiling) * 100, (sVal > 0 ? 1.5 : 0));

          var barIncome = document.createElement('i');
          barIncome.className = 'bar bar--income bar--side';
          barIncome.style.height = pctIncome.toFixed(2) + '%';
          barIncome.style.animationDelay = (100 + j * 40) + 'ms';

          var barSavings = document.createElement('i');
          barSavings.className = 'bar bar--savings bar--side';
          barSavings.style.height = pctSavings.toFixed(2) + '%';
          barSavings.style.animationDelay = (140 + j * 40) + 'ms';

          colPos.appendChild(barIncome);
          colPos.appendChild(barSavings);
        } else {
          // --- AKAP & BARANG: STACKED (as originally designed) ---
          colPos.className = 'col__pos col__pos--stacked';

          var pctIncome = Math.max((pVal / chartCeiling) * 100, (pVal > 0 ? 1.2 : 0));
          var pctSavings = Math.max((sVal / chartCeiling) * 100, (sVal > 0 ? 1.2 : 0));

          var barSavings = document.createElement('i');
          barSavings.className = 'bar bar--savings';
          barSavings.style.height = pctSavings.toFixed(2) + '%';
          barSavings.style.animationDelay = (100 + j * 40) + 'ms';

          var barIncome = document.createElement('i');
          barIncome.className = 'bar bar--income';
          barIncome.style.height = pctIncome.toFixed(2) + '%';
          barIncome.style.animationDelay = (140 + j * 40) + 'ms';

          colPos.appendChild(barSavings);
          colPos.appendChild(barIncome);
        }

        col.appendChild(colPos);

        cols.appendChild(col);

        // Hover for Dark Rivet tooltip & vertical column highlight
        col.addEventListener('mouseenter', function () {
          var allCols = document.querySelectorAll('#cols .col');
          allCols.forEach(function (c) { c.classList.remove('is-on'); });
          col.classList.add('is-on');
          if (chartEl) chartEl.classList.add('is-hover');

          if (tip && plotEl) {
            var yrText = (cfg.periodKeterangan === 'YTD') ? (' ' + currentYear + ' (YTD)') : (' ' + (cfg.periodKeterangan || '2025'));
            tipMonth.textContent = mName + yrText;
            if (isPariwisata || isAkap || isBarang) {
              if (tipRowBerangkat) tipRowBerangkat.style.display = 'flex';
              if (tipRowDatang) tipRowDatang.style.display = 'flex';
              if (tipLabelBerangkat) tipLabelBerangkat.textContent = cfg.legendPrimary;
              if (tipLabelDatang) tipLabelDatang.textContent = cfg.legendSecondary;
              if (tipBerangkat) tipBerangkat.textContent = pVal.toLocaleString('id-ID') + (isAkap ? unit : (cfg.primaryUnit || ''));
              if (tipDatang) tipDatang.textContent = sVal.toLocaleString('id-ID') + (isAkap ? unit : (cfg.secondaryUnit || ''));
            }

            // Kalkulasi posisi floating tooltip melayang di atas/dekat kolom aktif
            var plotRect = plotEl.getBoundingClientRect();
            var colRect = col.getBoundingClientRect();
            var tipWidth = tip.offsetWidth || 165;
            var tipHeight = tip.offsetHeight || 80;
            var tipX = (colRect.left - plotRect.left) + (colRect.width / 2) - (tipWidth / 2);
            tipX = Math.max(8, Math.min(tipX, plotRect.width - tipWidth - 8));
            var tipY = (colRect.top - plotRect.top) - tipHeight - 12;
            if (tipY < 8) {
              tipY = Math.max(8, (colRect.top - plotRect.top) + 24);
            }
            tip.style.transform = 'translate(' + Math.round(tipX) + 'px, ' + Math.round(tipY) + 'px)';
            tip.classList.add('is-open');
          }
        });

        col.addEventListener('mouseleave', function () {
          col.classList.remove('is-on');
          if (tip) tip.classList.remove('is-open');
          if (chartEl) chartEl.classList.remove('is-hover');
        });
      })(periodData[j], j);
    }
  }

  // --- 5. Multi-Mode Transport & Metric Engine ---
  function updateMetricSegButtons(cfg, activeMetric) {
    var segEl = document.getElementById('metricSeg');
    if (!segEl) return;
    segEl.innerHTML = '';

    var btn1 = document.createElement('button');
    btn1.className = 'seg__btn' + (activeMetric === 'primary' ? ' is-active' : '');
    btn1.type = 'button';
    btn1.setAttribute('data-metric', 'primary');
    btn1.setAttribute('title', cfg.primaryLabel);
    btn1.innerHTML = '<span>' + cfg.primaryLabel + '</span>';

    var btn2 = document.createElement('button');
    btn2.className = 'seg__btn' + (activeMetric === 'secondary' ? ' is-active' : '');
    btn2.type = 'button';
    btn2.setAttribute('data-metric', 'secondary');
    btn2.setAttribute('title', cfg.secondaryLabel);
    btn2.innerHTML = '<span>' + cfg.secondaryLabel + '</span>';

    btn1.addEventListener('click', function () {
      if (currentMetric === 'primary') return;
      currentMetric = 'primary';
      btn2.classList.remove('is-active');
      btn1.classList.add('is-active');
      updateModeUI(currentMode, 'primary');
    });

    btn2.addEventListener('click', function () {
      if (currentMetric === 'secondary') return;
      currentMetric = 'secondary';
      btn1.classList.remove('is-active');
      btn2.classList.add('is-active');
      updateModeUI(currentMode, 'secondary');
    });

    segEl.appendChild(btn1);
    segEl.appendChild(btn2);
  }

  function updateModeUI(modeKey, metric) {
    currentMode = modeKey || currentMode || 'akap';
    currentMetric = metric || currentMetric || 'primary';
    var isPri = (currentMetric === 'primary');
    var cfg = transportModes[currentMode] || transportModes.akap;

    var heroPax = document.getElementById('heroPax');
    var heroSub = document.getElementById('heroSub');
    var legendDatang = document.getElementById('legendDatang');
    var legendBerangkat = document.getElementById('legendBerangkat');
    var statLabel1 = document.getElementById('statLabel1');
    var statVehicles = document.getElementById('statVehicles');
    var statDelta1 = document.getElementById('statDelta1');
    var statLabel2 = document.getElementById('statLabel2');
    var statTerminals = document.getElementById('statTerminals');
    var statDelta2 = document.getElementById('statDelta2');
    var statLabel3 = document.getElementById('statLabel3');
    var statUppkb = document.getElementById('statUppkb');
    var statDelta3 = document.getElementById('statDelta3');

    // 1. Calculate active hero value (Full Keberangkatan + Kedatangan)
    var heroVal = 0;
    if (cfg.id === 'akap') {
      var sum = (dashboardData && dashboardData.summary) ? dashboardData.summary : baselineData.summary;
      var totalPax = sum.total_penumpang || ((Number(sum.keberangkatan_penumpang) || 0) + (Number(sum.kedatangan_penumpang) || 0));
      var totalVeh = sum.total_kendaraan || ((Number(sum.keberangkatan_kendaraan) || 0) + (Number(sum.kedatangan_kendaraan) || 0));
      heroVal = isPri
        ? (totalPax || cfg.primaryValue)
        : (totalVeh || cfg.secondaryValue);
    } else {
      heroVal = isPri ? cfg.primaryValue : cfg.secondaryValue;
    }
    console.log('[DEBUG_UPDATE_UI]', JSON.stringify({ isPri: isPri, totalPax: totalPax, totalVeh: totalVeh, heroVal: heroVal, hasDashboardData: !!dashboardData }));
    if (heroPax) {
      var curHeroStr = heroPax.textContent ? heroPax.textContent.replace(/\D/g, '') : '0';
      var startHero = parseInt(curHeroStr, 10) || 0;
      animateValue(heroPax, startHero, heroVal, 400);
    }
    if (heroSub) {
      heroSub.innerHTML = cfg.title;
      var yrLabel = document.getElementById('activeYearLabel');
      if (yrLabel) {
        yrLabel.textContent = cfg.periodKeterangan || 'Tahun 2025';
      }
    }
    // 2. Update Segmented Control Buttons
    updateMetricSegButtons(cfg, currentMetric);

    // 3. Update Chart Legend
    var legendItemDatang = document.getElementById('legendItemDatang');
    var legendItemBerangkat = document.getElementById('legendItemBerangkat');

    if (currentMode === 'pariwisata' || currentMode === 'akap' || currentMode === 'barang') {
      if (chartLegend) chartLegend.style.display = 'flex';
      if (legendItemBerangkat) legendItemBerangkat.style.display = 'inline-flex';
      if (legendItemDatang) legendItemDatang.style.display = 'inline-flex';
      if (legendBerangkat) legendBerangkat.textContent = cfg.legendPrimary;
      if (legendDatang) legendDatang.textContent = cfg.legendSecondary;
    } else {
      // Perintis, BRT, AJAP: Dual Category Panels (Kiri Penumpang, Kanan Ritase)
      if (chartLegend) chartLegend.style.display = 'none';
    }

    // 4. Update Right Stats Column
    if (statLabel1) statLabel1.textContent = cfg.stats.s1Label;
    if (statVehicles) {
      var vehTarget = 0;
      var suffix = '';
      if (cfg.id === 'akap') {
        var sumV = (dashboardData && dashboardData.summary) ? dashboardData.summary : baselineData.summary;
        vehTarget = sumV.total_kendaraan || ((Number(sumV.keberangkatan_kendaraan) || 0) + (Number(sumV.kedatangan_kendaraan) || 0));
        if (!vehTarget) vehTarget = cfg.secondaryValue;
      } else {
        var rawStr = String(cfg.stats.s1Value || '');
        vehTarget = parseInt(rawStr.replace(/\D/g, ''), 10) || 0;
        if (rawStr.includes('Trip')) suffix = ' Trip';
        else if (rawStr.includes('Truk')) suffix = ' Truk';
      }
      var curVehStr = statVehicles.textContent ? statVehicles.textContent.replace(/\D/g, '') : '0';
      var startVeh = parseInt(curVehStr, 10) || 0;
      if (vehTarget > 0) {
        animateValue(statVehicles, startVeh, vehTarget, 400, suffix);
      } else {
        statVehicles.textContent = cfg.stats.s1Value;
      }
    }
    if (statDelta1) {
      if (cfg.id === 'akap' && currentYear === 2025) {
        statDelta1.innerHTML = '<svg class="ico"><use href="#i-arrow-ur"/></svg><b>Tahun 2025</b> Baseline';
        statDelta1.className = 'delta delta--up';
      } else {
        statDelta1.innerHTML = cfg.stats.s1Delta;
        statDelta1.className = 'delta ' + (cfg.stats.s1DeltaClass || 'delta--up');
      }
    }

    if (statLabel2) statLabel2.textContent = cfg.stats.s2Label;
    if (statTerminals) statTerminals.textContent = cfg.stats.s2Value;
    if (statDelta2) {
      statDelta2.textContent = cfg.stats.s2Delta;
      statDelta2.style.color = cfg.stats.s2DeltaColor || 'var(--n-cyan)';
    }

    if (statLabel3) statLabel3.textContent = cfg.stats.s3Label;
    if (statUppkb) statUppkb.textContent = cfg.stats.s3Value;
    if (statDelta3) {
      statDelta3.textContent = cfg.stats.s3Delta;
      statDelta3.style.color = cfg.stats.s3DeltaColor || 'var(--n-amber)';
    }

    // 5. Render Bar Chart
    renderTrendChart(cfg, currentMetric);
  }

  function updateMetricUI(metric) {
    var m = (metric === 'kendaraan' || metric === 'secondary') ? 'secondary' : 'primary';
    updateModeUI(currentMode, m);
  }

  function initModeBar() {
    var bar = document.getElementById('transportModeBar');
    if (!bar) return;
    var btns = bar.querySelectorAll('.mode-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-mode');
        if (mode === currentMode) return;
        btns.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        currentMode = mode;
        currentMetric = 'primary';
        updateModeUI(currentMode, currentMetric);
      });
    });
  }

  // --- 6. Interactive Leaflet Mini Map (CARTO Dark Matter Standard & Markers) ---
  function initMap() {
    var mapEl = document.getElementById('rivetMap');
    if (!mapEl || mapInstance) return;

    mapInstance = L.map('rivetMap', {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false
    }).setView([-6.92, 107.60], 8);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    // Basemap OpenStreetMap dengan filter Dark Obsidian (100% Bebas Watermark & Lisensi Bersih)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 6,
      attribution: '&copy; OpenStreetMap · BPTD Jabar'
    }).addTo(mapInstance);

    markerLayerGroup = L.layerGroup().addTo(mapInstance);
    renderMapPoints(defaultTerminals, defaultUppkb);

    setTimeout(function () {
      if (mapInstance) {
        mapInstance.invalidateSize();
        fitMapToJabar();
      }
    }, 400);
  }

  function fitMapToJabar() {
    if (!mapInstance || !markerLayerGroup) return;
    var layers = markerLayerGroup.getLayers();
    if (layers && layers.length > 0) {
      try {
        var group = L.featureGroup(layers);
        mapInstance.fitBounds(group.getBounds().pad(0.08), {
          animate: false,
          maxZoom: 9
        });
      } catch (_) {}
    }
  }

  // Filter ketat hanya 12 Terminal Tipe A resmi di Jawa Barat
  function renderMapPoints(pointsData, uppkbData) {
    if (!markerLayerGroup) return;
    markerLayerGroup.clearLayers();

    var terminals = (pointsData && pointsData.length)
      ? pointsData.filter(function (p) {
          var t = String(p.tipe || '').trim().toUpperCase();
          return t === 'A' || t === 'TIPE A';
        })
      : defaultTerminals;

    if (!terminals || !terminals.length) {
      terminals = defaultTerminals;
    }

    terminals.forEach(function (t) {
      var lat = t.lat;
      var lng = t.lng;
      if (!lat || !lng) return;

      var rawName = t.nama_terminal || t.name || 'Terminal';
      var name = 'Terminal ' + (rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase());
      var city = t.kabupaten_kota || t.city || 'Jawa Barat';
      var statsHtml = '';
      if (t.stats) {
        var dep = (t.stats.keberangkatan_penumpang || 0).toLocaleString('id-ID');
        var arr = (t.stats.kedatangan_penumpang || 0).toLocaleString('id-ID');
        statsHtml = '<div style="margin-top: 4px; font-size: 11px; color: var(--dim);">Keberangkatan: <b style="color: var(--n-lime);">' + dep + '</b><br>Kedatangan: <b style="color: var(--n-cyan);">' + arr + '</b></div>';
      }

      var terminalSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="3" y="3" width="18" height="15" rx="3"/>' +
        '<path d="M3 11h18M6 18v3M18 18v3"/>' +
        '<circle cx="7.5" cy="7" r="1.5" fill="currentColor"/>' +
        '<circle cx="16.5" cy="7" r="1.5" fill="currentColor"/>' +
        '</svg>';

      var icon = L.divIcon({
        className: 'rivet-marker-host',
        html: '<div class="rivet-marker rivet-marker--terminal">' + terminalSvg + '</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([lat, lng], { icon: icon, title: 'Terminal: ' + name })
        .bindPopup('<div class="popup-title">' + name + '</div><div class="popup-sub">' + city + '</div><span class="popup-badge popup-badge--terminal">Terminal Tipe A</span>' + statsHtml)
        .addTo(markerLayerGroup);
    });

    var uppkbList = (uppkbData && uppkbData.length) ? uppkbData : defaultUppkb;
    uppkbList.forEach(function (u) {
      var lat = u.lat;
      var lng = u.lng;
      if (!lat || !lng) return;

      var rawName = u.nama || u.name || 'UPPKB';
      var name = 'UPPKB ' + rawName;
      var loc = u.kabupaten || u.loc || 'Jawa Barat';
      var statsHtml = '';
      if (u.stats) {
        var disp = (u.stats.diperiksa || 0).toLocaleString('id-ID');
        var viol = (u.stats.pelanggaran || 0).toLocaleString('id-ID');
        statsHtml = '<div style="margin-top: 4px; font-size: 11px; color: var(--dim);">Pemeriksaan: <b style="color: var(--n-amber);">' + disp + ' truk</b><br>Pelanggaran: <b style="color: var(--n-pink);">' + viol + '</b></div>';
      }

      var barangSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M1 3h13v13H1z"/>' +
        '<path d="M14 8h4l3 3v5h-7z"/>' +
        '<circle cx="5.5" cy="18.5" r="2.5"/>' +
        '<circle cx="17.5" cy="18.5" r="2.5"/>' +
        '</svg>';

      var icon = L.divIcon({
        className: 'rivet-marker-host',
        html: '<div class="rivet-marker rivet-marker--uppkb">' + barangSvg + '</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([lat, lng], { icon: icon, title: 'Angkutan Barang: ' + name })
        .bindPopup('<div class="popup-title">' + name + '</div><div class="popup-sub">' + loc + '</div><span class="popup-badge popup-badge--uppkb">Angkutan Barang · UPPKB</span>' + statsHtml)
        .addTo(markerLayerGroup);
    });

    fitMapToJabar();
  }

  // --- 7. Peringkat Simpul Dinamis & Quad Cards Logic ---
  var currentTerminalMetric = 'penumpang';
  var currentTrayekCategory = 'semua';

  var routesTopData = {
    semua: [
      { rute: 'Bandung \u2013 Sukabumi', tipe: 'AKDP', pnp: 452046, trips: 35961 },
      { rute: 'Bandung \u2013 Bekasi', tipe: 'AKDP', pnp: 223071, trips: 21682 },
      { rute: 'Kp. Rambutan (Jakarta) \u2013 Guntur Melati (Garut)', tipe: 'AKAP', pnp: 143865, trips: 10995 }
    ],
    akap: [
      { rute: 'Kp. Rambutan (Jakarta) \u2013 Guntur Melati (Garut)', tipe: 'AKAP', pnp: 143865, trips: 10995 },
      { rute: 'Kp. Rambutan (Jakarta) \u2013 Ciakar (Sumedang)', tipe: 'AKAP', pnp: 105402, trips: 8204 },
      { rute: 'Kp. Rambutan (Jakarta) \u2013 Indihiang (Tasikmalaya)', tipe: 'AKAP', pnp: 87384, trips: 10701 }
    ],
    akdp: [
      { rute: 'Bandung \u2013 Sukabumi', tipe: 'AKDP', pnp: 452046, trips: 35961 },
      { rute: 'Bandung \u2013 Bekasi', tipe: 'AKDP', pnp: 223071, trips: 21682 },
      { rute: 'Guntur Melati (Garut) \u2013 Baranangsiang (Bogor)', tipe: 'AKDP', pnp: 129859, trips: 10395 }
    ]
  };

  var odBangkitanData = [
    { nama: 'Kota Bandung', pnp: 676598, note: 'Top Outflow Jabar' },
    { nama: 'Kota Tasikmalaya', pnp: 634549 },
    { nama: 'Kota Sukabumi', pnp: 345782 },
    { nama: 'Kab. Garut', pnp: 307949 },
    { nama: 'Kota Bekasi', pnp: 272178 }
  ];

  var odTarikanData = [
    { nama: 'Kota Bandung', pnp: 713190, note: 'Top Inflow Jabar' },
    { nama: 'Kab. Garut', pnp: 539448 },
    { nama: 'Kota Sukabumi', pnp: 352550 },
    { nama: 'Kota Bekasi', pnp: 329532 },
    { nama: 'Kab. Sumedang', pnp: 184566 }
  ];

  function renderTerminalRanking(metric) {
    if (metric) currentTerminalMetric = metric;
    var listEl = document.getElementById('terminalRankList');
    if (!listEl) return;

    var pts = (dashboardData && dashboardData.points && dashboardData.points.length)
      ? dashboardData.points.filter(function (p) {
          var t = String(p.tipe || '').trim().toUpperCase();
          return t === 'A' || t === 'TIPE A';
        })
      : defaultTerminals;
    if (!pts || !pts.length) pts = defaultTerminals;

    var isPnp = (currentTerminalMetric === 'penumpang');
    var list = pts.map(function (p) {
      var total = 0;
      if (p.stats) {
        if (isPnp) {
          total = (p.stats.keberangkatan_penumpang || 0) + (p.stats.kedatangan_penumpang || 0);
        } else {
          total = (p.stats.keberangkatan_kendaraan || 0) + (p.stats.kedatangan_kendaraan || 0);
        }
      }
      var rawName = p.nama_terminal || p.name || 'Terminal';
      var name = rawName.toLowerCase().split(/\s+/).map(function (w) {
        if (w === 'kh') return 'KH';
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
      var kota = p.kabupaten_kota || p.kota || '';
      return { name: name, kota: kota, total: total };
    }).sort(function (a, b) { return b.total - a.total; });

    var grandTotal = list.reduce(function (sum, item) { return sum + item.total; }, 0) || 1;
    var top5 = list.slice(0, 5);
    var maxVal = (top5[0] && top5[0].total) ? top5[0].total : 1;

    var barGradients = [
      'linear-gradient(90deg, var(--n-lime), #84cc16)',
      'linear-gradient(90deg, var(--n-cyan), #06b6d4)',
      'linear-gradient(90deg, var(--n-amber), #eab308)',
      'var(--n-cyan)',
      'var(--dim)'
    ];

    listEl.innerHTML = '';
    top5.forEach(function (item, idx) {
      var sharePct = ((item.total / grandTotal) * 100).toFixed(1).replace('.', ',') + '%';
      var barWidth = Math.max(8, Math.round((item.total / maxVal) * 100)) + '%';
      var valStr = item.total.toLocaleString('id-ID') + (isPnp ? ' pnp' : ' knd');
      var badgeClass = 'rank-item__badge' + (idx < 3 ? ' rank-item__badge--' + (idx + 1) : '');

      var li = document.createElement('li');
      li.className = 'rank-item rank-item-anim';
      li.style.animationDelay = (120 + idx * 50) + 'ms';
      li.innerHTML =
        '<div class="rank-item__row">' +
          '<div class="rank-item__left">' +
            '<span class="' + badgeClass + '">' + (idx + 1) + '</span>' +
            '<div style="min-width:0; overflow:hidden;">' +
              '<p class="rank-item__name">' + item.name + '</p>' +
              (item.kota ? '<p class="rank-item__sub">' + item.kota + '</p>' : '') +
            '</div>' +
          '</div>' +
          '<div class="rank-item__right">' +
            '<span class="rank-item__val">' + valStr + '</span>' +
            '<span class="rank-item__share">(' + sharePct + ')</span>' +
          '</div>' +
        '</div>' +
        '<div class="rank-item__bar">' +
          '<div class="rank-item__fill" style="width: ' + barWidth + '; background: ' + barGradients[idx] + ';"></div>' +
        '</div>';
      listEl.appendChild(li);
    });

    var footerEl = document.getElementById('terminalRankFooter');
    if (footerEl) {
      footerEl.textContent = 'Total ' + grandTotal.toLocaleString('id-ID') + (isPnp ? ' pnp terpetakan' : ' knd terpetakan');
    }
  }

  function renderTrayekRanking(category) {
    if (category) currentTrayekCategory = category;
    var listEl = document.getElementById('trayekRankList');
    if (!listEl) return;

    var items = routesTopData[currentTrayekCategory] || routesTopData.semua;
    var maxPnp = (items[0] && items[0].pnp) ? items[0].pnp : 1;

    var barGradients = [
      'linear-gradient(90deg, var(--n-lime), #84cc16)',
      'linear-gradient(90deg, var(--n-cyan), #06b6d4)',
      'linear-gradient(90deg, var(--n-amber), #eab308)'
    ];

    listEl.innerHTML = '';
    items.forEach(function (item, idx) {
      var barWidth = Math.max(10, Math.round((item.pnp / maxPnp) * 100)) + '%';
      var badgeClass = 'rank-item__badge rank-item__badge--' + (idx + 1);
      var catClass = item.tipe === 'AKAP' ? 'trayek-cat-pill--akap' : 'trayek-cat-pill--akdp';

      var li = document.createElement('li');
      li.className = 'rank-item rank-item-anim';
      li.style.animationDelay = (120 + idx * 50) + 'ms';
      li.innerHTML =
        '<div class="rank-item__row">' +
          '<div class="rank-item__left">' +
            '<span class="' + badgeClass + '">' + (idx + 1) + '</span>' +
            '<div style="min-width:0; overflow:hidden;">' +
              '<p class="rank-item__name" title="' + item.rute + '">' + item.rute + '</p>' +
              '<div style="display:flex; align-items:center; gap:5px; margin-top:1px;">' +
                '<span class="trayek-cat-pill ' + catClass + '">' + item.tipe + '</span>' +
                '<span class="rank-item__sub">' + item.trips.toLocaleString('id-ID') + ' Trip</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="rank-item__right">' +
            '<span class="rank-item__val" style="color:var(--n-lime);">' + item.pnp.toLocaleString('id-ID') + '</span>' +
            '<span class="rank-item__sub">pnp</span>' +
          '</div>' +
        '</div>' +
        '<div class="rank-item__bar">' +
          '<div class="rank-item__fill" style="width: ' + barWidth + '; background: ' + barGradients[idx] + ';"></div>' +
        '</div>';
      listEl.appendChild(li);
    });
  }

  function renderBangkitanTarikan() {
    var bList = document.getElementById('odBangkitanList');
    var tList = document.getElementById('odTarikanList');
    if (!bList || !tList) return;

    var maxB = odBangkitanData[0].pnp;
    var maxT = odTarikanData[0].pnp;

    bList.innerHTML = '';
    odBangkitanData.forEach(function (item, idx) {
      var barWidth = Math.max(10, Math.round((item.pnp / maxB) * 100)) + '%';
      var badgeClass = 'rank-item__badge' + (idx < 3 ? ' rank-item__badge--' + (idx + 1) : '');

      var li = document.createElement('li');
      li.className = 'rank-item rank-item-anim';
      li.style.animationDelay = (100 + idx * 40) + 'ms';
      li.innerHTML =
        '<div class="rank-item__row">' +
          '<div class="rank-item__left">' +
            '<span class="' + badgeClass + '">' + (idx + 1) + '</span>' +
            '<div style="min-width:0; overflow:hidden;">' +
              '<p class="rank-item__name">' + item.nama + '</p>' +
              (item.note ? '<p class="rank-item__sub">' + item.note + '</p>' : '') +
            '</div>' +
          '</div>' +
          '<div class="rank-item__right">' +
            '<span class="rank-item__val" style="color:var(--n-cyan);">' + item.pnp.toLocaleString('id-ID') + '</span>' +
            '<span class="rank-item__sub">pnp</span>' +
          '</div>' +
        '</div>' +
        '<div class="rank-item__bar">' +
          '<div class="rank-item__fill" style="width: ' + barWidth + '; background: linear-gradient(90deg, var(--n-cyan), #0284c7);"></div>' +
        '</div>';
      bList.appendChild(li);
    });

    tList.innerHTML = '';
    odTarikanData.forEach(function (item, idx) {
      var barWidth = Math.max(10, Math.round((item.pnp / maxT) * 100)) + '%';
      var badgeClass = 'rank-item__badge' + (idx < 3 ? ' rank-item__badge--' + (idx + 1) : '');

      var li = document.createElement('li');
      li.className = 'rank-item rank-item-anim';
      li.style.animationDelay = (100 + idx * 40) + 'ms';
      li.innerHTML =
        '<div class="rank-item__row">' +
          '<div class="rank-item__left">' +
            '<span class="' + badgeClass + '">' + (idx + 1) + '</span>' +
            '<div style="min-width:0; overflow:hidden;">' +
              '<p class="rank-item__name">' + item.nama + '</p>' +
              (item.note ? '<p class="rank-item__sub">' + item.note + '</p>' : '') +
            '</div>' +
          '</div>' +
          '<div class="rank-item__right">' +
            '<span class="rank-item__val" style="color:var(--n-lime);">' + item.pnp.toLocaleString('id-ID') + '</span>' +
            '<span class="rank-item__sub">pnp</span>' +
          '</div>' +
        '</div>' +
        '<div class="rank-item__bar">' +
          '<div class="rank-item__fill" style="width: ' + barWidth + '; background: linear-gradient(90deg, var(--n-lime), #65a30d);"></div>' +
        '</div>';
      tList.appendChild(li);
    });
  }

  function renderHealthScoreGauge(score) {
    var s = (typeof score === 'number') ? score : 88.2;
    var arcEl = document.getElementById('healthGaugeArc');
    var valEl = document.getElementById('healthGaugeVal');
    var scoreEl = document.getElementById('healthBigScore');

    if (scoreEl) {
      scoreEl.innerHTML = s.toFixed(1).replace('.', ',') + '<span>/100</span>';
    }
    if (valEl) {
      animateValue(valEl, 0, Math.round(s), 900, '%');
    }
    if (arcEl) {
      var offset = Math.round(251.36 * (1 - s / 100));
      arcEl.style.strokeDashoffset = offset;
    }
  }

  function initQuadCards() {
    var tTabs = document.querySelectorAll('#terminalRankTabs .rank-tab-btn');
    tTabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var metric = this.getAttribute('data-metric');
        if (metric === currentTerminalMetric) return;
        tTabs.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');
        renderTerminalRanking(metric);
      });
    });

    var yTabs = document.querySelectorAll('#trayekRankTabs .rank-tab-btn');
    yTabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = this.getAttribute('data-cat');
        if (cat === currentTrayekCategory) return;
        yTabs.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');
        renderTrayekRanking(cat);
      });
    });

    renderTerminalRanking(currentTerminalMetric);
    renderTrayekRanking(currentTrayekCategory);
    renderBangkitanTarikan();
    renderHealthScoreGauge(88.2);
  }

  // Backward compatibility wrapper
  function renderRanking(points) {
    var catsEl = document.getElementById('cats');
    if (catsEl) {
      var pts = (points && points.length)
        ? points.filter(function (p) {
            var t = String(p.tipe || '').trim().toUpperCase();
            return t === 'A' || t === 'TIPE A';
          })
        : defaultTerminals;
      if (!pts || !pts.length) pts = defaultTerminals;
      var list = pts.map(function (p) {
        var total = (p.stats ? ((p.stats.keberangkatan_penumpang || 0) + (p.stats.kedatangan_penumpang || 0)) : 0);
        var rawName = p.nama_terminal || p.name || 'Terminal';
        var name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
        return { name: name, total: total };
      }).sort(function (a, b) { return b.total - a.total; });

      var grandTotal = list.reduce(function (sum, item) { return sum + item.total; }, 0) || 1;
      var colors = ['var(--n-lime)', 'var(--n-cyan)', 'var(--n-amber)', 'var(--n-violet)', 'var(--faint)'];

      catsEl.innerHTML = '';
      var top4 = list.slice(0, 4);
      var top4Sum = 0;

      top4.forEach(function (item, idx) {
        top4Sum += item.total;
        var pct = Math.round((item.total / grandTotal) * 100);
        var li = document.createElement('li');
        li.className = 'rank-item-anim';
        li.style.cssText = 'display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; animation-delay: ' + (150 + idx * 60) + 'ms;';
        li.innerHTML = '<span style="color: #FFFFFF;">' + (idx + 1) + '. ' + item.name + '</span><b style="color: ' + colors[idx] + ';">' + pct + '%</b>';
        catsEl.appendChild(li);
      });

      var remainingPct = Math.max(0, 100 - Math.round((top4Sum / grandTotal) * 100));
      var liOther = document.createElement('li');
      liOther.className = 'rank-item-anim';
      liOther.style.cssText = 'display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; animation-delay: ' + (150 + 4 * 60) + 'ms;';
      liOther.innerHTML = '<span style="color: var(--dim);">5. Lainnya</span><b style="color: ' + colors[4] + ';">' + remainingPct + '%</b>';
      catsEl.appendChild(liOther);
    }

    renderTerminalRanking(currentTerminalMetric);
  }

  // --- 8. Log Aktivitas Simpul Terkini Dinamis (#txList) ---
  function renderActivityFeed(points, uppkbPoints) {
    var txList = document.getElementById('txList');
    if (!txList) return;

    var pts = (points && points.length)
      ? points.filter(function (p) {
          var t = String(p.tipe || '').trim().toUpperCase();
          return t === 'A' || t === 'TIPE A';
        })
      : defaultTerminals;
    if (!pts || !pts.length) pts = defaultTerminals;
    var ups = (uppkbPoints && uppkbPoints.length) ? uppkbPoints : defaultUppkb;

    var topTerminals = pts.slice().sort(function (a, b) {
      var ta = a.stats ? ((a.stats.keberangkatan_penumpang || 0) + (a.stats.kedatangan_penumpang || 0)) : 0;
      var tb = b.stats ? ((b.stats.keberangkatan_penumpang || 0) + (b.stats.kedatangan_penumpang || 0)) : 0;
      return tb - ta;
    }).slice(0, 3);

    var topUppkb = ups.slice().sort(function (a, b) {
      var da = a.stats ? (a.stats.diperiksa || 0) : 0;
      var db = b.stats ? (b.stats.diperiksa || 0) : 0;
      return db - da;
    }).slice(0, 2);

    txList.innerHTML = '';

    // Terminal Rows
    topTerminals.forEach(function (t) {
      var rawName = t.nama_terminal || t.name || 'Terminal';
      var initials = rawName.slice(0, 2).toUpperCase();
      var name = 'Terminal ' + (rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase());
      var city = (t.kabupaten_kota || t.city || 'Jawa Barat') + ' · Tipe A';
      var dep = t.stats ? (t.stats.keberangkatan_penumpang || 0) : 0;

      var li = document.createElement('li');
      li.className = 'tx__row tx-item-anim';
      li.style.animationDelay = (180 + txList.children.length * 60) + 'ms';
      li.innerHTML = '<span class="avatar avatar--sq" style="background: rgba(62, 242, 255, 0.15); color: var(--n-cyan); font-weight: 800; font-size: 11px;">' + initials + '</span>' +
        '<span class="tx__body">' +
          '<span class="tx__name" style="font-size: 12px; color: #FFFFFF;">' + name + '</span>' +
          '<span class="tx__date" style="font-size: 11px; color: var(--dim);">' + city + '</span>' +
        '</span>' +
        '<span class="tx__amt"><b class="up" style="color: var(--n-lime); font-size: 12px;">+ ' + dep.toLocaleString('id-ID') + ' pnp</b><small style="color: var(--dim);">Keberangkatan</small></span>';
      txList.appendChild(li);
    });

    // UPPKB Rows
    topUppkb.forEach(function (u) {
      var rawName = u.nama || u.name || 'UPPKB';
      var initials = rawName.slice(0, 2).toUpperCase();
      var name = 'UPPKB ' + rawName;
      var loc = (u.kabupaten || u.loc || 'Pantura') + ' · Jalur Angkutan';
      var count = u.stats ? (u.stats.diperiksa || 0) : 1420;

      var li = document.createElement('li');
      li.className = 'tx__row tx-item-anim';
      li.style.animationDelay = (180 + txList.children.length * 60) + 'ms';
      li.innerHTML = '<span class="avatar avatar--sq" style="background: rgba(255, 190, 77, 0.15); color: var(--n-amber); font-weight: 800; font-size: 11px;">' + initials + '</span>' +
        '<span class="tx__body">' +
          '<span class="tx__name" style="font-size: 12px; color: #FFFFFF;">' + name + '</span>' +
          '<span class="tx__date" style="font-size: 11px; color: var(--dim);">' + loc + '</span>' +
        '</span>' +
        '<span class="tx__amt"><b style="color: var(--n-amber); font-size: 12px;">' + count.toLocaleString('id-ID') + ' truk</b><small style="color: var(--dim);">Penimbangan WIM</small></span>';
      txList.appendChild(li);
    });
  }

  // --- 9. Modal Manager & Mobile Drawer ---
  function initModals() {
    var modalTriggers = document.querySelectorAll('[data-modal-target]');
    modalTriggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = btn.getAttribute('data-modal-target');
        var modal = document.getElementById(targetId);
        if (modal) {
          modal.classList.add('is-open');
        }
      });
    });

    var closeBtns = document.querySelectorAll('.rivet-modal-close');
    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var overlay = btn.closest('.rivet-modal-overlay');
        if (overlay) overlay.classList.remove('is-open');
      });
    });

    var overlays = document.querySelectorAll('.rivet-modal-overlay');
    overlays.forEach(function (ov) {
      ov.addEventListener('click', function (e) {
        if (e.target === ov) ov.classList.remove('is-open');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        overlays.forEach(function (ov) { ov.classList.remove('is-open'); });
        var side = document.getElementById('side');
        var backdrop = document.getElementById('sideBackdrop');
        if (side) side.classList.remove('is-open');
        if (backdrop) backdrop.classList.remove('is-open');
      }
    });
  }

  function initMobileMenu() {
    var menuBtn = document.getElementById('menu');
    var side = document.getElementById('side');
    var sideClose = document.getElementById('sideClose');
    var backdrop = document.getElementById('sideBackdrop');

    if (!side) return;

    function openMenu() {
      side.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
    }

    function closeMenu() {
      side.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
    }

    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (sideClose) sideClose.addEventListener('click', closeMenu);
    if (backdrop) backdrop.addEventListener('click', closeMenu);

    var navItems = side.querySelectorAll('.nav__item');
    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        if (window.innerWidth <= 1024) closeMenu();
      });
    });
  }

  // --- 10. Fetch Data Live dari Gateway ---
  // Arsitektur Data:
  // - Overview & Terminal membaca live dari Google Spreadsheet (sheet Terminal & Produksi) via RPC /api/getDashboardData.
  // - Modul Trayek & OD terpisah dalam pipeline Origin-Destination (OD/output/routes_top10.json).
  var dashboardCache = {};

  function fetchDashboard(year) {
    if (dashboardCache[year]) {
      dashboardData = dashboardCache[year];
      updateMetricUI(currentMetric);

      if (dashboardData.points) {
        renderMapPoints(dashboardData.points, dashboardData.uppkbPoints);
        renderRanking(dashboardData.points);
        renderTerminalRanking(currentTerminalMetric);
        renderActivityFeed(dashboardData.points, dashboardData.uppkbPoints);
      }
      return;
    }

    fetch('/api/getDashboardData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fn: 'getDashboardData', args: [{ tahun: year }] })
    })
    .then(function (res) { return res.json(); })
    .then(function (pack) {
      if (!pack || !pack.ok || !pack.data) return;
      dashboardCache[year] = pack.data;
      if (year === currentYear) {
        dashboardData = pack.data;
        updateMetricUI(currentMetric);

        if (pack.data.points) {
          renderMapPoints(pack.data.points, pack.data.uppkbPoints);
          renderRanking(pack.data.points);
          renderTerminalRanking(currentTerminalMetric);
          renderActivityFeed(pack.data.points, pack.data.uppkbPoints);
        }
      }
    })
    .catch(function (err) {
      console.warn('API Gateway note:', err.message);
    });
  }

  // --- 11. Chart Period & View Controls ---
  function initChartControls() {
    var periodSelect = document.getElementById('chartPeriodSelect');
    if (periodSelect) {
      periodSelect.addEventListener('change', function () {
        currentChartPeriod = this.value || '12m';
        var cfg = transportModes[currentMode] || transportModes.akap;
        renderTrendChart(cfg, currentMetric);
      });
    }

    var viewBtns = document.querySelectorAll('.chart-view-toggle .view-btn');
    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var viewMode = this.getAttribute('data-view') || 'bar';
        if (currentChartView === viewMode) return;
        currentChartView = viewMode;
        viewBtns.forEach(function (b) { b.classList.remove('is-active'); });
        this.classList.add('is-active');
        var cfg = transportModes[currentMode] || transportModes.akap;
        renderTrendChart(cfg, currentMetric);
      });
    });
  }

  // --- 12. Year Selector Event Listeners ---
  function initEvents() {
    var yearBtns = document.querySelectorAll('.year-pill-btn');
    yearBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var y = parseInt(btn.getAttribute('data-year'), 10);
        if (y === currentYear) return;
        currentYear = y;
        yearBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        var yrLabel = document.getElementById('activeYearLabel');
        if (yrLabel) yrLabel.textContent = 'Tahun ' + currentYear;

        fetchDashboard(currentYear);
      });
    });
  }

  // --- 12. Single Persistent Sidebar SPA Shell Navigation ---
  function navigateTo(targetUrl, pushState) {
    if (pushState === undefined) pushState = true;
    var board = document.querySelector('.board');
    var frame = document.getElementById('submoduleFrame');
    if (!frame) return;

    var urlObj;
    try {
      urlObj = new URL(targetUrl, window.location.origin);
    } catch (_) {
      urlObj = { pathname: targetUrl, search: '' };
    }
    var pathname = urlObj.pathname;
    if (!pathname.endsWith('/') && !pathname.includes('.')) {
      pathname += '/';
    }

    var isDashboard = (pathname === '/' || pathname === '/command-center' || pathname === '/command-center/');

    // Perbarui highlight menu aktif di sidebar secara instan
    var navLinks = document.querySelectorAll('.nav a[href]');
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var linkPath = href;
      try {
        linkPath = new URL(href, window.location.origin).pathname;
      } catch (_) {}
      if (!linkPath.endsWith('/') && !linkPath.includes('.')) linkPath += '/';

      var match = false;
      if (isDashboard) {
        match = (linkPath === '/' || linkPath === '/command-center/' || href === './');
      } else {
        match = (linkPath === pathname);
      }

      if (match) {
        link.classList.add('is-active');
        var group = link.closest('.nav__group');
        if (group && !group.classList.contains('is-open')) {
          group.classList.add('is-open');
          var toggle = group.querySelector('.nav__item--toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
        if (typeof moveNavPill === 'function' && link.classList.contains('nav__item')) {
          moveNavPill(link);
        }
      } else {
        link.classList.remove('is-active');
      }
    });

    if (isDashboard) {
      if (frame) frame.style.display = 'none';
      if (board) board.style.display = '';
      if (pushState && window.location.pathname !== pathname) {
        window.history.pushState({ path: pathname }, '', pathname);
      }
    } else {
      if (board) board.style.display = 'none';
      if (frame) {
        frame.style.display = 'block';
        var embedUrl = pathname + (urlObj.search ? urlObj.search + '&embed=1' : '?embed=1');
        frame.dataset.currentRoute = embedUrl;
        if (frame.getAttribute('src') !== embedUrl) {
          if (frame.contentWindow && frame.getAttribute('src')) {
            try {
              frame.contentWindow.location.replace(embedUrl);
            } catch (_) {
              frame.setAttribute('src', embedUrl);
            }
          } else {
            frame.setAttribute('src', embedUrl);
          }
        }
      }
      if (pushState && window.location.pathname !== pathname) {
        window.history.pushState({ path: pathname }, '', pathname);
      }
    }
  }

  function initSpaRouting() {
    // Intersepsi klik tautan internal agar sidebar tidak pernah merefresh
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      if (link.target === '_blank') return;
      if (link.hasAttribute('data-modal-target')) return;
      var href = link.getAttribute('href');
      if (!href || href.startsWith('javascript:') || href === '#') return;

      if (href.startsWith('/command-center/') || href === '/' || href === './' || href.startsWith('./')) {
        e.preventDefault();
        navigateTo(href, true);
        if (window.innerWidth <= 1024) {
          var side = document.getElementById('side');
          var backdrop = document.getElementById('sideBackdrop');
          if (side) side.classList.remove('is-open');
          if (backdrop) backdrop.classList.remove('is-open');
        }
      }
    });

    // Tangani tombol browser Back / Forward
    window.addEventListener('popstate', function () {
      navigateTo(window.location.pathname + window.location.search, false);
    });

    // Tangani koordinasi navigasi dari submodul embed via postMessage
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'GEO_NAVIGATE' && e.data.path) {
        navigateTo(e.data.path, true);
      }
    });

    // Deteksi rute URL awal saat pertama kali dimuat
    var currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/command-center' && currentPath !== '/command-center/') {
      navigateTo(currentPath + window.location.search, false);
    }
  }

  // --- 13. Initialize Everything on Load ---
  document.addEventListener('DOMContentLoaded', function () {
    initClock();
    initNavPill();
    initNavToggle();
    initMobileMenu();
    initModeBar();
    initModals();
    initChartControls();
    initEvents();
    initSpaRouting();
    initQuadCards();
    // Baseline render langsung tanpa flicker / tanpa menunggu cold-start API
    updateModeUI('akap', 'primary');
    renderRanking(defaultTerminals);
    renderActivityFeed(defaultTerminals, defaultUppkb);
    initMap();

    // Animate SPM Gauge on entrance
    var gNum = document.getElementById('gaugeNum');
    if (gNum) animateValue(gNum, 0, 78, 850, '%');
    // Sinkronisasi data live gateway
    fetchDashboard(currentYear);
  });
})();