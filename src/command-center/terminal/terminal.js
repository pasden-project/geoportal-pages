/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center Modul Terminal (PHASE 15C)
   Data operasional, direktori, dan profil terminal penumpang
   Read-only API gateway:
     - getAvailableYears
     - getDashboardData ({ tahun })
     - getDashboardData ({ tahun, kode_terminal })
     - getTerminalDetail (kode)
   ===================================================================== */

(function () {
    "use strict";

    /* =================================================================
       1. Konstanta & State Aplikasi
       ================================================================= */
    var API_BASE = "/api";
    var REQUEST_TIMEOUT_MS = 15000;
    var REQUEST_VERB = "POST";
    var REQUEST_HEADERS = { "content-type": "application/json" };

    // Request ID untuk mencegah race conditions saat pergantian tahun & inisialisasi tahun
    var lastRequestId = 0;
    var detailRequestId = 0;
    var yearsRequestId = 0;

    // State data
    var selectedYear = null;
    var availableYears = [];
    var allTerminals = [];
    var filteredTerminals = [];
    var activeFilter = {
        query: "",
        type: "",
        location: ""
    };

    // State modal detail
    var modalOpen = false;
    var activeDetailTerminal = null;
    var lastFocusedElement = null;

    /* =================================================================
       2. Sanitasi & Utility Format
       ================================================================= */
    function escapeHtml(str) {
        if (str === null || str === undefined) {
            return "";
        }
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

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

    function formatNumber(n) {
        if (n === null || n === undefined || isNaN(n)) {
            return "0";
        }
        var num = Number(n);
        if (!isFinite(num)) {
            return "0";
        }
        return num.toLocaleString("id-ID", { maximumFractionDigits: 0 });
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

    function formatTypeLabel(tipe) {
        var s = String(tipe || "").trim();
        if (s.toUpperCase() === "A") return "Tipe A";
        if (s.toUpperCase() === "B") return "Tipe B";
        if (s.toUpperCase() === "C") return "Tipe C";
        if (s.toUpperCase() === "KA") return "Kereta Api";
        if (s.toUpperCase() === "BANDARA") return "Bandara";
        if (s.toUpperCase() === "UPPKB") return "UPPKB";
        return s || "—";
    }

    function getTypeClass(tipe) {
        var t = String(tipe || "").toUpperCase();
        if (t === "A" || t.indexOf("TIPE A") >= 0) return "badge-type-a";
        if (t === "B" || t.indexOf("TIPE B") >= 0) return "badge-type-b";
        if (t === "C" || t.indexOf("TIPE C") >= 0) return "badge-type-c";
        return "badge-type-other";
    }

    /* =================================================================
       3. Client RPC (Read-Only)
       ================================================================= */
    function isCurrent(reqId) {
        return reqId === lastRequestId;
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

                    if (requestId !== undefined && !isCurrent(requestId)) {
                        return resolve(null); // respons basi
                    }

                    if (pack.ok && payload && payload.ok === true) {
                        return resolve(payload.data);
                    }
                    var msg = (payload && payload.error) ? String(payload.error) : "Terjadi kesalahan pada server.";
                    reject(new Error(msg));
                })
                .catch(function (err) {
                    if (requestId !== undefined && !isCurrent(requestId)) {
                        return resolve(null); // respons basi
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
       4. Jam & Tanggal Sistem
       ================================================================= */
    function updateClock() {
        var now = new Date();
        var fmt = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        var timeFmt = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        setText("current-date", fmt.format(now));
        setText("current-time", timeFmt.format(now) + " WIB");
    }

    /* =================================================================
       5. Memuat Daftar Tahun
       ================================================================= */
    function initYears() {
        var select = document.getElementById("yearSelect");
        if (!select) return;

        yearsRequestId++;
        var curYearsReq = yearsRequestId;

        select.innerHTML = '<option value="">Memuat tahun…</option>';
        select.disabled = true;

        rpc("getAvailableYears", [])
            .then(function (years) {
                if (curYearsReq !== yearsRequestId) return;
                if (!Array.isArray(years) || years.length === 0) {
                    throw new Error("Daftar tahun kosong dari server");
                }

                availableYears = years.slice().sort(function (a, b) { return Number(b) - Number(a); });

                select.innerHTML = "";
                availableYears.forEach(function (y) {
                    var opt = document.createElement("option");
                    opt.value = String(y);
                    opt.textContent = "Tahun " + y;
                    select.appendChild(opt);
                });

                select.disabled = false;
                selectedYear = Number(availableYears[0]);
                select.value = String(selectedYear);

                setHidden("selectedYearBadge", false);
                setText("selectedYearBadgeText", "Tahun Terpilih");

                loadTerminalData(selectedYear);
            })
            .catch(function (err) {
                if (curYearsReq !== yearsRequestId) return;
                // Jangan memalsukan data tahun [2026, 2025]. Tampilkan kegagalan secara faktual.
                availableYears = [];
                selectedYear = null;
                select.innerHTML = '<option value="">Tahun tidak tersedia</option>';
                select.disabled = true;

                setHidden("selectedYearBadge", true);
                setText("selectedYearBadgeText", "Tahun tidak tersedia");

                setHidden("apiStatusOk", true);
                setHidden("apiStatusErr", false);

                var errText = document.getElementById("apiErrorText");
                if (errText) {
                    errText.textContent = "Gagal memuat daftar tahun data dari server (" + (err.message || "koneksi terputus") + ").";
                    errText.hidden = false;
                }
                setHidden("retryBtn", false);

                setText("kpiTotalRegistry", "—");
                setText("kpiTotalPassenger", "—");
                setText("kpiTotalVehicle", "—");
                setText("kpiTopTerminal", "—");
                setText("kpiTopTerminalSub", "Gagal memuat data tahun");

                setHidden("tableLoadingState", true);
                setHidden("tableEmptyState", true);
                setHidden("tableErrorState", false);
                setText("tableErrorMsg", "Gagal memuat tahun data operasional terminal dari server (" + (err.message || "koneksi terputus") + ").");

                var rankingEl = document.getElementById("rankingList");
                if (rankingEl) {
                    rankingEl.innerHTML = '<p class="ranking-empty">Peringkat tidak dapat dihitung karena tahun data tidak tersedia.</p>';
                }
            });

        select.addEventListener("change", function (e) {
            var val = Number(e.target.value);
            if (val && val !== selectedYear) {
                selectedYear = val;

                // Jika modal detail sedang terbuka:
                // Jangan biarkan nilai tahun lama (mis. 2026) tampil basi di bawah label tahun baru (mis. 2025).
                // Segera update label tahun konteks dan pasang status memuat pada metrik penumpang/kendaraan & grafik bulanan.
                if (modalOpen && activeDetailTerminal) {
                    setText("modalStatYear", selectedYear);
                    setText("modalTrendYear", selectedYear);
                    setText("modalStatPassenger", "Memuat…");
                    setText("modalStatPassengerBreakdown", "Memuat pergerakan tahun " + selectedYear + "…");
                    setText("modalStatVehicle", "Memuat…");
                    setText("modalStatVehicleBreakdown", "Memuat pergerakan tahun " + selectedYear + "…");

                    var trendContainer = document.getElementById("modalTrendContainer");
                    if (trendContainer) {
                        trendContainer.innerHTML = '<p class="trend-loading">Memuat grafik bulanan tahun ' + selectedYear + '…</p>';
                    }
                    setHidden("modalLoading", false);
                    setHidden("modalDetailError", true);
                }

                loadTerminalData(selectedYear);
            }
        });
    }

    /* =================================================================
       6. Memuat Data Terminal & KPI
       ================================================================= */
    function setKpiLoading() {
        setText("kpiTotalRegistry", "Memuat…");
        setText("kpiTotalPassenger", "Memuat…");
        setText("kpiTotalVehicle", "Memuat…");
        setText("kpiTopTerminal", "Memuat…");
        setText("kpiTopTerminalSub", "Volume tertinggi tahun terpilih");

        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", true);
        setHidden("tableLoadingState", false);
        setHidden("tableEmptyState", true);
        setHidden("tableErrorState", true);
        setHidden("terminalTable", true);
        setHidden("apiErrorText", true);
        setHidden("retryBtn", true);

        var rankingEl = document.getElementById("rankingList");
        if (rankingEl) {
            rankingEl.innerHTML = '<p class="ranking-loading">Memuat peringkat terminal…</p>';
        }
    }

    function loadTerminalData(year) {
        lastRequestId++;
        var reqId = lastRequestId;

        setKpiLoading();

        rpc("getDashboardData", [{ tahun: year }], reqId)
            .then(function (data) {
                if (!isCurrent(reqId) || !data) return;

                // API Status
                setHidden("apiStatusOk", false);
                setHidden("apiStatusErr", true);
                setHidden("dataTimestamp", false);
                setText("dataTimestamp", "Data dimuat: " + formatTimeWIB(new Date()) + " WIB");
                setHidden("kpiYearContext", false);
                setText("kpiYearContext", "Tahun " + year);

                // Update label tahun pada KPI
                setText("kpiPassengerYear", "Tahun " + year);
                setText("kpiVehicleYear", "Tahun " + year);
                setText("kpiTopTerminalYear", "Tahun " + year);

                // Normalisasi daftar terminal
                var rawPoints = (data && Array.isArray(data.points)) ? data.points : [];
                allTerminals = rawPoints.map(function (p) {
                    var stats = p.stats || {};
                    var kp = Number(stats.kedatangan_penumpang) || 0;
                    var bp = Number(stats.keberangkatan_penumpang) || 0;
                    var kk = Number(stats.kedatangan_kendaraan) || 0;
                    var bk = Number(stats.keberangkatan_kendaraan) || 0;
                    return {
                        kode: String(p.kode_terminal || "").trim(),
                        nama: String(p.nama_terminal || p.kode_terminal || "—").trim(),
                        tipe: String(p.tipe || "—").trim(),
                        kabupaten_kota: String(p.kabupaten_kota || "—").trim(),
                        alamat: String(p.alamat || "").trim(),
                        foto_url: String(p.foto_url || "").trim(),
                        status: (p.status !== undefined && p.status !== null && String(p.status).trim() !== "") ? String(p.status).trim() : "—",
                        lat: Number(p.lat),
                        lng: Number(p.lng),
                        kedatangan_penumpang: kp,
                        keberangkatan_penumpang: bp,
                        kedatangan_kendaraan: kk,
                        keberangkatan_kendaraan: bk,
                        penumpang: kp + bp,
                        kendaraan: kk + bk
                    };
                });

                // Hitung 4 KPI Faktual
                var regCount = allTerminals.length;
                setText("kpiTotalRegistry", formatNumber(regCount));

                var totalP = 0;
                var totalK = 0;
                if (data.s && typeof data.s === "object") {
                    totalP = (Number(data.s.kedatangan_penumpang) || 0) + (Number(data.s.keberangkatan_penumpang) || 0);
                    totalK = (Number(data.s.kedatangan_kendaraan) || 0) + (Number(data.s.keberangkatan_kendaraan) || 0);
                } else {
                    allTerminals.forEach(function (t) {
                        totalP += t.penumpang;
                        totalK += t.kendaraan;
                    });
                }
                setText("kpiTotalPassenger", formatNumber(totalP));
                setText("kpiTotalVehicle", formatNumber(totalK));

                // Cari terminal teraktif berdasarkan total penumpang
                var sortedByP = allTerminals.slice().sort(function (a, b) {
                    return b.penumpang - a.penumpang;
                });

                if (sortedByP.length > 0 && sortedByP[0].penumpang > 0) {
                    var topTerm = sortedByP[0];
                    setText("kpiTopTerminal", topTerm.nama);
                    setText("kpiTopTerminalSub", formatNumber(topTerm.penumpang) + " penumpang · " + formatTypeLabel(topTerm.tipe));
                } else {
                    setText("kpiTopTerminal", "—");
                    setText("kpiTopTerminalSub", "Belum ada catatan pergerakan untuk tahun " + year);
                }

                // Render Peringkat Top 5
                renderTop5Ranking(sortedByP, year);

                // Perbarui Dropdown Filter (Tipe & Lokasi)
                updateFilterOptions();

                // Terapkan filter dan render tabel
                applyFilters();

                // Jika modal detail sedang terbuka saat data tahun baru selesai dimuat:
                // Perbarui activeDetailTerminal dari daftar terminal tahun baru agar metrik penumpang & kendaraan sinkron dengan tahun terpilih.
                if (modalOpen && activeDetailTerminal) {
                    var updatedCurrent = allTerminals.find(function (item) {
                        return item.kode === activeDetailTerminal.kode;
                    });
                    if (updatedCurrent) {
                        activeDetailTerminal = updatedCurrent;
                        setText("modalStatYear", year);
                        setText("modalStatPassenger", formatNumber(updatedCurrent.penumpang));
                        setText("modalStatPassengerBreakdown", "Kedatangan: " + formatNumber(updatedCurrent.kedatangan_penumpang) + " · Keberangkatan: " + formatNumber(updatedCurrent.keberangkatan_penumpang));
                        setText("modalStatVehicle", formatNumber(updatedCurrent.kendaraan));
                        setText("modalStatVehicleBreakdown", "Kedatangan: " + formatNumber(updatedCurrent.kedatangan_kendaraan) + " · Keberangkatan: " + formatNumber(updatedCurrent.keberangkatan_kendaraan));
                    }
                    // Muat ulang grafik tren bulanan untuk terminal & tahun baru
                    fetchDetailStatsAndTrend(activeDetailTerminal.kode, year);
                }

                // Hilangkan status loading tabel
                setHidden("tableLoadingState", true);
            })
            .catch(function (err) {
                if (!isCurrent(reqId)) return;

                setHidden("apiStatusOk", true);
                setHidden("apiStatusErr", false);

                var errText = document.getElementById("apiErrorText");
                if (errText) {
                    errText.textContent = "Gagal memuat data (" + (err.message || "koneksi terganggu") + ").";
                    errText.hidden = false;
                }
                setHidden("retryBtn", false);

                setText("kpiTotalRegistry", "—");
                setText("kpiTotalPassenger", "—");
                setText("kpiTotalVehicle", "—");
                setText("kpiTopTerminal", "—");
                setText("kpiTopTerminalSub", "Gagal memuat data");

                setHidden("tableLoadingState", true);
                setHidden("tableEmptyState", true);
                setHidden("tableErrorState", false);
                setText("tableErrorMsg", "Terjadi kesalahan saat memuat direktori terminal: " + (err.message || "koneksi terputus") + ".");

                var rankingEl = document.getElementById("rankingList");
                if (rankingEl) {
                    rankingEl.innerHTML = '<p class="ranking-empty">Gagal memuat peringkat terminal.</p>';
                }

                // Jika modal detail sedang terbuka saat refresh tahun gagal:
                // Ganti status memuat tanpa henti dengan error detail-lokal faktual,
                // batalkan request detail basi agar tidak merepopulasi tahun lama,
                // dan pertahankan metadata profil yang sudah ada.
                if (modalOpen && activeDetailTerminal) {
                    detailRequestId++;
                    setHidden("modalLoading", true);
                    setHidden("modalDetailError", false);

                    var errTitle = document.querySelector("#modalDetailError .modal-error-title");
                    var errSub = document.querySelector("#modalDetailError .modal-error-sub");
                    if (errTitle) errTitle.textContent = "Gagal memuat data operasional tahun " + year + ".";
                    if (errSub) errSub.textContent = "Terjadi gangguan koneksi ke server. Klik Muat Ulang untuk mencoba kembali.";

                    setText("modalStatPassenger", "—");
                    setText("modalStatPassengerBreakdown", "Gagal memuat pergerakan tahun " + year);
                    setText("modalStatVehicle", "—");
                    setText("modalStatVehicleBreakdown", "Gagal memuat pergerakan tahun " + year);

                    var trendContainer = document.getElementById("modalTrendContainer");
                    if (trendContainer) {
                        trendContainer.innerHTML = '<p class="trend-empty-note">Gagal memuat grafik bulanan tahun ' + escapeHtml(year) + ' dari server.</p>';
                    }
                }
            });
    }

    /* =================================================================
       7. Top 5 Ranking Render
       ================================================================= */
    function renderTop5Ranking(sortedTerminals, year) {
        var container = document.getElementById("rankingList");
        if (!container) return;

        var activeList = sortedTerminals.filter(function (t) {
            return t.penumpang > 0;
        }).slice(0, 5);

        if (activeList.length === 0) {
            container.innerHTML = '<p class="ranking-empty">Belum ada catatan pergerakan penumpang pada tahun ' + escapeHtml(year) + '.</p>';
            return;
        }

        var html = "";
        activeList.forEach(function (t, idx) {
            var rank = idx + 1;
            var numCls = rank === 1 ? "ranking-num-1" : (rank === 2 ? "ranking-num-2" : (rank === 3 ? "ranking-num-3" : "ranking-num-other"));
            var typeCls = getTypeClass(t.tipe);
            var typeText = formatTypeLabel(t.tipe);

            html += '<div class="ranking-item">' +
                '<span class="ranking-num ' + numCls + '" aria-label="Peringkat ' + rank + '">' + rank + '</span>' +
                '<div class="ranking-info">' +
                    '<p class="ranking-name" title="' + escapeHtml(t.nama) + '">' + escapeHtml(t.nama) + '</p>' +
                    '<div class="ranking-meta">' +
                        '<span class="badge-type ' + typeCls + '">' + escapeHtml(typeText) + '</span>' +
                        '<span>' + escapeHtml(t.kabupaten_kota) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="ranking-stats">' +
                    '<span class="ranking-val">' + formatNumber(t.penumpang) + '</span>' +
                    '<span class="ranking-unit">penumpang</span>' +
                '</div>' +
                '<button type="button" class="btn-ranking-detail" data-kode="' + escapeHtml(t.kode) + '" aria-label="Lihat detail ' + escapeHtml(t.nama) + '">Detail</button>' +
            '</div>';
        });

        container.innerHTML = html;
    }

    /* =================================================================
       8. Filter & Search
       ================================================================= */
    function updateFilterOptions() {
        var typeSelect = document.getElementById("typeFilter");
        var locSelect = document.getElementById("locationFilter");
        if (!typeSelect || !locSelect) return;

        var currentType = typeSelect.value;
        var currentLoc = locSelect.value;

        // Tipe unik
        var types = {};
        allTerminals.forEach(function (t) {
            if (t.tipe && t.tipe !== "—") {
                types[t.tipe] = true;
            }
        });
        var sortedTypes = Object.keys(types).sort();

        typeSelect.innerHTML = '<option value="">Semua Tipe</option>';
        sortedTypes.forEach(function (tp) {
            var opt = document.createElement("option");
            opt.value = tp;
            opt.textContent = formatTypeLabel(tp);
            typeSelect.appendChild(opt);
        });
        if (currentType && types[currentType]) {
            typeSelect.value = currentType;
        }

        // Lokasi / Kab-Kota unik
        var locs = {};
        allTerminals.forEach(function (t) {
            if (t.kabupaten_kota && t.kabupaten_kota !== "—") {
                locs[t.kabupaten_kota] = true;
            }
        });
        var sortedLocs = Object.keys(locs).sort();

        locSelect.innerHTML = '<option value="">Semua Wilayah</option>';
        sortedLocs.forEach(function (lc) {
            var opt = document.createElement("option");
            opt.value = lc;
            opt.textContent = lc;
            locSelect.appendChild(opt);
        });
        if (currentLoc && locs[currentLoc]) {
            locSelect.value = currentLoc;
        }
    }

    function applyFilters() {
        var q = activeFilter.query.toLowerCase().trim();
        var tp = activeFilter.type;
        var lc = activeFilter.location;

        filteredTerminals = allTerminals.filter(function (t) {
            if (q) {
                var matchCode = t.kode.toLowerCase().indexOf(q) >= 0;
                var matchName = t.nama.toLowerCase().indexOf(q) >= 0;
                if (!matchCode && !matchName) return false;
            }
            if (tp && t.tipe !== tp) {
                return false;
            }
            if (lc && t.kabupaten_kota !== lc) {
                return false;
            }
            return true;
        });

        // Urutkan: terminal dengan produksi penumpang > 0 terlebih dahulu (descending),
        // kemudian terminal dengan produksi 0 secara alfabetis nama
        filteredTerminals.sort(function (a, b) {
            if (a.penumpang > 0 && b.penumpang > 0) {
                return b.penumpang - a.penumpang;
            }
            if (a.penumpang > 0) return -1;
            if (b.penumpang > 0) return 1;
            return a.nama.localeCompare(b.nama);
        });

        // Update counter
        var countEl = document.getElementById("resultCount");
        if (countEl) {
            countEl.textContent = "Menampilkan " + filteredTerminals.length + " dari " + allTerminals.length + " terminal";
        }

        renderTable();
    }

    function renderTable() {
        var tbody = document.getElementById("terminalTableBody");
        var table = document.getElementById("terminalTable");
        var emptyState = document.getElementById("tableEmptyState");
        if (!tbody || !table || !emptyState) return;

        if (filteredTerminals.length === 0) {
            tbody.innerHTML = "";
            table.hidden = true;
            emptyState.hidden = false;
            return;
        }

        table.hidden = false;
        emptyState.hidden = true;

        var html = "";
        filteredTerminals.forEach(function (t) {
            var typeCls = getTypeClass(t.tipe);
            var typeText = formatTypeLabel(t.tipe);
            var pValCls = t.penumpang > 0 ? "td-num" : "td-num td-zero";
            var kValCls = t.kendaraan > 0 ? "td-num" : "td-num td-zero";

            html += '<tr>' +
                '<td><span class="badge-code">' + escapeHtml(t.kode) + '</span></td>' +
                '<td><strong>' + escapeHtml(t.nama) + '</strong></td>' +
                '<td><span class="badge-type ' + typeCls + '">' + escapeHtml(typeText) + '</span></td>' +
                '<td>' + escapeHtml(t.kabupaten_kota) + '</td>' +
                '<td class="' + pValCls + '">' + formatNumber(t.penumpang) + '</td>' +
                '<td class="' + kValCls + '">' + formatNumber(t.kendaraan) + '</td>' +
                '<td class="td-action">' +
                    '<button type="button" class="btn-table-detail" data-kode="' + escapeHtml(t.kode) + '" aria-label="Lihat detail ' + escapeHtml(t.nama) + '">Detail</button>' +
                '</td>' +
            '</tr>';
        });

        tbody.innerHTML = html;
    }

    /* =================================================================
       9. Modal Detail Terminal
       ================================================================= */
    function openModal(kode, triggerEl) {
        var t = allTerminals.find(function (item) {
            return item.kode === kode;
        });
        if (!t) return;

        lastFocusedElement = triggerEl;
        activeDetailTerminal = t;
        modalOpen = true;

        var modal = document.getElementById("terminalModal");
        var backdrop = document.getElementById("modalBackdrop");
        if (!modal || !backdrop) return;

        // Set info dasar langsung dari memori lokal (tanpa menunggu jaringan)
        setText("modalTitle", t.nama);
        setText("modalCode", t.kode);
        setText("modalType", formatTypeLabel(t.tipe));

        var typeBadge = document.getElementById("modalType");
        if (typeBadge) {
            typeBadge.className = "badge-type " + getTypeClass(t.tipe);
        }

        setText("modalSubInfo", (t.kabupaten_kota || "Belum tersedia") + " · Status: " + (t.status || "—"));
        setText("modalKabKota", t.kabupaten_kota || "Belum tersedia");
        setText("modalStatus", t.status || "—");
        setText("modalAlamat", t.alamat || "Belum tersedia");

        // Set metrik produksi tahun terpilih
        setText("modalStatYear", selectedYear);
        setText("modalStatPassenger", formatNumber(t.penumpang));
        setText("modalStatPassengerBreakdown", "Kedatangan: " + formatNumber(t.kedatangan_penumpang) + " · Keberangkatan: " + formatNumber(t.keberangkatan_penumpang));
        setText("modalStatVehicle", formatNumber(t.kendaraan));
        setText("modalStatVehicleBreakdown", "Kedatangan: " + formatNumber(t.kedatangan_kendaraan) + " · Keberangkatan: " + formatNumber(t.keberangkatan_kendaraan));

        // Inisialisasi placeholder detail on-demand
        setText("modalJam", "Memuat…");
        setText("modalKontak", "Memuat…");
        setText("modalLuasWilayah", "Memuat…");
        setText("modalLuasBangunan", "Memuat…");
        setText("modalWebsite", "Memuat…");
        setText("modalDeskripsi", "Memuat…");

        // Tampilkan foto jika ada URL valid (http/https atau data URI)
        var photoWrap = document.getElementById("modalPhotoWrap");
        var photoImg = document.getElementById("modalPhoto");
        if (photoWrap && photoImg) {
            if (t.foto_url && (t.foto_url.indexOf("http://") === 0 || t.foto_url.indexOf("https://") === 0 || t.foto_url.indexOf("data:") === 0)) {
                photoImg.src = t.foto_url;
                photoWrap.hidden = false;
            } else {
                photoWrap.hidden = true;
                photoImg.src = "";
            }
        }

        // Tampilkan modal dan fokus
        backdrop.hidden = false;
        modal.hidden = false;

        var closeBtn = document.getElementById("modalCloseBtn");
        if (closeBtn) {
            closeBtn.focus();
        }

        // Ambil data detail & tren bulanan dari API
        fetchDetailStatsAndTrend(kode, selectedYear);
    }

    function closeModal() {
        if (!modalOpen) return;
        modalOpen = false;
        activeDetailTerminal = null;

        var modal = document.getElementById("terminalModal");
        var backdrop = document.getElementById("modalBackdrop");
        if (modal) modal.hidden = true;
        if (backdrop) backdrop.hidden = true;

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }

    function fetchDetailStatsAndTrend(kode, year) {
        detailRequestId++;
        var curReq = detailRequestId;

        setHidden("modalLoading", false);
        setHidden("modalDetailError", true);

        var trendContainer = document.getElementById("modalTrendContainer");
        setText("modalTrendYear", year);
        if (trendContainer) {
            trendContainer.innerHTML = '<p class="trend-loading">Memuat grafik bulanan…</p>';
        }

        // Panggilan on-demand paralel: detail profil & dashboard spesifik terminal
        var pDetail = rpc("getTerminalDetail", [kode]);
        var pDash = rpc("getDashboardData", [{ tahun: year, kode_terminal: kode }]);

        Promise.allSettled([pDetail, pDash])
            .then(function (results) {
                if (curReq !== detailRequestId) return; // Stale request check

                setHidden("modalLoading", true);

                var resDetail = results[0];
                var resDash = results[1];
                var hadError = false;

                // 1. Tangani Data Profil (getTerminalDetail)
                if (resDetail.status === "fulfilled" && resDetail.value) {
                    var d = resDetail.value;
                    setText("modalAlamat", d.alamat || (activeDetailTerminal && activeDetailTerminal.alamat) || "Belum tersedia");
                    setText("modalJam", d.jam_operasi || "Belum tersedia");
                    setText("modalKontak", d.kontak || "Belum tersedia");
                    setText("modalLuasWilayah", d.luas_wilayah || "Belum tersedia");
                    setText("modalLuasBangunan", d.luas_bangunan || "Belum tersedia");

                    var webEl = document.getElementById("modalWebsite");
                    if (webEl) {
                        if (d.website && (d.website.indexOf("http://") === 0 || d.website.indexOf("https://") === 0)) {
                            webEl.innerHTML = '<a href="' + escapeHtml(d.website) + '" target="_blank" rel="noopener noreferrer" style="color: var(--blue-700); text-decoration: underline;">' + escapeHtml(d.website) + '</a>';
                        } else {
                            webEl.textContent = d.website || "Belum tersedia";
                        }
                    }

                    setText("modalDeskripsi", d.deskripsi || "Belum tersedia");

                    // Update foto jika ditemukan di sheet detail
                    if (d.foto_url && (d.foto_url.indexOf("http://") === 0 || d.foto_url.indexOf("https://") === 0 || d.foto_url.indexOf("data:") === 0)) {
                        var photoWrap = document.getElementById("modalPhotoWrap");
                        var photoImg = document.getElementById("modalPhoto");
                        if (photoWrap && photoImg) {
                            photoImg.src = d.foto_url;
                            photoWrap.hidden = false;
                        }
                    }
                } else if (resDetail.status === "rejected") {
                    hadError = true;
                    setText("modalJam", "Belum tersedia");
                    setText("modalKontak", "Belum tersedia");
                    setText("modalLuasWilayah", "Belum tersedia");
                    setText("modalLuasBangunan", "Belum tersedia");
                    setText("modalWebsite", "Belum tersedia");
                    setText("modalDeskripsi", "Belum tersedia");
                } else {
                    // Respon sukses tetapi data detail tambahan belum tercatat di sheet
                    setText("modalJam", "Belum tersedia");
                    setText("modalKontak", "Belum tersedia");
                    setText("modalLuasWilayah", "Belum tersedia");
                    setText("modalLuasBangunan", "Belum tersedia");
                    setText("modalWebsite", "Belum tersedia");
                    setText("modalDeskripsi", "Belum tersedia");
                }

                // 2. Tangani Tren Bulanan (getDashboardData spesifik terminal)
                if (resDash.status === "fulfilled" && resDash.value) {
                    var dash = resDash.value;
                    var trend = Array.isArray(dash.trend) ? dash.trend : [];
                    renderMonthlyTrend(trend, year);
                } else {
                    hadError = true;
                    if (trendContainer) {
                        trendContainer.innerHTML = '<p class="trend-empty-note">Data tren bulanan tidak tersedia untuk tahun ' + escapeHtml(year) + '.</p>';
                    }
                }

                // Tampilkan / sembunyikan banner retry sesuai status kegagalan
                if (hadError) {
                    var errTitle = document.querySelector("#modalDetailError .modal-error-title");
                    var errSub = document.querySelector("#modalDetailError .modal-error-sub");
                    if (errTitle) errTitle.textContent = "Sebagian informasi profil gagal dimuat.";
                    if (errSub) errSub.textContent = "Data ringkasan tetap tersedia di bawah.";
                    setHidden("modalDetailError", false);
                } else {
                    setHidden("modalDetailError", true);
                }
            })
            .catch(function () {
                if (curReq !== detailRequestId) return;
                setHidden("modalLoading", true);
                setHidden("modalDetailError", false);
            });
    }

    function renderMonthlyTrend(trend, year) {
        var container = document.getElementById("modalTrendContainer");
        if (!container) return;

        if (!Array.isArray(trend) || trend.length === 0) {
            container.innerHTML = '<p class="trend-empty-note">Belum ada catatan pergerakan bulanan untuk tahun ' + escapeHtml(year) + '.</p>';
            return;
        }

        // Hitung total pergerakan bulanan
        var monthlyTotals = trend.map(function (m) {
            var p = (Number(m.kedatangan_penumpang) || 0) + (Number(m.keberangkatan_penumpang) || 0);
            return {
                bulan: m.bulan || "—",
                penumpang: p
            };
        });

        var maxP = 0;
        var hasActivity = false;
        monthlyTotals.forEach(function (item) {
            if (item.penumpang > maxP) maxP = item.penumpang;
            if (item.penumpang > 0) hasActivity = true;
        });

        if (!hasActivity || maxP === 0) {
            container.innerHTML = '<p class="trend-empty-note">Belum ada catatan pergerakan bulanan untuk tahun ' + escapeHtml(year) + '.</p>';
            return;
        }

        // Buat bar chart CSS/HTML bersih
        var barsHtml = '<div class="trend-bars-wrap" role="img" aria-label="Grafik tren bulanan pergerakan penumpang tahun ' + escapeHtml(year) + '">';
        var labelsHtml = '<div class="trend-months-wrap" aria-hidden="true">';

        monthlyTotals.forEach(function (item) {
            var pct = maxP > 0 ? Math.round((item.penumpang / maxP) * 100) : 0;
            var barCls = item.penumpang > 0 ? "trend-bar-fill" : "trend-bar-fill trend-bar-fill-zero";
            var heightStyle = item.penumpang > 0 ? 'height: ' + Math.max(pct, 4) + '%;' : 'height: 2px;';

            barsHtml += '<div class="trend-col" title="' + escapeHtml(item.bulan) + ': ' + formatNumber(item.penumpang) + ' penumpang">' +
                (item.penumpang > 0 ? '<span class="trend-bar-val">' + formatNumber(item.penumpang) + '</span>' : '') +
                '<div class="' + barCls + '" style="' + heightStyle + '"></div>' +
            '</div>';

            labelsHtml += '<span class="trend-month-label">' + escapeHtml(item.bulan) + '</span>';
        });

        barsHtml += '</div>';
        labelsHtml += '</div>';

        container.innerHTML = barsHtml + labelsHtml;
    }

    /* =================================================================
       10. Inisialisasi Interaksi & Event Listeners
       ================================================================= */
    function initEvents() {
        // Retry tombol status bar
        var retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
            retryBtn.addEventListener("click", function () {
                if (selectedYear !== null) {
                    loadTerminalData(selectedYear);
                } else {
                    initYears();
                }
            });
        }

        // Retry tombol tabel error
        var tableRetryBtn = document.getElementById("tableRetryBtn");
        if (tableRetryBtn) {
            tableRetryBtn.addEventListener("click", function () {
                if (selectedYear !== null) {
                    loadTerminalData(selectedYear);
                } else {
                    initYears();
                }
            });
        }

        // Search Input
        var searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", function (e) {
                activeFilter.query = e.target.value;
                applyFilters();
            });
        }

        // Filter Tipe
        var typeFilter = document.getElementById("typeFilter");
        if (typeFilter) {
            typeFilter.addEventListener("change", function (e) {
                activeFilter.type = e.target.value;
                applyFilters();
            });
        }

        // Filter Wilayah
        var locFilter = document.getElementById("locationFilter");
        if (locFilter) {
            locFilter.addEventListener("change", function (e) {
                activeFilter.location = e.target.value;
                applyFilters();
            });
        }

        // Reset Filter Buttons
        var resetBtn = document.getElementById("resetFilterBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                activeFilter.query = "";
                activeFilter.type = "";
                activeFilter.location = "";
                if (searchInput) searchInput.value = "";
                if (typeFilter) typeFilter.value = "";
                if (locFilter) locFilter.value = "";
                applyFilters();
            });
        }

        var tableResetBtn = document.getElementById("tableResetBtn");
        if (tableResetBtn) {
            tableResetBtn.addEventListener("click", function () {
                activeFilter.query = "";
                activeFilter.type = "";
                activeFilter.location = "";
                if (searchInput) searchInput.value = "";
                if (typeFilter) typeFilter.value = "";
                if (locFilter) locFilter.value = "";
                applyFilters();
            });
        }

        // Event delegation untuk tombol detail pada tabel dan ranking
        document.addEventListener("click", function (e) {
            var btn = e.target.closest(".btn-table-detail, .btn-ranking-detail");
            if (btn) {
                var kode = btn.getAttribute("data-kode");
                if (kode) {
                    openModal(kode, btn);
                }
            }
        });

        // Tutup modal detail
        var modalCloseBtn = document.getElementById("modalCloseBtn");
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener("click", closeModal);
        }

        var modalCloseFooterBtn = document.getElementById("modalCloseFooterBtn");
        if (modalCloseFooterBtn) {
            modalCloseFooterBtn.addEventListener("click", closeModal);
        }

        var modalBackdrop = document.getElementById("modalBackdrop");
        if (modalBackdrop) {
            modalBackdrop.addEventListener("click", closeModal);
        }

        // Retry tombol modal error (menggunakan selectedYear & terminal aktif saat ini)
        var modalRetryBtn = document.getElementById("modalRetryBtn");
        if (modalRetryBtn) {
            modalRetryBtn.addEventListener("click", function () {
                if (activeDetailTerminal) {
                    var curKode = activeDetailTerminal.kode;
                    var curYear = selectedYear;

                    setHidden("modalLoading", false);
                    setHidden("modalDetailError", true);
                    setText("modalStatPassenger", "Memuat…");
                    setText("modalStatPassengerBreakdown", "Memuat pergerakan tahun " + curYear + "…");
                    setText("modalStatVehicle", "Memuat…");
                    setText("modalStatVehicleBreakdown", "Memuat pergerakan tahun " + curYear + "…");

                    var trendContainer = document.getElementById("modalTrendContainer");
                    if (trendContainer) {
                        trendContainer.innerHTML = '<p class="trend-loading">Memuat grafik bulanan tahun ' + curYear + '…</p>';
                    }

                    var tableErr = document.getElementById("tableErrorState");
                    var tableInError = tableErr && !tableErr.hidden;

                    if (tableInError) {
                        loadTerminalData(curYear);
                    } else {
                        fetchDetailStatsAndTrend(curKode, curYear);
                    }
                }
            });
        }

        // Keyboard navigation (Escape & Focus Trap pada Modal)
        document.addEventListener("keydown", function (e) {
            if (!modalOpen) return;

            if (e.key === "Escape") {
                e.preventDefault();
                closeModal();
                return;
            }

            if (e.key === "Tab") {
                var modal = document.getElementById("terminalModal");
                if (!modal) return;

                var focusables = Array.prototype.slice.call(
                    modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
                ).filter(function (el) {
                    return el.offsetParent !== null;
                });

                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }

                var first = focusables[0];
                var last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first || !modal.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || !modal.contains(document.activeElement)) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        });
    }

    /* =================================================================
       11. Sidebar Mobile Drawer Navigation (PHASE 15A Pattern)
       ================================================================= */
    function initSidebar() {
        var sidebar = document.getElementById("appSidebar");
        var overlay = document.getElementById("sidebarOverlay");
        var toggleBtn = document.getElementById("sidebarToggle");
        var closeBtn = document.getElementById("sidebarClose");
        var lastFocusedBeforeDrawer = null;
        var drawerFocusTimer = null;

        function isMobile() {
            return window.matchMedia("(max-width: 767px)").matches;
        }

        function isInertSupported() {
            return typeof HTMLElement !== "undefined" &&
                   ("inert" in HTMLElement.prototype || (sidebar && "inert" in sidebar)) &&
                   !(typeof window !== "undefined" && window.__simulateNoInert);
        }

        function applySidebarFocusFallback(disable) {
            if (!sidebar) return;
            var selector = 'a[href], button, input, select, textarea, [tabindex]';
            var els = sidebar.querySelectorAll(selector);
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el.disabled || el.getAttribute("aria-disabled") === "true") continue;
                if (disable) {
                    if (!el.hasAttribute("data-saved-tabindex")) {
                        var prev = el.getAttribute("tabindex");
                        el.setAttribute("data-saved-tabindex", prev !== null ? prev : "");
                        el.setAttribute("tabindex", "-1");
                    }
                } else {
                    if (el.hasAttribute("data-saved-tabindex")) {
                        var saved = el.getAttribute("data-saved-tabindex");
                        if (saved === "") {
                            el.removeAttribute("tabindex");
                        } else {
                            el.setAttribute("tabindex", saved);
                        }
                        el.removeAttribute("data-saved-tabindex");
                    }
                }
            }
        }

        function updateSidebarInertState() {
            if (!sidebar) return;
            var mobile = isMobile();
            var isOpen = sidebar.classList.contains("is-open");
            var inertSupported = isInertSupported();

            if (mobile) {
                if (isOpen) {
                    if (inertSupported && "inert" in sidebar) sidebar.inert = false;
                    sidebar.removeAttribute("inert");
                    sidebar.removeAttribute("aria-hidden");
                    applySidebarFocusFallback(false);
                } else {
                    if (inertSupported && "inert" in sidebar) sidebar.inert = true;
                    sidebar.setAttribute("inert", "");
                    sidebar.setAttribute("aria-hidden", "true");
                    if (!inertSupported) applySidebarFocusFallback(true);
                }
            } else {
                if (inertSupported && "inert" in sidebar) sidebar.inert = false;
                sidebar.removeAttribute("inert");
                sidebar.removeAttribute("aria-hidden");
                applySidebarFocusFallback(false);
            }
        }

        function getFocusableElements(container) {
            if (!container) return [];
            var selector = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';
            var list = Array.prototype.slice.call(container.querySelectorAll(selector));
            return list.filter(function (el) {
                return !el.disabled && el.getAttribute("aria-disabled") !== "true" && el.offsetParent !== null;
            });
        }

        function setSidebarOpen(open) {
            if (!sidebar || !overlay || !toggleBtn) return;
            if (drawerFocusTimer) {
                clearTimeout(drawerFocusTimer);
                drawerFocusTimer = null;
            }

            var willOpen = !!open;
            if (willOpen) {
                lastFocusedBeforeDrawer = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : toggleBtn;
            }

            sidebar.classList.toggle("is-open", willOpen);
            overlay.classList.toggle("is-visible", willOpen);
            overlay.hidden = !willOpen;
            toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
            toggleBtn.setAttribute("aria-label", willOpen ? "Tutup menu navigasi" : "Buka menu navigasi");

            updateSidebarInertState();

            if (willOpen) {
                drawerFocusTimer = setTimeout(function () {
                    drawerFocusTimer = null;
                    if (!sidebar.classList.contains("is-open") || (isMobile() && sidebar.hasAttribute("inert"))) return;
                    var focusables = getFocusableElements(sidebar);
                    if (focusables.length > 0) focusables[0].focus();
                }, 50);
            } else {
                if (lastFocusedBeforeDrawer && lastFocusedBeforeDrawer !== document.body && typeof lastFocusedBeforeDrawer.focus === "function") {
                    lastFocusedBeforeDrawer.focus();
                } else if (toggleBtn && typeof toggleBtn.focus === "function") {
                    toggleBtn.focus();
                }
                lastFocusedBeforeDrawer = null;
            }
        }

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener("click", function () {
                var isOpen = sidebar.classList.contains("is-open");
                setSidebarOpen(!isOpen);
            });

            overlay.addEventListener("click", function () {
                setSidebarOpen(false);
            });

            if (closeBtn) {
                closeBtn.addEventListener("click", function () {
                    setSidebarOpen(false);
                });
            }

            sidebar.addEventListener("click", function (e) {
                var link = e.target.closest("a");
                if (link && isMobile()) {
                    setSidebarOpen(false);
                }
            });

            document.addEventListener("keydown", function (e) {
                if (!sidebar.classList.contains("is-open") || !isMobile()) return;

                if (e.key === "Escape") {
                    e.preventDefault();
                    setSidebarOpen(false);
                    return;
                }

                if (e.key === "Tab") {
                    var focusable = getFocusableElements(sidebar);
                    if (focusable.length === 0) {
                        e.preventDefault();
                        return;
                    }
                    var first = focusable[0];
                    var last = focusable[focusable.length - 1];

                    if (e.shiftKey) {
                        if (document.activeElement === first || !sidebar.contains(document.activeElement)) {
                            e.preventDefault();
                            last.focus();
                        }
                    } else {
                        if (document.activeElement === last || !sidebar.contains(document.activeElement)) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            });

            window.addEventListener("resize", function () {
                if (!isMobile() && sidebar.classList.contains("is-open")) {
                    setSidebarOpen(false);
                }
                updateSidebarInertState();
            });

            updateSidebarInertState();
        }
    }

    /* =================================================================
       12. Bootstrapping
       ================================================================= */
    function init() {
        updateClock();
        setInterval(updateClock, 1000);
        initSidebar();
        initEvents();
        initYears();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
