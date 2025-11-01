import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true }, // Store hashed
  deviceInfo: {
    deviceType: String,
    browser: String,
    os: String,
    userAgent: String,
  },
  ipAddress: { type: String, required: true },
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number,
  },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;