import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authApi } from '../../services/api';
import { CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');



  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdError('Konfirmasi password baru tidak cocok');
      return;
    }

    if (pwdData.newPassword.length < 6) {
      setPwdError('Password baru minimal 6 karakter');
      return;
    }

    setIsChangingPwd(true);
    try {
      await authApi.changePassword({
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });
      setPwdSuccess('Password akun guru berhasil diubah!');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      setPwdError(err.message || 'Gagal mengubah password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Akun Guru</h1>
          <p className="page-subtitle">Kelola keamanan akun dan ubah password</p>
        </div>
      </div>

      {pwdSuccess && (
        <div className="alert-box alert-box--success">
          <CheckCircle2 size={18} />
          <span>{pwdSuccess}</span>
        </div>
      )}

      {pwdError && (
        <div className="alert-box alert-box--error">
          <AlertCircle size={18} />
          <span>{pwdError}</span>
        </div>
      )}

      <Card>
        <Card.Header>
          <Card.Title>Ubah Password Akun</Card.Title>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handlePasswordChange}>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Password Lama *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password saat ini"
                  value={pwdData.currentPassword}
                  onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru * (Min. 6 Karakter)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password baru"
                  value={pwdData.newPassword}
                  onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ulangi password baru"
                  value={pwdData.confirmPassword}
                  onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="md" isLoading={isChangingPwd}>
                <KeyRound size={16} style={{ marginRight: '0.375rem' }} /> Perbarui Password
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
}
