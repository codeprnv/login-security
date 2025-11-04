import { ErrorMessage, Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { registerUser } from '../services/authService';

// Enhanced validation schema with password strength requirements
const SignupSchema = Yup.object().shape({
  firstname: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First Name is required'),
  lastname: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last Name is required'),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
    .required('Mobile number is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Prepare data for backend (excluding firstName and lastName separately)
      const registrationData = {
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        // You can store firstName and lastName separately if backend needs them
        // For now, backend uses email prefix as username
      };

      // Call backend API
      const response = await registerUser(registrationData);

      if (response.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');

        // Store user info in localStorage (optional)
        localStorage.setItem(
          'user',
          JSON.stringify({
            email: values.email,
            name: `${values.firstname} ${values.lastname}`,
          })
        );

        // Redirect to dashboard or login page after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
          // or navigate('/login') based on your app flow
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(
        error.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-md'>
        <h2 className='mb-4 text-2xl font-semibold'>Create your account</h2>
        <p className='mb-6 text-sm text-gray-600'>
          Fill in the form below to get started
        </p>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className='mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700'>
            <p className='font-semibold'>Error</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Success Message Alert */}
        {successMessage && (
          <div className='mb-4 rounded-md border border-green-400 bg-green-100 p-3 text-sm text-green-700'>
            <p className='font-semibold'>Success</p>
            <p>{successMessage}</p>
          </div>
        )}

        <Formik
          initialValues={{
            firstname: '',
            lastname: '',
            mobile: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={SignupSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form className='space-y-5'>
              {/* First Name */}
              <div>
                <label
                  htmlFor='firstname'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  First Name
                </label>
                <Field
                  type='text'
                  id='firstname'
                  name='firstname'
                  placeholder='Harsh'
                  disabled={isLoading}
                  className={`w-full rounded-md border px-4 py-2 transition focus:ring-2 focus:outline-none ${
                    errors.firstname && touched.firstname
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-black'
                  } disabled:bg-gray-100`}
                />
                <ErrorMessage
                  name='firstname'
                  component='div'
                  className='mt-1 text-sm text-red-500'
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor='lastname'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Last Name
                </label>
                <Field
                  type='text'
                  id='lastname'
                  name='lastname'
                  placeholder='Vishwakarma'
                  disabled={isLoading}
                  className={`w-full rounded-md border px-4 py-2 transition focus:ring-2 focus:outline-none ${
                    errors.lastname && touched.lastname
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-black'
                  } disabled:bg-gray-100`}
                />
                <ErrorMessage
                  name='lastname'
                  component='div'
                  className='mt-1 text-sm text-red-500'
                />
              </div>

              {/* Mobile */}
              <div>
                <label
                  htmlFor='mobile'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Mobile Number
                </label>
                <Field
                  type='tel'
                  id='mobile'
                  name='mobile'
                  placeholder='9876543210'
                  disabled={isLoading}
                  className={`w-full rounded-md border px-4 py-2 transition focus:ring-2 focus:outline-none ${
                    errors.mobile && touched.mobile
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-black'
                  } disabled:bg-gray-100`}
                />
                <ErrorMessage
                  name='mobile'
                  component='div'
                  className='mt-1 text-sm text-red-500'
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor='email'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Email
                </label>
                <Field
                  type='email'
                  id='email'
                  name='email'
                  placeholder='user@example.com'
                  disabled={isLoading}
                  className={`w-full rounded-md border px-4 py-2 transition focus:ring-2 focus:outline-none ${
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
                <label
                  htmlFor='password'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Password
                </label>
                <div className='relative'>
                  <Field
                    type={showPassword ? 'text' : 'password'}
                    autocomplete='current-password'
                    id='password'
                    name='password'
                    placeholder='••••••••'
                    disabled={isLoading}
                    className={`w-full rounded-md border px-4 py-2 pr-10 transition focus:ring-2 focus:outline-none ${
                      errors.password && touched.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-black'
                    } disabled:bg-gray-100`}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute top-2 right-3 text-gray-600 hover:text-gray-900'
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <ErrorMessage
                  name='password'
                  component='div'
                  className='mt-1 text-sm text-red-500'
                />
                {/* Password strength indicator */}
                {values.password && (
                  <div className='mt-2'>
                    <div className='mb-1 text-xs text-gray-600'>
                      Password Requirements:
                    </div>
                    <ul className='space-y-1 text-xs'>
                      <li
                        className={
                          values.password.length >= 8
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ At least 8 characters
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(values.password)
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Uppercase letter
                      </li>
                      <li
                        className={
                          /[a-z]/.test(values.password)
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Lowercase letter
                      </li>
                      <li
                        className={
                          /\d/.test(values.password)
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Number
                      </li>
                      <li
                        className={
                          /[@$!%*?&]/.test(values.password)
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Special character (@$!%*?&)
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Confirm Password
                </label>
                <div className='relative'>
                  <Field
                    autocomplete='current-password'
                    type={showConfirmPassword ? 'text' : 'password'}
                    id='confirmPassword'
                    name='confirmPassword'
                    placeholder='••••••••'
                    disabled={isLoading}
                    className={`w-full rounded-md border px-4 py-2 pr-10 transition focus:ring-2 focus:outline-none ${
                      errors.confirmPassword && touched.confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-black'
                    } disabled:bg-gray-100`}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute top-2 right-3 text-gray-600 hover:text-gray-900'
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <ErrorMessage
                  name='confirmPassword'
                  component='div'
                  className='mt-1 text-sm text-red-500'
                />
              </div>

              {/* Submit button */}
              <button
                type='submit'
                disabled={isLoading || isSubmitting}
                className={`w-full rounded-md py-2 font-medium transition ${
                  isLoading || isSubmitting
                    ? 'cursor-not-allowed bg-gray-400 text-white'
                    : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </button>

              {/* Google signup */}
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
                Sign up with Google
              </button>
            </Form>
          )}
        </Formik>

        <p className='mt-6 text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <a href='/login' className='font-medium text-black hover:underline'>
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
