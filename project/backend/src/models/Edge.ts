import mongoose from 'mongoose';

export interface IEdge extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  transformerId: mongoose.Types.ObjectId;
  fromNode: mongoose.Types.ObjectId;
  toNode: mongoose.Types.ObjectId;
  phase: ('R' | 'Y' | 'B')[];
  lengthM: number;
  conductor: string;
  status: 'HEALTHY' | 'SUSPECTED' | 'FAULTY';
  createdAt: Date;
}

const edgeSchema = new mongoose.Schema<IEdge>({
  transformerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transformer', required: true },
  fromNode: { type: mongoose.Schema.Types.ObjectId, required: true },
  toNode: { type: mongoose.Schema.Types.ObjectId, required: true },
  phase: [{ type: String, enum: ['R', 'Y', 'B'] }],
  lengthM: { type: Number, required: true },
  conductor: { type: String, required: true },
  status: { type: String, enum: ['HEALTHY', 'SUSPECTED', 'FAULTY'], default: 'HEALTHY' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IEdge>('Edge', edgeSchema);