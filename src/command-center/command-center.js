/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center Prototype
   PHASE 14D — fondasi data live (read-only) melalui gateway resmi /api/.
   PHASE 14F — penyesuaian UI sesuai metodologi yang disetujui (14E/14E.1):
     - perbandingan periode dihitung di frontend dari trend (bukan
       insights.tren backend), dengan kalender tertutup per Asia/Jakarta;
     - System Alert V1 (status koneksi deterministik, bukan simulasi);
     - Top Movers ditunda (BELUM TERSEDIA);
     - Kualitas Data deskriptif (BELUM DAPAT DIHITUNG);
     - Transport Intelligence hanya indikator (tanpa skor komposit).

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

    // State Peta Mini Simpul Transportasi (PHASE 15B)
    var miniMap = null;
    var mapMarkerGroup = null;
    var JABAR_FALLBACK_BOUNDS = [
        [-7.82, 106.35],
        [-5.90, 108.85]
    ];

    /* =================================================================
       2. Util aman: setText & escapeHtml (sanitized DOM & strings)
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
       3a. Analisis periode aman (PHASE 14F — metodologi disetujui)
       ================================================================= */

    // Nama bulan lengkap untuk label (indeks 0 = Januari).
    var NAMA_BULAN_ID = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Tahun & bulan kalender saat ini dalam zona Asia/Jakarta.
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

    // Bulan dinyatakan memiliki aktivitas jika minimal satu metrik
    // pergerakan (penumpang/kendaraan) tercatat > 0.
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

    // Helper analisis periode: memakai SERI TREN lengkap (12 posisi,
    // indeks 0 = Januari) yang dikembalikan getDashboardData. Menghitung
    // perubahan persentase antara DUA bulan kalender-tertutup terakhir yang
    // memiliki aktivitas. Input tidak pernah dimutasikan (clone dulu).
    function analyzePeriod(trend, tahun) {
        // 1) Validasi tahun target.
        if (tahun === null || tahun === undefined || !isFinite(Number(tahun))) {
            return { available: false, reason: "tahun tidak valid" };
        }
        var year = Number(tahun);
        var now = getCurrentPeriodWIB();

        // 2) Tahun yang masih akan datang → tidak tersedia.
        if (year > now.tahun) {
            return { available: false, reason: "tahun masih akan datang" };
        }

        // 3) Clone input (jangan mutasi array respons API).
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

        // 4) Untuk tahun berjalan: bulan berjalan & masa depan dikecualikan.
        //    Untuk tahun lampau: seluruh 12 bulan kalender tertutup.
        var lastAllowedMonth = (year === now.tahun) ? now.bulan - 1 : 12;

        // 5) Kumpulkan bulan tertutup yang punya aktivitas (diurutkan naik).
        var active = [];
        for (var m = 1; m <= lastAllowedMonth; m++) {
            var rec2 = months[m - 1] || {};
            if (monthHasActivity(rec2)) {
                active.push(m);
            }
        }

        // 6) Butuh minimal dua bulan untuk membandingkan.
        if (active.length < 2) {
            return {
                available: false,
                reason: "kurang dari dua bulan",
                aktivitas: active.slice()
            };
        }

        // 7) Dua bulan terakhir yang punya aktivitas.
        var bulanTerakhir = active[active.length - 1];
        var bulanSebelumnya = active[active.length - 2];
        var recAkhir = months[bulanTerakhir - 1] || {};
        var recAwal = months[bulanSebelumnya - 1] || {};
        var nilaiAkhir = monthPassengerMovement(recAkhir);
        var nilaiAwal = monthPassengerMovement(recAwal);

        // 8) Baseline nol / non-finit → persentase tidak tersedia.
        if (nilaiAwal <= 0 || !isFinite(nilaiAkhir) || !isFinite(nilaiAwal)) {
            return {
                available: false,
                reason: "baseline nol",
                aktivitas: active.slice(),
                bulanTerakhir: bulanTerakhir,
                bulanSebelumnya: bulanSebelumnya
            };
        }

        // 9) Persentase dihitung dari NILAI pergerakan penumpang,
        //    bukan dari nomor bulan.
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

    // Label manusiawi untuk hasil analyzePeriod.
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
        var label;
        if (result.berurutan) {
            label = "Perubahan bulanan: " + result.namaSebelumnya + " → " + result.namaTerakhir;
        } else {
            label = "Perubahan: " + result.namaSebelumnya + " → " + result.namaTerakhir;
        }
        return {
            value: arah + " " + pctLabel,
            label: label,
            gap: result.berurutan ? "" : "Terdapat jeda periode",
            sub: "Periode kalender selesai; kelengkapan pelaporan belum diverifikasi.",
            cls: "insight-value-live"
        };
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

        // State eksplisit: loading — initial retry harus benar-benar
        // berubah menjadi loading dan error lama langsung hilang.
        setStateLoading();

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
                setStateError("Gagal memuat daftar tahun. " + friendlyError(err));
                return null;
            });
    }

    /* =================================================================
       6. Ambil dashboardData untuk tahun terpilih
       ================================================================= */
    function loadDashboardData() {
        var year = selectedYear;
        var requestId = ++lastRequestId; // batalkan request lama yang tertunda

        // State eksplisit: loading — bersihkan semua data request sebelumnya,
        // jangan tampilkan API Terhubung / timestamp baru / data lama.
        setStateLoading();

        return rpc("getDashboardData", [{ tahun: year }], requestId)
            .then(function (data) {
                if (!isCurrent(requestId)) {
                    return null; // stale — abaikan
                }
                if (!data) {
                    setStateError("Data kosong dari server.");
                    return null;
                }
                var empty = isDataEmpty(data);
                renderLive(data, year, empty);
                if (empty) {
                    // Empty: jangan tampilkan "API Terhubung" atau timestamp baru.
                    setApiNeutral();
                } else {
                    setApiSuccess();
                }
                return null;
            })
            .catch(function (err) {
                if (!isCurrent(requestId)) {
                    return null; // stale — abaikan
                }
                setStateError(friendlyError(err));
                return null;
            });
    }

    // Deteksi response kosong: summary seluruhnya nol DAN tidak ada bulan
    // dengan aktivitas pada trend.
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
       6b. State eksplisit: loading / success / empty / error
       ================================================================= */

    // Konteks tahun pada setiap KPI — selalu sinkron dengan selectedYear
    // saat ini, atau "Tahun —" bila belum tersedia. Dipanggil di state
    // loading/error agar tidak ada tahun respons sukses sebelumnya yang
    // tertinggal di komponen live.
    function setYearContextState() {
        var label = (selectedYear !== null && selectedYear !== undefined)
            ? "Tahun " + selectedYear
            : "Tahun —";
        setText("kpiPenumpangYear", label);
        setText("kpiKendaraanYear", label);
        setText("kpiTerminalYear", label);
        setText("kpiUppkbYear", label);
    }

    // Sub-teks insight dinetralkan agar tidak menyimpan tahun/nilai dari
    // respons sukses sebelumnya.
    function resetInsightSubs() {
        setText("kpiInsightPuncakSub", "Berdasarkan data yang tersedia");
        setText("kpiInsightRasioSub", "Agregat terminal, bukan load factor kapasitas kursi");
    }

    // Loading — dipanggil saat request BARU mulai. Tidak menampilkan
    // "API Terhubung", tidak membuat timestamp baru, dan membersihkan
    // semua jejak data request sebelumnya: KPI, insight, rasio, period
    // analysis, Transport Intelligence, System Alert, error.
    function setStateLoading() {
        setKpiLoading();
        setInsightLoading();
        setText("kpiInsightRasio", "Memuat…");
        setTextClass("kpiInsightRasio", "insight-value insight-value-loading");
        setHidden("kpiInsightTrenLabel", true);
        setHidden("kpiInsightTrenGap", true);

        setText("tiTren", "—");
        setText("tiPuncak", "—");
        setText("tiRasio", "—");
        setHidden("tiGap", true);

        // Bersihkan konteks tahun & sub-teks insight dari respons lama.
        setYearContextState();
        resetInsightSubs();

        // System Alert → Memuat (belum ada keputusan koneksi).
        renderSystemAlertState("loading", "");

        // Status API: semua tersembunyi (termasuk apiErrorText).
        setApiStateLoading();

        // Status Peta: Memuat
        setMapState("loading");
    }

    // Error — request gagal. Semua KPI/insight live menjadi "—",
    // System Alert = Koneksi Data Terganggu + pesan ramah + tombol retry.
    function setStateError(msg) {
        setKpiError();
        setInsightError();
        setText("kpiInsightRasio", "—");
        setTextClass("kpiInsightRasio", "insight-value insight-value-error");
        setHidden("kpiInsightTrenLabel", true);
        setHidden("kpiInsightTrenGap", true);

        setText("tiTren", "—");
        setText("tiPuncak", "—");
        setText("tiRasio", "—");
        setHidden("tiGap", true);

        // Bersihkan konteks tahun & sub-teks insight dari respons lama.
        setYearContextState();
        resetInsightSubs();

        renderSystemAlertState("error", msg);
        setApiStateError(msg);

        // Status Peta: Error
        setMapState("error", msg);
    }

    // Empty — response diterima tapi seluruhnya nol.
    // System Alert = Data Belum Tersedia, tanpa LIVE, tanpa retry.
    function setStateEmpty() {
        setKpiError();
        setInsightError();
        setText("kpiInsightRasio", "—");
        setTextClass("kpiInsightRasio", "insight-value insight-value-error");
        setHidden("kpiInsightTrenLabel", true);
        setHidden("kpiInsightTrenGap", true);

        setText("tiTren", "Perbandingan belum tersedia");
        setText("tiPuncak", "Puncak belum tersedia");
        setText("tiRasio", "Rasio belum tersedia");
        setHidden("tiGap", true);

        renderSystemAlertState("empty", "");
        setApiStateEmpty();

        // Status Peta: Empty
        setMapState("empty");
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
       8. Render data live ke KPI + insight minimal
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

        // Konteks tahun aktif pada setiap KPI
        setText("kpiPenumpangYear", "Tahun " + year);
        setText("kpiKendaraanYear", "Tahun " + year);
        setText("kpiTerminalYear", "Tahun " + year);
        setText("kpiUppkbYear", "Tahun " + year);

        // Label netral (bukan YoY). "Tahun terpilih" agar benar untuk
        // tahun lampau maupun tahun berjalan.
        setText("kpiPenumpangTrend", "Data produksi tahun terpilih");
        setText("kpiKendaraanTrend", "Data produksi tahun terpilih");

        // ---- Insight (PHASE 14F) ----
        var ins = d.insights || {};

        if (empty) {
            setStateEmpty();
            return;
        }

        renderInsightPuncak(ins.puncakBulan, year);
        renderInsightRasio(s, year);

        // Perbandingan periode dihitung dari TREND (seri bulanan lengkap),
        // bukan dari insights.tren backend. Tren backend dapat membandingkan
        // bulan yang masih berjalan; frontend hanya memakai bulan kalender
        // tertutup (Asia/Jakarta).
        renderInsightTren(d.trend, year);

        // System Alert V1 (status koneksi deterministik)
        renderSystemAlertState("success", "");

        // Transport Intelligence Overview (indikator saja — tanpa skor)
        renderTransportIntelligence(d.trend, ins, s, year);

        // Peta Mini Simpul Transportasi (PHASE 15B)
        renderMiniMapData(d, empty);

        // Sembunyikan status demo-dulu di insight
        setHidden("insightDemoNote", true);
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

    // Perbandingan periode (PHASE 14F): dihitung dari seri trend oleh
    // analyzePeriod, BUKAN dari insights.tren backend.
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

        // Label bulan yang dibandingkan — hanya jika tersedia.
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

    // Rasio penumpang terhadap pergerakan kendaraan, dihitung dari summary
    // (kedatangan+keberangkatan penumpang) / (kedatangan+keberangkatan kendaraan).
    // Rasio agregat, bukan load factor kapasitas kursi; tanpa klaim benchmark.
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

    // System Alert V1 — status koneksi deterministik (PHASE 14F).
    // State eksplisit: loading / success / empty / error.
    // - success: "Koneksi Data Aktif" + badge LIVE.
    // - empty:   "Data Belum Tersedia" (tanpa LIVE, tanpa retry).
    // - error:   "Koneksi Data Terganggu" + pesan ramah + tombol Coba Lagi.
    // - loading: "Memuat…" (belum ada keputusan koneksi).
    // Tidak mengklaim kesehatan seluruh sistem dan tidak memakai ambang
    // operasional (Normal/Perhatian/Kritis).
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
            detailText = "API berhasil menyediakan data untuk tahun " + selectedYear + ".";
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

    // Transport Intelligence Overview (PHASE 14F) — indikator saja, tanpa
    // skor komposit. Menampilkan perubahan periode aman, puncak pergerakan
    // penumpang, dan rasio penumpang terhadap pergerakan kendaraan.
    function renderTransportIntelligence(trend, ins, s, year) {
        var trenEl = document.getElementById("tiTren");
        var puncakEl = document.getElementById("tiPuncak");
        var rasioEl = document.getElementById("tiRasio");
        if (!trenEl && !puncakEl && !rasioEl) {
            return;
        }

        var period = analyzePeriod(trend, year);
        var label = describePeriod(period);

        // 1) Perubahan periode aman — menyebut bulan yang dibandingkan
        //    (mis. "Juni → Juli · Naik 16,7%") dan menandai jeda periode.
        if (trenEl) {
            if (period.available) {
                setText("tiTren", period.namaSebelumnya + " → " + period.namaTerakhir + " · " + label.value);
            } else {
                setText("tiTren", "Perbandingan belum tersedia");
            }
        }
        var gapEl = document.getElementById("tiGap");
        if (gapEl) {
            if (period.available && !period.berurutan) {
                setText("tiGap", "Terdapat jeda periode");
                gapEl.hidden = false;
            } else {
                gapEl.hidden = true;
            }
        }

        // 2) Puncak pergerakan penumpang tercatat
        if (puncakEl) {
            var pk = (ins && ins.puncakBulan) || null;
            if (pk && pk.bulan && pk.penumpang) {
                var pkNama = (pk.nama && pk.nama !== "-") ? pk.nama : NAMA_BULAN_ID[pk.bulan - 1] || String(pk.bulan);
                setText("tiPuncak", pkNama + " " + year + " · " + formatNumber(pk.penumpang) + " pergerakan");
            } else {
                setText("tiPuncak", "Puncak belum tersedia");
            }
        }

        // 3) Rasio penumpang terhadap pergerakan kendaraan (agregat)
        if (rasioEl) {
            var p = (Number(s.kedatangan_penumpang) || 0) + (Number(s.keberangkatan_penumpang) || 0);
            var k = (Number(s.kedatangan_kendaraan) || 0) + (Number(s.keberangkatan_kendaraan) || 0);
            if (k > 0 && isFinite(p)) {
                setText("tiRasio", "Rasio " + formatRatio(p / k) + " penumpang/kendaraan");
            } else {
                setText("tiRasio", "Rasio belum tersedia");
            }
        }
    }

    /* =================================================================
       8b. Peta Simpul Transportasi (PHASE 15B)
       ================================================================= */
    function createTerminalIcon() {
        return L.divIcon({
            className: "cc-div-icon",
            html: '<div class="cc-map-marker cc-marker-terminal" title="Terminal Tipe A" aria-label="Terminal Tipe A">' +
                  '<svg class="cc-marker-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' +
                  '</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -13]
        });
    }

    function createUppkbIcon() {
        return L.divIcon({
            className: "cc-div-icon",
            html: '<div class="cc-map-marker cc-marker-uppkb" title="UPPKB" aria-label="UPPKB">' +
                  '<svg class="cc-marker-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>' +
                  '</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -13]
        });
    }

    function createTerminalPopup(p) {
        var nama = escapeHtml(p.nama_terminal || p.nama || "Terminal");
        var kota = escapeHtml(p.kabupaten_kota || p.kota || "Jawa Barat");
        var stats = p.stats || {};
        var pen = (Number(stats.kedatangan_penumpang) || 0) + (Number(stats.keberangkatan_penumpang) || 0);
        var knd = (Number(stats.kedatangan_kendaraan) || 0) + (Number(stats.keberangkatan_kendaraan) || 0);

        var html = '<div class="cc-popup">' +
            '<div class="cc-popup-title">' + nama + '</div>' +
            '<span class="cc-popup-badge cc-popup-badge-terminal">Terminal Tipe A</span>' +
            '<div class="cc-popup-detail">' + kota + '</div>';
        if (pen > 0 || knd > 0) {
            html += '<div class="cc-popup-metric">Pergerakan: ' + formatNumber(pen) + ' penumpang · ' + formatNumber(knd) + ' kendaraan</div>';
        }
        html += '</div>';
        return html;
    }

    function createUppkbPopup(u) {
        var nama = escapeHtml(u.nama || "UPPKB");
        var kab = escapeHtml(u.kabupaten || "Jawa Barat");
        var stats = u.stats || {};
        var diperiksa = Number(stats.diperiksa) || 0;

        var html = '<div class="cc-popup">' +
            '<div class="cc-popup-title">UPPKB ' + nama + '</div>' +
            '<span class="cc-popup-badge cc-popup-badge-uppkb">Penimbangan Kendaraan</span>' +
            '<div class="cc-popup-detail">' + kab + '</div>';
        if (diperiksa > 0) {
            html += '<div class="cc-popup-metric">Diperiksa: ' + formatNumber(diperiksa) + ' kendaraan</div>';
        }
        html += '</div>';
        return html;
    }

    function getVerifiedTerminalPoints(points) {
        if (!Array.isArray(points)) {
            return [];
        }
        return points.filter(function (p) {
            if (!p || typeof p !== "object") {
                return false;
            }
            var tipe = String(p.tipe || "").trim().toUpperCase();
            if (tipe !== "A" && tipe !== "TIPE A") {
                return false;
            }
            var lat = Number(p.lat);
            var lng = Number(p.lng);
            // Batas geografis Jawa Barat yang valid (-9 <= lat <= -5, 105 <= lng <= 110)
            return isFinite(lat) && isFinite(lng) && lat >= -9 && lat <= -5 && lng >= 105 && lng <= 110;
        });
    }

    function getVerifiedUppkbPoints(points) {
        if (!Array.isArray(points)) {
            return [];
        }
        return points.filter(function (u) {
            if (!u || typeof u !== "object") {
                return false;
            }
            var lat = Number(u.lat);
            var lng = Number(u.lng);
            // Batas geografis Jawa Barat yang valid (-9 <= lat <= -5, 105 <= lng <= 110)
            return isFinite(lat) && isFinite(lng) && lat >= -9 && lat <= -5 && lng >= 105 && lng <= 110;
        });
    }

    function initMiniMap() {
        var el = document.getElementById("miniMap");
        if (!el) {
            return;
        }

        if (typeof L === "undefined") {
            setMapState("error", "Pustaka peta tidak dapat dimuat.");
            return;
        }

        try {
            miniMap = L.map(el, {
                attributionControl: false,
                zoomControl: false,
                scrollWheelZoom: false,
                touchZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                dragging: !isMobile()
            });

            L.control.zoom({ position: "topleft" }).addTo(miniMap);

            L.control.attribution({
                position: "bottomleft",
                prefix: false
            }).addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>').addTo(miniMap);

            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                maxZoom: 19,
                subdomains: "abcd"
            }).addTo(miniMap);

            mapMarkerGroup = L.layerGroup().addTo(miniMap);

            miniMap.fitBounds(JABAR_FALLBACK_BOUNDS, { padding: [24, 24] });

            setTimeout(function () {
                if (miniMap) {
                    miniMap.invalidateSize();
                }
            }, 150);
        } catch (err) {
            setMapState("error", "Gagal menginisialisasi peta.");
        }
    }

    function setMapState(state, message) {
        var overlay = document.getElementById("mapStateOverlay");
        var spinner = document.getElementById("mapStateSpinner");
        var textEl = document.getElementById("mapStateText");

        if (!overlay || !textEl) {
            return;
        }

        if (state === "loading") {
            overlay.hidden = false;
            if (spinner) {
                spinner.hidden = false;
            }
            textEl.textContent = "Memuat peta simpul transportasi…";
            setText("mapCountTerminal", "—");
            setText("mapCountUppkb", "—");
        } else if (state === "available") {
            overlay.hidden = true;
        } else if (state === "empty") {
            overlay.hidden = false;
            if (spinner) {
                spinner.hidden = true;
            }
            textEl.textContent = "Data simpul transportasi belum tersedia untuk tahun terpilih.";
            if (mapMarkerGroup) {
                mapMarkerGroup.clearLayers();
            }
            if (miniMap) {
                miniMap.fitBounds(JABAR_FALLBACK_BOUNDS, { padding: [24, 24] });
            }
            setText("mapCountTerminal", "0");
            setText("mapCountUppkb", "0");
        } else if (state === "error") {
            overlay.hidden = false;
            if (spinner) {
                spinner.hidden = true;
            }
            textEl.textContent = "Gagal memuat simpul transportasi: " + (message || "Koneksi terganggu.");
            if (mapMarkerGroup) {
                mapMarkerGroup.clearLayers();
            }
            if (miniMap) {
                miniMap.fitBounds(JABAR_FALLBACK_BOUNDS, { padding: [24, 24] });
            }
            setText("mapCountTerminal", "—");
            setText("mapCountUppkb", "—");
        }
    }

    function renderMiniMapData(data, empty) {
        if (!miniMap || !mapMarkerGroup) {
            return;
        }

        if (empty) {
            setMapState("empty");
            return;
        }

        var terminals = getVerifiedTerminalPoints(data && data.points);
        var uppkbs = getVerifiedUppkbPoints(data && data.uppkbPoints);

        setText("mapCountTerminal", String(terminals.length));
        setText("mapCountUppkb", String(uppkbs.length));

        mapMarkerGroup.clearLayers();

        var boundsList = [];

        terminals.forEach(function (p) {
            var lat = Number(p.lat);
            var lng = Number(p.lng);
            var m = L.marker([lat, lng], { icon: createTerminalIcon() });
            m.bindPopup(createTerminalPopup(p));
            mapMarkerGroup.addLayer(m);
            boundsList.push([lat, lng]);
        });

        uppkbs.forEach(function (u) {
            var lat = Number(u.lat);
            var lng = Number(u.lng);
            var m = L.marker([lat, lng], { icon: createUppkbIcon() });
            m.bindPopup(createUppkbPopup(u));
            mapMarkerGroup.addLayer(m);
            boundsList.push([lat, lng]);
        });

        if (boundsList.length > 0) {
            miniMap.fitBounds(L.latLngBounds(boundsList), { padding: [24, 24], maxZoom: 11 });
        } else {
            miniMap.fitBounds(JABAR_FALLBACK_BOUNDS, { padding: [24, 24] });
        }

        setMapState("available");

        setTimeout(function () {
            if (miniMap) {
                miniMap.invalidateSize();
            }
        }, 100);
    }

    /* =================================================================
       9. Status API + timestamp + retry (TASK 6)
       ================================================================= */
    function setApiStateLoading() {
        // Saat request mulai: tidak ada "API Terhubung", tidak ada timestamp
        // baru, tidak ada error lama.
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
        // Sukses: baru tampilkan "API Terhubung" + timestamp baru.
        setHidden("apiStatusOk", false);
        setHidden("apiStatusErr", true);
        setHidden("retryBtn", true);
        setHidden("apiErrorText", true);
        setHidden("dataTimestamp", false);
        setText("dataTimestamp", "Data dimuat: " + formatTimeWIB(new Date()) + " WIB");
        setHidden("kpiYearContext", false);
        setText("kpiYearContext", "Tahun " + selectedYear);
    }

    // Empty tetap berhasil terhubung ke API, tapi TANPA klaim "API Terhubung"
    // dan tanpa timestamp baru.
    function setApiNeutral() {
        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", true);
        setHidden("retryBtn", true);
        setHidden("apiErrorText", true);
        setHidden("dataTimestamp", true);
        setHidden("kpiYearContext", true);
    }

    /* =================================================================
       10. Clock WIB (existing behavior)
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
       11. Sidebar mobile & navigation shell (PHASE 15A)
       ================================================================= */
    var sidebar = document.getElementById("appSidebar");
    var overlay = document.getElementById("sidebarOverlay");
    var toggleBtn = document.getElementById("sidebarToggle");
    var closeBtn = document.getElementById("sidebarClose");
    var lastFocusedElementBeforeOpen = null;
    var focusTimer = null;

    function isMobile() {
        return window.matchMedia("(max-width: 767px)").matches;
    }

    function isInertSupported() {
        return typeof HTMLElement !== "undefined" &&
               ("inert" in HTMLElement.prototype || (sidebar && "inert" in sidebar)) &&
               !(typeof window !== "undefined" && window.__simulateNoInert);
    }

    // Scoped fallback for environments where inert is unsupported (PHASE 15A)
    // Temporarily removes closed drawer focusables from tab order, preserving
    // any existing tabindex to restore safely upon opening or desktop resize.
    function applySidebarFocusFallback(disable) {
        if (!sidebar) {
            return;
        }
        var selector = 'a[href], button, input, select, textarea, [tabindex]';
        var els = sidebar.querySelectorAll(selector);
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.disabled || el.getAttribute("aria-disabled") === "true") {
                continue;
            }
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
        if (!sidebar) {
            return;
        }
        var mobile = isMobile();
        var isOpen = sidebar.classList.contains("is-open");
        var inertSupported = isInertSupported();

        if (mobile) {
            if (isOpen) {
                if (inertSupported && "inert" in sidebar) {
                    sidebar.inert = false;
                }
                sidebar.removeAttribute("inert");
                sidebar.removeAttribute("aria-hidden");
                applySidebarFocusFallback(false);
            } else {
                if (inertSupported && "inert" in sidebar) {
                    sidebar.inert = true;
                }
                sidebar.setAttribute("inert", "");
                sidebar.setAttribute("aria-hidden", "true");
                if (!inertSupported) {
                    applySidebarFocusFallback(true);
                }
            }
        } else {
            // Desktop: sidebar is permanently accessible
            if (inertSupported && "inert" in sidebar) {
                sidebar.inert = false;
            }
            sidebar.removeAttribute("inert");
            sidebar.removeAttribute("aria-hidden");
            applySidebarFocusFallback(false);
        }
    }

    function getFocusableElements(container) {
        if (!container) {
            return [];
        }
        var selector = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';
        var list = Array.prototype.slice.call(container.querySelectorAll(selector));
        return list.filter(function (el) {
            return !el.disabled && el.getAttribute("aria-disabled") !== "true" && el.offsetParent !== null;
        });
    }

    function setSidebarOpen(open) {
        if (!sidebar || !overlay || !toggleBtn) {
            return;
        }
        if (focusTimer) {
            clearTimeout(focusTimer);
            focusTimer = null;
        }

        var willOpen = !!open;
        if (willOpen) {
            lastFocusedElementBeforeOpen = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : toggleBtn;
        }

        sidebar.classList.toggle("is-open", willOpen);
        overlay.classList.toggle("is-visible", willOpen);
        overlay.hidden = !willOpen;
        toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        toggleBtn.setAttribute("aria-label", willOpen ? "Tutup menu navigasi" : "Buka menu navigasi");

        updateSidebarInertState();

        if (miniMap) {
            setTimeout(function () {
                miniMap.invalidateSize();
            }, 350);
        }

        if (willOpen) {
            // Practical focus containment: move focus into drawer
            focusTimer = setTimeout(function () {
                focusTimer = null;
                // Defensive state-check: abort if drawer closed before timer fired
                if (!sidebar.classList.contains("is-open") || (isMobile() && sidebar.hasAttribute("inert"))) {
                    return;
                }
                var focusable = getFocusableElements(sidebar);
                if (focusable.length > 0) {
                    focusable[0].focus();
                }
            }, 50);
        } else {
            // Focus restoration: return focus to toggleBtn or last focused element
            if (lastFocusedElementBeforeOpen && lastFocusedElementBeforeOpen !== document.body && typeof lastFocusedElementBeforeOpen.focus === "function") {
                lastFocusedElementBeforeOpen.focus();
            } else if (toggleBtn && typeof toggleBtn.focus === "function") {
                toggleBtn.focus();
            }
            lastFocusedElementBeforeOpen = null;
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

        // Close drawer on link click in mobile view
        sidebar.addEventListener("click", function (e) {
            var link = e.target.closest("a");
            if (link && isMobile()) {
                setSidebarOpen(false);
            }
        });

        document.addEventListener("keydown", function (e) {
            if (!sidebar.classList.contains("is-open") || !isMobile()) {
                return;
            }

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
    }

    function handleViewportChange() {
        if (!isMobile()) {
            if (sidebar && sidebar.classList.contains("is-open")) {
                setSidebarOpen(false);
            } else {
                updateSidebarInertState();
            }
        } else {
            updateSidebarInertState();
        }

        if (miniMap) {
            if (isMobile()) {
                if (miniMap.dragging && miniMap.dragging.enabled()) {
                    miniMap.dragging.disable();
                }
            } else {
                if (miniMap.dragging && !miniMap.dragging.enabled()) {
                    miniMap.dragging.enable();
                }
            }
            miniMap.invalidateSize();
        }
    }

    window.addEventListener("resize", handleViewportChange);
    var mobileMql = window.matchMedia("(max-width: 767px)");
    if (mobileMql && mobileMql.addEventListener) {
        mobileMql.addEventListener("change", handleViewportChange);
    }

    // Initial lifecycle state
    updateSidebarInertState();

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
        updateSidebarInertState();

        var selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
        if (selectedTab) {
            activateTab(selectedTab);
        }

        updateClock();
        setInterval(updateClock, 1000);

        // Retry manual — TASK 2 (tombol, bukan loop tanpa batas).
        // retryBtn (status bar) DAN alertRetry (System Alert) berbagi
        // mekanisme yang sama.
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

        // Perubahan tahun → muat ulang data (TASK 3)
        var select = document.getElementById("yearSelect");
        if (select) {
            select.addEventListener("change", function () {
                selectedYear = Number(select.value);
                loadDashboardData();
            });
        }

        // Inisialisasi Peta Mini Simpul Transportasi (PHASE 15B)
        initMiniMap();

        // Muat tahun + data awal
        initYears();
    });
})();
