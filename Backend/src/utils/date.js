export function dayRange(dateInput = new Date()) {
  const date = new Date(dateInput);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function weekRange(dateInput = new Date()) {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
