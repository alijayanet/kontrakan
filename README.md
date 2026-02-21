# 🏠 Kontrakan Management System + WhatsApp Gateway 🚀

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/framework-Express.js-blue)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-SQLite3-lightgrey)](https://sqlite.org/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Gateway-success)](https://github.com/WhiskeySockets/Baileys)

Sistem manajemen pengelolaan kontrakan/kost modern yang dilengkapi dengan **WhatsApp Gateway Otomatis** untuk penagihan, kwitansi digital, dan pemantauan statistik real-time.

---

## ✨ Fitur Unggulan

### 🏨 Manajemen Properti
- **Dashboard Overview**: Ringkasan statistik hunian, pendapatan, dan jatuh tempo dalam satu layar.
- **Manajemen Kamar**: Pantau status kamar (Tersedia, Terisi, Maintenance) dengan filter otomatis.
- **Database Penyewa**: Penyimpanan data penyewa lengkap dengan histori sewa.
- **Biaya & Pengeluaran**: Catat modal operasional (Listrik, Air, Maintenance) untuk menghitung profit bersih.

### 📱 WhatsApp Gateway (Smart Assistant)
- **Auto-Invoice**: Kirim rincian tagihan langsung ke nomor WhatsApp penyewa.
- **Digital Receipt**: Pengiriman bukti bayar otomatis setelah pembayaran dikonfirmasi.
- **Admin Commands**: Kontrol sistem via chat WhatsApp (Khusus Nomor Admin):
  - `menu` : Menampilkan daftar perintah yang tersedia.
  - `status` : Cek statistik hunian & piutang saat ini.
  - `tagihan` : List semua tagihan yang belum lunas.
  - `bayar [ID/Nama]` : Konfirmasi pelunasan tagihan via chat.

### 💳 Finansial & Invoicing
- **Pencatatan Otomatis**: Generate invoice bulanan untuk setiap aktifitas sewa.
- **Reminder Jatuh Tempo**: Pantau tagihan yang akan atau sudah melewati batas waktu.

---

## 🛠️ Tech Stack
- **Backend**: Node.js & Express.js
- **Frontend**: EJS Templating Engine & Tailwind CSS (Premium UI)
- **Database**: SQLite3 (Ringan & Cepat tanpa setup server DB)
- **Integration**: Baileys (WhatsApp Web API)
- **Utilities**: Moment.js, Bcrypt.js, Express-Session.

---

## 🚀 Panduan Instalasi

### 1. Persyaratan Sistem
- Node.js (v18 ke atas)
- NPM atau Yarn
- Akun WhatsApp yang aktif untuk Gateway

### 2. Clone & Install
```bash
# Clone repository
git clone https://github.com/alijayanet/kontrakan.git

# Masuk ke direktori
cd kontrakan

# Install dependencies
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:
```bash
cp .env.example .env
```
Isi konfigurasi dasar:
- `PORT=3001`
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin123`
- `SESSION_SECRET=buat_secret_yang_kuat`

### 4. Menjalankan Aplikasi
```bash
# Mode Production
npm start

# Mode Development (Auto-restart)
npm run dev
```
Buka browser dan akses: `http://localhost:3001`

---

## 📲 Setup WhatsApp Gateway

1. Login ke dashboard admin web.
2. Pergi ke menu **WhatsApp Gateway** di sidebar.
3. Klik tombol **Connect** untuk memunculkan QR Code.
4. Scan QR Code menggunakan fitur "Tautkan Perangkat" di aplikasi WhatsApp Anda.
5. Pastikan nomor WhatsApp yang Anda gunakan adalah nomor yang didaftarkan sebagai **Admin WA** di menu profil/pengaturan agar bisa menerima perintah otomatis.

---

## 📂 Struktur Proyek
```text
kontrakan/
├── config/         # Konfigurasi Database
├── controllers/    # Logika Bisnis (Alur Data)
├── models/         # Skema & Query Database
├── public/         # Asset Statis (CSS, JS, Images)
├── routes/         # Definisi URL/Rute
├── utils/          # Helper & WhatsApp Client logic
├── views/          # Tampilan (EJS Templates)
└── server.js       # Entry point aplikasi
```

---

## 🤝 Kontribusi
Ingin meningkatkan fitur? Silakan buat **Pull Request** atau ajukan **Issue** di repositori ini.

Developed with ❤️ by [Ali Jaya](https://github.com/alijayanet)
