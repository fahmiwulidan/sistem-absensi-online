import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
          </form>
        </Card>
      </div>
    </div>
  );
}
