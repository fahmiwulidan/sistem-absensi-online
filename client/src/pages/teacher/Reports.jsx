import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { schedulesApi, apiRequest } from '../../services/api';
import {
  FileBarChart, Printer, TrendingUp, Users, AlertCircle,
  Clock, Filter
} from 'lucide-react';

export default function TeacherReports() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [stats, setStats] = useState(null);
  const [recapList, setRecapList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load classes from teacher's schedules
  useEffect(() => {
    if (!user) return;
    schedulesApi.getAll({ teacher_id: user.ref_id || user.id })
      .then((schedules) => {
        const classMap = new Map();
        (schedules || []).forEach(sc => {
          if (sc.class_id && sc.class_name) {
            classMap.set(sc.class_id, { id: sc.class_id, name: sc.class_name });
          }
        });
        const uniqueClasses = Array.from(classMap.values());
        setClasses(uniqueClasses);
        if (uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  const computeDerivedStats = (recap) => {
    if (!recap || recap.length === 0) return null;
    const totals = recap.reduce((acc, st) => {
      acc.totalSessions += Number(st.total) || 0;
      acc.totalHadir += Number(st.hadir) || 0;
      acc.totalIzin += Number(st.izin) || 0;
      acc.totalSakit += Number(st.sakit) || 0;
      acc.totalAlpa += Number(st.alpa) || 0;
      return acc;
    }, { totalSessions: 0, totalHadir: 0, totalIzin: 0, totalSakit: 0, totalAlpa: 0 });
    const percentage = totals.totalSessions ? Math.round((totals.totalHadir / totals.totalSessions) * 100) : 0;
    return {
      percentage,
      hadir: totals.totalHadir,
      izin: totals.totalIzin,
      sakit: totals.totalSakit,
      alpa: totals.totalAlpa,
      total: totals.totalSessions,
    };
  };

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.append('class_id', selectedClass);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const [statsRes, recapRes] = await Promise.all([
        apiRequest(`/attendances/stats${queryString}`),
        apiRequest(`/attendances/recap${queryString}`),
      ]);

      setStats(statsRes?.overall || {});
      const recapData = recapRes || [];
      setRecapList(recapData);

      if (!statsRes?.overall || !statsRes.overall.total) {
        const derived = computeDerivedStats(recapData);
        setStats(derived);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat rekap laporan absensi');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedClass) {
      loadReportData();
    }
  }, [selectedClass, dateFrom, dateTo]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReportData();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Kehadiran Kelas Ajar</h1>
          <p className="page-subtitle">Rekapitulasi kehadiran siswa pada kelas yang Anda ampu</p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer size={18} style={{ marginRight: '0.375rem' }} /> Cetak Laporan
        </Button>
      </div>

      {error && (
        <div className="alert-box alert-box--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card */}
      <Card>
        <Card.Body>
          <form onSubmit={handleFilterSubmit} className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Kelas Ajar</label>
              <select
                className="form-control"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.length === 0 ? (
                  <option value="">Tidak ada kelas</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dari Tanggal</label>
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sampai Tanggal</label>
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <Button type="submit" variant="primary" style={{ width: '100%' }}>
                <Filter size={16} style={{ marginRight: '0.25rem' }} /> Terapkan Filter
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid" style={{ marginTop: '1.25rem' }}>
          <StatCard
            icon={TrendingUp}
            label="Tingkat Kehadiran"
            value={`${stats.percentage || 0}%`}
            color="success"
          />
          <StatCard
            icon={Users}
            label="Total Kehadiran"
            value={stats.hadir || 0}
            color="primary"
          />
          <StatCard
            icon={Clock}
            label="Izin / Sakit"
            value={(stats.izin || 0) + (stats.sakit || 0)}
            color="warning"
          />
          <StatCard
            icon={AlertCircle}
            label="Alpa / Tanpa Ket."
            value={stats.alpa || 0}
            color="danger"
          />
        </div>
      )}

      {/* Recap Table */}
      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Header>
            <Card.Title>Tabel Rekapitulasi Siswa</Card.Title>
          </Card.Header>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat rekap laporan...</p>
              </div>
            ) : recapList.length === 0 ? (
              <div className="empty-state">
                <FileBarChart size={36} />
                <p>Belum ada data absensi untuk kelas dan rentang tanggal yang dipilih.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>NIS</th>
                      <th>Nama Siswa</th>
                      <th>Kelas</th>
                      <th>Total Sesi</th>
                      <th>Hadir</th>
                      <th>Izin</th>
                      <th>Sakit</th>
                      <th>Alpa</th>
                      <th style={{ width: '180px' }}>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recapList.map((st) => (
                      <tr key={st.student_id}>
                        <td><strong>{st.nis}</strong></td>
                        <td><strong>{st.student_name}</strong></td>
                        <td>
                          <Badge variant="primary">{st.class_name}</Badge>
                        </td>
                        <td>{st.total}</td>
                        <td style={{ color: 'var(--color-success-600)', fontWeight: 600 }}>{st.hadir}</td>
                        <td style={{ color: 'var(--color-warning-600)', fontWeight: 600 }}>{st.izin}</td>
                        <td style={{ color: 'var(--color-info-600)', fontWeight: 600 }}>{st.sakit}</td>
                        <td style={{ color: 'var(--color-danger-600)', fontWeight: 600 }}>{st.alpa}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              flex: 1,
                              height: '8px',
                              backgroundColor: 'var(--color-gray-200)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${st.percentage}%`,
                                height: '100%',
                                backgroundColor: st.percentage >= 80 ? 'var(--color-success-500)' : st.percentage >= 60 ? 'var(--color-warning-500)' : 'var(--color-danger-500)',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
                              {st.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

    </div>
  );
}
