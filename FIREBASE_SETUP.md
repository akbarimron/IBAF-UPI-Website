# IBAF Website - Setup Firebase Authentication

## Langkah Setup Firebase

### 1. Buat Project Firebase
1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau "Create a project"
3. Beri nama project (misal: "ibaf-website")
4. Ikuti langkah-langkah setup hingga selesai

### 2. Enable Authentication
1. Di Firebase Console, pilih project Anda
2. Klik "Authentication" di menu sidebar
3. Klik tab "Sign-in method"
4. Enable "Email/Password" authentication
5. Klik "Save"

### 3. Buat Firestore Database
1. Di Firebase Console, klik "Firestore Database"
2. Klik "Create database"
3. Pilih mode (Start in production mode atau test mode)
4. Pilih lokasi server (pilih yang terdekat dengan Indonesia)
5. Klik "Enable"

### 4. Setup Firestore Rules
Di Firestore Database, klik tab "Rules" dan gunakan rules berikut:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can read all users
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 5. Dapatkan Firebase Config
1. Di Firebase Console, klik ikon gear (⚙️) > Project settings
2. Scroll ke bawah ke bagian "Your apps"
3. Klik ikon web (</>) untuk menambahkan web app
4. Beri nickname untuk app (misal: "IBAF Web")
5. Klik "Register app"
6. Copy Firebase configuration

### 6. Setup Environment Variables
1. Buka file `.env.local` di root project
2. Isi dengan data dari Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 7. Update Firebase Config File
Buka `src/config/firebase.js` dan update dengan environment variables:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 8. Buat User di Firebase
Untuk membuat user pertama kali:

#### Via Firebase Console:
1. Di Firebase Console, klik "Authentication"
2. Klik tab "Users"
3. Klik "Add user"
4. Masukkan email dan password
5. Klik "Add user"

#### Tambahkan Role User:
1. Di Firebase Console, klik "Firestore Database"
2. Klik "Start collection"
3. Collection ID: `users`
4. Document ID: (paste User UID dari Authentication)
5. Field:
   - Field: `email` | Type: string | Value: user@example.com
   - Field: `role` | Type: string | Value: `admin` atau `user`
6. Klik "Save"

### 9. Test User Credentials
Buat beberapa test user:

**Admin User:**
- Email: admin@ibaf.com
- Password: admin123
- Role: admin

**Regular User:**
- Email: user@ibaf.com
- Password: user123
- Role: user

## Cara Menjalankan

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka browser dan akses aplikasi
4. Login dengan credentials yang telah dibuat

## Fitur yang Tersedia

### ✅ Authentication
- Login dengan email/password
- Logout
- Protected routes berdasarkan role

### ✅ Role-Based Access
- **Admin**: Akses ke Admin Dashboard
- **User**: Akses ke User Dashboard
- **Public**: Akses ke halaman Home

### ✅ Pages
- `/` - Home page (public)
- `/login` - Login page
- `/admin` - Admin dashboard (protected, admin only)
- `/dashboard` - User dashboard (protected, user only)

## Struktur File

```
src/
├── config/
│   └── firebase.js          # Firebase configuration
├── contexts/
│   └── AuthContext.jsx      # Authentication context & hooks
├── components/
│   ├── ProtectedRoute.jsx   # Route protection component
│   └── layout/
│       └── Navbar/          # Updated navbar with auth buttons
├── pages/
│   ├── Home/               # Home page
│   ├── Login/              # Login page
│   ├── AdminDashboard/     # Admin dashboard
│   └── UserDashboard/      # User dashboard
└── App.jsx                 # Main app with routing
```

## Troubleshooting

### Error: "Firebase config not found"
- Pastikan file `.env.local` sudah dibuat
- Restart development server setelah membuat/mengubah .env file

### Error: "User not found" saat login
- Pastikan user sudah dibuat di Firebase Authentication
- Periksa email dan password sudah benar

### User bisa login tapi tidak ada role
- Pastikan sudah membuat document di Firestore collection `users`
- Document ID harus sama dengan User UID dari Authentication
- Field `role` harus ada dengan value `admin` atau `user`

## Security Notes

⚠️ **Penting:**
- Jangan commit file `.env.local` ke git
- File `.env.local` sudah ada di `.gitignore`
- Jangan share Firebase credentials secara publik
- Update Firestore rules untuk production
