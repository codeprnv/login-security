import mongoose from 'mongoose';

const authConfigSchema = new mongoose.Schema({
  methodName: {
    type: String,
    enum: ['password', 'mfa', 'biometrics', 'passkeys'],
    unique: true,
  },
  isEnabled: { type: Boolean, default: true },
  isRequired: { type: Boolean, default: false },
  priority: { type: Number },
  settings: {
    passwordExpiryDays: Number,
    sessionTimeoutMinutes: Number,
    maxConcurrentSessions: Number,
    maxFailedAttempts: Number,
    lockoutDurationMinutes: Number,
  },
});

const AuthConfig = mongoose.model('AuthConfig', authConfigSchema);
export default AuthConfig;
