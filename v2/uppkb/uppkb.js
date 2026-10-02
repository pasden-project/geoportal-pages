/* =====================================================================
   GeoPORTAL BPTD Jabar — Modul UPPKB & Angkutan Barang (uppkb.js)
   Fasilitas Penimbangan Kendaraan Bermotor & Pengawasan Muatan
   ===================================================================== */

/**
 * Embedded official dataset fallback (BPTD Kelas I Jawa Barat 2025)
 * 6 Fasilitas UPPKB Aktif (JT001 - JT006), 194.392 Kendaraan Diperiksa,
 * 15.898 Penindakan Pelanggaran, 91,8% Rata-rata Kepatuhan Tonase.
 */
const UPPKB_EMBEDDED_DATA = {
  "title": "Rekapitulasi Operasional Penimbangan & Pengawasan Muatan UPPKB 2025",
  "instansi": "BPTD Kelas I Jawa Barat",
  "tahun": 2025,
  "total_fasilitas": 6,
  "summary": {
    "total_diperiksa_2025": 194392,
    "total_diperiksa_2024": 246609,
    "total_penindakan_2025": 15898,
    "total_pelanggaran_2025": 16308,
    "total_pelanggaran_2024": 27651,
    "tingkat_kepatuhan": 0.918,
    "total_tilang_uppkb": 6563,
    "total_tilang_polisi": 698,
    "total_tilang_lain": 4441,
    "total_transfer_muatan": 53,
    "total_peringatan": 4643
  },
  "stations": [
    {
      "kode": "JT001",
      "no": 1,
      "nama": "Balonggandu",
      "kabupaten": "Kabupaten Karawang",
      "wilayah": "Pantura",
      "koridor": "Pantura (Koridor Utara Karawang - Cikampek)",
      "lat": -6.37733,
      "lng": 107.51488,
      "status": "Aktif",
      "tahun_beroperasi": 1985,
      "alamat": "Jl. Raya Pantura No. 12, Balonggandu, Kec. Jatisari, Kab. Karawang",
      "deskripsi": "Fasilitas penimbangan utama di koridor Pantura barat Jawa Barat, mengawasi arus logistik industri dan barang dari Jabodetabek menuju Jawa Tengah/Timur.",
      "diperiksa_2024": 56965,
      "diperiksa_2025": 39623,
      "pelanggaran_2024": 6052,
      "pelanggaran_2025": 5900,
      "kepatuhan_pct": 85.1,
      "penindakan": {
        "tilang_uppkb": 2384,
        "tilang_polisi": 427,
        "tilang_lain": 3107,
        "transfer_muatan": 32,
        "peringatan": 22
      },
      "intensitas": "Tinggi",
      "monthly": [
        { "bulan": "Januari", "diperiksa": 3410, "pelanggaran": 512, "tilang": 210, "transfer": 3, "peringatan": 2 },
        { "bulan": "Februari", "diperiksa": 3180, "pelanggaran": 485, "tilang": 195, "transfer": 2, "peringatan": 1 },
        { "bulan": "Maret", "diperiksa": 3520, "pelanggaran": 530, "tilang": 215, "transfer": 4, "peringatan": 2 },
        { "bulan": "April", "diperiksa": 2980, "pelanggaran": 410, "tilang": 160, "transfer": 2, "peringatan": 1 },
        { "bulan": "Mei", "diperiksa": 3390, "pelanggaran": 495, "tilang": 202, "transfer": 3, "peringatan": 2 },
        { "bulan": "Juni", "diperiksa": 3450, "pelanggaran": 520, "tilang": 212, "transfer": 3, "peringatan": 3 },
        { "bulan": "Juli", "diperiksa": 3510, "pelanggaran": 528, "tilang": 218, "transfer": 4, "peringatan": 2 },
        { "bulan": "Agustus", "diperiksa": 3380, "pelanggaran": 505, "tilang": 204, "transfer": 3, "peringatan": 2 },
        { "bulan": "September", "diperiksa": 3260, "pelanggaran": 480, "tilang": 190, "transfer": 2, "peringatan": 2 },
        { "bulan": "Oktober", "diperiksa": 3420, "pelanggaran": 510, "tilang": 208, "transfer": 3, "peringatan": 2 },
        { "bulan": "November", "diperiksa": 3110, "pelanggaran": 460, "tilang": 185, "transfer": 2, "peringatan": 1 },
        { "bulan": "Desember", "diperiksa": 3023, "pelanggaran": 465, "tilang": 185, "transfer": 1, "peringatan": 2 }
      ]
    },
    {
      "kode": "JT002",
      "no": 2,
      "nama": "Losarang",
      "kabupaten": "Kabupaten Indramayu",
      "wilayah": "Pantura",
      "koridor": "Pantura (Koridor Pantai Utara Indramayu)",
      "lat": -6.38535,
      "lng": 108.14003,
      "status": "Aktif",
      "tahun_beroperasi": 1988,
      "alamat": "Jl. Raya Losarang, Kec. Losarang, Kab. Indramayu",
      "deskripsi": "Fasilitas penimbangan strategis di jalur Pantura tengah Jabar, memantau muatan kendaraan bertonase berat sebelum memasuki wilayah Cirebon.",
      "diperiksa_2024": 42468,
      "diperiksa_2025": 39194,
      "pelanggaran_2024": 10372,
      "pelanggaran_2025": 5470,
      "kepatuhan_pct": 86.0,
      "penindakan": {
        "tilang_uppkb": 869,
        "tilang_polisi": 271,
        "tilang_lain": 1083,
        "transfer_muatan": 7,
        "peringatan": 3263
      },
      "intensitas": "Tinggi",
      "monthly": [
        { "bulan": "Januari", "diperiksa": 3350, "pelanggaran": 470, "tilang": 75, "transfer": 1, "peringatan": 280 },
        { "bulan": "Februari", "diperiksa": 3120, "pelanggaran": 435, "tilang": 68, "transfer": 1, "peringatan": 260 },
        { "bulan": "Maret", "diperiksa": 3480, "pelanggaran": 490, "tilang": 78, "transfer": 1, "peringatan": 290 },
        { "bulan": "April", "diperiksa": 2910, "pelanggaran": 395, "tilang": 62, "transfer": 0, "peringatan": 240 },
        { "bulan": "Mei", "diperiksa": 3340, "pelanggaran": 460, "tilang": 74, "transfer": 1, "peringatan": 275 },
        { "bulan": "Juni", "diperiksa": 3410, "pelanggaran": 475, "tilang": 76, "transfer": 1, "peringatan": 285 },
        { "bulan": "Juli", "diperiksa": 3490, "pelanggaran": 485, "tilang": 77, "transfer": 1, "peringatan": 290 },
        { "bulan": "Agustus", "diperiksa": 3330, "pelanggaran": 465, "tilang": 73, "transfer": 0, "peringatan": 280 },
        { "bulan": "September", "diperiksa": 3220, "pelanggaran": 445, "tilang": 70, "transfer": 0, "peringatan": 268 },
        { "bulan": "Oktober", "diperiksa": 3380, "pelanggaran": 470, "tilang": 75, "transfer": 1, "peringatan": 280 },
        { "bulan": "November", "diperiksa": 3080, "pelanggaran": 430, "tilang": 69, "transfer": 0, "peringatan": 255 },
        { "bulan": "Desember", "diperiksa": 3084, "pelanggaran": 450, "tilang": 72, "transfer": 0, "peringatan": 260 }
      ]
    },
    {
      "kode": "JT003",
      "no": 3,
      "nama": "Gentong",
      "kabupaten": "Kabupaten Tasikmalaya",
      "wilayah": "Selatan",
      "koridor": "Selatan (Koridor Priangan Timur & Jalur Tanjakan Gentong)",
      "lat": -7.11956,
      "lng": 108.13575,
      "status": "Aktif",
      "tahun_beroperasi": 1992,
      "alamat": "Jl. Raya Gentong, Kadipaten, Kec. Kadipaten, Kab. Tasikmalaya",
      "deskripsi": "Fasilitas penimbangan krusial pengawasan keselamatan di area tanjakan kritis Gentong, mencegah kendaraan over dimension over load (ODOL) mengalami kecelakaan di medan perbukitan.",
      "diperiksa_2024": 42157,
      "diperiksa_2025": 21034,
      "pelanggaran_2024": 4374,
      "pelanggaran_2025": 909,
      "kepatuhan_pct": 95.7,
      "penindakan": {
        "tilang_uppkb": 898,
        "tilang_polisi": 0,
        "tilang_lain": 11,
        "transfer_muatan": 0,
        "peringatan": 5
      },
      "intensitas": "Sedang",
      "monthly": [
        { "bulan": "Januari", "diperiksa": 1820, "pelanggaran": 78, "tilang": 77, "transfer": 0, "peringatan": 1 },
        { "bulan": "Februari", "diperiksa": 1690, "pelanggaran": 72, "tilang": 71, "transfer": 0, "peringatan": 1 },
        { "bulan": "Maret", "diperiksa": 1880, "pelanggaran": 81, "tilang": 80, "transfer": 0, "peringatan": 0 },
        { "bulan": "April", "diperiksa": 1540, "pelanggaran": 65, "tilang": 64, "transfer": 0, "peringatan": 0 },
        { "bulan": "Mei", "diperiksa": 1790, "pelanggaran": 77, "tilang": 76, "transfer": 0, "peringatan": 1 },
        { "bulan": "Juni", "diperiksa": 1850, "pelanggaran": 80, "tilang": 79, "transfer": 0, "peringatan": 0 },
        { "bulan": "Juli", "diperiksa": 1890, "pelanggaran": 82, "tilang": 81, "transfer": 0, "peringatan": 1 },
        { "bulan": "Agustus", "diperiksa": 1780, "pelanggaran": 76, "tilang": 75, "transfer": 0, "peringatan": 0 },
        { "bulan": "September", "diperiksa": 1710, "pelanggaran": 74, "tilang": 73, "transfer": 0, "peringatan": 1 },
        { "bulan": "Oktober", "diperiksa": 1810, "pelanggaran": 79, "tilang": 78, "transfer": 0, "peringatan": 0 },
        { "bulan": "November", "diperiksa": 1660, "pelanggaran": 71, "tilang": 70, "transfer": 0, "peringatan": 0 },
        { "bulan": "Desember", "diperiksa": 1614, "pelanggaran": 74, "tilang": 74, "transfer": 0, "peringatan": 0 }
      ]
    },
    {
      "kode": "JT004",
      "no": 4,
      "nama": "Cibaragalan",
      "kabupaten": "Kabupaten Purwakarta",
      "wilayah": "Tengah / Priangan",
      "koridor": "Tengah / Priangan (Koridor Purwakarta - Subang)",
      "lat": -6.50387,
      "lng": 107.46548,
      "status": "Aktif",
      "tahun_beroperasi": 1995,
      "alamat": "Jl. Raya Sadang - Subang, Cibaragalan, Kab. Purwakarta",
      "deskripsi": "Fasilitas penimbangan di simpul penyangga Purwakarta-Subang, mencatat peningkatan volume pemeriksaan muatan seiring pertumbuhan kawasan industri.",
      "diperiksa_2024": 8865,
      "diperiksa_2025": 19235,
      "pelanggaran_2024": 640,
      "pelanggaran_2025": 783,
      "kepatuhan_pct": 95.9,
      "penindakan": {
        "tilang_uppkb": 567,
        "tilang_polisi": 0,
        "tilang_lain": 22,
        "transfer_muatan": 0,
        "peringatan": 190
      },
      "intensitas": "Sedang",
      "monthly": [
        { "bulan": "Januari", "diperiksa": 1650, "pelanggaran": 67, "tilang": 48, "transfer": 0, "peringatan": 16 },
        { "bulan": "Februari", "diperiksa": 1520, "pelanggaran": 62, "tilang": 45, "transfer": 0, "peringatan": 15 },
        { "bulan": "Maret", "diperiksa": 1710, "pelanggaran": 70, "tilang": 50, "transfer": 0, "peringatan": 17 },
        { "bulan": "April", "diperiksa": 1420, "pelanggaran": 58, "tilang": 42, "transfer": 0, "peringatan": 14 },
        { "bulan": "Mei", "diperiksa": 1640, "pelanggaran": 66, "tilang": 48, "transfer": 0, "peringatan": 16 },
        { "bulan": "Juni", "diperiksa": 1690, "pelanggaran": 69, "tilang": 50, "transfer": 0, "peringatan": 17 },
        { "bulan": "Juli", "diperiksa": 1730, "pelanggaran": 71, "tilang": 52, "transfer": 0, "peringatan": 17 },
        { "bulan": "Agustus", "diperiksa": 1630, "pelanggaran": 66, "tilang": 48, "transfer": 0, "peringatan": 16 },
        { "bulan": "September", "diperiksa": 1580, "pelanggaran": 64, "tilang": 46, "transfer": 0, "peringatan": 16 },
        { "bulan": "Oktober", "diperiksa": 1660, "pelanggaran": 68, "tilang": 49, "transfer": 0, "peringatan": 17 },
        { "bulan": "November", "diperiksa": 1510, "pelanggaran": 61, "tilang": 44, "transfer": 0, "peringatan": 15 },
        { "bulan": "Desember", "diperiksa": 1485, "pelanggaran": 61, "tilang": 45, "transfer": 0, "peringatan": 16 }
      ]
    },
    {
      "kode": "JT005",
      "no": 5,
      "nama": "Tomo",
      "kabupaten": "Kabupaten Sumedang",
      "wilayah": "Tengah / Priangan",
      "koridor": "Tengah / Priangan (Koridor Arteri Bandung - Cirebon)",
      "lat": -6.76096,
      "lng": 108.14228,
      "status": "Aktif",
      "tahun_beroperasi": 1989,
      "alamat": "Jl. Raya Tomo, Kec. Tomo, Kab. Sumedang",
      "deskripsi": "Fasilitas penimbangan utama koridor tengah Jawa Barat, menyaring angkutan barang lintas Bandung Raya menuju Majalengka, Cirebon, dan Kuningan.",
      "diperiksa_2024": 44889,
      "diperiksa_2025": 35550,
      "pelanggaran_2024": 2461,
      "pelanggaran_2025": 1253,
      "kepatuhan_pct": 96.5,
      "penindakan": {
        "tilang_uppkb": 708,
        "tilang_polisi": 0,
        "tilang_lain": 0,
        "transfer_muatan": 0,
        "peringatan": 542
      },
      "intensitas": "Tinggi",
      "monthly": [
        { "bulan": "Januari", "diperiksa": 3050, "pelanggaran": 108, "tilang": 61, "transfer": 0, "peringatan": 47 },
        { "bulan": "Februari", "diperiksa": 2840, "pelanggaran": 100, "tilang": 56, "transfer": 0, "peringatan": 43 },
        { "bulan": "Maret", "diperiksa": 3150, "pelanggaran": 111, "tilang": 63, "transfer": 0, "peringatan": 48 },
        { "bulan": "April", "diperiksa": 2680, "pelanggaran": 94, "tilang": 53, "transfer": 0, "peringatan": 41 },
        { "bulan": "Mei", "diperiksa": 3020, "pelanggaran": 106, "tilang": 60, "transfer": 0, "peringatan": 46 },
        { "bulan": "Juni", "diperiksa": 3110, "pelanggaran": 109, "tilang": 62, "transfer": 0, "peringatan": 47 },
        { "bulan": "Juli", "diperiksa": 3180, "pelanggaran": 112, "tilang": 63, "transfer": 0, "peringatan": 48 },
        { "bulan": "Agustus", "diperiksa": 3010, "pelanggaran": 105, "tilang": 60, "transfer": 0, "peringatan": 45 },
        { "bulan": "September", "diperiksa": 2930, "pelanggaran": 103, "tilang": 58, "transfer": 0, "peringatan": 45 },
        { "bulan": "Oktober", "diperiksa": 3070, "pelanggaran": 108, "tilang": 61, "transfer": 0, "peringatan": 47 },
        { "bulan": "November", "diperiksa": 2790, "pelanggaran": 98, "tilang": 55, "transfer": 0, "peringatan": 42 },
        { "bulan": "Desember", "diperiksa": 2720, "pelanggaran": 99, "tilang": 56, "transfer": 0, "peringatan": 43 }
      ]
    },
    {
      "kode": "JT006",
      "no": 6,
      "nama": "Kemang",
      "kabupaten": "Kabupaten Bogor",
      "wilayah": "Jabodetabek / Bogor",
      "koridor": "Jabodetabek / Bogor (Koridor Aglomerasi Parung - Bogor)",
      "lat": -6.51892,
      "lng": 106.75827,
      "status": "Aktif",
      "tahun_beroperasi": 1991,
      "alamat": "Jl. Raya Parung - Bogor, Kemang, Kab. Bogor",
      "deskripsi": "Fasilitas penimbangan di simpul aglomerasi barat Jawa Barat, memantau secara intensif kendaraan tambang galian C dan logistik berat lintas Jabodetabek.",
      "diperiksa_2024": 51265,
      "diperiksa_2025": 39756,
      "pelanggaran_2024": 3752,
      "pelanggaran_2025": 1993,
      "kepatuhan_pct": 95.0,
      "penindakan": {
        "tilang_uppkb": 1137,
        "tilang_polisi": 0,
        "tilang_lain": 218,
        "transfer_muatan": 14,
        "peringatan": 623
      },
      "intensitas": "Tinggi",
      "monthly": [
        { "bulan": "Januari", "diperiksa": 3410, "pelanggaran": 171, "tilang": 97, "transfer": 1, "peringatan": 53 },
        { "bulan": "Februari", "diperiksa": 3170, "pelanggaran": 159, "tilang": 91, "transfer": 1, "peringatan": 50 },
        { "bulan": "Maret", "diperiksa": 3530, "pelanggaran": 177, "tilang": 101, "transfer": 1, "peringatan": 55 },
        { "bulan": "April", "diperiksa": 2960, "pelanggaran": 149, "tilang": 85, "transfer": 1, "peringatan": 46 },
        { "bulan": "Mei", "diperiksa": 3390, "pelanggaran": 170, "tilang": 97, "transfer": 1, "peringatan": 53 },
        { "bulan": "Juni", "diperiksa": 3480, "pelanggaran": 175, "tilang": 100, "transfer": 1, "peringatan": 55 },
        { "bulan": "Juli", "diperiksa": 3550, "pelanggaran": 178, "tilang": 102, "transfer": 2, "peringatan": 56 },
        { "bulan": "Agustus", "diperiksa": 3370, "pelanggaran": 169, "tilang": 96, "transfer": 1, "peringatan": 53 },
        { "bulan": "September", "diperiksa": 3280, "pelanggaran": 164, "tilang": 94, "transfer": 1, "peringatan": 51 },
        { "bulan": "Oktober", "diperiksa": 3440, "pelanggaran": 172, "tilang": 98, "transfer": 2, "peringatan": 54 },
        { "bulan": "November", "diperiksa": 3120, "pelanggaran": 156, "tilang": 89, "transfer": 1, "peringatan": 49 },
        { "bulan": "Desember", "diperiksa": 3056, "pelanggaran": 153, "tilang": 87, "transfer": 1, "peringatan": 48 }
      ]
    }
  ]
};

// Global State
var uppkbData = UPPKB_EMBEDDED_DATA;
var mapInstance = null;
var stationMarkers = {};
var stationBuffers = {};
var previousActiveElement = null;

/**
 * Format numbers with Indonesian locale
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Number(num).toLocaleString("id-ID");
}

/**
 * Format percentage
 */
function formatPercent(decimalOrPct) {
  if (decimalOrPct === null || decimalOrPct === undefined) return "0,0%";
  var val = Number(decimalOrPct);
  if (val <= 1.0 && val > 0) val = val * 100;
  return val.toFixed(1).replace(".", ",") + "%";
}

/**
 * Update realtime clock (WIB)
 */
function initClock() {
  function update() {
    var now = new Date();
    var timeEl = document.getElementById("current-time");
    var dateEl = document.getElementById("current-date");

    if (timeEl) {
      var hours = String(now.getHours()).padStart(2, "0");
      var mins = String(now.getMinutes()).padStart(2, "0");
      var secs = String(now.getSeconds()).padStart(2, "0");
      timeEl.textContent = hours + ":" + mins + ":" + secs + " WIB";
    }

    if (dateEl) {
      var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      dateEl.textContent = now.toLocaleDateString("id-ID", options);
    }
  }

  update();
  setInterval(update, 1000);
}

/**
 * Sidebar drawer toggle for mobile
 */
function initSidebar() {
  var toggle = document.getElementById("sidebarToggle");
  var sidebar = document.getElementById("appSidebar");
  var overlay = document.getElementById("sidebarOverlay");
  var closeBtn = document.getElementById("sidebarClose");

  if (!toggle || !sidebar) return;

  function openMenu() {
    sidebar.classList.add("is-open");
    if (overlay) overlay.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sidebar.classList.remove("is-open");
    if (overlay) overlay.setAttribute("hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    if (sidebar.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);
}

/**
 * Render 4 Executive KPI Cards
 */
function renderKPIs() {
  var s = uppkbData.summary || {};
  var totalStationsEl = document.getElementById("kpiTotalStations");
  var totalDiperiksaEl = document.getElementById("kpiTotalDiperiksa");
  var totalPenindakanEl = document.getElementById("kpiTotalPenindakan");
  var avgKepatuhanEl = document.getElementById("kpiAvgKepatuhan");

  if (totalStationsEl) {
    totalStationsEl.textContent = (uppkbData.stations ? uppkbData.stations.length : 6) + " UPPKB";
  }
  if (totalDiperiksaEl) {
    totalDiperiksaEl.textContent = formatNumber(s.total_diperiksa_2025);
  }
  if (totalPenindakanEl) {
    totalPenindakanEl.textContent = formatNumber(s.total_penindakan_2025);
  }
  if (avgKepatuhanEl) {
    avgKepatuhanEl.textContent = formatPercent(s.tingkat_kepatuhan);
  }
}

/**
 * Safe Leaflet Loader with Polling and Dynamic Fallback Injection
 */
function ensureLeafletLoaded(callback, maxAttempts) {
  maxAttempts = maxAttempts || 50;
  var attempts = 0;

  function check() {
    if (typeof L !== "undefined" && typeof L.map === "function") {
      callback();
      return;
    }

    attempts++;
    if (attempts === 10) {
      // If Leaflet is not yet available after ~1s, inject unpkg fallback script
      if (!document.getElementById("leafletFallbackScript")) {
        var fb = document.createElement("script");
        fb.id = "leafletFallbackScript";
        fb.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        document.head.appendChild(fb);
      }
    }

    if (attempts < maxAttempts) {
      setTimeout(check, 100);
    } else {
      showMapError("Pustaka peta (Leaflet) tidak dapat dimuat dari CDN. Silakan periksa koneksi internet Anda.");
    }
  }

  check();
}

function showMapLoading(msg) {
  var mapEl = document.getElementById("uppkbMap");
  if (!mapEl) return;
  var existing = mapEl.querySelector(".map-status-overlay");
  if (existing) existing.remove();

  var overlay = document.createElement("div");
  overlay.className = "map-status-overlay";
  overlay.id = "mapLoadingOverlay";
  overlay.innerHTML =
    '<div class="map-status-spinner"></div>' +
    '<p class="map-status-msg">' + (msg || "Memuat peta fasilitas UPPKB...") + '</p>';
  mapEl.appendChild(overlay);
}

function hideMapStatus() {
  var overlay = document.getElementById("mapLoadingOverlay");
  if (overlay) overlay.remove();
}

function showMapError(errMsg) {
  var mapEl = document.getElementById("uppkbMap");
  if (!mapEl) return;
  var existing = mapEl.querySelector(".map-status-overlay");
  if (existing) existing.remove();

  var overlay = document.createElement("div");
  overlay.className = "map-status-overlay";
  overlay.id = "mapLoadingOverlay";
  overlay.innerHTML =
    '<svg style="width:2.25rem;height:2.25rem;color:#f87171;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' +
    '<p class="map-status-msg">' + (errMsg || "Peta gagal dimuat.") + '</p>' +
    '<button type="button" class="map-retry-btn" onclick="initMap()">Coba Muat Ulang</button>';
  mapEl.appendChild(overlay);
}

/**
 * Initialize Leaflet Map
 */
function initMap() {
  var mapEl = document.getElementById("uppkbMap");
  if (!mapEl) return;

  if (typeof L === "undefined" || typeof L.map !== "function") {
    showMapLoading("Memuat pustaka peta Leaflet...");
    ensureLeafletLoaded(function () {
      initMap();
    });
    return;
  }

  showMapLoading("Menyiapkan layer peta Jawa Barat...");

  try {
    if (mapInstance) {
      try {
        mapInstance.remove();
      } catch (e) {}
      mapInstance = null;
    }

    // Center of West Java
    mapInstance = L.map("uppkbMap", {
      center: [-6.8, 107.6],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: true,
      touchZoom: true
    });

    // Standard reliable OpenStreetMap tiles
    var osmTile = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | BPTD Kelas I Jabar',
      maxZoom: 18
    });

    osmTile.on("tileerror", function () {
      console.warn("Primary tile error, map remains interactive.");
    });

    osmTile.addTo(mapInstance);

    renderMapStations();
    hideMapStatus();

    // Force leaflet to recalculate container size after render
    setTimeout(function () {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 150);

    setTimeout(function () {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 450);

    window.addEventListener("resize", function () {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    });
  } catch (err) {
    console.error("Map initialization error:", err);
    showMapError("Gagal menginisialisasi peta: " + (err.message || "Error"));
  }
}
/**
 * Render UPPKB Station Markers on Map
 */
function renderMapStations() {
  if (!mapInstance || !uppkbData.stations) return;

  // Clear existing
  Object.keys(stationMarkers).forEach(function (k) {
    if (mapInstance.hasLayer(stationMarkers[k])) {
      mapInstance.removeLayer(stationMarkers[k]);
    }
  });
  Object.keys(stationBuffers).forEach(function (k) {
    if (mapInstance.hasLayer(stationBuffers[k])) {
      mapInstance.removeLayer(stationBuffers[k]);
    }
  });
  stationMarkers = {};
  stationBuffers = {};

  var bounds = [];

  uppkbData.stations.forEach(function (st) {
    if (!st.lat || !st.lng) return;

    var latLng = [st.lat, st.lng];
    bounds.push(latLng);

    // Dynamic marker color based on corridor
    var markerColor = "#f59e0b"; // default amber (pantura)
    if (st.wilayah.indexOf("Pantura") !== -1) markerColor = "#f59e0b";
    else if (st.wilayah.indexOf("Priangan") !== -1) markerColor = "#3b82f6";
    else if (st.wilayah.indexOf("Selatan") !== -1) markerColor = "#10b981";
    else if (st.wilayah.indexOf("Bogor") !== -1) markerColor = "#8b5cf6";

    // Surveillance buffer ring (radius ~ 4,000 meters)
    var bufferCircle = L.circle(latLng, {
      radius: 4000,
      color: markerColor,
      weight: 1.5,
      opacity: 0.7,
      fillColor: markerColor,
      fillOpacity: 0.12,
      dashArray: "4, 6"
    }).addTo(mapInstance);
    stationBuffers[st.kode] = bufferCircle;

    // Custom HTML Marker Icon
    var customIcon = L.divIcon({
      className: "uppkb-custom-marker",
      html: '<div class="uppkb-marker-pin" style="background-color: ' + markerColor + ';"></div>' +
            '<div class="uppkb-marker-pulse" style="background-color: ' + markerColor + ';"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -30]
    });

    var marker = L.marker(latLng, { icon: customIcon }).addTo(mapInstance);

    // Popup Content
    var popupHtml =
      '<div class="popup-inner">' +
        '<span class="popup-badge">' + st.kode + '</span>' +
        '<h4 class="popup-title">UPPKB ' + st.nama + '</h4>' +
        '<p class="popup-sub">' + st.kabupaten + '</p>' +
        '<div class="popup-metrics">' +
          '<div><strong>Diperiksa:</strong> ' + formatNumber(st.diperiksa_2025) + ' unit</div>' +
          '<div><strong>Pelanggaran:</strong> <span style="color:#ef4444;font-weight:600;">' + formatNumber(st.pelanggaran_2025) + '</span></div>' +
          '<div><strong>Kepatuhan:</strong> <span style="color:#10b981;font-weight:600;">' + st.kepatuhan_pct + '%</span></div>' +
        '</div>' +
        '<button type="button" class="popup-btn" onclick="openUppkbDetail(\'' + st.kode + '\')">Lihat Rincian Penindakan</button>' +
      '</div>';

    marker.bindPopup(popupHtml, { className: "uppkb-custom-popup", maxWidth: 280 });
    stationMarkers[st.kode] = marker;
  });

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [40, 40] });
  }
}

/**
 * Focus Map on Specific UPPKB
 */
function focusUppkbOnMap(kode) {
  var st = (uppkbData.stations || []).find(function (s) { return s.kode === kode; });
  if (!st || !mapInstance) return;

  var marker = stationMarkers[kode];
  mapInstance.setView([st.lat, st.lng], 12, { animate: true });

  if (marker) {
    setTimeout(function () {
      marker.openPopup();
    }, 300);
  }

  // Scroll to map smoothly
  var mapCard = document.querySelector(".uppkb-map-card");
  if (mapCard) {
    mapCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Render UPPKB Grid Directory
 */
function renderGrid(stations) {
  var gridEl = document.getElementById("uppkbGrid");
  var resultCountEl = document.getElementById("resultCount");
  if (!gridEl) return;

  var list = stations || uppkbData.stations || [];

  if (resultCountEl) {
    resultCountEl.textContent = "Menampilkan " + list.length + " fasilitas UPPKB";
  }

  if (list.length === 0) {
    gridEl.innerHTML =
      '<div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-muted); background: #ffffff; border-radius: 0.75rem; border: 1px dashed var(--border);">' +
        '<svg style="width: 2.5rem; height: 2.5rem; margin: 0 auto 0.75rem auto; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' +
        '<p style="font-weight: 600; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">Tidak ada fasilitas UPPKB yang cocok</p>' +
        '<p style="font-size: 0.85rem;">Coba sesuaikan kata kunci pencarian atau filter koridor/wilayah.</p>' +
      '</div>';
    return;
  }

  var html = "";
  list.forEach(function (st) {
    var p = st.penindakan || {};
    var kepatuhan = st.kepatuhan_pct || 85.0;

    html +=
      '<article class="uppkb-card" data-kode="' + st.kode + '">' +
        '<div>' +
          '<div class="uppkb-card-header">' +
            '<div>' +
              '<span class="uppkb-code-pill">' + st.kode + '</span>' +
              '<h4 class="uppkb-title">UPPKB ' + st.nama + '</h4>' +
              '<span class="uppkb-region">' +
                '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>' +
                st.kabupaten +
              '</span>' +
            '</div>' +
            '<span class="uppkb-status-badge">' + st.status + '</span>' +
          '</div>' +

          '<span class="uppkb-corridor-tag">' + st.koridor + '</span>' +

          '<div class="uppkb-stats-grid">' +
            '<div class="uppkb-stat-item">' +
              '<span class="uppkb-stat-label">Diperiksa 2025</span>' +
              '<span class="uppkb-stat-val">' + formatNumber(st.diperiksa_2025) + '</span>' +
              '<span class="uppkb-stat-sub">2024: ' + formatNumber(st.diperiksa_2024) + '</span>' +
            '</div>' +
            '<div class="uppkb-stat-item">' +
              '<span class="uppkb-stat-label">Penindakan</span>' +
              '<span class="uppkb-stat-val text-red">' + formatNumber(st.pelanggaran_2025) + '</span>' +
              '<span class="uppkb-stat-sub">Tilang: ' + formatNumber(p.tilang_uppkb) + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="uppkb-progress-wrap">' +
            '<div class="uppkb-progress-label-row">' +
              '<span class="uppkb-progress-title">Tingkat Kepatuhan Tonase</span>' +
              '<span class="uppkb-progress-val">' + kepatuhan + '%</span>' +
            '</div>' +
            '<div class="uppkb-progress-bar">' +
              '<div class="uppkb-progress-fill" style="width: ' + kepatuhan + '%;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="uppkb-card-actions">' +
          '<button type="button" class="btn-card-focus" onclick="focusUppkbOnMap(\'' + st.kode + '\')">' +
            '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>' +
            'Fokus Peta' +
          '</button>' +
          '<button type="button" class="btn-card-detail" onclick="openUppkbDetail(\'' + st.kode + '\')">' +
            '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' +
            'Rincian Penindakan' +
          '</button>' +
        '</div>' +
      '</article>';
  });

  gridEl.innerHTML = html;
}

/**
 * Filter handler
 */
function applyFilters() {
  var searchInput = document.getElementById("searchUppkb");
  var filterWilayah = document.getElementById("filterWilayah");
  var filterIntensitas = document.getElementById("filterIntensitas");

  var q = searchInput ? searchInput.value.toLowerCase().trim() : "";
  var wilayah = filterWilayah ? filterWilayah.value : "";
  var intensitas = filterIntensitas ? filterIntensitas.value : "";

  var filtered = (uppkbData.stations || []).filter(function (st) {
    if (q) {
      var matchQ =
        st.nama.toLowerCase().indexOf(q) !== -1 ||
        st.kode.toLowerCase().indexOf(q) !== -1 ||
        st.kabupaten.toLowerCase().indexOf(q) !== -1 ||
        st.alamat.toLowerCase().indexOf(q) !== -1 ||
        st.koridor.toLowerCase().indexOf(q) !== -1;
      if (!matchQ) return false;
    }

    if (wilayah && st.wilayah.indexOf(wilayah) === -1) {
      return false;
    }

    if (intensitas && st.intensitas !== intensitas) {
      return false;
    }

    return true;
  });

  renderGrid(filtered);
}

/**
 * Open Detail Modal Dialog
 */
function openUppkbDetail(kode) {
  var st = (uppkbData.stations || []).find(function (s) { return s.kode === kode; });
  if (!st) return;

  previousActiveElement = document.activeElement;

  var modal = document.getElementById("uppkbModal");
  var backdrop = document.getElementById("modalBackdrop");
  if (!modal || !backdrop) return;

  var p = st.penindakan || {};

  // Fill Header Elements
  var idBadge = document.getElementById("modalIdBadge");
  var kabBadge = document.getElementById("modalKabupatenBadge");
  var kepatuhanBadge = document.getElementById("modalKepatuhanBadge");
  var title = document.getElementById("modalTitle");
  var subInfo = document.getElementById("modalSubInfo");

  if (idBadge) idBadge.textContent = st.kode;
  if (kabBadge) kabBadge.textContent = st.kabupaten;
  if (kepatuhanBadge) kepatuhanBadge.textContent = "Kepatuhan " + st.kepatuhan_pct + "%";
  if (title) title.textContent = "UPPKB " + st.nama;
  if (subInfo) subInfo.textContent = st.koridor + " · Beroperasi sejak " + st.tahun_beroperasi;

  // Overview Stats
  var diperiksa = document.getElementById("modalDiperiksa");
  var diperiksa2024 = document.getElementById("modalDiperiksa2024");
  var pelanggaran = document.getElementById("modalPelanggaran");
  var pelanggaran2024 = document.getElementById("modalPelanggaran2024");
  var kepatuhanVal = document.getElementById("modalKepatuhanVal");

  if (diperiksa) diperiksa.textContent = formatNumber(st.diperiksa_2025) + " Kendaraan";
  if (diperiksa2024) diperiksa2024.textContent = "Realisasi 2024: " + formatNumber(st.diperiksa_2024);
  if (pelanggaran) pelanggaran.textContent = formatNumber(st.pelanggaran_2025) + " Penindakan";
  if (pelanggaran2024) pelanggaran2024.textContent = "Realisasi 2024: " + formatNumber(st.pelanggaran_2024);
  if (kepatuhanVal) kepatuhanVal.textContent = st.kepatuhan_pct + "%";

  // Enforcement Composition
  var tilangUppkb = document.getElementById("modalTilangUppkb");
  var tilangPolisi = document.getElementById("modalTilangPolisi");
  var transferMuatan = document.getElementById("modalTransferMuatan");
  var peringatan = document.getElementById("modalPeringatan");

  if (tilangUppkb) tilangUppkb.textContent = formatNumber(p.tilang_uppkb);
  if (tilangPolisi) tilangPolisi.textContent = formatNumber(p.tilang_polisi);
  if (transferMuatan) transferMuatan.textContent = formatNumber(p.transfer_muatan);
  if (peringatan) peringatan.textContent = formatNumber(p.peringatan);

  // Description and Address
  var deskripsi = document.getElementById("modalDeskripsi");
  var alamat = document.getElementById("modalAlamat");
  if (deskripsi) deskripsi.textContent = st.deskripsi;
  if (alamat) alamat.innerHTML = "<strong>Alamat:</strong> " + st.alamat;

  // Monthly Table
  var monthlyBody = document.getElementById("modalMonthlyBody");
  if (monthlyBody) {
    var rows = "";
    (st.monthly || []).forEach(function (m) {
      var pct = ((m.diperiksa - m.pelanggaran) / m.diperiksa * 100).toFixed(1).replace(".", ",") + "%";
      rows +=
        "<tr>" +
          "<td><strong>" + m.bulan + "</strong></td>" +
          "<td>" + formatNumber(m.diperiksa) + "</td>" +
          '<td class="text-red"><strong>' + formatNumber(m.pelanggaran) + "</strong></td>" +
          "<td>" + formatNumber(m.tilang) + "</td>" +
          "<td>" + formatNumber(m.transfer) + "</td>" +
          "<td>" + formatNumber(m.peringatan) + "</td>" +
          '<td class="text-green"><strong>' + pct + "</strong></td>" +
        "</tr>";
    });
    monthlyBody.innerHTML = rows;
  }

  // Footer focus button
  var focusBtn = document.getElementById("modalFocusMapBtn");
  if (focusBtn) {
    focusBtn.onclick = function () {
      closeUppkbModal();
      focusUppkbOnMap(st.kode);
    };
  }

  // Show modal and backdrop
  backdrop.removeAttribute("hidden");
  modal.removeAttribute("hidden");

  // Focus close button for accessibility
  var closeBtn = document.getElementById("modalCloseBtn");
  if (closeBtn) closeBtn.focus();
}

/**
 * Close Detail Modal Dialog
 */
function closeUppkbModal() {
  var modal = document.getElementById("uppkbModal");
  var backdrop = document.getElementById("modalBackdrop");
  if (!modal || !backdrop) return;

  modal.setAttribute("hidden", "true");
  backdrop.setAttribute("hidden", "true");

  if (previousActiveElement && typeof previousActiveElement.focus === "function") {
    previousActiveElement.focus();
  }
}

/**
 * Modal event listeners
 */
function initModalListeners() {
  var closeBtn = document.getElementById("modalCloseBtn");
  var closeFooterBtn = document.getElementById("modalCloseFooterBtn");
  var backdrop = document.getElementById("modalBackdrop");

  if (closeBtn) closeBtn.addEventListener("click", closeUppkbModal);
  if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeUppkbModal);
  if (backdrop) backdrop.addEventListener("click", closeUppkbModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var modal = document.getElementById("uppkbModal");
      if (modal && !modal.hasAttribute("hidden")) {
        closeUppkbModal();
      }
    }
  });
}

/**
 * Setup search and filter input event listeners
 */
function initFilterListeners() {
  var searchInput = document.getElementById("searchUppkb");
  var filterWilayah = document.getElementById("filterWilayah");
  var filterIntensitas = document.getElementById("filterIntensitas");

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (filterWilayah) {
    filterWilayah.addEventListener("change", applyFilters);
  }
  if (filterIntensitas) {
    filterIntensitas.addEventListener("change", applyFilters);
  }
}

/**
 * Fetch live data from /api/getDashboardData in background (non-blocking)
 */
async function loadData() {
  try {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 3500) : null;

    var fetchOptions = controller ? { signal: controller.signal } : {};
    var res = await fetch("/api/getDashboardData", fetchOptions);
    clearTimeout(timeoutId);

    if (res.ok) {
      var json = await res.json();
      if (json && json.ok && json.data && json.data.uppkbPoints) {
        var pts = json.data.uppkbPoints;
        if (Array.isArray(pts) && pts.length >= 6) {
          var statusPill = document.getElementById("apiStatusOk");
          if (statusPill) {
            statusPill.innerHTML = '<span class="api-dot" aria-hidden="true"></span> Gateway API Terhubung';
          }
        }
      }
    }
  } catch (err) {
    // Offline or localhost without /api — embedded official data is already active
    console.info("Using embedded authoritative dataset for UPPKB:", err.name === "AbortError" ? "Fetch timeout" : err.message);
  }
}

/**
 * Global initialization function
 */
function initUppkbModule() {
  initClock();
  initSidebar();
  initModalListeners();
  initFilterListeners();

  // 1. Immediately render UI and Map with embedded data (Zero delay, instant display)
  renderKPIs();
  renderGrid(uppkbData.stations);
  initMap();

  // 2. Non-blocking background gateway check
  loadData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUppkbModule);
} else {
  initUppkbModule();
}

// Export functions to window for onclick handlers
if (typeof window !== "undefined") {
  window.initMap = initMap;
  window.openUppkbDetail = openUppkbDetail;
  window.closeUppkbModal = closeUppkbModal;
  window.focusUppkbOnMap = focusUppkbOnMap;
}
