import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
  type: String,
  required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['team', 'admin'],  
    default: 'admin'
  },
  under_admin: {
    type: String, // or use mongoose.Schema.Types.ObjectId if you want to reference Admin
    required: function () {
      return this.role === 'team';
    },},
  inTime: {
    type: Date
  },
  outTime: {
    type: Date
  },
  isStarEmployee: {
  type: Boolean,
  default: false
  },
   status: {
    type: String,
    enum: ['none', 'in', 'out', 'leave'],
    default: 'none'
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
