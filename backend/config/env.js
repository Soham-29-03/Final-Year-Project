import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve .env path relative to this file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const env = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(url => url.trim()).filter(Boolean),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "6996405b43b2a936966cc41d47740f5374dac75ade084ea0954ad316a29bc704506572ae14d9be42a9f6671d042140bec02e7efbf28074e4027ddf45a3144afa",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  },
};

export const isProduction = env.nodeEnv === 'production';