import { LoaderCircle, X } from 'lucide-react';

export function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section>; }
export function SectionTitle({ title, action }) { return <div className="section-title"><h2>{title}</h2>{action}</div>; }
export function Progress({ value = 0, tone = 'purple' }) { return <div className="progress"><span className={`progress-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>; }
export function Pill({ children, tone = 'neutral' }) { return <span className={`pill pill-${tone}`}>{children}</span>; }
export function Empty({ icon: Icon, title, text }) { return <div className="empty-state">{Icon && <Icon size={26}/>}<strong>{title}</strong><span>{text}</span></div>; }
export function Loading({ compact = false }) { return <div className={compact ? 'loading compact' : 'loading'}><LoaderCircle className="spin" size={22}/><span>Cargando...</span></div>; }
export function ErrorBox({ message }) { return message ? <div className="error-box">{message}</div> : null; }
export function Modal({ open, title, children, onClose, wide = false }) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${wide ? 'wide' : ''}`}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}
export function StatMini({ label, value, icon: Icon, tone = 'purple' }) { return <div className="stat-mini"><div className={`stat-icon ${tone}`}>{Icon && <Icon size={18}/>}</div><div><strong>{value}</strong><span>{label}</span></div></div>; }
