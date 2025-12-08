# 🔥 FIX: Domain Tidak Terotorisasi - Google Login

## ⚡ SOLUSI CEPAT (5 Menit)

### Langkah 1️⃣: Cek Domain Vercel Anda

**Cara 1 - Via Vercel Dashboard:**
1. Login ke https://vercel.com
2. Pilih project `ibaf-website` atau `ibaf-upi-website`
3. Lihat di bagian **Domains** - copy domain utama
   - Contoh: `ibaf-upi.vercel.app`

**Cara 2 - Via Git:**
Cek deployment URL di commit terakhir atau di Vercel deployment log

### Langkah 2️⃣: Tambah ke Firebase Console

1. **Buka Firebase Console:**
   ```
   https://console.firebase.google.com/project/ibaf-upi/authentication/settings
   ```

2. **Login dengan akun yang punya akses project `ibaf-upi`**

3. **Scroll ke section "Authorized domains"**
   
   Anda akan lihat list seperti:
   ```
   ✓ localhost
   ✓ ibaf-upi.firebaseapp.com
   ```

4. **Klik tombol "Add domain"**

5. **Masukkan domain Vercel Anda:**
   ```
   [nama-project].vercel.app
   ```
   
   Contoh lengkap:
   - `ibaf-upi.vercel.app`
   - `ibaf-upi-website.vercel.app`
   - `ibaf-website.vercel.app`

6. **Klik "Add"**

### Langkah 3️⃣: Test Login

1. Buka website deployment Anda
2. Klik "Login dengan Google"
3. Seharusnya popup Google muncul tanpa error
4. ✅ Login berhasil!

---

## 🔍 Troubleshooting

### Masalah: "Tidak tahu domain Vercel saya"

**Solusi:**
1. Buka terminal/PowerShell
2. Jalankan:
   ```bash
   vercel ls
   ```
3. Atau cek email dari Vercel setelah deployment
4. Atau buka https://vercel.com/dashboard → pilih project → tab "Domains"

### Masalah: "Tidak punya akses Firebase Console"

**Solusi:**
1. Hubungi admin/owner project `ibaf-upi` di Firebase
2. Minta mereka menambahkan domain:
   - Kirim domain Vercel Anda
   - Minta mereka add via Firebase Console → Authentication → Settings → Authorized domains

### Masalah: "Sudah ditambahkan tapi masih error"

**Solusi:**
1. **Clear browser cache:**
   - Chrome/Edge: Ctrl+Shift+Delete → Clear cache
   - Firefox: Ctrl+Shift+Delete → Clear cache
   
2. **Hard refresh:**
   - Chrome: Ctrl+Shift+R
   - Firefox: Ctrl+F5

3. **Incognito/Private mode:**
   - Test login di incognito window

4. **Tunggu 2-5 menit:**
   - Firebase butuh waktu propagasi
   - Coba lagi setelah beberapa menit

---

## 📋 Checklist Verifikasi

Setelah menambahkan domain, pastikan:

- [ ] Domain Vercel sudah muncul di Firebase Authorized domains list
- [ ] Clear browser cache
- [ ] Test login di website deployment
- [ ] Popup Google muncul tanpa error
- [ ] Berhasil login dan redirect ke dashboard

---

## 🎯 Domain yang Harus Ditambahkan

Untuk project IBAF UPI, tambahkan SEMUA domain berikut:

```
✅ localhost (sudah ada by default)
✅ ibaf-upi.firebaseapp.com (sudah ada by default)
🔴 [vercel-domain].vercel.app (HARUS DITAMBAHKAN!)
```

**Contoh lengkap authorized domains:**
```
localhost
ibaf-upi.firebaseapp.com
ibaf-upi.vercel.app
ibaf-website.vercel.app
ibaf-upi-website.vercel.app
```

Tambahkan semua domain/subdomain yang Anda gunakan untuk deployment.

---

## 🚀 Alternative: Deploy ke Firebase Hosting

Jika Vercel terus bermasalah, pertimbangkan deploy ke Firebase Hosting:

```bash
# Install Firebase tools
npm install -g firebase-tools

# Build production
npm run build

# Deploy ke Firebase Hosting
firebase deploy --only hosting
```

Domain otomatis: `ibaf-upi.web.app` dan `ibaf-upi.firebaseapp.com` (sudah authorized!)

---

## 📞 Butuh Bantuan?

1. **Screenshot error message** dari browser console (F12)
2. **Copy domain Vercel** yang Anda gunakan
3. **Screenshot Firebase Authorized domains** list
4. Hubungi developer dengan info di atas

**Email Firebase project owner:** [isi dengan email admin]
**Vercel project URL:** https://vercel.com/[username]/[project-name]
