export const KG_PER_LB = 0.45359237;

export function lbToKg(lb) {
  const value = Number(lb);
  return Number.isFinite(value) ? Number((value * KG_PER_LB).toFixed(4)) : undefined;
}

export function kgToLb(kg, digits = 1) {
  const value = Number(kg);
  return Number.isFinite(value) ? Number((value / KG_PER_LB).toFixed(digits)) : undefined;
}

export function withWeightLb(value) {
  if (!value) return value;
  const obj = value.toObject ? value.toObject() : { ...value };
  if (obj.weightKg !== undefined) obj.weightLb = kgToLb(obj.weightKg);
  return obj;
}

export function withUserWeightLb(value) {
  if (!value) return value;
  const obj = value.toObject ? value.toObject() : { ...value };
  if (obj.startingWeightKg !== undefined) obj.startingWeightLb = kgToLb(obj.startingWeightKg);
  if (obj.currentWeightKg !== undefined) obj.currentWeightLb = kgToLb(obj.currentWeightKg);
  if (obj.targetWeightKg !== undefined) obj.targetWeightLb = kgToLb(obj.targetWeightKg);
  return obj;
}
