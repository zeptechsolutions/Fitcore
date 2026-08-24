import { CheckCircle2, LoaderCircle, X } from 'lucide-react';
export function Card({ children, className = '', onClick }) { return <section className={`card ${className}`} onClick={onClick}>{children}</section>; }
export function SectionTitle({ title, action }) { return <div className="section-title"><h2>{title}</h2>{action}</div>; }
export function Progress({ value = 0, tone = 'purple' }) { return <div className="progress"><span className={`progress-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>; }
export function Pill({ children, tone = 'neutral' }) { return <span className={`pill pill-${tone}`}>{children}</span>; }
export function Empty({ icon: Icon, title, text }) { return <div className="empty-state">{Icon && <Icon size={26}/>}<strong>{title}</strong><span>{text}</span></div>; }
export function Loading({ compact = false }) { return <div className={compact ? 'loading compact' : 'loading'}><LoaderCircle className="spin" size={22}/><span>Cargando...</span></div>; }
export function ErrorBox({ message }) { return message ? <div className="error-box">{message}</div> : null; }
export function Modal({ open, title, children, onClose, wide = false }) { if (!open) return null; return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className={`modal ${wide ? 'wide' : ''}`}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>{children}</div></div>; }
export function StatMini({ label, value, icon: Icon, tone = 'purple' }) { return <div className="stat-mini"><div className={`stat-icon ${tone}`}>{Icon && <Icon size={18}/>}</div><div><strong>{value}</strong><span>{label}</span></div></div>; }
export function SuccessAlert({ open, title='¡Listo!', text, onClose }) { if(!open)return null; return <div className="success-alert-backdrop" onClick={onClose}><div className="success-alert" onClick={e=>e.stopPropagation()}><span><CheckCircle2 size={30}/></span><h3>{title}</h3><p>{text}</p><button className="btn primary" onClick={onClose}>Aceptar</button></div></div>; }
