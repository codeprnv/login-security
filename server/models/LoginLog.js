import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: String,
  ipAddress: { type: String, required: true },
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number,
  },
  deviceInfo: {
    deviceType: String,
    browser: String,
    os: String,
    userAgent: String,
  },
  loginStatus: { type: String, enum: ['success', 'failed'], required: true },
  isSuspicious: { type: Boolean, default: false },
  suspicionReasons: [String],
  mfaVerified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);
export default LoginLog;
