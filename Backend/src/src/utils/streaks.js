function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function consecutiveDays(dates = [], fromDate = new Date()) {
  const set = new Set(dates.map(dateKey));
  const cursor = new Date(fromDate);
  cursor.setHours(0,0,0,0);
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
