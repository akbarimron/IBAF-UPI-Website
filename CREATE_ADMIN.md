# Cara Membuat Admin User

## Opsi 1: Manual di Firebase Console (RECOMMENDED)

1. Buka Firebase Console: https://console.firebase.google.com/project/ibaf-upi/firestore
2. Klik **Firestore Database** di menu kiri
3. Klik **Start Collection** atau pilih collection `users` jika sudah ada
4. Klik **Add Document**
5. Isi dengan:
   - **Document ID**: (Copy UID dari Authentication)
   - **Field 1**: 
     - Field: `email`
     - Type: `string`
     - Value: email admin Anda
   - **Field 2**:
     - Field: `role`
     - Type: `string`
     - Value: `admin`
   - **Field 3**:
     - Field: `name`
     - Type: `string`
     - Value: Nama admin
   - **Field 4**:
     - Field: `createdAt`
     - Type: `string`
     - Value: `2025-12-08`
6. Klik **Save**

## Opsi 2: Update User yang Sudah Ada

1. Login ke aplikasi dengan akun yang ingin dijadikan admin
2. Buka Firebase Console: https://console.firebase.google.com/project/ibaf-upi/firestore
3. Buka collection `users`
4. Cari document dengan email Anda
5. Klik document tersebut
6. Edit field `role` dari `user` menjadi `admin`
7. Save
8. Logout dari aplikasi
9. Login ulang → sekarang akan masuk ke Admin Dashboard

## Opsi 3: Register User Baru Lalu Edit

1. Klik **Register** di aplikasi
2. Isi form registrasi dengan email yang ingin dijadikan admin
3. Setelah berhasil register, buka Firebase Console
4. Ikuti langkah Opsi 2 di atas

## Cara Cek UID User

1. Buka Firebase Console: https://console.firebase.google.com/project/ibaf-upi/authentication
2. Klik tab **Users**
3. Copy **User UID** dari user yang ingin dijadikan admin
