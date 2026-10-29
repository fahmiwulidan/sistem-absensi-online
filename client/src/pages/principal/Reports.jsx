import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { classesApi, apiRequest } from '../../services/api';
import {
  FileBarChart, Printer, TrendingUp, Users, AlertCircle,
  CheckCircle2, Clock, Filter, RotateCcw, Search, GraduationCap,
  Calendar, Award
} from 'lucide-react';

export default function PrincipalReports() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [stats, setStats] = useState(null);
  const [recapList, setRecapList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    classesApi.getAll()
      .then((cls) => setClasses(cls || []))
      .catch((err) => console.error(err));
  }, []);

  const loadReportData = async () => {
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

      const overallData = statsRes?.overall || statsRes || {};

      setStats({
        total: Number(overallData.total) || 0,
        hadir: Number(overallData.hadir) || 0,
        izin: Number(overallData.izin) || 0,
        sakit: Number(overallData.sakit) || 0,
        alpa: Number(overallData.alpa) || 0,
        percentage: overallData.percentage !== undefined
          ? Number(overallData.percentage)
          : (overallData.total > 0 ? Math.round((overallData.hadir / overallData.total) * 100) : 0),
        byClass: statsRes?.byClass || [],
        monthly: statsRes?.monthly || [],
      });

      setRecapList(Array.isArray(recapRes) ? recapRes : []);
    } catch (err) {
      console.error('Error load principal reports:', err);
      setError(err.message || 'Gagal memuat rekap laporan kehadiran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedClass]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReportData();
  };

  const handleResetFilter = () => {
    setSelectedClass('');
    setDateFrom('');
    setDateTo('');
    setStudentSearch('');
    setTimeout(() => {
      loadReportData();
    }, 50);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter siswa berdasarkan pencarian
  const filteredRecap = recapList.filter((item) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      item.student_name?.toLowerCase().includes(q) ||
      item.nis?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekapitulasi Absensi Sekolah</h1>
          <p className="page-subtitle">Pemantauan eksekutif kehadiran siswa dan tingkat kedisiplinan seluruh kelas</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="page-badge-label">Role: Kepala Sekolah</span>
          <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} style={{ marginRight: '0.375rem' }} /> Cetak Laporan
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-box--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Panel */}
      <Card>
        <Card.Body>
          <form onSubmit={handleFilterSubmit} className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Tingkat / Kelas</label>
              <select
                className="form-control"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Kelas {cls.grade})
                  </option>
                ))}
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

            <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="submit" variant="primary" style={{ flex: 1 }}>
                <Filter size={16} style={{ marginRight: '0.25rem' }} /> Terapkan
              </Button>
              <Button type="button" variant="secondary" onClick={handleResetFilter} title="Reset Filter">
                <RotateCcw size={16} />
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Executive Summary Stats */}
      <div className="stats-grid" style={{ marginTop: '1.25rem' }}>
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Kehadiran"
          value={stats ? `${stats.percentage}%` : '0%'}
          color="success"
        />
        <StatCard
          icon={Users}
          label="Total Hadir"
          value={stats ? stats.hadir.toLocaleString('id-ID') : '0'}
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="Total Izin / Sakit"
          value={stats ? (stats.izin + stats.sakit).toLocaleString('id-ID') : '0'}
          color="warning"
        />
        <StatCard
          icon={AlertCircle}
          label="Alpa"
          value={stats ? stats.alpa.toLocaleString('id-ID') : '0'}
          color="danger"
        />
      </div>

      {/* Breakdown Kehadiran Tiap Kelas */}
      {stats?.byClass && stats.byClass.length > 0 && !selectedClass && (
        <div style={{ marginTop: '1.25rem' }}>
          <Card>
            <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} color="var(--color-primary-600)" />
              <Card.Title>Komparasi Kedisiplinan & Kehadiran per Kelas</Card.Title>
            </Card.Header>
            <Card.Body padding="none">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Kelas</th>
                      <th>Tingkat</th>
                      <th>Total Sesi</th>
                      <th>Hadir</th>
                      <th>Izin/Sakit</th>
                      <th>Alpa</th>
                      <th>Persentase</th>
                      <th>Status Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byClass.map((c) => {
                      const pct = c.total > 0 ? Math.round((c.hadir / c.total) * 100) : 0;
                      return (
                        <tr key={c.class_id}>
                          <td><strong>{c.class_name}</strong></td>
                          <td>Kelas {c.grade}</td>
                          <td>{c.total.toLocaleString('id-ID')}</td>
                          <td style={{ color: 'var(--color-success-600)', fontWeight: 600 }}>
                            {c.hadir.toLocaleString('id-ID')}
                          </td>
                          <td style={{ color: 'var(--color-warning-600)', fontWeight: 600 }}>
                            {((c.izin || 0) + (c.sakit || 0)).toLocaleString('id-ID')}
                          </td>
                          <td style={{ color: 'var(--color-danger-600)', fontWeight: 600 }}>
                            {c.alpa.toLocaleString('id-ID')}
                          </td>
                          <td>
                            <strong>{pct}%</strong>
                          </td>
                          <td>
                            <Badge variant={pct >= 80 ? 'success' : pct >= 65 ? 'warning' : 'danger'}>
                              {pct >= 80 ? 'Sangat Baik' : pct >= 65 ? 'Cukup Baik' : 'Perlu Perhatian'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Detail Rekapitulasi Tiap Siswa */}
      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Card.Title>Rincian Kehadiran Siswa</Card.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px' }}>
              <div className="search-input-wrapper" style={{ margin: 0, width: '100%' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari siswa atau NIS..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ padding: '0.375rem 0.75rem 0.375rem 2.25rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </Card.Header>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat rekapitulasi data absensi dari PostgreSQL...</p>
              </div>
            ) : filteredRecap.length === 0 ? (
              <div className="empty-state">
                <FileBarChart size={36} />
                <p>Tidak ditemukan data absensi untuk kriteria yang dipilih.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>NIS</th>
                      <th>Nama Siswa</th>
                      <th>Kelas</th>
                      <th>Total Pertemuan</th>
                      <th>Hadir</th>
                      <th>Izin</th>
                      <th>Sakit</th>
                      <th>Alpa</th>
                      <th style={{ width: '180px' }}>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecap.map((st) => (
                      <tr key={st.student_id}>
                        <td><strong>{st.nis}</strong></td>
                        <td>{st.student_name}</td>
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
