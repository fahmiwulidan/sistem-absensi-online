import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, color = 'primary', trend }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className={`stat-card__icon stat-card__icon--${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-card__info">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {trend && <p className="stat-card__trend">{trend}</p>}
      </div>
    </div>
  );
}
