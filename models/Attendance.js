import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  email: {
     type: String,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["in", "out", "leave","none"],
    default: "none",
    required: true,
  },

  timeIn: {
    type: Date,
  },

  timeOut: {
    type: Date,
  },
  
   inDescription: {
    type: String,
    default: "",
  },

  outDescription: {
    type: String,
    default: "",
  },

  // Leave-specific only
  description: {
    type: String,
    default: "",
  }
}, { timestamps: true });
attendanceSchema.index({ email: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
