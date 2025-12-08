# Tutorial: Membuat Collection Users dan Admin User

## Cara 1: Otomatis via Register (MUDAH) ✅

### Step 1: Jalankan Aplikasi
Buka terminal dan jalankan:
```bash
npm run dev
```

Buka browser: http://localhost:5173

---

### Step 2: Register Akun Admin

1. **Klik tombol "Register"** di navbar (pojok kanan atas)

2. **Isi form registrasi**:
   ```
   Name     : Admin IBAF
   Email    : admin@ibaf.com
   Password : admin123
   ```

3. **Klik tombol "Register"**

4. Tunggu proses registrasi (1-2 detik)

5. **PENTING**: Catat email yang digunakan: `admin@ibaf.com`

---

### Step 3: Cek di Firebase Console

1. **Buka Firebase Console Firestore**:
   - Link: https://console.firebase.google.com/project/ibaf-upi/firestore
   - Atau klik tab "Firestore Database" di menu kiri

2. **Refresh halaman** (F5)

3. **Cek apakah collection `users` muncul**:
   - ✅ Jika muncul → Lanjut ke Step 4
   - ❌ Jika belum muncul → Gunakan Cara 2 (Manual)

---

### Step 4: Ubah Role Jadi Admin

1. **Klik collection `users`** (di sidebar kiri)

2. **Klik document** yang emailnya `admin@ibaf.com`

3. Di bagian kanan, akan muncul fields:
   ```
   email     : admin@ibaf.com
   name      : Admin IBAF
   role      : user          ← UBAH INI
   createdAt : (timestamp)
   ```

4. **Edit field `role`**:
   - Double-click pada nilai `user`
   - Ketik `admin`
   - Tekan Enter atau klik di luar field

5. **Pastikan tersimpan** (lihat notifikasi "Document saved")

---

### Step 5: Test Login Admin

1. **Kembali ke aplikasi** (http://localhost:5173)

2. **Logout** jika masih login:
   - Klik icon profile (pojok kanan atas)
   - Klik "Logout"

3. **Login dengan akun admin**:
   - Klik "Login"
   - Email: `admin@ibaf.com`
   - Password: `admin123`
   - Klik "Login"

4. **Cek redirect**:
   - ✅ Berhasil: Redirect ke `/admin` (Admin Dashboard)
   - ❌ Gagal: Redirect ke `/dashboard` (User Dashboard)

5. **Jika gagal**, cek console browser (F12):
   - Cari log: `AuthContext - Setting role to: admin`
   - Jika masih `user`, berarti role belum berubah → ulangi Step 4

---

## Cara 2: Manual di Firebase Console (JIKA REGISTER GAGAL) 🛠️

### Step A: Dapatkan User UID

1. **Buka Firebase Authentication**:
   - Link: https://console.firebase.google.com/project/ibaf-upi/authentication
   - Atau klik tab "Authentication" di menu kiri

2. **Klik tab "Users"**

3. **Cari user dengan email** `admin@ibaf.com`

4. **Copy User UID**:
   - Klik icon copy di kolom "User UID"
   - Atau select text dan Ctrl+C
   - Contoh UID: `xYz123AbC456DeF789`

---

### Step B: Buat Collection `users`

1. **Buka Firestore Database**:
   - Link: https://console.firebase.google.com/project/ibaf-upi/firestore

2. **Klik tombol "Start collection"** (di tengah halaman)
   - Atau jika sudah ada collection lain, klik "+" di sebelah Collections

3. **Isi Collection ID**:
   ```
   Collection ID: users
   ```

4. **Klik "Next"**

---

### Step C: Buat Document Admin

1. **Isi Document ID**:
   ```
   Document ID: (paste UID yang dicopy dari Step A)
   ```
   Contoh: `xYz123AbC456DeF789`

2. **Tambahkan Field 1 - Email**:
   ```
   Field   : email
   Type    : string
   Value   : admin@ibaf.com
   ```

3. **Tambahkan Field 2 - Name**:
   - Klik "Add field"
   ```
   Field   : name
   Type    : string
   Value   : Admin IBAF
   ```

4. **Tambahkan Field 3 - Role**:
   - Klik "Add field"
   ```
   Field   : role
   Type    : string
   Value   : admin
   ```
   ⚠️ **PENTING**: Pastikan tulis `admin` (huruf kecil semua)

5. **Tambahkan Field 4 - Created At**:
   - Klik "Add field"
   ```
   Field   : createdAt
   Type    : timestamp
   Value   : (klik kalender, pilih tanggal hari ini + jam sekarang)
   ```

6. **Klik "Save"**

---

### Step D: Verifikasi Document

1. **Cek di Firestore**:
   - Collection `users` sudah muncul di sidebar
   - Ada 1 document dengan ID = User UID
   - Document punya 4 fields: email, name, role, createdAt

2. **Double-check field `role`**:
   - Klik document
   - Pastikan `role: admin` (bukan `user` atau `Admin`)

---

### Step E: Test Login

1. **Logout dari aplikasi** (jika sudah login)

2. **Login dengan akun admin**:
   - Email: `admin@ibaf.com`
   - Password: `admin123` (atau password yang digunakan saat register)

3. **Seharusnya redirect ke `/admin`** ✅

---

## Troubleshooting 🔧

### ❌ Register tidak membuat document di Firestore

**Penyebab**: Firestore rules belum di-deploy

**Solusi**:
```bash
firebase deploy --only firestore:rules
```

Setelah itu coba register lagi.

---

### ❌ Masih redirect ke `/dashboard` padahal role sudah `admin`

**Solusi**:
1. Logout dan login lagi (WAJIB)
2. Clear browser cache (Ctrl+Shift+Del)
3. Restart aplikasi (npm run dev)
4. Cek console browser (F12), cari log:
   ```
   AuthContext - Setting role to: admin
   ```
   Jika masih `user`, role belum ke-load → logout/login lagi

---

### ❌ Error: "Missing or insufficient permissions"

**Penyebab**: Firestore rules terlalu strict

**Solusi**: Sudah di-fix dengan deploy rules baru. Restart aplikasi.

---

### ❌ Collection `users` tidak muncul setelah register

**Solusi**: Gunakan Cara 2 (Manual) di atas.

---

## Cara Membuat User Biasa

Jika ingin buat user biasa (bukan admin):

1. **Gunakan halaman Register**:
   - Klik "Register"
   - Isi name, email, password
   - Klik "Register"

2. **Otomatis terbuat dengan `role: user`**

3. **Login** → Redirect ke `/dashboard` (User Dashboard)

---

## Verifikasi Berhasil ✅

Setelah login sebagai admin, Anda akan melihat:

1. **URL berubah ke `/admin`** (bukan `/dashboard`)

2. **Admin Dashboard dengan 3 tabs**:
   - Overview (statistik)
   - Users (daftar semua user)
   - Notes (daftar semua catatan user)

3. **Console browser menampilkan**:
   ```
   AuthContext - Setting role to: admin
   Login - Navigating to /admin
   ```

4. **Navbar menampilkan**:
   - Icon profile di pojok kanan
   - Dropdown: "Dashboard" dan "Logout"
   - Klik "Dashboard" → tetap di `/admin`

---

## Ringkasan Cepat

### Untuk Admin:
```
1. Register dengan email khusus (contoh: admin@ibaf.com)
2. Buka Firebase Console → Firestore → users → (document admin)
3. Ubah role: user → admin
4. Logout dan login lagi
5. Masuk ke Admin Dashboard ✅
```

### Untuk User Biasa:
```
1. Register dengan email biasa
2. Otomatis role: user
3. Login → User Dashboard ✅
```

---

## Catatan Penting ⚠️

1. **Document ID di Firestore HARUS sama dengan User UID** dari Authentication
2. **Field `role` harus lowercase**: `admin` atau `user` (bukan `Admin` atau `USER`)
3. **Logout dan login ulang** setelah ubah role
4. **Firestore rules** sudah di-deploy, jadi register seharusnya langsung buat document

---

Selamat mencoba! 🚀
