/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center Modul Trayek (PHASE 15D)
   Direktori 10 trayek utama, metrik agregat, dan karakteristik lintasan
   Read-only API endpoint:
     - getRoutes
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

    // Request ID untuk mencegah race condition
    var lastRequestId = 0;

    // State data
    var allRoutes = [];
    var filteredRoutes = [];
    var activeFilter = {
        query: "",
        endpointStatus: ""
    };

    // State modal detail
    var modalOpen = false;
    var activeDetailRoute = null;
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

    function formatDistance(km) {
        if (km === null || km === undefined || isNaN(km)) {
            return "—";
        }
        var num = Number(km);
        if (!isFinite(num) || num <= 0) {
            return "—";
        }
        return num.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " km";
    }

    function formatDateRecord(str) {
        if (!str) return "Belum tercatat";
        try {
            var d = new Date(str);
            if (isNaN(d.getTime())) {
                return String(str);
            }
            var fmt = new Intl.DateTimeFormat("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            return fmt.format(d) + " WIB";
        } catch (e) {
            return String(str);
        }
    }

    function getEndpointStatus(r) {
        var hasOrigin = Boolean(r.origin_code && String(r.origin_code).trim());
        var hasDest = Boolean(r.dest_code && String(r.dest_code).trim());
        if (hasOrigin && hasDest) return "complete";
        if (hasOrigin || hasDest) return "partial";
        return "unmapped";
    }

    function getEndpointBadgeHtml(status) {
        if (status === "complete") {
            return '<span class="badge-endpoint-status badge-endpoint-complete">Simpul Lengkap</span>';
        }
        if (status === "partial") {
            return '<span class="badge-endpoint-status badge-endpoint-partial">Simpul Sebagian</span>';
        }
        return '<span class="badge-endpoint-status badge-endpoint-unmapped">Belum Terpetakan</span>';
    }

    function normalizeColor(c) {
        var s = String(c || "").trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
        return "#3b82f6";
    }

    /* =================================================================
       3. Client RPC (Read-Only getRoutes)
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
            second: "2-digit",
            hour12: false
        });
        setText("current-date", fmt.format(now));
        setText("current-time", timeFmt.format(now) + " WIB");
    }

    /* =================================================================
       5. Memuat Data Trayek
       ================================================================= */
    function loadTrayekData() {
        lastRequestId++;
        var curReqId = lastRequestId;

        // Reset UI State ke Loading
        setHidden("tableLoadingState", false);
        setHidden("tableEmptyState", true);
        setHidden("tableErrorState", true);
        setHidden("apiStatusOk", true);
        setHidden("apiStatusErr", true);
        setHidden("retryBtn", true);
        setHidden("apiErrorText", true);
        setHidden("dataTimestamp", true);
        setHidden("scopeContext", true);

        setText("kpiTotalRoutes", "Memuat…");
        setText("kpiTotalVolume", "Memuat…");
        setText("kpiTotalPerjalanan", "Memuat…");
        setText("kpiTopRoute", "Memuat…");
        setText("kpiTopRouteSub", "Volume tertinggi tercatat");
        setText("kpiTopRouteVolume", "Peringkat 1");
        setText("resultCount", "Memuat data trayek…");

        var rankingList = document.getElementById("rankingList");
        if (rankingList) {
            rankingList.innerHTML = '<p class="ranking-loading">Memuat peringkat trayek…</p>';
        }

        var tbody = document.getElementById("trayekTableBody");
        if (tbody) {
            tbody.innerHTML = "";
        }

        rpc("getRoutes", [], curReqId)
            .then(function (routes) {
                if (curReqId !== lastRequestId) return;
                if (!Array.isArray(routes)) {
                    throw new Error("Format respons trayek tidak valid.");
                }

                allRoutes = routes.slice();
                filteredRoutes = allRoutes.slice();

                // Hitung KPI Faktual
                renderKPIs(allRoutes);

                // Render Top 5 Ranking
                renderRanking(allRoutes);

                // Render Tabel Direktori
                applyFilters();

                // Status bar & API status
                var now = new Date();
                var timeStr = new Intl.DateTimeFormat("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                }).format(now);

                setText("dataTimestamp", "Data dimuat: " + timeStr + " WIB");
                setHidden("dataTimestamp", false);
                setHidden("scopeContext", false);
                setHidden("apiStatusOk", false);
                setHidden("apiStatusErr", true);
                setHidden("tableLoadingState", true);
            })
            .catch(function (err) {
                if (curReqId !== lastRequestId) return;

                // Gagal memuat data ditangani via UI error state (clean console)
                setHidden("tableLoadingState", true);
                setHidden("tableErrorState", false);
                setHidden("apiStatusOk", true);
                setHidden("apiStatusErr", false);
                setHidden("retryBtn", false);
                setHidden("apiErrorText", false);
                setText("apiErrorText", "Gagal memuat data dari server (" + (err.message || "network error") + ").");

                setText("kpiTotalRoutes", "—");
                setText("kpiTotalVolume", "—");
                setText("kpiTotalPerjalanan", "—");
                setText("kpiTopRoute", "—");
                setText("resultCount", "Data gagal dimuat");

                if (rankingList) {
                    rankingList.innerHTML = '<p class="ranking-empty">Peringkat tidak tersedia saat koneksi gagal.</p>';
                }
            });
    }

    /* =================================================================
       6. Render KPIs
       ================================================================= */
    function renderKPIs(routes) {
        var totalCount = routes.length;
        var totalVol = 0;
        var totalTrips = 0;
        var topRoute = null;

        routes.forEach(function (r) {
            var v = Number(r.volume) || 0;
            var t = Number(r.perjalanan) || 0;
            totalVol += v;
            totalTrips += t;
            if (!topRoute || v > (Number(topRoute.volume) || 0)) {
                topRoute = r;
            }
        });

        setText("kpiTotalRoutes", formatNumber(totalCount));
        setText("kpiTotalVolume", formatNumber(totalVol));
        setText("kpiTotalPerjalanan", formatNumber(totalTrips));

        if (topRoute) {
            setText("kpiTopRoute", topRoute.name || "—");
            setText("kpiTopRouteSub", formatNumber(topRoute.volume) + " penumpang tercatat");
            setText("kpiTopRouteVolume", "Volume Tertinggi (Peringkat 1)");
        } else {
            setText("kpiTopRoute", "—");
            setText("kpiTopRouteSub", "Tidak ada data");
            setText("kpiTopRouteVolume", "—");
        }
    }

    /* =================================================================
       7. Render Ranking (Top 5 Descending Volume)
       ================================================================= */
    function renderRanking(routes) {
        var listEl = document.getElementById("rankingList");
        if (!listEl) return;

        if (!routes || routes.length === 0) {
            listEl.innerHTML = '<p class="ranking-empty">Belum ada catatan trayek.</p>';
            return;
        }

        var sorted = routes.slice().sort(function (a, b) {
            return (Number(b.volume) || 0) - (Number(a.volume) || 0);
        });

        var top5 = sorted.slice(0, 5);
        var html = "";

        top5.forEach(function (r, index) {
            var rank = index + 1;
            var numCls = rank === 1 ? "ranking-num-1" :
                         rank === 2 ? "ranking-num-2" :
                         rank === 3 ? "ranking-num-3" : "ranking-num-other";
            var color = normalizeColor(r.color);

            var originText = r.origin_code ? escapeHtml(r.origin_code) : "Simpul belum terpetakan";
            var destText = r.dest_code ? escapeHtml(r.dest_code) : "Simpul belum terpetakan";
            var metaText = "Simpul: " + originText + " &rarr; " + destText + " &bull; " + formatDistance(r.jarak_km);

            html += '<div class="ranking-item" role="listitem">' +
                '<span class="ranking-num ' + numCls + '" aria-label="Peringkat ' + rank + '">' + rank + '</span>' +
                '<span class="ranking-color-indicator" style="background-color: ' + color + ';" aria-hidden="true"></span>' +
                '<div class="ranking-info">' +
                    '<div class="ranking-name" title="' + escapeHtml(r.name) + '">' + escapeHtml(r.name) + '</div>' +
                    '<div class="ranking-meta">' + metaText + '</div>' +
                '</div>' +
                '<div class="ranking-stats">' +
                    '<span class="ranking-val">' + formatNumber(r.volume) + '</span>' +
                    '<span class="ranking-unit">penumpang</span>' +
                '</div>' +
                '<button type="button" class="btn-ranking-detail" data-id="' + escapeHtml(r.id) + '" aria-label="Lihat detail trayek ' + escapeHtml(r.name) + '">Detail</button>' +
            '</div>';
        });

        listEl.innerHTML = html;
    }

    /* =================================================================
       8. Filter & Render Tabel Direktori
       ================================================================= */
    function applyFilters() {
        var query = activeFilter.query.toLowerCase().trim();
        var statusFilter = activeFilter.endpointStatus;

        filteredRoutes = allRoutes.filter(function (r) {
            // Pencarian nama, id, origin, dest
            if (query) {
                var nameMatch = (r.name && String(r.name).toLowerCase().indexOf(query) >= 0);
                var idMatch = (r.id && String(r.id).toLowerCase().indexOf(query) >= 0);
                var originMatch = (r.origin_code && String(r.origin_code).toLowerCase().indexOf(query) >= 0);
                var destMatch = (r.dest_code && String(r.dest_code).toLowerCase().indexOf(query) >= 0);
                if (!nameMatch && !idMatch && !originMatch && !destMatch) {
                    return false;
                }
            }

            // Filter status simpul
            if (statusFilter) {
                var s = getEndpointStatus(r);
                if (s !== statusFilter) {
                    return false;
                }
            }

            return true;
        });

        renderTable(filteredRoutes);
    }

    function renderTable(routes) {
        var tbody = document.getElementById("trayekTableBody");
        var resultCountEl = document.getElementById("resultCount");
        var emptyBox = document.getElementById("tableEmptyState");

        if (!tbody) return;

        if (resultCountEl) {
            resultCountEl.textContent = "Menampilkan " + routes.length + " dari " + allRoutes.length + " trayek";
        }

        if (routes.length === 0) {
            tbody.innerHTML = "";
            if (emptyBox) emptyBox.hidden = false;
            return;
        }

        if (emptyBox) emptyBox.hidden = true;

        var html = "";
        routes.forEach(function (r) {
            var color = normalizeColor(r.color);
            var originCode = r.origin_code ? '<span class="badge-code">' + escapeHtml(r.origin_code) + '</span>' : '<span class="badge-unmapped">Belum terpetakan</span>';
            var destCode = r.dest_code ? '<span class="badge-code">' + escapeHtml(r.dest_code) + '</span>' : '<span class="badge-unmapped">Belum terpetakan</span>';

            html += '<tr>' +
                '<td class="td-route">' +
                    '<span class="route-color-pill" style="background-color: ' + color + ';" aria-hidden="true"></span>' +
                    '<div class="route-name-block">' +
                        '<span class="route-name-text">' + escapeHtml(r.name) + '</span>' +
                        (r.id ? '<span class="route-id-tag">ID: ' + escapeHtml(r.id) + '</span>' : '') +
                    '</div>' +
                '</td>' +
                '<td class="td-origin" data-label="Simpul Asal">' + originCode + '</td>' +
                '<td class="td-dest" data-label="Simpul Tujuan">' + destCode + '</td>' +
                '<td class="td-num td-dist" data-label="Jarak (km)">' + formatDistance(r.jarak_km) + '</td>' +
                '<td class="td-num td-trip" data-label="Perjalanan">' + formatNumber(r.perjalanan) + '</td>' +
                '<td class="td-num td-vol" data-label="Volume Penumpang">' + formatNumber(r.volume) + '</td>' +
                '<td class="td-action">' +
                    '<button type="button" class="btn-table-detail" data-id="' + escapeHtml(r.id) + '" aria-label="Lihat detail trayek ' + escapeHtml(r.name) + '">Detail</button>' +
                '</td>' +
            '</tr>';
        });

        tbody.innerHTML = html;
    }

    /* =================================================================
       9. Modal Detail Trayek
       ================================================================= */
    function openModal(id, triggerElement) {
        var route = null;
        for (var i = 0; i < allRoutes.length; i++) {
            if (String(allRoutes[i].id) === String(id)) {
                route = allRoutes[i];
                break;
            }
        }
        if (!route) return;

        activeDetailRoute = route;
        lastFocusedElement = triggerElement || document.activeElement;
        modalOpen = true;

        var modal = document.getElementById("trayekModal");
        var backdrop = document.getElementById("modalBackdrop");
        if (!modal || !backdrop) return;

        // Set info header modal
        setText("modalTitle", route.name || "Tanpa Nama Trayek");
        setText("modalIdBadge", "ID: " + (route.id || "—"));

        var color = normalizeColor(route.color);
        var swatchDot = document.getElementById("modalColorSwatch");
        if (swatchDot) {
            swatchDot.style.backgroundColor = color;
        }
        setText("modalColorHex", color.toUpperCase());

        var status = getEndpointStatus(route);
        var endpointBadge = document.getElementById("modalEndpointBadge");
        if (endpointBadge) {
            endpointBadge.className = "badge-endpoint-status " +
                (status === "complete" ? "badge-endpoint-complete" :
                 status === "partial" ? "badge-endpoint-partial" : "badge-endpoint-unmapped");
            endpointBadge.textContent = status === "complete" ? "Simpul Lengkap" :
                                        status === "partial" ? "Simpul Sebagian" : "Simpul Belum Terpetakan";
        }

        var distStr = formatDistance(route.jarak_km);
        var distBadge = document.getElementById("modalDistanceBadge");
        if (distBadge) {
            distBadge.textContent = distStr !== "—" ? distStr : "Jarak belum terdata";
        }

        var originSummary = route.origin_code || "Simpul Asal (?)";
        var destSummary = route.dest_code || "Simpul Tujuan (?)";
        setText("modalSubInfo", "Koridor Jawa Barat · " + originSummary + " → " + destSummary + " (" + distStr + ")");

        // Metrik Agregat
        setText("modalStatVolume", formatNumber(route.volume));
        setText("modalStatPerjalanan", formatNumber(route.perjalanan));
        setText("modalStatJarak", formatDistance(route.jarak_km));

        // Karakteristik Geometri
        var swatchBox = document.getElementById("modalSwatchPreview");
        if (swatchBox) {
            swatchBox.style.backgroundColor = color;
        }
        setText("modalSwatchCode", color.toUpperCase());

        var vertexCount = (route.polyline && Array.isArray(route.polyline)) ? route.polyline.length : 0;
        setText("modalVertexCount", formatNumber(vertexCount) + " titik lintasan (WGS84)");

        var waypointsCount = (route.waypoints && Array.isArray(route.waypoints)) ? route.waypoints.length : 0;
        setText("modalWaypointsCount", formatNumber(waypointsCount) + " titik singgah perantara");

        setText("modalCreatedAt", formatDateRecord(route.created_at));

        // Informasi Simpul
        setText("modalOrigin", route.origin_code ? route.origin_code : "Belum terpetakan pada sheet");
        setText("modalDest", route.dest_code ? route.dest_code : "Belum terpetakan pada sheet");

        var statusDesc = status === "complete" ? "Kode simpul terminal asal dan tujuan keduanya terdaftar pada sheet Routes." :
                         status === "partial" ? "Hanya salah satu kode simpul terminal yang terdaftar pada sheet Routes." :
                         "Kedua kode simpul terminal belum terpetakan pada sheet Routes (identifikasi mengacu pada nama koridor).";
        setText("modalEndpointStatus", statusDesc);

        // Tampilkan modal dan fokus
        backdrop.hidden = false;
        modal.hidden = false;

        var closeBtn = document.getElementById("modalCloseBtn");
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    function closeModal() {
        if (!modalOpen) return;
        modalOpen = false;
        activeDetailRoute = null;

        var modal = document.getElementById("trayekModal");
        var backdrop = document.getElementById("modalBackdrop");
        if (modal) modal.hidden = true;
        if (backdrop) backdrop.hidden = true;

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }

    /* =================================================================
       10. Inisialisasi Interaksi & Event Listeners
       ================================================================= */
    function initEvents() {
        // Retry tombol status bar
        var retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
            retryBtn.addEventListener("click", loadTrayekData);
        }

        // Retry tombol tabel error
        var tableRetryBtn = document.getElementById("tableRetryBtn");
        if (tableRetryBtn) {
            tableRetryBtn.addEventListener("click", loadTrayekData);
        }

        // Search Input
        var searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", function (e) {
                activeFilter.query = e.target.value;
                applyFilters();
            });
        }

        // Endpoint Status Filter
        var endpointFilter = document.getElementById("endpointFilter");
        if (endpointFilter) {
            endpointFilter.addEventListener("change", function (e) {
                activeFilter.endpointStatus = e.target.value;
                applyFilters();
            });
        }

        // Reset Filter Buttons
        var resetBtn = document.getElementById("resetFilterBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                activeFilter.query = "";
                activeFilter.endpointStatus = "";
                if (searchInput) searchInput.value = "";
                if (endpointFilter) endpointFilter.value = "";
                applyFilters();
            });
        }

        var tableResetBtn = document.getElementById("tableResetBtn");
        if (tableResetBtn) {
            tableResetBtn.addEventListener("click", function () {
                activeFilter.query = "";
                activeFilter.endpointStatus = "";
                if (searchInput) searchInput.value = "";
                if (endpointFilter) endpointFilter.value = "";
                applyFilters();
            });
        }

        // Event delegation untuk tombol detail pada tabel dan ranking
        document.addEventListener("click", function (e) {
            var btn = e.target.closest(".btn-table-detail, .btn-ranking-detail");
            if (btn) {
                var id = btn.getAttribute("data-id");
                if (id) {
                    openModal(id, btn);
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

        // Keyboard navigation (Escape & Focus Trap pada Modal)
        document.addEventListener("keydown", function (e) {
            if (!modalOpen) return;

            if (e.key === "Escape") {
                e.preventDefault();
                closeModal();
                return;
            }

            if (e.key === "Tab") {
                var modal = document.getElementById("trayekModal");
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
                        var orig = el.getAttribute("data-saved-tabindex");
                        el.removeAttribute("data-saved-tabindex");
                        if (orig === "") {
                            el.removeAttribute("tabindex");
                        } else {
                            el.setAttribute("tabindex", orig);
                        }
                    }
                }
            }
        }

        function syncSidebarA11y(isOpen) {
            if (!sidebar) return;
            var mobile = isMobile();
            if (toggleBtn) {
                toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            }
            if (!mobile) {
                if (isInertSupported()) {
                    sidebar.inert = false;
                }
                applySidebarFocusFallback(false);
                return;
            }
            if (isOpen) {
                if (isInertSupported()) {
                    sidebar.inert = false;
                }
                applySidebarFocusFallback(false);
            } else {
                if (isInertSupported()) {
                    sidebar.inert = true;
                }
                applySidebarFocusFallback(true);
            }
        }

        function openDrawer() {
            if (!sidebar || !overlay) return;
            lastFocusedBeforeDrawer = document.activeElement;
            sidebar.classList.add("is-open");
            overlay.hidden = false;
            syncSidebarA11y(true);

            if (drawerFocusTimer) clearTimeout(drawerFocusTimer);
            drawerFocusTimer = setTimeout(function () {
                var target = closeBtn || sidebar.querySelector('a, button');
                if (target && typeof target.focus === "function") {
                    target.focus();
                }
            }, 30);
        }

        function closeDrawer() {
            if (!sidebar || !overlay) return;
            sidebar.classList.remove("is-open");
            overlay.hidden = true;
            syncSidebarA11y(false);

            if (lastFocusedBeforeDrawer && typeof lastFocusedBeforeDrawer.focus === "function") {
                lastFocusedBeforeDrawer.focus();
                lastFocusedBeforeDrawer = null;
            }
        }

        if (toggleBtn) {
            toggleBtn.addEventListener("click", function () {
                var isOpen = sidebar && sidebar.classList.contains("is-open");
                if (isOpen) {
                    closeDrawer();
                } else {
                    openDrawer();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", closeDrawer);
        }

        if (overlay) {
            overlay.addEventListener("click", closeDrawer);
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && sidebar && sidebar.classList.contains("is-open")) {
                e.preventDefault();
                closeDrawer();
            }
        });

        window.addEventListener("resize", function () {
            if (!isMobile() && sidebar && sidebar.classList.contains("is-open")) {
                sidebar.classList.remove("is-open");
                if (overlay) overlay.hidden = true;
            }
            syncSidebarA11y(sidebar && sidebar.classList.contains("is-open"));
        });

        syncSidebarA11y(false);
    }

    /* =================================================================
       12. Inisialisasi Utama
       ================================================================= */
    function init() {
        initEvents();
        initSidebar();
        updateClock();
        setInterval(updateClock, 1000);
        loadTrayekData();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
