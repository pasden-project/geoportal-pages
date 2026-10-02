/* =====================================================================
   GeoPORTAL BPTD Jabar — Modul Early Warning & Pemantauan Anomali (early-warning.js)
   Sistem Kewaspadaan Dini, Ambang Batas Metodologi, Dimensi Temporal & Pulsing Markers
   ===================================================================== */

/**
 * Embedded official dataset fallback (BPTD Kelas I Jawa Barat 2026)
 * 18 Insiden Anomali Aktif lintas 4 Domain Transportasi Darat Jawa Barat
 * dengan Dimensi Window Waktu Pemicu, Pola Temporal, dan Korelasi Dataset Proyek.
 */
var EARLY_WARNING_EMBEDDED_DATA = {
  "title": "Direktori & Analitik Early Warning Jawa Barat 2026",
  "instansi": "BPTD Kelas I Jawa Barat",
  "tahun": 2026,
  "last_updated": "2026-03-31T08:00:00+07:00",
  "summary": {
    "total_alerts": 18,
    "critical_count": 4,
    "warning_count": 8,
    "advisory_count": 6,
    "domains_monitored": 4,
    "domain_counts": {
      "terminal": 5,
      "uppkb": 4,
      "perintis": 5,
      "koridor": 4
    },
    "severity_levels": [
      {
        "id": "CRITICAL",
        "label": "Kritis",
        "count": 4,
        "color": "#ef4444",
        "badge_class": "badge-critical",
        "description": "Deviasi ekstrem yang membutuhkan tindakan korektif dan mitigasi lapangan segera oleh BPTD Jabar."
      },
      {
        "id": "WARNING",
        "label": "Peringatan Waspada",
        "count": 8,
        "color": "#f59e0b",
        "badge_class": "badge-warning",
        "description": "Deviasi menengah di luar batas toleransi wajar, memerlukan pengawasan intensif dan audit teknis."
      },
      {
        "id": "ADVISORY",
        "label": "Atensi Operasional",
        "count": 6,
        "color": "#3b82f6",
        "badge_class": "badge-advisory",
        "description": "Indikasi deviasi awal atau kondisi fluktuasi musiman yang perlu dicermati oleh tim pengawas."
      }
    ],
    "temporal_patterns": [
      { "id": "PEAK_HOURS", "label": "Jam Sibuk (Peak Hours)", "count": 3 },
      { "id": "NIGHT_SHIFT", "label": "Shift Malam & Dini Hari", "count": 4 },
      { "id": "WEEKEND_MARKET", "label": "Akhir Pekan & Hari Pasar", "count": 4 },
      { "id": "WEATHER_SEASONAL", "label": "Kondisional Cuaca & Musiman", "count": 4 },
      { "id": "OFFPEAK_CYCLE", "label": "Off-Peak & Siklus Pelaporan", "count": 3 }
    ]
  },
  "threshold_rules": [
    {
      "kode": "THR-01",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "indikator": "Lonjakan Volume Penumpang Ekstrem",
      "formula": "ΔV = ((V_aktual - V_baseline_30d) / V_baseline_30d) * 100%",
      "ambang_warning": "> +25%",
      "ambang_kritis": "> +40%",
      "dasar_regulasi": "PM Perhubungan No. 24/2021 & SOP Manajemen Antrean BPTD",
      "prosedur_mitigasi": "Aktivasi buffer area terminal, pengerahan bus cadangan PO AKAP/AKDP, koordinasi dengan Ditlantas Polda Jabar untuk rekayasa sirkulasi."
    },
    {
      "kode": "THR-02",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "indikator": "Penurunan Volume Penumpang Drastis",
      "formula": "ΔV = ((V_aktual - V_baseline_30d) / V_baseline_30d) * 100%",
      "ambang_warning": "< -35%",
      "ambang_kritis": "< -50%",
      "dasar_regulasi": "Standar Pelayanan Minimal Terminal Tipe A Dirjen Hubdat",
      "prosedur_mitigasi": "Investigasi peralihan modal liar / pool bayangan di luar terminal, inspeksi kesiapan armada PO, dan evaluasi feeder antarmoda."
    },
    {
      "kode": "THR-03",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "indikator": "Kesenjangan Pelaporan Data Operasional",
      "formula": "T_gap = Hari_terakhir_sinkronisasi - Hari_ini",
      "ambang_warning": "> 7 Hari",
      "ambang_kritis": "> 14 Hari",
      "dasar_regulasi": "Instruksi Dirjen Hubdat No. KP-DRJD 2024 tentang Satu Data Terminal",
      "prosedur_mitigasi": "Penerbitan surat teguran Korsatpel, audit koneksi jaringan SIMETRIS, pendampingan teknis input manifest elektronik."
    },
    {
      "kode": "THR-04",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "indikator": "Tingkat Pelanggaran Muatan Berat Harian",
      "formula": "R_overload = (N_overload / N_total_timbang) * 100%",
      "ambang_warning": "> 15%",
      "ambang_kritis": "> 25%",
      "dasar_regulasi": "UU No. 22/2009 Pasal 169 & SE Dirjen Hubdat Pengawasan Muatan Lebih",
      "prosedur_mitigasi": "Penindakan tilang transfer muatan, penundaan perjalanan armada pelanggar berat, koordinasi operasi gabungan bersama Polisi & POM TNI."
    },
    {
      "kode": "THR-05",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "indikator": "Kasus Pelanggaran Tonase Ekstrem",
      "formula": "ΔTonase = ((Berat_Aktual - JBI) / JBI) * 100%",
      "ambang_warning": "> 25% di atas JBI",
      "ambang_kritis": "> 50% di atas JBI",
      "dasar_regulasi": "Peraturan Pemerintah No. 55/2012 tentang Kendaraan & Pedoman Zero ODOL",
      "prosedur_mitigasi": "Penahanan surat kendaraan, kewajiban pemotongan muatan di lapangan, dan pemanggilan pemilik komoditas/ekspedisi logistik."
    },
    {
      "kode": "THR-06",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "indikator": "Penurunan Kepatuhan Tonase Koridor Logistik",
      "formula": "T_kepatuhan = (N_patuh / N_periksa) * 100%",
      "ambang_warning": "< 80%",
      "ambang_kritis": "< 65%",
      "dasar_regulasi": "Target Kinerja Keselamatan Koridor Logistik Nasional BPTD Jabar",
      "prosedur_mitigasi": "Peningkatan intensitas razia mobile koridor alternatif / jalur tikus, evaluasi sensor Weigh-in-Motion (WIM)."
    },
    {
      "kode": "THR-07",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "indikator": "Load Factor di Bawah Ambang Subsidi",
      "formula": "LF_bulan = (Rerata Penumpang_Riil / Kapasitas_Tersedia) * 100%",
      "ambang_warning": "< 20%",
      "ambang_kritis": "< 10%",
      "dasar_regulasi": "Pedoman Penyelenggaraan Kewajiban Pelayanan Publik (PSO) Perhubungan Darat",
      "prosedur_mitigasi": "Sosialisasi rute di tingkat kecamatan/desa, penyesuaian jadwal keberangkatan sesuai jam pasar/sekolah, evaluasi rasionalisasi rute."
    },
    {
      "kode": "THR-08",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "indikator": "Kelebihan Kapasitas Penumpang / Overcapacity",
      "formula": "LF_hari = (Penumpang_Harian / Kapasitas_Kursi) * 100%",
      "ambang_warning": "> 80%",
      "ambang_kritis": "> 95%",
      "dasar_regulasi": "Standar Kenyamanan & Keselamatan Angkutan Penumpang Jalan Perintis",
      "prosedur_mitigasi": "Usulan penambahan frekuensi ritase harian atau pengalihan armada cadangan DAMRI ke koridor terdampak."
    },
    {
      "kode": "THR-09",
      "domain": "koridor",
      "domain_label": "Keselamatan Koridor",
      "indikator": "Titik Rawan Hambatan & Bencana Koridor Logistik",
      "formula": "Skor_Kerentanan = f(Kemiringan, Curah_Hujan, Indeks_Mogok_Truk)",
      "ambang_warning": "Level Siaga (Musim Penghujan / Volume Tinggi)",
      "ambang_kritis": "Level Darurat (Hambatan Total / Ambles)",
      "dasar_regulasi": "Keputusan Bersama Ditjen Hubdat & Korlantas Polri Manajemen Koridor Rawan",
      "prosedur_mitigasi": "Penyediaan mobil derek heavy-duty BPTD, koordinasi Balai Besar Pelaksanaan Jalan Nasional (BBPJN), rambu peringatan dini mobile."
    },
    {
      "kode": "THR-10",
      "domain": "koridor",
      "domain_label": "Akses Simpul Strategis",
      "indikator": "Hambatan Akses Simpul & Anomali Cuaca Ekstrem",
      "formula": "Indeks_Aksesibilitas = f(Kecepatan_Rata2, Crosswind_Speed, Visibilitas)",
      "ambang_warning": "Kecepatan < 20 km/jam atau Crosswind > 45 km/jam",
      "ambang_kritis": "Akses terputus / Visibilitas < 50 m",
      "dasar_regulasi": "SOP Mitigasi Aksesibilitas Simpul Strategis Nasional BPTD Jabar",
      "prosedur_mitigasi": "Koordinasi pengalihan arus kendaraan angkutan barang/penumpang, penerbitan bulletin kewaspadaan pengemudi."
    }
  ],
  "alerts": [
    {
      "id": "ALR-TRM-01",
      "kode_rule": "THR-01",
      "judul": "Lonjakan Volume Penumpang Ekstrem Terminal Leuwipanjang",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "fasilitas": "Terminal Tipe A Leuwipanjang",
      "wilayah": "Kota Bandung",
      "lat": -6.9472,
      "lng": 107.5936,
      "severity": "CRITICAL",
      "parameter": "Volume Penumpang Harian",
      "nilai_aktual": "18.450 pnp/hari (+48.2% vs baseline)",
      "ambang_batas": "> +40% dari rata-rata 30 hari (12.450 pnp)",
      "deviasi": "+8.2% di atas ambang kritis",
      "waktu_pemicu": "Periode Peak Akhir Pekan (Jumat 16:30 - 21:00 WIB & Minggu 15:00 - 20:30 WIB)",
      "pola_temporal": "WEEKEND_MARKET",
      "pola_temporal_label": "Akhir Pekan & Hari Libur",
      "korelasi_dataset": "connectivity-jabar.json (NODE-01) & od-matrix-terminal-a.json (Origin Leuwipanjang 328.348 pnp)",
      "waktu_deteksi": "2026-03-30T17:30:00+07:00",
      "status_tindakan": "Sedang Ditangani",
      "dampak_operasional": "Kepadatan ruang tunggu zona keberangkatan bus AKAP lintas barat, antrean bus masuk ke bay keberangkatan mencapai 15 menit.",
      "rekomendasi_mitigasi": "Aktivasi holding bay cadangan sisi selatan, percepat jadwal clearance boarding bus dari 15 ke 8 menit, koordinasi PO untuk mengeluarkan bus bantuan.",
      "pic_unit": "Korsatpel Terminal Leuwipanjang"
    },
    {
      "id": "ALR-TRM-02",
      "kode_rule": "THR-01",
      "judul": "Lonjakan Penumpang Commuter Terminal Cikarang",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "fasilitas": "Terminal Tipe B Cikarang",
      "wilayah": "Kabupaten Bekasi",
      "lat": -6.2573,
      "lng": 107.1528,
      "severity": "CRITICAL",
      "parameter": "Volume Penumpang Angkutan Lintas",
      "nilai_aktual": "14.890 pnp/hari (+42.1% deviasi)",
      "ambang_batas": "> +40% dari baseline (10.480 pnp)",
      "deviasi": "+2.1% di atas batas kritis",
      "waktu_pemicu": "Jam Sibuk Komuter Pagi Hari Kerja (06:00 - 08:30 WIB)",
      "pola_temporal": "PEAK_HOURS",
      "pola_temporal_label": "Jam Sibuk (Peak Hours)",
      "korelasi_dataset": "connectivity-jabar.json (NODE-13), CORR-05 (Cikarang Hub), & od-matrix (Origin Cikarang 114.530 pnp)",
      "waktu_deteksi": "2026-03-31T06:45:00+07:00",
      "status_tindakan": "Sedang Ditangani",
      "dampak_operasional": "Penumpukan komuter pekerja pabrik pada jam sibuk pagi, kemacetan pergerakan di akses bundaran depan terminal.",
      "rekomendasi_mitigasi": "Penambahan personel pemandu arus lalu lintas di gerbang barat dan koordinasi percepatan sirkulasi angkutan penyambung KRL.",
      "pic_unit": "Dishub Prov Jabar & Pengawas BPTD"
    },
    {
      "id": "ALR-TRM-03",
      "kode_rule": "THR-03",
      "judul": "Kesenjangan Pelaporan Data Operasional Terminal Guntur",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "fasilitas": "Terminal Tipe A Guntur Melati",
      "wilayah": "Kabupaten Garut",
      "lat": -7.1994,
      "lng": 107.8927,
      "severity": "WARNING",
      "parameter": "Sinkronisasi Manifest Digital",
      "nilai_aktual": "Gap transmisi 11 hari berturut-turut",
      "ambang_batas": "> 7 hari tanpa transmisi digital",
      "deviasi": "+4 hari melampaui batas toleransi",
      "waktu_pemicu": "Siklus Rekapitulasi Mingguan (Setiap Hari Senin 08:00 WIB)",
      "pola_temporal": "OFFPEAK_CYCLE",
      "pola_temporal_label": "Off-Peak & Siklus Pelaporan",
      "korelasi_dataset": "connectivity-jabar.json (NODE-03) & od-analisis.json (Rute Garut - Jkt/Bekasi 268.000+ pnp)",
      "waktu_deteksi": "2026-03-29T10:15:00+07:00",
      "status_tindakan": "Instruksi Diterbitkan",
      "dampak_operasional": "Data keberangkatan dan kedatangan penumpang Garut-Jakarta/Bandung tidak tercatat di dashboard monitoring terpusat BPTD.",
      "rekomendasi_mitigasi": "Kirim tim teknis IT BPTD Kelas I Jabar untuk perbaikan modem gateway dan restart server lokal SIMETRIS di lokasi.",
      "pic_unit": "Seksi Sarana & Prasarana Transportasi Jalan"
    },
    {
      "id": "ALR-TRM-04",
      "kode_rule": "THR-02",
      "judul": "Penurunan Volume Penumpang Drastis Terminal Banjar",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "fasilitas": "Terminal Tipe A Banjar",
      "wilayah": "Kota Banjar",
      "lat": -7.3712,
      "lng": 108.5361,
      "severity": "WARNING",
      "parameter": "Volume Penumpang AKAP/AKDP",
      "nilai_aktual": "1.210 pnp/hari (-38.5% deviasi)",
      "ambang_batas": "< -35% dari rerata normal (1.970 pnp)",
      "deviasi": "-3.5% di bawah batas toleransi wajar",
      "waktu_pemicu": "Hari Kerja Off-Peak (Selasa s.d. Kamis, 09:00 - 15:00 WIB)",
      "pola_temporal": "OFFPEAK_CYCLE",
      "pola_temporal_label": "Off-Peak & Siklus Pelaporan",
      "korelasi_dataset": "connectivity-jabar.json (NODE-09) & CORR-13 (Banjar Intermodal Cross-Border)",
      "waktu_deteksi": "2026-03-28T14:40:00+07:00",
      "status_tindakan": "Verifikasi Lapangan",
      "dampak_operasional": "Penurunan keterisian bus trayek Banjar - Pangandaran dan Banjar - Jakarta, indikasi naiknya penumpang dari titik jemput liar.",
      "rekomendasi_mitigasi": "Gelar operasi gabungan penertiban pool bayangan di sepanjang jalan arteri Brigjen M. Isa dan optimalkan feeder perkotaan.",
      "pic_unit": "Korsatpel Terminal Banjar"
    },
    {
      "id": "ALR-TRM-05",
      "kode_rule": "THR-02",
      "judul": "Penurunan Kinerja Operasional Terminal Sukabumi",
      "domain": "terminal",
      "domain_label": "Terminal Penumpang",
      "fasilitas": "Terminal Tipe A KH Ahmad Sanusi",
      "wilayah": "Kota Sukabumi",
      "lat": -6.9387,
      "lng": 106.9189,
      "severity": "WARNING",
      "parameter": "Keterisian Bus AKAP Lintas Selatan",
      "nilai_aktual": "1.740 pnp/hari (-36.2% deviasi)",
      "ambang_batas": "< -35% dari rerata normal (2.730 pnp)",
      "deviasi": "-1.2% di bawah batas normal",
      "waktu_pemicu": "Hari Kerja Shift Siang (10:00 - 14:00 WIB, Penumpang Beralih Travel Bocimi)",
      "pola_temporal": "PEAK_HOURS",
      "pola_temporal_label": "Jam Sibuk (Peak Hours)",
      "korelasi_dataset": "connectivity-jabar.json (NODE-05), CORR-12, & od-analisis (Koridor Sukabumi - Bandung 452.046 pnp)",
      "waktu_deteksi": "2026-03-27T16:20:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Peralihan sebagian calon penumpang bus ke layanan travel door-to-door tak berizin jalur Bocimi.",
      "rekomendasi_mitigasi": "Pengetatan pemeriksaan kartu pengawasan angkutan antar-jemput dan sosialisasi tarif resmi bus AKAP eksekutif.",
      "pic_unit": "Korsatpel Terminal Sukabumi"
    },
    {
      "id": "ALR-PKB-01",
      "kode_rule": "THR-04",
      "judul": "Tingkat Pelanggaran Muatan Berat UPPKB Balonggandu",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "fasilitas": "UPPKB Balonggandu (JT001)",
      "wilayah": "Kabupaten Karawang",
      "lat": -6.37733,
      "lng": 107.51488,
      "severity": "CRITICAL",
      "parameter": "Rasio Truk Pelanggar Muatan",
      "nilai_aktual": "31.4% kendaraan diperiksa melebihi batas",
      "ambang_batas": "> 25% dari total truk tertimbang per shift",
      "deviasi": "+6.4% melampaui toleransi kritis",
      "waktu_pemicu": "Shift Operasional Malam s.d. Dini Hari (22:00 - 04:30 WIB)",
      "pola_temporal": "NIGHT_SHIFT",
      "pola_temporal_label": "Shift Malam & Dini Hari",
      "korelasi_dataset": "uppkb-jabar-2025.json (JT001: 39.623 diperiksa, 5.900 pelanggaran, 85.1% kepatuhan)",
      "waktu_deteksi": "2026-03-31T02:15:00+07:00",
      "status_tindakan": "Sedang Ditangani",
      "dampak_operasional": "Risiko percepatan kerusakan perkerasan jalan arteri Pantura Karawang-Subang dan antrean truk penimbangan mengular 300 meter.",
      "rekomendasi_mitigasi": "Wajib transfer muatan untuk kelebihan di atas 20%, penahanan kartu uji berkala, dan eskalasi ke Subdit Gakkum Hubdat.",
      "pic_unit": "Korsatpel UPPKB Balonggandu"
    },
    {
      "id": "ALR-PKB-02",
      "kode_rule": "THR-05",
      "judul": "Pelanggaran Tonase Ekstrem Muatan Semen UPPKB Losarang",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "fasilitas": "UPPKB Losarang (JT002)",
      "wilayah": "Kabupaten Indramayu",
      "lat": -6.38535,
      "lng": 108.14003,
      "severity": "CRITICAL",
      "parameter": "Kelebihan Tonase di Atas JBI",
      "nilai_aktual": "+58.7% di atas JBI (38.5 ton vs JBI 24 ton)",
      "ambang_batas": "> 50% di atas JBI (Kategori Ekstrem)",
      "deviasi": "+8.7% di atas ambang batas ekstrem",
      "waktu_pemicu": "Dini Hari Puncak Konvoi Logistik Berat (01:00 - 05:00 WIB)",
      "pola_temporal": "NIGHT_SHIFT",
      "pola_temporal_label": "Shift Malam & Dini Hari",
      "korelasi_dataset": "uppkb-jabar-2025.json (JT002: 39.194 diperiksa, 5.470 pelanggaran, 86.0% kepatuhan)",
      "waktu_deteksi": "2026-03-30T22:30:00+07:00",
      "status_tindakan": "Sedang Ditangani",
      "dampak_operasional": "Ancaman keselamatan fatal patah as kendaraan dan keretakan jembatan timbang Losarang.",
      "rekomendasi_mitigasi": "Armada dilarang melanjutkan perjalanan sebelum menurunkan muatan semen di gudang transit berizin terdekat, denda tilang tilang maksimal.",
      "pic_unit": "Korsatpel UPPKB Losarang"
    },
    {
      "id": "ALR-PKB-03",
      "kode_rule": "THR-06",
      "judul": "Penurunan Kepatuhan Tonase Koridor Jalur Tengah UPPKB Tomo",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "fasilitas": "UPPKB Tomo (JT005)",
      "wilayah": "Kabupaten Sumedang",
      "lat": -6.76096,
      "lng": 108.14228,
      "severity": "WARNING",
      "parameter": "Tingkat Kepatuhan Muatan Koridor",
      "nilai_aktual": "76.8% tingkat kepatuhan harian",
      "ambang_batas": "< 80% kepatuhan minimum koridor",
      "deviasi": "-3.2% di bawah ambang kepatuhan",
      "waktu_pemicu": "Sore Hari Menjelang Malam (17:00 - 21:00 WIB, Truk Tambang Galian C)",
      "pola_temporal": "NIGHT_SHIFT",
      "pola_temporal_label": "Shift Malam & Dini Hari",
      "korelasi_dataset": "uppkb-jabar-2025.json (JT005: 29.783 diperiksa, 798 pelanggaran, 97.3% kepatuhan)",
      "waktu_deteksi": "2026-03-29T19:00:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Meningkatnya truk pengangkut pasir dan hasil galian C yang menghindari pemeriksaan jembatan timbang pada jam malam.",
      "rekomendasi_mitigasi": "Pengaktifan patroli mobile terpadu di simpang Cijelag dan penguatan penindakan gakkum malam hari.",
      "pic_unit": "Korsatpel UPPKB Tomo"
    },
    {
      "id": "ALR-PKB-04",
      "kode_rule": "THR-06",
      "judul": "Deviasi Kepatuhan Angkutan Industri UPPKB Cibaragalan",
      "domain": "uppkb",
      "domain_label": "UPPKB & Logistik",
      "fasilitas": "UPPKB Cibaragalan (JT004)",
      "wilayah": "Kabupaten Purwakarta",
      "lat": -6.50387,
      "lng": 107.46548,
      "severity": "WARNING",
      "parameter": "Kepatuhan Dimensi & Tonase",
      "nilai_aktual": "79.1% kepatuhan muatan industri",
      "ambang_batas": "< 80% kepatuhan minimum",
      "deviasi": "-0.9% di bawah ambang toleransi",
      "waktu_pemicu": "Shift Malam Distribusi Industri (20:00 - 02:00 WIB)",
      "pola_temporal": "NIGHT_SHIFT",
      "pola_temporal_label": "Shift Malam & Dini Hari",
      "korelasi_dataset": "uppkb-jabar-2025.json (JT004: 27.200 diperiksa, 620 pelanggaran, koridor Sadang-Purwakarta)",
      "waktu_deteksi": "2026-03-28T21:10:00+07:00",
      "status_tindakan": "Instruksi Diterbitkan",
      "dampak_operasional": "Kerusakan bahu jalan dan peningkatan debu material industri di sepanjang rute arteri Sadang-Purwakarta.",
      "rekomendasi_mitigasi": "Surat peringatan kepada pengusaha angkutan barang industri Sadang dan penertiban bak modifikasi overdimension.",
      "pic_unit": "Korsatpel UPPKB Cibaragalan"
    },
    {
      "id": "ALR-PRN-01",
      "kode_rule": "THR-07",
      "judul": "Load Factor Rendah Rute Tegal Buleud - Sagaranten",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "fasilitas": "Trayek PERINTIS-003 (Tegal Buleud - Sagaranten)",
      "wilayah": "Kabupaten Sukabumi",
      "lat": -7.4250,
      "lng": 106.8200,
      "severity": "WARNING",
      "parameter": "Load Factor Bulanan Berjalan",
      "nilai_aktual": "14.8% rata-rata keterisian kursi",
      "ambang_batas": "< 20% ambang kelayakan subsidi PSO",
      "deviasi": "-5.2% di bawah batas subsidi wajar",
      "waktu_pemicu": "Musim Penghujan / Siang Menjelang Sore (13:00 - 17:00 WIB)",
      "pola_temporal": "WEATHER_SEASONAL",
      "pola_temporal_label": "Kondisional Cuaca & Musiman",
      "korelasi_dataset": "perintis-jabar-2025.json (PERINTIS-003: DAMRI Bandung, 19 seat, avg LF 28.9%, 1.250 trip)",
      "waktu_deteksi": "2026-03-29T11:00:00+07:00",
      "status_tindakan": "Verifikasi Lapangan",
      "dampak_operasional": "Inefisiensi serapan dana subsidi operasional perintis BPTD tahun anggaran 2026 saat cuaca hujan lebat.",
      "rekomendasi_mitigasi": "Survei ulang jam keberangkatan dari desa-desa sepanjang jalur Tegal Buleud, integrasikan dengan jam layanan puskesmas dan sekolah.",
      "pic_unit": "Seksi Angkutan Jalan BPTD Jabar & DAMRI"
    },
    {
      "id": "ALR-PRN-02",
      "kode_rule": "THR-07",
      "judul": "Penurunan Okupansi Perintis Surade - Sagaranten Hari Biasa",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "fasilitas": "Trayek PERINTIS-001 (Surade - Sagaranten)",
      "wilayah": "Kabupaten Sukabumi",
      "lat": -7.2800,
      "lng": 106.7200,
      "severity": "WARNING",
      "parameter": "Load Factor Hari Non-Pasar",
      "nilai_aktual": "17.2% keterisian penumpang",
      "ambang_batas": "< 20% ambang kelayakan subsidi",
      "deviasi": "-2.8% di bawah ambang kelayakan",
      "waktu_pemicu": "Hari Kerja Biasa di Luar Hari Pasar (Senin, Selasa, Kamis 10:00 - 14:00 WIB)",
      "pola_temporal": "OFFPEAK_CYCLE",
      "pola_temporal_label": "Off-Peak & Siklus Pelaporan",
      "korelasi_dataset": "perintis-jabar-2025.json (PERINTIS-001: DAMRI Bandung, 19 seat, avg LF 35.6%, 5.251 pnp YTD)",
      "waktu_deteksi": "2026-03-28T09:30:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Rute berjalan dengan okupansi rendah pada ritase siang saat hari non-pasar tradisional.",
      "rekomendasi_mitigasi": "Sosialisasi tarif bersubsidi melalui pemerintah kecamatan setempat dan penyesuaian interval jadwal ritase non-pasar.",
      "pic_unit": "Seksi Angkutan Jalan BPTD Jabar & DAMRI"
    },
    {
      "id": "ALR-PRN-03",
      "kode_rule": "THR-08",
      "judul": "Kelebihan Kapasitas Perintis Surade - Sagaranten Hari Pasar",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "fasilitas": "Trayek PERINTIS-001 (Surade - Sagaranten)",
      "wilayah": "Kabupaten Sukabumi",
      "lat": -7.34428,
      "lng": 106.55666,
      "severity": "ADVISORY",
      "parameter": "Load Factor Hari Pasar Tradisional",
      "nilai_aktual": "89.4% keterisian penumpang (17/19 seat terisi)",
      "ambang_batas": "> 80% (Kondisi Kapasitas Tinggi)",
      "deviasi": "+9.4% melampaui kondisi normal",
      "waktu_pemicu": "Hari Pasar Tradisional Surade & Sagaranten (Rabu & Sabtu Pagi, 06:00 - 10:00 WIB)",
      "pola_temporal": "WEEKEND_MARKET",
      "pola_temporal_label": "Akhir Pekan & Hari Pasar",
      "korelasi_dataset": "perintis-jabar-2025.json (PERINTIS-001: Armada DAMRI 2 unit aktif + 1 cadangan)",
      "waktu_deteksi": "2026-03-29T15:45:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Sebagian calon penumpang di halte perantara tidak terangkut akibat bus telah terisi penuh bersama muatan hasil bumi.",
      "rekomendasi_mitigasi": "Pengerahan 1 unit bus cadangan DAMRI khusus pada pagi hari pasar Rabu dan Sabtu.",
      "pic_unit": "Seksi Angkutan Jalan BPTD Jabar & DAMRI"
    },
    {
      "id": "ALR-PRN-04",
      "kode_rule": "THR-08",
      "judul": "Lonjakan Okupansi Wisatawan Perintis Leuwiliang - Cikidang",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "fasilitas": "Trayek PERINTIS-004 (Leuwiliang - Cikidang)",
      "wilayah": "Kabupaten Bogor & Sukabumi",
      "lat": -6.7200,
      "lng": 106.6000,
      "severity": "ADVISORY",
      "parameter": "Tingkat Keterisian Wisatawan Libur",
      "nilai_aktual": "86.5% load factor akhir pekan",
      "ambang_batas": "> 80% ambang atensi muatan",
      "deviasi": "+6.5% di atas pola rata-rata",
      "waktu_pemicu": "Akhir Pekan & Hari Libur Nasional (Sabtu - Minggu, 07:30 - 16:00 WIB)",
      "pola_temporal": "WEEKEND_MARKET",
      "pola_temporal_label": "Akhir Pekan & Hari Pasar",
      "korelasi_dataset": "perintis-jabar-2025.json (PERINTIS-004: avg LF 27.1%, Paguyuban Wisatawan Cikidang)",
      "waktu_deteksi": "2026-03-30T13:10:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Beban kerja transmisi dan sistem rem bus meningkat pada kontur turunan/tanjakan terjal Cikidang.",
      "rekomendasi_mitigasi": "Ramp check berkala rem, suspensi, dan ban armada perintis sebelum penugasan akhir pekan.",
      "pic_unit": "Seksi Sarana & Prasarana Transportasi Jalan"
    },
    {
      "id": "ALR-PRN-05",
      "kode_rule": "THR-08",
      "judul": "Fluktuasi Keterisian Jam Shift Sadang - Wanakerta",
      "domain": "perintis",
      "domain_label": "Angkutan Perintis",
      "fasilitas": "Trayek PERINTIS-006 (Sadang - Wanakerta)",
      "wilayah": "Kabupaten Purwakarta",
      "lat": -6.4900,
      "lng": 107.4500,
      "severity": "ADVISORY",
      "parameter": "Load Factor Jam Masuk/Pulang Pabrik",
      "nilai_aktual": "84.1% keterisian pada jam pergantian shift",
      "ambang_batas": "> 80% ambang atensi kapasitas",
      "deviasi": "+4.1% melampaui kondisi harian",
      "waktu_pemicu": "Jam Pergantian Shift Pabrik Kawasan BIC (06:30 - 07:30 & 15:30 - 16:30 WIB)",
      "pola_temporal": "PEAK_HOURS",
      "pola_temporal_label": "Jam Sibuk (Peak Hours)",
      "korelasi_dataset": "perintis-jabar-2025.json (PERINTIS-006: rute industri Purwakarta, 30.0% LF normal)",
      "waktu_deteksi": "2026-03-31T07:15:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Kepadatan ruang kabin bus perintis saat jam masuk dan pulang kerja karyawan industri.",
      "rekomendasi_mitigasi": "Sinkronisasi waktu keberangkatan dari Sadang tepat 25 menit sebelum bel masuk shift pabrik.",
      "pic_unit": "Seksi Angkutan Jalan BPTD Jabar & DAMRI"
    },
    {
      "id": "ALR-KOR-01",
      "kode_rule": "THR-09",
      "judul": "Peringatan Kerawanan Antrean & Cuaca Tanjakan Gentong",
      "domain": "koridor",
      "domain_label": "Keselamatan Koridor",
      "fasilitas": "Ruas Arteri Tanjakan Gentong (JT003 Tasikmalaya)",
      "wilayah": "Kabupaten Tasikmalaya",
      "lat": -7.11956,
      "lng": 108.13575,
      "severity": "WARNING",
      "parameter": "Indeks Kerawanan Hambatan Tanjakan",
      "nilai_aktual": "Level Siaga (3 insiden truk mogok dalam 48 jam)",
      "ambang_batas": "Level Siaga (Hujan intensitas tinggi + antrean > 2 km)",
      "deviasi": "Status Siaga Operasional Ditetapkan",
      "waktu_pemicu": "Sore s.d. Malam Hari saat Curah Hujan Tinggi (16:00 - 22:00 WIB)",
      "pola_temporal": "WEATHER_SEASONAL",
      "pola_temporal_label": "Kondisional Cuaca & Musiman",
      "korelasi_dataset": "connectivity-jabar.json (NODE-25 UPPKB Gentong) & uppkb-jabar-2025.json (JT003: 34.092 truk)",
      "waktu_deteksi": "2026-03-30T18:20:00+07:00",
      "status_tindakan": "Sedang Ditangani",
      "dampak_operasional": "Perlambatan laju rata-rata bus AKAP rute Bandung-Tasik-Pangandaran menjadi 12 km/jam.",
      "rekomendasi_mitigasi": "Siagakan unit mobil derek BPTD di Posko Gentong dan berkoordinasi dengan Satlantas Polres Tasikmalaya untuk buka-tutup jalur.",
      "pic_unit": "Seksi Lalu Lintas Jalan BPTD & Satlantas"
    },
    {
      "id": "ALR-KOR-02",
      "kode_rule": "THR-09",
      "judul": "Pemantauan Daya Dukung Beban Jalur Cadas Pangeran",
      "domain": "koridor",
      "domain_label": "Keselamatan Koridor",
      "fasilitas": "Ruas Arteri Cadas Pangeran (Bandung - Sumedang)",
      "wilayah": "Kabupaten Sumedang",
      "lat": -6.8647,
      "lng": 107.8931,
      "severity": "ADVISORY",
      "parameter": "Kestabilan Lereng & Beban Gandar",
      "nilai_aktual": "Level Waspada Musim Hujan",
      "ambang_batas": "Ambang Waspada Geoteknik",
      "deviasi": "Monitoring Berkala Sensor Retakan",
      "waktu_pemicu": "Musim Penghujan / Malam Hari (18:00 - 06:00 WIB)",
      "pola_temporal": "WEATHER_SEASONAL",
      "pola_temporal_label": "Kondisional Cuaca & Musiman",
      "korelasi_dataset": "connectivity-jabar.json (NODE-04 Ciakar & CORR-06 Sumedang-Cisumdawu Link)",
      "waktu_deteksi": "2026-03-29T08:00:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Pembatasan melintas bagi kendaraan barang berat sumbu 3 ke atas untuk dialihkan ke Jalan Tol Cisumdawu.",
      "rekomendasi_mitigasi": "Pemasangan rambu pengalihan tonase di Simpang Pamulihan dan koordinasi intensif bersama BPBD Sumedang.",
      "pic_unit": "Seksi Lalu Lintas Jalan BPTD & BPBD Sumedang"
    },
    {
      "id": "ALR-KOR-03",
      "kode_rule": "THR-10",
      "judul": "Peningkatan Arus Truk Kontainer Koridor Patimban",
      "domain": "koridor",
      "domain_label": "Akses Simpul Strategis",
      "fasilitas": "Akses Koridor Pelabuhan Patimban (Ruas Pusakanagara)",
      "wilayah": "Kabupaten Subang",
      "lat": -6.2415,
      "lng": 107.9023,
      "severity": "ADVISORY",
      "parameter": "Volume Kendaraan Angkutan Peti Kemas",
      "nilai_aktual": "+28.4% peningkatan arus truk ekspor-impor",
      "ambang_batas": "> +20% deviasi volume harian",
      "deviasi": "+8.4% di atas proyeksi harian",
      "waktu_pemicu": "Jadwal Pengapalan Kargo Ekspor (Selasa & Jumat Malam, 20:00 - 04:00 WIB)",
      "pola_temporal": "WEEKEND_MARKET",
      "pola_temporal_label": "Akhir Pekan & Hari Pasar",
      "korelasi_dataset": "connectivity-jabar.json (NODE-46 Pelabuhan Patimban & CORR-07 Patimban Logistics Link)",
      "waktu_deteksi": "2026-03-31T05:30:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Potensi perlambatan arus di persimpangan arteri Pantura akses Pelabuhan Patimban.",
      "rekomendasi_mitigasi": "Optimasi siklus lampu pengatur lalu lintas (APILL) simpang akses dan penertiban parkir liar truk di bahu jalan.",
      "pic_unit": "Korsatpel Pelabuhan Patimban & BPTD"
    },
    {
      "id": "ALR-KOR-04",
      "kode_rule": "THR-10",
      "judul": "Pemantauan Angin Silang Akses Simpul Bandara Kertajati",
      "domain": "koridor",
      "domain_label": "Akses Simpul Strategis",
      "fasilitas": "Akses Tol Cisumdawu Menuju BIJB Kertajati",
      "wilayah": "Kabupaten Majalengka",
      "lat": -6.6578,
      "lng": 108.1964,
      "severity": "ADVISORY",
      "parameter": "Kecepatan Angin Silang (Crosswind)",
      "nilai_aktual": "Kecepatan hembusan 47 km/jam",
      "ambang_batas": "> 45 km/jam ambang kewaspadaan kendaraan tinggi",
      "deviasi": "+2 km/jam di atas ambang atensi",
      "waktu_pemicu": "Dini Hari s.d. Subuh (02:00 - 06:30 WIB, Bentang Jembatan Terbuka)",
      "pola_temporal": "WEATHER_SEASONAL",
      "pola_temporal_label": "Kondisional Cuaca & Musiman",
      "korelasi_dataset": "connectivity-jabar.json (NODE-44 Bandara Kertajati & CORR-06 Kertajati Aero Link)",
      "waktu_deteksi": "2026-03-31T04:00:00+07:00",
      "status_tindakan": "Dalam Pengawasan",
      "dampak_operasional": "Peningkatan risiko stabilitas kemudi bagi bus antarmoda tinggi (high-decker) DAMRI dan truk boks ringan.",
      "rekomendasi_mitigasi": "Aktivasi Variable Message Sign (VMS) imbauan kurangi kecepatan maksimal 60 km/jam pada jembatan bentang panjang Tol Cisumdawu.",
      "pic_unit": "Seksi Sarana & Prasarana Transportasi Jalan & BUJT"
    }
  ],
  "history_monthly": [
    { "bulan": "April 2025", "terminal": 6, "uppkb": 8, "perintis": 3, "koridor": 4, "total": 21 },
    { "bulan": "Mei 2025", "terminal": 7, "uppkb": 9, "perintis": 4, "koridor": 5, "total": 25 },
    { "bulan": "Juni 2025", "terminal": 9, "uppkb": 7, "perintis": 5, "koridor": 4, "total": 25 },
    { "bulan": "Juli 2025", "terminal": 8, "uppkb": 8, "perintis": 3, "koridor": 3, "total": 22 },
    { "bulan": "Agustus 2025", "terminal": 5, "uppkb": 9, "perintis": 4, "koridor": 4, "total": 22 },
    { "bulan": "September 2025", "terminal": 6, "uppkb": 7, "perintis": 3, "koridor": 3, "total": 19 },
    { "bulan": "Oktober 2025", "terminal": 5, "uppkb": 8, "perintis": 4, "koridor": 5, "total": 22 },
    { "bulan": "November 2025", "terminal": 7, "uppkb": 8, "perintis": 5, "koridor": 6, "total": 26 },
    { "bulan": "Desember 2025", "terminal": 11, "uppkb": 10, "perintis": 6, "koridor": 8, "total": 35 },
    { "bulan": "Januari 2026", "terminal": 8, "uppkb": 7, "perintis": 4, "koridor": 6, "total": 25 },
    { "bulan": "Februari 2026", "terminal": 6, "uppkb": 6, "perintis": 3, "koridor": 4, "total": 19 },
    { "bulan": "Maret 2026", "terminal": 5, "uppkb": 4, "perintis": 5, "koridor": 4, "total": 18 }
  ]
};

// Global App State
var earlyWarningData = EARLY_WARNING_EMBEDDED_DATA;
var mapInstance = null;
var markersLayerGroup = null;
var alertMarkersMap = {};
var activeSeverityFilter = "ALL";
var previousActiveElement = null;
var activeAlertIdForModal = null;

/**
 * Format timestamp into readable Indonesian datetime
 */
function formatDatetime(isoStr) {
  if (!isoStr) return "—";
  try {
    var d = new Date(isoStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  } catch (e) {
    return isoStr;
  }
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
 * Mobile drawer sidebar toggle
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
    if (overlay) overlay.setAttribute("hidden", "");
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
  var s = earlyWarningData.summary || {};
  var totalAlertsEl = document.getElementById("kpiTotalAlerts");
  var criticalCountEl = document.getElementById("kpiCriticalCount");
  var warningCountEl = document.getElementById("kpiWarningCount");
  var domainCountEl = document.getElementById("kpiDomainCount");

  if (totalAlertsEl) {
    totalAlertsEl.textContent = (s.total_alerts || (earlyWarningData.alerts ? earlyWarningData.alerts.length : 18)) + " Insiden";
  }
  if (criticalCountEl) {
    criticalCountEl.textContent = (s.critical_count || 4) + " Kritis";
  }
  if (warningCountEl) {
    warningCountEl.textContent = (s.warning_count || 8) + " Waspada";
  }
  if (domainCountEl) {
    domainCountEl.textContent = (s.domains_monitored || 4) + " Domain";
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
      console.warn("Leaflet loader timed out after " + maxAttempts + " attempts.");
    }
  }

  check();
}

/**
 * Create Pulsing DivIcon based on severity
 */
function createAlertIcon(severity) {
  var pinClass = "marker-pin is-" + severity.toLowerCase();
  var iconSvg = "";

  if (severity === "CRITICAL") {
    iconSvg = '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
  } else if (severity === "WARNING") {
    iconSvg = '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  } else {
    iconSvg = '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  }

  var html = '<div class="' + pinClass + '">' + iconSvg + '</div>';

  return L.divIcon({
    className: "early-warning-marker",
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

/**
 * Render Markers on Leaflet Map
 */
function renderMapMarkers() {
  if (!mapInstance || !markersLayerGroup) return;

  markersLayerGroup.clearLayers();
  alertMarkersMap = {};

  var alerts = earlyWarningData.alerts || [];

  alerts.forEach(function (alr) {
    if (activeSeverityFilter !== "ALL" && alr.severity !== activeSeverityFilter) {
      return;
    }

    var icon = createAlertIcon(alr.severity);
    var marker = L.marker([alr.lat, alr.lng], { icon: icon });

    var sevBadgeClass = alr.severity === "CRITICAL" ? "badge-critical" : (alr.severity === "WARNING" ? "badge-warning" : "badge-advisory");
    var sevLabel = alr.severity === "CRITICAL" ? "Kritis" : (alr.severity === "WARNING" ? "Peringatan Waspada" : "Atensi");

    var popupHtml = '<div class="early-warning-popup">' +
      '<div style="margin-bottom:6px;"><span class="' + sevBadgeClass + '">' + sevLabel + '</span> <span class="code-pill">' + alr.kode_rule + '</span></div>' +
      '<div class="popup-title">' + alr.judul + '</div>' +
      '<div class="popup-param"><strong>Lokasi:</strong> ' + alr.fasilitas + ' (' + alr.wilayah + ')</div>' +
      '<div class="popup-param" style="color:#b45309;"><strong>Waktu Pemicu:</strong> ' + (alr.waktu_pemicu || "Off-Peak") + '</div>' +
      '<div class="popup-param"><strong>Observasi:</strong> ' + alr.nilai_aktual + '</div>' +
      '<div class="popup-param"><strong>Deviasi:</strong> ' + alr.deviasi + '</div>' +
      '<div class="popup-param"><strong>Status:</strong> ' + alr.status_tindakan + '</div>' +
      '<div class="popup-param" style="font-size:0.7rem; color:#2563eb; margin-top:2px;"><strong>Sumber Data:</strong> ' + (alr.korelasi_dataset || "BPTD Jabar") + '</div>' +
      '<button type="button" class="popup-btn" onclick="window.showAlertDetail(\'' + alr.id + '\')">Rincian &amp; Mitigasi</button>' +
      '</div>';

    marker.bindPopup(popupHtml);
    markersLayerGroup.addLayer(marker);
    alertMarkersMap[alr.id] = marker;
  });
}

/**
 * Initialize Leaflet Map
 */
function initMap() {
  var mapEl = document.getElementById("earlyWarningMap");
  if (!mapEl) return;

  ensureLeafletLoaded(function () {
    if (mapInstance) return;

    mapInstance = L.map("earlyWarningMap", {
      center: [-6.9, 107.6],
      zoom: 8,
      minZoom: 7,
      maxZoom: 17,
      scrollWheelZoom: true,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | BPTD Kelas I Jabar'
    }).addTo(mapInstance);

    markersLayerGroup = L.layerGroup().addTo(mapInstance);

    renderMapMarkers();

    // Map control: Focus Jabar button
    var btnFocus = document.getElementById("btnFocusJabar");
    if (btnFocus) {
      btnFocus.addEventListener("click", function () {
        mapInstance.setView([-6.9, 107.6], 8, { duration: 0.8 });
      });
    }

    // Severity Filter Chips
    var chips = [
      { id: "filterAll", sev: "ALL" },
      { id: "filterCritical", sev: "CRITICAL" },
      { id: "filterWarning", sev: "WARNING" },
      { id: "filterAdvisory", sev: "ADVISORY" }
    ];

    chips.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;

      el.addEventListener("click", function () {
        chips.forEach(function (other) {
          var oEl = document.getElementById(other.id);
          if (oEl) oEl.classList.remove("is-active");
        });
        el.classList.add("is-active");
        activeSeverityFilter = c.sev;
        renderMapMarkers();
      });
    });
  });
}

/**
 * Render Tab 1: Peringatan Dini Aktif Table
 */
function renderAlertTable() {
  var tbody = document.getElementById("alertTableBody");
  var countEl = document.getElementById("alertCount");
  var searchInput = document.getElementById("searchAlert");
  var domainSelect = document.getElementById("filterDomain");
  var temporalSelect = document.getElementById("filterTemporal");
  var severitySelect = document.getElementById("filterTableSeverity");

  if (!tbody) return;

  var q = (searchInput ? searchInput.value : "").trim().toLowerCase();
  var domainFilter = domainSelect ? domainSelect.value : "ALL";
  var tempFilter = temporalSelect ? temporalSelect.value : "ALL";
  var sevFilter = severitySelect ? severitySelect.value : "ALL";

  var alerts = earlyWarningData.alerts || [];

  var filtered = alerts.filter(function (alr) {
    if (domainFilter !== "ALL" && alr.domain !== domainFilter) return false;
    if (tempFilter !== "ALL" && alr.pola_temporal !== tempFilter) return false;
    if (sevFilter !== "ALL" && alr.severity !== sevFilter) return false;
    if (!q) return true;

    return (
      alr.id.toLowerCase().includes(q) ||
      alr.judul.toLowerCase().includes(q) ||
      alr.fasilitas.toLowerCase().includes(q) ||
      alr.wilayah.toLowerCase().includes(q) ||
      alr.parameter.toLowerCase().includes(q) ||
      (alr.waktu_pemicu && alr.waktu_pemicu.toLowerCase().includes(q)) ||
      (alr.korelasi_dataset && alr.korelasi_dataset.toLowerCase().includes(q)) ||
      alr.status_tindakan.toLowerCase().includes(q)
    );
  });

  if (countEl) {
    countEl.textContent = "Menampilkan " + filtered.length + " dari " + alerts.length + " insiden";
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="th-center" style="padding:2rem; color:#64748b;">Tidak ada insiden peringatan dini yang sesuai dengan kriteria filter.</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function (alr, idx) {
    var sevBadgeClass = alr.severity === "CRITICAL" ? "badge-critical" : (alr.severity === "WARNING" ? "badge-warning" : "badge-advisory");
    var sevLabel = alr.severity === "CRITICAL" ? "Kritis" : (alr.severity === "WARNING" ? "Peringatan" : "Atensi");

    var domainClass = "domain-" + alr.domain;

    html += '<tr>' +
      '<td class="th-center">' + (idx + 1) + '</td>' +
      '<td>' +
        '<div><strong>' + alr.judul + '</strong></div>' +
        '<div style="font-size:0.725rem; color:#64748b;"><span class="code-pill">' + alr.id + '</span> &bull; <span class="code-pill">' + alr.kode_rule + '</span></div>' +
      '</td>' +
      '<td><span class="domain-badge ' + domainClass + '">' + alr.domain_label + '</span></td>' +
      '<td>' +
        '<div><strong>' + alr.fasilitas + '</strong></div>' +
        '<div style="font-size:0.725rem; color:#64748b;">' + alr.wilayah + '</div>' +
      '</td>' +
      '<td class="th-center"><span class="' + sevBadgeClass + '">' + sevLabel + '</span></td>' +
      '<td>' +
        '<div><strong>' + alr.parameter + '</strong></div>' +
        '<div style="font-size:0.725rem; color:#475569;">' + alr.nilai_aktual + '</div>' +
        '<div style="margin-top:4px;">' +
          '<span class="temporal-badge" title="Waktu Pemicu Anomali">' +
            '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
            alr.waktu_pemicu +
          '</span>' +
        '</div>' +
        '<div style="font-size:0.6875rem; color:#2563eb; margin-top:2px;">Ref: ' + (alr.korelasi_dataset || 'BPTD') + '</div>' +
      '</td>' +
      '<td class="th-center"><span class="status-badge-inline">' + alr.status_tindakan + '</span></td>' +
      '<td class="th-center">' +
        '<button type="button" class="btn-table-action" onclick="window.showAlertDetail(\'' + alr.id + '\')">' +
          '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>' +
          'Detail' +
        '</button>' +
      '</td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Render Tab 2: Registri Ambang Batas Metodologi Table
 */
function renderThresholdTable() {
  var tbody = document.getElementById("thresholdTableBody");
  if (!tbody) return;

  var rules = earlyWarningData.threshold_rules || [];
  var html = "";

  rules.forEach(function (r) {
    var domainClass = "domain-" + r.domain;

    html += '<tr>' +
      '<td class="th-center"><span class="code-pill"><strong>' + r.kode + '</strong></span></td>' +
      '<td><span class="domain-badge ' + domainClass + '">' + r.domain_label + '</span></td>' +
      '<td><strong>' + r.indikator + '</strong></td>' +
      '<td><span class="code-pill">' + r.formula + '</span></td>' +
      '<td style="color:#d97706; font-weight:600;">' + r.ambang_warning + '</td>' +
      '<td style="color:#dc2626; font-weight:700;">' + r.ambang_kritis + '</td>' +
      '<td style="font-size:0.75rem; color:#475569;">' + r.dasar_regulasi + '</td>' +
      '<td style="font-size:0.75rem; color:#1e293b; max-width:280px;">' + r.prosedur_mitigasi + '</td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Render Tab 3: Tren & Riwayat Anomali Table
 */
function renderHistoryTable() {
  var tbody = document.getElementById("historyTableBody");
  if (!tbody) return;

  var history = earlyWarningData.history_monthly || [];
  var html = "";

  history.forEach(function (h) {
    var maxVal = 40;
    var tPct = Math.round((h.terminal / maxVal) * 100);
    var uPct = Math.round((h.uppkb / maxVal) * 100);
    var pPct = Math.round((h.perintis / maxVal) * 100);
    var kPct = Math.round((h.koridor / maxVal) * 100);

    html += '<tr>' +
      '<td><strong>' + h.bulan + '</strong></td>' +
      '<td class="th-center"><span class="domain-badge domain-terminal">' + h.terminal + '</span></td>' +
      '<td class="th-center"><span class="domain-badge domain-uppkb">' + h.uppkb + '</span></td>' +
      '<td class="th-center"><span class="domain-badge domain-perintis">' + h.perintis + '</span></td>' +
      '<td class="th-center"><span class="domain-badge domain-koridor">' + h.koridor + '</span></td>' +
      '<td class="th-center"><strong>' + h.total + '</strong></td>' +
      '<td>' +
        '<div class="history-bar-wrap">' +
          '<div class="history-bar-track" style="display:flex;">' +
            '<div style="width:' + tPct + '%; background:#0284c7;" title="Terminal: ' + h.terminal + '"></div>' +
            '<div style="width:' + uPct + '%; background:#d97706;" title="UPPKB: ' + h.uppkb + '"></div>' +
            '<div style="width:' + pPct + '%; background:#16a34a;" title="Perintis: ' + h.perintis + '"></div>' +
            '<div style="width:' + kPct + '%; background:#7c3aed;" title="Koridor: ' + h.koridor + '"></div>' +
          '</div>' +
          '<span style="font-size:0.75rem; font-weight:600; color:#475569; min-width:48px;">' + h.total + ' total</span>' +
        '</div>' +
      '</td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Tab Switching Controller
 */
function initTabs() {
  var tabBtns = [
    { btn: document.getElementById("btnTabAlertLog"), panel: document.getElementById("panelAlertLog") },
    { btn: document.getElementById("btnTabThresholds"), panel: document.getElementById("panelThresholds") },
    { btn: document.getElementById("btnTabHistory"), panel: document.getElementById("panelHistory") }
  ];

  function activateTab(index) {
    tabBtns.forEach(function (t, i) {
      if (!t.btn || !t.panel) return;
      if (i === index) {
        t.btn.classList.add("is-active");
        t.btn.setAttribute("aria-selected", "true");
        t.btn.setAttribute("tabindex", "0");
        t.panel.removeAttribute("hidden");
      } else {
        t.btn.classList.remove("is-active");
        t.btn.setAttribute("aria-selected", "false");
        t.btn.setAttribute("tabindex", "-1");
        t.panel.setAttribute("hidden", "");
      }
    });
  }

  tabBtns.forEach(function (t, i) {
    if (!t.btn) return;
    t.btn.addEventListener("click", function () {
      activateTab(i);
    });

    t.btn.addEventListener("keydown", function (e) {
      var nextIdx = -1;
      if (e.key === "ArrowRight") nextIdx = (i + 1) % tabBtns.length;
      if (e.key === "ArrowLeft") nextIdx = (i - 1 + tabBtns.length) % tabBtns.length;
      if (e.key === "Home") nextIdx = 0;
      if (e.key === "End") nextIdx = tabBtns.length - 1;

      if (nextIdx !== -1) {
        e.preventDefault();
        activateTab(nextIdx);
        if (tabBtns[nextIdx].btn) tabBtns[nextIdx].btn.focus();
      }
    });
  });

  // Table search & filter inputs
  var searchAlert = document.getElementById("searchAlert");
  if (searchAlert) searchAlert.addEventListener("input", renderAlertTable);

  var filterDomain = document.getElementById("filterDomain");
  if (filterDomain) filterDomain.addEventListener("change", renderAlertTable);

  var filterTemporal = document.getElementById("filterTemporal");
  if (filterTemporal) filterTemporal.addEventListener("change", renderAlertTable);

  var filterTableSeverity = document.getElementById("filterTableSeverity");
  if (filterTableSeverity) filterTableSeverity.addEventListener("change", renderAlertTable);
}

/**
 * Modal Dialog Controller
 */
function initModal() {
  var backdrop = document.getElementById("modalBackdrop");
  var modal = document.getElementById("alertDetailModal");
  var closeBtn = document.getElementById("modalCloseBtn");
  var closeFooterBtn = document.getElementById("modalCloseFooterBtn");
  var focusMapBtn = document.getElementById("modalFocusMapBtn");

  function closeModal() {
    if (modal) modal.setAttribute("hidden", "");
    if (backdrop) backdrop.setAttribute("hidden", "");
    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) {
      closeModal();
    }
  });

  if (focusMapBtn) {
    focusMapBtn.addEventListener("click", function () {
      if (!activeAlertIdForModal || !mapInstance) return;
      var marker = alertMarkersMap[activeAlertIdForModal];
      var alerts = earlyWarningData.alerts || [];
      var target = alerts.find(function (a) { return a.id === activeAlertIdForModal; });

      closeModal();

      if (target) {
        mapInstance.flyTo([target.lat, target.lng], 13, { duration: 0.8 });
        if (marker) {
          setTimeout(function () {
            marker.openPopup();
          }, 850);
        }
      }
    });
  }

  window.closeAlertModal = closeModal;
}

/**
 * Show Alert Detail Modal
 */
window.showAlertDetail = function (alertId) {
  var alerts = earlyWarningData.alerts || [];
  var alert = alerts.find(function (a) { return a.id === alertId; });
  if (!alert) return;

  activeAlertIdForModal = alertId;
  previousActiveElement = document.activeElement;

  var backdrop = document.getElementById("modalBackdrop");
  var modal = document.getElementById("alertDetailModal");

  // Elements
  var sevBadge = document.getElementById("modalSeverityBadge");
  var domBadge = document.getElementById("modalDomainBadge");
  var tempBadge = document.getElementById("modalTemporalBadge");
  var ruleBadge = document.getElementById("modalRuleBadge");
  var titleEl = document.getElementById("modalAlertTitle");
  var subInfoEl = document.getElementById("modalAlertSub");
  var coordsEl = document.getElementById("modalCoords");
  var actualValEl = document.getElementById("modalActualVal");
  var thresholdValEl = document.getElementById("modalThresholdVal");
  var deviationValEl = document.getElementById("modalDeviationVal");
  var detectTimeEl = document.getElementById("modalDetectTime");
  var triggerWindowEl = document.getElementById("modalTriggerWindow");
  var temporalPatternEl = document.getElementById("modalTemporalPattern");
  var datasetRefEl = document.getElementById("modalDatasetRef");
  var impactBoxEl = document.getElementById("modalImpactBox");
  var mitigationBoxEl = document.getElementById("modalMitigationBox");
  var picBoxEl = document.getElementById("modalPicBox");

  if (sevBadge) {
    sevBadge.className = alert.severity === "CRITICAL" ? "badge-critical" : (alert.severity === "WARNING" ? "badge-warning" : "badge-advisory");
    sevBadge.textContent = alert.severity === "CRITICAL" ? "KRITIS" : (alert.severity === "WARNING" ? "PERINGATAN WASPADA" : "ATENSI");
  }

  if (domBadge) {
    domBadge.className = "domain-badge domain-" + alert.domain;
    domBadge.textContent = alert.domain_label;
  }

  if (tempBadge) {
    tempBadge.textContent = alert.pola_temporal_label || "Temporal Operasional";
  }

  if (ruleBadge) ruleBadge.textContent = alert.kode_rule;
  if (titleEl) titleEl.textContent = alert.judul;
  if (subInfoEl) subInfoEl.textContent = alert.fasilitas + " — " + alert.wilayah;
  if (coordsEl) coordsEl.textContent = alert.lat.toFixed(4) + ", " + alert.lng.toFixed(4);
  if (actualValEl) actualValEl.textContent = alert.nilai_aktual;
  if (thresholdValEl) thresholdValEl.textContent = "Batas: " + alert.ambang_batas;
  if (deviationValEl) deviationValEl.textContent = alert.deviasi;
  if (detectTimeEl) detectTimeEl.textContent = "Deteksi: " + formatDatetime(alert.waktu_deteksi);

  if (triggerWindowEl) triggerWindowEl.textContent = alert.waktu_pemicu || "Sesuai Jam Operasional";
  if (temporalPatternEl) temporalPatternEl.textContent = "Pola: " + (alert.pola_temporal_label || "Reguler");
  if (datasetRefEl) datasetRefEl.textContent = alert.korelasi_dataset || "BPTD Kelas I Jabar";

  if (impactBoxEl) impactBoxEl.textContent = alert.dampak_operasional;
  if (mitigationBoxEl) mitigationBoxEl.textContent = alert.rekomendasi_mitigasi;
  if (picBoxEl) picBoxEl.textContent = "Unit PIC: " + (alert.pic_unit || "BPTD Kelas I Jawa Barat");

  if (backdrop) backdrop.removeAttribute("hidden");
  if (modal) {
    modal.removeAttribute("hidden");
    var closeBtn = document.getElementById("modalCloseBtn");
    if (closeBtn) closeBtn.focus();
  }
};

/**
 * Dynamic Data Fetch with Smooth Embedded Fallback
 */
function loadData() {
  fetch("../../data/early-warning-jabar.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data && data.alerts && data.alerts.length > 0) {
        earlyWarningData = data;
        renderKPIs();
        renderAlertTable();
        renderThresholdTable();
        renderHistoryTable();
        renderMapMarkers();
      }
    })
    .catch(function () {
      // Fallback already preloaded
    });
}

/**
 * Initialization on DOM Ready
 */
document.addEventListener("DOMContentLoaded", function () {
  initClock();
  initSidebar();
  renderKPIs();
  initTabs();
  renderAlertTable();
  renderThresholdTable();
  renderHistoryTable();
  initModal();
  initMap();
  loadData();
});
