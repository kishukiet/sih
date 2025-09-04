import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ltgrid',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  port: parseInt(process.env.PORT || '8080'),
  seedOnBoot: process.env.SEED_ON_BOOT === 'true',
  nodeEnv: process.env.NODE_ENV || 'development'
};