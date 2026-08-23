export const todayISO = () => new Date().toISOString().slice(0, 10);
export const n = (value, digits = 0) => Number(value || 0).toLocaleString('es-SV', { maximumFractionDigits: digits });
export const pct = (value, goal) => goal > 0 ? Math.min(100, Math.round((Number(value || 0) / Number(goal)) * 100)) : 0;
export const shortDate = (value) => new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short' }).format(new Date(value));
export const fullDate = (value = new Date()) => new Intl.DateTimeFormat('es-SV', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value));
export const goalLabel = { gain: 'Ganar peso', lose: 'Perder peso', maintain: 'Mantener', recomp: 'Recomposición', tracking: 'Seguimiento' };
