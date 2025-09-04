import mongoose from 'mongoose';

export interface ICase extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  startTs: Date;
  transformerId: mongoose.Types.ObjectId;
  candidateEdgeId: mongoose.Types.ObjectId;
  confidence: number;
  affectedMeters: mongoose.Types.ObjectId[];
  plan: {
    kind: 'LT_SWITCH' | 'UPSTREAM' | 'METER_RING' | 'NOTIFY_ONLY';
    targets: mongoose.Types.ObjectId[];
  };
  state: 'NEW' | 'PLANNED' | 'EXECUTED' | 'CLOSED';
  createdAt: Date;
}

const caseSchema = new mongoose.Schema<ICase>({
  startTs: { type: Date, required: true },
  transformerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transformer', required: true },
  candidateEdgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Edge', required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  affectedMeters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meter' }],
  plan: {
    kind: { type: String, enum: ['LT_SWITCH', 'UPSTREAM', 'METER_RING', 'NOTIFY_ONLY'], required: true },
    targets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
  },
  state: { type: String, enum: ['NEW', 'PLANNED', 'EXECUTED', 'CLOSED'], default: 'NEW' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICase>('Case', caseSchema);