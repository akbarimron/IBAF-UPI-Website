# ⚡ Setup Cloud Functions - Step by Step

## 🎯 Kenapa Perlu Cloud Functions?

Firebase Authentication **hanya bisa dihapus dari server-side**, tidak bisa dari browser (client-side). Ini adalah limitasi keamanan Firebase.

**Solusi**: Setup Cloud Functions sebagai backend untuk hapus user dari Authentication.

---

## 📋 Prerequisites

- Firebase project sudah ada
- Node.js terinstall (v18 atau lebih baru)
- Firebase CLI

---

## 🚀 Langkah Setup (5 Menit)

### 1. Install Dependencies

Buka terminal di folder `functions`:

```bash
cd functions
npm install
```

### 2. Deploy ke Firebase

```bash
# Dari root project
firebase deploy --only functions
```

**Tunggu 2-5 menit** untuk deployment selesai.

### 3. ✅ Selesai!

Setelah deploy berhasil, function `onUserDeleted` akan **otomatis berjalan** setiap kali admin hapus user dari dashboard!

---

## 🎯 Cara Kerja

### Automatic (Recommended) ⚡

Function `onUserDeleted` akan **otomatis trigger** saat dokumen user dihapus dari Firestore:

```
Admin klik "Hapus" di dashboard
  ↓
User document dihapus dari Firestore
  ↓
Cloud Function "onUserDeleted" OTOMATIS trigger
  ↓
User dihapus dari Firebase Authentication
  ✅ SELESAI!
```

**Tidak perlu coding tambahan di frontend!** Semuanya otomatis.

---

## 🧪 Testing

### Test 1: Hapus User dari Dashboard

1. Login sebagai admin
2. Hapus user dari User Management
3. Check Firebase Console:
   - **Firestore**: User document hilang ✅
   - **Authentication**: User hilang ✅

### Test 2: Check Logs

```bash
firebase functions:log
```

Anda akan lihat log seperti:

```
✅ Successfully deleted user abc123 from Authentication
```

---

## 🔧 Troubleshooting

### Error: "Firebase CLI not found"

```bash
npm install -g firebase-tools
firebase login
```

### Error: "Permission denied"

Pastikan Firebase project sudah diinit:

```bash
firebase init functions
```

Pilih:
- Use existing project
- JavaScript
- Install dependencies: Yes

### Function tidak deploy

```bash
# Force deploy
firebase deploy --only functions --force
```

### Check function status

```bash
firebase functions:list
```

---

## 💰 Pricing

**Firebase Free Tier (Spark Plan)**:
- 2 juta function invocations/bulan
- 400,000 GB-seconds/bulan
- 200,000 CPU-seconds/bulan

**Untuk aplikasi kecil-menengah**: GRATIS SELAMANYA ✅

Saat hapus user, hanya consume 1 invocation. Bahkan dengan 1000 user dihapus per bulan, masih jauh di bawah limit gratis.

---

## 📊 Monitoring

### Firebase Console

1. Buka Firebase Console → Functions
2. Klik function `onUserDeleted`
3. Lihat:
   - Execution count
   - Errors (jika ada)
   - Logs

### Command Line

```bash
# Real-time logs
firebase functions:log --only onUserDeleted

# Recent errors
firebase functions:log --only onUserDeleted --limit 10
```

---

## 🎁 Bonus Features

File `functions/index.js` juga include:

### 1. `deleteUserFromAuth` (Manual)

Callable function untuk hapus user secara manual (jika ingin kontrol eksplisit).

### 2. `cleanupOrphanedAuthUsers` (Cleanup)

Function untuk bersihkan "orphaned accounts" - user yang ada di Authentication tapi tidak di Firestore.

**Cara pakai**: Call dari admin dashboard atau jalankan manual.

---

## ✅ Checklist

- [ ] Install dependencies (`cd functions && npm install`)
- [ ] Deploy functions (`firebase deploy --only functions`)
- [ ] Test hapus user dari dashboard
- [ ] Verify di Firebase Console (Firestore & Authentication)
- [ ] Check logs (`firebase functions:log`)

---

## 🆘 Butuh Bantuan?

### Error Logs

```bash
firebase functions:log
```

### Function Details

```bash
firebase functions:list
```

### Re-deploy

```bash
firebase deploy --only functions --force
```

---

## 📝 Summary

**Before Cloud Functions**:
- User dihapus dari Firestore ✅
- User TIDAK dihapus dari Authentication ❌

**After Cloud Functions**:
- User dihapus dari Firestore ✅
- User OTOMATIS dihapus dari Authentication ✅

**Setup time**: 5 menit
**Cost**: Gratis (free tier)
**Maintenance**: Tidak perlu (otomatis)

🎉 **Setelah deploy, semua otomatis!**
