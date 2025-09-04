import express from 'express';
import Transformer from '../models/Transformer.js';
import Edge from '../models/Edge.js';
import Meter from '../models/Meter.js';
import { authenticate } from '../middleware/auth.js';
import { seedDatabase } from '../services/seed.js';

const router = express.Router();

router.post('/seed', authenticate, async (req, res) => {
  try {
    const result = await seedDatabase();
    res.json({ message: 'Database seeded successfully', ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

router.get('/transformers', authenticate, async (req, res) => {
  try {
    const transformers = await Transformer.find()
      .sort({ name: 1 });
    
    res.json(transformers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transformers' });
  }
});

router.get('/transformers/:id/edges', authenticate, async (req, res) => {
  try {
    const edges = await Edge.find({ transformerId: req.params.id })
      .sort({ lengthM: 1 });
    
    res.json(edges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch edges' });
  }
});

router.get('/transformers/:id/meters', authenticate, async (req, res) => {
  try {
    const meters = await Meter.find({ transformerId: req.params.id })
      .sort({ serviceNo: 1 });
    
    res.json(meters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meters' });
  }
});

export default router;