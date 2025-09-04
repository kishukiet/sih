import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: 'OPERATOR' | 'SUPERVISOR' | 'ENGINEER';
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['OPERATOR', 'SUPERVISOR', 'ENGINEER'], default: 'OPERATOR' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', userSchema);