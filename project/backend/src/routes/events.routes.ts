import express from 'express';
import Event from '../models/Event.js';
import { processEvent } from '../services/detector.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/ami/last-gasp', authenticate, async (req, res) => {
  try {
    const { meterId, ts } = req.body;
    
    const event = await Event.create({
      ts: ts ? new Date(ts) : new Date(),
      type: 'LAST_GASP',
      meterId,
      payload: { source: 'AMI' }
    });
    
    // Process asynchronously
    processEvent(event).catch(console.error);
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.post('/ami/vsag', authenticate, async (req, res) => {
  try {
    const { meterId, ts, deltaV, phase } = req.body;
    
    const event = await Event.create({
      ts: ts ? new Date(ts) : new Date(),
      type: 'V_SAG',
      meterId,
      payload: { deltaV, phase, source: 'AMI' }
    });
    
    // Process asynchronously
    processEvent(event).catch(console.error);
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.post('/scada/telemetry', authenticate, async (req, res) => {
  try {
    const { transformerId, ts, Irms, status } = req.body;
    
    const event = await Event.create({
      ts: ts ? new Date(ts) : new Date(),
      type: 'SCADA_TELEMETRY',
      transformerId,
      payload: { Irms, status, source: 'SCADA' }
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/recent', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await Event.find()
      .sort({ ts: -1 })
      .limit(limit)
      .populate('meterId transformerId');
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;