<div align="center">

  <h1>Sistem Informasi Absensi Online</h1>
  <p><b>Platform Manajemen Kehadiran, Jadwal Pelajaran, dan Pelaporan Terintegrasi</b></p>

  [![Vercel Deployment](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sistem-absensi-online.vercel.app)
  [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

  <br />

  [Demo Aplikasi](https://sistem-absensi-online.vercel.app) •
  [Dokumentasi Auth](./Alur%20Verifikasi%20Auth%20Sistem.md) •
  [Laporkan Bug](https://github.com/fahmiwulidan/sistem-absensi-online/issues)

</div>

---

## Ringkasan Proyek

**Sistem Informasi Absensi Online** adalah solusi manajemen kehadiran berbasis web full-stack yang dirancang untuk mereduksi proses rekapitulasi manual di lingkungan sekolah. Sistem ini memfasilitasi pencatatan absensi secara *real-time*, pengelolaan jadwal pelajaran, serta rekapitulasi laporan otomatis yang akurat dan terstruktur.

> [!NOTE]
> Aplikasi ini telah terintegrasi dengan arsitektur monorepo terpisah (`client` & `server`) dan di-deploy secara langsung menggunakan platform **Vercel**.

---

## Teknologi Utama

| Layer | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | React.js / JavaScript | User Interface responsif dan dinamis |
| **Backend** | Node.js & Express.js | RESTful API backend untuk pengolahan logika & data |
| **Auth** | JWT / Session-based | Alur verifikasi keamanan hak akses pengguna |
| **Deployment** | Vercel | Infrastructure as a Service untuk klien dan server |

---

## Fitur Unggulan

- **Pencatatan Kehadiran Real-Time** — Input data absensi siswa dan guru secara cepat dengan validasi sistem.
- **Manajemen Jadwal Pelajaran** — Pengaturan serta pemetaan jadwal kelas yang terpusat.
- **Rekap & Laporan Otomatis** — Generasi laporan rekapitulasi kehadiran mingguan hingga bulanan.
- **Autentikasi Berbasis Peran** — Pembatasan hak akses antara Admin, Guru, dan Siswa.
- **Cross-Origin Resource Sharing (CORS)** — Konfigurasi middleware aman untuk mengizinkan akses multi-origin.

---

## Struktur Direktori

```text
sistem-absensi-online/
├── client/                     # Source code frontend (React Application)
├── server/                     # Source code backend (Express API Service)
├── .gitignore                  # Berkas pengecualian Git
├── Alur Verifikasi Auth...md   # Dokumentasi alur autentikasi sistem
├── package.json                # Pengaturan dependensi akar
├── vercel.json                 # Konfigurasi deployment Vercel
└── README.md                   # Dokumen utama repositori
```

---

## Panduan Memulai

### 1. Kloning Repositori
```bash
git clone https://github.com/fahmiwulidan/sistem-absensi-online.git
cd sistem-absensi-online
```

### 2. Pengaturan Server & Client
```bash
# Jalankan Server (Backend)
cd server
npm install
npm run dev

# Jalankan Client (Frontend) - Buka terminal baru
cd client
npm install
npm start
```

---

<div align="center">
  <sub>Dikembangkan dengan ❤️ oleh <a href="https://github.com/fahmiwulidan">Fahmi Wulidan</a></sub>
</div>
