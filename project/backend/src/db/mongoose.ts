import mongoose from 'mongoose';
import { config } from '../config.js';

export async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});