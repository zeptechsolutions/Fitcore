import { config } from '../config.js';
const OFF_BASE = 'https://world.openfoodfacts.org/api/v3/product';

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function per100g(nutriments = {}) {
  return {
    calories: safeNumber(nutriments['energy-kcal_100g']),
    protein: safeNumber(nutriments.proteins_100g),
    carbs: safeNumber(nutriments.carbohydrates_100g),
    fats: safeNumber(nutriments.fat_100g)
  };
}

export async function getProductByBarcode(req, res) {
  const barcode = String(req.params.barcode || '').replace(/\D/g, '');
  if (barcode.length < 8 || barcode.length > 14) return res.status(400).json({ message: 'Invalid barcode' });

  const fields = [
    'code','product_name','generic_name','brands','quantity','serving_size','serving_quantity',
    'nutriments','nutrition_grades','categories','countries'
  ].join(',');
  const response = await fetch(`${OFF_BASE}/${encodeURIComponent(barcode)}?fields=${encodeURIComponent(fields)}`, {
    headers: { 'User-Agent': config.openFoodFactsUserAgent },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return res.status(502).json({ message: 'Nutrition provider unavailable' });
  const data = await response.json();
  if (!data?.product) return res.status(404).json({ message: 'Product not found' });

  const product = data.product;
  res.json({
    source: 'open_food_facts',
    barcode: data.code || barcode,
    name: product.product_name || product.generic_name || 'Unknown product',
    brand: product.brands || null,
    packageQuantity: product.quantity || null,
    servingSize: product.serving_size || null,
    servingQuantityGrams: safeNumber(product.serving_quantity) || null,
    nutritionGrade: product.nutrition_grades || null,
    macrosPer100g: per100g(product.nutriments),
    note: 'Product data is community-sourced; review the nutrition label before saving.'
  });
}

export async function calculateBarcodeServing(req, res) {
  const barcode = String(req.params.barcode || '').replace(/\D/g, '');
  const grams = Number(req.body.grams);
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) return res.status(400).json({ message: 'grams must be between 0 and 5000' });

  const fields = 'code,product_name,generic_name,brands,nutriments';
  const response = await fetch(`${OFF_BASE}/${encodeURIComponent(barcode)}?fields=${encodeURIComponent(fields)}`, {
    headers: { 'User-Agent': config.openFoodFactsUserAgent },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return res.status(502).json({ message: 'Nutrition provider unavailable' });
  const data = await response.json();
  if (!data?.product) return res.status(404).json({ message: 'Product not found' });

  const base = per100g(data.product.nutriments);
  const factor = grams / 100;
  const totals = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Number((v * factor).toFixed(1))]));
  res.json({
    barcode: data.code || barcode,
    name: data.product.product_name || data.product.generic_name || 'Unknown product',
    brand: data.product.brands || null,
    grams,
    totals,
    mealItem: { name: data.product.product_name || 'Product', quantity: grams, unit: 'g', ...totals }
  });
}
