# Fix Firebase Storage CORS Error

Error CORS terjadi karena Firebase Storage belum dikonfigurasi untuk menerima request dari localhost.

## Solusi 1: Setup CORS menggunakan Google Cloud SDK (Recommended)

### Step 1: Install Google Cloud SDK
1. Download dari: https://cloud.google.com/sdk/docs/install
2. Install dan restart terminal

### Step 2: Login ke Google Cloud
```bash
gcloud auth login
```

### Step 3: Set Project ID
```bash
gcloud config set project ibaf-upi
```

### Step 4: Apply CORS Configuration
```bash
gcloud storage buckets update gs://ibaf-upi.firebasestorage.app --cors-file=cors.json
```

## Solusi 2: Ubah Storage Rules (Temporary Fix)

Di Firebase Console:
1. Buka https://console.firebase.google.com
2. Pilih project "ibaf-upi"
3. Klik **Storage** di sidebar
4. Klik tab **Rules**
5. Update rules menjadi:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

6. Klik **Publish**

## Solusi 3: Gunakan Firebase Emulator untuk Development

```bash
firebase emulators:start --only storage
```

Lalu update `firebase.js`:
```javascript
import { connectStorageEmulator } from 'firebase/storage';

// Jika development
if (window.location.hostname === 'localhost') {
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## Verifikasi

Setelah apply CORS, coba upload foto profil lagi. Jika masih error:
1. Clear browser cache
2. Restart dev server
3. Check Storage rules di Firebase Console

## Note
CORS dengan origin "*" hanya untuk development. Untuk production, ganti dengan domain spesifik:
```json
"origin": ["https://your-domain.com", "https://www.your-domain.com"]
```
