import axios from 'axios';

const API_URL = 'https://login-security-s1s9.onrender.com/api/auth';

// Create axios instance with default config
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const registerUser = async (userData) => {
  try {
    const response = await authApi.post('/register', {
      email: userData.email,
      username: userData.email.split('@')[0], // Use email prefix as username
      password: userData.password,
      confirmPassword: userData.confirmPassword,
    });

    // Store access token if registration successful
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || 'Registration failed';
    throw new Error(errorMessage);
  }
};


export const loginUser = async (email, password, mfaCode = null) => {
  try {
    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    console.log('🚀 Attempting login for:', trimmedEmail);

    const response = await authApi.post('/login', {
      email: trimmedEmail,
      password: trimmedPassword,
      ...(mfaCode && { mfaCode: mfaCode.trim() }),
    });

    console.log('✅ Login response:', response.data);

    // Store access token if login successful
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      console.log('✅ Token stored');
    }

    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);

    const errorMessage =
      error.response?.data?.error || error.message || 'Login failed';

    throw new Error(errorMessage);
  }
};


/**
 * Logout user
 */
export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  // Clear refresh token from cookies (handled by backend)
};

/**
 * Get authorization header with token
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
};

export default authApi;
