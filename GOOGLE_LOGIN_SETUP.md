# Google Login Setup - Troubleshooting Guide

## Masalah Umum Google Login Gagal

### 1. **Domain Tidak Terotorisasi (auth/unauthorized-domain)**

**Penyebab:** Domain deployment (Vercel) belum ditambahkan ke Firebase Console

**Solusi:**
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project `ibaf-upi`
3. Klik **Authentication** → **Settings** → **Authorized domains**
4. Klik **Add domain**
5. Tambahkan domain berikut:
   - `localhost` (sudah ada)
   - `ibaf-upi.vercel.app` (domain Vercel Anda)
   - Domain custom jika ada (contoh: `ibaf.upi.ac.id`)

### 2. **Popup Diblokir Browser (auth/popup-blocked)**

**Penyebab:** Browser memblokir popup Google sign-in

**Solusi untuk User:**
- Klik ikon popup di address bar browser
- Izinkan popup untuk domain ini
- Coba login lagi

### 3. **Internal Error (auth/internal-error)**

**Penyebab:** Konfigurasi Firebase atau API Key bermasalah

**Solusi:**
1. Cek environment variables di Vercel:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   ```
2. Pastikan semua API sudah enabled di Firebase Console:
   - Identity Toolkit API
   - Token Service API

### 4. **Cek Authorized Domains di Firebase**

Pastikan domain deployment sudah terdaftar:

```
✅ localhost
✅ ibaf-upi.firebaseapp.com
✅ [nama-project].vercel.app
```

## Testing Google Login Lokal

Untuk test di localhost (development):

```bash
npm run dev
```

Google login akan bekerja otomatis karena `localhost` sudah authorized secara default.

## Error Messages yang Diperbaiki

Aplikasi sekarang menampilkan pesan error yang lebih jelas:

- ✅ "Popup diblokir oleh browser. Izinkan popup untuk login dengan Google"
- ✅ "Domain tidak terotorisasi. Hubungi administrator"
- ✅ "Koneksi internet bermasalah. Cek koneksi Anda"
- ✅ "Login dibatalkan oleh user"
- ✅ Detail error message di console untuk debugging

## Langkah Verifikasi

1. **Cek Firebase Console:**
   - Authentication → Sign-in method → Google (Enabled ✓)
   - Authorized domains contains deployment URL

2. **Cek Vercel Environment Variables:**
   - Settings → Environment Variables
   - Semua VITE_FIREBASE_* variables ada

3. **Test Login:**
   - Buka deployed website
   - Klik "Login dengan Google"
   - Popup harus muncul
   - Pilih akun Google
   - Redirect ke dashboard

## Kontak Support

Jika masih bermasalah setelah langkah-langkah di atas:
1. Cek console browser (F12) untuk detail error
2. Screenshot error message
3. Hubungi developer dengan info:
   - Error code (contoh: `auth/unauthorized-domain`)
   - Browser yang digunakan
   - Screenshot console error
