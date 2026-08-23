import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-2.5-flash-lite',
  openFoodFactsUserAgent: process.env.OPENFOODFACTS_USER_AGENT || 'FitCore/1.0 (local development)'
};
