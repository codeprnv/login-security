import { ErrorMessage, Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { loginUser } from '../services/authService';

// Basic validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

// MFA validation schema
const MFASchema = Yup.object().shape({
  mfaCode: Yup.string()
    .matches(/^\d{6}$/, 'MFA code must be 6 digits')
    .required('MFA code is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MFA State
  const [showMFAModal, setShowMFAModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [mfaMethod, setMfaMethod] = useState(null);
  const [mfaAttempts, setMfaAttempts] = useState(0);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  // Suspicious Login State
  const [suspiciousLoginAlert, setSuspiciousLoginAlert] = useState(null);
  const [verifyingLogin, setVerifyingLogin] = useState(false);

  const handleLoginSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Store credentials in case MFA is required
      setCredentials({ email: values.email, password: values.password });

      // Call backend login API
      const response = await loginUser(values.email, values.password);

      if (response.success) {
        // MFA Required - Show MFA modal
        if (response.error === 'MFA code required') {
          setMfaMethod(response.mfaMethod);
          setShowMFAModal(true);
          setErrorMessage('');
          setIsLoading(false);
          setSubmitting(false);
          return;
        }

        // Suspicious Login Detected - Show verification modal
        if (response.requiresAdditionalVerification) {
          setSuspiciousLoginAlert({
            detected: true,
            reasons: response.suspiciousReasons || [
              'Unusual login pattern detected',
            ],
            email: values.email,
          });
          setErrorMessage('');
          setIsLoading(false);
          setSubmitting(false);
          return;
        }

        // Normal successful login
        setSuccessMessage('Login successful! Redirecting...');
        localStorage.setItem(
          'user',
          JSON.stringify({
            email: response.user.email,
            username: response.user.username,
            id: response.user.id,
          })
        );

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handleMFASubmit = async (values) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (mfaAttempts >= 3) {
        setErrorMessage(
          'Too many failed MFA attempts. Please try logging in again.'
        );
        setShowMFAModal(false);
        setMfaAttempts(0);
        setIsLoading(false);
        return;
      }

      // Send MFA code with login
      const response = await loginUser(
        credentials.email,
        credentials.password,
        values.mfaCode
      );

      if (response.success) {
        setSuccessMessage('MFA verified! Redirecting...');
        localStorage.setItem(
          'user',
          JSON.stringify({
            email: response.user.email,
            username: response.user.username,
            id: response.user.id,
          })
        );

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setMfaAttempts(mfaAttempts + 1);
      setErrorMessage(
        `Invalid MFA code. ${3 - mfaAttempts} attempts remaining.`
      );
      console.error('MFA error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspiciousVerification = async (action) => {
    setVerifyingLogin(true);
    setErrorMessage('');

    try {
      if (action === 'verify') {
        // User confirms this was them - proceed with login
        const response = await loginUser(
          credentials.email,
          credentials.password
        );

        if (response.success) {
          setSuccessMessage('Identity verified! Redirecting...');
          localStorage.setItem(
            'user',
            JSON.stringify({
              email: response.user.email,
              username: response.user.username,
              id: response.user.id,
            })
          );

          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } else if (action === 'report') {
        // User reports fraud - show security measures taken
        setErrorMessage('');
        setSuspiciousLoginAlert({
          ...suspiciousLoginAlert,
          reported: true,
          message:
            'Security measures taken. Your account has been locked. A password reset email has been sent.',
        });

        setTimeout(() => {
          setSuspiciousLoginAlert(null);
          navigate('/forgot-password');
        }, 3000);
      }
    } catch (error) {
      setErrorMessage('Verification failed. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setVerifyingLogin(false);
    }
  };

  // Main Login Form
  if (!showMFAModal && !suspiciousLoginAlert) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='w-full max-w-sm rounded-lg bg-white p-8 shadow'>
          <h2 className='mb-2 text-center text-2xl font-semibold'>
            Login to your account
          </h2>
          <p className='mb-6 text-center text-sm text-gray-500'>
            Enter your email and password to access your account
          </p>

          {/* Error Alert */}
          {errorMessage && (
            <div className='mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700'>
              <p className='font-semibold'>Error</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className='mb-4 rounded-md border border-green-400 bg-green-100 p-3 text-sm text-green-700'>
              <p className='font-semibold'>Success</p>
              <p>{successMessage}</p>
            </div>
          )}

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleLoginSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className='space-y-5'>
                {/* Email */}
                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Email
                  </label>
                  <Field
                    type='email'
                    id='email'
                    name='email'
                    placeholder='user@example.com'
                    disabled={isLoading}
                    className={`mt-1 w-full rounded-md border px-3 py-2 transition focus:ring-2 focus:outline-none ${
                      errors.email && touched.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-black'
                    } disabled:bg-gray-100`}
                  />
                  <ErrorMessage
                    name='email'
                    component='div'
                    className='mt-1 text-sm text-red-500'
                  />
                </div>

                {/* Password */}
                <div>
                  <div className='mb-1 flex items-center justify-between'>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Password
                    </label>
                    <a
                      href='/forgot-password'
                      className='text-sm text-blue-600 hover:underline'
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className='relative'>
                    <Field
                      type={showPassword ? 'text' : 'password'}
                      id='password'
                      name='password'
                      placeholder='••••••••'
                      disabled={isLoading}
                      className={`w-full rounded-md border px-3 py-2 pr-10 transition focus:ring-2 focus:outline-none ${
                        errors.password && touched.password
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-black'
                      } disabled:bg-gray-100`}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute top-2 right-3 text-lg text-gray-600 hover:text-gray-900'
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <ErrorMessage
                    name='password'
                    component='div'
                    className='mt-1 text-sm text-red-500'
                  />
                </div>

                {/* Login button */}
                <button
                  type='submit'
                  disabled={isLoading || isSubmitting}
                  className={`w-full rounded-md py-2 font-medium transition ${
                    isLoading || isSubmitting
                      ? 'cursor-not-allowed bg-gray-400 text-white'
                      : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>

                {/* Google login */}
                <button
                  type='button'
                  disabled={isLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 py-2 transition ${
                    isLoading
                      ? 'cursor-not-allowed bg-gray-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img
                    src='https://www.svgrepo.com/show/475656/google-color.svg'
                    alt='Google'
                    className='h-5 w-5'
                  />
                  Login with Google
                </button>
              </Form>
            )}
          </Formik>

          <p className='mt-6 text-center text-sm text-gray-600'>
            Don't have an account?{' '}
            <a
              href='/signup'
              className='font-medium text-black hover:underline'
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    );
  }

  // MFA Modal
  if (showMFAModal) {
    return (
      <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
        <div className='mx-4 w-full max-w-md rounded-lg bg-white p-8'>
          <h3 className='mb-2 text-xl font-semibold'>
            Two-Factor Authentication
          </h3>
          <p className='mb-6 text-sm text-gray-600'>
            Enter the 6-digit code from your authenticator app
          </p>

          {errorMessage && (
            <div className='mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700'>
              {errorMessage}
            </div>
          )}

          <Formik
            initialValues={{ mfaCode: '' }}
            validationSchema={MFASchema}
            onSubmit={handleMFASubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className='space-y-4'>
                <div>
                  <label
                    htmlFor='mfaCode'
                    className='mb-1 block text-sm font-medium text-gray-700'
                  >
                    MFA Code
                  </label>
                  <Field
                    type='text'
                    id='mfaCode'
                    name='mfaCode'
                    placeholder='000000'
                    maxLength='6'
                    disabled={isLoading}
                    className={`w-full rounded-md border px-4 py-2 text-center text-2xl tracking-widest transition focus:ring-2 focus:outline-none ${
                      errors.mfaCode && touched.mfaCode
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-black'
                    } disabled:bg-gray-100`}
                  />
                  <ErrorMessage
                    name='mfaCode'
                    component='div'
                    className='mt-1 text-sm text-red-500'
                  />
                </div>

                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowMFAModal(false);
                      setMfaAttempts(0);
                    }}
                    disabled={isLoading}
                    className='flex-1 rounded-md border border-gray-300 py-2 transition hover:bg-gray-100 disabled:bg-gray-100'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={isLoading || isSubmitting}
                    className={`flex-1 rounded-md py-2 font-medium transition ${
                      isLoading || isSubmitting
                        ? 'cursor-not-allowed bg-gray-400 text-white'
                        : 'bg-black text-white hover:bg-gray-900'
                    }`}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <p className='mt-4 text-center text-sm text-gray-600'>
            Can't access your authenticator app?{' '}
            <button
              type='button'
              className='font-medium text-blue-600 hover:underline'
              onClick={() => {
                // Handle backup code option
                alert('Enter a backup code instead');
              }}
            >
              Use backup code
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Suspicious Login Alert Modal
  if (suspiciousLoginAlert) {
    return (
      <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
        <div className='mx-4 w-full max-w-md rounded-lg bg-white p-8'>
          {suspiciousLoginAlert.reported ? (
            <>
              <h3 className='mb-2 text-lg font-semibold text-green-600'>
                ✅ Security Measures Activated
              </h3>
              <p className='mb-4 text-gray-700'>
                {suspiciousLoginAlert.message}
              </p>
              <p className='text-sm text-gray-600'>
                Check your email for password reset instructions. Your account
                will be unlocked after resetting your password.
              </p>
            </>
          ) : (
            <>
              <div className='mb-4 flex items-center gap-3'>
                <span className='text-3xl'>⚠️</span>
                <h3 className='text-lg font-semibold'>Suspicious Activity</h3>
              </div>

              <p className='mb-4 text-gray-700'>
                We detected unusual activity on your account:
              </p>

              <div className='mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3'>
                <ul className='space-y-1 text-sm text-gray-700'>
                  {suspiciousLoginAlert.reasons.map((reason, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <span className='font-bold text-yellow-600'>•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className='mb-6 text-sm text-gray-600'>
                Was this login attempt authorized by you?
              </p>

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => handleSuspiciousVerification('report')}
                  disabled={verifyingLogin}
                  className={`flex-1 rounded-md py-2 font-medium transition ${
                    verifyingLogin
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {verifyingLogin ? 'Processing...' : 'Report Fraud'}
                </button>
                <button
                  type='button'
                  onClick={() => handleSuspiciousVerification('verify')}
                  disabled={verifyingLogin}
                  className={`flex-1 rounded-md py-2 font-medium transition ${
                    verifyingLogin
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {verifyingLogin ? 'Processing...' : 'Yes, It Was Me'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
};

export default Login;
