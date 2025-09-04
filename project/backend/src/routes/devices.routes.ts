import express from 'express';
import Device from '../models/Device.js';
import Command from '../models/Command.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { transformerId, type } = req.query;
    
    const filter: any = {};
    if (transformerId) filter.ref = transformerId;
    if (type) filter.type = type;
    
    const devices = await Device.find(filter)
      .populate('ref')
      .sort({ name: 1 });
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.post('/:id/open', authenticate, authorize(['OPERATOR', 'SUPERVISOR']), async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!device.capabilities.open) {
      return res.status(400).json({ error: 'Device cannot be opened' });
    }
    
    const command = await Command.create({
      ts: new Date(),
      type: 'OPEN',
      targetDeviceId: device._id,
      actor: 'OPERATOR',
      status: 'SENT'
    });
    
    // Simulate command execution
    setTimeout(async () => {
      try {
        await Device.findByIdAndUpdate(device._id, { status: 'OPEN' });
        await Command.findByIdAndUpdate(command._id, { 
          status: 'ACK',
          response: 'Device opened successfully'
        });
        
        io.emit('device:update', { id: device._id, status: 'OPEN' });
      } catch (error) {
        await Command.findByIdAndUpdate(command._id, { 
          status: 'FAIL',
          response: 'Device operation failed'
        });
      }
    }, 500 + Math.random() * 1500);
    
    res.json({ message: 'Open command sent', commandId: command._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to open device' });
  }
});

router.post('/:id/close', authenticate, authorize(['OPERATOR', 'SUPERVISOR']), async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!device.capabilities.close) {
      return res.status(400).json({ error: 'Device cannot be closed' });
    }
    
    const command = await Command.create({
      ts: new Date(),
      type: 'CLOSE',
      targetDeviceId: device._id,
      actor: 'OPERATOR',
      status: 'SENT'
    });
    
    // Simulate command execution
    setTimeout(async () => {
      try {
        await Device.findByIdAndUpdate(device._id, { status: 'CLOSED' });
        await Command.findByIdAndUpdate(command._id, { 
          status: 'ACK',
          response: 'Device closed successfully'
        });
        
        io.emit('device:update', { id: device._id, status: 'CLOSED' });
      } catch (error) {
        await Command.findByIdAndUpdate(command._id, { 
          status: 'FAIL',
          response: 'Device operation failed'
        });
      }
    }, 500 + Math.random() * 1500);
    
    res.json({ message: 'Close command sent', commandId: command._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close device' });
  }
});

export default router;