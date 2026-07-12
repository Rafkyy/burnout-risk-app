# 📘 PANDUAN DEPLOY — Burnout Risk App (Versi Fixed)

Panduan lengkap dari nol sampai app jalan di web + APK Android.
Urutannya penting — ikuti dari atas ke bawah.

---

## RINGKASAN PERBAIKAN VERSI INI

| # | Perbaikan |
|---|-----------|
| 1 | Login Google: tombol otomatis disembunyikan di APK/WebView (kebijakan Google) + pesan pengganti; di browser tetap berfungsi normal |
| 2 | Semua bypass login dihapus — Dashboard/Admin tidak bisa diakses tanpa login sungguhan |
| 3 | Admin Panel diproteksi 3 lapis: tombol hanya muncul untuk admin, layar dicek ulang, dan Firebase rules menolak non-admin |
| 4 | Threshold & rekomendasi dari Admin Panel sekarang BENAR-BENAR dipakai perhitungan hasil assessment |
| 5 | Layout mobile/APK: full-screen sungguhan (mockup HP & panel simulator hanya muncul di desktop) |
| 6 | Prediksi API diberi timeout 15 detik — loading tidak bisa menggantung selamanya |
| 7 | Hasil assessment langsung muncul di Riwayat tanpa perlu login ulang |
| 8 | Data dummy "Aditia" dihapus total |
| 9 | Edit nama di Profil tersimpan permanen ke Firebase; email dikunci (read-only) |
| 10 | File duplikat dihapus, `npm run lint` lolos, bundle dipecah (react/firebase chunk) |

---

## LANGKAH 1 — Setup Firebase

### 1a. Isi file `.env`

Salin `.env.example` menjadi `.env`, lalu isi dari
**Firebase Console → Project Settings → General → Your apps (Web app)**:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=namaproject.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://namaproject-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=namaproject
VITE_FIREBASE_APP_ID=1:xxxx:web:xxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXX
VITE_BACKEND_URL=https://xxxx.up.railway.app
```

### 1b. Aktifkan metode login

Firebase Console → **Authentication → Sign-in method** → aktifkan:
- **Email/Password**
- **Google** (untuk versi web)

### 1c. Deploy rules database (WAJIB — kalau tidak, Admin Panel gagal)

File `database.rules.json` sudah berisi rules baru. Deploy dengan salah satu cara:

**Cara A (CLI):**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database
```

**Cara B (manual):** Firebase Console → **Realtime Database → Rules** →
salin seluruh isi `database.rules.json` → Publish.

### 1d. Daftarkan akun ADMIN (WAJIB untuk fitur admin)

1. Login sekali ke app pakai akun yang mau dijadikan admin.
2. Firebase Console → **Authentication → Users** → salin **User UID** akun itu.
3. Buka **Realtime Database → Data**, buat node:

```
admins
  └── <UID_YANG_DISALIN> : true
```

(klik `+` di root → name: `admins` → di dalamnya `+` lagi → name: UID, value: `true`, type Boolean)

Setelah itu, saat akun tersebut login, tombol **Admin** otomatis muncul
(di header desktop dan di tab bar bawah versi mobile).

---

## LANGKAH 2 — Deploy Backend ML (Railway/Render)

Folder `backend/` berisi FastAPI + model. Di Railway:

1. New Project → Deploy from repo/folder `backend/`
2. Railway otomatis membaca `Procfile` (`uvicorn main:app --host 0.0.0.0 --port $PORT`)
3. Setelah live, tes: buka `https://xxxx.up.railway.app/health` — harus muncul
   `{"status":"ok","model_loaded":true}`
4. Masukkan URL itu ke `.env` sebagai `VITE_BACKEND_URL`

> Jika backend mati/sleep, app otomatis pakai kalkulasi lokal (ditandai
> "Mode Lokal" di layar loading) — user tetap dapat hasil, tidak error.

---

## LANGKAH 3 — Build & Deploy Web

```bash
npm install
npm run lint    # harus lolos tanpa error
npm run build   # hasil di folder dist/
```

Upload folder `dist/` ke hosting (Vercel/Netlify/Cloudflare Pages/Firebase Hosting).
Untuk Vercel/Netlify: set semua variabel `VITE_...` di dashboard Environment
Variables mereka, karena `.env` lokal tidak ikut ter-upload.

**PENTING untuk login Google di web:** tambahkan domain hosting kamu di
Firebase Console → **Authentication → Settings → Authorized domains**.

---

## LANGKAH 4 — Build APK Android

App sudah otomatis mendeteksi WebView: tampil full-screen dan menyembunyikan
tombol Google. Cara wrap paling sederhana (WebView/TWA):

1. Deploy web dulu (Langkah 3), catat URL-nya.
2. Wrap URL itu jadi APK (WebView wrapper yang biasa kamu pakai, atau
   [Bubblewrap/TWA](https://developer.android.com/develop/ui/views/layout/webapps) yang lebih direkomendasikan Google).
3. Di APK, user login pakai **email & password** — tombol Google otomatis
   tersembunyi dengan penjelasan singkat, jadi tidak ada lagi tombol yang gagal.

> Kalau nanti mau Google Login juga jalan di APK, itu butuh pindah ke
> **Capacitor + plugin native Google Sign-In** (bukan sekadar WebView wrapper).
> Versi sekarang sudah aman & jelas untuk user tanpa itu.

---

## LANGKAH 5 — Checklist Uji Sebelum Launch

- [ ] Daftar akun baru via email → masuk Dashboard
- [ ] Logout → login lagi → Riwayat masih ada
- [ ] Login Google di **browser laptop** → berhasil
- [ ] Buka APK → tombol Google TIDAK muncul, ada pesan penggantinya
- [ ] Isi assessment → hasil muncul → cek tab Riwayat (langsung ada, tanpa login ulang)
- [ ] Akun biasa: tombol/tab Admin TIDAK muncul
- [ ] Akun admin (sudah didaftarkan di /admins): tab Admin muncul → ubah threshold → Simpan sukses → lakukan assessment baru → level risiko mengikuti threshold baru
- [ ] Tab "Pengguna" di Admin Panel menampilkan daftar user
- [ ] Edit nama di Profil → reload halaman → nama tetap berubah
- [ ] Matikan backend Railway sementara → assessment tetap jalan (Mode Lokal)

---

## STRUKTUR DATA FIREBASE (referensi)

```
admins/{uid}: true                  ← daftar admin (diisi manual via Console)
users/{uid}: {uid, displayName, email, photoURL, lastLogin}
assessments/{uid}/{assessmentId}: {...hasil assessment...}
masterData/thresholds: {low_max, medium_max}          ← diatur Admin Panel
masterData/recommendations/{id}: {id, title, desc, category}
```

## EmailJS (opsional)

Isi 3 variabel `VITE_EMAILJS_...` di `.env` jika ingin user menerima email
hasil assessment. Kalau kosong, fitur email dilewati tanpa error.
