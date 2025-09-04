import Edge, { IEdge } from '../models/Edge.js';
import Meter, { IMeter } from '../models/Meter.js';
import { IEvent } from '../models/Event.js';

export interface Evidence {
  lastGasps: IEvent[];
  voltageSags: IEvent[];
  phaseLosses: IEvent[];
}

export interface ScoredEdge {
  edgeId: string;
  edge: IEdge;
  score: number;
  confidence: number;
  downstreamMeterIds: string[];
}

export async function scoreAllEdges(transformerId: string, evidence: Evidence): Promise<ScoredEdge[]> {
  const edges = await Edge.find({ transformerId });
  const meters = await Meter.find({ transformerId });
  
  const scored: ScoredEdge[] = [];
  
  for (const edge of edges) {
    const score = await scoreEdge(edge, meters, evidence);
    const downstreamMeters = await getDownstreamMeters(edge, meters);
    
    scored.push({
      edgeId: edge._id.toString(),
      edge,
      score: score.total,
      confidence: Math.min(score.total / 10, 0.95), // Normalize to 0-1
      downstreamMeterIds: downstreamMeters.map(m => m._id.toString())
    });
  }
  
  return scored.sort((a, b) => b.score - a.score);
}

async function scoreEdge(edge: IEdge, cohort: IMeter[], evidence: Evidence) {
  const { downstream, upstream } = await partitionByEdge(edge, cohort);
  
  // S1: Last gasp count in downstream
  const s1 = countLastGasp(downstream, evidence);
  
  // S2: Voltage delta difference
  const s2 = medianDeltaV(downstream, evidence) - medianDeltaV(upstream, evidence);
  
  // S3: Phase loss fraction in downstream
  const s3 = fracPhaseLoss(downstream, evidence);
  
  // Weighted combination
  const total = 0.6 * s1 + 0.3 * Math.max(0, s2) + 0.1 * s3;
  
  return { s1, s2, s3, total };
}

async function partitionByEdge(edge: IEdge, meters: IMeter[]) {
  // Simplified partitioning - in reality, would use graph traversal
  // For demo, assume meters closer to toNode are downstream
  const downstream = meters.filter(m => 
    Math.random() > 0.5 // Simple random partition for demo
  );
  const upstream = meters.filter(m => !downstream.includes(m));
  
  return { downstream, upstream };
}

function countLastGasp(meters: IMeter[], evidence: Evidence): number {
  const meterIds = new Set(meters.map(m => m._id.toString()));
  return evidence.lastGasps.filter(e => 
    e.meterId && meterIds.has(e.meterId.toString())
  ).length;
}

function medianDeltaV(meters: IMeter[], evidence: Evidence): number {
  const meterIds = new Set(meters.map(m => m._id.toString()));
  const sags = evidence.voltageSags
    .filter(e => e.meterId && meterIds.has(e.meterId.toString()))
    .map(e => e.payload.deltaV || 0);
  
  if (sags.length === 0) return 0;
  
  sags.sort((a, b) => a - b);
  const mid = Math.floor(sags.length / 2);
  return sags.length % 2 === 0 ? (sags[mid - 1] + sags[mid]) / 2 : sags[mid];
}

function fracPhaseLoss(meters: IMeter[], evidence: Evidence): number {
  const meterIds = new Set(meters.map(m => m._id.toString()));
  const phaseLossCount = evidence.phaseLosses.filter(e => 
    e.meterId && meterIds.has(e.meterId.toString())
  ).length;
  
  return meters.length > 0 ? phaseLossCount / meters.length : 0;
}

async function getDownstreamMeters(edge: IEdge, meters: IMeter[]): Promise<IMeter[]> {
  // Simplified - would use proper graph traversal in production
  return meters.filter(m => Math.random() > 0.6); // Demo: random subset
}