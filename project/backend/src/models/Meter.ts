import mongoose from 'mongoose';

export interface IMeter extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  serviceNo: string;
  nodeId: mongoose.Types.ObjectId;
  transformerId: mongoose.Types.ObjectId;
  hasDisconnect: boolean;
  medicalPriority: boolean;
  lastSeenAt: Date;
  commsStatus: 'ONLINE' | 'OFFLINE' | 'INTERMITTENT';
  geo: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
}

const meterSchema = new mongoose.Schema<IMeter>({
  serviceNo: { type: String, required: true, unique: true },
  nodeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  transformerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transformer', required: true },
  hasDisconnect: { type: Boolean, default: false },
  medicalPriority: { type: Boolean, default: false },
  lastSeenAt: { type: Date, default: Date.now },
  commsStatus: { type: String, enum: ['ONLINE', 'OFFLINE', 'INTERMITTENT'], default: 'ONLINE' },
  geo: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMeter>('Meter', meterSchema);