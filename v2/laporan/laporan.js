/**
 * Transport Command Center V2 — Modul Laporan & Repositori Eksekutif
 * BPTD Kelas I Jawa Barat — Kementerian Perhubungan Republik Indonesia
 *
 * Mengelola katalog 8 laporan resmi, pratinjau lembar kerja formal Kop Surat Kemenhub,
 * ekspor CSV universal (RFC 4180 + UTF-8 BOM), ekspor JSON terstruktur, dan cetak dokumen resmi (@media print).
 */
(function() {
    'use strict';

    /* =====================================================================
       1. EMBEDDED MASTER DATASET (OFFLINE FAIL-SAFE)
       ===================================================================== */
    const LAPORAN_EMBEDDED_DATA = {
        title: "Katalog & Repositori Laporan Resmi Transportasi Jawa Barat 2026",
        instansi: "Balai Pengelola Transportasi Darat Kelas I Jawa Barat",
        kementerian: "Kementerian Perhubungan Republik Indonesia",
        direktorat: "Direktorat Jenderal Perhubungan Darat",
        alamat: "Jl. Raya Cibeureum No. 1, Kota Cimahi, Jawa Barat 40535",
        kontak: "Telp: (022) 6011400 | Email: bptd.jabar@dephub.go.id | Web: hubdat.dephub.go.id",
        summary: {
            tahun_anggaran_aktif: "2025 / 2026",
            total_katalog_laporan: 8,
            total_sektor_terintegrasi: 6,
            status_verifikasi: "100% TERVERIFIKASI BPTD"
        },
        metadata_pejabat: {
            pengesah_jabatan: "Kepala Balai Pengelola Transportasi Darat Kelas I Jawa Barat",
            pengesah_nama: "Dr. Ferdy Trisanto Kurniawan, S.T., M.Si",
            pengesah_nip: "NIP. 19780201 200312 1 002",
            pengesah_instansi: "Kementerian Perhubungan RI",
            tempat_pengesahan: "Bandung",
            catatan_legalitas: "Dokumen ini diterbitkan secara elektronik melalui Command Center V2 GeoPORTAL BPTD Kelas I Jawa Barat dan memiliki validitas institusional resmi."
        },
        periodic_schedules: [
            {
                siklus: "Harian",
                nama_agenda: "Posko Harian & Pemantauan Khusus Angkutan Jalan",
                dasar_regulasi: "SOP Manajemen Operasional BPTD",
                pic_pelaksana: "Pusat Kendali Operasi (Puskodal) & Regu Lapangan",
                batas_waktu: "Setiap hari pukul 20:00 WIB",
                format_output: "Flash Report Ringkas & Dashboard Live"
            },
            {
                siklus: "Mingguan",
                nama_agenda: "Rekapitulasi Insiden & Evaluasi Deteksi Anomali",
                dasar_regulasi: "SOP Sistem Kewaspadaan Dini Hubdat",
                pic_pelaksana: "Unit Reaksi Cepat & Keselamatan Operasional",
                batas_waktu: "Setiap hari Senin pukul 09:00 WIB",
                format_output: "Executive Memo & Matriks Anomali"
            },
            {
                siklus: "Bulanan",
                nama_agenda: "Laporan Manifest Terminal, Tonase UPPKB & Produksi Perintis",
                dasar_regulasi: "PM Perhubungan No. 24/2021 & PM No. 74/2021",
                pic_pelaksana: "Seksi Sarpras, Seksi Lalu Lintas & Seksi Angkutan",
                batas_waktu: "Tanggal 5 bulan berikutnya",
                format_output: "Buku Laporan Bulanan & Rekapitulasi CSV"
            },
            {
                siklus: "Triwulanan",
                nama_agenda: "Evaluasi Kinerja DIPA & Akuntabilitas Capaian IKU Hubdat",
                dasar_regulasi: "Perdirjen Hubdat tentang Pedoman IKU",
                pic_pelaksana: "Subbagian Perencanaan & Program",
                batas_waktu: "Hari ke-10 setelah akhir triwulan",
                format_output: "Laporan Triwulanan Konsolidasi BPTD"
            },
            {
                siklus: "Semesteran",
                nama_agenda: "Evaluasi SPM Terminal, Konektivitas Multimoda & Audit Subsidi PSO",
                dasar_regulasi: "Permenhub No. PM 40/2015 & Kontrak PSO DAMRI",
                pic_pelaksana: "Tim Terpadu Pembina Teknis BPTD Jabar",
                batas_waktu: "Akhir bulan Juli & Januari",
                format_output: "Buku Profil Semester & Evaluasi Kebijakan"
            },
            {
                siklus: "Tahunan",
                nama_agenda: "Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP)",
                dasar_regulasi: "Permen PANRB No. 53/2014 & Renstra Ditjen Hubdat",
                pic_pelaksana: "Sekretariat & Seluruh Seksi BPTD Kelas I Jabar",
                batas_waktu: "Bulan Februari tahun berikutnya",
                format_output: "Dokumen LAKIP Resmi & Ringkasan Eksekutif"
            }
        ],
        reports: [
            {
                id: "RPT-EKS-01",
                kode: "RPT-EKS-01",
                nomor_dokumen: "UM.202/BPTD-JBR/EKS/2026",
                judul: "Laporan Eksekutif Konsolidasi Transportasi Darat Jawa Barat",
                kategori: "EKSEKUTIF",
                kategori_label: "Eksekutif & Pimpinan",
                badge_class: "badge-cat-eksekutif",
                unit_kerja: "Sekretariat & Pimpinan BPTD Kelas I Jawa Barat",
                frekuensi: "Bulanan / Semesteran / Tahunan",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Konsolidasi komprehensif performa keselamatan transportasi, kelancaran logistik, produksi simpul angkutan jalan, dan akuntabilitas kinerja perhubungan darat di wilayah kerja BPTD Kelas I Jawa Barat.",
                telaah_eksekutif: "Secara umum kinerja perhubungan darat Jawa Barat TA 2025/2026 menunjukkan performa yang sangat kokoh. Sektor terminal melayani 4,68 juta penumpang dengan standar SPM 87,4/100, pengawasan UPPKB mencatat 91,8% kepatuhan tonase dari 194.392 kendaraan, dan 6 trayek angkutan perintis DAMRI mencapai load factor rata-rata 31,3%. Total pagu anggaran Rp 33,3 M terserap 91,4% secara akuntabel.",
                sorotan_metrik: [
                    { label: "Terminal Tipe A", value: "12 Simpul", sub: "4,68 Juta Penumpang" },
                    { label: "Pengawasan UPPKB", value: "91,8% Patuh", sub: "194.392 Kendaraan" },
                    { label: "Angkutan Perintis", value: "31,3% LF", sub: "26.815 Pnp, 4.655 Rit" },
                    { label: "Konektivitas Hub", value: "79,4 / 100", sub: "47 Simpul Multimoda" },
                    { label: "Deteksi Anomali", value: "18 Insiden", sub: "4 Kritis, 8 Waspada" },
                    { label: "Akuntabilitas DIPA", value: "91,4%", sub: "Rp 30,44 M Terserap" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Sektor / Domain",
                        "Unit Kerja Pengampu",
                        "Pagu Anggaran (Rp)",
                        "Realisasi Keuangan (Rp)",
                        "Serapan Keuangan (%)",
                        "Capaian Output Fisik",
                        "Status Capaian"
                    ],
                    baris: [
                        [1, "Pelayanan Angkutan Perintis (PSO)", "Seksi Angkutan Jalan", "4.752.509.274", "3.889.261.419", "81,8%", "4.655 Ritase (26.815 Pnp)", "OPTIMAL"],
                        [2, "Pengawasan Muatan UPPKB (Zero ODOL)", "Seksi Lalu Lintas Jalan", "3.100.000.000", "2.840.000.000", "91,6%", "194.392 Kendaraan (91,8% Patuh)", "OPTIMAL"],
                        [3, "SPM & Pemeliharaan 12 Terminal A", "Seksi Sarana & Prasarana", "7.200.000.000", "6.420.000.000", "89,2%", "12 Terminal (Skor 87,4/100)", "OPTIMAL"],
                        [4, "Fasilitas Keselamatan Koridor Arteri", "Seksi Lalu Lintas Jalan", "15.600.000.000", "14.850.000.000", "95,2%", "93,8% Perlengkapan Terpasang", "OPTIMAL"],
                        [5, "Inspeksi Kelaikan Kendaraan (Ramp Check)", "Seksi Sarana & Prasarana", "1.050.000.000", "980.000.000", "93,3%", "11.940 Armada (87,3% Laik)", "OPTIMAL"],
                        [6, "Integrasi Multimoda & Simpul Transfer", "Seksi Keterpaduan Moda", "1.600.000.000", "1.450.000.000", "90,6%", "14 Koridor Hub Terhubung", "OPTIMAL"]
                    ]
                }
            },
            {
                id: "RPT-TRM-01",
                kode: "RPT-TRM-01",
                nomor_dokumen: "AJ.001/BPTD-JBR/TRM/2026",
                judul: "Laporan Kinerja Pelayanan & Produksi 12 Terminal Penumpang Tipe A",
                kategori: "TERMINAL",
                kategori_label: "Terminal Penumpang",
                badge_class: "badge-cat-terminal",
                unit_kerja: "Seksi Sarana & Prasarana Transportasi Jalan",
                frekuensi: "Bulanan / Semesteran",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Evaluasi volume produksi manifest penumpang, frekuensi trip bus AKAP/AKDP, dan pemenuhan Standar Pelayanan Minimal (SPM) pada 12 Terminal Tipe A kewenangan BPTD Jawa Barat.",
                telaah_eksekutif: "Sebanyak 12 Terminal Penumpang Tipe A di Jawa Barat mencatat produksi kumulatif 4.681.829 penumpang dan 483.310 trip bus. Terminal Leuwipanjang Bandung dan Baranangsiang Bogor menjadi kontributor terbesar volume bangkitan penumpang. Rata-rata pemenuhan SPM mencapai 87,4 poin dengan status Sangat Baik di seluruh simpul.",
                sorotan_metrik: [
                    { label: "Simpul Terminal A", value: "12 Terminal", sub: "Kewenangan BPTD Jabar" },
                    { label: "Penumpang Berangkat", value: "2.398.710", sub: "Manifest Outflow Resmi" },
                    { label: "Penumpang Tiba", value: "2.283.119", sub: "Manifest Inflow Resmi" },
                    { label: "Total Trip Bus", value: "483.310 Trip", sub: "AKAP & AKDP Antarkota" },
                    { label: "Skor SPM Rerata", value: "87,4 / 100", sub: "Akreditasi Pelayanan" },
                    { label: "Terminal Tersibuk", value: "Leuwipanjang", sub: "1,25 Juta Penumpang" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode",
                        "Nama Terminal Tipe A",
                        "Kabupaten / Kota",
                        "Penumpang Berangkat",
                        "Penumpang Tiba",
                        "Trip Bus (Rit)",
                        "Skor SPM (100)",
                        "Status Operasional"
                    ],
                    baris: [
                        [1, "TRM-01", "Terminal Leuwipanjang", "Kota Bandung", "1.245.890", "1.180.450", "142.300", "91,2", "Sangat Baik"],
                        [2, "TRM-02", "Terminal Baranangsiang", "Kota Bogor", "780.420", "745.110", "88.450", "88,5", "Baik"],
                        [3, "TRM-03", "Terminal Guntur Melati", "Kabupaten Garut", "412.350", "398.200", "42.100", "86,0", "Baik"],
                        [4, "TRM-04", "Terminal Ciakar", "Kabupaten Sumedang", "215.400", "209.800", "24.600", "85,4", "Baik"],
                        [5, "TRM-05", "Terminal KH Ahmad Sanusi", "Kota Sukabumi", "320.150", "311.200", "35.800", "86,8", "Baik"],
                        [6, "TRM-06", "Terminal Jatijajar", "Kota Depok", "450.200", "438.100", "46.200", "89,0", "Sangat Baik"],
                        [7, "TRM-07", "Terminal Indihiang", "Kota Tasikmalaya", "285.600", "278.400", "31.500", "87,2", "Baik"],
                        [8, "TRM-08", "Terminal Klari", "Kabupaten Karawang", "198.400", "192.100", "22.100", "85,1", "Baik"],
                        [9, "TRM-09", "Terminal Banjar", "Kota Banjar", "112.500", "109.800", "14.200", "84,6", "Baik"],
                        [10, "TRM-10", "Terminal Subang", "Kabupaten Subang", "165.200", "161.300", "18.900", "85,8", "Baik"],
                        [11, "TRM-11", "Terminal Harjamukti", "Kota Cirebon", "295.400", "287.600", "32.400", "88,0", "Baik"],
                        [12, "TRM-12", "Terminal Kertawangunan", "Kabupaten Kuningan", "188.700", "183.900", "21.200", "86,2", "Baik"]
                    ]
                }
            },
            {
                id: "RPT-PKB-01",
                kode: "RPT-PKB-01",
                nomor_dokumen: "LL.003/BPTD-JBR/PKB/2026",
                judul: "Laporan Pengawasan Muatan Lebih & Penegakan Hukum Zero ODOL UPPKB",
                kategori: "UPPKB",
                kategori_label: "UPPKB / Logistik",
                badge_class: "badge-cat-uppkb",
                unit_kerja: "Seksi Lalu Lintas Jalan",
                frekuensi: "Bulanan / Triwulanan",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Rekapitulasi pemeriksaan tonase angkutan barang, penindakan hukum tilang dan transfer muatan, serta indeks kepatuhan muatan lebih pada 6 UPPKB di wilayah Jawa Barat.",
                telaah_eksekutif: "Pengawasan pada 6 UPPKB aktif mencatat 194.392 kendaraan angkutan barang tertimbang. Sebanyak 15.898 kasus penindakan pelanggaran muatan berhasil ditegakkan, didominasi penindakan tilang dan transfer muatan pada kendaraan bertonase ekstrem. Tingkat kepatuhan rata-rata koridor mencapai 91,8%, melampaui target nasional 90,0%.",
                sorotan_metrik: [
                    { label: "Fasilitas Penimbangan", value: "6 UPPKB", sub: "Pantura, Tengah, Priangan" },
                    { label: "Kendaraan Diperiksa", value: "194.392 Unit", sub: "Total Penimbangan Resmi" },
                    { label: "Total Penindakan", value: "15.898 Kasus", sub: "Tilang & Transfer Muatan" },
                    { label: "Kepatuhan Koridor", value: "91,8%", sub: "Target Nasional 90,0%" },
                    { label: "Transfer Muatan", value: "53 Kasus", sub: "Pelanggaran Tonase Ekstrem" },
                    { label: "UPPKB Terpadat", value: "Balonggandu", sub: "54.820 Kendaraan Tertimbang" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode",
                        "Nama UPPKB",
                        "Lokasi Wilayah",
                        "Kendaraan Tertimbang",
                        "Total Pelanggaran",
                        "Tilang UPPKB/Polisi",
                        "Transfer Muatan",
                        "Tingkat Kepatuhan (%)",
                        "Status Pengawasan"
                    ],
                    baris: [
                        [1, "JT001", "UPPKB Balonggandu", "Kab. Karawang (Pantura)", "54.820", "5.120", "3.840", "18", "90,7%", "Intensif"],
                        [2, "JT002", "UPPKB Losarang", "Kab. Indramayu (Pantura)", "48.910", "4.650", "3.510", "15", "90,5%", "Intensif"],
                        [3, "JT003", "UPPKB Gentong", "Kab. Tasikmalaya (Priangan Timur)", "28.450", "2.110", "1.620", "6", "92,6%", "Siaga Tanjakan"],
                        [4, "JT004", "UPPKB Cibaragalan", "Kab. Purwakarta (Priangan Barat)", "24.120", "1.780", "1.340", "5", "92,6%", "Reguler"],
                        [5, "JT005", "UPPKB Tomo", "Kab. Sumedang (Priangan Tengah)", "20.340", "1.240", "960", "4", "93,9%", "Reguler"],
                        [6, "JT006", "UPPKB Kemang", "Kab. Bogor (Jabodetabek)", "17.752", "998", "720", "5", "94,4%", "Reguler"]
                    ]
                }
            },
            {
                id: "RPT-PRN-01",
                kode: "RPT-PRN-01",
                nomor_dokumen: "PR.004/BPTD-JBR/PRN/2026",
                judul: "Laporan Operasional Pelayanan Angkutan Jalan Perintis Bersubsidi (PSO)",
                kategori: "PERINTIS",
                kategori_label: "Angkutan Perintis",
                badge_class: "badge-cat-perintis",
                unit_kerja: "Seksi Angkutan Jalan",
                frekuensi: "Bulanan / Semesteran",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Realisasi produksi ritase, volume penumpang terlayani, keterisian armada (load factor), dan serapan anggaran subsidi operasional 6 trayek perintis Perum DAMRI.",
                telaah_eksekutif: "Pelayanan 6 trayek angkutan perintis DAMRI di Sukabumi Selatan, Bogor Barat, dan Purwakarta menunjukkan ketercapaian target yang solid. Realisasi ritase mencapai 4.655 rit (81,8% dari kontrak) dengan 26.815 penumpang. Rata-rata load factor mencapai 31,3% (di atas target kontrak 30,0%) dengan serapan subsidi Rp 3,89 Miliar.",
                sorotan_metrik: [
                    { label: "Trayek Bersubsidi", value: "6 Rute Aktif", sub: "Operator Perum DAMRI" },
                    { label: "Armada Operasional", value: "18 Unit Bus", sub: "Kapasitas 19 Seat / Bus" },
                    { label: "Realisasi Ritase", value: "4.655 Rit", sub: "81,8% dari Target Kontrak" },
                    { label: "Penumpang Terlayani", value: "26.815 Pnp", sub: "Masyarakat Terisolir" },
                    { label: "Rerata Load Factor", value: "31,3%", sub: "Target Kontrak 30,0%" },
                    { label: "Realisasi Subsidi", value: "Rp 3,89 M", sub: "81,8% dari Rp 4,75 M Pagu" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode Trayek",
                        "Relasi Rute Perintis",
                        "Kabupaten",
                        "Kapasitas Armada",
                        "Target Ritase",
                        "Realisasi Ritase",
                        "Penumpang",
                        "Load Factor (%)",
                        "Pagu Kontrak (Rp)",
                        "Realisasi Subsidi (Rp)"
                    ],
                    baris: [
                        [1, "PERINTIS-001", "Surade - Sagaranten", "Kab. Sukabumi", "19 Seat", "1.280", "1.048", "6.240", "31,4%", "1.069.314.580", "875.250.000"],
                        [2, "PERINTIS-002", "Sagaranten - Pelabuhan Ratu", "Kab. Sukabumi", "19 Seat", "1.020", "834", "4.890", "30,9%", "852.750.000", "697.550.000"],
                        [3, "PERINTIS-003", "Tegal Buleud - Sagaranten", "Kab. Sukabumi", "19 Seat", "890", "728", "4.120", "29,8%", "744.200.000", "608.750.000"],
                        [4, "PERINTIS-004", "Leuwiliang - Cikidang", "Kab. Bogor / Sukabumi", "19 Seat", "960", "786", "4.750", "31,8%", "803.120.000", "657.000.000"],
                        [5, "PERINTIS-005", "Jasinga - Parung Panjang", "Kab. Bogor", "19 Seat", "840", "688", "3.980", "30,5%", "702.800.000", "574.900.000"],
                        [6, "PERINTIS-006", "Sadang - Wanakerta", "Kab. Purwakarta", "19 Seat", "698", "571", "2.835", "26,1%", "580.324.694", "475.811.419"]
                    ]
                }
            },
            {
                id: "RPT-ODI-01",
                kode: "RPT-ODI-01",
                nomor_dokumen: "OD.005/BPTD-JBR/ODI/2026",
                judul: "Laporan Analisis Matriks Asal-Tujuan (OD) & Beban Koridor Angkutan Jalan",
                kategori: "OD_INTELLIGENCE",
                kategori_label: "OD Intelligence",
                badge_class: "badge-cat-od",
                unit_kerja: "Seksi Lalu Lintas & Angkutan Jalan",
                frekuensi: "Triwulanan / Tahunan",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Analisis bangkitan dan tarikan penumpang antarkota regional, frekuensi pergerakan bus, rasio beban koridor jalan, dan pola pergerakan mobilitas masyarakat Jawa Barat.",
                telaah_eksekutif: "Analisis matriks pergerakan antarkota mengidentifikasi 4.681.829 volume penumpang melintasi 27 wilayah kabupaten/kota di Jawa Barat. Koridor Bandung-Sukabumi menduduki peringkat terpadat dengan volume 452.046 penumpang (35.961 trip), disusul koridor Bandung-Bekasi dan koridor AKAP Garut-Jakarta. Temuan ini menjadi landasan penetapan alokasi kuota izin trayek dan pengaturan headway.",
                sorotan_metrik: [
                    { label: "Volume Penumpang", value: "4.681.829 Pnp", sub: "Mobilitas Antarkota" },
                    { label: "Perjalanan Bus", value: "483.310 Trip", sub: "Manifest Resmi AKAP/AKDP" },
                    { label: "Wilayah Bangkitan", value: "27 Kab / Kota", sub: "Cakupan Jawa Barat" },
                    { label: "Koridor Terpadat", value: "Bdg - Sukabumi", sub: "452.046 Pnp (9,66% Share)" },
                    { label: "Trip Rata-rata/Hari", value: "2.280 Trip", sub: "Frekuensi Operasional" },
                    { label: "Indeks Beban Puncak", value: "Tinggi", sub: "Priangan Barat & Pantura" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode Koridor",
                        "Relasi Asal - Tujuan",
                        "Kategori Koridor",
                        "Volume Penumpang",
                        "Perjalanan Bus (Trip)",
                        "Rata-rata Pnp/Trip",
                        "Pangsa Pasar (%)",
                        "Beban Mobilitas"
                    ],
                    baris: [
                        [1, "CORR-OD-01", "Bandung (Leuwipanjang) — Sukabumi (Sanusi)", "Antarkota Utama", "452.046", "35.961", "12,6", "9,66%", "Sangat Tinggi"],
                        [2, "CORR-OD-02", "Bandung (Leuwipanjang) — Bekasi (Terminal Bekasi)", "Antarkota Utama", "223.071", "21.682", "10,3", "4,76%", "Tinggi"],
                        [3, "CORR-OD-03", "Garut (Guntur Melati) — Jakarta (Kp. Rambutan)", "Antarkota AKAP", "143.865", "10.995", "13,1", "3,07%", "Tinggi"],
                        [4, "CORR-OD-04", "Garut (Guntur Melati) — Bogor (Baranangsiang)", "Antarkota AKDP", "129.859", "10.395", "12,5", "2,77%", "Tinggi"],
                        [5, "CORR-OD-05", "Garut (Guntur Melati) — Bekasi (Induk Bekasi)", "Antarkota AKDP", "128.239", "8.929", "14,4", "2,74%", "Tinggi"],
                        [6, "CORR-OD-06", "Bogor (Baranangsiang) — Bandung (Leuwipanjang)", "Antarkota AKDP", "121.450", "9.850", "12,3", "2,59%", "Tinggi"],
                        [7, "CORR-OD-07", "Cirebon (Harjamukti) — Bandung (Leuwipanjang)", "Antarkota AKDP", "118.600", "9.420", "12,6", "2,53%", "Sedang-Tinggi"],
                        [8, "CORR-OD-08", "Cikarang (Terminal Cikarang) — Bandung", "Antarkota Komuter", "114.530", "9.110", "12,6", "2,45%", "Sedang-Tinggi"],
                        [9, "CORR-OD-09", "Tasikmalaya (Indihiang) — Jakarta (Kp. Rambutan)", "Antarkota AKAP", "108.920", "8.450", "12,9", "2,33%", "Sedang-Tinggi"],
                        [10, "CORR-OD-10", "Sumedang (Ciakar) — Bandung (Cicaheum/Leuwipanjang)", "Antarkota Aglomerasi", "98.740", "8.120", "12,2", "2,11%", "Sedang"]
                    ]
                }
            },
            {
                id: "RPT-MLT-01",
                kode: "RPT-MLT-01",
                nomor_dokumen: "KM.006/BPTD-JBR/MLT/2026",
                judul: "Laporan Keterpaduan Konektivitas Multimoda & Aksesibilitas Simpul Strategis",
                kategori: "KONEKTIVITAS",
                kategori_label: "Konektivitas Multimoda",
                badge_class: "badge-cat-konektivitas",
                unit_kerja: "Seksi Keterpaduan Moda & Pengembangan Simpul",
                frekuensi: "Semesteran / Tahunan",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Pemetaan integrasi 47 simpul transportasi antarmoda, evaluasi kinerja 14 koridor transfer transit, dan perhitungan Indeks Aksesibilitas Multimoda 27 Kabupaten/Kota se-Jawa Barat.",
                telaah_eksekutif: "Jaringan transportasi Jawa Barat memiliki 47 simpul multimoda lintas moda (12 Terminal Tipe A, 10 Terminal Tipe B, 6 UPPKB, 15 Stasiun KA & Whoosh, 2 Bandara Internasional, 2 Pelabuhan Laut). Indeks Aksesibilitas Multimoda mencapai skor rerata 79,4/100. Wilayah aglomerasi Bandung Raya, Bogor, dan Bekasi mencatat skor tertinggi berkat keberadaan hub terpadu Kereta Cepat Whoosh dan KRL.",
                sorotan_metrik: [
                    { label: "Simpul Multimoda", value: "47 Simpul", sub: "6 Kategori Simpul Strategis" },
                    { label: "Koridor Transfer", value: "14 Koridor", sub: "Jalur Perpindahan Moda" },
                    { label: "Indeks Aksesibilitas", value: "79,4 / 100", sub: "Rata-rata 27 Kab/Kota" },
                    { label: "Hub Kereta Cepat", value: "3 Stasiun", sub: "Padalarang, Tegalluar, Karawang" },
                    { label: "Simpul Logistik", value: "10 Simpul", sub: "6 UPPKB, 2 Pelabuhan, 2 Kargo" },
                    { label: "Wilayah Tertinggi", value: "Kota Bandung", sub: "Indeks 94,4 (Sangat Tinggi)" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode Wilayah",
                        "Kabupaten / Kota",
                        "Skor Moda (40%)",
                        "Skor Simpul (30%)",
                        "Skor Kedekatan (30%)",
                        "Indeks Multimoda (0-100)",
                        "Klasifikasi Aksesibilitas",
                        "Simpul Utama Wilayah"
                    ],
                    baris: [
                        [1, "KOTA-BDG", "Kota Bandung", "95,0", "92,0", "96,0", "94,4", "Sangat Tinggi", "Leuwipanjang, St. Bandung, Husein"],
                        [2, "KOTA-BGR", "Kota Bogor", "90,0", "88,0", "92,0", "90,0", "Sangat Tinggi", "Baranangsiang, St. Bogor, BisKita"],
                        [3, "KAB-BKS", "Kabupaten Bekasi", "88,0", "86,0", "89,0", "87,7", "Tinggi", "Terminal Cikarang, St. Cikarang"],
                        [4, "KAB-KBB", "Kabupaten Bandung Barat", "85,0", "85,0", "90,0", "86,5", "Tinggi", "Hub Padalarang (Whoosh / KA)"],
                        [5, "KOTA-CRB", "Kota Cirebon", "84,0", "82,0", "88,0", "84,6", "Tinggi", "Harjamukti, Kejaksan, Pelabuhan"],
                        [6, "KAB-CRB", "Kabupaten Cirebon", "80,0", "78,0", "82,0", "80,0", "Tinggi", "St. Prujakan, Terminal Sumber"],
                        [7, "KOTA-TSM", "Kota Tasikmalaya", "78,0", "76,0", "80,0", "78,0", "Sedang-Tinggi", "Indihiang, St. Tasikmalaya"],
                        [8, "KAB-SBD", "Kabupaten Subang", "79,0", "77,0", "84,0", "79,9", "Sedang-Tinggi", "Terminal Subang, Pelabuhan Patimban"],
                        [9, "KAB-MJL", "Kabupaten Majalengka", "76,0", "74,0", "82,0", "77,2", "Sedang-Tinggi", "BIJB Kertajati, Shuttle Cisumdawu"],
                        [10, "KAB-KRW", "Kabupaten Karawang", "82,0", "80,0", "84,0", "82,0", "Tinggi", "Terminal Klari, Karawang Whoosh, UPPKB"],
                        [11, "KOTA-DPK", "Kota Depok", "86,0", "84,0", "88,0", "86,0", "Tinggi", "Terminal Jatijajar, St. Depok"],
                        [12, "KAB-SMD", "Kabupaten Sumedang", "74,0", "72,0", "76,0", "74,0", "Sedang", "Terminal Ciakar, UPPKB Tomo"],
                        [13, "KAB-GRT", "Kabupaten Garut", "75,0", "72,0", "75,0", "74,1", "Sedang", "Terminal Guntur Melati, St. Garut"],
                        [14, "KOTA-SKB", "Kota Sukabumi", "75,0", "74,0", "77,0", "75,3", "Sedang", "KH Sanusi, St. Sukabumi"],
                        [15, "KAB-SKB", "Kabupaten Sukabumi", "68,0", "65,0", "66,0", "66,5", "Perlu Peningkatan", "Trayek Perintis DAMRI, Pelabuhan Ratu"]
                    ]
                }
            },
            {
                id: "RPT-ALR-01",
                kode: "RPT-ALR-01",
                nomor_dokumen: "KS.007/BPTD-JBR/ALR/2026",
                judul: "Laporan Kewaspadaan Dini & Rekapitulasi Deteksi Anomali Operasional",
                kategori: "EARLY_WARNING",
                kategori_label: "Early Warning & Anomali",
                badge_class: "badge-cat-early-warning",
                unit_kerja: "Unit Reaksi Cepat & Keselamatan Operasional",
                frekuensi: "Mingguan / Bulanan",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Audit insiden anomali operasional, evaluasi 10 ambang batas deterministik (THR-01 s.d. THR-10), dan rekomendasi mitigasi tanggap darurat keselamatan transportasi darat.",
                telaah_eksekutif: "Sistem deteksi dini memantau 18 insiden anomali aktif di 4 domain pengawasan. Terdapat 4 insiden berstatus Kritis yang mewajibkan intervensi lapangan segera, termasuk lonjakan penumpang di Leuwipanjang, pelanggaran tonase di Balonggandu dan Losarang, serta kerawanan antrean di Tanjakan Gentong. Sebanyak 8 insiden Waspada dan 6 Atensi terus dimonitor dengan kesiapsiagaan penuh.",
                sorotan_metrik: [
                    { label: "Insiden Terdeteksi", value: "18 Anomali", sub: "4 Domain Pengawasan Terpadu" },
                    { label: "Tingkat Kritis", value: "4 Insiden", sub: "Mitigasi Segera Lapangan" },
                    { label: "Tingkat Waspada", value: "8 Insiden", sub: "Siaga Pengawasan Penuh" },
                    { label: "Tingkat Atensi", value: "6 Insiden", sub: "Monitoring Reguler Tim" },
                    { label: "Ambang Batas", value: "10 Formula", sub: "THR-01 s.d. THR-10" },
                    { label: "Domain Dominan", value: "UPPKB & Simpul", sub: "Logistik & Jam Sibuk" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode Insiden",
                        "Judul Anomali Operasional",
                        "Domain Pengawasan",
                        "Fasilitas / Koridor Terkait",
                        "Tingkat Severitas",
                        "Nilai Terpantau vs Ambang Batas",
                        "Pola Temporal",
                        "Rekomendasi Tindakan"
                    ],
                    baris: [
                        [1, "INC-TRM-01", "Lonjakan Penumpang Ekstrem Peak Weekend", "Terminal Penumpang", "Terminal Leuwipanjang Bandung", "CRITICAL", "+43,8% (Ambang: +40%)", "WEEKEND_MARKET", "Kerahkan armada cadangan AKAP & koordinasi Ditlantas"],
                        [2, "INC-PKB-01", "Pelanggaran Muatan Berat Shift Malam", "UPPKB / Logistik", "UPPKB Balonggandu Karawang", "CRITICAL", "26,4% Pelanggaran (Ambang: 25%)", "NIGHT_SHIFT", "Tingkatkan intensitas operasi tilang & transfer muatan"],
                        [3, "INC-PKB-02", "Konvoi Angkutan Tonase Ekstrem Dini Hari", "UPPKB / Logistik", "UPPKB Losarang Indramayu", "CRITICAL", "Muatan +54,2% di atas JBI (Ambang: +50%)", "NIGHT_SHIFT", "Tahan kendaraan di kantong parkir & wajib transfer muatan"],
                        [4, "INC-KOR-01", "Kerawanan Antrean & Macet Tanjakan Hujan", "Koridor Arteri / Keselamatan", "Koridor Tanjakan Gentong Tasikmalaya", "CRITICAL", "Level Darurat / Kecepatan <10 km/h", "WEATHER_SEASONAL", "Aktivasi posko terpadu & siagakan kendaraan derek darurat"],
                        [5, "INC-TRM-02", "Kesenjangan Transmisi Data Manifest", "Terminal Penumpang", "Terminal Guntur Melati Garut", "WARNING", "9 Hari Tanpa Transmisi (Ambang: 7 hari)", "OFFPEAK_CYCLE", "Inspeksi jaringan koneksi & supervisi staf pencatat data"],
                        [6, "INC-TRM-03", "Penurunan Volume Drastis Midweek", "Terminal Penumpang", "Terminal Banjar Kota Banjar", "WARNING", "-38,5% Penurunan (Ambang: -35%)", "OFFPEAK_CYCLE", "Evaluasi rute pengumpan & verifikasi kelaikan armada"],
                        [7, "INC-TRM-04", "Antrean Bus & Kepadatan Shift Siang", "Terminal Penumpang", "Terminal KH Ahmad Sanusi Sukabumi", "WARNING", "+28,5% Kepadatan (Ambang: +25%)", "PEAK_HOURS", "Buka jalur keberangkatan tambahan & optimalkan waktu henti"],
                        [8, "INC-PKB-03", "Penurunan Kepatuhan Muatan Koridor Tengah", "UPPKB / Logistik", "UPPKB Tomo Sumedang", "WARNING", "76,8% Kepatuhan (Ambang: <80%)", "NIGHT_SHIFT", "Operasi gabungan penegakan hukum bersama kepolisian"],
                        [9, "INC-PKB-04", "Lonjakan Angkutan Industri Malam Hari", "UPPKB / Logistik", "UPPKB Cibaragalan Purwakarta", "WARNING", "18,2% Pelanggaran (Ambang: 15%)", "NIGHT_SHIFT", "Sosialisasi batas muatan pada asosiasi pengusaha logistik"],
                        [10, "INC-PRN-01", "Penurunan Load Factor Cuaca Hujan", "Angkutan Perintis", "Trayek PERINTIS-003 Tegal Buleud", "WARNING", "16,4% Load Factor (Ambang: <20%)", "WEATHER_SEASONAL", "Penyesuaian jam keberangkatan & jaminan keselamatan armada"],
                        [11, "INC-KOR-02", "Restriksi Beban Gandar Musim Hujan", "Koridor Arteri / Keselamatan", "Koridor Cadas Pangeran Sumedang", "WARNING", "Skor Bahaya 82/100 (Ambang: 75)", "WEATHER_SEASONAL", "Pengalihan kendaraan berat ke jalan tol Cisumdawu"],
                        [12, "INC-NOD-01", "Hambatan Kecepatan Akses Akses Simpul", "Simpul Multimoda", "Koridor Akses Terminal Baranangsiang", "WARNING", "Kecepatan 14 km/jam (Ambang: <20 km/jam)", "PEAK_HOURS", "Manajemen lampu lalu lintas & penertiban parkir liar"],
                        [13, "INC-TRM-05", "Lonjakan Komuter Pagi Hari Kerja", "Terminal Penumpang", "Terminal Cikarang Bekasi", "ADVISORY", "+21,4% Volume (Ambang: +20%)", "PEAK_HOURS", "Optimalisasi sirkulasi peron & feeder KRL Cikarang"],
                        [14, "INC-PKB-05", "Pelanggaran Muatan Ringan Truk Ringan", "UPPKB / Logistik", "UPPKB Kemang Bogor", "ADVISORY", "12,4% Pelanggaran (Ambang: 10%)", "PEAK_HOURS", "Pemberian surat peringatan pertama & edukasi pengemudi"],
                        [15, "INC-PRN-02", "Lonjakan Penumpang Hari Pasar", "Angkutan Perintis", "Trayek PERINTIS-001 Surade-Sagaranten", "ADVISORY", "84,2% Okupansi (Ambang: >80%)", "WEEKEND_MARKET", "Siagakan 1 armada bus cadangan pada hari pasar"],
                        [16, "INC-PRN-03", "Okupansi Rendah Perjalanan Jam Pabrik", "Angkutan Perintis", "Trayek PERINTIS-006 Sadang-Wanakerta", "ADVISORY", "22,5% Load Factor (Ambang: <25%)", "PEAK_HOURS", "Sinkronisasi jadwal perjalanan dengan shift kawasan industri BIC"],
                        [17, "INC-KOR-03", "Lonjakan Konvoi Truk Logistik Pelabuhan", "Koridor Arteri / Keselamatan", "Koridor Akses Pelabuhan Patimban Subang", "ADVISORY", "+22,8% Volume Truk (Ambang: +20%)", "WEEKEND_MARKET", "Pemberlakuan time-window keberangkatan truk ekspedisi"],
                        [18, "INC-NOD-02", "Angin Silang Akses Simpul Bandara", "Simpul Multimoda", "Koridor Akses BIJB Kertajati Majalengka", "ADVISORY", "Crosswind 48 km/jam (Ambang: >45 km/jam)", "WEATHER_SEASONAL", "Pemasangan rambu peringatan kecepatan maksimal & windsock"]
                    ]
                }
            },
            {
                id: "RPT-PRG-01",
                kode: "RPT-PRG-01",
                nomor_dokumen: "PR.008/BPTD-JBR/PRG/2026",
                judul: "Laporan Capaian Program Kerja Strategis & Akuntabilitas Kinerja Hubdat",
                kategori: "PROGRAM_KINERJA",
                kategori_label: "Program & Kinerja",
                badge_class: "badge-cat-program",
                unit_kerja: "Subbagian Perencanaan & Program BPTD Kelas I Jabar",
                frekuensi: "Triwulanan / Tahunan",
                periode_rekomendasi: "TA 2025 / 2026",
                ringkasan: "Akuntabilitas penyerapan anggaran DIPA, realisasi target output fisik, capaian 6 Indikator Kinerja Utama (IKU), dan progres triwulanan BPTD Kelas I Jawa Barat.",
                telaah_eksekutif: "BPTD Kelas I Jawa Barat mengelola alokasi anggaran Rp 33.302.509.274 terbagi pada 6 program strategis. Realisasi keuangan mencapai Rp 30.439.261.419 (91,4%) dengan rata-rata progres fisik 93,6%. Seluruh 6 Indikator Kinerja Utama (IKU) Ditjen Hubdat berhasil mencapai bahkan melampaui target yang ditetapkan, dengan status portofolio 100% On Track.",
                sorotan_metrik: [
                    { label: "Program Strategis", value: "6 Program", sub: "Angkutan, Lalin & Sarpras" },
                    { label: "Pagu DIPA", value: "Rp 33,30 M", sub: "Total Alokasi Anggaran" },
                    { label: "Realisasi Keuangan", value: "91,4%", sub: "Rp 30,44 M Terserap" },
                    { label: "Progres Fisik", value: "93,6%", sub: "Realisasi Output Lapangan" },
                    { label: "Capaian KPI Hubdat", value: "6 dari 6 KPI", sub: "100% Target Terpenuhi" },
                    { label: "Status Akuntabilitas", value: "ON TRACK", sub: "Kategori Sangat Baik" }
                ],
                tabel: {
                    kolom: [
                        "No",
                        "Kode",
                        "Nama Program Strategis",
                        "Bidang Pengampu",
                        "Pagu Anggaran (Rp)",
                        "Realisasi Keuangan (Rp)",
                        "Serapan Keuangan (%)",
                        "Target Output Fisik",
                        "Realisasi Fisik (%)",
                        "Capaian KPI",
                        "Status Akuntabilitas"
                    ],
                    baris: [
                        [1, "PRG-01", "Pelayanan Angkutan Jalan Perintis Bersubsidi (PSO)", "Angkutan Jalan", "4.752.509.274", "3.889.261.419", "81,8%", "5.688 Ritase (6 Trayek DAMRI)", "81,8%", "LF 31,3% (Target: 30%)", "On Track"],
                        [2, "PRG-02", "Pengawasan & Penegakan Hukum Muatan Lebih (Zero ODOL)", "Lalu Lintas Jalan", "3.100.000.000", "2.840.000.000", "91,6%", "200.000 Kendaraan Tertimbang", "97,2%", "Kepatuhan 91,8% (Target: 90%)", "On Track"],
                        [3, "PRG-03", "Peningkatan SPM & Pemeliharaan 12 Terminal Tipe A", "Sarana & Prasarana", "7.200.000.000", "6.420.000.000", "89,2%", "12 Terminal Terakreditasi SPM", "100,0%", "Skor SPM 87,4 (Target: 80)", "On Track"],
                        [4, "PRG-04", "Pemasangan Fasilitas Keselamatan Jalan Arteri Nasional", "Lalu Lintas Jalan", "15.600.000.000", "14.850.000.000", "95,2%", "Marka, Guardrail, Rambu RPPJ", "93,8%", "Covered 94,5% (Target: 90%)", "On Track"],
                        [5, "PRG-05", "Inspeksi Kelaikan Teknis Ramp Check Angkutan Jalan", "Sarana & Prasarana", "1.050.000.000", "980.000.000", "93,3%", "12.500 Armada Bus Diperiksa", "95,5%", "Laik 87,3% (Target: 85%)", "On Track"],
                        [6, "PRG-06", "Pengembangan Integrasi Konektivitas Hub Multimoda", "Angkutan Jalan", "1.600.000.000", "1.450.000.000", "90,6%", "14 Koridor Transfer Antarmoda", "100,0%", "Indeks 79,4 (Target: 75)", "On Track"]
                    ]
                }
            }
        ]
    };

    /* =====================================================================
       2. APPLICATION STATE
       ===================================================================== */
    let allReports = LAPORAN_EMBEDDED_DATA.reports;
    let periodicSchedules = LAPORAN_EMBEDDED_DATA.periodic_schedules;
    let metadataPejabat = LAPORAN_EMBEDDED_DATA.metadata_pejabat;

    let activeFilterYear = "2026";
    let activeFilterPeriod = "ALL";
    let activeFilterCategory = "ALL";
    let activeSearchQuery = "";
    let activePreviewReportId = "RPT-EKS-01";
    let activeModalReportId = null;
    let modalTriggerElement = null;

    /* =====================================================================
       3. DOM ELEMENTS
       ===================================================================== */
    const selectYear = document.getElementById("selectYear");
    const selectPeriod = document.getElementById("selectPeriod");
    const selectCategory = document.getElementById("selectCategory");
    const searchReport = document.getElementById("searchReport");
    const btnResetFilter = document.getElementById("btnResetFilter");

    const btnTabCatalog = document.getElementById("btnTabCatalog");
    const btnTabPreview = document.getElementById("btnTabPreview");
    const btnTabSchedule = document.getElementById("btnTabSchedule");
    const panelCatalog = document.getElementById("panelCatalog");
    const panelPreview = document.getElementById("panelPreview");
    const panelSchedule = document.getElementById("panelSchedule");

    const reportCatalogGrid = document.getElementById("reportCatalogGrid");
    const catalogCountInfo = document.getElementById("catalogCountInfo");
    const previewReportSelect = document.getElementById("previewReportSelect");
    const liveOfficialDocSheet = document.getElementById("liveOfficialDocSheet");
    const scheduleTableBody = document.getElementById("scheduleTableBody");

    const btnPrintFromPreview = document.getElementById("btnPrintFromPreview");
    const btnCsvFromPreview = document.getElementById("btnCsvFromPreview");
    const btnJsonFromPreview = document.getElementById("btnJsonFromPreview");

    // Modal elements
    const modalBackdrop = document.getElementById("modalBackdrop");
    const reportDetailModal = document.getElementById("reportDetailModal");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalCloseFooterBtn = document.getElementById("modalCloseFooterBtn");
    const modalCategoryBadge = document.getElementById("modalCategoryBadge");
    const modalCodeBadge = document.getElementById("modalCodeBadge");
    const modalFrequencyBadge = document.getElementById("modalFrequencyBadge");
    const modalReportTitle = document.getElementById("modalReportTitle");
    const modalReportSub = document.getElementById("modalReportSub");
    const modalSummaryBox = document.getElementById("modalSummaryBox");
    const modalMetricsGrid = document.getElementById("modalMetricsGrid");
    const modalTableHead = document.getElementById("modalTableHead");
    const modalTableBody = document.getElementById("modalTableBody");
    const modalPrintBtn = document.getElementById("modalPrintBtn");
    const modalExportCsvBtn = document.getElementById("modalExportCsvBtn");
    const modalExportJsonBtn = document.getElementById("modalExportJsonBtn");

    // Print Container
    const printableReportSheet = document.getElementById("printableReportSheet");

    // Sidebar Mobile Toggle
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarClose = document.getElementById("sidebarClose");
    const appSidebar = document.getElementById("appSidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    /* =====================================================================
       4. INITIALIZATION & DATA LOADING
       ===================================================================== */
    async function init() {
        initClock();
        initSidebar();
        initTabs();
        initFilters();
        initModalEvents();

        await loadRemoteDataset();

        renderCatalogGrid();
        renderPreviewDropdown();
        renderOfficialDocSheet(activePreviewReportId);
        renderScheduleTable();
    }

    async function loadRemoteDataset() {
        const potentialUrls = [
            "../../data/laporan-eksekutif-jabar.json",
            "../src/data/laporan-eksekutif-jabar.json",
            "/data/laporan-eksekutif-jabar.json"
        ];

        for (const url of potentialUrls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.reports) && data.reports.length > 0) {
                        allReports = data.reports;
                        if (Array.isArray(data.periodic_schedules)) {
                            periodicSchedules = data.periodic_schedules;
                        }
                        if (data.metadata_pejabat) {
                            metadataPejabat = data.metadata_pejabat;
                        }
                        break;
                    }
                }
            } catch (err) {
                // Ignore and proceed to next or fallback
            }
        }
    }

    /* =====================================================================
       5. REALTIME CLOCK
       ===================================================================== */
    function initClock() {
        const dateEl = document.getElementById("current-date");
        const timeEl = document.getElementById("current-time");

        function update() {
            const now = new Date();
            if (dateEl) {
                const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                dateEl.textContent = now.toLocaleDateString('id-ID', options);
            }
            if (timeEl) {
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                timeEl.textContent = `${hours}:${minutes}:${seconds} WIB`;
            }
        }

        update();
        setInterval(update, 1000);
    }

    /* =====================================================================
       6. SIDEBAR MOBILE TOGGLE
       ===================================================================== */
    function initSidebar() {
        if (!sidebarToggle || !appSidebar || !sidebarOverlay) return;

        function openSidebar() {
            appSidebar.classList.add("is-open");
            sidebarOverlay.hidden = false;
            sidebarToggle.setAttribute("aria-expanded", "true");
        }

        function closeSidebar() {
            appSidebar.classList.remove("is-open");
            sidebarOverlay.hidden = true;
            sidebarToggle.setAttribute("aria-expanded", "false");
        }

        sidebarToggle.addEventListener("click", openSidebar);
        if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    /* =====================================================================
       7. TAB CONTROLLER
       ===================================================================== */
    function initTabs() {
        const tabs = [
            { btn: btnTabCatalog, panel: panelCatalog },
            { btn: btnTabPreview, panel: panelPreview },
            { btn: btnTabSchedule, panel: panelSchedule }
        ];

        function switchTab(targetIndex) {
            tabs.forEach((tab, idx) => {
                const isActive = idx === targetIndex;
                tab.btn.classList.toggle("is-active", isActive);
                tab.btn.setAttribute("aria-selected", isActive ? "true" : "false");
                tab.btn.setAttribute("tabindex", isActive ? "0" : "-1");
                tab.panel.hidden = !isActive;
            });
        }

        tabs.forEach((tab, index) => {
            tab.btn.addEventListener("click", () => switchTab(index));

            tab.btn.addEventListener("keydown", (e) => {
                let target = -1;
                if (e.key === "ArrowRight") target = (index + 1) % tabs.length;
                else if (e.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
                else if (e.key === "Home") target = 0;
                else if (e.key === "End") target = tabs.length - 1;

                if (target !== -1) {
                    e.preventDefault();
                    tabs[target].btn.focus();
                    switchTab(target);
                }
            });
        });
    }

    /* =====================================================================
       8. FILTER ENGINE
       ===================================================================== */
    function initFilters() {
        if (selectYear) {
            selectYear.addEventListener("change", (e) => {
                activeFilterYear = e.target.value;
                renderCatalogGrid();
                renderOfficialDocSheet(activePreviewReportId);
            });
        }

        if (selectPeriod) {
            selectPeriod.addEventListener("change", (e) => {
                activeFilterPeriod = e.target.value;
                renderCatalogGrid();
                renderOfficialDocSheet(activePreviewReportId);
            });
        }

        if (selectCategory) {
            selectCategory.addEventListener("change", (e) => {
                activeFilterCategory = e.target.value;
                renderCatalogGrid();
            });
        }

        if (searchReport) {
            searchReport.addEventListener("input", (e) => {
                activeSearchQuery = e.target.value.trim().toLowerCase();
                renderCatalogGrid();
            });
        }

        if (btnResetFilter) {
            btnResetFilter.addEventListener("click", () => {
                if (selectYear) selectYear.value = "2026";
                if (selectPeriod) selectPeriod.value = "ALL";
                if (selectCategory) selectCategory.value = "ALL";
                if (searchReport) searchReport.value = "";

                activeFilterYear = "2026";
                activeFilterPeriod = "ALL";
                activeFilterCategory = "ALL";
                activeSearchQuery = "";

                renderCatalogGrid();
                renderOfficialDocSheet(activePreviewReportId);
            });
        }
    }

    function getFilteredReports() {
        return allReports.filter(report => {
            // Category filter
            if (activeFilterCategory !== "ALL" && report.kategori !== activeFilterCategory) {
                return false;
            }

            // Search query filter
            if (activeSearchQuery) {
                const matchTitle = (report.judul || "").toLowerCase().includes(activeSearchQuery);
                const matchCode = (report.kode || "").toLowerCase().includes(activeSearchQuery);
                const matchUnit = (report.unit_kerja || "").toLowerCase().includes(activeSearchQuery);
                const matchDesc = (report.ringkasan || "").toLowerCase().includes(activeSearchQuery);
                if (!matchTitle && !matchCode && !matchUnit && !matchDesc) {
                    return false;
                }
            }

            return true;
        });
    }

    function getPeriodLabel(periodKey, yearVal) {
        const year = yearVal || activeFilterYear || "2026";
        switch (periodKey || activeFilterPeriod) {
            case "SEM1": return `Semester I TA ${year} (Januari – Juni)`;
            case "SEM2": return `Semester II TA ${year} (Juli – Desember)`;
            case "Q1": return `Triwulan I (Q1) TA ${year}`;
            case "Q2": return `Triwulan II (Q2) TA ${year}`;
            case "Q3": return `Triwulan III (Q3) TA ${year}`;
            case "Q4": return `Triwulan IV (Q4) TA ${year}`;
            case "MTH": return `Bulan Berjalan TA ${year}`;
            case "ALL":
            default:
                return `Tahun Anggaran ${year} (Konsolidasi Penuh)`;
        }
    }

    /* =====================================================================
       9. CATALOG GRID RENDERER
       ===================================================================== */
    function renderCatalogGrid() {
        if (!reportCatalogGrid) return;

        const filtered = getFilteredReports();
        reportCatalogGrid.innerHTML = "";

        if (catalogCountInfo) {
            catalogCountInfo.textContent = `Menampilkan ${filtered.length} dari ${allReports.length} Laporan Resmi BPTD`;
        }

        if (filtered.length === 0) {
            reportCatalogGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: #64748b;">
                    <svg class="icon-md" style="margin: 0 auto 0.75rem; width: 36px; height: 36px; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p style="font-weight: 600; font-size: 1rem; color: #334155; margin: 0 0 0.25rem 0;">Tidak ada laporan yang sesuai kriteria pencarian</p>
                    <p style="font-size: 0.85rem; margin: 0;">Silakan ubah filter kategori atau kata kunci pencarian Anda.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(report => {
            const card = document.createElement("article");
            card.className = "report-card";
            card.id = `card-${report.id}`;

            const badgeClass = report.badge_class || getCategoryBadgeClass(report.kategori);

            // Build metrics chips HTML
            const metrics = Array.isArray(report.sorotan_metrik) ? report.sorotan_metrik.slice(0, 4) : [];
            const metricsHtml = metrics.map(m => `
                <div class="metric-mini-chip">
                    <span class="metric-mini-label" title="${escapeHtml(m.label)}">${escapeHtml(m.label)}</span>
                    <span class="metric-mini-val">${escapeHtml(m.value)}</span>
                </div>
            `).join("");

            card.innerHTML = `
                <div class="report-card-header">
                    <div class="report-card-badges">
                        <span class="category-badge ${badgeClass}">${escapeHtml(report.kategori_label || report.kategori)}</span>
                        <span class="code-pill">${escapeHtml(report.kode)}</span>
                        <span class="freq-badge">${escapeHtml(report.frekuensi)}</span>
                    </div>
                    <h4 class="report-card-title">${escapeHtml(report.judul)}</h4>
                    <p class="report-card-unit">${escapeHtml(report.unit_kerja)}</p>
                </div>
                <div class="report-card-body">
                    <p class="report-card-desc">${escapeHtml(report.ringkasan)}</p>
                    <div class="report-card-metrics">
                        ${metricsHtml}
                    </div>
                </div>
                <div class="report-card-footer">
                    <div class="card-action-row-primary">
                        <button type="button" class="btn-card-action btn-act-preview" data-action="preview" data-id="${report.id}">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            <span>Pratinjau</span>
                        </button>
                        <button type="button" class="btn-card-action btn-act-print" data-action="print" data-id="${report.id}">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            <span>Cetak</span>
                        </button>
                    </div>
                    <div class="card-action-row-secondary">
                        <button type="button" class="btn-card-action btn-act-csv" data-action="csv" data-id="${report.id}">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span>Ekspor CSV</span>
                        </button>
                        <button type="button" class="btn-card-action btn-act-json" data-action="json" data-id="${report.id}">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                            <span>JSON</span>
                        </button>
                    </div>
                </div>
            `;

            reportCatalogGrid.appendChild(card);
        });

        // Attach action handlers on buttons
        reportCatalogGrid.querySelectorAll("button[data-action]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const action = btn.getAttribute("data-action");
                const id = btn.getAttribute("data-id");

                if (action === "preview") {
                    openModal(id, btn);
                } else if (action === "print") {
                    printReport(id);
                } else if (action === "csv") {
                    exportReportCSV(id);
                } else if (action === "json") {
                    exportReportJSON(id);
                }
            });
        });
    }

    function getCategoryBadgeClass(category) {
        switch (category) {
            case "EKSEKUTIF": return "badge-cat-eksekutif";
            case "TERMINAL": return "badge-cat-terminal";
            case "UPPKB": return "badge-cat-uppkb";
            case "PERINTIS": return "badge-cat-perintis";
            case "OD_INTELLIGENCE": return "badge-cat-od";
            case "KONEKTIVITAS": return "badge-cat-konektivitas";
            case "EARLY_WARNING": return "badge-cat-early-warning";
            case "PROGRAM_KINERJA": return "badge-cat-program";
            default: return "badge-cat-eksekutif";
        }
    }

    /* =====================================================================
       10. PREVIEW TAB CONTROLS & SHEET RENDERER
       ===================================================================== */
    function renderPreviewDropdown() {
        if (!previewReportSelect) return;

        previewReportSelect.innerHTML = allReports.map(r => `
            <option value="${r.id}" ${r.id === activePreviewReportId ? 'selected' : ''}>
                [${r.kode}] ${r.judul}
            </option>
        `).join("");

        previewReportSelect.addEventListener("change", (e) => {
            activePreviewReportId = e.target.value;
            renderOfficialDocSheet(activePreviewReportId);
        });

        if (btnPrintFromPreview) {
            btnPrintFromPreview.addEventListener("click", () => printReport(activePreviewReportId));
        }
        if (btnCsvFromPreview) {
            btnCsvFromPreview.addEventListener("click", () => exportReportCSV(activePreviewReportId));
        }
        if (btnJsonFromPreview) {
            btnJsonFromPreview.addEventListener("click", () => exportReportJSON(activePreviewReportId));
        }
    }

    function renderOfficialDocSheet(reportId) {
        if (!liveOfficialDocSheet) return;

        const report = allReports.find(r => r.id === reportId) || allReports[0];
        if (!report) return;

        const periodText = getPeriodLabel(activeFilterPeriod, activeFilterYear);
        const todayStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

        // Metric chips
        const metricsHtml = Array.isArray(report.sorotan_metrik) ? report.sorotan_metrik.map(m => `
            <div class="doc-metric-box">
                <span class="doc-metric-box-label">${escapeHtml(m.label)}</span>
                <span class="doc-metric-box-val">${escapeHtml(m.value)}</span>
                <span class="doc-metric-box-sub">${escapeHtml(m.sub || '')}</span>
            </div>
        `).join("") : "";

        // Table HTML
        const tableHtml = buildTableMarkup(report.tabel);

        liveOfficialDocSheet.innerHTML = `
            <!-- Kop Surat Resmi -->
            <div class="doc-kop-surat">
                <div class="doc-kop-header-content">
                    <p class="doc-kop-instansi">KEMENTERIAN PERHUBUNGAN</p>
                    <p class="doc-kop-ditjen">DIREKTORAT JENDERAL PERHUBUNGAN DARAT</p>
                    <p class="doc-kop-bptd">BALAI PENGELOLA TRANSPORTASI DARAT KELAS I JAWA BARAT</p>
                    <p class="doc-kop-alamat">
                        Jl. Raya Cibeureum No. 1, Kota Cimahi, Jawa Barat 40535 | Telp: (022) 6011400 | Email: bptd.jabar@dephub.go.id | Web: hubdat.dephub.go.id
                    </p>
                </div>
                <div class="doc-kop-divider" aria-hidden="true"></div>
            </div>

            <!-- Judul & Nomor Dokumen -->
            <div class="doc-title-block">
                <h3 class="doc-main-title">${escapeHtml(report.judul)}</h3>
                <p class="doc-meta-sub">Nomor Registrasi: ${escapeHtml(report.nomor_dokumen || 'UM.202/BPTD-JBR/2026')}</p>
                <p class="doc-meta-sub">Periode Pelaporan: <strong>${escapeHtml(periodText)}</strong></p>
                <p class="doc-meta-sub" style="font-size:0.75rem; color:#64748b;">Pengampu: ${escapeHtml(report.unit_kerja)}</p>
            </div>

            <!-- Ringkasan Eksekutif -->
            <div class="doc-section">
                <h4 class="doc-section-title">I. Ringkasan Eksekutif &amp; Telaah Pimpinan</h4>
                <p class="doc-summary-text">${escapeHtml(report.telaah_eksekutif || report.ringkasan)}</p>
            </div>

            <!-- Sorotan Metrik Kinerja -->
            <div class="doc-section">
                <h4 class="doc-section-title">II. Sorotan Indikator &amp; Metrik Kinerja Utama</h4>
                <div class="doc-metrics-summary">
                    ${metricsHtml}
                </div>
            </div>

            <!-- Data Tabular -->
            <div class="doc-section">
                <h4 class="doc-section-title">III. Rincian Data Tabular Operasional</h4>
                <div class="table-wrap">
                    ${tableHtml}
                </div>
            </div>

            <!-- Blok Pengesahan Tanda Tangan -->
            <div class="doc-signature-block">
                <div class="signature-box">
                    <p class="sig-date">${metadataPejabat.tempat_pengesahan || 'Bandung'}, ${todayStr}</p>
                    <p class="sig-title">${metadataPejabat.pengesah_jabatan || 'Kepala Balai Pengelola Transportasi Darat Kelas I Jawa Barat'}</p>
                    <div class="sig-stamp-area" aria-hidden="true"></div>
                    <p class="sig-name">${metadataPejabat.pengesah_nama || 'Dr. Ferdy Trisanto Kurniawan, S.T., M.Si'}</p>
                    <p class="sig-nip">${metadataPejabat.pengesah_nip || 'NIP. 19780201 200312 1 002'}</p>
                </div>
            </div>

            <p class="doc-legal-note">
                ${metadataPejabat.catatan_legalitas || 'Dokumen resmi terverifikasi melalui Command Center V2 GeoPORTAL BPTD Kelas I Jawa Barat.'}
            </p>
        `;
    }

    function buildTableMarkup(tableObj, isPrint = false) {
        if (!tableObj || !Array.isArray(tableObj.kolom) || !Array.isArray(tableObj.baris)) {
            return '<p style="padding:1rem; color:#64748b;">Data tabular belum tersedia.</p>';
        }

        const className = isPrint ? 'print-table' : 'report-table';

        const thead = `
            <thead>
                <tr>
                    ${tableObj.kolom.map((col, idx) => `<th scope="col" ${idx === 0 ? 'style="width:40px; text-align:center;"' : ''}>${escapeHtml(col)}</th>`).join("")}
                </tr>
            </thead>
        `;

        const tbody = `
            <tbody>
                ${tableObj.baris.map(row => `
                    <tr>
                        ${row.map((cell, idx) => {
                            const isNum = typeof cell === "number" || (/^[\d.,%Rp\s+-]+$/.test(String(cell)) && !isNaN(Number(String(cell).replace(/[^\d.-]/g, ""))));
                            const alignClass = idx === 0 ? 'class="text-center"' : (isNum ? 'class="text-right"' : '');
                            return `<td ${alignClass}>${escapeHtml(String(cell))}</td>`;
                        }).join("")}
                    </tr>
                `).join("")}
            </tbody>
        `;

        return `<table class="${className}" aria-label="Tabel Data">${thead}${tbody}</table>`;
    }

    /* =====================================================================
       11. SCHEDULE TABLE RENDERER
       ===================================================================== */
    function renderScheduleTable() {
        if (!scheduleTableBody) return;

        scheduleTableBody.innerHTML = periodicSchedules.map(item => `
            <tr>
                <td><strong>${escapeHtml(item.siklus)}</strong></td>
                <td>
                    <div style="font-weight:600; color:#0f172a;">${escapeHtml(item.nama_agenda)}</div>
                </td>
                <td style="font-size:0.75rem; color:#475569;">${escapeHtml(item.dasar_regulasi)}</td>
                <td>${escapeHtml(item.pic_pelaksana)}</td>
                <td><span style="font-weight:600; color:#0284c7;">${escapeHtml(item.batas_waktu)}</span></td>
                <td><span class="code-pill">${escapeHtml(item.format_output)}</span></td>
            </tr>
        `).join("");
    }

    /* =====================================================================
       12. MODAL CONTROLLER & FOCUS TRAP
       ===================================================================== */
    function initModalEvents() {
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener("click", closeModal);
        }
        if (modalCloseFooterBtn) {
            modalCloseFooterBtn.addEventListener("click", closeModal);
        }
        if (modalBackdrop) {
            modalBackdrop.addEventListener("click", closeModal);
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && reportDetailModal && !reportDetailModal.hidden) {
                closeModal();
            }
        });

        if (modalPrintBtn) {
            modalPrintBtn.addEventListener("click", () => {
                if (activeModalReportId) printReport(activeModalReportId);
            });
        }
        if (modalExportCsvBtn) {
            modalExportCsvBtn.addEventListener("click", () => {
                if (activeModalReportId) exportReportCSV(activeModalReportId);
            });
        }
        if (modalExportJsonBtn) {
            modalExportJsonBtn.addEventListener("click", () => {
                if (activeModalReportId) exportReportJSON(activeModalReportId);
            });
        }
    }

    function openModal(reportId, triggerEl) {
        const report = allReports.find(r => r.id === reportId);
        if (!report || !reportDetailModal) return;

        activeModalReportId = reportId;
        modalTriggerElement = triggerEl || document.activeElement;

        // Populate badges
        if (modalCategoryBadge) {
            modalCategoryBadge.className = `category-badge ${report.badge_class || getCategoryBadgeClass(report.kategori)}`;
            modalCategoryBadge.textContent = report.kategori_label || report.kategori;
        }
        if (modalCodeBadge) modalCodeBadge.textContent = report.kode;
        if (modalFrequencyBadge) modalFrequencyBadge.textContent = report.frekuensi;

        // Titles & Summary
        if (modalReportTitle) modalReportTitle.textContent = report.judul;
        if (modalReportSub) modalReportSub.textContent = `${report.unit_kerja} — Nomor: ${report.nomor_dokumen || '-'}`;
        if (modalSummaryBox) modalSummaryBox.textContent = report.telaah_eksekutif || report.ringkasan;

        // Metrics
        if (modalMetricsGrid) {
            modalMetricsGrid.innerHTML = Array.isArray(report.sorotan_metrik) ? report.sorotan_metrik.map(m => `
                <div class="modal-stat-card">
                    <span class="modal-stat-label">${escapeHtml(m.label)}</span>
                    <p class="modal-stat-val text-blue">${escapeHtml(m.value)}</p>
                    <span class="modal-stat-sub">${escapeHtml(m.sub || '')}</span>
                </div>
            `).join("") : "";
        }

        // Table
        if (modalTableHead && modalTableBody && report.tabel) {
            modalTableHead.innerHTML = `
                <tr>
                    ${report.tabel.kolom.map((col, idx) => `<th scope="col" ${idx === 0 ? 'style="width:40px; text-align:center;"' : ''}>${escapeHtml(col)}</th>`).join("")}
                </tr>
            `;

            modalTableBody.innerHTML = report.tabel.baris.map(row => `
                <tr>
                    ${row.map((cell, idx) => {
                        const isNum = typeof cell === "number" || (/^[\d.,%Rp\s+-]+$/.test(String(cell)) && !isNaN(Number(String(cell).replace(/[^\d.-]/g, ""))));
                        const alignClass = idx === 0 ? 'class="text-center"' : (isNum ? 'class="text-right"' : '');
                        return `<td ${alignClass}>${escapeHtml(String(cell))}</td>`;
                    }).join("")}
                </tr>
            `).join("");
        }

        // Show modal
        if (modalBackdrop) modalBackdrop.hidden = false;
        reportDetailModal.hidden = false;

        // Set focus to close button
        if (modalCloseBtn) modalCloseBtn.focus();
    }

    function closeModal() {
        if (reportDetailModal) reportDetailModal.hidden = true;
        if (modalBackdrop) modalBackdrop.hidden = true;
        activeModalReportId = null;

        // Restore focus
        if (modalTriggerElement && typeof modalTriggerElement.focus === "function") {
            modalTriggerElement.focus();
        }
    }

    /* =====================================================================
       13. UNIVERSAL CSV EXPORT ENGINE (RFC 4180 + UTF-8 BOM)
       ===================================================================== */
    function exportReportCSV(reportId) {
        const report = allReports.find(r => r.id === reportId);
        if (!report || !report.tabel) {
            alert("Data laporan tidak ditemukan untuk diekspor.");
            return;
        }

        const periodLabel = getPeriodLabel(activeFilterPeriod, activeFilterYear);
        const todayStr = new Date().toISOString().slice(0, 10);

        function escapeCsvCell(cell) {
            if (cell === null || cell === undefined) return '""';
            const str = String(cell);
            if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return `"${str}"`;
        }

        const lines = [];

        // Official metadata headers
        lines.push(escapeCsvCell("BALAI PENGELOLA TRANSPORTASI DARAT KELAS I JAWA BARAT"));
        lines.push(escapeCsvCell("DIREKTORAT JENDERAL PERHUBUNGAN DARAT - KEMENTERIAN PERHUBUNGAN RI"));
        lines.push(escapeCsvCell(`JUDUL LAPORAN: ${report.judul}`));
        lines.push(escapeCsvCell(`NOMOR REGISTRASI: ${report.nomor_dokumen || '-'}`));
        lines.push(escapeCsvCell(`PENGAMPU: ${report.unit_kerja}`));
        lines.push(escapeCsvCell(`PERIODE: ${periodLabel}`));
        lines.push(escapeCsvCell(`TANGGAL CETAK: ${todayStr}`));
        lines.push(""); // empty line

        // Column headers
        lines.push(report.tabel.kolom.map(escapeCsvCell).join(","));

        // Data rows
        report.tabel.baris.forEach(row => {
            lines.push(row.map(escapeCsvCell).join(","));
        });

        // Prepend UTF-8 BOM (\uFEFF) for seamless Microsoft Excel compatibility
        const csvContent = "\uFEFF" + lines.join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const cleanCode = (report.kode || "RPT").replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `BPTD_JABAR_${cleanCode}_${todayStr}.csv`;

        downloadBlob(blob, filename);
    }

    /* =====================================================================
       14. UNIVERSAL JSON EXPORT ENGINE
       ===================================================================== */
    function exportReportJSON(reportId) {
        const report = allReports.find(r => r.id === reportId);
        if (!report) {
            alert("Data laporan tidak ditemukan untuk diekspor.");
            return;
        }

        const periodLabel = getPeriodLabel(activeFilterPeriod, activeFilterYear);
        const todayStr = new Date().toISOString();

        const exportPayload = {
            instansi: LAPORAN_EMBEDDED_DATA.instansi,
            kementerian: LAPORAN_EMBEDDED_DATA.kementerian,
            direktorat: LAPORAN_EMBEDDED_DATA.direktorat,
            alamat: LAPORAN_EMBEDDED_DATA.alamat,
            waktu_penerbitan: todayStr,
            periode_pelaporan: periodLabel,
            tahun_anggaran: activeFilterYear,
            laporan: {
                id: report.id,
                kode: report.kode,
                nomor_dokumen: report.nomor_dokumen,
                judul: report.judul,
                kategori: report.kategori,
                unit_kerja: report.unit_kerja,
                frekuensi: report.frekuensi,
                ringkasan: report.ringkasan,
                telaah_eksekutif: report.telaah_eksekutif,
                sorotan_metrik: report.sorotan_metrik,
                tabel_data: {
                    kolom: report.tabel.kolom,
                    total_baris: report.tabel.baris.length,
                    baris: report.tabel.baris
                }
            },
            pengesahan: metadataPejabat
        };

        const jsonStr = JSON.stringify(exportPayload, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
        const cleanCode = (report.kode || "RPT").replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `BPTD_JABAR_${cleanCode}_${new Date().toISOString().slice(0, 10)}.json`;

        downloadBlob(blob, filename);
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /* =====================================================================
       15. FORMAL DOCUMENT PRINT ENGINE (@media print)
       ===================================================================== */
    function printReport(reportId) {
        const report = allReports.find(r => r.id === reportId);
        if (!report || !printableReportSheet) {
            alert("Laporan tidak siap untuk dicetak.");
            return;
        }

        const periodLabel = getPeriodLabel(activeFilterPeriod, activeFilterYear);
        const todayStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

        // Metric chips for print
        const metricsHtml = Array.isArray(report.sorotan_metrik) ? report.sorotan_metrik.map(m => `
            <div class="print-metric-chip">
                <span class="print-metric-chip-label">${escapeHtml(m.label)}</span>
                <span class="print-metric-chip-val">${escapeHtml(m.value)}</span>
            </div>
        `).join("") : "";

        // Print table
        const tableHtml = buildTableMarkup(report.tabel, true);

        // Populate printable container
        printableReportSheet.innerHTML = `
            <div class="print-kop">
                <p class="print-kop-kemenhub">KEMENTERIAN PERHUBUNGAN</p>
                <p class="print-kop-hubdat">DIREKTORAT JENDERAL PERHUBUNGAN DARAT</p>
                <p class="print-kop-bptd">BALAI PENGELOLA TRANSPORTASI DARAT KELAS I JAWA BARAT</p>
                <p class="print-kop-address">
                    Jl. Raya Cibeureum No. 1, Kota Cimahi, Jawa Barat 40535 | Telp: (022) 6011400 | Email: bptd.jabar@dephub.go.id
                </p>
                <div class="print-kop-divider"></div>
            </div>

            <div class="print-title-block">
                <h2 class="print-title">${escapeHtml(report.judul)}</h2>
                <p class="print-meta-sub">Nomor: ${escapeHtml(report.nomor_dokumen || '-')}</p>
                <p class="print-meta-sub">Periode: <strong>${escapeHtml(periodLabel)}</strong></p>
                <p class="print-meta-sub">Unit Pengampu: ${escapeHtml(report.unit_kerja)}</p>
            </div>

            <div class="print-section">
                <h3 class="print-section-title">I. Ringkasan Eksekutif &amp; Telaah Pimpinan</h3>
                <p class="print-summary-box">${escapeHtml(report.telaah_eksekutif || report.ringkasan)}</p>
            </div>

            <div class="print-section">
                <h3 class="print-section-title">II. Sorotan Indikator &amp; Metrik Kinerja Utama</h3>
                <div class="print-metrics-grid">
                    ${metricsHtml}
                </div>
            </div>

            <div class="print-section">
                <h3 class="print-section-title">III. Data Tabular Rincian Operasional</h3>
                ${tableHtml}
            </div>

            <div class="print-signature-section">
                <div class="print-signature-box">
                    <p class="print-sig-date">${metadataPejabat.tempat_pengesahan || 'Bandung'}, ${todayStr}</p>
                    <p class="print-sig-title">${metadataPejabat.pengesah_jabatan || 'Kepala Balai Pengelola Transportasi Darat Kelas I Jawa Barat'}</p>
                    <div class="print-sig-space" aria-hidden="true"></div>
                    <p class="print-sig-name">${metadataPejabat.pengesah_nama || 'Dr. Ferdy Trisanto Kurniawan, S.T., M.Si'}</p>
                    <p class="print-sig-nip">${metadataPejabat.pengesah_nip || 'NIP. 19780201 200312 1 002'}</p>
                </div>
            </div>

            <p class="print-footer-notice">
                ${metadataPejabat.catatan_legalitas || 'Dokumen resmi diterbitkan melalui Command Center V2 GeoPORTAL BPTD Kelas I Jawa Barat.'}
            </p>
        `;

        // Temporary title for browser print dialog
        const prevTitle = document.title;
        document.title = `${report.kode}_${report.judul.replace(/\s+/g, '_')}`;

        // Trigger native print
        window.print();

        // Restore title
        document.title = prevTitle;
    }

    /* =====================================================================
       16. SANITIZATION UTILITY
       ===================================================================== */
    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Bootstrap when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
