import mongoose from 'mongoose';

export interface ICommand extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  ts: Date;
  type: 'OPEN' | 'CLOSE';
  targetDeviceId: mongoose.Types.ObjectId;
  caseId?: mongoose.Types.ObjectId;
  actor: 'SYSTEM' | 'OPERATOR';
  status: 'SENT' | 'ACK' | 'FAIL';
  response?: string;
  createdAt: Date;
}

const commandSchema = new mongoose.Schema<ICommand>({
  ts: { type: Date, required: true },
  type: { type: String, enum: ['OPEN', 'CLOSE'], required: true },
  targetDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  actor: { type: String, enum: ['SYSTEM', 'OPERATOR'], required: true },
  status: { type: String, enum: ['SENT', 'ACK', 'FAIL'], default: 'SENT' },
  response: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICommand>('Command', commandSchema);