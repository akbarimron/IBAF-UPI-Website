# Setup Penghapusan User dari Firebase Authentication

## ✅ Fitur Yang Sudah Diimplementasikan

Saat ini sistem sudah bisa:
- ✅ Menandai user sebagai `isDeleted` di Firestore
- ✅ Auto-logout user secara realtime saat dihapus
- ✅ Menghapus semua data user (workout logs, messages, profile)
- ✅ Menghapus dokumen user dari Firestore

**Yang masih perlu setup:**
- ⚠️ Menghapus user dari Firebase Authentication (memerlukan Cloud Function)

---

## 🔧 Setup Cloud Function untuk Hapus dari Authentication

Untuk menghapus user dari Firebase Authentication, Anda perlu setup Firebase Cloud Functions karena Firebase Admin SDK tidak bisa diakses dari client-side.

### 1. Install Firebase CLI & Initialize Functions

```bash
# Install Firebase CLI (jika belum)
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Initialize Cloud Functions di project Anda
firebase init functions
```

Saat ditanya:
- **Language**: Pilih JavaScript atau TypeScript
- **ESLint**: Yes (recommended)
- **Install dependencies**: Yes

### 2. Buat Cloud Function untuk Delete User

Buka file `functions/index.js` dan tambahkan:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cloud Function untuk menghapus user dari Authentication
exports.deleteUserFromAuth = functions.https.onCall(async (data, context) => {
  // Verify that the user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete users.'
    );
  }

  // Check if caller is admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users.'
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID is required.'
    );
  }

  try {
    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId);
    
    console.log(`Successfully deleted user ${userId} from Authentication`);
    
    return { 
      success: true, 
      message: 'User deleted from Authentication successfully' 
    };
  } catch (error) {
    console.error('Error deleting user from Authentication:', error);
    
    // If user doesn't exist in Auth, that's okay
    if (error.code === 'auth/user-not-found') {
      return { 
        success: true, 
        message: 'User already deleted from Authentication' 
      };
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete user from Authentication: ' + error.message
    );
  }
});

// Optional: Trigger otomatis saat user dihapus dari Firestore
exports.onUserDeleted = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    
    try {
      // Delete from Authentication
      await admin.auth().deleteUser(userId);
      console.log(`Auto-deleted user ${userId} from Authentication`);
    } catch (error) {
      console.error('Error auto-deleting from Authentication:', error);
      // Don't throw error, just log it
    }
  });
```

### 3. Update package.json di folder functions

Pastikan dependencies ini ada di `functions/package.json`:

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}
```

### 4. Deploy Cloud Functions

```bash
# Deploy functions ke Firebase
firebase deploy --only functions
```

Tunggu hingga deploy selesai. Anda akan melihat URL function.

---

## 🔌 Update AdminDashboard untuk Panggil Cloud Function

Setelah Cloud Function di-deploy, update `AdminDashboard.jsx`:

### Import Firebase Functions

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
```

### Update handleDeleteUser

Tambahkan panggilan Cloud Function setelah menghapus dari Firestore:

```javascript
// Di dalam handleDeleteUser, setelah deleteDoc
await deleteDoc(doc(db, 'users', userId));

// Call Cloud Function to delete from Authentication
try {
  const functions = getFunctions();
  const deleteUserFromAuth = httpsCallable(functions, 'deleteUserFromAuth');
  const result = await deleteUserFromAuth({ userId });
  console.log('Deleted from Auth:', result.data);
} catch (error) {
  console.error('Error deleting from Auth:', error);
  // Continue even if this fails
}

fetchUsers();
alert('✅ Akun berhasil dihapus dari Firestore dan Authentication');
```

---

## 📋 Alternatif: Trigger Otomatis (Recommended)

Jika Anda sudah setup function `onUserDeleted` di atas, penghapusan dari Authentication akan **otomatis** saat dokumen user dihapus dari Firestore. **Tidak perlu panggil manual dari AdminDashboard.**

Ini lebih simple dan aman karena:
- ✅ Satu sumber kebenaran (Firestore deletion triggers Auth deletion)
- ✅ Tidak perlu handle errors di frontend
- ✅ Lebih konsisten

---

## 🧪 Testing

### Test Manual Delete

1. Login sebagai admin
2. Hapus user dari Admin Dashboard
3. Cek Firebase Console:
   - **Firestore**: User document harus hilang
   - **Authentication**: User harus hilang dari daftar
4. Jika user masih login, mereka harus auto-logout dalam 2 detik

### Test Auto-Logout

1. Buka 2 browser (atau incognito mode):
   - Browser 1: Login sebagai admin
   - Browser 2: Login sebagai user biasa
2. Di Browser 1 (admin): Hapus user yang sedang login di Browser 2
3. Di Browser 2: Dalam 2 detik, user harus:
   - Melihat notifikasi "Akun Anda telah dihapus oleh admin"
   - Auto-logout
   - Redirect ke halaman login

---

## 🔐 Security Rules Update

Pastikan Firestore rules mengizinkan admin untuk update field `isDeleted`:

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == userId || 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 📊 Monitoring

### Check Cloud Function Logs

```bash
firebase functions:log
```

### Firebase Console

1. Buka Firebase Console → Functions
2. Lihat execution logs untuk `deleteUserFromAuth` atau `onUserDeleted`
3. Check untuk errors atau successful executions

---

## 💰 Pricing

Firebase Cloud Functions pricing:
- **Free tier**: 2 juta invocations/month
- **Paid**: $0.40 per juta invocations setelahnya

Untuk aplikasi kecil-menengah, ini **gratis selamanya**.

---

## ❓ Troubleshooting

### Function tidak muncul setelah deploy

```bash
# Re-deploy dengan force
firebase deploy --only functions --force
```

### Permission denied saat call function

Pastikan:
1. User yang panggil sudah login (`context.auth` ada)
2. User memiliki `role: 'admin'` di Firestore
3. Security rules mengizinkan read user document

### User tidak auto-logout

Check:
1. Realtime listener di UserDashboard sudah berjalan
2. Field `isDeleted` atau dokumen benar-benar dihapus
3. Check browser console untuk errors

---

## 🎯 Summary

**Saat ini (tanpa Cloud Function):**
- User ter-logout secara realtime ✅
- Data Firestore terhapus ✅
- Data Authentication **TIDAK** terhapus ❌

**Setelah setup Cloud Function:**
- User ter-logout secara realtime ✅
- Data Firestore terhapus ✅
- Data Authentication terhapus ✅

**Recommended approach:**
Setup `onUserDeleted` trigger untuk auto-delete dari Authentication saat dokumen Firestore dihapus. Ini paling simple dan reliable.
