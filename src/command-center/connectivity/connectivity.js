/* =====================================================================
   GeoPORTAL BPTD Jabar — Modul Konektivitas Multimoda (connectivity.js)
   Integrasi Simpul Antarmoda, Koridor Transfer, Buffer & Indeks Aksesibilitas
   ===================================================================== */

/**
 * Embedded official dataset fallback (BPTD Kelas I Jawa Barat 2026)
 * 47 Simpul Multimoda (12 Terminal A, 10 Terminal B, 6 UPPKB, 15 Stasiun KA/Whoosh, 2 Bandara, 2 Pelabuhan),
 * 14 Koridor Transfer Antarmoda, dan Indeks Aksesibilitas Multimoda 27 Kabupaten/Kota.
 */
var CONNECTIVITY_EMBEDDED_DATA = {
  "title": "Direktori & Analitik Konektivitas Multimoda Jawa Barat 2026",
  "instansi": "BPTD Kelas I Jawa Barat",
  "tahun": 2026,
  "summary": {
    "total_simpul": 47,
    "total_koridor_transfer": 14,
    "rata_rata_jarak_transfer_km": 3.8,
    "wilayah_terlayani": 27,
    "komposisi_simpul": {
      "terminal_tipe_a": 12,
      "terminal_tipe_b": 10,
      "uppkb_penimbangan": 6,
      "stasiun_kereta": 15,
      "bandara_udara": 2,
      "pelabuhan_laut": 2
    },
    "kategori_moda": [
      { "id": "terminal_a", "label": "Terminal Tipe A", "count": 12, "color": "#3b82f6", "icon": "bus" },
      { "id": "terminal_b", "label": "Terminal Tipe B", "count": 10, "color": "#10b981", "icon": "bus-outline" },
      { "id": "uppkb", "label": "UPPKB Penimbangan", "count": 6, "color": "#f59e0b", "icon": "scale" },
      { "id": "stasiun_ka", "label": "Stasiun KA & Whoosh", "count": 15, "color": "#8b5cf6", "icon": "train" },
      { "id": "bandara", "label": "Bandara Udara", "count": 2, "color": "#ef4444", "icon": "plane" },
      { "id": "pelabuhan", "label": "Pelabuhan Laut", "count": 2, "color": "#06b6d4", "icon": "ship" }
    ]
  },
  "nodes": [
    {
      "id": "NODE-01",
      "nama": "Terminal Leuwipanjang",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Bandung",
      "lat": -6.9472,
      "lng": 107.5936,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Trans Metro Pasundan", "Angkot Feeder", "Kereta Api (via feeder)"],
      "hub_terdekat": "Stasiun Bandung (4.2 km)",
      "jarak_hub_km": 4.2,
      "skor_aksesibilitas": 94,
      "alamat": "Jl. Soekarno-Hatta No. 205, Situsaeur, Bojongloa Kidul, Kota Bandung",
      "deskripsi": "Simpul transportasi jalan raya utama kawasan Bandung Raya yang melayani rute barat Jawa Barat, DKI Jakarta, Banten, dan Sumatera dengan integrasi BRT Trans Metro Pasundan."
    },
    {
      "id": "NODE-02",
      "nama": "Terminal Baranangsiang",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Bogor",
      "lat": -6.6027,
      "lng": 106.8091,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "BisKita Trans Pakuan", "KRL Commuter Line (via feeder)"],
      "hub_terdekat": "Stasiun Bogor (2.8 km)",
      "jarak_hub_km": 2.8,
      "skor_aksesibilitas": 92,
      "alamat": "Jl. Raya Pajajaran No. 1, Tegallega, Bogor Tengah, Kota Bogor",
      "deskripsi": "Gerbang utama bus AKAP/AKDP Kota Bogor yang menghubungkan Jabodetabek dengan koridor Sukabumi, Cianjur, Bandung, dan Jawa Tengah/Timur."
    },
    {
      "id": "NODE-03",
      "nama": "Terminal Guntur Melati",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kabupaten Garut",
      "lat": -7.2023,
      "lng": 107.9079,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Perintis", "Angkot Lokal"],
      "hub_terdekat": "Stasiun Garut (3.1 km)",
      "jarak_hub_km": 3.1,
      "skor_aksesibilitas": 82,
      "alamat": "Jl. Guntur Melati, Haurpanggung, Tarogong Kidul, Kabupaten Garut",
      "deskripsi": "Simpul transit jalan raya utama Priangan Timur barat yang melayani koneksi antarkota serta titik awal trayek angkutan perintis ke kawasan Garut Selatan."
    },
    {
      "id": "NODE-04",
      "nama": "Terminal Ciakar",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kabupaten Sumedang",
      "lat": -6.8402,
      "lng": 107.9254,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Feeder BIJB", "Angkot Lokal"],
      "hub_terdekat": "Bandara BIJB Kertajati (34.0 km via Tol Cisumdawu)",
      "jarak_hub_km": 34.0,
      "skor_aksesibilitas": 80,
      "alamat": "Jl. Prabu Gajah Agung, Situ, Sumedang Utara, Kabupaten Sumedang",
      "deskripsi": "Pusat transit bus Sumedang dengan akses strategis Tol Cisumdawu, menghubungkan koridor Bandung-Cirebon dan layanan pengumpan BIJB Kertajati."
    },
    {
      "id": "NODE-05",
      "nama": "Terminal KH. Ahmad Sanusi",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Sukabumi",
      "lat": -6.9463,
      "lng": 106.9312,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Perintis", "Kereta Api (via feeder)"],
      "hub_terdekat": "Stasiun Sukabumi (2.4 km)",
      "jarak_hub_km": 2.4,
      "skor_aksesibilitas": 84,
      "alamat": "Jl. Jalur Lingkar Selatan, Sudajaya Hilir, Baros, Kota Sukabumi",
      "deskripsi": "Terminal tipe A Kota Sukabumi yang melayani rute antarkota menuju Jabodetabek, Bandung, dan koneksi perintis BPTD Jabar ke pesisir Sukabumi Selatan."
    },
    {
      "id": "NODE-06",
      "nama": "Terminal Jatijajar",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Depok",
      "lat": -6.4258,
      "lng": 106.8653,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Transjabodetabek", "Angkot Feeder"],
      "hub_terdekat": "Stasiun Cibinong (4.8 km)",
      "jarak_hub_km": 4.8,
      "skor_aksesibilitas": 89,
      "alamat": "Jl. Raya Bogor KM 36, Jatijajar, Tapos, Kota Depok",
      "deskripsi": "Hub bus AKAP utama sisi selatan Jabodetabek yang melayani keberangkatan rute Jawa Tengah, D.I. Yogyakarta, dan Jawa Timur dari Depok dan Bogor Utara."
    },
    {
      "id": "NODE-07",
      "nama": "Terminal Indihiang",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Tasikmalaya",
      "lat": -7.3015,
      "lng": 108.1994,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Perintis", "Angkot Lokal"],
      "hub_terdekat": "Stasiun Tasikmalaya (3.7 km)",
      "jarak_hub_km": 3.7,
      "skor_aksesibilitas": 86,
      "alamat": "Jl. Brigjen Wasita Kusumah, Indihiang, Kota Tasikmalaya",
      "deskripsi": "Simpul transportasi jalan raya terbesar di Priangan Timur, mengintegrasikan armada bus jarak jauh koridor selatan Jawa dengan jaringan feeder lokal."
    },
    {
      "id": "NODE-08",
      "nama": "Terminal Klari",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kabupaten Karawang",
      "lat": -6.3475,
      "lng": 107.3582,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Kawasan Industri", "KRL (via Klari)"],
      "hub_terdekat": "Stasiun Karawang KCIC (8.9 km) / Stasiun Klari (1.2 km)",
      "jarak_hub_km": 8.9,
      "skor_aksesibilitas": 88,
      "alamat": "Jl. Raya Klari, Duren, Klari, Kabupaten Karawang",
      "deskripsi": "Simpul transit strategis koridor industri Karawang yang menghubungkan pergerakan komuter Jabodetabek dan bus antarkota lintas Jawa."
    },
    {
      "id": "NODE-09",
      "nama": "Terminal Banjar",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Banjar",
      "lat": -7.3685,
      "lng": 108.5367,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Perintis", "Kereta Api (via feeder)"],
      "hub_terdekat": "Stasiun Banjar (0.7 km)",
      "jarak_hub_km": 0.7,
      "skor_aksesibilitas": 90,
      "alamat": "Jl. Terminal Banjar, Purwaharja, Kota Banjar",
      "deskripsi": "Pintu gerbang perbatasan Jawa Barat dan Jawa Tengah sisi selatan, memiliki kedekatan intermodal sangat tinggi dengan Stasiun Banjar (hanya 700 meter)."
    },
    {
      "id": "NODE-10",
      "nama": "Terminal Subang",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kabupaten Subang",
      "lat": -6.5592,
      "lng": 107.7618,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Feeder Patimban", "Angkot"],
      "hub_terdekat": "Pelabuhan Patimban (38.5 km) / Stasiun Pegadenbaru (14.2 km)",
      "jarak_hub_km": 38.5,
      "skor_aksesibilitas": 81,
      "alamat": "Jl. Oto Iskandardinata, Sukamelang, Kabupaten Subang",
      "deskripsi": "Simpul transportasi darat Subang penyangga koridor Rebana yang melayani arus penumpang menuju Bandung, Cirebon, dan kawasan Pelabuhan Patimban."
    },
    {
      "id": "NODE-11",
      "nama": "Terminal Harjamukti",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kota Cirebon",
      "lat": -6.7495,
      "lng": 108.5528,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "BRT Trans Cirebon", "Angkot Lokal"],
      "hub_terdekat": "Stasiun Cirebon Kejaksan (5.1 km)",
      "jarak_hub_km": 5.1,
      "skor_aksesibilitas": 91,
      "alamat": "Jl. Jenderal Ahmad Yani No. 1, Harjamukti, Kota Cirebon",
      "deskripsi": "Simpul induk transportasi bus koridor Pantura timur Jawa Barat, terhubung langsung ke koridor tol Trans Jawa dan BRT Trans Cirebon."
    },
    {
      "id": "NODE-12",
      "nama": "Terminal Kertawangunan",
      "kategori": "terminal_a",
      "kategori_label": "Terminal Tipe A",
      "kabupaten": "Kabupaten Kuningan",
      "lat": -6.9748,
      "lng": 108.5134,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKAP", "Bus AKDP", "Angkutan Feeder Cirebon", "Angkot Lokal"],
      "hub_terdekat": "Terminal Harjamukti Cirebon (26.2 km)",
      "jarak_hub_km": 26.2,
      "skor_aksesibilitas": 79,
      "alamat": "Jl. Raya Kertawangunan, Sindangagung, Kabupaten Kuningan",
      "deskripsi": "Terminal tipe A di kaki Gunung Ciremai yang melayani rute antarkota menuju Jabodetabek, Bandung, serta layanan pengumpan komuter Kuningan-Cirebon."
    },
    {
      "id": "NODE-13",
      "nama": "Terminal Cikarang",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Bekasi",
      "lat": -6.2572,
      "lng": 107.1512,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "KRL Commuter Line", "Angkutan Kawasan Industri", "Angkot"],
      "hub_terdekat": "Stasiun Cikarang (0.3 km)",
      "jarak_hub_km": 0.3,
      "skor_aksesibilitas": 95,
      "alamat": "Jl. RE Martadinata, Kalijaya, Cikarang Barat, Kabupaten Bekasi",
      "deskripsi": "Simpul transfer multimoda berdensitas tinggi di pusat kawasan industri terbesar Asia Tenggara, berjarak 300m dari stasiun KRL integrasi Lin Cikarang."
    },
    {
      "id": "NODE-14",
      "nama": "Terminal Cileunyi",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Bandung",
      "lat": -6.9392,
      "lng": 107.7471,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Trans Metro Bandung", "Angkot Feeder", "Whoosh Shuttle"],
      "hub_terdekat": "Stasiun Tegalluar KCIC (4.5 km)",
      "jarak_hub_km": 4.5,
      "skor_aksesibilitas": 91,
      "alamat": "Jl. Raya Cileunyi, Cileunyi Wetan, Kabupaten Bandung",
      "deskripsi": "Pusat transit persimpangan jalan nasional timur Bandung Raya dengan akses langsung Tol Padaleunyi dan shuttle menuju Stasiun Tegalluar KCIC Whoosh."
    },
    {
      "id": "NODE-15",
      "nama": "Terminal Leuwiliang",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Bogor",
      "lat": -6.5772,
      "lng": 106.6321,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Angkutan Perintis", "BisKita Feeder", "Angkot"],
      "hub_terdekat": "Stasiun Bogor (22.5 km)",
      "jarak_hub_km": 22.5,
      "skor_aksesibilitas": 75,
      "alamat": "Jl. Raya Leuwiliang, Leuwimekar, Leuwiliang, Kabupaten Bogor",
      "deskripsi": "Simpul pengumpan utama kawasan Bogor Barat yang menghubungkan wilayah perbukitan Sukajaya/Jasinga dengan pusat kota Bogor."
    },
    {
      "id": "NODE-16",
      "nama": "Terminal Cileungsi",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Bogor",
      "lat": -6.3982,
      "lng": 106.9612,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Transjabodetabek", "Angkot Feeder", "Bus Komuter"],
      "hub_terdekat": "Stasiun LRT Harjamukti Cibubur (11.4 km)",
      "jarak_hub_km": 11.4,
      "skor_aksesibilitas": 85,
      "alamat": "Jl. Raya Cileungsi-Jonggol, Cileungsi Kidul, Kabupaten Bogor",
      "deskripsi": "Pusat transit bus kawasan koridor Bogor Timur yang melayani rute komuter menuju DKI Jakarta, Bekasi, dan Cikarang."
    },
    {
      "id": "NODE-17",
      "nama": "Terminal Rawabango",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Cianjur",
      "lat": -6.8123,
      "lng": 107.1567,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Angkot Feeder", "Angkutan Perintis"],
      "hub_terdekat": "Stasiun Cianjur (4.6 km)",
      "jarak_hub_km": 4.6,
      "skor_aksesibilitas": 78,
      "alamat": "Jl. Raya Bandung, Bojong, Karangtengah, Kabupaten Cianjur",
      "deskripsi": "Simpul bus AKDP utama Kabupaten Cianjur yang menghubungkan pergerakan koridor Puncak-Bogor, Bandung, dan Cianjur Selatan."
    },
    {
      "id": "NODE-18",
      "nama": "Terminal Sumber",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Cirebon",
      "lat": -6.7621,
      "lng": 108.4831,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Angkot Lokal", "Feeder Kawasan Pemda"],
      "hub_terdekat": "Terminal Harjamukti Cirebon (8.2 km)",
      "jarak_hub_km": 8.2,
      "skor_aksesibilitas": 76,
      "alamat": "Jl. Dewi Sartika, Sumber, Kabupaten Cirebon",
      "deskripsi": "Terminal transit ibu kota Kabupaten Cirebon yang melayani pergerakan intra-wilayah Cirebon dan koridor Majalengka/Kuningan."
    },
    {
      "id": "NODE-19",
      "nama": "Terminal Singaparna",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Tasikmalaya",
      "lat": -7.3481,
      "lng": 108.1132,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Angkutan Perintis", "Angkot Pedesaan"],
      "hub_terdekat": "Terminal Indihiang Tasikmalaya (12.3 km)",
      "jarak_hub_km": 12.3,
      "skor_aksesibilitas": 77,
      "alamat": "Jl. Raya Singaparna, Cipakat, Singaparna, Kabupaten Tasikmalaya",
      "deskripsi": "Pusat simpul transportasi darat ibu kota Kabupaten Tasikmalaya yang melayani pergerakan rute Garut-Tasikmalaya dan Tasikmalaya Selatan."
    },
    {
      "id": "NODE-20",
      "nama": "Terminal Pameungpeuk",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Garut",
      "lat": -7.6471,
      "lng": 107.7312,
      "status": "Aktif",
      "koneksi_moda": ["Angkutan Perintis BPTD", "Bus AKDP Kecil", "Angkot Pesisir"],
      "hub_terdekat": "Terminal Guntur Melati Garut (78.0 km)",
      "jarak_hub_km": 78.0,
      "skor_aksesibilitas": 65,
      "alamat": "Jl. Raya Pameungpeuk, Sirnabakti, Pameungpeuk, Kabupaten Garut",
      "deskripsi": "Simpul penting pesisir selatan Jawa Barat, menjadi titik pangkalan trayek bus perintis BPTD Jabar untuk konektivitas wilayah 3T."
    },
    {
      "id": "NODE-21",
      "nama": "Terminal Ciledug",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Cirebon",
      "lat": -6.9042,
      "lng": 108.7423,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Angkot Perbatasan", "Feeder Brebes"],
      "hub_terdekat": "Stasiun Ciledug KAI (0.9 km)",
      "jarak_hub_km": 0.9,
      "skor_aksesibilitas": 83,
      "alamat": "Jl. Merdeka Barat, Ciledug Kulon, Kabupaten Cirebon",
      "deskripsi": "Simpul terminal perbatasan timur Cirebon dan Jawa Tengah (Brebes), berdekatan dengan jalur kereta lintas selatan Cirebon-Kroya."
    },
    {
      "id": "NODE-22",
      "nama": "Terminal Majalaya",
      "kategori": "terminal_b",
      "kategori_label": "Terminal Tipe B",
      "kabupaten": "Kabupaten Bandung",
      "lat": -7.0512,
      "lng": 107.7554,
      "status": "Aktif",
      "koneksi_moda": ["Bus AKDP", "Angkot Feeder", "Angkutan Kawasan Industri"],
      "hub_terdekat": "Stasiun Cicalengka (8.7 km)",
      "jarak_hub_km": 8.7,
      "skor_aksesibilitas": 76,
      "alamat": "Jl. Babakan, Majalaya, Kabupaten Bandung",
      "deskripsi": "Simpul transportasi sentra industri tekstil Bandung Selatan yang menghubungkan Majalaya dengan Cicalengka, Ciparay, dan Kota Bandung."
    },
    {
      "id": "NODE-23",
      "nama": "UPPKB Balonggandu (JT001)",
      "kategori": "uppkb",
      "kategori_label": "UPPKB Penimbangan",
      "kabupaten": "Kabupaten Karawang",
      "lat": -6.37733,
      "lng": 107.51488,
      "status": "Aktif",
      "koneksi_moda": ["Jalur Logistik Pantura", "Akses Tol Cipali", "Kawasan Pergudangan"],
      "hub_terdekat": "Pelabuhan Patimban (38.5 km via Pantura)",
      "jarak_hub_km": 38.5,
      "skor_aksesibilitas": 85,
      "alamat": "Jl. Raya Pantura No. 12, Balonggandu, Jatisari, Kabupaten Karawang",
      "deskripsi": "Fasilitas penimbangan muatan utama koridor Pantura barat Jawa Barat, mengawasi arus logistik industri Jabodetabek-Jawa Tengah."
    },
    {
      "id": "NODE-24",
      "nama": "UPPKB Losarang (JT002)",
      "kategori": "uppkb",
      "kategori_label": "UPPKB Penimbangan",
      "kabupaten": "Kabupaten Indramayu",
      "lat": -6.39682,
      "lng": 108.15654,
      "status": "Aktif",
      "koneksi_moda": ["Jalur Arteri Pantura", "Koridor Logistik Pangan"],
      "hub_terdekat": "Pelabuhan Cirebon (48.0 km)",
      "jarak_hub_km": 48.0,
      "skor_aksesibilitas": 78,
      "alamat": "Jl. Raya Pantura Losarang, Juntinyuat, Kabupaten Indramayu",
      "deskripsi": "Fasilitas pengawasan muatan angkutan barang di koridor lumbung pangan Indramayu dan jalur primer barang Pantura tengah."
    },
    {
      "id": "NODE-25",
      "nama": "UPPKB Gentong (JT003)",
      "kategori": "uppkb",
      "kategori_label": "UPPKB Penimbangan",
      "kabupaten": "Kabupaten Tasikmalaya",
      "lat": -7.13524,
      "lng": 108.13451,
      "status": "Aktif",
      "koneksi_moda": ["Jalur Logistik Jalur Selatan", "Lintas Nagreg-Ciawi"],
      "hub_terdekat": "Terminal Indihiang Tasikmalaya (21.4 km)",
      "jarak_hub_km": 21.4,
      "skor_aksesibilitas": 74,
      "alamat": "Jl. Raya Gentong No. 45, Kadipaten, Kabupaten Tasikmalaya",
      "deskripsi": "Fasilitas pengawasan muatan di lereng tanjakan Gentong, titik krusial keselamatan jalur logistik angkutan barang koridor selatan Jabar."
    },
    {
      "id": "NODE-26",
      "nama": "UPPKB Cibaragalan (JT004)",
      "kategori": "uppkb",
      "kategori_label": "UPPKB Penimbangan",
      "kabupaten": "Kabupaten Purwakarta",
      "lat": -6.48625,
      "lng": 107.45892,
      "status": "Aktif",
      "koneksi_moda": ["Akses Tol Purbaleunyi", "Kawasan Industri Purwakarta"],
      "hub_terdekat": "Stasiun Purwakarta (8.2 km)",
      "jarak_hub_km": 8.2,
      "skor_aksesibilitas": 84,
      "alamat": "Jl. Raya Ciganea, Babakancikao, Kabupaten Purwakarta",
      "deskripsi": "Fasilitas penimbangan angkutan barang penyangga arus angkutan tambang, semen, dan manufaktur koridor Bandung-Jakarta."
    },
    {
      "id": "NODE-27",
      "nama": "UPPKB Tomo (JT005)",
      "kategori": "uppkb",
      "kategori_label": "UPPKB Penimbangan",
      "kabupaten": "Kabupaten Sumedang",
      "lat": -6.77258,
      "lng": 108.14081,
      "status": "Aktif",
      "koneksi_moda": ["Jalur Logistik Tengah", "Arteri Bandung-Cirebon"],
      "hub_terdekat": "Bandara BIJB Kertajati (18.6 km)",
      "jarak_hub_km": 18.6,
      "skor_aksesibilitas": 79,
      "alamat": "Jl. Raya Cirebon-Bandung KM 78, Tomo, Kabupaten Sumedang",
      "deskripsi": "Fasilitas penimbangan jalur tengah Jawa Barat di bantaran Sungai Cimanuk yang menghubungkan wilayah Priangan dengan Cirebon Raya."
    },
    {
      "id": "NODE-28",
      "nama": "UPPKB Kemang (JT006)",
      "kategori": "uppkb",
      "kategori_label": "UPPKB Penimbangan",
      "kabupaten": "Kabupaten Bogor",
      "lat": -6.50241,
      "lng": 106.74812,
      "status": "Aktif",
      "koneksi_moda": ["Jalur Logistik Parung-Bogor", "Kawasan Tambang Rumpin"],
      "hub_terdekat": "Stasiun Bojonggede (9.4 km)",
      "jarak_hub_km": 9.4,
      "skor_aksesibilitas": 83,
      "alamat": "Jl. Raya Parung-Bogor KM 42, Kemang, Kabupaten Bogor",
      "deskripsi": "Fasilitas penimbangan utama koridor Bogor-Tangerang-Jakarta yang mengawasi angkutan material tambang galian C dan logistik komersial."
    },
    {
      "id": "NODE-29",
      "nama": "Stasiun Bandung",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Bandung",
      "lat": -6.9142,
      "lng": 107.6025,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota", "Commuter Line Bandung Raya", "KA Feeder Whoosh", "Trans Metro Pasundan", "Angkot"],
      "hub_terdekat": "Terminal Leuwipanjang (4.2 km) / Bandara Husein (3.2 km)",
      "jarak_hub_km": 3.2,
      "skor_aksesibilitas": 98,
      "alamat": "Jl. Kebon Kawung No. 43, Pasirkaliki, Cicendo, Kota Bandung",
      "deskripsi": "Stasiun kereta api induk Kota Bandung dan simpul sentral integrasi KA Feeder Whoosh, kereta antarkota kelas eksekutif, dan Commuter Line Bandung Raya."
    },
    {
      "id": "NODE-30",
      "nama": "Stasiun Kiaracondong",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Bandung",
      "lat": -6.9248,
      "lng": 107.6468,
      "status": "Aktif",
      "koneksi_moda": ["KA Jarak Jauh PSO", "Commuter Line Bandung Raya", "Angkot"],
      "hub_terdekat": "Terminal Cicaheum (3.5 km)",
      "jarak_hub_km": 3.5,
      "skor_aksesibilitas": 90,
      "alamat": "Jl. Jembatan Opat, Kiaracondong, Kota Bandung",
      "deskripsi": "Stasiun terminus keberangkatan kereta api ekonomi antarkota lintas selatan Jawa serta titik henti strategis Commuter Line Bandung Raya sisi timur."
    },
    {
      "id": "NODE-31",
      "nama": "Stasiun Cimahi",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Cimahi",
      "lat": -6.8856,
      "lng": 107.5365,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota", "Commuter Line Bandung Raya", "KA Feeder Whoosh", "Angkot Cimahi"],
      "hub_terdekat": "Stasiun Padalarang KCIC (7.8 km)",
      "jarak_hub_km": 7.8,
      "skor_aksesibilitas": 92,
      "alamat": "Jl. Stasiun Cimahi, Baros, Cimahi Tengah, Kota Cimahi",
      "deskripsi": "Stasiun persinggahan kereta api utama Kota Cimahi dengan layanan integrasi KA Feeder KCIC Padalarang-Bandung dan perhentian kereta jarak jauh."
    },
    {
      "id": "NODE-32",
      "nama": "Stasiun Padalarang KCIC & KAI",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kabupaten Bandung Barat",
      "lat": -6.8415,
      "lng": 107.4802,
      "status": "Aktif",
      "koneksi_moda": ["Kereta Cepat Whoosh", "KA Feeder Whoosh", "Commuter Line Bandung Raya", "Bus Trans Metro Pasundan"],
      "hub_terdekat": "Terminal Tagog Padalarang (0.6 km)",
      "jarak_hub_km": 0.6,
      "skor_aksesibilitas": 99,
      "alamat": "Jl. Cihaliwung, Kertajaya, Padalarang, Kabupaten Bandung Barat",
      "deskripsi": "Hub intermodal paling mutakhir di Jawa Barat, memadukan stasiun Kereta Cepat Whoosh Jakarta-Bandung dengan dedicated platform KA Feeder KAI dalam hitungan detik."
    },
    {
      "id": "NODE-33",
      "nama": "Stasiun Tegalluar KCIC",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kabupaten Bandung",
      "lat": -6.9664,
      "lng": 107.7123,
      "status": "Aktif",
      "koneksi_moda": ["Kereta Cepat Whoosh", "Shuttle DAMRI Cileunyi", "Feeder Summarecon", "Akses Tol KM 149/151"],
      "hub_terdekat": "Terminal Tipe B Cileunyi (4.5 km)",
      "jarak_hub_km": 4.5,
      "skor_aksesibilitas": 94,
      "alamat": "Cibiru Hilir, Cileunyi / Tegalluar, Bojongsoang, Kabupaten Bandung",
      "deskripsi": "Stasiun terminus timur Kereta Cepat Whoosh dengan fasilitas depo utama, didukung armada shuttle terintegrasi menuju koridor Cileunyi dan Kota Bandung."
    },
    {
      "id": "NODE-34",
      "nama": "Stasiun Karawang KCIC",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kabupaten Karawang",
      "lat": -6.3682,
      "lng": 107.2845,
      "status": "Aktif",
      "koneksi_moda": ["Kereta Cepat Whoosh", "Shuttle Kawasan Industri", "Akses Tol Jakarta-Cikampek"],
      "hub_terdekat": "Terminal Tipe A Klari (8.9 km)",
      "jarak_hub_km": 8.9,
      "skor_aksesibilitas": 89,
      "alamat": "Wanakerta, Telukjambe Barat, Kabupaten Karawang",
      "deskripsi": "Stasiun Kereta Cepat Whoosh yang dipersiapkan khusus melayani mobilitas eksekutif dan ekspatriat klaster industri manufaktur KIIC Karawang."
    },
    {
      "id": "NODE-35",
      "nama": "Stasiun Bogor",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Bogor",
      "lat": -6.5962,
      "lng": 106.7904,
      "status": "Aktif",
      "koneksi_moda": ["KRL Commuter Line Bogor", "KA Pangrango Sukabumi", "BisKita Trans Pakuan", "Angkot"],
      "hub_terdekat": "Terminal Baranangsiang (2.8 km)",
      "jarak_hub_km": 2.8,
      "skor_aksesibilitas": 97,
      "alamat": "Jl. Nyi Raja Permas, Cibogor, Bogor Tengah, Kota Bogor",
      "deskripsi": "Salah satu stasiun dengan volume penumpang harian tertinggi di Indonesia, menghubungkan jutaan komuter Bogor-Jakarta serta terminus KA Pangrango Sukabumi."
    },
    {
      "id": "NODE-36",
      "nama": "Stasiun Bekasi",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Bekasi",
      "lat": -6.2361,
      "lng": 106.9996,
      "status": "Aktif",
      "koneksi_moda": ["KRL Commuter Line Cikarang", "KA Antarkota", "Trans Patriot", "Angkot"],
      "hub_terdekat": "Terminal Kota Bekasi (2.2 km)",
      "jarak_hub_km": 2.2,
      "skor_aksesibilitas": 96,
      "alamat": "Jl. Ir. H. Juanda, Duren Jaya, Bekasi Timur, Kota Bekasi",
      "deskripsi": "Simpul perkeretaapian komuter dan kereta jarak jauh utama Kota Bekasi yang melayani koridor barat-timur Megapolitan Jabodetabek."
    },
    {
      "id": "NODE-37",
      "nama": "Stasiun Cikarang",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kabupaten Bekasi",
      "lat": -6.2554,
      "lng": 107.1517,
      "status": "Aktif",
      "koneksi_moda": ["KRL Commuter Line Cikarang", "KA Lokal Jatiluhur/Walahar", "KA Antarkota", "Terminal Cikarang"],
      "hub_terdekat": "Terminal Tipe B Cikarang (0.3 km)",
      "jarak_hub_km": 0.3,
      "skor_aksesibilitas": 96,
      "alamat": "Jl. Stasiun Cikarang, Karangasih, Cikarang Utara, Kabupaten Bekasi",
      "deskripsi": "Stasiun terminus timur elektrifikasi KRL Commuter Line Jabodetabek, menghubungkan kereta lokal Pantura dengan bus antarkota di Terminal Cikarang."
    },
    {
      "id": "NODE-38",
      "nama": "Stasiun Cirebon Kejaksan",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Cirebon",
      "lat": -6.7058,
      "lng": 108.5557,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota Eksekutif/Bisnis", "Trans Cirebon", "Angkot Lokal", "Taksi"],
      "hub_terdekat": "Pelabuhan Cirebon (2.3 km) / Terminal Harjamukti (5.1 km)",
      "jarak_hub_km": 2.3,
      "skor_aksesibilitas": 95,
      "alamat": "Jl. Siliwangi, Kebonbaru, Kejaksan, Kota Cirebon",
      "deskripsi": "Stasiun induk percabangan utama jalur ganda kereta api lintas utara (Semarang-Surabaya) dan lintas tengah/selatan (Purwokerto-Yogyakarta)."
    },
    {
      "id": "NODE-39",
      "nama": "Stasiun Cirebon Prujakan",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Cirebon",
      "lat": -6.7212,
      "lng": 108.5614,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota Ekonomi", "KA Barang Petikemas", "Angkot", "Truk Logistik"],
      "hub_terdekat": "Pelabuhan Cirebon (1.8 km)",
      "jarak_hub_km": 1.8,
      "skor_aksesibilitas": 92,
      "alamat": "Jl. Nyi Mas Gandasari, Pekalangan, Pekalipan, Kota Cirebon",
      "deskripsi": "Pusat angkutan barang dan kereta penumpang ekonomi Cirebon Raya, memiliki koneksi langsung penanganan peti kemas dengan Pelabuhan Cirebon."
    },
    {
      "id": "NODE-40",
      "nama": "Stasiun Tasikmalaya",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Tasikmalaya",
      "lat": -7.3235,
      "lng": 108.2238,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota Jalur Selatan", "Angkot Kota Tasikmalaya"],
      "hub_terdekat": "Terminal Indihiang (3.7 km)",
      "jarak_hub_km": 3.7,
      "skor_aksesibilitas": 87,
      "alamat": "Jl. Stasiun No. 1, Tawangsari, Tawang, Kota Tasikmalaya",
      "deskripsi": "Stasiun perkeretaapian utama koridor Priangan Timur yang melayani seluruh pemberhentian KA eksekutif, bisnis, dan ekonomi rute Bandung-Kroya-Surabaya."
    },
    {
      "id": "NODE-41",
      "nama": "Stasiun Banjar",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Banjar",
      "lat": -7.3712,
      "lng": 108.5412,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota Jalur Selatan", "Feeder Terminal Banjar", "Angkot"],
      "hub_terdekat": "Terminal Tipe A Banjar (0.7 km)",
      "jarak_hub_km": 0.7,
      "skor_aksesibilitas": 89,
      "alamat": "Jl. Stasiun Banjar, Hegarsari, Pataruman, Kota Banjar",
      "deskripsi": "Stasiun perbatasan timur DAOP 2 Bandung dengan fasilitas pergantian kru KA jalur selatan serta integrasi jalan kaki menuju Terminal Tipe A Banjar."
    },
    {
      "id": "NODE-42",
      "nama": "Stasiun Sukabumi",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kota Sukabumi",
      "lat": -6.9284,
      "lng": 106.9298,
      "status": "Aktif",
      "koneksi_moda": ["KA Pangrango (Bogor-Sukabumi)", "KA Siliwangi (Sukabumi-Cipatat)", "Angkot"],
      "hub_terdekat": "Terminal KH Ahmad Sanusi (2.4 km)",
      "jarak_hub_km": 2.4,
      "skor_aksesibilitas": 86,
      "alamat": "Jl. Stasiun Barat No. 2, Gunungparang, Cikole, Kota Sukabumi",
      "deskripsi": "Simpul terminus rel KA Pangrango dan titik awal KA Perintis Siliwangi menuju Cianjur dan Cipatat, menghubungkan wilayah pegunungan Sukabumi."
    },
    {
      "id": "NODE-43",
      "nama": "Stasiun Purwakarta",
      "kategori": "stasiun_ka",
      "kategori_label": "Stasiun KA & Whoosh",
      "kabupaten": "Kabupaten Purwakarta",
      "lat": -6.5543,
      "lng": 107.4452,
      "status": "Aktif",
      "koneksi_moda": ["KA Antarkota", "Commuter Line Garut/Cibatuan", "Commuter Line Walahar", "Angkot"],
      "hub_terdekat": "UPPKB Cibaragalan (8.2 km)",
      "jarak_hub_km": 8.2,
      "skor_aksesibilitas": 87,
      "alamat": "Jl. Kolonel Kornel Singawinata No. 1, Nagritengah, Purwakarta",
      "deskripsi": "Stasiun bersejarah titik temu koridor kereta api Jakarta-Bandung dengan percabangan jalur kereta api menuju Cikampek dan Cirebon."
    },
    {
      "id": "NODE-44",
      "nama": "Bandara Internasional Kertajati (BIJB / KJT)",
      "kategori": "bandara",
      "kategori_label": "Bandara Udara",
      "kabupaten": "Kabupaten Majalengka",
      "lat": -6.6508,
      "lng": 108.1706,
      "status": "Aktif",
      "koneksi_moda": ["Penerbangan Domestik/Internasional", "Bus Antarmoda DAMRI", "Travel Shuttle", "Akses Tol Cisumdawu"],
      "hub_terdekat": "Terminal Ciakar Sumedang (34.0 km) / UPPKB Tomo (18.6 km)",
      "jarak_hub_km": 18.6,
      "skor_aksesibilitas": 88,
      "alamat": "Jl. Kertajati-Kadipaten, Bantarjati, Kertajati, Kabupaten Majalengka",
      "deskripsi": "Bandar udara terbesar di Jawa Barat dan pintu gerbang udara kawasan metropolitan Rebana, terhubung langsung melalui jaringan bus antarmoda dari 10 kota Jawa Barat."
    },
    {
      "id": "NODE-45",
      "nama": "Bandara Husein Sastranegara (BDO)",
      "kategori": "bandara",
      "kategori_label": "Bandara Udara",
      "kabupaten": "Kota Bandung",
      "lat": -6.9006,
      "lng": 107.5761,
      "status": "Aktif",
      "koneksi_moda": ["Penerbangan Propeller/Charter", "Taksi Bandara", "Angkot", "Feeder Kereta"],
      "hub_terdekat": "Stasiun Bandung (3.2 km)",
      "jarak_hub_km": 3.2,
      "skor_aksesibilitas": 91,
      "alamat": "Jl. Pajajaran No. 156, Husein Sastranegara, Cicendo, Kota Bandung",
      "deskripsi": "Bandara di jantung Kota Bandung yang melayani rute komersial pesawat baling-baling (propeller), VIP/VVIP, dan fasilitas pertahanan/kedirgantaraan PTDI."
    },
    {
      "id": "NODE-46",
      "nama": "Pelabuhan Internasional Patimban",
      "kategori": "pelabuhan",
      "kategori_label": "Pelabuhan Laut",
      "kabupaten": "Kabupaten Subang",
      "lat": -6.2422,
      "lng": 107.9042,
      "status": "Aktif",
      "koneksi_moda": ["Kapal Ro-Ro Ekspor Kendaraan", "Petikemas Curah", "Akses Jalan Tol Patimban", "Jalur Arteri Pantura"],
      "hub_terdekat": "UPPKB Balonggandu (38.5 km) / Terminal Subang (38.5 km)",
      "jarak_hub_km": 38.5,
      "skor_aksesibilitas": 86,
      "alamat": "Desa Patimban, Kec. Pusakanagara, Kabupaten Subang",
      "deskripsi": "Pelabuhan laut dalam berstandar internasional yang menjadi episentrum logistik ekspor otomotif nasional dan gerbang maritim Segitiga Rebana."
    },
    {
      "id": "NODE-47",
      "nama": "Pelabuhan Cirebon",
      "kategori": "pelabuhan",
      "kategori_label": "Pelabuhan Laut",
      "kabupaten": "Kota Cirebon",
      "lat": -6.7161,
      "lng": 108.5756,
      "status": "Aktif",
      "koneksi_moda": ["Pelayaran Rakyat & Nusantara", "Bongkar Muat Curah & Batubara", "Stasiun Prujakan Rail Link", "Truk Barang"],
      "hub_terdekat": "Stasiun Cirebon Prujakan (1.8 km)",
      "jarak_hub_km": 1.8,
      "skor_aksesibilitas": 89,
      "alamat": "Jl. Perniagaan No. 4, Lemahwungkuk, Kota Cirebon",
      "deskripsi": "Pelabuhan laut tertua dan simpul logistik maritim Pantura timur Jawa Barat, terintegrasi dengan jaringan kereta api barang dan jalur distribusi semen/mineral."
    }
  ],
  "intermodal_corridors": [
    {
      "id": "CORR-01",
      "nama": "Padalarang Multimodal Hub",
      "origin_node": "NODE-32",
      "destination_node": "NODE-29",
      "origin_nama": "Stasiun Padalarang KCIC",
      "destination_nama": "Stasiun Bandung KAI",
      "jarak_km": 0.2,
      "waktu_tempuh_menit": 18,
      "moda_integrasi": "Dedicated KA Feeder Whoosh",
      "frekuensi_harian": 48,
      "tingkat_kemudahan": "Sangat Tinggi",
      "deskripsi": "Integrasi antarmoda perkeretaapian tercepat di Indonesia; perpindahan penumpang Kereta Cepat Whoosh ke KA Feeder menuju pusat kota Bandung dalam platform yang sama."
    },
    {
      "id": "CORR-02",
      "nama": "Tegalluar - Cileunyi Transit",
      "origin_node": "NODE-33",
      "destination_node": "NODE-14",
      "origin_nama": "Stasiun Tegalluar KCIC",
      "destination_nama": "Terminal Cileunyi",
      "jarak_km": 4.5,
      "waktu_tempuh_menit": 12,
      "moda_integrasi": "Shuttle DAMRI / Bus Feeder",
      "frekuensi_harian": 32,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Koneksi pengumpan penumpang Whoosh dari wilayah Priangan Timur (Sumedang, Garut, Tasikmalaya) melalui gerbang simpul Terminal Cileunyi."
    },
    {
      "id": "CORR-03",
      "nama": "Leuwipanjang - Stasiun Bandung Link",
      "origin_node": "NODE-01",
      "destination_node": "NODE-29",
      "origin_nama": "Terminal Leuwipanjang",
      "destination_nama": "Stasiun Bandung",
      "jarak_km": 4.2,
      "waktu_tempuh_menit": 15,
      "moda_integrasi": "Trans Metro Pasundan Koridor 2 & 3",
      "frekuensi_harian": 64,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Koridor BRT penghubung terminal bus antarkota terbesar Bandung dengan stasiun induk kereta api Jawa Barat."
    },
    {
      "id": "CORR-04",
      "nama": "Baranangsiang - Stasiun Bogor Multimodal",
      "origin_node": "NODE-02",
      "destination_node": "NODE-35",
      "origin_nama": "Terminal Baranangsiang",
      "destination_nama": "Stasiun Bogor",
      "jarak_km": 2.8,
      "waktu_tempuh_menit": 10,
      "moda_integrasi": "BisKita Trans Pakuan Koridor 1 & 2",
      "frekuensi_harian": 72,
      "tingkat_kemudahan": "Sangat Tinggi",
      "deskripsi": "Jalur transfer utama penumpang bus antarkota menuju jaringan KRL Commuter Line Jabodetabek di Kota Bogor."
    },
    {
      "id": "CORR-05",
      "nama": "Cikarang Integrated Hub",
      "origin_node": "NODE-13",
      "destination_node": "NODE-37",
      "origin_nama": "Terminal Cikarang",
      "destination_nama": "Stasiun Cikarang",
      "jarak_km": 0.3,
      "waktu_tempuh_menit": 4,
      "moda_integrasi": "Pedestrian Link & Angkot Feeder",
      "frekuensi_harian": 90,
      "tingkat_kemudahan": "Sangat Tinggi",
      "deskripsi": "Simpul intermodal kompak di pusat industri Cikarang yang menghubungkan terminal bus AKDP dengan stasiun terminus KRL Jabodetabek."
    },
    {
      "id": "CORR-06",
      "nama": "Kertajati Aero-Intermodal (Ciakar Link)",
      "origin_node": "NODE-44",
      "destination_node": "NODE-04",
      "origin_nama": "Bandara BIJB Kertajati",
      "destination_nama": "Terminal Ciakar Sumedang",
      "jarak_km": 34.0,
      "waktu_tempuh_menit": 35,
      "moda_integrasi": "Bus Antarmoda DAMRI / Tol Cisumdawu",
      "frekuensi_harian": 16,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Konektivitas udara-darat mengandalkan jalan tol Cisumdawu yang memangkas waktu tempuh dari Priangan menuju Bandara Internasional Kertajati."
    },
    {
      "id": "CORR-07",
      "nama": "Patimban Sea-Land Logistics",
      "origin_node": "NODE-46",
      "destination_node": "NODE-23",
      "origin_nama": "Pelabuhan Patimban",
      "destination_nama": "UPPKB Balonggandu",
      "jarak_km": 38.5,
      "waktu_tempuh_menit": 45,
      "moda_integrasi": "Arteri Pantura & Tol Akses Patimban",
      "frekuensi_harian": 120,
      "tingkat_kemudahan": "Sedang",
      "deskripsi": "Koridor pengawasan muatan logistik ekspor-impor otomotif dan kontainer dari kawasan industri Karawang-Bekasi menuju pelabuhan laut Patimban."
    },
    {
      "id": "CORR-08",
      "nama": "Harjamukti - Kejaksan Hub",
      "origin_node": "NODE-11",
      "destination_node": "NODE-38",
      "origin_nama": "Terminal Harjamukti",
      "destination_nama": "Stasiun Cirebon Kejaksan",
      "jarak_km": 5.1,
      "waktu_tempuh_menit": 14,
      "moda_integrasi": "BRT Trans Cirebon Koridor 1",
      "frekuensi_harian": 36,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Penghubung utama armada bus AKAP Pantura dengan simpul kereta api eksekutif Cirebon Kejaksan."
    },
    {
      "id": "CORR-09",
      "nama": "Karawang Whoosh - Klari Corridor",
      "origin_node": "NODE-34",
      "destination_node": "NODE-08",
      "origin_nama": "Stasiun Karawang KCIC",
      "destination_nama": "Terminal Klari",
      "jarak_km": 8.9,
      "waktu_tempuh_menit": 20,
      "moda_integrasi": "Shuttle Kawasan Industri & Bus AKAP",
      "frekuensi_harian": 24,
      "tingkat_kemudahan": "Sedang",
      "deskripsi": "Jalur integrasi penumpang kereta cepat dengan kawasan industri KIIC/Suryacipta dan terminal bus Klari Karawang."
    },
    {
      "id": "CORR-10",
      "nama": "Indihiang - Stasiun Tasikmalaya Link",
      "origin_node": "NODE-07",
      "destination_node": "NODE-40",
      "origin_nama": "Terminal Indihiang",
      "destination_nama": "Stasiun Tasikmalaya",
      "jarak_km": 3.7,
      "waktu_tempuh_menit": 12,
      "moda_integrasi": "Angkutan Feeder Kota & Perintis",
      "frekuensi_harian": 40,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Jaringan transfer penumpang bus jalur selatan menuju layanan perkeretaapian antarkota Tasikmalaya."
    },
    {
      "id": "CORR-11",
      "nama": "Husein Sastranegara - Stasiun Bandung",
      "origin_node": "NODE-45",
      "destination_node": "NODE-29",
      "origin_nama": "Bandara Husein Sastranegara",
      "destination_nama": "Stasiun Bandung",
      "jarak_km": 3.2,
      "waktu_tempuh_menit": 10,
      "moda_integrasi": "Angkutan Feeder Khusus Bandara",
      "frekuensi_harian": 20,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Akses transit jarak pendek antara bandara udara perkotaan Bandung dengan stasiun kereta api sentral."
    },
    {
      "id": "CORR-12",
      "nama": "Sukabumi Sanusi - Stasiun Sukabumi",
      "origin_node": "NODE-05",
      "destination_node": "NODE-42",
      "origin_nama": "Terminal KH. Ahmad Sanusi",
      "destination_nama": "Stasiun Sukabumi",
      "jarak_km": 2.4,
      "waktu_tempuh_menit": 8,
      "moda_integrasi": "Angkot Feeder & Bus Perintis",
      "frekuensi_harian": 30,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Koneksi antarmoda terminal bus AKAP/perintis dengan KA Pangrango (rute Sukabumi-Bogor) dan KA Siliwangi."
    },
    {
      "id": "CORR-13",
      "nama": "Banjar Intermodal Cross-Border",
      "origin_node": "NODE-09",
      "destination_node": "NODE-41",
      "origin_nama": "Terminal Banjar",
      "destination_nama": "Stasiun Banjar",
      "jarak_km": 0.7,
      "waktu_tempuh_menit": 5,
      "moda_integrasi": "Feeder Bus Perintis & Jalan Kaki",
      "frekuensi_harian": 28,
      "tingkat_kemudahan": "Sangat Tinggi",
      "deskripsi": "Konektivitas jalan raya dan rel kereta api terdekat di Jawa Barat tenggara dengan jarak transfer hanya 700 meter."
    },
    {
      "id": "CORR-14",
      "nama": "Pelabuhan Cirebon - Prujakan Rail Cargo",
      "origin_node": "NODE-47",
      "destination_node": "NODE-39",
      "origin_nama": "Pelabuhan Cirebon",
      "destination_nama": "Stasiun Cirebon Prujakan",
      "jarak_km": 1.8,
      "waktu_tempuh_menit": 6,
      "moda_integrasi": "Truk Kontainer & Rel Petikemas",
      "frekuensi_harian": 50,
      "tingkat_kemudahan": "Tinggi",
      "deskripsi": "Integrasi logistik maritim dan jalur rel KA barang untuk distribusi muatan semen, batubara, dan barang curah."
    }
  ],
  "regional_indices": [
    { "kabupaten": "Kota Bandung", "jumlah_simpul": 4, "simpul_list": ["Terminal Leuwipanjang", "Stasiun Bandung", "Stasiun Kiaracondong", "Bandara Husein"], "ragam_moda": 3, "rata_jarak_km": 2.8, "skor_indeks": 96, "kategori": "Sangat Tinggi" },
    { "kabupaten": "Kota Bogor", "jumlah_simpul": 2, "simpul_list": ["Terminal Baranangsiang", "Stasiun Bogor"], "ragam_moda": 2, "rata_jarak_km": 2.8, "skor_indeks": 93, "kategori": "Sangat Tinggi" },
    { "kabupaten": "Kota Cirebon", "jumlah_simpul": 4, "simpul_list": ["Terminal Harjamukti", "Stasiun Cirebon Kejaksan", "Stasiun Cirebon Prujakan", "Pelabuhan Cirebon"], "ragam_moda": 3, "rata_jarak_km": 2.6, "skor_indeks": 94, "kategori": "Sangat Tinggi" },
    { "kabupaten": "Kabupaten Bandung Barat", "jumlah_simpul": 1, "simpul_list": ["Stasiun Padalarang KCIC & KAI"], "ragam_moda": 2, "rata_jarak_km": 0.5, "skor_indeks": 91, "kategori": "Sangat Tinggi" },
    { "kabupaten": "Kabupaten Bekasi", "jumlah_simpul": 2, "simpul_list": ["Terminal Cikarang", "Stasiun Cikarang"], "ragam_moda": 2, "rata_jarak_km": 0.3, "skor_indeks": 92, "kategori": "Sangat Tinggi" },
    { "kabupaten": "Kota Banjar", "jumlah_simpul": 2, "simpul_list": ["Terminal Banjar", "Stasiun Banjar"], "ragam_moda": 2, "rata_jarak_km": 0.7, "skor_indeks": 89, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Bandung", "jumlah_simpul": 3, "simpul_list": ["Terminal Cileunyi", "Terminal Majalaya", "Stasiun Tegalluar KCIC"], "ragam_moda": 2, "rata_jarak_km": 4.5, "skor_indeks": 88, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Karawang", "jumlah_simpul": 3, "simpul_list": ["Terminal Klari", "UPPKB Balonggandu", "Stasiun Karawang KCIC"], "ragam_moda": 3, "rata_jarak_km": 6.8, "skor_indeks": 87, "kategori": "Tinggi" },
    { "kabupaten": "Kota Tasikmalaya", "jumlah_simpul": 2, "simpul_list": ["Terminal Indihiang", "Stasiun Tasikmalaya"], "ragam_moda": 2, "rata_jarak_km": 3.7, "skor_indeks": 86, "kategori": "Tinggi" },
    { "kabupaten": "Kota Sukabumi", "jumlah_simpul": 2, "simpul_list": ["Terminal KH. Ahmad Sanusi", "Stasiun Sukabumi"], "ragam_moda": 2, "rata_jarak_km": 2.4, "skor_indeks": 85, "kategori": "Tinggi" },
    { "kabupaten": "Kota Bekasi", "jumlah_simpul": 1, "simpul_list": ["Stasiun Bekasi"], "ragam_moda": 1, "rata_jarak_km": 2.2, "skor_indeks": 86, "kategori": "Tinggi" },
    { "kabupaten": "Kota Cimahi", "jumlah_simpul": 1, "simpul_list": ["Stasiun Cimahi"], "ragam_moda": 1, "rata_jarak_km": 3.4, "skor_indeks": 84, "kategori": "Tinggi" },
    { "kabupaten": "Kota Depok", "jumlah_simpul": 1, "simpul_list": ["Terminal Jatijajar"], "ragam_moda": 1, "rata_jarak_km": 4.8, "skor_indeks": 83, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Subang", "jumlah_simpul": 2, "simpul_list": ["Terminal Subang", "Pelabuhan Patimban"], "ragam_moda": 2, "rata_jarak_km": 14.5, "skor_indeks": 82, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Majalengka", "jumlah_simpul": 1, "simpul_list": ["Bandara Internasional Kertajati"], "ragam_moda": 1, "rata_jarak_km": 18.6, "skor_indeks": 81, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Sumedang", "jumlah_simpul": 2, "simpul_list": ["Terminal Ciakar", "UPPKB Tomo"], "ragam_moda": 2, "rata_jarak_km": 12.4, "skor_indeks": 80, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Purwakarta", "jumlah_simpul": 2, "simpul_list": ["UPPKB Cibaragalan", "Stasiun Purwakarta"], "ragam_moda": 2, "rata_jarak_km": 8.2, "skor_indeks": 81, "kategori": "Tinggi" },
    { "kabupaten": "Kabupaten Bogor", "jumlah_simpul": 3, "simpul_list": ["Terminal Leuwiliang", "Terminal Cileungsi", "UPPKB Kemang"], "ragam_moda": 2, "rata_jarak_km": 11.2, "skor_indeks": 79, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Cirebon", "jumlah_simpul": 2, "simpul_list": ["Terminal Sumber", "Terminal Ciledug"], "ragam_moda": 1, "rata_jarak_km": 9.5, "skor_indeks": 77, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Garut", "jumlah_simpul": 2, "simpul_list": ["Terminal Guntur Melati", "Terminal Pameungpeuk"], "ragam_moda": 1, "rata_jarak_km": 16.8, "skor_indeks": 75, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Tasikmalaya", "jumlah_simpul": 2, "simpul_list": ["Terminal Singaparna", "UPPKB Gentong"], "ragam_moda": 2, "rata_jarak_km": 14.2, "skor_indeks": 76, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Kuningan", "jumlah_simpul": 1, "simpul_list": ["Terminal Kertawangunan"], "ragam_moda": 1, "rata_jarak_km": 18.5, "skor_indeks": 74, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Cianjur", "jumlah_simpul": 1, "simpul_list": ["Terminal Rawabango"], "ragam_moda": 1, "rata_jarak_km": 15.0, "skor_indeks": 73, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Indramayu", "jumlah_simpul": 1, "simpul_list": ["UPPKB Losarang"], "ragam_moda": 1, "rata_jarak_km": 22.0, "skor_indeks": 72, "kategori": "Sedang" },
    { "kabupaten": "Kabupaten Ciamis", "jumlah_simpul": 0, "simpul_list": [], "ragam_moda": 1, "rata_jarak_km": 14.5, "skor_indeks": 68, "kategori": "Terbatas" },
    { "kabupaten": "Kabupaten Sukabumi", "jumlah_simpul": 0, "simpul_list": [], "ragam_moda": 1, "rata_jarak_km": 24.5, "skor_indeks": 66, "kategori": "Terbatas" },
    { "kabupaten": "Kabupaten Pangandaran", "jumlah_simpul": 0, "simpul_list": [], "ragam_moda": 1, "rata_jarak_km": 38.0, "skor_indeks": 62, "kategori": "Terbatas" }
  ]
};

// Global App State
var connectivityData = CONNECTIVITY_EMBEDDED_DATA;
var mapInstance = null;
var markersLayerGroup = null;
var corridorsLayerGroup = null;
var nodeMarkers = {};
var corridorPolylines = {};
var activeCategoryFilters = new Set(["terminal_a", "terminal_b", "uppkb", "stasiun_ka", "bandara", "pelabuhan"]);
var previousActiveElement = null;

// Color mapping per mode
var CATEGORY_COLORS = {
  "terminal_a": "#3b82f6",
  "terminal_b": "#10b981",
  "uppkb": "#f59e0b",
  "stasiun_ka": "#8b5cf6",
  "bandara": "#ef4444",
  "pelabuhan": "#06b6d4"
};

/**
 * Format numbers with Indonesian locale
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Number(num).toLocaleString("id-ID");
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
  var s = connectivityData.summary || {};
  var totalNodesEl = document.getElementById("kpiTotalNodes");
  var totalCorridorsEl = document.getElementById("kpiTotalCorridors");
  var avgDistanceEl = document.getElementById("kpiAvgDistance");
  var totalRegionsEl = document.getElementById("kpiTotalRegions");

  if (totalNodesEl) {
    totalNodesEl.textContent = (connectivityData.nodes ? connectivityData.nodes.length : 47) + " Simpul";
  }
  if (totalCorridorsEl) {
    totalCorridorsEl.textContent = (connectivityData.intermodal_corridors ? connectivityData.intermodal_corridors.length : 14) + " Koridor";
  }
  if (avgDistanceEl) {
    avgDistanceEl.textContent = "3,8 km";
  }
  if (totalRegionsEl) {
    totalRegionsEl.textContent = (connectivityData.regional_indices ? connectivityData.regional_indices.length : 27) + " Wilayah";
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
      showMapError("Pustaka peta (Leaflet) tidak dapat dimuat dari CDN. Silakan periksa koneksi internet Anda.");
    }
  }

  check();
}

function showMapLoading(msg) {
  var mapEl = document.getElementById("connectivityMap");
  if (!mapEl) return;
  var existing = mapEl.querySelector(".map-status-overlay");
  if (existing) existing.remove();

  var overlay = document.createElement("div");
  overlay.className = "map-status-overlay";
  overlay.id = "mapLoadingOverlay";
  overlay.innerHTML =
    '<div class="map-status-spinner"></div>' +
    '<p class="map-status-msg">' + (msg || "Memuat peta simpul multimoda...") + '</p>';
  mapEl.appendChild(overlay);
}

function hideMapStatus() {
  var overlay = document.getElementById("mapLoadingOverlay");
  if (overlay) overlay.remove();
}

function showMapError(errMsg) {
  var mapEl = document.getElementById("connectivityMap");
  if (!mapEl) return;
  hideMapStatus();
  var errEl = document.createElement("div");
  errEl.className = "map-status-overlay";
  errEl.style.borderColor = "#f87171";
  errEl.innerHTML = '<span style="color:#f87171; font-weight:700;">Gagal:</span> ' + errMsg;
  mapEl.appendChild(errEl);
}

/**
 * SVG Icons per Category
 */
function getCategoryIconSvg(kategori) {
  if (kategori === "terminal_a" || kategori === "terminal_b") {
    return '<svg class="marker-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
  }
  if (kategori === "uppkb") {
    return '<svg class="marker-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
  }
  if (kategori === "stasiun_ka") {
    return '<svg class="marker-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
  }
  if (kategori === "bandara") {
    return '<svg class="marker-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>';
  }
  if (kategori === "pelabuhan") {
    return '<svg class="marker-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
  }
  return '<svg class="marker-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"></circle></svg>';
}

/**
 * Initialize Leaflet Map
 */
function initMap() {
  var mapEl = document.getElementById("connectivityMap");
  if (!mapEl) return;

  showMapLoading();

  ensureLeafletLoaded(function () {
    try {
      mapInstance = L.map(mapEl, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true
      }).setView([-6.9, 107.6], 8);

      // Clean OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        minZoom: 7,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | BPTD Kelas I Jabar'
      }).addTo(mapInstance);

      corridorsLayerGroup = L.layerGroup().addTo(mapInstance);
      markersLayerGroup = L.layerGroup().addTo(mapInstance);

      renderMapLayers();
      hideMapStatus();

      // Reset Map Control
      var btnReset = document.getElementById("btnResetMapView");
      if (btnReset) {
        btnReset.addEventListener("click", function () {
          mapInstance.flyTo([-6.9, 107.6], 8, { duration: 0.8 });
        });
      }

      // Mode filter toggle listeners
      initModeFilters();
    } catch (e) {
      showMapError(e.message || "Gagal menginisialisasi peta.");
    }
  });
}

/**
 * Render Markers & Corridors on Leaflet Map
 */
function renderMapLayers() {
  if (!mapInstance || !markersLayerGroup || !corridorsLayerGroup) return;

  markersLayerGroup.clearLayers();
  corridorsLayerGroup.clearLayers();
  nodeMarkers = {};
  corridorPolylines = {};

  var nodes = connectivityData.nodes || [];
  var nodeById = {};

  // Render Markers
  nodes.forEach(function (node) {
    nodeById[node.id] = node;

    // Check visibility filter
    if (!activeCategoryFilters.has(node.kategori)) return;

    var color = CATEGORY_COLORS[node.kategori] || "#3b82f6";
    var iconHtml =
      '<div class="connectivity-marker marker-' + node.kategori.replace('_', '-') + '" style="background:' + color + '; width:28px; height:28px;">' +
      getCategoryIconSvg(node.kategori) +
      '</div>';

    var customIcon = L.divIcon({
      html: iconHtml,
      className: "custom-connectivity-icon",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    var marker = L.marker([node.lat, node.lng], { icon: customIcon });

    var popupContent =
      '<div class="popup-node-card">' +
      '<span class="popup-node-category" style="background:' + color + ';">' + node.kategori_label + '</span>' +
      '<h4 class="popup-node-title">' + node.nama + '</h4>' +
      '<div class="popup-node-location">' + node.kabupaten + ' &bull; Skor: <strong>' + node.skor_aksesibilitas + '/100</strong></div>' +
      '<div class="popup-node-hub">Hub Terdekat: <strong>' + node.hub_terdekat + '</strong></div>' +
      '<button type="button" class="popup-btn-detail" onclick="window.showNodeDetail(\'' + node.id + '\')">Lihat Rincian Simpul</button>' +
      '</div>';

    marker.bindPopup(popupContent, { maxWidth: 280 });
    marker.addTo(markersLayerGroup);
    nodeMarkers[node.id] = marker;
  });

  // Render Intermodal Corridors (dashed lines)
  var corridors = connectivityData.intermodal_corridors || [];
  corridors.forEach(function (corr) {
    var origin = nodeById[corr.origin_node];
    var dest = nodeById[corr.destination_node];

    if (!origin || !dest) return;
    // Visible only if either origin or dest is enabled
    if (!activeCategoryFilters.has(origin.kategori) && !activeCategoryFilters.has(dest.kategori)) return;

    var latlngs = [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng]
    ];

    var polyline = L.polyline(latlngs, {
      color: "#2563eb",
      weight: 3,
      opacity: 0.75,
      dashArray: "6, 8",
      lineCap: "round"
    });

    var tooltipContent =
      '<strong>' + corr.nama + '</strong><br>' +
      corr.moda_integrasi + ' (' + corr.jarak_km + ' km &bull; ' + corr.waktu_tempuh_menit + ' mnt)';

    polyline.bindTooltip(tooltipContent, { sticky: true, opacity: 0.95 });
    polyline.addTo(corridorsLayerGroup);
    corridorPolylines[corr.id] = polyline;
  });
}

/**
 * Initialize Mode Filter Checkboxes
 */
function initModeFilters() {
  var chips = document.querySelectorAll(".mode-toggle-chip");
  chips.forEach(function (chip) {
    var cb = chip.querySelector(".mode-checkbox");
    if (!cb) return;

    cb.addEventListener("change", function () {
      var cat = cb.value;
      if (cb.checked) {
        activeCategoryFilters.add(cat);
        chip.classList.add("is-checked");
      } else {
        activeCategoryFilters.delete(cat);
        chip.classList.remove("is-checked");
      }
      renderMapLayers();
    });
  });
}

/**
 * Filter & Render Tab 1: Direktori 47 Simpul
 */
function renderNodeDirectoryTable() {
  var tbody = document.getElementById("nodeTableBody");
  var countEl = document.getElementById("nodeCount");
  var searchInput = document.getElementById("searchNode");
  var filterCategory = document.getElementById("filterCategory");

  if (!tbody) return;

  var q = (searchInput ? searchInput.value : "").trim().toLowerCase();
  var catFilter = filterCategory ? filterCategory.value : "ALL";

  var nodes = connectivityData.nodes || [];
  var filtered = nodes.filter(function (node) {
    if (catFilter !== "ALL" && node.kategori !== catFilter) return false;
    if (!q) return true;
    return (
      node.nama.toLowerCase().includes(q) ||
      node.kabupaten.toLowerCase().includes(q) ||
      node.kategori_label.toLowerCase().includes(q) ||
      (node.koneksi_moda && node.koneksi_moda.join(" ").toLowerCase().includes(q))
    );
  });

  if (countEl) {
    countEl.textContent = "Menampilkan " + filtered.length + " dari " + nodes.length + " simpul";
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="th-center" style="padding:2rem; color:#64748b;">Tidak ada simpul yang sesuai dengan kriteria pencarian.</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function (node, idx) {
    var badgeClass = "mode-badge mode-badge-" + node.kategori.replace('_', '-');
    var scoreColor = node.skor_aksesibilitas >= 90 ? "#10b981" : (node.skor_aksesibilitas >= 80 ? "#3b82f6" : "#f59e0b");

    html += '<tr>' +
      '<td class="th-center">' + (idx + 1) + '</td>' +
      '<td><strong>' + node.nama + '</strong></td>' +
      '<td><span class="' + badgeClass + '">' + node.kategori_label + '</span></td>' +
      '<td>' + node.kabupaten + '</td>' +
      '<td><span style="font-size:0.75rem; color:#475569;">' + node.hub_terdekat + '</span></td>' +
      '<td class="th-center"><span style="font-weight:700; color:' + scoreColor + ';">' + node.skor_aksesibilitas + '/100</span></td>' +
      '<td class="th-center">' +
      '<button type="button" class="btn-table-action" onclick="window.showNodeDetail(\'' + node.id + '\')">Detail</button>' +
      '</td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Filter & Render Tab 2: Koridor Transfer Antarmoda
 */
function renderCorridorsTable() {
  var tbody = document.getElementById("corridorTableBody");
  var countEl = document.getElementById("corridorCount");
  var searchInput = document.getElementById("searchCorridor");

  if (!tbody) return;

  var q = (searchInput ? searchInput.value : "").trim().toLowerCase();
  var corridors = connectivityData.intermodal_corridors || [];
  var filtered = corridors.filter(function (corr) {
    if (!q) return true;
    return (
      corr.nama.toLowerCase().includes(q) ||
      corr.origin_nama.toLowerCase().includes(q) ||
      corr.destination_nama.toLowerCase().includes(q) ||
      corr.moda_integrasi.toLowerCase().includes(q)
    );
  });

  if (countEl) {
    countEl.textContent = "Menampilkan " + filtered.length + " koridor transfer";
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="th-center" style="padding:2rem; color:#64748b;">Tidak ada koridor transfer yang sesuai.</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function (corr, idx) {
    var easeClass = corr.tingkat_kemudahan === "Sangat Tinggi" ? "ease-very-high" : (corr.tingkat_kemudahan === "Tinggi" ? "ease-high" : "ease-medium");

    html += '<tr>' +
      '<td class="th-center">' + (idx + 1) + '</td>' +
      '<td><strong>' + corr.nama + '</strong></td>' +
      '<td><span style="font-size:0.75rem;">' + corr.origin_nama + ' &rarr; ' + corr.destination_nama + '</span></td>' +
      '<td class="th-right"><strong>' + corr.jarak_km + '</strong></td>' +
      '<td>' + corr.moda_integrasi + '</td>' +
      '<td class="th-center">' + corr.waktu_tempuh_menit + ' menit</td>' +
      '<td class="th-center"><span class="ease-badge ' + easeClass + '">' + corr.tingkat_kemudahan + '</span></td>' +
      '<td class="th-center">' +
      '<button type="button" class="btn-table-action" onclick="window.focusCorridor(\'' + corr.id + '\')">Fokus</button>' +
      '</td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Filter & Render Tab 3: Indeks Konektivitas Wilayah (27 Kab/Kota)
 */
function renderRegionalTable() {
  var tbody = document.getElementById("regionalTableBody");
  var countEl = document.getElementById("regionalCount");
  var searchInput = document.getElementById("searchRegional");

  if (!tbody) return;

  var q = (searchInput ? searchInput.value : "").trim().toLowerCase();
  var regions = connectivityData.regional_indices || [];
  var filtered = regions.filter(function (reg) {
    if (!q) return true;
    return reg.kabupaten.toLowerCase().includes(q) || reg.kategori.toLowerCase().includes(q);
  });

  if (countEl) {
    countEl.textContent = "Menampilkan " + filtered.length + " wilayah Jawa Barat";
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="th-center" style="padding:2rem; color:#64748b;">Tidak ada wilayah yang sesuai.</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function (reg, idx) {
    var rankClass = idx === 0 ? "rank-badge-1" : (idx === 1 ? "rank-badge-2" : (idx === 2 ? "rank-badge-3" : ""));
    var barColor = reg.skor_indeks >= 90 ? "#10b981" : (reg.skor_indeks >= 80 ? "#3b82f6" : (reg.skor_indeks >= 70 ? "#f59e0b" : "#ef4444"));

    html += '<tr>' +
      '<td class="th-center"><span class="rank-badge ' + rankClass + '">' + (idx + 1) + '</span></td>' +
      '<td><strong>' + reg.kabupaten + '</strong></td>' +
      '<td class="th-center">' + reg.jumlah_simpul + ' simpul</td>' +
      '<td class="th-center">' + reg.ragam_moda + ' moda</td>' +
      '<td class="th-right">' + reg.rata_jarak_km + ' km</td>' +
      '<td>' +
      '<div class="score-bar-wrap">' +
      '<div class="score-bar-track">' +
      '<div class="score-bar-fill" style="width:' + reg.skor_indeks + '%; background:' + barColor + ';"></div>' +
      '</div>' +
      '<span class="score-bar-label" style="color:' + barColor + ';">' + reg.skor_indeks + '/100</span>' +
      '</div>' +
      '</td>' +
      '<td class="th-center"><span class="mode-badge" style="background:#f1f5f9; color:#334155;">' + reg.kategori + '</span></td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Tab Switching Controller
 */
function initTabs() {
  var tabBtns = [
    { btn: document.getElementById("btnTabDirectory"), panel: document.getElementById("panelDirectory") },
    { btn: document.getElementById("btnTabCorridors"), panel: document.getElementById("panelCorridors") },
    { btn: document.getElementById("btnTabRegional"), panel: document.getElementById("panelRegional") }
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
  var searchNode = document.getElementById("searchNode");
  if (searchNode) searchNode.addEventListener("input", renderNodeDirectoryTable);

  var filterCategory = document.getElementById("filterCategory");
  if (filterCategory) filterCategory.addEventListener("change", renderNodeDirectoryTable);

  var searchCorridor = document.getElementById("searchCorridor");
  if (searchCorridor) searchCorridor.addEventListener("input", renderCorridorsTable);

  var searchRegional = document.getElementById("searchRegional");
  if (searchRegional) searchRegional.addEventListener("input", renderRegionalTable);
}

/**
 * Modal Dialog Controller
 */
var activeNodeIdForModal = null;

function initModal() {
  var backdrop = document.getElementById("modalBackdrop");
  var modal = document.getElementById("connectivityDetailModal");
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
      if (!activeNodeIdForModal || !mapInstance) return;
      var marker = nodeMarkers[activeNodeIdForModal];
      var nodes = connectivityData.nodes || [];
      var target = nodes.find(function (n) { return n.id === activeNodeIdForModal; });

      closeModal();

      if (target) {
        mapInstance.flyTo([target.lat, target.lng], 14, { duration: 0.8 });
        if (marker) {
          setTimeout(function () {
            marker.openPopup();
          }, 800);
        }
      }
    });
  }

  window.closeConnectivityModal = closeModal;
}

/**
 * Show Node Detail Modal
 */
window.showNodeDetail = function (nodeId) {
  var nodes = connectivityData.nodes || [];
  var node = nodes.find(function (n) { return n.id === nodeId; });
  if (!node) return;

  activeNodeIdForModal = nodeId;
  previousActiveElement = document.activeElement;

  var backdrop = document.getElementById("modalBackdrop");
  var modal = document.getElementById("connectivityDetailModal");

  // Elements
  var catBadge = document.getElementById("modalCategoryBadge");
  var locBadge = document.getElementById("modalLocationBadge");
  var scoreBadge = document.getElementById("modalScoreBadge");
  var titleEl = document.getElementById("modalTitle");
  var subInfoEl = document.getElementById("modalSubInfo");
  var coordsEl = document.getElementById("modalCoords");
  var hubInfoEl = document.getElementById("modalHubInfo");
  var hubDistEl = document.getElementById("modalHubDist");
  var statusEl = document.getElementById("modalStatus");
  var addressEl = document.getElementById("modalAddress");
  var descEl = document.getElementById("modalDescription");
  var modesListEl = document.getElementById("modalModesList");

  if (catBadge) catBadge.textContent = node.kategori_label.toUpperCase();
  if (locBadge) locBadge.textContent = node.kabupaten;
  if (scoreBadge) scoreBadge.textContent = "Skor " + node.skor_aksesibilitas + "/100";
  if (titleEl) titleEl.textContent = node.nama;
  if (subInfoEl) subInfoEl.textContent = node.alamat || node.kabupaten;
  if (coordsEl) coordsEl.textContent = node.lat.toFixed(5) + ", " + node.lng.toFixed(5);
  if (hubInfoEl) hubInfoEl.textContent = node.hub_terdekat;
  if (hubDistEl) hubDistEl.textContent = "Radius transfer " + node.jarak_hub_km + " km";
  if (statusEl) statusEl.textContent = node.status || "Aktif";
  if (addressEl) addressEl.textContent = node.alamat || "Alamat belum tercatat";
  if (descEl) descEl.textContent = node.deskripsi || "Informasi fasilitas transportasi multimoda BPTD Jabar.";

  if (modesListEl) {
    var modes = node.koneksi_moda || [];
    modesListEl.innerHTML = modes.map(function (m) {
      return '<span class="modal-mode-tag">' + m + '</span>';
    }).join("");
  }

  if (backdrop) backdrop.removeAttribute("hidden");
  if (modal) {
    modal.removeAttribute("hidden");
    var closeBtn = document.getElementById("modalCloseBtn");
    if (closeBtn) closeBtn.focus();
  }
};

/**
 * Focus corridor in map
 */
window.focusCorridor = function (corrId) {
  var corridors = connectivityData.intermodal_corridors || [];
  var corr = corridors.find(function (c) { return c.id === corrId; });
  if (!corr || !mapInstance) return;

  var nodes = connectivityData.nodes || [];
  var origin = nodes.find(function (n) { return n.id === corr.origin_node; });
  var dest = nodes.find(function (n) { return n.id === corr.destination_node; });

  if (!origin || !dest) return;

  var bounds = L.latLngBounds([
    [origin.lat, origin.lng],
    [dest.lat, dest.lng]
  ]);

  mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

  var poly = corridorPolylines[corr.id];
  if (poly) {
    setTimeout(function () {
      poly.openTooltip();
    }, 600);
  }
};

/**
 * Dynamic Data Fetch with Smooth Embedded Fallback
 */
function loadData() {
  fetch("../../data/connectivity-jabar.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data && data.nodes && data.nodes.length > 0) {
        connectivityData = data;
        renderKPIs();
        renderNodeDirectoryTable();
        renderCorridorsTable();
        renderRegionalTable();
        renderMapLayers();
      }
    })
    .catch(function () {
      // Fallback is already loaded
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
  renderNodeDirectoryTable();
  renderCorridorsTable();
  renderRegionalTable();
  initModal();
  initMap();
  loadData();
});
