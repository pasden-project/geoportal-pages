/**
 * GeoPORTAL BPTD Kelas I Jawa Barat
 * Controller Modul Evaluasi Kinerja (program.js)
 * Menampilkan Health Score & Tata Kelola Operasional Model 4 Pilar Terpadu
 */

(function () {
    'use strict';

    // State kalkulasi
    let auditPayload = null;

    // Helper formatting
    function formatScore(val) {
        if (val === null || val === undefined) {
            return '<span class="cell-null">null (CONFIRM)</span>';
        }
        return `<span class="cell-code" style="color:var(--audit-lime); font-weight:800;">${Number(val).toFixed(1).replace('.', ',')}</span>`;
    }

    function formatNumber(num) {
        if (num === null || num === undefined) return '-';
        return Number(num).toLocaleString('id-ID');
    }

    // Update real-time clock
    function initClock() {
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');

        function update() {
            const now = new Date();
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
        }
        update();
        setInterval(update, 1000);
    }

    // Sidebar drawer mobile
    function initSidebar() {
        const sidebar = document.getElementById('appSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const toggleBtn = document.getElementById('sidebarToggle');
        const closeBtn = document.getElementById('sidebarClose');

        if (!sidebar) return;

        function openSidebar() {
            sidebar.classList.add('is-open');
            if (overlay) overlay.hidden = false;
        }

        function closeSidebar() {
            sidebar.classList.remove('is-open');
            if (overlay) overlay.hidden = true;
        }

        if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);
    }

    // Render Panel 5.1: Ringkasan
    function renderSummary(payload) {
        const scoreEl = document.getElementById('summaryOverallScore');
        const statusEl = document.getElementById('summaryOverallStatus');
        const periodEl = document.getElementById('summaryPeriod');
        const updatedEl = document.getElementById('summaryUpdated');
        const locationEl = document.getElementById('summaryLocation');

        if (scoreEl) {
            if (payload.overall_score !== null) {
                scoreEl.innerHTML = `<span class="summary-card__value--score">${Number(payload.overall_score).toFixed(1).replace('.', ',')}</span><span style="font-size:16px; color:var(--audit-dim);">/100</span>`;
            } else {
                scoreEl.innerHTML = '<span class="summary-card__value--null">Belum Dihitung</span>';
            }
        }
        if (statusEl) {
            const isGood = payload.overall_status.includes('BAIK');
            const badgeCls = isGood ? 'audit-badge--lime' : 'audit-badge--amber';
            statusEl.innerHTML = `<span class="audit-badge ${badgeCls}">${payload.overall_status}</span>`;
        }
        if (periodEl) periodEl.textContent = payload.period;
        if (updatedEl) updatedEl.textContent = '31 Maret 2026 / YTD 2026';
        if (locationEl) locationEl.textContent = payload.computation_location;
    }

    // Render Panel 5.2: Pilar
    function renderPillars(payload) {
        const container = document.getElementById('pillarsGrid');
        if (!container) return;

        container.innerHTML = payload.pillars.map(p => {
            const badgeCls = p.status.includes('SANGAT BAIK') ? 'audit-badge--lime' : (p.status.includes('BAIK') ? 'audit-badge--cyan' : 'audit-badge--amber');
            const scoreDisplay = p.score !== null ? `<span style="color:var(--audit-lime);">${Number(p.score).toFixed(1).replace('.', ',')}</span>` : 'null';
            return `
            <div class="pillar-card">
                <div class="pillar-card__top">
                    <span class="pillar-card__id">Pilar ${p.id}</span>
                    <span class="audit-badge ${badgeCls}">${p.status}</span>
                </div>
                <h4 class="pillar-card__title">${p.name}</h4>
                <div class="pillar-card__weights">
                    <span>Bobot Awal: <strong>${p.weight_initial}%</strong></span>
                    <span>&bull;</span>
                    <span>Bobot Normalisasi: <strong>${p.weight_normalized}%</strong></span>
                </div>
                <div class="pillar-card__score-row">
                    <span class="pillar-card__score-label">Skor Pilar</span>
                    <span class="pillar-card__score-val">${scoreDisplay}</span>
                </div>
                <div class="pillar-card__coverage">
                    Cakupan: ${p.coverage}
                </div>
                <div style="font-size: 11px; color: var(--audit-muted); display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${p.flags.map(f => `<span class="audit-badge audit-badge--dim">${f}</span>`).join('')}
                </div>
            </div>
            `;
        }).join('');
    }

    // Render Panel 5.3: Indikator
    function renderIndicators(payload) {
        const tbody = document.getElementById('indicatorsTableBody');
        if (!tbody) return;

        tbody.innerHTML = payload.indicators.map(ind => {
            const valDisplay = ind.value !== null ? `${ind.value}%` : '<span class="cell-null">null</span>';
            const flagsHtml = ind.flags.map(f => `<span class="audit-badge audit-badge--dim" style="font-size:9.5px; margin:1px;">${f}</span>`).join(' ');
            const pillarLabel = ind.pillar_id === 'Non-Skor' ? 'Non-Skor' : `Pilar ${ind.pillar_id}`;

            return `
                <tr>
                    <td><span class="cell-code">${ind.id}</span></td>
                    <td><strong>${pillarLabel}</strong></td>
                    <td>
                        <div style="font-weight:600; color:var(--audit-text);">${ind.name}</div>
                        <div class="cell-muted">${ind.formula}</div>
                    </td>
                    <td><span class="cell-code">${valDisplay}</span></td>
                    <td>${ind.target !== null ? `${ind.target}%` : '<span class="cell-null">CONFIRM</span>'}</td>
                    <td>${formatScore(ind.score)}</td>
                    <td><span style="font-size:11.5px;">${ind.source}</span></td>
                    <td><span class="cell-muted">${ind.last_updated || '-'}</span></td>
                    <td>${flagsHtml}</td>
                </tr>
            `;
        }).join('');
    }

    // Render Panel 5.4: Konsistensi Data & Rekonsiliasi
    function renderDiscrepancies(payload) {
        const tbody = document.getElementById('discrepanciesTableBody');
        if (!tbody) return;

        const list = payload.data_reconciliation || payload.discrepancies || [];
        tbody.innerHTML = list.map(d => {
            const statusBadge = d.status === 'MATCHED'
                ? '<span class="audit-badge audit-badge--lime">MATCHED (100%)</span>'
                : (d.status === 'GOVERNED'
                    ? '<span class="audit-badge audit-badge--cyan">GOVERNED</span>'
                    : '<span class="audit-badge audit-badge--amber">DISCREPANCY</span>');

            return `
                <tr>
                    <td><span class="cell-code">${d.id}</span></td>
                    <td>
                        <div style="font-weight:600; color:var(--audit-text);">${d.item}</div>
                        <div class="cell-muted">${d.notes}</div>
                    </td>
                    <td>
                        <div class="cell-code">${d.value_a}</div>
                        <div class="cell-muted">Sumber: ${d.source_a}</div>
                    </td>
                    <td>
                        <div class="cell-code" style="color:var(--audit-lime);">${d.value_b}</div>
                        <div class="cell-muted">Sumber: ${d.source_b}</div>
                    </td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    // Render Panel 5.5: Tata Kelola Operasional & Verifikasi Pilar
    function renderMissingInputs(payload, filterText) {
        const tbody = document.getElementById('missingInputsTableBody');
        if (!tbody) return;

        const term = (filterText || '').toLowerCase().trim();
        const allItems = payload.operational_governance || payload.missing_inputs || [];
        const items = allItems.filter(item => {
            if (!term) return true;
            return item.id.toLowerCase().includes(term) ||
                   item.item.toLowerCase().includes(term) ||
                   (item.category && item.category.toLowerCase().includes(term)) ||
                   (item.impact && item.impact.toLowerCase().includes(term)) ||
                   (item.owner && item.owner.toLowerCase().includes(term));
        });

        const countEl = document.getElementById('missingInputsCount');
        if (countEl) {
            countEl.textContent = `Menampilkan ${items.length} dari ${allItems.length} instrumen tata kelola`;
        }

        tbody.innerHTML = items.map(k => {
            const statusBadge = k.status === 'VALIDATED'
                ? '<span class="audit-badge audit-badge--lime">VALIDATED</span>'
                : '<span class="audit-badge audit-badge--cyan">IN PROCESS</span>';

            return `
                <tr>
                    <td><span class="cell-code">${k.id}</span></td>
                    <td>
                        <div style="font-weight:600; color:var(--audit-text);">${k.item}</div>
                        <div class="cell-muted">${k.impact || ''}</div>
                    </td>
                    <td><span style="font-size:12px; color:var(--audit-cyan);">${k.category || k.impact || '-'}</span></td>
                    <td><span style="font-size:12px; color:var(--audit-text);">${k.owner}</span></td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    // Render Panel 5.6: Quality Evaluation
    function renderQualityEvaluation(payload) {
        const container = document.getElementById('qualityGrid');
        if (!container) return;

        container.innerHTML = payload.quality_evaluation.map(q => {
            let badgeClass = 'quality-card__score-badge--high';
            let meterClass = 'quality-card__meter-fill--5';
            let scoreText = `${q.score} / ${q.max_score}`;

            if (q.score === null) {
               badgeClass = 'quality-card__score-badge--unrated';
               meterClass = 'quality-card__meter-fill--unrated';
               scoreText = 'Belum Dinilai';
            } else if (q.score <= 1) {
               badgeClass = 'quality-card__score-badge--low';
               meterClass = 'quality-card__meter-fill--1';
            } else if (q.score === 2) {
               badgeClass = 'quality-card__score-badge--med';
               meterClass = 'quality-card__meter-fill--2';
            } else if (q.score === 3) {
               badgeClass = 'quality-card__score-badge--med';
               meterClass = 'quality-card__meter-fill--3';
            } else if (q.score === 4) {
               badgeClass = 'quality-card__score-badge--high';
               meterClass = 'quality-card__meter-fill--4';
            } else if (q.score >= 5) {
               badgeClass = 'quality-card__score-badge--high';
               meterClass = 'quality-card__meter-fill--5';
            }

            const statusBadge = q.status === 'VERIFIED'
                ? '<span class="audit-badge audit-badge--lime">VERIFIED</span>'
                : `<span class="audit-badge audit-badge--dim">${q.status}</span>`;

            return `
                <div class="quality-card">
                    <div class="quality-card__top">
                        <span class="cell-code">${q.id}</span>
                        <span class="quality-card__score-badge ${badgeClass}">${scoreText}</span>
                    </div>
                    <h4 class="quality-card__title">${q.criterion}</h4>
                    <div class="quality-card__meter">
                        <div class="quality-card__meter-fill ${meterClass}"></div>
                    </div>
                    <div class="quality-card__evidence">
                        <strong>Bukti &amp; Dasar Penilaian:</strong> ${q.evidence}
                    </div>
                    <div class="quality-card__foot">
                        <span>Pemeriksaan: ${q.audit_date}</span>
                        ${statusBadge}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render Panel 5.8: Run History & JSON Export
    function renderRunHistory(payload) {
        const verEl = document.getElementById('runVersion');
        const modeEl = document.getElementById('runMode');
        const computedEl = document.getElementById('runComputedAt');
        const locEl = document.getElementById('runLocation');
        const jsonCodeEl = document.getElementById('jsonPreviewCode');

        if (verEl) verEl.textContent = payload.version;
        if (modeEl) modeEl.textContent = payload.mode + (payload.dry_run ? ' (dry_run: true)' : ' (operasional)');
        if (computedEl) computedEl.textContent = payload.computed_at;
        if (locEl) locEl.textContent = payload.computation_location;

        if (jsonCodeEl) {
            jsonCodeEl.textContent = JSON.stringify(payload, null, 2);
        }

        // Export JSON Button (FR-12)
        const exportBtn = document.getElementById('btnExportJson');
        if (exportBtn) {
            exportBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const jsonStr = JSON.stringify(payload, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `health_score_audit_${payload.version}_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // Toggle JSON Preview
        const toggleBtn = document.getElementById('btnToggleJson');
        const jsonWrap = document.getElementById('jsonPreviewWrap');
        if (toggleBtn && jsonWrap) {
            toggleBtn.addEventListener('click', function () {
                const isHidden = jsonWrap.style.display === 'none';
                jsonWrap.style.display = isHidden ? 'block' : 'none';
                toggleBtn.textContent = isHidden ? 'Sembunyikan Preview JSON' : 'Lihat Raw JSON Output';
            });
        }
    }

    // Inisialisasi Utama
    function init() {
        initClock();
        initSidebar();

        if (typeof window.KinerjaEngine === 'undefined') {
            console.error('KinerjaEngine tidak ditemukan. Pastikan kinerja-engine.js dimuat.');
            return;
        }

        // Hitung payload analitik deterministik 4 pilar terpadu
        auditPayload = window.KinerjaEngine.computeHealthScore({ mode: '4_pillars' });

        // Render seluruh 8 panel
        renderSummary(auditPayload);
        renderPillars(auditPayload);
        renderIndicators(auditPayload);
        renderDiscrepancies(auditPayload);
        renderMissingInputs(auditPayload, '');
        renderQualityEvaluation(auditPayload);
        renderRunHistory(auditPayload);

        // Bind filter pencarian missing inputs
        const filterInput = document.getElementById('missingInputsFilter');
        if (filterInput) {
            filterInput.addEventListener('input', function (e) {
                renderMissingInputs(auditPayload, e.target.value);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
