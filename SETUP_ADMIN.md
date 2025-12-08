# Setup Admin User - Panduan Lengkap

## Masalah: Collection `users` belum ada

Register belum berhasil membuat document di Firestore. Ikuti langkah berikut:

---

## LANGKAH 1: Deploy Firestore Rules Baru

Buka terminal dan jalankan:

```bash
firebase deploy --only firestore:rules
```

Tunggu sampai muncul "Deploy complete!"

---

## LANGKAH 2: Register Akun Admin

1. Buka aplikasi: http://localhost:5173
2. Klik **Register**
3. Isi form:
   - **Name**: Admin IBAF
   - **Email**: admin@ibaf.com (atau email lain)
   - **Password**: minimal 6 karakter
4. Klik **Register**
5. **CATAT EMAIL INI** - akan dipakai nanti

**Cek apakah berhasil:**
- Buka browser console (F12)
- Lihat apakah ada error
- Atau langsung cek Firebase Console Firestore, apakah collection `users` muncul

---

## LANGKAH 3A: Jika Register BERHASIL membuat document

1. Buka Firebase Console: https://console.firebase.google.com/project/ibaf-upi/firestore
2. Klik collection **users**
3. Klik document dengan email admin@ibaf.com
4. Edit field `role`:
   - Double-click nilai `user`
   - Ubah jadi `admin`
   - Tekan Enter
5. **Logout** dari aplikasi
6. **Login** dengan admin@ibaf.com
7. Seharusnya masuk ke **Admin Dashboard** `/admin`

---

## LANGKAH 3B: Jika Register GAGAL (users masih kosong)

### Buat Document Manual:

1. **Dapatkan UID user:**
   - Buka: https://console.firebase.google.com/project/ibaf-upi/authentication
   - Lihat tab **Users**
   - Copy **User UID** dari user admin@ibaf.com

2. **Buat Collection `users`:**
   - Buka: https://console.firebase.google.com/project/ibaf-upi/firestore
   - Klik **Start collection**
   - Collection ID: `users`
   - Klik **Next**

3. **Buat Document Admin:**
   - **Document ID**: Paste UID yang di-copy tadi
   - Tambahkan fields:
   
   | Field Name | Type | Value |
   |------------|------|-------|
   | email | string | admin@ibaf.com |
   | role | string | admin |
   | name | string | Admin IBAF |
   | createdAt | timestamp | (pilih waktu sekarang) |

4. Klik **Save**

5. **Test Login:**
   - Logout dari aplikasi
   - Login dengan admin@ibaf.com + password
   - Seharusnya redirect ke `/admin`

---

## Troubleshooting

### Register masih gagal buat document:
- Cek console browser (F12) untuk error
- Pastikan sudah deploy rules: `firebase deploy --only firestore:rules`
- Cek Firebase Console > Authentication apakah user sudah terbuat

### Masih redirect ke User Dashboard:
- Pastikan sudah logout dan login ulang
- Cek di Firestore apakah field `role` benar-benar `admin` (bukan `Admin` atau `ADMIN`)
- Buka console browser, cek log: "AuthContext - Setting role to: admin"
- Clear cache browser (Ctrl+Shift+Del)

### Collection `users` tidak muncul:
- Buat manual dengan Step 3B
- Pastikan Document ID = User UID (bukan email!)

---

## Verifikasi Berhasil

Setelah login sebagai admin, Anda akan:
- ✅ Redirect ke `/admin` (bukan `/dashboard`)
- ✅ Lihat Admin Dashboard dengan 3 tabs (Overview, Users, Notes)
- ✅ Console browser menampilkan: "AuthContext - Setting role to: admin"
- ✅ Bisa akses menu admin untuk manage users dan notes
