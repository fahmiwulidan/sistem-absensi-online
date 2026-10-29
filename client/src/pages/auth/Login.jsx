import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, BookOpen, Info, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import './Login.css';

const DEMO_CREDENTIALS = [
  { role: 'Admin', username: 'admin', password: 'admin123', email: 'admin@smahb.sch.id' },
  { role: 'Kepala Sekolah', username: 'kepsek', password: 'kepsek123', email: 'kepsek@smahb.sch.id' },
  { role: 'Guru', username: 'guru1 - guru12', password: 'guru123', email: 'guru[1-12]@smahb.sch.id' },
  { role: 'Siswa', username: 'siswa1 - siswa180', password: 'siswa123', email: 'siswa[1-180]@smahb.sch.id' },
  { role: 'Orang Tua', username: 'ortu1 - ortu150', password: 'ortu123', email: 'ortu[1-150]@smahb.sch.id' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      const role = userData?.role;
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'guru') navigate('/teacher', { replace: true });
      else if (role === 'siswa') navigate('/student', { replace: true });
      else if (role === 'orangtua') navigate('/parent', { replace: true });
      else if (role === 'kepsek') navigate('/principal', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Gagal login. Periksa username dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div className="login-logo-icon">
            <BookOpen size={32} color="var(--color-primary-600)" />
          </div>
          <h1>SMA Harapan Bangsa</h1>
          <p>Sistem Informasi Absensi Online</p>
        </div>

        <Card className="login-card">
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <Input
              label="Username atau Email"
              type="text"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan username atau email"
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} style={{ marginTop: '0.5rem' }}>
              Masuk ke Sistem
            </Button>

            <div className="login-demo-trigger-wrapper">
              <button
                type="button"
                className="login-demo-trigger"
                onClick={() => setIsDemoModalOpen(true)}
              >
                <Info size={15} />
                <span>Kredensial Demo</span>
              </button>
            </div>
          </form>
        </Card>
      </div>

      {isDemoModalOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsDemoModalOpen(false)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <div>
                <h2>Kredensial Demo</h2>
                <p>Akun pengujian hak akses sistem berdasarkan peran pengguna.</p>
              </div>
              <button
                type="button"
                className="demo-modal-close"
                onClick={() => setIsDemoModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="demo-modal-body">
              {DEMO_CREDENTIALS.map((cred, idx) => (
                <div key={idx} className="demo-cred-card">
                  <div>
                    <span className="demo-cred-role">{cred.role}</span>
                    <div className="demo-cred-email">{cred.email}</div>
                  </div>
                  <div className="demo-cred-details">
                    <code className="demo-code-badge">{cred.username}</code>
                    <code className="demo-code-badge password">{cred.password}</code>
                  </div>
                </div>
              ))}
            </div>

            <div className="demo-modal-footer">
              <button type="button" onClick={() => setIsDemoModalOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
