import express from 'express';
import Case from '../models/Case.js';
import { authenticate, authorize } from '../middleware/auth.js';
import isolator from '../services/isolator.js';

const router = express.Router();

router.get('/active', authenticate, async (req, res) => {
  try {
    const cases = await Case.find({ 
      state: { $in: ['NEW', 'PLANNED'] } 
    })
      .populate('transformerId candidateEdgeId affectedMeters')
      .sort({ startTs: -1 });
    
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active cases' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('transformerId candidateEdgeId affectedMeters plan.targets');
    
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    res.json(caseDoc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

router.post('/:id/approve', authenticate, authorize(['OPERATOR', 'SUPERVISOR']), async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    if (caseDoc.state !== 'PLANNED') {
      return res.status(400).json({ error: 'Case must be in PLANNED state to approve' });
    }
    
    await isolator.executePlan(caseDoc);
    
    res.json({ message: 'Case approved and execution started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve case' });
  }
});

router.post('/:id/block', authenticate, authorize(['SUPERVISOR']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const caseDoc = await Case.findByIdAndUpdate(
      req.params.id,
      { 
        state: 'CLOSED',
        blockReason: reason || 'Blocked by supervisor'
      },
      { new: true }
    );
    
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    res.json(caseDoc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to block case' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const cases = await Case.find()
      .populate('transformerId')
      .sort({ startTs: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Case.countDocuments();
    
    res.json({
      cases,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

export default router;