function ageFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age > 0 ? age : null;
}

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export function buildPersonalPlan(userLike = {}) {
  const weightKg = Number(userLike.currentWeightKg || userLike.startingWeightKg);
  const heightCm = Number(userLike.heightCm);
  const age = ageFromBirthDate(userLike.birthDate);
  if (!weightKg || !heightCm || !age) {
    const err = new Error('Birth date, height and current weight are required to generate a personalized plan');
    err.statusCode = 400;
    throw err;
  }

  const sex = userLike.biologicalSex || 'unspecified';
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const sexConstant = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  const bmr = base + sexConstant;
  const activityFactor = activityFactors[userLike.activityLevel] || activityFactors.moderate;
  const tdee = bmr * activityFactor;
  const goal = userLike.goal || 'tracking';

  let calories = tdee;
  let proteinPerKg = 1.4;
  let strategy = 'maintenance';
  let weeklyChangeLb = 0;

  if (goal === 'lose') {
    const deficit = Math.min(750, Math.max(250, tdee * 0.15));
    calories = tdee - deficit;
    proteinPerKg = 1.8;
    strategy = 'moderate_deficit';
    weeklyChangeLb = -(deficit * 7 / 3500);
  } else if (goal === 'gain') {
    const surplus = Math.min(500, Math.max(300, tdee * 0.10));
    calories = tdee + surplus;
    proteinPerKg = 1.6;
    strategy = 'gradual_surplus';
    weeklyChangeLb = surplus * 7 / 3500;
  } else if (goal === 'recomp') {
    calories = tdee * 0.97;
    proteinPerKg = 1.7;
    strategy = 'recomposition';
    weeklyChangeLb = 0;
  } else if (goal === 'maintain' || goal === 'tracking') {
    proteinPerKg = goal === 'maintain' ? 1.5 : 1.4;
  }

  // Avoid aggressive plans below a sensible buffer above estimated resting needs.
  calories = Math.max(calories, bmr * 1.08);
  const protein = Math.round(weightKg * proteinPerKg);
  const fats = Math.max(40, Math.round((calories * 0.27) / 9));
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

  const targetWeightKg = Number(userLike.targetWeightKg);
  const targetDifferenceLb = targetWeightKg ? (targetWeightKg - weightKg) * 2.2046226218 : null;
  const estimatedWeeksToTarget = targetDifferenceLb !== null && Math.abs(weeklyChangeLb) > 0.01 && Math.sign(targetDifferenceLb) === Math.sign(weeklyChangeLb) ? Math.ceil(Math.abs(targetDifferenceLb / weeklyChangeLb)) : null;

  const assumptions = [
    'Energy needs are estimates and should be adjusted from real progress over time.',
    sex === 'unspecified' ? 'Sex was not specified, so Zhealth used a midpoint estimate for resting energy.' : null,
    'This plan is for general fitness tracking and is not medical or dietetic advice.'
  ].filter(Boolean);

  return {
    generatedAt: new Date(),
    strategy,
    bmr: Math.round(bmr),
    estimatedTdee: Math.round(tdee),
    calories: Math.round(calories),
    protein,
    carbs,
    fats,
    estimatedWeeklyChangeLb: Number(weeklyChangeLb.toFixed(2)),
    targetDifferenceLb: targetDifferenceLb === null ? null : Number(targetDifferenceLb.toFixed(1)),
    estimatedWeeksToTarget,
    assumptions,
    inputs: {
      age,
      biologicalSex: sex,
      heightCm,
      weightKg: Number(weightKg.toFixed(2)),
      activityLevel: userLike.activityLevel || 'moderate',
      goal
    }
  };
}
