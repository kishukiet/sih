import Event, { IEvent } from '../models/Event.js';
import Case from '../models/Case.js';
import Meter from '../models/Meter.js';
import { scoreAllEdges, Evidence } from '../utils/scoring.js';
import { Logger } from '../utils/logger.js';
import { io } from '../index.js';

export async function processEvent(event: IEvent) {
  Logger.info(`Processing event: ${event.type}`, { eventId: event._id });
  
  if (event.type === 'LAST_GASP' || event.type === 'V_SAG') {
    const transformerId = await getTransformerId(event);
    if (transformerId) {
      await checkForFault(transformerId);
    }
  }
  
  // Mark as processed
  await Event.findByIdAndUpdate(event._id, { processed: true });
  
  // Emit to frontend
  io.emit('event:new', event);
}

async function getTransformerId(event: IEvent): Promise<string | null> {
  if (event.transformerId) {
    return event.transformerId.toString();
  }
  
  if (event.meterId) {
    const meter = await Meter.findById(event.meterId);
    return meter ? meter.transformerId.toString() : null;
  }
  
  return null;
}

async function checkForFault(transformerId: string) {
  // Check if there's already an active case
  const activeCase = await Case.findOne({ 
    transformerId, 
    state: { $in: ['NEW', 'PLANNED'] } 
  });
  
  if (activeCase) {
    Logger.info('Active case already exists', { transformerId, caseId: activeCase._id });
    return;
  }
  
  // Gather evidence from recent events (last 30 seconds)
  const since = new Date(Date.now() - 30 * 1000);
  const events = await Event.find({
    transformerId,
    ts: { $gte: since },
    type: { $in: ['LAST_GASP', 'V_SAG', 'PHASE_LOSS'] }
  }).populate('meterId');
  
  const evidence: Evidence = {
    lastGasps: events.filter(e => e.type === 'LAST_GASP'),
    voltageSags: events.filter(e => e.type === 'V_SAG'),
    phaseLosses: events.filter(e => e.type === 'PHASE_LOSS')
  };
  
  // Need sufficient evidence to proceed
  if (evidence.lastGasps.length < 2) {
    Logger.info('Insufficient evidence for fault detection', { 
      transformerId, 
      lastGaspCount: evidence.lastGasps.length 
    });
    return;
  }
  
  Logger.info('Analyzing potential fault', { transformerId, evidence: {
    lastGasps: evidence.lastGasps.length,
    voltageSags: evidence.voltageSags.length,
    phaseLosses: evidence.phaseLosses.length
  }});
  
  // Score all edges and find the most likely fault location
  const rankedEdges = await scoreAllEdges(transformerId, evidence);
  const topEdge = rankedEdges[0];
  
  if (!topEdge || topEdge.confidence < 0.7) {
    Logger.info('No confident fault location found', { 
      transformerId, 
      topScore: topEdge?.score || 0,
      confidence: topEdge?.confidence || 0
    });
    return;
  }
  
  Logger.info('Fault detected with high confidence', { 
    transformerId, 
    edgeId: topEdge.edgeId,
    confidence: topEdge.confidence,
    affectedMeters: topEdge.downstreamMeterIds.length
  });
  
  // Create new case
  const newCase = await Case.create({
    startTs: new Date(),
    transformerId,
    candidateEdgeId: topEdge.edgeId,
    confidence: topEdge.confidence,
    affectedMeters: topEdge.downstreamMeterIds,
    plan: {
      kind: 'NOTIFY_ONLY', // Will be updated by isolation planner
      targets: []
    },
    state: 'NEW'
  });
  
  // Plan isolation strategy
  await planIsolation(newCase);
  
  // Emit to frontend
  io.emit('case:new', newCase);
}

async function planIsolation(caseDoc: any) {
  const { default: isolationPlanner } = await import('./isolator.js');
  await isolationPlanner.planIsolation(caseDoc);
}