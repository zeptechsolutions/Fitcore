import { Router } from 'express';
import { requireAuth } from '../utils/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateBarcodeServing, getProductByBarcode } from '../controllers/nutritionController.js';

const router = Router();
router.use(requireAuth);
router.get('/barcode/:barcode', asyncHandler(getProductByBarcode));
router.post('/barcode/:barcode/calculate', asyncHandler(calculateBarcodeServing));
export default router;
