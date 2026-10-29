import './Card.css';

export default function Card({ children, className = '', padding = 'md', style }) {
  return (
    <div className={`ui-card ui-card--p-${padding} ${className}`} style={style}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '', style }) {
  return <div className={`ui-card__header ${className}`} style={style}>{children}</div>;
};

Card.Title = function CardTitle({ children, className = '', style }) {
  return <h3 className={`ui-card__title ${className}`} style={style}>{children}</h3>;
};

Card.Body = function CardBody({ children, className = '', style }) {
  return <div className={`ui-card__body ${className}`} style={style}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '', style }) {
  return <div className={`ui-card__footer ${className}`} style={style}>{children}</div>;
};
