import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectMongo } from './db/mongoose.js';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { Logger } from './utils/logger.js';
import { seedDatabase } from './services/seed.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import eventsRoutes from './routes/events.routes.js';
import casesRoutes from './routes/cases.routes.js';
import devicesRoutes from './routes/devices.routes.js';
import graphRoutes from './routes/graph.routes.js';

const app = express();
const server = http.createServer(app);

// Socket.IO setup
export const io = new Server(server, {
  path: '/ws',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/graph', graphRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  Logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    Logger.info(`Client disconnected: ${socket.id}`);
  });
  
  // Handle case approval via websocket
  socket.on('case:approve', async (data) => {
    try {
      // This would typically verify user permissions
      Logger.info('Case approval via websocket', data);
    } catch (error) {
      Logger.error('Websocket case approval error', error);
    }
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongo();
    
    // Seed database if configured
    if (config.seedOnBoot) {
      Logger.info('Seeding database...');
      await seedDatabase();
    }
    
    // Start server
    server.listen(config.port, () => {
      Logger.info(`🚀 Server running on port ${config.port}`);
      Logger.info(`📡 WebSocket available at ws://localhost:${config.port}/ws`);
    });
    
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();