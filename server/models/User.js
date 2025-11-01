import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const UserSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    passwordChangedAt: { type: Date, default: Date.now },
    passwordExpiresAt: { type: Date },
    passwordHistory: [
      {
        hash: String,
        changedAt: Date,
      },
    ], // Store last 5-10 passwords

    // MFA/2FA
    mfaEnabled: { type: Boolean, default: false },
    mfaMethod: { type: String, enum: ['totp', 'sms', 'email'] },
    mfaSecret: { type: String }, // Encrypted TOTP secret
    backupCodes: [
      {
        code: String,
        used: Boolean,
        usedAt: Date,
      },
    ],

    // Biometrics & Passkeys
    passkeys: [
      {
        credentialID: Buffer,
        publicKey: Buffer,
        counter: Number,
        deviceName: String,
        createdAt: Date,
      },
    ],

    // Account Security
    accountLocked: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },

    // Trusted Devices
    trustedDevices: [
      {
        fingerprint: String,
        ip: String,
        lastSeen: Date,
      },
    ],

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

const User = mongoose.model('User', UserSchema);
export default User;
