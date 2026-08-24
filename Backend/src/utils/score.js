function proximityScore(actual, target, tolerance = 0.1) {
  if (!target || target <= 0) return 100;
  const ratio = actual / target;
  if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) return 100;
  if (ratio < 1 - tolerance) return Math.max(0, (ratio / (1 - tolerance)) * 100);
  return Math.max(0, 100 - ((ratio - (1 + tolerance)) / 0.5) * 100);
}

export function calculateDailyScore({ totals, goals, waterLiters, waterGoal, gymRequired, gymDone, distanceMeters = 0, distanceGoalMeters = 0, sleepHours = 0, sleepGoal = 0 }) {
  const nutrition = (
    proximityScore(totals.calories, goals.calories) + proximityScore(totals.protein, goals.protein) +
    proximityScore(totals.carbs, goals.carbs) + proximityScore(totals.fats, goals.fats)
  ) / 4;
  const hydration = proximityScore(waterLiters, waterGoal, 0.05);
  const gym = gymRequired ? (gymDone ? 100 : 0) : 100;
  const activity = distanceGoalMeters > 0 ? Math.min(100, (distanceMeters / distanceGoalMeters) * 100) : 100;
  const sleep = sleepGoal > 0 ? proximityScore(sleepHours, sleepGoal, 0.12) : 100;
  return Math.round(nutrition * 0.5 + hydration * 0.2 + gym * 0.12 + activity * 0.1 + sleep * 0.08);
}
