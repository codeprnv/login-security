import axios from 'axios';
import geoip from 'geoip-lite';

/**
 * Get the true client IP address
 * Handles proxies, load balancers, and localhost
 */
export const getClientIP = (req) => {
  // Priority order for IP extraction
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() || // Proxy/Load balancer
    req.headers['x-real-ip'] || // Nginx proxy
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.headers['true-client-ip'] || // Cloudflare Enterprise
    req.connection?.remoteAddress || // Direct connection
    req.socket?.remoteAddress || // Socket connection
    req.ip || // Express default
    'Unknown';

  console.log('🔍 Extracted IP:', ip);
  return ip;
};

/**
 * Fetch public IP using external API (fallback for localhost)
 * Use this when getClientIP returns localhost
 */
export const fetchPublicIP = async () => {
  const apis = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://ipapi.co/json/',
  ];

  for (const apiUrl of apis) {
    try {
      console.log('🌐 Fetching public IP from:', apiUrl);
      const response = await axios.get(apiUrl, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      const publicIP = response.data.ip || response.data.query;

      if (publicIP) {
        console.log('✅ Public IP detected:', publicIP);
        return publicIP;
      }
    } catch (error) {
      console.log('⚠️ Failed to fetch from', apiUrl);
      continue;
    }
  }

  console.error('❌ All public IP APIs failed');
  return null;
};

/**
 * Get IP address with automatic fallback
 * If localhost detected, fetches real public IP
 */
export const getResolvedIP = async (req) => {
  let ip = getClientIP(req);

  // Check if IP is localhost
  const isLocalhost =
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('::ffff:127.0.0.1');

  if (isLocalhost) {
    console.log('🏠 Localhost detected, fetching public IP...');
    const publicIP = await fetchPublicIP();
    if (publicIP) {
      ip = publicIP;
      console.log('✅ Using public IP:', ip);
    } else {
      console.log('⚠️ Could not fetch public IP, using localhost');
    }
  }

  return ip;
};

/**
 * Get geolocation from IP
 */
export const getGeolocation = async (ipAddress) => {
  try {
    console.log('📍 Looking up geolocation for:', ipAddress);

    // Try local geoip database first (fast)
    let geo = geoip.lookup(ipAddress);

    if (geo) {
      console.log('✅ Geolocation (geoip-lite):', geo.city, geo.country);
      return geo;
    }

    // Fallback to IP-API (more accurate but slower)
    console.log('📡 Trying IP-API for geolocation...');
    try {
      const response = await axios.get(
        `http://ip-api.com/json/${ipAddress}?fields=country,countryCode,region,city,lat,lon,timezone,isp,org,query`,
        { timeout: 5000 }
      );

      if (response.data.status === 'success') {
        geo = {
          country: response.data.countryCode,
          region: response.data.region,
          city: response.data.city,
          ll: [response.data.lat, response.data.lon],
          timezone: response.data.timezone,
          isp: response.data.isp,
          org: response.data.org,
        };
        console.log('✅ Geolocation (IP-API):', geo.city, geo.country);
        return geo;
      }
    } catch (apiError) {
      console.log('⚠️ IP-API failed:', apiError.message);
    }

    // Return null if all methods fail
    console.log('❌ No geolocation data found');
    return null;
  } catch (error) {
    console.error('❌ Geolocation error:', error.message);
    return null;
  }
};

/**
 * Get complete IP info (IP + Geolocation)
 */
export const getIPInfo = async (req) => {
  const ip = await getResolvedIP(req);
  const geo = await getGeolocation(ip);

  return {
    ip,
    geo,
    timestamp: new Date(),
  };
};
