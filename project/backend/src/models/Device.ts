import mongoose from 'mongoose';

export interface IDevice extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  type: 'LT_SW' | 'RMU' | 'BREAKER' | 'METER';
  ref: mongoose.Types.ObjectId;
  name: string;
  status: 'OPEN' | 'CLOSED';
  capabilities: {
    open: boolean;
    close: boolean;
  };
  createdAt: Date;
}

const deviceSchema = new mongoose.Schema<IDevice>({
  type: { type: String, enum: ['LT_SW', 'RMU', 'BREAKER', 'METER'], required: true },
  ref: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'CLOSED' },
  capabilities: {
    open: { type: Boolean, default: true },
    close: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDevice>('Device', deviceSchema);