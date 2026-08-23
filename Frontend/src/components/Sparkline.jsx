export default function Sparkline({ values = [], height = 72 }) {
  if (!values.length) return <div className="spark-empty" style={{height}}>Sin datos todavía</div>;
  const width = 300, pad = 7;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1);
    const y = pad + ((max - v) * (height - pad * 2)) / range;
    return `${x},${y}`;
  }).join(' ');
  return <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none">
    <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
  </svg>;
}
