function proximityScore(actual, target, tolerance = 0.1) {
  if (!target || target <= 0) return 100;
  const ratio = actual / target;
  if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) return 100;
  if (ratio < 1 - tolerance) return Math.max(0, (ratio / (1 - tolerance)) * 100);
  return Math.max(0, 100 - ((ratio - (1 + tolerance)) / 0.5) * 100);
}

export function calculateDailyScore({ totals, goals, waterLiters, waterGoal, gymRequired, gymDone }) {
  const nutrition = (
    proximityScore(totals.calories, goals.calories) +
    proximityScore(totals.protein, goals.protein) +
    proximityScore(totals.carbs, goals.carbs) +
    proximityScore(totals.fats, goals.fats)
  ) / 4;

  const hydration = proximityScore(waterLiters, waterGoal, 0.05);
  const gym = gymRequired ? (gymDone ? 100 : 0) : 100;

  return Math.round(nutrition * 0.6 + hydration * 0.25 + gym * 0.15);
}
