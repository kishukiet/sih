import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Transformer from '../models/Transformer.js';
import Edge from '../models/Edge.js';
import Meter from '../models/Meter.js';
import Device from '../models/Device.js';
import { Logger } from '../utils/logger.js';

export async function seedDatabase() {
  Logger.info('Starting database seeding...');
  
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Transformer.deleteMany({}),
      Edge.deleteMany({}),
      Meter.deleteMany({}),
      Device.deleteMany({})
    ]);
    
    // Create demo users
    const users = await User.insertMany([
      {
        email: 'operator@example.com',
        passwordHash: await bcrypt.hash('demo', 10),
        role: 'OPERATOR'
      },
      {
        email: 'supervisor@example.com',
        passwordHash: await bcrypt.hash('demo', 10),
        role: 'SUPERVISOR'
      },
      {
        email: 'engineer@example.com',
        passwordHash: await bcrypt.hash('demo', 10),
        role: 'ENGINEER'
      }
    ]);
    
    Logger.info(`Created ${users.length} demo users`);
    
    // Create sample transformers in a grid pattern
    const transformers = [];
    const baseLatLng = { lat: 28.6139, lng: 77.2090 }; // Delhi coordinates
    
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 4; j++) {
        const hasLTSwitch = Math.random() > 0.7; // 30% have LT switches
        
        const transformer = await Transformer.create({
          name: `TX-${String.fromCharCode(65 + i)}${j + 1}`,
          geo: {
            lat: baseLatLng.lat + (i * 0.01),
            lng: baseLatLng.lng + (j * 0.015)
          },
          feederId: `FEEDER-${Math.floor(i / 2) + 1}`,
          hasLTSwitch,
          status: 'ONLINE'
        });
        
        transformers.push(transformer);
        
        // Create LT switch device if transformer has one
        if (hasLTSwitch) {
          const ltSwitch = await Device.create({
            type: 'LT_SW',
            ref: transformer._id,
            name: `${transformer.name}-LT-SW`,
            status: 'CLOSED',
            capabilities: { open: true, close: true }
          });
          
          await Transformer.findByIdAndUpdate(transformer._id, {
            ltSwitchDeviceId: ltSwitch._id
          });
        }
        
        // Create some RMU devices
        if (Math.random() > 0.8) {
          await Device.create({
            type: 'RMU',
            ref: transformer._id,
            name: `${transformer.name}-RMU`,
            status: 'CLOSED',
            capabilities: { open: true, close: true }
          });
        }
      }
    }
    
    Logger.info(`Created ${transformers.length} transformers`);
    
    // Create edges (LT spans) between transformers
    const edges = [];
    for (const transformer of transformers) {
      const edgeCount = 3 + Math.floor(Math.random() * 4); // 3-6 edges per transformer
      
      for (let i = 0; i < edgeCount; i++) {
        const edge = await Edge.create({
          transformerId: transformer._id,
          fromNode: new mongoose.Types.ObjectId(),
          toNode: new mongoose.Types.ObjectId(),
          phase: ['R', 'Y', 'B'],
          lengthM: 50 + Math.random() * 200, // 50-250 meters
          conductor: Math.random() > 0.5 ? 'OVERHEAD' : 'UNDERGROUND',
          status: 'HEALTHY'
        });
        
        edges.push(edge);
      }
    }
    
    Logger.info(`Created ${edges.length} edges`);
    
    // Create meters for each transformer
    const meters = [];
    for (const transformer of transformers) {
      const meterCount = 8 + Math.floor(Math.random() * 12); // 8-20 meters per transformer
      
      for (let i = 0; i < meterCount; i++) {
        const hasDisconnect = Math.random() > 0.6; // 40% have remote disconnect
        const medicalPriority = Math.random() > 0.95; // 5% are medical priority
        
        const meter = await Meter.create({
          serviceNo: `${transformer.name}-M${String(i + 1).padStart(3, '0')}`,
          nodeId: new mongoose.Types.ObjectId(),
          transformerId: transformer._id,
          hasDisconnect,
          medicalPriority,
          lastSeenAt: new Date(Date.now() - Math.random() * 3600000), // Within last hour
          commsStatus: Math.random() > 0.1 ? 'ONLINE' : 'OFFLINE',
          geo: {
            lat: transformer.geo.lat + (Math.random() - 0.5) * 0.008,
            lng: transformer.geo.lng + (Math.random() - 0.5) * 0.008
          }
        });
        
        meters.push(meter);
        
        // Create meter device if it has remote disconnect
        if (hasDisconnect) {
          await Device.create({
            type: 'METER',
            ref: meter._id,
            name: `${meter.serviceNo}-DISC`,
            status: 'CLOSED',
            capabilities: { open: true, close: true }
          });
        }
      }
    }
    
    Logger.info(`Created ${meters.length} meters`);
    
    Logger.info('Database seeding completed successfully!');
    
    return {
      users: users.length,
      transformers: transformers.length,
      edges: edges.length,
      meters: meters.length
    };
    
  } catch (error) {
    Logger.error('Database seeding failed', error);
    throw error;
  }
}