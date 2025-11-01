// import axios from 'axios';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import Session from '../models/Session.js';
import User from '../models/User.js';
import qrCode from qrcode;

    const signUpController = async (req, res) => {
        try {
          const { email, username, password, confirmPassword } = req.body;
      
          // Validation: Check if all fields are provided
          if (!email || !username || !password || !confirmPassword) {
            return res.status(400).json({
              success: false,
              error: 'All fields are required: email, username, password, confirmPassword'
            });
          }
      
          // Validation: Check if passwords match
          if (password !== confirmPassword) {
            return res.status(400).json({
              success: false,
              error: 'Passwords do not match'
            });
          }
      
          // Validation: Email format check
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return res.status(400).json({
              success: false,
              error: 'Invalid email format'
            });
          }
      
          // Validation: Password strength requirements
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          if (!passwordRegex.test(password)) {
            return res.status(400).json({
              success: false,
              error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
            });
          }
      
          // Validation: Username length and format
          if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
              success: false,
              error: 'Username must be between 3 and 20 characters'
            });
          }
      
          if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({
              success: false,
              error: 'Username can only contain letters, numbers, underscores, and hyphens'
            });
          }
      
          // Check if user already exists (email)
          const existingUserByEmail = await User.findOne({
            email: email.toLowerCase()
          });
      
          if (existingUserByEmail) {
            return res.status(409).json({
              success: false,
              error: 'Email already registered. Please try logging in or use a different email'
            });
          }
      
          // Check if user already exists (username)
          const existingUserByUsername = await User.findOne({
            username: username.toLowerCase()
          });
      
          if (existingUserByUsername) {
            return res.status(409).json({
              success: false,
              error: 'Username already taken. Please choose a different username'
            });
          }
      
          // List of common passwords to reject
          const commonPasswords = [
            'password', '123456', '12345678', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
          ];
      
          if (commonPasswords.includes(password.toLowerCase())) {
            return res.status(400).json({
              success: false,
              error: 'Password is too common. Please choose a stronger password'
            });
          }
      
          // Hash the password using bcrypt (12 rounds for strong security)
          // Note: User.js should have a pre-save hook to hash this automatically
          // But we can also hash it here for explicit control
          const hashedPassword = await bcrypt.hash(password, 12);
      
          // Create new user document
          const newUser = new User({
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password: hashedPassword,
            passwordChangedAt: new Date(),
            // Password expires in 90 days
            passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            // Initialize empty password history
            passwordHistory: [],
            // MFA disabled by default
            mfaEnabled: false,
            mfaMethod: null,
            // Biometrics and passkeys arrays start empty
            passkeys: [],
            // Account security fields
            accountLocked: false,
            failedLoginAttempts: 0,
            // Role set to 'user' by default
            role: 'user'
          });
      
          // Save user to database
          await newUser.save();
      
          // Log successful registration
          console.log(`New user registered: ${email} with username: ${username}`);
      
          // Optional: Send welcome email
          // await sendWelcomeEmail(email, username);
      
          // Return success response with user info (excluding sensitive data)
          return res.status(201).json({
            success: true,
            message: 'User registered successfully. Please log in to continue.',
            user: {
              id: newUser._id,
              email: newUser.email,
              username: newUser.username,
              role: newUser.role
            }
          });
      
        } catch (error) {
          // Handle duplicate key errors more gracefully
          if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
              success: false,
              error: `${field} already exists. Please use a different ${field}`
            });
          }
      
          // Handle validation errors from schema
          if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
              success: false,
              error: messages.join(', ')
            });
          }
      
          // Generic error handler
          console.error('Signup error:', error);
          return res.status(500).json({
            success: false,
            error: 'An error occurred during registration. Please try again later.'
          });
        }
      };
      

const signInController = async (req, res) => {
    try {
        const { email, password, mfaCode } = req.body;
        
        // Extract device info
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        const geo = geoip.lookup(ipAddress);
        
        // const deviceInfo = {
        //   userAgent,
        //   browser: /* parse from userAgent */,
        //   os: /* parse from userAgent */,
        //   deviceType: /* detect from userAgent */
        // };
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
          await logLoginAttempt(null, email, ipAddress, deviceInfo, geo, 'failed');
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check account lock
        if (user.accountLocked && user.lockedUntil > new Date()) {
          return res.status(423).json({ 
            error: 'Account locked',
            unlocksAt: user.lockedUntil 
          });
        }
        
        // Verify password
        const validPassword = await User.comparePassword(password, user.password)
        
        if (!validPassword) {
          // Increment failed attempts
          user.failedLoginAttempts += 1;
          
          if (user.failedLoginAttempts >= 5) {
            user.accountLocked = true;
            user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
          }
          
          await user.save();
          await logLoginAttempt(user._id, email, ipAddress, deviceInfo, geo, 'failed');
          
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password expiry
        if (user.passwordExpiresAt && user.passwordExpiresAt < new Date()) {
          return res.status(403).json({ 
            error: 'Password expired',
            requiresReset: true 
          });
        }
        
        // Suspicious login detection
        const isSuspicious = await detectSuspiciousLogin(user, ipAddress, geo);
        
        if (isSuspicious) {
          // Send alert email/SMS
          await sendSuspiciousLoginAlert(user, ipAddress, deviceInfo);
          
          // Require additional verification
          return res.status(403).json({
            error: 'Suspicious login detected',
            requiresAdditionalVerification: true
          });
        }
        
        // MFA verification
        if (user.mfaEnabled) {
          if (!mfaCode) {
            return res.status(403).json({ 
              error: 'MFA code required',
              mfaMethod: user.mfaMethod 
            });
          }
          
          const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: mfaCode,
            window: 2 // Allow 2 time steps for clock skew
          });
          
          if (!verified) {
            // Check backup codes
            const backupCode = user.backupCodes.find(
              bc => bc.code === mfaCode && !bc.used
            );
            
            if (!backupCode) {
              return res.status(401).json({ error: 'Invalid MFA code' });
            }
            
            // Mark backup code as used
            backupCode.used = true;
            backupCode.usedAt = new Date();
            await user.save();
          }
        }
        
        // Reset failed attempts on successful login
        user.failedLoginAttempts = 0;
        user.accountLocked = false;
        await user.save();
        
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
        
        // Save session
        await Session.create({
          userId: user._id,
          refreshToken: await bcrypt.hash(refreshToken, 10),
          deviceInfo,
          ipAddress,
          location: geo ? {
            country: geo.country,
            city: geo.city,
            latitude: geo.ll[0],
            longitude: geo.ll[1]
          } : {},
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        
        // Log successful login
        await logLoginAttempt(
          user._id, 
          email, 
          ipAddress, 
          deviceInfo, 
          geo, 
          'success',
          isSuspicious,
          user.mfaEnabled
        );
        
        // Set refresh token in HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.json({
          accessToken,
          user: {
            id: user._id,
            email: user.email,
            username: user.username
          }
        });
        
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
};

const mfaSetupController = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        // Generate secret
        const secret = speakeasy.generateSecret({
          name: `YourApp (${user.email})`,
          issuer: 'YourApp'
        });
        
        // Generate QR code
        
        const qrCodeDataUrl = await qrCode.toDataURL(secret.otpauth_url);
        
        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
        
        // Store encrypted secret (temporarily until verified)
        user.mfaSecret = secret.base32;
        user.backupCodes = backupCodes.map(code => ({
          code: bcrypt.hashSync(code, 10),
          used: false
        }));
        
        await user.save();
        
        res.json({
          qrCodeDataUrl,
          secret: secret.base32,
          backupCodes // Show these only once
        });
        
      } catch (error) {
        res.status(500).json({ error: 'MFA setup failed' });
      }
}

const mfaVerifyController = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.userId);
        
        const verified = speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token,
          window: 2
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
    
}

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
          expiresAt: { $gt: new Date() }
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
          return res.status(403).json({ error: 'Session timeout due to inactivity' });
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
}

const authController = {
  signUpController,
  signInController,
    mfaSetupController,
    mfaVerifyController,
    refreshTokenController
};
export default authController;
