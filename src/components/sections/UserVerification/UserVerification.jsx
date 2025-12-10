import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import './UserVerification.css';

const UserVerification = ({ userData, onUpdate, showNotification }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    nim: userData?.nim || '',
    prodi: userData?.prodi || '',
    phoneNumber: userData?.phoneNumber || '',
    jenisKelamin: userData?.jenisKelamin || '',
    isIbafMember: userData?.isIbafMember || false,
    ibafMembershipNumber: userData?.ibafMembershipNumber || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.nim || !formData.prodi || !formData.phoneNumber || !formData.jenisKelamin) {
      if (showNotification) {
        showNotification('Harap isi semua data yang diperlukan', 'warning');
      } else {
        alert('Harap isi semua data yang diperlukan');
      }
      return;
    }

    if (formData.isIbafMember && !formData.ibafMembershipNumber) {
      if (showNotification) {
        showNotification('Harap isi nomor keanggotaan IBAF', 'warning');
      } else {
        alert('Harap isi nomor keanggotaan IBAF');
      }
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        name: formData.fullName, // Update name field with fullName
        verificationStatus: 'pending', // pending, approved, rejected
        verificationRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (showNotification) {
        showNotification('Data berhasil dikirim! Menunggu persetujuan admin.', 'success');
      } else {
        alert('Data berhasil dikirim! Menunggu persetujuan admin.');
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error submitting verification:', error);
      if (showNotification) {
        showNotification('Gagal mengirim data. Silakan coba lagi.', 'error');
      } else {
        alert('Gagal mengirim data. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <h2>📋 Lengkapi Data Diri</h2>
          <p>Silakan lengkapi data diri Anda untuk mengakses fitur dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-group">
            <label>Nama Lengkap <span className="required">*</span></label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>NIM <span className="required">*</span></label>
              <input
                type="text"
                name="nim"
                value={formData.nim}
                onChange={handleChange}
                placeholder="Contoh: 2100123"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Program Studi <span className="required">*</span></label>
            <input
              type="text"
              name="prodi"
              value={formData.prodi}
              onChange={handleChange}
              placeholder="Tulis nama program studi Anda"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Jenis Kelamin <span className="required">*</span></label>
              <select
                name="jenisKelamin"
                value={formData.jenisKelamin}
                onChange={handleChange}
                required
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nomor Telepon <span className="required">*</span></label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isIbafMember"
                checked={formData.isIbafMember}
                onChange={handleChange}
              />
              <span>Saya adalah anggota IBAF</span>
            </label>
          </div>

          {formData.isIbafMember && (
            <div className="form-group ibaf-member-field">
              <label>Nomor Keanggotaan IBAF <span className="required">*</span></label>
              <input
                type="text"
                name="ibafMembershipNumber"
                value={formData.ibafMembershipNumber}
                onChange={handleChange}
                placeholder="Masukkan nomor keanggotaan IBAF"
                required={formData.isIbafMember}
              />
              <small>Masukkan nomor keanggotaan IBAF Anda untuk verifikasi</small>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Mengirim...' : '📤 Kirim Data untuk Verifikasi'}
            </button>
          </div>

          <div className="form-note">
            <p><strong>Catatan:</strong></p>
            <ul>
              <li>Data Anda akan diverifikasi oleh admin</li>
              <li>Akses dashboard penuh akan diberikan setelah data disetujui</li>
              <li>Pastikan semua data yang diisi benar dan valid</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserVerification;
