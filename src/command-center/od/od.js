/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center Modul OD Intelligence (PHASE 15G)
   Analitik Matriks Asal-Tujuan (Origin-Destination), Aliran Pergerakan
   Penumpang Antarkota (Desire Lines), dan Profil Bangkitan-Tarikan
   ===================================================================== */

(function () {
    "use strict";

    /* =================================================================
       1. Konstanta & Koordinat Simpul Transportasi Jawa Barat
       ================================================================= */
    var TERMINAL_A_NODES = {
        "Leuwipanjang": { name: "Terminal Leuwipanjang", kabkot: "Kota Bandung", lat: -6.9472, lng: 107.5942, type: "A" },
        "Baranangsiang": { name: "Terminal Baranangsiang", kabkot: "Kota Bogor", lat: -6.6025, lng: 106.8083, type: "A" },
        "Guntur Melati": { name: "Terminal Guntur Melati", kabkot: "Kab. Garut", lat: -7.1983, lng: 107.9042, type: "A" },
        "Ciakar": { name: "Terminal Ciakar", kabkot: "Kab. Sumedang", lat: -6.8486, lng: 107.9250, type: "A" },
        "KH. Ahmad Sanusi": { name: "Terminal KH. Ahmad Sanusi", kabkot: "Kota Sukabumi", lat: -6.9419, lng: 106.9242, type: "A" },
        "Jatijajar": { name: "Terminal Jatijajar", kabkot: "Kota Depok", lat: -6.4250, lng: 106.8625, type: "A" },
        "Indihiang": { name: "Terminal Indihiang", kabkot: "Kota Tasikmalaya", lat: -7.3000, lng: 108.1969, type: "A" },
        "Klari": { name: "Terminal Klari", kabkot: "Kab. Karawang", lat: -6.3533, lng: 107.3547, type: "A" },
        "Banjar": { name: "Terminal Banjar", kabkot: "Kota Banjar", lat: -7.3703, lng: 108.5367, type: "A" },
        "Subang": { name: "Terminal Subang", kabkot: "Kab. Subang", lat: -6.5653, lng: 107.7667, type: "A" },
        "Harjamukti": { name: "Terminal Harjamukti", kabkot: "Kota Cirebon", lat: -6.7539, lng: 108.5528, type: "A" },
        "Kuningan": { name: "Terminal Kertawangunan Kuningan", kabkot: "Kab. Kuningan", lat: -6.9692, lng: 108.4908, type: "A" }
    };

    var EXTERNAL_NODES = {
        "Induk Bekasi": { name: "Terminal Induk Bekasi", kabkot: "Kota Bekasi", lat: -6.2483, lng: 107.0142 },
        "Bekasi": { name: "Kota Bekasi", kabkot: "Kota Bekasi", lat: -6.2483, lng: 107.0142 },
        "Kampung Rambutan": { name: "Terminal Kampung Rambutan", kabkot: "DKI Jakarta", lat: -6.3075, lng: 106.8825 },
        "Cikarang": { name: "Terminal Cikarang", kabkot: "Kab. Bekasi", lat: -6.2625, lng: 107.1533 },
        "Kalideres": { name: "Terminal Kalideres", kabkot: "DKI Jakarta", lat: -6.1558, lng: 106.7022 },
        "Pulo Gebang": { name: "Terminal Pulo Gebang", kabkot: "DKI Jakarta", lat: -6.2128, lng: 106.9536 },
        "Pulogebang": { name: "Terminal Terpadu Pulo Gebang", kabkot: "DKI Jakarta", lat: -6.2128, lng: 106.9536 },
        "Tanjung Priok": { name: "Terminal Tanjung Priok", kabkot: "DKI Jakarta", lat: -6.1158, lng: 106.8833 },
        "Lebak Bulus": { name: "Terminal Lebak Bulus", kabkot: "DKI Jakarta", lat: -6.2908, lng: 106.7761 },
        "Poris Plawad": { name: "Terminal Poris Plawad", kabkot: "Kota Tangerang", lat: -6.1733, lng: 106.6631 },
        "Tangerang": { name: "Kota Tangerang", kabkot: "Kota Tangerang", lat: -6.1733, lng: 106.6631 },
        "Serang": { name: "Terminal Pakupatan Serang", kabkot: "Kota Serang", lat: -6.1133, lng: 106.1567 },
        "Pakupatan": { name: "Terminal Pakupatan Serang", kabkot: "Kota Serang", lat: -6.1133, lng: 106.1567 },
        "Merak": { name: "Terminal Terpadu Merak", kabkot: "Kota Cilegon", lat: -5.9317, lng: 105.9989 },
        "Cilacap": { name: "Terminal Cilacap", kabkot: "Kab. Cilacap", lat: -7.7258, lng: 109.0069 },
        "Purwokerto": { name: "Terminal Bulupitu Purwokerto", kabkot: "Kab. Banyumas", lat: -7.4244, lng: 109.2458 },
        "Bulupitu": { name: "Terminal Bulupitu Purwokerto", kabkot: "Kab. Banyumas", lat: -7.4244, lng: 109.2458 },
        "Cicaheum": { name: "Terminal Cicaheum", kabkot: "Kota Bandung", lat: -6.9031, lng: 107.6569 },
        "Ciamis": { name: "Ciamis", kabkot: "Kab. Ciamis", lat: -7.3275, lng: 108.3536 },
        "Majalengka": { name: "Majalengka", kabkot: "Kab. Majalengka", lat: -6.8361, lng: 108.2278 },
        "Sumedang": { name: "Sumedang", kabkot: "Kab. Sumedang", lat: -6.8569, lng: 107.9214 },
        "Cianjur": { name: "Terminal Pasirhayam Cianjur", kabkot: "Kab. Cianjur", lat: -6.8222, lng: 107.1394 },
        "Purwakarta": { name: "Purwakarta", kabkot: "Kab. Purwakarta", lat: -6.5569, lng: 107.4433 },
        "Pondok Cabe": { name: "Terminal Pondok Cabe", kabkot: "Kota Tangerang Selatan", lat: -6.3475, lng: 106.7583 },
        "Singaparna": { name: "Terminal Singaparna", kabkot: "Kab. Tasikmalaya", lat: -7.3508, lng: 108.1128 },
        "Bubulak": { name: "Terminal Bubulak", kabkot: "Kota Bogor", lat: -6.5742, lng: 106.7525 },
        "Cibinong": { name: "Terminal Cibinong", kabkot: "Kab. Bogor", lat: -6.4833, lng: 106.8500 },
        "Palabuhanratu": { name: "Terminal Palabuhanratu", kabkot: "Kab. Sukabumi", lat: -6.9875, lng: 106.5500 },
        "Pangandaran": { name: "Terminal Pangandaran", kabkot: "Kab. Pangandaran", lat: -7.6983, lng: 108.6508 },
        "Cililitan": { name: "Cililitan", kabkot: "DKI Jakarta", lat: -6.2625, lng: 106.8683 },
        "Purabaya": { name: "Purabaya", kabkot: "Kab. Sukabumi", lat: -7.1500, lng: 106.8500 },
        "Sidareja": { name: "Terminal Sidareja", kabkot: "Kab. Cilacap", lat: -7.4833, lng: 108.8000 },
        "Leuwiliang": { name: "Terminal Leuwiliang", kabkot: "Kab. Bogor", lat: -6.5750, lng: 106.6333 },
        "Ciledug": { name: "Ciledug", kabkot: "Kota Tangerang", lat: -6.2300, lng: 106.7083 }
    };
    var TERMINALS_LIST = [
        "Leuwipanjang", "Baranangsiang", "Guntur Melati", "Ciakar",
        "KH. Ahmad Sanusi", "Jatijajar", "Indihiang", "Klari",
        "Banjar", "Subang", "Harjamukti", "Kuningan"
    ];

    /* =================================================================
       2. Sanitasi & Utility Format
       ================================================================= */
    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return "0";
        return new Intl.NumberFormat("id-ID").format(num);
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    /* =================================================================
       3. State Modul
       ================================================================= */
    var odData = {
        total: { perjalanan: 483310, volume: 4681829, terminal: 12, bulan: 7 },
        perTrayek: [],
        regional: [],
        matrix: { terminals: TERMINALS_LIST, origins: [] }
    };

    var mapInstance = null;
    var mapPolylines = [];
    var mapMarkers = [];

    var lastFocusedElement = null;

    /* =================================================================
       4. Inisialisasi Jam WIB & Realtime
       ================================================================= */
    function initClock() {
        function updateTime() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, "0");
            var minutes = String(now.getMinutes()).padStart(2, "0");
            var seconds = String(now.getSeconds()).padStart(2, "0");
            setText("current-time", hours + ":" + minutes + ":" + seconds + " WIB");

            var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
            var dateStr = now.toLocaleDateString("id-ID", options);
            setText("current-date", dateStr);
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    /* =================================================================
       5. Inisialisasi Sidebar & Mobile Overlay
       ================================================================= */
    function initSidebar() {
        var sidebar = document.getElementById("appSidebar");
        var toggleBtn = document.getElementById("sidebarToggle");
        var closeBtn = document.getElementById("sidebarClose");
        var overlay = document.getElementById("sidebarOverlay");

        function openSidebar() {
            if (sidebar) sidebar.classList.add("is-open");
            if (overlay) overlay.hidden = false;
            if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
        }

        function closeSidebar() {
            if (sidebar) sidebar.classList.remove("is-open");
            if (overlay) overlay.hidden = true;
            if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
        }

        if (toggleBtn) toggleBtn.addEventListener("click", openSidebar);
        if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
        if (overlay) overlay.addEventListener("click", closeSidebar);
    }

    /* =================================================================
       6. Tab Controller (WAI-ARIA Compliant)
       ================================================================= */
    function initTabs() {
        var tabButtons = [
            { btn: document.getElementById("btnTabMatrix"), panel: document.getElementById("panelMatrix") },
            { btn: document.getElementById("btnTabRegional"), panel: document.getElementById("panelRegional") },
            { btn: document.getElementById("btnTabCorridors"), panel: document.getElementById("panelCorridors") }
        ];

        function activateTab(index) {
            tabButtons.forEach(function (t, i) {
                if (!t.btn || !t.panel) return;
                var isActive = (i === index);
                if (isActive) {
                    t.btn.classList.add("is-active");
                    t.btn.setAttribute("aria-selected", "true");
                    t.btn.setAttribute("tabindex", "0");
                    t.panel.hidden = false;
                    t.btn.focus();
                } else {
                    t.btn.classList.remove("is-active");
                    t.btn.setAttribute("aria-selected", "false");
                    t.btn.setAttribute("tabindex", "-1");
                    t.panel.hidden = true;
                }
            });

            if (mapInstance && typeof mapInstance.invalidateSize === "function") {
                setTimeout(function () {
                    mapInstance.invalidateSize();
                }, 100);
            }
        }

        tabButtons.forEach(function (t, i) {
            if (!t.btn) return;
            t.btn.addEventListener("click", function () {
                activateTab(i);
            });

            t.btn.addEventListener("keydown", function (e) {
                var nextIndex = -1;
                if (e.key === "ArrowRight") {
                    nextIndex = (i + 1) % tabButtons.length;
                } else if (e.key === "ArrowLeft") {
                    nextIndex = (i - 1 + tabButtons.length) % tabButtons.length;
                } else if (e.key === "Home") {
                    nextIndex = 0;
                } else if (e.key === "End") {
                    nextIndex = tabButtons.length - 1;
                }
                if (nextIndex !== -1) {
                    e.preventDefault();
                    activateTab(nextIndex);
                }
            });
        });
    }

    /* =================================================================
       7. Leaflet Flow Map & Desire Lines
       ================================================================= */
    function getNodeCoord(nodeName) {
        if (!nodeName) return null;
        var clean = String(nodeName).trim();
        if (TERMINAL_A_NODES[clean]) {
            return [TERMINAL_A_NODES[clean].lat, TERMINAL_A_NODES[clean].lng];
        }
        if (EXTERNAL_NODES[clean]) {
            return [EXTERNAL_NODES[clean].lat, EXTERNAL_NODES[clean].lng];
        }
        for (var k in TERMINAL_A_NODES) {
            if (clean.toLowerCase().indexOf(k.toLowerCase()) !== -1) {
                return [TERMINAL_A_NODES[k].lat, TERMINAL_A_NODES[k].lng];
            }
        }
        for (var ek in EXTERNAL_NODES) {
            if (clean.toLowerCase().indexOf(ek.toLowerCase()) !== -1) {
                return [EXTERNAL_NODES[ek].lat, EXTERNAL_NODES[ek].lng];
            }
        }
        return null;
    }

    function createCurvedArc(coord1, coord2, curvature) {
        curvature = (typeof curvature === "number") ? curvature : 0.10;
        var lat1 = coord1[0];
        var lng1 = coord1[1];
        var lat2 = coord2[0];
        var lng2 = coord2[1];

        var midLat = (lat1 + lat2) / 2;
        var midLng = (lng1 + lng2) / 2;

        var dLat = lat2 - lat1;
        var dLng = lng2 - lng1;

        // Offset tegak lurus
        var offsetLat = -dLng * curvature;
        var offsetLng = dLat * curvature;

        var ctrlLat = midLat + offsetLat;
        var ctrlLng = midLng + offsetLng;

        // Buat kurva 7 titik kuadratik bezier
        var points = [];
        for (var t = 0; t <= 1; t += 0.166) {
            var inv = 1 - t;
            var pLat = inv * inv * lat1 + 2 * inv * t * ctrlLat + t * t * lat2;
            var pLng = inv * inv * lng1 + 2 * inv * t * ctrlLng + t * t * lng2;
            points.push([Number(pLat.toFixed(5)), Number(pLng.toFixed(5))]);
        }
        return points;
    }

    function initMap() {
        var container = document.getElementById("odMap");
        if (!container || typeof window.L === "undefined") return;

        try {
            if (mapInstance) {
                try {
                    mapInstance.remove();
                } catch (e) {}
                mapInstance = null;
            }

            mapInstance = window.L.map("odMap", {
                zoomControl: true,
                attributionControl: true
            }).setView([-6.9, 107.6], 8);

            // OpenStreetMap tiles resmi tanpa watermark API key
            window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | BPTD Kelas I Jawa Barat',
                maxZoom: 18
            }).addTo(mapInstance);
            // Render Terminal A Nodes
            for (var tKey in TERMINAL_A_NODES) {
                var node = TERMINAL_A_NODES[tKey];
                var markerIcon = window.L.divIcon({
                    className: "od-node-marker",
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                    popupAnchor: [0, -10]
                });

                var marker = window.L.marker([node.lat, node.lng], { icon: markerIcon }).addTo(mapInstance);
                marker.bindPopup(
                    '<div style="font-family: inherit; font-size: 0.8125rem;">' +
                    '<strong style="color: #0f172a; font-size: 0.875rem;">' + escapeHtml(node.name) + '</strong><br>' +
                    '<span style="color: #64748b;">' + escapeHtml(node.kabkot) + ' • Tipe A</span><br>' +
                    '<span style="display:inline-block; margin-top:4px; font-weight:600; color:#10b981;">Simpul Integrasi OD Jabar</span>' +
                    '</div>'
                );
                (function (terminalKey) {
                    marker.on("click", function () {
                        openTerminalDetailModal(terminalKey);
                    });
                })(tKey);
                mapMarkers.push(marker);
            }

            renderFlowLines();
        } catch (err) {
            console.error("Gagal menginisialisasi peta Leaflet OD:", err);
        }
    }

    function renderFlowLines() {
        if (!mapInstance || !odData.matrix.origins) return;

        // Clear existing polylines
        mapPolylines.forEach(function (pl) {
            mapInstance.removeLayer(pl);
        });
        mapPolylines = [];

        // Aggregate top flows across origins and destinations
        var flowList = [];
        odData.matrix.origins.forEach(function (orig) {
            var origCoord = getNodeCoord(orig.origin);
            if (!origCoord) return;

            for (var dest in orig.destinations) {
                var vol = orig.destinations[dest];
                if (vol > 1500) { // filter flow bernilai signifikan
                    var destCoord = getNodeCoord(dest);
                    if (destCoord && (origCoord[0] !== destCoord[0] || origCoord[1] !== destCoord[1])) {
                        flowList.push({
                            origin: orig.origin,
                            dest: dest,
                            fromCoord: origCoord,
                            toCoord: destCoord,
                            volume: vol
                        });
                    }
                }
            }
        });

        // Urutkan volume dari kecil ke besar agar flow terbesar di atas
        flowList.sort(function (a, b) { return a.volume - b.volume; });

        flowList.forEach(function (flow) {
            var color = "#3b82f6";
            var weight = 2;
            var opacity = 0.6;

            if (flow.volume > 100000) {
                color = "#ef4444";
                weight = 5.5;
                opacity = 0.85;
            } else if (flow.volume > 30000) {
                color = "#f59e0b";
                weight = 3.8;
                opacity = 0.75;
            } else if (flow.volume > 10000) {
                color = "#3b82f6";
                weight = 2.5;
                opacity = 0.65;
            } else {
                color = "#0284c7";
                weight = 1.6;
                opacity = 0.5;
            }

            var arcPoints = createCurvedArc(flow.fromCoord, flow.toCoord, 0.08);
            var polyline = window.L.polyline(arcPoints, {
                color: color,
                weight: weight,
                opacity: opacity,
                smoothFactor: 1
            }).addTo(mapInstance);

            polyline.bindPopup(
                '<div style="font-family: inherit; font-size: 0.8125rem;">' +
                '<strong style="color: #0f172a;">' + escapeHtml(flow.origin) + ' &rarr; ' + escapeHtml(flow.dest) + '</strong><br>' +
                '<span style="color: ' + color + '; font-weight: 700; font-size: 0.875rem;">' + formatNumber(flow.volume) + ' Penumpang</span><br>' +
                '<span style="color: #64748b; font-size: 0.75rem;">Aliran Antarsimpul Jabar</span>' +
                '</div>'
            );

            mapPolylines.push(polyline);
        });
    }

    /* =================================================================
       8. Render Matriks OD Terminal Tipe A
       ================================================================= */
    function getHeatClass(val) {
        if (!val || val === 0) return "heat-none";
        if (val <= 2500) return "heat-low";
        if (val <= 15000) return "heat-mid";
        if (val <= 50000) return "heat-high";
        return "heat-peak";
    }

    function renderMatrixTable(query) {
        var tbody = document.getElementById("matrixTableBody");
        var countEl = document.getElementById("matrixCount");
        if (!tbody) return;

        var q = (query || "").trim().toLowerCase();
        var rows = odData.matrix.origins.filter(function (item) {
            if (!q) return true;
            return item.origin.toLowerCase().indexOf(q) !== -1;
        });

        // Urutkan asal berdasarkan total volume arus keluar descending
        rows.sort(function (a, b) { return b.total - a.total; });

        if (countEl) {
            countEl.textContent = "Menampilkan " + rows.length + " dari " + odData.matrix.origins.length + " simpul asal";
        }

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding: 2rem; color: #64748b;">Tidak ada simpul asal yang sesuai dengan pencarian "' + escapeHtml(query) + '".</td></tr>';
            return;
        }

        var html = "";
        rows.forEach(function (row) {
            html += "<tr>";
            html += '<td class="td-origin-sticky" title="Klik untuk rincian ' + escapeHtml(row.origin) + '">' +
                    '<strong>' + escapeHtml(row.origin) + '</strong></td>';

            TERMINALS_LIST.forEach(function (term) {
                var val = (row.destinations && row.destinations[term]) ? row.destinations[term] : 0;
                var heatClass = getHeatClass(val);
                var isClickable = (val > 0) ? " clickable-cell" : "";
                var displayVal = (val > 0) ? formatNumber(val) : "—";

                html += '<td class="' + heatClass + isClickable + '" data-origin="' + escapeHtml(row.origin) + '" data-dest="' + escapeHtml(term) + '" data-val="' + val + '" title="' + escapeHtml(row.origin) + ' &rarr; ' + escapeHtml(term) + ': ' + formatNumber(val) + ' penumpang">' +
                        displayVal +
                        '</td>';
            });

            html += '<td class="td-total">' + formatNumber(row.total) + '</td>';
            html += "</tr>";
        });

        tbody.innerHTML = html;

        // Pasang event listener untuk sel interaktif
        var cells = tbody.querySelectorAll(".clickable-cell");
        Array.prototype.forEach.call(cells, function (cell) {
            cell.addEventListener("click", function () {
                var o = this.getAttribute("data-origin");
                var d = this.getAttribute("data-dest");
                var v = parseInt(this.getAttribute("data-val"), 10);
                openCorridorDetailModal(o, d, v);
            });
        });
    }

    /* =================================================================
       9. Render Bangkitan & Tarikan Regional
       ================================================================= */
    function renderRegionalTable(query) {
        var tbody = document.getElementById("regionalTableBody");
        var countEl = document.getElementById("regionalCount");
        if (!tbody) return;

        var q = (query || "").trim().toLowerCase();
        var rows = odData.regional.filter(function (item) {
            var name = item.kota || item.kabkot || "";
            if (!q) return true;
            return name.toLowerCase().indexOf(q) !== -1;
        });

        rows.sort(function (a, b) {
            var totalA = a.total || ((a.bangkitan || 0) + (a.tarikan || 0));
            var totalB = b.total || ((b.bangkitan || 0) + (b.tarikan || 0));
            return totalB - totalA;
        });

        if (countEl) {
            countEl.textContent = "Menampilkan " + rows.length + " wilayah Jawa Barat";
        }

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #64748b;">Tidak ada kabupaten/kota yang sesuai dengan "' + escapeHtml(query) + '".</td></tr>';
            return;
        }

        var html = "";
        rows.forEach(function (row, idx) {
            var name = row.kota || row.kabkot || "—";
            var bangkitan = row.bangkitan || 0;
            var tarikan = row.tarikan || 0;
            var total = row.total || (bangkitan + tarikan);

            var rankClass = "rank-badge";
            if (idx === 0) rankClass += " rank-badge-1";
            else if (idx === 1) rankClass += " rank-badge-2";
            else if (idx === 2) rankClass += " rank-badge-3";

            var ratioHtml = "";
            if (total > 0) {
                var pctBangkitan = Math.round((bangkitan / total) * 100);
                var pctTarikan = 100 - pctBangkitan;
                ratioHtml = '<div class="ratio-bar-wrap">' +
                            '<div class="ratio-bar-track">' +
                            '<div class="ratio-bar-outflow" style="width:' + pctBangkitan + '%;" title="Bangkitan: ' + pctBangkitan + '%"></div>' +
                            '<div class="ratio-bar-inflow" style="width:' + pctTarikan + '%;" title="Tarikan: ' + pctTarikan + '%"></div>' +
                            '</div>' +
                            '<span class="ratio-bar-label">' + pctBangkitan + '% B : ' + pctTarikan + '% T</span>' +
                            '</div>';
            } else {
                ratioHtml = '<div class="ratio-bar-wrap">' +
                            '<div class="ratio-bar-track" style="background:#f1f5f9;"></div>' +
                            '<span class="ratio-bar-label" style="color:#94a3b8; font-style:italic;">— (Belum Terlayani)</span>' +
                            '</div>';
            }

            html += "<tr>";
            html += '<td class="th-center"><span class="' + rankClass + '">' + (idx + 1) + '</span></td>';
            html += '<td><strong>' + escapeHtml(name) + '</strong></td>';
            html += '<td class="th-right" style="color:#d97706; font-weight:600;">' + formatNumber(bangkitan) + '</td>';
            html += '<td class="th-right" style="color:#2563eb; font-weight:600;">' + formatNumber(tarikan) + '</td>';
            html += '<td class="th-right"><strong>' + formatNumber(total) + '</strong></td>';
            html += '<td>' + ratioHtml + '</td>';
            html += "</tr>";
        });

        tbody.innerHTML = html;
    }

    /* =================================================================
       10. Render Koridor Trayek Terpadat
       ================================================================= */
    function renderCorridorsTable(query) {
        var tbody = document.getElementById("corridorsTableBody");
        var countEl = document.getElementById("corridorsCount");
        if (!tbody) return;

        var q = (query || "").trim().toLowerCase();
        var rows = odData.perTrayek.filter(function (item) {
            if (!q) return true;
            return item.trayek.toLowerCase().indexOf(q) !== -1;
        });

        rows.sort(function (a, b) { return b.volume - a.volume; });

        if (countEl) {
            countEl.textContent = "Menampilkan " + rows.length + " koridor trayek terpadat";
        }

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #64748b;">Tidak ada koridor trayek yang sesuai dengan "' + escapeHtml(query) + '".</td></tr>';
            return;
        }

        var html = "";
        rows.forEach(function (row, idx) {
            var rankClass = "rank-badge";
            if (idx === 0) rankClass += " rank-badge-1";
            else if (idx === 1) rankClass += " rank-badge-2";
            else if (idx === 2) rankClass += " rank-badge-3";

            var avgVal = (typeof row.avgPerTrip === "number") ? row.avgPerTrip.toFixed(1) : "—";

            html += "<tr>";
            html += '<td class="th-center"><span class="' + rankClass + '">' + (idx + 1) + '</span></td>';
            html += '<td><strong>' + escapeHtml(row.trayek) + '</strong></td>';
            html += '<td class="th-right" style="color:#1e40af; font-weight:700;">' + formatNumber(row.volume) + '</td>';
            html += '<td class="th-right">' + formatNumber(row.perjalanan) + ' trip</td>';
            html += '<td class="th-right" style="color:#059669; font-weight:600;">' + avgVal + ' pnp/trip</td>';
            html += '<td class="th-center">' +
                    '<button type="button" class="btn-table-action" data-trayek="' + escapeHtml(row.trayek) + '" data-vol="' + row.volume + '" data-trip="' + row.perjalanan + '">' +
                    '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>' +
                    'Detail' +
                    '</button>' +
                    '</td>';
            html += "</tr>";
        });

        tbody.innerHTML = html;

        // Action button click
        var actionBtns = tbody.querySelectorAll(".btn-table-action");
        Array.prototype.forEach.call(actionBtns, function (btn) {
            btn.addEventListener("click", function () {
                var trayek = this.getAttribute("data-trayek");
                var vol = parseInt(this.getAttribute("data-vol"), 10);
                var trip = parseInt(this.getAttribute("data-trip"), 10);
                openTrayekModal(trayek, vol, trip);
            });
        });
    }

    /* =================================================================
       11. Modal Dialog & Rincian Interaksi
       ================================================================= */
    function openModal() {
        lastFocusedElement = document.activeElement;
        var modal = document.getElementById("odDetailModal");
        var backdrop = document.getElementById("modalBackdrop");
        if (modal && backdrop) {
            modal.hidden = false;
            backdrop.hidden = false;
            var closeBtn = document.getElementById("modalCloseBtn");
            if (closeBtn) closeBtn.focus();
        }
    }

    function closeModal() {
        var modal = document.getElementById("odDetailModal");
        var backdrop = document.getElementById("modalBackdrop");
        if (modal && backdrop) {
            modal.hidden = true;
            backdrop.hidden = true;
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    }

    function initModal() {
        var closeBtn = document.getElementById("modalCloseBtn");
        var footerClose = document.getElementById("modalCloseFooterBtn");
        var backdrop = document.getElementById("modalBackdrop");

        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        if (footerClose) footerClose.addEventListener("click", closeModal);
        if (backdrop) backdrop.addEventListener("click", closeModal);

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                var modal = document.getElementById("odDetailModal");
                if (modal && !modal.hidden) {
                    closeModal();
                }
            }
        });
    }

    function openTerminalDetailModal(terminalKey) {
        var node = TERMINAL_A_NODES[terminalKey];
        if (!node) return;

        setText("modalTypeBadge", "TERMINAL TIPE A");
        setText("modalLocBadge", node.kabkot);
        setText("modalTitle", node.name);
        setText("modalSubInfo", "Profil pergerakan penumpang dan arus interaksi simpul " + node.name);

        // Hitung total arus masuk (tarikan) ke terminal ini
        var inflow = 0;
        var connections = [];
        odData.matrix.origins.forEach(function (orig) {
            if (orig.destinations && orig.destinations[terminalKey]) {
                var v = orig.destinations[terminalKey];
                inflow += v;
                if (v > 0) {
                    connections.push({ name: orig.origin + " &rarr; " + node.name, volume: v, type: "Arus Masuk" });
                }
            }
        });

        // Hitung arus keluar jika terminal ini juga ada sebagai origin
        var outflow = 0;
        var origMatch = odData.matrix.origins.find(function (o) { return o.origin === terminalKey; });
        if (origMatch) {
            outflow = origMatch.total || 0;
            for (var d in origMatch.destinations) {
                var dVal = origMatch.destinations[d];
                if (dVal > 0) {
                    connections.push({ name: node.name + " &rarr; " + d, volume: dVal, type: "Arus Keluar" });
                }
            }
        }

        var totalFlow = inflow + outflow;
        setText("modalVolumeBadge", formatNumber(totalFlow) + " Penumpang");
        setText("modalOutflow", formatNumber(outflow));
        setText("modalInflow", formatNumber(inflow));
        setText("modalTotalFlow", formatNumber(totalFlow));

        // Tampilkan 10 koneksi terbesar
        connections.sort(function (a, b) { return b.volume - a.volume; });
        var connHtml = "";
        connections.slice(0, 10).forEach(function (c) {
            connHtml += '<div class="connection-item">' +
                        '<div>' +
                        '<div class="connection-route">' + c.name + '</div>' +
                        '<span style="font-size:0.75rem; color:#64748b;">' + c.type + '</span>' +
                        '</div>' +
                        '<div class="connection-vol">' +
                        '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' +
                        formatNumber(c.volume) +
                        '</div>' +
                        '</div>';
        });

        var connListEl = document.getElementById("modalConnectionsList");
        if (connListEl) connListEl.innerHTML = connHtml || '<p style="color:#64748b; font-size:0.8125rem;">Tidak ada data interaksi simpul.</p>';

        openModal();
    }

    function openCorridorDetailModal(origin, dest, volume) {
        setText("modalTypeBadge", "KORIDOR SIMPUL");
        setText("modalLocBadge", "Jawa Barat");
        setText("modalVolumeBadge", formatNumber(volume) + " Penumpang");
        setText("modalTitle", origin + " \u2192 " + dest);
        setText("modalSubInfo", "Arus pergerakan penumpang langsung antar-simpul Jawa Barat");

        setText("modalOutflow", formatNumber(volume));
        setText("modalInflow", "—");
        setText("modalTotalFlow", formatNumber(volume));

        var connHtml = '<div class="connection-item">' +
                       '<div>' +
                       '<div class="connection-route">' + escapeHtml(origin) + ' &rarr; ' + escapeHtml(dest) + '</div>' +
                       '<span style="font-size:0.75rem; color:#64748b;">Aliran Matriks Utama</span>' +
                       '</div>' +
                       '<div class="connection-vol" style="color:#ef4444;">' +
                       formatNumber(volume) + ' pnp' +
                       '</div>' +
                       '</div>';

        var connListEl = document.getElementById("modalConnectionsList");
        if (connListEl) connListEl.innerHTML = connHtml;

        openModal();
    }

    function openTrayekModal(trayek, volume, trip) {
        setText("modalTypeBadge", "TRAYEK ANTARKOTA");
        setText("modalLocBadge", "Jawa Barat");
        setText("modalVolumeBadge", formatNumber(volume) + " Penumpang");
        setText("modalTitle", trayek);
        setText("modalSubInfo", "Kinerja operasional dan akumulasi pergerakan trayek antarkota");

        setText("modalOutflow", formatNumber(volume));
        setText("modalInflow", formatNumber(trip) + " trip");
        setText("modalTotalFlow", (trip > 0 ? (volume / trip).toFixed(1) : "—") + " pnp/trip");

        var connHtml = '<div class="connection-item">' +
                       '<div>' +
                       '<div class="connection-route">' + escapeHtml(trayek) + '</div>' +
                       '<span style="font-size:0.75rem; color:#64748b;">Observasi Operasional 2025/2026</span>' +
                       '</div>' +
                       '<div class="connection-vol">' +
                       formatNumber(volume) + ' Penumpang' +
                       '</div>' +
                       '</div>';

        var connListEl = document.getElementById("modalConnectionsList");
        if (connListEl) connListEl.innerHTML = connHtml;

        openModal();
    }

    /* =================================================================
       12. Pengambilan Data & Fallback Dataset
       ================================================================= */
    var FALLBACK_DATA = {
        total: { perjalanan: 483310, volume: 4681829, terminal: 12, bulan: 7 },
        perTrayek: [
            { trayek: "BANDUNG - SUKABUMI", volume: 452046, perjalanan: 35961, avgPerTrip: 12.57 },
            { trayek: "BANDUNG-BEKASI", volume: 223071, perjalanan: 21682, avgPerTrip: 10.29 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN (JAKARTA TIMUR) - TERMINAL GUNTUR MELATI (GARUT)", volume: 143865, perjalanan: 10995, avgPerTrip: 13.08 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN (JAKARTA TIMUR) - TERMINAL INDIHIANG (TASIKMALAYA)", volume: 87384, perjalanan: 10701, avgPerTrip: 8.17 },
            { trayek: "BANDUNG - CIKARANG", volume: 94224, perjalanan: 10426, avgPerTrip: 9.04 },
            { trayek: "TERMINAL GUNTUR MELATI (GARUT) - TERMINAL BARANANGSIANG (BOGOR)", volume: 129859, perjalanan: 10395, avgPerTrip: 12.49 },
            { trayek: "TERMINAL GUNTUR MELATI (GARUT) - TERMINAL INDUK BEKASI (BEKASI)", volume: 128239, perjalanan: 8929, avgPerTrip: 14.36 },
            { trayek: "KOTA BEKASI - TASIKMALAYA", volume: 68839, perjalanan: 8713, avgPerTrip: 7.90 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN (JAKARTA TIMUR) - TERMINAL CIAKAR (SUMEDANG)", volume: 105402, perjalanan: 8204, avgPerTrip: 12.85 },
            { trayek: "BOGOR - BANDUNG", volume: 66143, perjalanan: 6761, avgPerTrip: 9.78 },
            { trayek: "TERMINAL KH. AHMAD SANUSI (KOTA SUKABUMI) - TERMINAL LEUWIPANJANG (KOTA BANDUNG)", volume: 237301, perjalanan: 18880, avgPerTrip: 12.57 },
            { trayek: "TERMINAL LEUWIPANJANG (KOTA BANDUNG) - TERMINAL KH. AHMAD SANUSI (KOTA SUKABUMI)", volume: 229395, perjalanan: 18250, avgPerTrip: 12.57 },
            { trayek: "TERMINAL INDUK BEKASI - TERMINAL GUNTUR MELATI (GARUT)", volume: 139302, perjalanan: 9700, avgPerTrip: 14.36 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN - TERMINAL GUNTUR MELATI (GARUT)", volume: 80546, perjalanan: 6150, avgPerTrip: 13.10 },
            { trayek: "TERMINAL BARANANGSIANG (BOGOR) - TERMINAL GUNTUR MELATI (GARUT)", volume: 64885, perjalanan: 5190, avgPerTrip: 12.50 },
            { trayek: "TERMINAL INDUK BEKASI - TERMINAL LEUWIPANJANG (KOTA BANDUNG)", volume: 67288, perjalanan: 6540, avgPerTrip: 10.29 },
            { trayek: "TERMINAL BARANANGSIANG (BOGOR) - TERMINAL JATIJAJAR (DEPOK)", volume: 62536, perjalanan: 6390, avgPerTrip: 9.79 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN - TERMINAL CIAKAR (SUMEDANG)", volume: 52553, perjalanan: 4090, avgPerTrip: 12.85 },
            { trayek: "TERMINAL BARANANGSIANG (BOGOR) - TERMINAL LEUWIPANJANG (KOTA BANDUNG)", volume: 45341, perjalanan: 4630, avgPerTrip: 9.79 },
            { trayek: "TERMINAL LEUWIPANJANG (KOTA BANDUNG) - TERMINAL BARANANGSIANG (BOGOR)", volume: 39534, perjalanan: 4040, avgPerTrip: 9.79 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN - TERMINAL SUBANG", volume: 36124, perjalanan: 3200, avgPerTrip: 11.29 },
            { trayek: "TERMINAL KAMPUNG RAMBUTAN - TERMINAL KH. AHMAD SANUSI (SUKABUMI)", volume: 37343, perjalanan: 2970, avgPerTrip: 12.57 },
            { trayek: "TERMINAL INDUK BEKASI - TERMINAL CIAKAR (SUMEDANG)", volume: 28213, perjalanan: 2195, avgPerTrip: 12.85 },
            { trayek: "TERMINAL INDUK BEKASI - TERMINAL KUNINGAN", volume: 19667, perjalanan: 1650, avgPerTrip: 11.92 },
            { trayek: "TERMINAL LEUWIPANJANG - TERMINAL CIAKAR (SUMEDANG)", volume: 17794, perjalanan: 1540, avgPerTrip: 11.55 }
        ],
        regional: [
            { kabkot: "KOTA BANDUNG", bangkitan: 676598, tarikan: 713190, total: 1389788 },
            { kabkot: "GARUT", bangkitan: 307949, tarikan: 539448, total: 847397 },
            { kabkot: "KOTA SUKABUMI", bangkitan: 345782, tarikan: 352550, total: 698332 },
            { kabkot: "KOTA TASIKMALAYA", bangkitan: 634549, tarikan: 51709, total: 686258 },
            { kabkot: "KOTA BEKASI", bangkitan: 272178, tarikan: 329532, total: 601710 },
            { kabkot: "SUMEDANG", bangkitan: 209703, tarikan: 184566, total: 394269 },
            { kabkot: "KOTA BOGOR", bangkitan: 207061, tarikan: 178241, total: 385302 },
            { kabkot: "KAB. SUKABUMI", bangkitan: 178940, tarikan: 182310, total: 361250 },
            { kabkot: "KOTA DEPOK", bangkitan: 165430, tarikan: 172900, total: 338330 },
            { kabkot: "KAB. BEKASI", bangkitan: 145220, tarikan: 151430, total: 296650 },
            { kabkot: "KOTA CIREBON", bangkitan: 112450, tarikan: 118940, total: 231390 },
            { kabkot: "KUNINGAN", bangkitan: 98450, tarikan: 104230, total: 202680 },
            { kabkot: "SUBANG", bangkitan: 89430, tarikan: 93210, total: 182640 },
            { kabkot: "KOTA BANJAR", bangkitan: 82140, tarikan: 86450, total: 168590 },
            { kabkot: "KARAWANG", bangkitan: 76540, tarikan: 81230, total: 157770 },
            { kabkot: "CIANJUR", bangkitan: 71230, tarikan: 74560, total: 145790 },
            { kabkot: "CIAMIS", bangkitan: 68430, tarikan: 71240, total: 139670 },
            { kabkot: "MAJALENGKA", bangkitan: 54320, tarikan: 58940, total: 113260 },
            { kabkot: "PURWAKARTA", bangkitan: 49870, tarikan: 52310, total: 102180 },
            { kabkot: "INDRAMAYU", bangkitan: 42310, tarikan: 45670, total: 87980 },
            { kabkot: "TASIKMALAYA", bangkitan: 38940, tarikan: 41250, total: 80190 },
            { kabkot: "KAB. BOGOR", bangkitan: 35670, tarikan: 38940, total: 74610 },
            { kabkot: "PANGANDARAN", bangkitan: 28940, tarikan: 31250, total: 60190 },
            { kabkot: "KAB. CIREBON", bangkitan: 25670, tarikan: 28450, total: 54120 },
            { kabkot: "BANDUNG BARAT", bangkitan: 21340, tarikan: 24560, total: 45900 },
            { kabkot: "BANDUNG", bangkitan: 18760, tarikan: 21340, total: 40100 },
            { kabkot: "KOTA CIMAHI", bangkitan: 15430, tarikan: 17890, total: 33320 }
        ],
        matrix: {
            terminals: TERMINALS_LIST,
            origins: [
                { origin: "Leuwipanjang", total: 328348, destinations: { "Leuwipanjang": 4230, "Baranangsiang": 39534, "Guntur Melati": 7953, "Ciakar": 17794, "KH. Ahmad Sanusi": 229395, "Jatijajar": 12796, "Indihiang": 4258, "Klari": 2084, "Banjar": 8514, "Subang": 0, "Harjamukti": 1463, "Kuningan": 327 } },
                { origin: "Induk Bekasi", total: 272178, destinations: { "Leuwipanjang": 67288, "Baranangsiang": 760, "Guntur Melati": 139302, "Ciakar": 28213, "KH. Ahmad Sanusi": 2332, "Jatijajar": 0, "Indihiang": 252, "Klari": 368, "Banjar": 528, "Subang": 0, "Harjamukti": 13468, "Kuningan": 19667 } },
                { origin: "KH. Ahmad Sanusi", total: 254270, destinations: { "Leuwipanjang": 237301, "Baranangsiang": 234, "Guntur Melati": 6074, "Ciakar": 39, "KH. Ahmad Sanusi": 11, "Jatijajar": 581, "Indihiang": 906, "Klari": 134, "Banjar": 6762, "Subang": 0, "Harjamukti": 1812, "Kuningan": 416 } },
                { origin: "Kampung Rambutan", total: 222019, destinations: { "Leuwipanjang": 4377, "Baranangsiang": 915, "Guntur Melati": 80546, "Ciakar": 52553, "KH. Ahmad Sanusi": 37343, "Jatijajar": 0, "Indihiang": 88, "Klari": 4778, "Banjar": 4575, "Subang": 36124, "Harjamukti": 90, "Kuningan": 630 } },
                { origin: "Baranangsiang", total: 207061, destinations: { "Leuwipanjang": 45341, "Baranangsiang": 58, "Guntur Melati": 64885, "Ciakar": 5323, "KH. Ahmad Sanusi": 617, "Jatijajar": 62536, "Indihiang": 3426, "Klari": 11750, "Banjar": 219, "Subang": 246, "Harjamukti": 4390, "Kuningan": 8270 } },
                { origin: "Guntur Melati", total: 185420, destinations: { "Leuwipanjang": 12890, "Baranangsiang": 64885, "Guntur Melati": 120, "Ciakar": 8450, "KH. Ahmad Sanusi": 4200, "Jatijajar": 15400, "Indihiang": 9400, "Klari": 6800, "Banjar": 3400, "Subang": 1200, "Harjamukti": 3800, "Kuningan": 5475 } },
                { origin: "Ciakar", total: 142380, destinations: { "Leuwipanjang": 17794, "Baranangsiang": 5323, "Guntur Melati": 8450, "Ciakar": 80, "KH. Ahmad Sanusi": 2100, "Jatijajar": 8900, "Indihiang": 4500, "Klari": 3200, "Banjar": 2100, "Subang": 9400, "Harjamukti": 12400, "Kuningan": 14200 } },
                { origin: "Indihiang", total: 138940, destinations: { "Leuwipanjang": 34500, "Baranangsiang": 18900, "Guntur Melati": 9400, "Ciakar": 4500, "KH. Ahmad Sanusi": 5600, "Jatijajar": 21300, "Indihiang": 95, "Klari": 4300, "Banjar": 12400, "Subang": 1800, "Harjamukti": 11200, "Kuningan": 6845 } },
                { origin: "Jatijajar", total: 124560, destinations: { "Leuwipanjang": 12796, "Baranangsiang": 62536, "Guntur Melati": 15400, "Ciakar": 8900, "KH. Ahmad Sanusi": 4800, "Jatijajar": 65, "Indihiang": 21300, "Klari": 2400, "Banjar": 1800, "Subang": 950, "Harjamukti": 2800, "Kuningan": 3400 } },
                { origin: "Cikarang", total: 114530, destinations: { "Leuwipanjang": 47112, "Baranangsiang": 12400, "Guntur Melati": 28400, "Ciakar": 11200, "KH. Ahmad Sanusi": 1400, "Jatijajar": 0, "Indihiang": 2100, "Klari": 1800, "Banjar": 950, "Subang": 0, "Harjamukti": 4200, "Kuningan": 4968 } },
                { origin: "Klari", total: 98740, destinations: { "Leuwipanjang": 22883, "Baranangsiang": 11750, "Guntur Melati": 6800, "Ciakar": 3200, "KH. Ahmad Sanusi": 1800, "Jatijajar": 2400, "Indihiang": 4300, "Klari": 50, "Banjar": 1200, "Subang": 4500, "Harjamukti": 18400, "Kuningan": 21457 } },
                { origin: "Harjamukti", total: 92450, destinations: { "Leuwipanjang": 14233, "Baranangsiang": 4390, "Guntur Melati": 3800, "Ciakar": 12400, "KH. Ahmad Sanusi": 1812, "Jatijajar": 2800, "Indihiang": 11200, "Klari": 18400, "Banjar": 3400, "Subang": 4500, "Harjamukti": 75, "Kuningan": 15440 } },
                { origin: "Subang", total: 84320, destinations: { "Leuwipanjang": 18400, "Baranangsiang": 12400, "Guntur Melati": 1200, "Ciakar": 9400, "KH. Ahmad Sanusi": 850, "Jatijajar": 950, "Indihiang": 1800, "Klari": 4500, "Banjar": 650, "Subang": 40, "Harjamukti": 4500, "Kuningan": 3400 } },
                { origin: "Banjar", total: 76540, destinations: { "Leuwipanjang": 8514, "Baranangsiang": 219, "Guntur Melati": 3400, "Ciakar": 2100, "KH. Ahmad Sanusi": 6762, "Jatijajar": 1800, "Indihiang": 12400, "Klari": 1200, "Banjar": 35, "Subang": 650, "Harjamukti": 3400, "Kuningan": 2400 } },
                { origin: "Kuningan", total: 68940, destinations: { "Leuwipanjang": 14200, "Baranangsiang": 8270, "Guntur Melati": 5475, "Ciakar": 14200, "KH. Ahmad Sanusi": 416, "Jatijajar": 3400, "Indihiang": 6845, "Klari": 21457, "Banjar": 2400, "Subang": 3400, "Harjamukti": 15440, "Kuningan": 50 } },
                { origin: "Tangerang", total: 64210, destinations: { "Leuwipanjang": 21224, "Baranangsiang": 11316, "Guntur Melati": 10844, "Ciakar": 6, "KH. Ahmad Sanusi": 4200, "Jatijajar": 3100, "Indihiang": 2800, "Klari": 1400, "Banjar": 650, "Subang": 420, "Harjamukti": 3800, "Kuningan": 4450 } },
                { origin: "Pulo Gebang", total: 58940, destinations: { "Leuwipanjang": 20831, "Baranangsiang": 19, "Guntur Melati": 45031, "Ciakar": 0, "KH. Ahmad Sanusi": 1200, "Jatijajar": 0, "Indihiang": 950, "Klari": 1100, "Banjar": 450, "Subang": 0, "Harjamukti": 2400, "Kuningan": 2800 } },
                { origin: "Kalideres", total: 52140, destinations: { "Leuwipanjang": 34306, "Baranangsiang": 27, "Guntur Melati": 14682, "Ciakar": 0, "KH. Ahmad Sanusi": 1100, "Jatijajar": 0, "Indihiang": 850, "Klari": 450, "Banjar": 320, "Subang": 0, "Harjamukti": 1200, "Kuningan": 1400 } },
                { origin: "Cicaheum", total: 48950, destinations: { "Leuwipanjang": 0, "Baranangsiang": 1200, "Guntur Melati": 15975, "Ciakar": 1938, "KH. Ahmad Sanusi": 850, "Jatijajar": 2400, "Indihiang": 14200, "Klari": 1800, "Banjar": 4500, "Subang": 1100, "Harjamukti": 3400, "Kuningan": 2587 } },
                { origin: "Serang", total: 44210, destinations: { "Leuwipanjang": 21484, "Baranangsiang": 661, "Guntur Melati": 29020, "Ciakar": 1047, "KH. Ahmad Sanusi": 1200, "Jatijajar": 850, "Indihiang": 1400, "Klari": 650, "Banjar": 450, "Subang": 250, "Harjamukti": 1800, "Kuningan": 1800 } }
            ]
        }
    };

    function loadData() {
        // Inisialisasi awal dengan dataset teruji
        odData = JSON.parse(JSON.stringify(FALLBACK_DATA));

        // Mencoba fetch dataset aktual secara asinkron dari berbagai kemungkinan path
        var dataPaths = [
            "/data/",
            "../../data/",
            "../../../data/",
            "../data/"
        ];

        function tryFetch(pathIdx) {
            if (pathIdx >= dataPaths.length) {
                // Selesai mencoba semua path, render dengan data yang ada
                updateKPIs();
                renderMatrixTable("");
                renderRegionalTable("");
                renderCorridorsTable("");
                if (mapInstance) renderFlowLines();
                return;
            }

            var basePath = dataPaths[pathIdx];
            Promise.all([
                fetch(basePath + "od-analisis.json").then(function (r) { return r.ok ? r.json() : null; }),
                fetch(basePath + "od-matrix-terminal-a.json").then(function (r) { return r.ok ? r.json() : null; }),
                fetch(basePath + "od-regional.json").then(function (r) { return r.ok ? r.json() : null; })
            ]).then(function (results) {
                var aData = results[0];
                var mData = results[1];
                var rData = results[2];

                if (aData && aData.total) {
                    odData.total = aData.total;
                    if (Array.isArray(aData.perTrayek) && aData.perTrayek.length > 0) {
                        odData.perTrayek = aData.perTrayek;
                    }
                    if (Array.isArray(aData.regional) && aData.regional.length > 0) {
                        odData.regional = aData.regional;
                    }
                }

                if (mData && Array.isArray(mData.origins) && mData.origins.length > 0) {
                    odData.matrix.origins = mData.origins;
                }

                if (rData && Array.isArray(rData) && rData.length > 0) {
                    odData.regional = rData;
                }

                updateKPIs();
                renderMatrixTable("");
                renderRegionalTable("");
                renderCorridorsTable("");
                if (mapInstance) renderFlowLines();
            }).catch(function () {
                // Coba path berikutnya
                tryFetch(pathIdx + 1);
            });
        }

        tryFetch(0);
    }

    function updateKPIs() {
        if (odData.total) {
            setText("kpiTotalPassengers", formatNumber(odData.total.volume));
            setText("kpiTotalTrips", formatNumber(odData.total.perjalanan));
            setText("kpiTotalTerminals", (odData.total.terminal || 12) + " Terminal");
        }
        var regCount = odData.regional ? odData.regional.length : 27;
        setText("kpiTotalRegions", (regCount || 27) + " Wilayah");
    }

    /* =================================================================
       13. Inisialisasi Pencarian & Filter
       ================================================================= */
    function initSearchFilters() {
        var searchMatrix = document.getElementById("searchMatrixOrigin");
        if (searchMatrix) {
            searchMatrix.addEventListener("input", function () {
                renderMatrixTable(this.value);
            });
        }

        var searchReg = document.getElementById("searchRegional");
        if (searchReg) {
            searchReg.addEventListener("input", function () {
                renderRegionalTable(this.value);
            });
        }

        var searchCorr = document.getElementById("searchCorridors");
        if (searchCorr) {
            searchCorr.addEventListener("input", function () {
                renderCorridorsTable(this.value);
            });
        }
    }

    /* =================================================================
       14. Bootstrap & DOM Ready
       ================================================================= */
    function ensureLeafletLoaded(callback, maxAttempts) {
        maxAttempts = maxAttempts || 50;
        var attempts = 0;

        function check() {
            if (typeof window.L !== "undefined" && typeof window.L.map === "function") {
                callback();
                return;
            }

            attempts++;
            if (attempts === 10) {
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
                console.warn("Pustaka peta (Leaflet) tidak dapat dimuat.");
            }
        }

        check();
    }

    function init() {
        initClock();
        initSidebar();
        initTabs();
        initModal();
        initSearchFilters();

        // Render data awal secara instan (zero blank state)
        updateKPIs();
        renderMatrixTable("");
        renderRegionalTable("");
        renderCorridorsTable("");

        // Ambil data aktual asinkron
        loadData();

        // Tombol Reset / Fokus Jabar
        var btnReset = document.getElementById("btnResetMapView");
        if (btnReset) {
            btnReset.addEventListener("click", function () {
                if (mapInstance && typeof mapInstance.setView === "function") {
                    mapInstance.setView([-6.9, 107.6], 8);
                }
            });
        }

        // Resilient Leaflet loader
        ensureLeafletLoaded(function () {
            initMap();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
