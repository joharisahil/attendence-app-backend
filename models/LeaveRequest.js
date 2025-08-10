// models/LeaveRequest.js
import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  email:{type:String,required:true},
  status: { type: String, enum: ['pending', 'approved', 'rejected','expired'], default: 'pending' },
  reason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
