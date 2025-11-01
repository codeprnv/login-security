import geoip from 'geoip-lite';
import nodemailer from 'nodemailer';
import LoginLog from '../models/LoginLog.js';

export const logLoginAttempt = async (
  userId,
  email,
  ipAddress,
  deviceInfo,
  geo,
  loginStatus,
  isSuspicious = false,
  mfaVerified = false,
  suspicionReasons = []
) => {
  try {
    const loginLog = new LoginLog({
      userId: userId || null,
      email: email,
      ipAddress: ipAddress,
      location: {
        country: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown',
        latitude: geo?.ll?.[0] || null,
        longitude: geo?.ll?.[1] || null,
      },
      deviceInfo: {
        deviceType: deviceInfo?.deviceType || 'Unknown',
        browser: deviceInfo?.browser || 'Unknown',
        os: deviceInfo?.os || 'Unknown',
        userAgent: deviceInfo?.userAgent || 'Unknown',
      },
      loginStatus: loginStatus, // 'success' or 'failed'
      isSuspicious: isSuspicious,
      suspicionReasons: suspicionReasons || [],
      mfaVerified: mfaVerified,
      timestamp: new Date(),
    });

    await loginLog.save();
    console.log(
      `Login ${loginStatus} logged for ${email} from ${geo?.country}`
    );

    return loginLog;
  } catch (error) {
    console.error('Error logging login attempt:', error);
    // Don't throw error here to prevent login flow from breaking
    return null;
  }
};

export const detectSuspiciousLogin = async (user, ipAddress, geo) => {
  const suspicionReasons = [];

  try {
    // Reason 1: Check if IP is in trusted devices
    const trustedDevice = user.trustedDevices?.find(
      (device) => device.ip === ipAddress
    );

    if (!trustedDevice) {
      suspicionReasons.push('Login from new IP address');
    }

    // Reason 2: Check for impossible travel
    // Get the most recent successful login
    const recentSuccessfulLogin = await LoginLog.findOne({
      userId: user._id,
      loginStatus: 'success',
      timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    }).sort({ timestamp: -1 });

    if (recentSuccessfulLogin && geo && recentSuccessfulLogin.location) {
      // Calculate distance between two coordinates using Haversine formula
      const distance = calculateDistance(
        recentSuccessfulLogin.location.latitude,
        recentSuccessfulLogin.location.longitude,
        geo.ll[0],
        geo.ll[1]
      );

      // Calculate time elapsed in hours
      const timeElapsed =
        (new Date() - recentSuccessfulLogin.timestamp) / (1000 * 60 * 60);

      // Calculate required speed (km/h)
      const requiredSpeed = distance / timeElapsed;

      // Commercial flights travel at max ~900 km/h
      if (requiredSpeed > 900 && timeElapsed < 24) {
        suspicionReasons.push(
          `Impossible travel detected: ${distance.toFixed(0)} km in ${timeElapsed.toFixed(1)} hours`
        );
      }
    }

    // Reason 3: Check for login from new country
    if (geo && user.trustedDevices.length > 0) {
      const knownCountries = new Set(
        user.trustedDevices.map((device) => device.country || 'Unknown')
      );

      if (!knownCountries.has(geo.country)) {
        suspicionReasons.push(`Login from new country: ${geo.country}`);
      }
    }

    // Reason 4: Check for VPN/Proxy usage
    const isVpnOrProxy = checkVpnOrProxy(ipAddress);
    if (isVpnOrProxy) {
      suspicionReasons.push('VPN or proxy detected');
    }

    // Reason 5: Check for known malicious IPs (basic check)
    // In production, integrate with threat intelligence APIs
    if (isKnownMaliciousIP(ipAddress)) {
      suspicionReasons.push('Login from known malicious IP');
    }

    // Reason 6: Multiple failed attempts from same IP recently
    const failedAttemptsFromIP = await LoginLog.countDocuments({
      email: user.email,
      ipAddress: ipAddress,
      loginStatus: 'failed',
      timestamp: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 minutes
    });

    if (failedAttemptsFromIP >= 3) {
      suspicionReasons.push(
        `Multiple failed login attempts (${failedAttemptsFromIP}) from this IP`
      );
    }

    return suspicionReasons.length > 0 ? suspicionReasons : false;
  } catch (error) {
    console.error('Error detecting suspicious login:', error);
    return false;
  }
};

export const sendSuspiciousLoginAlert = async (
  user,
  ipAddress,
  deviceInfo,
  geo,
  suspicionReasons
) => {
  try {
    // Generate verification token for email links
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    // Store token temporarily (in production, use Redis or database)
    // For now, we'll include it in the email link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const trustDeviceLink = `${baseUrl}/security/trust-device?token=${verificationToken}&email=${user.email}&ip=${ipAddress}`;
    const reportFraudLink = `${baseUrl}/security/report-fraud?token=${verificationToken}&email=${user.email}&ip=${ipAddress}`;

    // Email content
    const emailSubject = '🔒 Suspicious Login Attempt Detected';
    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { color: #d32f2f; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .alert-box { background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .details { background-color: #f9f9f9; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; margin: 10px 5px 10px 0; border-radius: 5px; text-decoration: none; font-weight: bold; }
            .button-trust { background-color: #4CAF50; color: white; }
            .button-report { background-color: #d32f2f; color: white; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">⚠️ Suspicious Login Attempt</div>
            
            <p>Hi ${user.username},</p>
            
            <p>We detected a login attempt on your account that doesn't match your normal activity patterns.</p>
            
            <div class="alert-box">
              <strong>Login Details:</strong><br>
              Location: ${geo?.city || 'Unknown'}, ${geo?.country || 'Unknown'}<br>
              IP Address: ${ipAddress}<br>
              Device: ${deviceInfo?.browser || 'Unknown'} on ${deviceInfo?.os || 'Unknown'}<br>
              Time: ${new Date().toLocaleString()}
            </div>

            <div class="details">
              <strong>Why we flagged this:</strong><br>
              ${suspicionReasons.map((reason) => `• ${reason}`).join('<br>')}
            </div>

            <p><strong>Was this you?</strong></p>
            
            <div>
              <a href="${trustDeviceLink}" class="button button-trust">Yes, this was me</a>
              <a href="${reportFraudLink}" class="button button-report">No, report fraud</a>
            </div>

            <p style="color: #d32f2f; font-weight: bold;">
              If you report this as fraud, we will:
              <br>✓ Lock your account immediately
              <br>✓ Invalidate all active sessions
              <br>✓ Send you a password reset link
            </p>

            <div class="footer">
              <p>This is an automated security alert. Never share this link or your password with anyone.</p>
              <p>If you didn't receive this email, your account may have been compromised. 
                 <a href="${baseUrl}/security">Change your password immediately</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Configure email transporter (Gmail example)
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@brained.com',
      to: user.email,
      subject: emailSubject,
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Suspicious login alert sent to ${user.email}`);

    // Optional: Send SMS alert for high-risk cases
    if (suspicionReasons.length > 2) {
      // await sendSuspiciousSMSAlert(user.phone, ipAddress, geo);
      console.log('SMS alert would be sent in production');
    }

    return true;
  } catch (error) {
    console.error('Error sending suspicious login alert:', error);
    return false;
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

const checkVpnOrProxy = (ipAddress) => {
  // List of known VPN provider IPs (simplified)
  // In production, use APIs like:
  // - IPQualityScore
  // - MaxMind GeoIP2
  // - AbuseIPDB

  const vpnIndicators = [
    '103.145', // Common VPN ranges
    '185.241', // ProtonVPN
    '37.1.208', // NordVPN
  ];

  return vpnIndicators.some((indicator) => ipAddress.startsWith(indicator));
};

const isKnownMaliciousIP = (ipAddress) => {
  // In production, check against:
  // - AbuseIPDB API
  // - AlienVault OTX
  // - Shodan
  // - Custom threat databases

  // For now, simple hardcoded list (for demo purposes)
  const knownMaliciousIPs = [
    // Add known malicious IPs here
  ];

  return knownMaliciousIPs.includes(ipAddress);
};
