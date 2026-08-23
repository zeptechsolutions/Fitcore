export function levelFromXp(xp = 0) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function xpForNextLevel(level = 1) {
  return Math.pow(level, 2) * 100;
}
