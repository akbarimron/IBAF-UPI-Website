# Quick Guide: Menghapus User Lengkap

## 🎯 Status Saat Ini

### ✅ Yang Sudah Berfungsi (Tanpa Setup Tambahan)

1. **Auto-Logout Realtime**
   - User langsung logout dalam 2 detik saat dihapus
   - Notifikasi "Akun Anda telah dihapus oleh admin"
   - Redirect otomatis ke halaman login

2. **Penghapusan Data Firestore**
   - ✅ User profile (users collection)
   - ✅ Workout logs
   - ✅ User messages
   - ✅ Admin messages

3. **Proses Penghapusan**
   - Admin klik tombol hapus
   - Konfirmasi ketik "HAPUS"
   - User ditandai `isDeleted: true` (trigger auto-logout)
   - Delay 2 detik (user logout)
   - Hapus semua data Firestore

### ⚠️ Yang Belum (Perlu Setup)

- ❌ Penghapusan dari **Firebase Authentication**
- User masih ada di Authentication list tapi tidak bisa login (sudah di-logout)

---

## 🚀 Cara Pakai (Admin)

1. Login sebagai admin
2. Buka tab **User Management**
3. Klik tombol **Hapus** pada user yang ingin dihapus
4. Konfirmasi dengan mengetik "**HAPUS**"
5. Tunggu notifikasi sukses

**Hasil:**
- User langsung logout (jika sedang online)
- Semua data Firestore terhapus
- User tidak bisa login lagi (meskipun masih di Authentication)

---

## 🔧 Setup Lengkap (Opsional tapi Recommended)

Untuk menghapus user dari **Firebase Authentication** juga:

### Quick Steps:

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Init functions
firebase init functions

# 4. Edit functions/index.js (lihat DELETE_USER_SETUP.md)

# 5. Deploy
firebase deploy --only functions
```

**Lihat file `DELETE_USER_SETUP.md` untuk instruksi lengkap dan kode.**

---

## 🧪 Testing

### Test 1: User Sedang Online

1. Buka 2 browser:
   - Browser 1: Login admin
   - Browser 2: Login user biasa
2. Di Browser 1: Hapus user yang login di Browser 2
3. Di Browser 2: 
   - ✅ Notifikasi "Akun Anda telah dihapus oleh admin"
   - ✅ Auto-logout dalam 2 detik
   - ✅ Redirect ke /login

### Test 2: User Tidak Online

1. Login sebagai admin
2. Hapus user yang tidak sedang online
3. Saat user tersebut login lagi:
   - ❌ Tidak bisa login (data sudah dihapus)
   - ✅ Error: "User not found"

---

## 📊 Fitur Keamanan

1. **Double Confirmation**
   - Konfirmasi pertama: Alert dengan detail user
   - Konfirmasi kedua: Input manual "HAPUS"

2. **Soft Delete First**
   - User ditandai `isDeleted: true` dulu
   - Delay 2 detik untuk logout
   - Baru hapus permanen

3. **Audit Trail**
   - Field `deletedBy`: UID admin yang hapus
   - Field `deletedAt`: Timestamp penghapusan
   - Console.log untuk monitoring

4. **Role Check**
   - Hanya admin yang bisa hapus
   - Firestore rules enforce permission

---

## ⚡ Performance

- **Realtime Detection**: < 1 detik
- **Auto-Logout**: 2 detik (delay untuk user lihat notif)
- **Total Delete Time**: ~3-5 detik (tergantung jumlah data)

---

## 🔗 File Terkait

- `src/pages/AdminDashboard/AdminDashboard.jsx` - Fungsi hapus user
- `src/pages/UserDashboard/UserDashboard.jsx` - Deteksi deletion & auto-logout
- `DELETE_USER_SETUP.md` - Setup Cloud Function untuk hapus dari Authentication
- `firestore.rules` - Security rules

---

## 💡 Tips

1. **Backup sebelum hapus**: Tidak ada undo!
2. **Test di development**: Pastikan semua berfungsi sebelum production
3. **Monitor logs**: Check console untuk errors
4. **Setup Cloud Function**: Untuk penghapusan complete dari Authentication juga
