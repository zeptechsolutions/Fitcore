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
  aiModel: process.env.AI_MODEL || 'gemini-3.5-flash-lite',
  openFoodFactsUserAgent: process.env.OPENFOODFACTS_USER_AGENT || 'Zhealth/2.0 (local development)',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `Zhealth <${process.env.EMAIL_USER}>` : ''),
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
  appUrl: process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  cronSecret: process.env.CRON_SECRET || ''
};
