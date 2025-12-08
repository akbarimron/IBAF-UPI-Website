# Vercel Deployment Guide

## Setup Environment Variables di Vercel

1. **Buka Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Pilih project Anda

2. **Tambahkan Environment Variables:**
   - Settings → Environment Variables
   - Tambahkan variable berikut:

```
VITE_FIREBASE_API_KEY = AIzaSyBjnw1URQv-HhiTxnDhYFMT_fLL5sNT8_0
VITE_FIREBASE_AUTH_DOMAIN = ibaf-upi.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = ibaf-upi
VITE_FIREBASE_STORAGE_BUCKET = ibaf-upi.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 1039987220916
VITE_FIREBASE_APP_ID = 1:1039987220916:web:a3e5052f6b12b536abd2e1
VITE_FIREBASE_MEASUREMENT_ID = G-HVPBK64WRR
```

3. **Set untuk semua environments:**
   - Production ✓
   - Preview ✓
   - Development ✓

4. **Redeploy:**
   - Deployments → pilih latest → ... → Redeploy
   - Atau push ulang ke repository

## Vercel CLI (Optional)

Install Vercel CLI:
```bash
npm i -g vercel
```

Deploy:
```bash
vercel --prod
```

## Troubleshooting

### Error "Command exited with 126"
- Pastikan environment variables sudah ditambahkan
- Redeploy setelah menambahkan env vars

### Firebase not initialized
- Cek environment variables di Vercel sudah benar
- Restart deployment
