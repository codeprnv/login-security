import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // Basic User Information
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Password Management
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    passwordExpiresAt: {
      type: Date,
    },
    passwordHistory: [
      {
        hash: String,
        changedAt: Date,
      },
    ], // Store last 5-10 passwords

    // MFA/2FA Configuration
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaMethod: {
      type: String,
      enum: ['totp', 'sms', 'email', null],
      default: null,
    },
    mfaSecret: {
      type: String,
      default: null,
    }, // Encrypted TOTP secret
    backupCodes: [
      {
        code: String,
        used: {
          type: Boolean,
          default: false,
        },
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
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Account Security
    accountLocked: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },

    // Trusted Devices
    trustedDevices: [
      {
        fingerprint: String,
        ip: String,
        browser: String,
        os: String,
        deviceType: String,
        lastSeen: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Password Reset Token
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // User Role
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for email and username for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Pre-save middleware to hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password during login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if password is expired
UserSchema.methods.isPasswordExpired = function () {
  if (!this.passwordExpiresAt) return false;
  return new Date() > this.passwordExpiresAt;
};

// Method to check if account is locked
UserSchema.methods.isAccountLocked = function () {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

// Create and export User model
const User = mongoose.model('User', UserSchema);

export default User;
