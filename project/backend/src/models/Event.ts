import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  ts: Date;
  type: 'LAST_GASP' | 'V_SAG' | 'PHASE_LOSS' | 'SCADA_TELEMETRY';
  meterId?: mongoose.Types.ObjectId;
  transformerId?: mongoose.Types.ObjectId;
  payload: any;
  processed: boolean;
  createdAt: Date;
}

const eventSchema = new mongoose.Schema<IEvent>({
  ts: { type: Date, required: true },
  type: { type: String, enum: ['LAST_GASP', 'V_SAG', 'PHASE_LOSS', 'SCADA_TELEMETRY'], required: true },
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter' },
  transformerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transformer' },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IEvent>('Event', eventSchema);