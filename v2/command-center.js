/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center Prototype
   PHASE 14A — vanilla JS, no external dependencies, no API calls.
   Semua data pada halaman adalah data demo (local only).
   ===================================================================== */

(function () {
    "use strict";

    /* ---------- Util: safe text ---------- */
    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }

    /* ---------- 1. Jam & tanggal WIB (Asia/Jakarta) ---------- */
    var BULAN_ID = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    var HARI_ID = [
        "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
    ];

    function pad2(n) {
        return n < 10 ? "0" + n : String(n);
    }

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

    updateClock();
    setInterval(updateClock, 1000);

    /* ---------- 2. Sidebar mobile (toggle + overlay + Escape) ---------- */
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

    /* Tutup otomatis saat berpindah ke viewport desktop */
    window.addEventListener("resize", function () {
        if (!isMobile() && sidebar && sidebar.classList.contains("is-open")) {
            setSidebarOpen(false);
        }
    });

    /* ---------- 3. Top Movers tabs (role=tablist) ---------- */
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

    /* Navigasi keyboard tablist: panah kiri/kanan */
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

    /* ---------- 4. Inisialisasi aksesibilitas ---------- */
    document.addEventListener("DOMContentLoaded", function () {
        /* Sinkronkan state awal tab */
        var selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
        if (selectedTab) {
            activateTab(selectedTab);
        }
    });
})();
