# Setup Email Verifikasi Firebase

## Fitur yang Sudah Diimplementasikan

✅ Email verifikasi otomatis saat register  
✅ Validasi email verified saat login  
✅ Resend verification email  
✅ Custom redirect URL setelah verifikasi  
✅ Halaman konfirmasi email terkirim  

## Cara Mencegah Email Masuk Spam

### 1. Kustomisasi Email Template di Firebase Console

1. Buka Firebase Console: https://console.firebase.google.com
2. Pilih project Anda
3. Masuk ke **Authentication** → **Templates**
4. Pilih **Email address verification**
5. Klik **Edit template**

### 2. Template Email yang Disarankan

**Subject:** Verifikasi Email IBAF UPI - Aktivasi Akun

**Body:**
```html
<p>Halo %DISPLAY_NAME%,</p>

<p>Terima kasih telah mendaftar di platform IBAF UPI!</p>

<p>Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:</p>

<a href="%LINK%" style="display: inline-block; padding: 12px 24px; background-color: #B63333; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
  Verifikasi Email Saya
</a>

<p>Atau salin dan tempel link berikut ke browser Anda:</p>
<p>%LINK%</p>

<p><strong>Catatan Penting:</strong></p>
<ul>
  <li>Link verifikasi ini berlaku selama 24 jam</li>
  <li>Jika Anda tidak mendaftar, abaikan email ini</li>
  <li>Jangan bagikan link ini kepada siapa pun</li>
</ul>

<p>Salam,<br>
Tim IBAF UPI</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
<p style="font-size: 12px; color: #666;">
Email ini dikirim secara otomatis. Mohon tidak membalas email ini.<br>
© 2025 IBAF UPI. All rights reserved.
</p>
```

### 3. Konfigurasi Domain di Firebase

**Authorized Domains:**
1. Buka **Authentication** → **Settings** → **Authorized domains**
2. Tambahkan domain production Anda (misal: `ibafupi.com`)
3. Tambahkan `localhost` untuk development

### 4. Setup Custom SMTP (Opsional - Untuk Menghindari Spam)

Untuk email lebih profesional dan menghindari spam:

1. Gunakan layanan SMTP seperti:
   - SendGrid (Free tier 100 emails/day)
   - Mailgun (Free tier 5000 emails/month)
   - AWS SES
   - Gmail SMTP

2. Konfigurasi di Firebase Functions:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

exports.sendVerificationEmail = functions.auth.user().onCreate(async (user) => {
  const verificationLink = // generate link
  
  await transporter.sendMail({
    from: '"IBAF UPI" <noreply@ibafupi.com>',
    to: user.email,
    subject: 'Verifikasi Email IBAF UPI',
    html: // your custom HTML
  });
});
```

### 5. Whitelist Domain di Email Provider

Instruksikan user untuk:
1. Tambahkan `noreply@[your-project-id].firebaseapp.com` ke kontak
2. Mark email sebagai "Not Spam" jika masuk spam
3. Cek folder "Promotions" atau "Updates" (Gmail)

### 6. Tips Mencegah Spam

✅ **Gunakan domain custom** (bukan firebaseapp.com)  
✅ **Setup SPF, DKIM, DMARC records** di DNS  
✅ **Verifikasi domain** di Firebase  
✅ **Jangan gunakan kata spam** (FREE, WINNER, CLICK HERE)  
✅ **Sertakan unsubscribe link** (untuk email marketing)  
✅ **Maintain email reputation** - jangan spam  

### 7. Monitoring

Monitor email delivery:
1. Buka Firebase Console → Authentication → Users
2. Cek kolom "Email verified"
3. Setup Firebase Cloud Logging untuk track email delivery

## Testing

Test dengan berbagai email provider:
- ✅ Gmail
- ✅ Yahoo
- ✅ Outlook/Hotmail
- ✅ Email kampus (.ac.id)

## Troubleshooting

**Email tidak terkirim:**
- Cek Firebase quota
- Cek console.log untuk error
- Pastikan user belum verified

**Email masuk spam:**
- Cek SPF/DKIM settings
- Gunakan custom SMTP
- Improve email content quality

**Link tidak bekerja:**
- Cek authorized domains
- Pastikan actionCodeSettings correct
- Clear browser cache

## Environment Variables (untuk SMTP)

Jika menggunakan custom SMTP, tambahkan ke `.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL=noreply@ibafupi.com
FROM_NAME=IBAF UPI
```

## Next Steps

1. ✅ Implement email verification (Done)
2. ⏳ Setup custom domain
3. ⏳ Configure SMTP
4. ⏳ Setup SPF/DKIM
5. ⏳ Create email templates
6. ⏳ Monitor email deliverability
