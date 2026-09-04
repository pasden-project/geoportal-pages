/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center V2
   PHASE 14I — Executive Clean Dashboard Logic
   Native SVG Live Trend Chart, Zero Dead Control, Full UI Correctness

   Endpoint yang dipanggil (Verified read-only):
     - getAvailableYears
     - getDashboardData
   ===================================================================== */

(function () {
    "use strict";

    /* =================================================================
       1. Konstanta & state
       ================================================================= */
    var API_BASE = "/api";
    var REQUEST_TIMEOUT_MS = 15000;
    var REQUEST_VERB = "POST";
    var REQUEST_HEADERS = { "content-type": "application/json" };
    var SVG_NS = "http://www.w3.org/2000/svg";

    var lastRequestId = 0;
    var selectedYear = null;
    var currentDashboardData = null;
    var activeMetric = "penumpang"; // 'penumpang' | 'kendaraan'

    var NAMA_BULAN_ID = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    var NAMA_BULAN_PENDEK = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    /* =================================================================
       2. DOM & String Helpers (Safe DOM, Zero innerHTML)
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

    function setTextClass(id, cls) {
        var el = document.getElementById(id);
        if (el) {
            el.className = cls;
        }
    }

    /* =================================================================
       3. Format Angka Indonesia (id-ID)
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

    function getCurrentPeriodWIB() {
        var parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "numeric"
        }).formatToParts(new Date());
        var tahun = 0;
        var bulan = 0;
        parts.forEach(function (p) {
            if (p.type === "year") {
                tahun = Number(p.value);
            } else if (p.type === "month") {
                bulan = Number(p.value);
            }
        });
        return { tahun: tahun, bulan: bulan };
    }

    function toNumberOrZero(v) {
        var n = Number(v);
        return (isFinite(n) && n > 0) ? n : 0;
    }

    function monthHasActivity(rec) {
        if (!rec || typeof rec !== "object") {
            return false;
        }
        return (toNumberOrZero(rec.kedatangan_penumpang) +
                toNumberOrZero(rec.keberangkatan_penumpang) +
                toNumberOrZero(rec.kedatangan_kendaraan) +
                toNumberOrZero(rec.keberangkatan_kendaraan)) > 0;
    }

    function monthPassengerMovement(rec) {
        return toNumberOrZero(rec.kedatangan_penumpang) + toNumberOrZero(rec.keberangkatan_penumpang);
    }

    function monthVehicleMovement(rec) {
        return toNumberOrZero(rec.kedatangan_kendaraan) + toNumberOrZero(rec.keberangkatan_kendaraan);
    }

    /* =================================================================
       4. Analisis Periode Aman (MoM)
       ================================================================= */
    function analyzePeriod(trend, tahun) {
        if (tahun === null || tahun === undefined || !isFinite(Number(tahun))) {
            return { available: false, reason: "tahun tidak valid" };
        }
        var year = Number(tahun);
        var now = getCurrentPeriodWIB();

        if (year > now.tahun) {
            return { available: false, reason: "tahun masih akan datang" };
        }

        var months = [];
        var src = Array.isArray(trend) ? trend : [];
        for (var i = 0; i < 12; i++) {
            var rec = src[i] || {};
            months.push({
                bulan: rec.bulan,
                kedatangan_penumpang: toNumberOrZero(rec.kedatangan_penumpang),
                keberangkatan_penumpang: toNumberOrZero(rec.keberangkatan_penumpang),
                kedatangan_kendaraan: toNumberOrZero(rec.kedatangan_kendaraan),
                keberangkatan_kendaraan: toNumberOrZero(rec.keberangkatan_kendaraan)
            });
        }

        var lastAllowedMonth = (year === now.tahun) ? now.bulan - 1 : 12;
        var active = [];
        for (var m = 1; m <= lastAllowedMonth; m++) {
            var rec2 = months[m - 1] || {};
            if (monthHasActivity(rec2)) {
                active.push(m);
            }
        }

        if (active.length < 2) {
            return {
                available: false,
                reason: "kurang dari dua bulan",
                aktivitas: active.slice()
            };
        }

        var bulanTerakhir = active[active.length - 1];
        var bulanSebelumnya = active[active.length - 2];
        var recAkhir = months[bulanTerakhir - 1] || {};
        var recAwal = months[bulanSebelumnya - 1] || {};
        var nilaiAkhir = monthPassengerMovement(recAkhir);
        var nilaiAwal = monthPassengerMovement(recAwal);

        if (nilaiAwal <= 0 || !isFinite(nilaiAkhir) || !isFinite(nilaiAwal)) {
            return {
                available: false,
                reason: "baseline nol",
                aktivitas: active.slice(),
                bulanTerakhir: bulanTerakhir,
                bulanSebelumnya: bulanSebelumnya
            };
        }

        var pct = ((nilaiAkhir - nilaiAwal) / nilaiAwal) * 100;
        var berurutan = (bulanTerakhir - bulanSebelumnya === 1);

        return {
            available: true,
            persen: pct,
            berurutan: berurutan,
            bulanTerakhir: bulanTerakhir,
            bulanSebelumnya: bulanSebelumnya,
            namaTerakhir: NAMA_BULAN_ID[bulanTerakhir - 1],
            namaSebelumnya: NAMA_BULAN_ID[bulanSebelumnya - 1],
            nilaiAkhir: nilaiAkhir,
            nilaiAwal: nilaiAwal,
            aktivitas: active.slice(),
            lastAllowedMonth: lastAllowedMonth
        };
    }

    function describePeriod(result) {
        if (!result || !result.available) {
            return {
                value: "Perbandingan belum tersedia",
                sub: "Periode kalender selesai; kelengkapan pelaporan belum diverifikasi.",
                cls: "insight-value-error"
            };
        }
        var pctLabel = formatPercent(result.persen);
        var arah = result.persen > 0 ? "Naik" : (result.persen < 0 ? "Turun" : "Stabil");
        var label = "Perubahan: " + result.namaSebelumnya + " → " + result.namaTerakhir;
        return {
            value: arah + " " + pctLabel,
            label: label,
            gap: result.berurutan ? "" : "Terdapat jeda periode",
            sub: "Periode kalender selesai; kelengkapan pelaporan belum diverifikasi.",
            cls: "insight-value-live"
        };
    }

    /* =================================================================
       5. Client API Read-Only
       ================================================================= */
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
                    if (!isCurrent(requestId)) {
                        return resolve(null);
                    }
                    if (pack.ok && payload && payload.ok === true) {
                        return resolve(payload.data);
                    }
                    var msg = (payload && payload.error) ? String(payload.error) : "Terjadi kesalahan pada server.";
                    reject(new Error(msg));
                })
                .catch(function (err) {
                    if (!isCurrent(requestId)) {
                        return resolve(null);
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
       6. Inisialisasi Tahun & Data Dashboard
       ================================================================= */
    function initYears() {
        var select = document.getElementById("yearSelect");
        if (!select) {
            return;
        }

        var requestId = ++lastRequestId;
        setStateLoading();

        return rpc("getAvailableYears", [], requestId)
            .then(function (years) {
                if (!isCurrent(requestId)) {
                    return null;
                }
                if (!years || !years.length) {
                    throw new Error("empty");
                }
                select.replaceChildren();
                years.forEach(function (y) {
                    var opt = document.createElement("option");
                    opt.value = String(y);
                    opt.textContent = String(y);
                    select.appendChild(opt);
                });
                selectedYear = years[0];
                select.value = String(selectedYear);
                loadDashboardData();
                return null;
            })
            .catch(function (err) {
                if (!isCurrent(requestId)) {
                    return null;
                }
                setStateError("Gagal memuat daftar tahun. " + friendlyError(err));
                return null;
            });
    }

    function loadDashboardData() {
        var year = selectedYear;
        var requestId = ++lastRequestId;

        setStateLoading();

        return rpc("getDashboardData", [{ tahun: year }], requestId)
            .then(function (data) {
                if (!isCurrent(requestId)) {
                    return null;
                }
                if (!data) {
                    setStateError("Data kosong dari server.");
                    return null;
                }
                var empty = isDataEmpty(data);
                currentDashboardData = data;
                renderLive(data, year, empty);
                if (empty) {
                    setApiNeutral();
                } else {
                    setApiSuccess();
                }
                return null;
            })
            .catch(function (err) {
                if (!isCurrent(requestId)) {
                    return null;
                }
                currentDashboardData = null;
                setStateError(friendlyError(err));
                return null;
            });
    }

    function isDataEmpty(d) {
        var s = (d && d.summary) || {};
        var total =
            (Number(s.kedatangan_penumpang) || 0) +
            (Number(s.keberangkatan_penumpang) || 0) +
            (Number(s.kedatangan_kendaraan) || 0) +
            (Number(s.keberangkatan_kendaraan) || 0);
        if (total > 0) {
            return false;
        }
        var trend = Array.isArray(d.trend) ? d.trend : [];
        for (var i = 0; i < trend.length; i++) {
            if (monthHasActivity(trend[i])) {
                return false;
            }
        }
        return true;
    }

    /* =================================================================
       7. State Management (Loading, Error, Empty, Success)
       ================================================================= */
    function setYearContextState() {
        var label = (selectedYear !== null && selectedYear !== undefined)
            ? "Tahun " + selectedYear
            : "Tahun —";
        setText("kpiPenumpangYear", label);
        setText("kpiKendaraanYear", label);
        setText("kpiTerminalYear", label);
        setText("kpiUppkbYear", label);
    }

    function resetInsightSubs() {
        setText("kpiInsightPuncakSub", "Berdasarkan data yang tersedia");
        setText("kpiInsightRasioSub", "Agregat terminal, bukan load factor kapasitas kursi");
    }

    function setStateLoading() {
        setKpiLoading();
        setInsightLoading();
        clearTrendChart("Memuat grafik data tren…");

        setText("spatialTerminalCount", "—");
        setText("spatialUppkbCount", "—");

        setText("kpiInsightRasio", "Memuat…");
        setTextClass("kpiInsightRasio", "insight-value insight-value-loading");
        setHidden("kpiInsightTrenLabel", true);
        setHidden("kpiInsightTrenGap", true);

        setYearContextState();
        resetInsightSubs();

        renderSystemAlertState("loading", "");
        setApiStateLoading();
    }

    function setStateError(msg) {
        setKpiError();
        setInsightError();
        clearTrendChart("Grafik data tidak dapat dimuat.");

        setText("spatialTerminalCount", "—");
        setText("spatialUppkbCount", "—");

        setText("kpiInsightRasio", "—");
        setTextClass("kpiInsightRasio", "insight-value insight-value-error");
        setHidden("kpiInsightTrenLabel", true);
        setHidden("kpiInsightTrenGap", true);

        setYearContextState();
        resetInsightSubs();

        renderSystemAlertState("error", msg);
        setApiStateError(msg);
    }

    function setStateEmpty() {
        setKpiError();
        setInsightError();
        renderEmptyTrendChart();

        setText("spatialTerminalCount", "0");
        setText("spatialUppkbCount", "0");

        setText("kpiInsightRasio", "—");
        setTextClass("kpiInsightRasio", "insight-value insight-value-error");
        setHidden("kpiInsightTrenLabel", true);
        setHidden("kpiInsightTrenGap", true);

        renderSystemAlertState("empty", "");
        setApiStateEmpty();
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

    function setKpiLoading() {
        var ids = ["kpiPenumpang", "kpiKendaraan", "kpiTerminal", "kpiUppkb"];
        ids.forEach(function (id) {
            setTextClass(id, "kpi-value kpi-value-loading");
            setText(id, "Memuat…");
        });
        setText("kpiInsightPuncak", "Memuat…");
        setText("kpiInsightTren", "Memuat…");
    }

    function setKpiError() {
        var ids = ["kpiPenumpang", "kpiKendaraan", "kpiTerminal", "kpiUppkb"];
        ids.forEach(function (id) {
            setTextClass(id, "kpi-value kpi-value-error");
            setText(id, "—");
        });
        setText("kpiInsightPuncak", "—");
        setText("kpiInsightTren", "—");
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
       8. Render Data Live
       ================================================================= */
    function renderLive(d, year, empty) {
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

        setText("spatialTerminalCount", formatNumber(terminalCount));
        setText("spatialUppkbCount", formatNumber(uppkbCount));

        setText("kpiPenumpangYear", "Tahun " + year);
        setText("kpiKendaraanYear", "Tahun " + year);
        setText("kpiTerminalYear", "Tahun " + year);
        setText("kpiUppkbYear", "Tahun " + year);

        setText("kpiPenumpangTrend", "Data produksi tahun terpilih");
        setText("kpiKendaraanTrend", "Data produksi tahun terpilih");

        if (empty) {
            setStateEmpty();
            return;
        }

        var ins = d.insights || {};
        renderInsightPuncak(ins.puncakBulan, year);
        renderInsightRasio(s, year);
        renderInsightTren(d.trend, year);
        renderSystemAlertState("success", "");

        // Render Native SVG Monthly Trend Chart
        renderMonthlyTrendChart(d.trend, activeMetric, year);
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
        var nama = (puncak.nama && puncak.nama !== "-") ? puncak.nama : NAMA_BULAN_ID[puncak.bulan - 1] || String(puncak.bulan);
        setTextClass("kpiInsightPuncak", "insight-value insight-value-live");
        setText("kpiInsightPuncak", nama + " " + year);
        setText("kpiInsightPuncakSub", formatNumber(puncak.penumpang) + " pergerakan penumpang · berdasarkan data yang tersedia");
    }

    function renderInsightTren(trend, year) {
        var el = document.getElementById("kpiInsightTren");
        if (!el) {
            return;
        }
        var result = analyzePeriod(trend, year);
        var label = describePeriod(result);

        setTextClass("kpiInsightTren", "insight-value " + label.cls);
        setText("kpiInsightTren", label.value);
        setText("kpiInsightTrenSub", label.sub);

        var labelEl = document.getElementById("kpiInsightTrenLabel");
        if (labelEl) {
            if (label.label) {
                setText("kpiInsightTrenLabel", label.label);
                labelEl.hidden = false;
            } else {
                labelEl.hidden = true;
            }
        }
        var gapEl = document.getElementById("kpiInsightTrenGap");
        if (gapEl) {
            if (label.gap) {
                setText("kpiInsightTrenGap", label.gap);
                gapEl.hidden = false;
            } else {
                gapEl.hidden = true;
            }
        }
    }

    function renderInsightRasio(s, year) {
        var el = document.getElementById("kpiInsightRasio");
        if (!el) {
            return;
        }
        var p = (Number(s.kedatangan_penumpang) || 0) + (Number(s.keberangkatan_penumpang) || 0);
        var k = (Number(s.kedatangan_kendaraan) || 0) + (Number(s.keberangkatan_kendaraan) || 0);
        if (!(k > 0) || !isFinite(p)) {
            setTextClass("kpiInsightRasio", "insight-value insight-value-error");
            setText("kpiInsightRasio", "—");
            setText("kpiInsightRasioSub", "Agregat terminal, bukan load factor kapasitas kursi · " + year);
            return;
        }
        setTextClass("kpiInsightRasio", "insight-value insight-value-live");
        setText("kpiInsightRasio", formatRatio(p / k));
        setText("kpiInsightRasioSub", "Agregat terminal, bukan load factor kapasitas kursi · " + year);
    }

    function renderSystemAlertState(state, msg) {
        var statusEl = document.getElementById("alertStatus");
        var detailEl = document.getElementById("alertDetail");
        var liveBadge = document.getElementById("alertLiveBadge");
        var retryBtn = document.getElementById("alertRetry");
        var bar = document.querySelector(".alert-bar");
        var iconEl = document.getElementById("alertIcon");

        var statusText = "";
        var detailText = "";
        var cls = "alert-status";
        var barCls = "";
        var iconCls = "icon-md icon-muted";
        var showRetry = false;
        var showLive = false;

        if (state === "loading") {
            statusText = "Memuat…";
            cls = "alert-status";
            barCls = "";
            iconCls = "icon-md icon-muted";
        } else if (state === "success") {
            statusText = "Koneksi Data Aktif";
            detailText = "API berhasil menyediakan data resmi untuk tahun " + selectedYear + ".";
            cls = "alert-status alert-status-ok";
            barCls = "alert-bar-ok";
            iconCls = "icon-md text-green";
            showLive = true;
        } else if (state === "empty") {
            statusText = "Data Belum Tersedia";
            detailText = "Belum ada catatan aktivitas transportasi tercatat untuk tahun " + selectedYear + ".";
            cls = "alert-status alert-status-empty";
            barCls = "";
            iconCls = "icon-md icon-muted";
        } else if (state === "error") {
            statusText = "Koneksi Data Terganggu";
            detailText = msg || "Gagal memuat data.";
            cls = "alert-status alert-status-error";
            barCls = "alert-bar-error";
            iconCls = "icon-md text-red";
            showRetry = true;
        }

        if (statusEl) {
            statusEl.textContent = statusText;
            statusEl.className = cls;
        }
        if (detailEl) {
            detailEl.textContent = detailText;
            detailEl.hidden = !detailText;
        }
        if (liveBadge) {
            liveBadge.hidden = !showLive;
        }
        if (retryBtn) {
            retryBtn.hidden = !showRetry;
        }
        if (bar) {
            bar.className = "alert-bar" + (barCls ? " " + barCls : "");
        }
        if (iconEl) {
            iconEl.setAttribute("class", iconCls);
        }
    }

    /* =================================================================
       9. Native SVG Monthly Trend Chart (Zero InnerHTML, Pure DOM)
       ================================================================= */
    function clearTrendChart(summaryMsg) {
        var wrap = document.getElementById("chartSvgWrap");
        if (wrap) {
            wrap.replaceChildren();
        }
        setHidden("chartEmptyWrap", true);
        setHidden("chartGapNotice", true);
        setText("chartSummaryText", summaryMsg || "Memuat ringkasan tren…");
    }

    function renderEmptyTrendChart() {
        var wrap = document.getElementById("chartSvgWrap");
        if (wrap) {
            wrap.replaceChildren();
        }
        setHidden("chartEmptyWrap", false);
        setHidden("chartGapNotice", true);
        setText("chartSummaryText", "Tidak ada data pergerakan bulanan.");
    }

    function renderMonthlyTrendChart(trend, metric, year) {
        var wrap = document.getElementById("chartSvgWrap");
        var emptyWrap = document.getElementById("chartEmptyWrap");
        if (!wrap) {
            return;
        }

        wrap.replaceChildren();

        var src = Array.isArray(trend) ? trend : [];
        var values = [];
        var activeMonthsCount = 0;
        var activeMonthIndices = [];
        var totalValue = 0;
        var maxValue = 0;
        var maxMonthIdx = -1;

        for (var i = 0; i < 12; i++) {
            var rec = src[i] || {};
            var val = (metric === "kendaraan") ? monthVehicleMovement(rec) : monthPassengerMovement(rec);
            values.push(val);
            if (val > 0) {
                activeMonthsCount++;
                activeMonthIndices.push(i);
                totalValue += val;
                if (val > maxValue) {
                    maxValue = val;
                    maxMonthIdx = i;
                }
            }
        }

        if (activeMonthsCount === 0) {
            if (emptyWrap) {
                emptyWrap.hidden = false;
            }
            setText("chartSummaryText", "Data pergerakan " + metric + " belum tercatat untuk tahun " + year + ".");
            setHidden("chartGapNotice", true);
            return;
        }

        if (emptyWrap) {
            emptyWrap.hidden = true;
        }

        // Cek adanya jeda periode
        var hasGap = false;
        if (activeMonthIndices.length > 1) {
            for (var k = 0; k < activeMonthIndices.length - 1; k++) {
                if (activeMonthIndices[k + 1] - activeMonthIndices[k] > 1) {
                    hasGap = true;
                    break;
                }
            }
        }
        setHidden("chartGapNotice", !hasGap);

        var metricName = (metric === "kendaraan") ? "Kendaraan" : "Penumpang";
        var summary = "Total " + formatNumber(totalValue) + " pergerakan " + metricName.toLowerCase() + " tercatat pada tahun " + year;
        if (maxMonthIdx >= 0) {
            summary += " (puncak: " + NAMA_BULAN_ID[maxMonthIdx] + " dengan " + formatNumber(maxValue) + " pergerakan).";
        } else {
            summary += ".";
        }
        setText("chartSummaryText", summary);

        // SVG Layout Setup
        var viewBoxW = 860;
        var viewBoxH = 260;
        var padLeft = 70;
        var padRight = 30;
        var padTop = 30;
        var padBottom = 45;

        var chartW = viewBoxW - padLeft - padRight;
        var chartH = viewBoxH - padTop - padBottom;

        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("viewBox", "0 0 " + viewBoxW + " " + viewBoxH);
        svg.setAttribute("class", "chart-svg");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Grafik tren bulanan pergerakan " + metricName + " tahun " + year);

        // Skala Y
        var yMaxTarget = Math.ceil(maxValue * 1.15) || 10;
        // Bulatkan yMaxTarget ke angka kelipatan rapi
        var magnitude = Math.pow(10, Math.floor(Math.log10(yMaxTarget)));
        var niceMax = Math.ceil(yMaxTarget / magnitude) * magnitude;
        if (niceMax < yMaxTarget) {
            niceMax = yMaxTarget;
        }

        // Y Grid Lines & Labels (4 ticks: 0, 33%, 66%, 100%)
        var gridTicks = 4;
        for (var t = 0; t <= gridTicks; t++) {
            var tickVal = (niceMax / gridTicks) * t;
            var yPos = padTop + chartH - (t / gridTicks) * chartH;

            var gridLine = document.createElementNS(SVG_NS, "line");
            gridLine.setAttribute("x1", String(padLeft));
            gridLine.setAttribute("y1", String(yPos));
            gridLine.setAttribute("x2", String(padLeft + chartW));
            gridLine.setAttribute("y2", String(yPos));
            gridLine.setAttribute("class", "svg-grid-line");
            svg.appendChild(gridLine);

            var yLabel = document.createElementNS(SVG_NS, "text");
            yLabel.setAttribute("x", String(padLeft - 10));
            yLabel.setAttribute("y", String(yPos + 4));
            yLabel.setAttribute("class", "svg-axis-label");
            yLabel.setAttribute("text-anchor", "end");
            yLabel.textContent = formatNumber(tickVal);
            svg.appendChild(yLabel);
        }

        // Koordinat titik X dan Y
        var points = [];
        for (var m = 0; m < 12; m++) {
            var xPos = padLeft + (m / 11) * chartW;
            var valM = values[m];
            var yPosM = padTop + chartH - (valM / niceMax) * chartH;
            points.push({
                x: xPos,
                y: yPosM,
                val: valM,
                monthIdx: m,
                monthName: NAMA_BULAN_PENDEK[m]
            });

            // Sumbu X: Label bulan
            var xLabel = document.createElementNS(SVG_NS, "text");
            xLabel.setAttribute("x", String(xPos));
            xLabel.setAttribute("y", String(padTop + chartH + 22));
            xLabel.setAttribute("class", "svg-axis-label");
            xLabel.setAttribute("text-anchor", "middle");
            xLabel.textContent = NAMA_BULAN_PENDEK[m];
            svg.appendChild(xLabel);
        }

        // Buat Area Gradient Fill
        var defs = document.createElementNS(SVG_NS, "defs");
        var grad = document.createElementNS(SVG_NS, "linearGradient");
        var gradId = "chartGradient" + metric;
        grad.setAttribute("id", gradId);
        grad.setAttribute("x1", "0");
        grad.setAttribute("y1", "0");
        grad.setAttribute("x2", "0");
        grad.setAttribute("y2", "1");

        var stop1 = document.createElementNS(SVG_NS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", metric === "kendaraan" ? "#d97706" : "#2563eb");
        stop1.setAttribute("stop-opacity", "0.35");
        grad.appendChild(stop1);

        var stop2 = document.createElementNS(SVG_NS, "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", metric === "kendaraan" ? "#d97706" : "#2563eb");
        stop2.setAttribute("stop-opacity", "0.02");
        grad.appendChild(stop2);
        defs.appendChild(grad);
        svg.appendChild(defs);

        // Gambar Garis Tren & Area
        // Pisahkan garis jika ada segmen jeda periode (jangan hubungkan jeda seolah berurutan)
        var strokeColor = metric === "kendaraan" ? "#d97706" : "#2563eb";

        // Segmentasi berdasarkan data aktif
        var segments = [];
        var currentSegment = [];

        for (var pIdx = 0; pIdx < points.length; pIdx++) {
            var pt = points[pIdx];
            if (pt.val > 0) {
                if (currentSegment.length > 0) {
                    var prevPt = currentSegment[currentSegment.length - 1];
                    if (pt.monthIdx - prevPt.monthIdx > 1) {
                        // Jeda ditemukan! Tutup segment saat ini dan buat segment baru
                        segments.push(currentSegment);
                        currentSegment = [pt];
                    } else {
                        currentSegment.push(pt);
                    }
                } else {
                    currentSegment.push(pt);
                }
            }
        }
        if (currentSegment.length > 0) {
            segments.push(currentSegment);
        }

        // Render Segments
        segments.forEach(function (seg) {
            if (seg.length > 1) {
                // Area Path
                var areaPathData = "M " + seg[0].x + " " + (padTop + chartH);
                for (var s = 0; s < seg.length; s++) {
                    areaPathData += " L " + seg[s].x + " " + seg[s].y;
                }
                areaPathData += " L " + seg[seg.length - 1].x + " " + (padTop + chartH) + " Z";

                var areaPath = document.createElementNS(SVG_NS, "path");
                areaPath.setAttribute("d", areaPathData);
                areaPath.setAttribute("fill", "url(#" + gradId + ")");
                svg.appendChild(areaPath);

                // Line Path
                var linePathData = "M " + seg[0].x + " " + seg[0].y;
                for (var l = 1; l < seg.length; l++) {
                    linePathData += " L " + seg[l].x + " " + seg[l].y;
                }

                var linePath = document.createElementNS(SVG_NS, "path");
                linePath.setAttribute("d", linePathData);
                linePath.setAttribute("class", "svg-trend-line");
                linePath.setAttribute("stroke", strokeColor);
                svg.appendChild(linePath);
            } else if (seg.length === 1) {
                // Satu titik terisolir
                var isoLine = document.createElementNS(SVG_NS, "line");
                isoLine.setAttribute("x1", String(seg[0].x));
                isoLine.setAttribute("y1", String(padTop + chartH));
                isoLine.setAttribute("x2", String(seg[0].x));
                isoLine.setAttribute("y2", String(seg[0].y));
                isoLine.setAttribute("stroke", strokeColor);
                isoLine.setAttribute("stroke-width", "2");
                isoLine.setAttribute("stroke-dasharray", "3 3");
                svg.appendChild(isoLine);
            }
        });

        // Hubungkan jeda antar segmen dengan garis putus-putus transparan untuk konteks visual
        if (segments.length > 1) {
            for (var g = 0; g < segments.length - 1; g++) {
                var segA = segments[g];
                var segB = segments[g + 1];
                var ptA = segA[segA.length - 1];
                var ptB = segB[0];

                var gapLine = document.createElementNS(SVG_NS, "line");
                gapLine.setAttribute("x1", String(ptA.x));
                gapLine.setAttribute("y1", String(ptA.y));
                gapLine.setAttribute("x2", String(ptB.x));
                gapLine.setAttribute("y2", String(ptB.y));
                gapLine.setAttribute("class", "svg-trend-line svg-trend-line-dashed");
                gapLine.setAttribute("stroke", strokeColor);
                svg.appendChild(gapLine);
            }
        }

        // Titik Data (Nodes) & Nilai
        points.forEach(function (pt) {
            if (pt.val > 0) {
                var circle = document.createElementNS(SVG_NS, "circle");
                circle.setAttribute("cx", String(pt.x));
                circle.setAttribute("cy", String(pt.y));
                circle.setAttribute("r", "4.5");
                circle.setAttribute("class", "svg-trend-node");
                circle.setAttribute("fill", "#ffffff");
                circle.setAttribute("stroke", strokeColor);
                circle.setAttribute("stroke-width", "2.5");

                var titleEl = document.createElementNS(SVG_NS, "title");
                titleEl.textContent = pt.monthName + " " + year + ": " + formatNumber(pt.val) + " " + metricName.toLowerCase();
                circle.appendChild(titleEl);
                svg.appendChild(circle);

                // Label nilai di atas titik
                var valText = document.createElementNS(SVG_NS, "text");
                valText.setAttribute("x", String(pt.x));
                valText.setAttribute("y", String(pt.y - 8));
                valText.setAttribute("class", "svg-point-label");
                valText.textContent = formatNumber(pt.val);
                svg.appendChild(valText);
            }
        });

        wrap.appendChild(svg);
    }

    /* =================================================================
       10. Status API, Timestamp & Retry Controls
       ================================================================= */
    function setApiStateLoading() {
        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", true);
        setHidden("apiErrorText", true);
        setHidden("retryBtn", true);
        setHidden("dataTimestamp", true);
        setHidden("kpiYearContext", true);
    }

    function setApiStateError(msg) {
        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", false);
        setHidden("retryBtn", false);
        setHidden("dataTimestamp", true);
        setHidden("kpiYearContext", true);
        if (msg) {
            setText("apiErrorText", msg);
        }
        setHidden("apiErrorText", false);
    }

    function setApiStateEmpty() {
        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", true);
        setHidden("retryBtn", true);
        setHidden("dataTimestamp", true);
        setHidden("kpiYearContext", true);
        setHidden("apiErrorText", true);
    }

    function setApiSuccess() {
        setHidden("apiStatusOk", false);
        setHidden("apiStatusErr", true);
        setHidden("retryBtn", true);
        setHidden("apiErrorText", true);
        setHidden("dataTimestamp", false);
        setText("dataTimestamp", "Data dimuat: " + formatTimeWIB(new Date()) + " WIB");
        setHidden("kpiYearContext", false);
        setText("kpiYearContext", "Tahun " + selectedYear);
    }

    function setApiNeutral() {
        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", true);
        setHidden("retryBtn", true);
        setHidden("apiErrorText", true);
        setHidden("dataTimestamp", true);
        setHidden("kpiYearContext", true);
    }

    /* =================================================================
       11. Clock WIB
       ================================================================= */
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
       12. Sidebar Mobile (Drawer Navigation)
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
       13. Toggle Metrik Grafik Tren (Penumpang vs Kendaraan)
       ================================================================= */
    var btnPenumpang = document.getElementById("btnMetricPenumpang");
    var btnKendaraan = document.getElementById("btnMetricKendaraan");

    function setMetric(metric) {
        if (activeMetric === metric) {
            return;
        }
        activeMetric = metric;

        if (btnPenumpang && btnKendaraan) {
            var isPenumpang = (metric === "penumpang");
            btnPenumpang.classList.toggle("is-active", isPenumpang);
            btnPenumpang.setAttribute("aria-pressed", isPenumpang ? "true" : "false");
            btnKendaraan.classList.toggle("is-active", !isPenumpang);
            btnKendaraan.setAttribute("aria-pressed", !isPenumpang ? "true" : "false");
        }

        if (currentDashboardData && currentDashboardData.trend) {
            renderMonthlyTrendChart(currentDashboardData.trend, activeMetric, selectedYear);
        }
    }

    if (btnPenumpang) {
        btnPenumpang.addEventListener("click", function () {
            setMetric("penumpang");
        });
    }
    if (btnKendaraan) {
        btnKendaraan.addEventListener("click", function () {
            setMetric("kendaraan");
        });
    }

    /* =================================================================
       14. Inisialisasi & Event Listeners
       ================================================================= */
    document.addEventListener("DOMContentLoaded", function () {
        updateClock();
        setInterval(updateClock, 1000);

        function handleRetry() {
            if (selectedYear) {
                loadDashboardData();
            } else {
                initYears();
            }
        }

        var retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
            retryBtn.addEventListener("click", handleRetry);
        }
        var alertRetryBtn = document.getElementById("alertRetry");
        if (alertRetryBtn) {
            alertRetryBtn.addEventListener("click", handleRetry);
        }

        var select = document.getElementById("yearSelect");
        if (select) {
            select.addEventListener("change", function () {
                selectedYear = Number(select.value);
                loadDashboardData();
            });
        }

        initYears();
    });
})();
