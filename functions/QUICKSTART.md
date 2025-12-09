# ⚡ QUICK START - Hapus User dari Authentication

## 🎯 Masalahnya

Saat ini user **hanya dihapus dari Firestore**, TIDAK dari Firebase Authentication.

**Kenapa?** 
Firebase Authentication hanya bisa dihapus dari **server-side** (backend), tidak bisa dari browser.

---

## ✅ Solusinya: Cloud Functions (5 Menit Setup)

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

### Step 2: Deploy ke Firebase

```bash
# Dari root project (keluar dari folder functions dulu)
cd ..
firebase deploy --only functions
```

**Tunggu 2-5 menit** untuk deployment selesai.

### Step 3: ✅ Selesai!

Sekarang saat admin hapus user:
- ✅ User dihapus dari Firestore
- ✅ User **OTOMATIS** dihapus dari Authentication
- ✅ User langsung logout (realtime)

**Tidak perlu coding tambahan!** Semuanya otomatis.

---

## 🧪 Test

1. Login sebagai admin
2. Hapus user dari dashboard
3. Check Firebase Console:
   - Authentication tab → User hilang ✅
   - Firestore tab → User document hilang ✅

---

## 💡 Cara Kerjanya

```
Admin klik "Hapus" 
  ↓
Firestore: User document dihapus
  ↓
Cloud Function "onUserDeleted" OTOMATIS trigger
  ↓
Authentication: User dihapus
  ✅ DONE!
```

---

## 💰 Biaya

**GRATIS** untuk aplikasi kecil-menengah!

Firebase Free Tier:
- 2 juta function calls/bulan
- Cukup untuk ribuan hapus user per bulan

---

## 🆘 Troubleshooting

### Error saat deploy?

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Coba lagi
firebase deploy --only functions --force
```

### Check logs

```bash
firebase functions:log
```

---

## 📁 Files

- `functions/index.js` - Cloud Function code (sudah siap!)
- `functions/package.json` - Dependencies
- `functions/SETUP_GUIDE.md` - Panduan lengkap

---

## 🎉 That's It!

Setelah deploy, **semua otomatis**. Tidak perlu update AdminDashboard atau code lainnya.

**Time**: 5 menit setup
**Cost**: Gratis
**Maintenance**: Tidak ada
