// import axios from 'axios';
import bcrypt from 'bcryptjs';
import geoip from 'geoip-lite';
import jwt from 'jsonwebtoken';
import qrCode from 'qrcode';
import speakeasy from 'speakeasy';
import { UAParser } from 'ua-parser-js';
import LoginLog from '../models/LoginLog.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { getIPInfo } from '../utils/ipDetection.js';
import {
  detectSuspiciousLogin,
  logLoginAttempt,
  sendSuspiciousLoginAlert,
} from '../utils/securityUtils.js';

const signUpController = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error:
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      });
    }

    // Check existing users
    const existingUserByEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    const { ip: ipAddress, geo } = await getIPInfo(req);

    // ✅ NEW: Extract device info and IP during signup
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // const getClientIp = (req) => {
    //   return (
    //     req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    //     req.headers['x-real-ip'] ||
    //     req.socket?.remoteAddress ||
    //     req.ip ||
    //     'Unknown'
    //   );
    // };

    // const ipAddress = getClientIp(req);
    // const geo = geoip.lookup(ipAddress);

    // console.log('📍 Signup IP:', ipAddress);
    // console.log('🌍 Signup Location:', geo);

    const deviceInfo = {
      userAgent: userAgent,
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      deviceType: result.device.type || 'desktop',
    };

    console.log('📍 Signup from IP:', ipAddress);
    console.log(
      '🌍 Location:',
      geo?.city || 'Unknown',
      geo?.country || 'Unknown'
    );
    console.log('📱 Device:', deviceInfo.browser, 'on', deviceInfo.os);

    // ✅ Hash password first to store in password history
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Create user with trusted device and password history
    const newUser = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: password, // Will be hashed by pre-save hook
      passwordChangedAt: new Date(),
      passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),

      // ✅ CRITICAL: Store initial password in history
      passwordHistory: [
        {
          hash: hashedPassword,
          changedAt: new Date(),
        },
      ],

      // ✅ CRITICAL: Add signup device as trusted
      trustedDevices: [
        {
          fingerprint: `${ipAddress}-${deviceInfo.browser}-${deviceInfo.os}`,
          ip: ipAddress,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          country: geo?.country || 'Unknown',
          city: geo?.city || 'Unknown',
          lastSeen: new Date(),
        },
      ],

      mfaEnabled: false,
      mfaMethod: null,
      passkeys: [],
      accountLocked: false,
      failedLoginAttempts: 0,
      role: 'user',
    });

    // Save user
    await newUser.save();

    console.log('✅ New user registered:', email);
    console.log(
      '📱 Trusted device added:',
      deviceInfo.browser,
      'on',
      deviceInfo.os
    );
    console.log('📍 Location:', geo?.city, geo?.country);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field} already exists`,
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }

    console.error('❌ Signup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
};

const signInController = async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;

    // ✅ Get real public IP and geolocation
    const { ip: ipAddress, geo } = await getIPInfo(req);

    // Parse user agent
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceInfo = {
      userAgent: userAgent,
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      deviceType: result.device.type || 'desktop',
    };

    console.log('🔐 Login attempt');
    console.log('   IP:', ipAddress);
    console.log(
      '   Location:',
      geo?.city || 'Unknown',
      geo?.country || 'Unknown'
    );
    console.log('   Device:', deviceInfo.browser, 'on', deviceInfo.os);

    // Find user - TRIM and LOWERCASE
    const email_normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: email_normalized });

    if (!user) {
      console.log('❌ User not found:', email_normalized);
      await logLoginAttempt(
        null,
        email_normalized,
        ipAddress,
        deviceInfo,
        geo,
        'failed',
        false,
        false,
        ['User not found']
      );
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    console.log('✅ User found:', user.email);

    // Check account lock
    if (user.accountLocked && user.lockedUntil > new Date()) {
      console.log('🔒 Account locked:', user.email);
      await logLoginAttempt(
        user._id,
        email_normalized,
        ipAddress,
        deviceInfo,
        geo,
        'failed',
        false,
        false,
        ['Account locked']
      );
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        unlocksAt: user.lockedUntil,
      });
    }

    // Verify password
    console.log('🔐 Comparing passwords...');
    let validPassword = false;

    try {
      validPassword = await user.comparePassword(password.trim());
      console.log('✅ Password validation result:', validPassword);
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError.message);
      validPassword = false;
    }

    if (!validPassword) {
      console.log('❌ Invalid password for:', email_normalized);
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        console.log('🔒 Account locked due to failed attempts');
      }

      await user.save();
      await logLoginAttempt(
        user._id,
        email_normalized,
        ipAddress,
        deviceInfo,
        geo,
        'failed',
        false,
        false,
        ['Invalid password']
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password expiry
    if (user.isPasswordExpired()) {
      console.log('⏰ Password expired for:', email_normalized);
      return res.status(403).json({
        success: false,
        error: 'Password expired',
        requiresReset: true,
      });
    }

    // Suspicious login detection
    console.log('🔍 Checking for suspicious login...');
    const suspiciousReasons = await detectSuspiciousLogin(user, ipAddress, geo);

    if (suspiciousReasons && suspiciousReasons.length > 0) {
      console.log('⚠️ Suspicious login detected:', suspiciousReasons);

      // ✅ Try to send alert but don't block login if it fails
      try {
        await sendSuspiciousLoginAlert(
          user,
          ipAddress,
          deviceInfo,
          geo,
          suspiciousReasons
        );
        console.log('✅ Suspicious login alert sent');
      } catch (emailError) {
        console.error(
          '⚠️ Email alert failed (continuing):',
          emailError.message
        );
      }

      // ✅ Log as suspicious but allow login to continue
      await logLoginAttempt(
        user._id,
        email_normalized,
        ipAddress,
        deviceInfo,
        geo,
        'success', // ✅ Changed to 'success' to allow login
        true, // isSuspicious = true
        false,
        suspiciousReasons
      );

      // ✅ Add device to trusted devices
      const deviceExists = user.trustedDevices.find(
        (device) =>
          device.ip === ipAddress ||
          (device.country === geo?.country &&
            device.browser === deviceInfo.browser)
      );

      if (!deviceExists) {
        user.trustedDevices.push({
          fingerprint: `${ipAddress}-${deviceInfo.browser}-${deviceInfo.os}`,
          ip: ipAddress,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          country: geo?.country || 'Unknown',
          city: geo?.city || 'Unknown',
          lastSeen: new Date(),
        });
        await user.save();
        console.log('✅ New trusted device added');
      }

      // ✅ Continue to token generation instead of returning error
      // Don't block the login - just flag it as suspicious
    }

    // MFA verification
    if (user.mfaEnabled) {
      if (!mfaCode) {
        console.log('📱 MFA required for:', email_normalized);
        return res.status(403).json({
          success: false,
          error: 'MFA code required',
          mfaMethod: user.mfaMethod,
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });

      if (!verified) {
        const backupCodeIndex = user.backupCodes.findIndex(
          (bc) => bc.code === mfaCode && !bc.used
        );

        if (backupCodeIndex === -1) {
          console.log('❌ Invalid MFA code for:', email_normalized);
          await logLoginAttempt(
            user._id,
            email_normalized,
            ipAddress,
            deviceInfo,
            geo,
            'failed',
            false,
            false,
            ['Invalid MFA code']
          );
          return res.status(401).json({
            success: false,
            error: 'Invalid MFA code',
          });
        }

        user.backupCodes[backupCodeIndex].used = true;
        user.backupCodes[backupCodeIndex].usedAt = new Date();
        await user.save();
      }
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    await user.save();
    console.log('✅ Account unlocked and attempts reset');

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Save session with hashed refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // ✅ FIXED: Added expiresAt value
    await Session.create({
      userId: user._id,
      refreshToken: hashedRefreshToken,
      deviceInfo: deviceInfo,
      ipAddress: ipAddress,
      location: geo
        ? {
            country: geo.country,
            city: geo.city,
            latitude: geo.ll[0],
            longitude: geo.ll[1],
          }
        : {
            country: 'Unknown',
            city: 'Unknown',
            latitude: 0,
            longitude: 0,
          },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // ✅ 7 days from now
    });

    // Log successful login (if not already logged as suspicious)
    if (!suspiciousReasons || suspiciousReasons.length === 0) {
      await logLoginAttempt(
        user._id,
        email_normalized,
        ipAddress,
        deviceInfo,
        geo,
        'success',
        false,
        user.mfaEnabled
      );
    }

    console.log('✅ Login successful for:', email_normalized);
    console.log('📍 From:', geo?.city || 'Unknown', geo?.country || 'Unknown');

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again later.',
    });
  }
};


const mfaSetupController = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `YourApp (${user.email})`,
      issuer: 'YourApp',
    });

    // Generate QR code

    const qrCodeDataUrl = await qrCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store encrypted secret (temporarily until verified)
    user.mfaSecret = secret.base32;
    user.backupCodes = backupCodes.map((code) => ({
      code: bcrypt.hashSync(code, 10),
      used: false,
    }));

    await user.save();

    res.json({
      qrCodeDataUrl,
      secret: secret.base32,
      backupCodes, // Show these only once
    });
  } catch (error) {
    res.status(500).json({ error: 'MFA setup failed' });
  }
};

const mfaVerifyController = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.userId);

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (verified) {
      user.mfaEnabled = true;
      user.mfaMethod = 'totp';
      await user.save();

      res.json({ message: 'MFA enabled successfully' });
    } else {
      res.status(401).json({ error: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ error: 'MFA verification failed' });
  }
};

const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find session
    const session = await Session.findOne({
      userId: decoded.userId,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(403).json({ error: 'Session expired' });
    }

    // Verify refresh token hash
    const validToken = await bcrypt.compare(refreshToken, session.refreshToken);

    if (!validToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Check session inactivity (e.g., 30 minutes)
    const inactivityLimit = 30 * 60 * 1000;
    if (new Date() - session.lastUsedAt > inactivityLimit) {
      await Session.deleteOne({ _id: session._id });
      return res
        .status(403)
        .json({ error: 'Session timeout due to inactivity' });
    }

    // Generate new access token
    const user = await User.findById(decoded.userId);
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Update session
    session.lastUsedAt = new Date();
    await session.save();

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Token refresh failed' });
  }
};

const authController = {
  signUpController,
  signInController,
  mfaSetupController,
  mfaVerifyController,
  refreshTokenController,
};
export default authController;
