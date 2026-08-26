/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center Prototype
   PHASE 14D — fondasi data live (read-only) melalui gateway resmi /api/.

   Endpoint yang dipanggil (KEDUANYA VERIFIED read-only):
     - getAvailableYears
     - getDashboardData

   Transport memakai POST (sesuai gateway Pages Functions), tetapi kedua
   action tersebut sudah diverifikasi read-only (PHASE 14C audit).

   TIDAK ada wrapper untuk endpoint write. TIDAK ada dependency eksternal.
   Semua data demo lama tetap diberi label eksplisit (DATA DEMO / SIMULASI /
   METODOLOGI BELUM DITETAPKAN / BELUM TERHUBUNG API).
   ===================================================================== */

(function () {
    "use strict";

    /* =================================================================
       1. Konstanta & state
       ================================================================= */
    var API_BASE = "/api";
    var REQUEST_TIMEOUT_MS = 15000; // timeout wajar untuk cold-start GAS
    var REQUEST_VERB = "POST";
    var REQUEST_HEADERS = { "content-type": "application/json" };

    // Penghitung request; digunakan untuk membatalkan respons basi saat
    // pengguna cepat mengganti tahun. rpc() mengembalikan null untuk respons
    // basi, dan caller mengabaikannya.
    var lastRequestId = 0;

    // State tahun aktif
    var selectedYear = null;

    /* =================================================================
       2. Util aman: setText (textContent saja, TANPA innerHTML)
       ================================================================= */
    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }

    function setHidden(id, hidden) {
        var el = document.getElementById(id);
        if (el) {
            el.hidden = !!hidden;
        }
    }

    function setVisible(id, visible) {
        var el = document.getElementById(id);
        if (el) {
            if (visible) {
                el.classList.remove("is-hidden");
            } else {
                el.classList.add("is-hidden");
            }
        }
    }

    function setTextClass(id, cls) {
        var el = document.getElementById(id);
        if (el) {
            el.className = cls;
        }
    }

    /* =================================================================
       3. Format angka Indonesia (id-ID)
       ================================================================= */
    function formatNumber(n) {
        if (n === null || n === undefined || isNaN(n)) {
            return "—";
        }
        var num = Number(n);
        if (!isFinite(num)) {
            return "—";
        }
        return num.toLocaleString("id-ID", { maximumFractionDigits: 0 });
    }

    function formatRatio(n) {
        if (n === null || n === undefined || isNaN(n)) {
            return "—";
        }
        var num = Number(n);
        if (!isFinite(num)) {
            return "—";
        }
        return num.toLocaleString("id-ID", { maximumFractionDigits: 2 });
    }

    function formatPercent(n) {
        if (n === null || n === undefined || isNaN(n)) {
            return "—";
        }
        var num = Number(n);
        if (!isFinite(num)) {
            return "—";
        }
        return num.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "%";
    }

    function formatTimeWIB(now) {
        var fmt = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        return fmt.format(now);
    }

    /* =================================================================
       4. Client API read-only (2 endpoint saja)
       ================================================================= */

    // Caller yang menaikkan lastRequestId (membatalkan request lama),
    // lalu meneruskan requestId ke rpc(). Hanya requestId paling baru yang
    // berhak menggambar UI.
    function isCurrent(requestId) {
        return requestId === lastRequestId;
    }

    function rpc(name, args, requestId) {
        return new Promise(function (resolve, reject) {
            var controller = null;
            if (window.AbortController) {
                controller = new AbortController();
            }
            var timedOut = false;
            var timer = setTimeout(function () {
                timedOut = true;
                if (controller) {
                    controller.abort();
                } else {
                    reject(new Error("timeout"));
                }
            }, REQUEST_TIMEOUT_MS);

            var opts = {
                method: REQUEST_VERB,
                headers: REQUEST_HEADERS,
                body: JSON.stringify({ fn: name, args: args || [] })
            };
            if (controller) {
                opts.signal = controller.signal;
            }

            fetch(API_BASE + "/" + name, opts)
                .then(function (res) {
                    return res.text().then(function (txt) {
                        return { ok: res.ok, status: res.status, body: txt };
                    });
                })
                .then(function (pack) {
                    var payload;
                    try {
                        payload = JSON.parse(pack.body);
                    } catch (e) {
                        throw new Error("respons bukan JSON");
                    }
                    // Hanya panggilan terbaru yang berhak menggambar UI.
                    if (!isCurrent(requestId)) {
                        return resolve(null); // respons basi → abaikan
                    }
                    // Cek body.ok, jangan hanya HTTP status.
                    if (pack.ok && payload && payload.ok === true) {
                        return resolve(payload.data);
                    }
                    var msg = (payload && payload.error) ? String(payload.error) : "Terjadi kesalahan pada server.";
                    reject(new Error(msg));
                })
                .catch(function (err) {
                    if (!isCurrent(requestId)) {
                        return resolve(null); // respons basi → abaikan
                    }
                    if (timedOut) {
                        reject(new Error("timeout"));
                    } else if (err && err.name === "AbortError") {
                        reject(new Error("dibatalkan"));
                    } else {
                        reject(new Error("network"));
                    }
                })
                .then(function () {
                    clearTimeout(timer);
                }, function () {
                    clearTimeout(timer);
                });
        });
    }

    /* =================================================================
       5. Ambil tahun → isi select → panggil dashboardData
       ================================================================= */
    function initYears() {
        var select = document.getElementById("yearSelect");
        if (!select) {
            return;
        }

        var requestId = ++lastRequestId;

        return rpc("getAvailableYears", [], requestId)
            .then(function (years) {
                if (!isCurrent(requestId)) {
                    return null;
                }
                if (!years || !years.length) {
                    throw new Error("empty");
                }
                // Isi <option> tanpa innerHTML.
                select.replaceChildren();
                years.forEach(function (y) {
                    var opt = document.createElement("option");
                    opt.value = String(y);
                    opt.textContent = String(y);
                    select.appendChild(opt);
                });
                selectedYear = years[0]; // tahun terbaru = default
                select.value = String(selectedYear);
                loadDashboardData();
                return null;
            })
            .catch(function (err) {
                if (!isCurrent(requestId)) {
                    return null;
                }
                setApiState(false, "Gagal memuat daftar tahun. " + friendlyError(err));
                return null;
            });
    }

    /* =================================================================
       6. Ambil dashboardData untuk tahun terpilih
       ================================================================= */
    function loadDashboardData() {
        var year = selectedYear;
        var requestId = ++lastRequestId; // batalkan request lama yang tertunda

        setKpiLoading();
        setInsightLoading();
        setApiState(true, null); // status "memuat"

        return rpc("getDashboardData", [{ tahun: year }], requestId)
            .then(function (data) {
                if (!isCurrent(requestId)) {
                    return null; // stale — abaikan
                }
                if (!data) {
                    return null;
                }
                renderLive(data, year);
                setApiState(true, null);
                return null;
            })
            .catch(function (err) {
                if (!isCurrent(requestId)) {
                    return null; // stale — abaikan
                }
                setKpiError();
                setInsightError();
                setApiState(false, friendlyError(err));
                return null;
            });
    }

    function friendlyError(err) {
        if (!err || !err.message) {
            return "Jaringan tidak tersedia.";
        }
        if (err.message === "timeout") {
            return "Waktu permintaan habis. Coba lagi.";
        }
        if (err.message === "network") {
            return "Jaringan tidak tersedia.";
        }
        if (err.message === "empty") {
            return "Belum ada data tahun yang tersedia.";
        }
        return err.message;
    }

    /* =================================================================
       7. State KPI: loading / sukses / error
       ================================================================= */
    function setKpiLoading() {
        var ids = ["kpiPenumpang", "kpiKendaraan", "kpiTerminal", "kpiUppkb"];
        ids.forEach(function (id) {
            setTextClass(id, "kpi-value kpi-value-loading");
            setText(id, "Memuat…");
        });
        setText("kpiInsightPuncak", "Memuat…");
        setText("kpiInsightTren", "Memuat…");
        setHidden("yearLoading", false);
    }

    function setKpiError() {
        var ids = ["kpiPenumpang", "kpiKendaraan", "kpiTerminal", "kpiUppkb"];
        ids.forEach(function (id) {
            setTextClass(id, "kpi-value kpi-value-error");
            setText(id, "—");
        });
        setText("kpiInsightPuncak", "—");
        setText("kpiInsightTren", "—");
        setHidden("yearLoading", true);
    }

    function setInsightLoading() {
        setTextClass("kpiInsightPuncak", "insight-value insight-value-loading");
        setTextClass("kpiInsightTren", "insight-value insight-value-loading");
    }

    function setInsightError() {
        setTextClass("kpiInsightPuncak", "insight-value insight-value-error");
        setTextClass("kpiInsightTren", "insight-value insight-value-error");
    }

    /* =================================================================
       8. Render data live ke KPI + insight minimal
       ================================================================= */
    function renderLive(d, year) {
        if (!d || !d.summary) {
            throw new Error("Data tidak memiliki ringkasan.");
        }

        var s = d.summary || {};
        var penumpang = (Number(s.kedatangan_penumpang) || 0) + (Number(s.keberangkatan_penumpang) || 0);
        var kendaraan = (Number(s.kedatangan_kendaraan) || 0) + (Number(s.keberangkatan_kendaraan) || 0);
        var terminalCount = (d.points && d.points.length) || 0;
        var uppkbCount = (d.uppkbPoints && d.uppkbPoints.length) || 0;

        setTextClass("kpiPenumpang", "kpi-value kpi-value-live");
        setTextClass("kpiKendaraan", "kpi-value kpi-value-live");
        setTextClass("kpiTerminal", "kpi-value kpi-value-live");
        setTextClass("kpiUppkb", "kpi-value kpi-value-live");

        setText("kpiPenumpang", formatNumber(penumpang));
        setText("kpiKendaraan", formatNumber(kendaraan));
        setText("kpiTerminal", formatNumber(terminalCount));
        setText("kpiUppkb", formatNumber(uppkbCount));

        // Konteks tahun aktif pada setiap KPI
        setText("kpiPenumpangYear", "Tahun " + year);
        setText("kpiKendaraanYear", "Tahun " + year);
        setText("kpiTerminalYear", "Tahun " + year);
        setText("kpiUppkbYear", "Tahun " + year);

        // Label netral pengganti YoY (fase ini TANPA YoY)
        setText("kpiPenumpangTrend", "Data produksi tahun berjalan");
        setText("kpiKendaraanTrend", "Data produksi tahun berjalan");

        // ---- Insight minimal (TASK 5) ----
        var ins = d.insights || {};
        renderInsightPuncak(ins.puncakBulan, year);
        renderInsightTren(ins.tren, ins.delta, year);
        renderInsightRasio(ins.loadFactor, year);

        // Sembunyikan status demo-dulu di insight
        setHidden("insightDemoNote", true);
        setHidden("yearLoading", true);
    }

    function renderInsightPuncak(puncak, year) {
        var el = document.getElementById("kpiInsightPuncak");
        if (!el) {
            return;
        }
        if (!puncak || !puncak.bulan || !puncak.penumpang) {
            setTextClass("kpiInsightPuncak", "insight-value insight-value-error");
            setText("kpiInsightPuncak", "Belum tersedia");
            setText("kpiInsightPuncakSub", "Berdasarkan data yang tersedia");
            return;
        }
        var bulanId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                       "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        var nama = (puncak.nama && puncak.nama !== "-") ? puncak.nama : bulanId[puncak.bulan - 1] || String(puncak.bulan);
        setTextClass("kpiInsightPuncak", "insight-value insight-value-live");
        setText("kpiInsightPuncak", nama + " " + year);
        setText("kpiInsightPuncakSub", formatNumber(puncak.penumpang) + " penumpang · berdasarkan data yang tersedia");
    }

    function renderInsightTren(tren, delta, year) {
        var el = document.getElementById("kpiInsightTren");
        if (!el) {
            return;
        }
        // Tren adalah perubahan antara dua bulan terakhir yang TERSEDIA.
        // Backend menghitung dari bulan yang punya data; kita hanya memberi
        // label netral, tidak menganggap bulan terakhir "lengkap".
        if (!tren || !tren.dari || !tren.ke || tren.persen === null || tren.persen === undefined) {
            setTextClass("kpiInsightTren", "insight-value insight-value-error");
            setText("kpiInsightTren", "Belum tersedia");
            setText("kpiInsightTrenSub", "Berdasarkan data yang tersedia");
            return;
        }
        var arah = tren.arah === "naik" ? "Naik" : (tren.arah === "turun" ? "Turun" : "Stabil");
        setTextClass("kpiInsightTren", "insight-value insight-value-live");
        setText("kpiInsightTren", arah + " " + formatPercent(tren.persen));
        setText("kpiInsightTrenSub", tren.dari + " → " + tren.ke + " " + year + " · berdasarkan data yang tersedia");
    }

    function renderInsightRasio(loadFactor, year) {
        // Bukan persentase — rasio penumpang per pergerakan kendaraan.
        var el = document.getElementById("kpiInsightRasio");
        if (!el) {
            return;
        }
        if (loadFactor === null || loadFactor === undefined || isNaN(loadFactor)) {
            setTextClass("kpiInsightRasio", "insight-value insight-value-error");
            setText("kpiInsightRasio", "Belum tersedia");
            setText("kpiInsightRasioSub", "Rata-rata penumpang per pergerakan kendaraan · " + year);
            return;
        }
        setTextClass("kpiInsightRasio", "insight-value insight-value-live");
        setText("kpiInsightRasio", formatRatio(loadFactor));
        setText("kpiInsightRasioSub", "Rata-rata penumpang per pergerakan kendaraan · " + year);
    }

    /* =================================================================
       9. Status API + timestamp + retry (TASK 6)
       ================================================================= */
    function setApiState(ok, errorMsg) {
        var okEl = document.getElementById("apiStatusOk");
        var errEl = document.getElementById("apiStatusErr");
        var retryBtn = document.getElementById("retryBtn");
        var tsEl = document.getElementById("dataTimestamp");
        var kpiYear = document.getElementById("kpiYearContext");

        if (ok) {
            if (okEl) {
                okEl.hidden = false;
            }
            if (errEl) {
                errEl.hidden = true;
            }
            if (retryBtn) {
                retryBtn.hidden = true;
            }
            if (tsEl) {
                tsEl.textContent = "Data dimuat: " + formatTimeWIB(new Date()) + " WIB";
                tsEl.hidden = false;
            }
            if (kpiYear) {
                kpiYear.textContent = "Tahun " + selectedYear;
                kpiYear.hidden = false;
            }
            return;
        }

        // Gagal
        if (okEl) {
            okEl.hidden = true;
        }
        if (errEl) {
            errEl.hidden = false;
        }
        if (retryBtn) {
            retryBtn.hidden = false;
        }
        if (tsEl) {
            tsEl.hidden = true;
        }
        if (kpiYear) {
            kpiYear.hidden = true;
        }
        if (errorMsg) {
            setText("apiErrorText", errorMsg);
        }
    }

    /* =================================================================
       10. Clock WIB (existing behavior)
       ================================================================= */
    var BULAN_ID = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    var HARI_ID = [
        "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
    ];

    function updateClock() {
        var now = new Date();
        var fmt = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
        var timeFmt = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        setText("current-date", fmt.format(now));
        setText("current-time", timeFmt.format(now) + " WIB");
    }

    /* =================================================================
       11. Sidebar mobile (existing behavior)
       ================================================================= */
    var sidebar = document.getElementById("appSidebar");
    var overlay = document.getElementById("sidebarOverlay");
    var toggleBtn = document.getElementById("sidebarToggle");

    function isMobile() {
        return window.matchMedia("(max-width: 767px)").matches;
    }

    function setSidebarOpen(open) {
        if (!sidebar || !overlay || !toggleBtn) {
            return;
        }
        sidebar.classList.toggle("is-open", open);
        overlay.classList.toggle("is-visible", open);
        overlay.hidden = !open;
        toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
        toggleBtn.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
    }

    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener("click", function () {
            var isOpen = sidebar.classList.contains("is-open");
            setSidebarOpen(!isOpen);
        });

        overlay.addEventListener("click", function () {
            setSidebarOpen(false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
                setSidebarOpen(false);
                toggleBtn.focus();
            }
        });
    }

    window.addEventListener("resize", function () {
        if (!isMobile() && sidebar && sidebar.classList.contains("is-open")) {
            setSidebarOpen(false);
        }
    });

    /* =================================================================
       12. Top Movers tabs (existing behavior)
       ================================================================= */
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
    var tabPanels = {};

    tabs.forEach(function (tab) {
        var panelId = tab.getAttribute("aria-controls");
        var panel = document.getElementById(panelId);
        if (panel) {
            tabPanels[tab.id] = panel;
        }
        tab.addEventListener("click", function () {
            activateTab(tab);
        });
    });

    function activateTab(selectedTab) {
        tabs.forEach(function (tab) {
            var isSelected = tab === selectedTab;
            tab.setAttribute("aria-selected", isSelected ? "true" : "false");
            tab.classList.toggle("mover-tab-active", isSelected);
            if (isSelected) {
                tab.setAttribute("tabindex", "0");
            } else {
                tab.setAttribute("tabindex", "-1");
            }
            var panel = tabPanels[tab.id];
            if (panel) {
                panel.hidden = !isSelected;
            }
        });
    }

    var tablist = document.querySelector('[role="tablist"]');
    if (tablist) {
        tablist.addEventListener("keydown", function (e) {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
                return;
            }
            e.preventDefault();
            var currentIndex = tabs.indexOf(document.activeElement);
            if (currentIndex === -1) {
                return;
            }
            var nextIndex;
            if (e.key === "ArrowRight") {
                nextIndex = (currentIndex + 1) % tabs.length;
            } else {
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            }
            activateTab(tabs[nextIndex]);
            tabs[nextIndex].focus();
        });
    }

    /* =================================================================
       13. Inisialisasi
       ================================================================= */
    document.addEventListener("DOMContentLoaded", function () {
        var selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
        if (selectedTab) {
            activateTab(selectedTab);
        }

        updateClock();
        setInterval(updateClock, 1000);

        // Retry manual (TASK 2: tombol, bukan loop tanpa batas)
        var retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
            retryBtn.addEventListener("click", function () {
                if (selectedYear) {
                    loadDashboardData();
                } else {
                    initYears();
                }
            });
        }

        // Perubahan tahun → muat ulang data (TASK 3)
        var select = document.getElementById("yearSelect");
        if (select) {
            select.addEventListener("change", function () {
                selectedYear = Number(select.value);
                loadDashboardData();
            });
        }

        // Muat tahun + data awal
        initYears();
    });
})();
