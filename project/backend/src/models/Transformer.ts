import mongoose from 'mongoose';

export interface ITransformer extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  geo: {
    lat: number;
    lng: number;
  };
  feederId: string;
  hasLTSwitch: boolean;
  ltSwitchDeviceId?: mongoose.Types.ObjectId;
  status: 'ONLINE' | 'OFFLINE' | 'FAULT';
  createdAt: Date;
}

const transformerSchema = new mongoose.Schema<ITransformer>({
  name: { type: String, required: true },
  geo: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  feederId: { type: String, required: true },
  hasLTSwitch: { type: Boolean, default: false },
  ltSwitchDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  status: { type: String, enum: ['ONLINE', 'OFFLINE', 'FAULT'], default: 'ONLINE' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransformer>('Transformer', transformerSchema);