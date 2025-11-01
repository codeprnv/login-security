import React from 'react';

const Login = () => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-sm rounded-lg bg-white p-8 shadow'>
        <h2 className='mb-2 text-center text-2xl font-semibold'>
          Login to your account
        </h2>
        <p className='mb-6 text-center text-sm text-gray-500'>
          Enter your email below to login to your account
        </p>

        <form className='space-y-5'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              Email
            </label>
            <input
              type='email'
              id='email'
              placeholder='m@example.com'
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

          <div>
            <div className='flex items-center justify-between'>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <a href='#' className='text-sm text-gray-500 hover:underline'>
                Forgot your password?
              </a>
            </div>
            <input
              type='password'
              id='password'
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

          <button
            type='submit'
            className='w-full rounded-md bg-black py-2 text-white transition hover:bg-gray-800'
          >
            Login
          </button>

          <button
            type='button'
            className='flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 py-2 transition hover:bg-gray-100'
          >
            <img
              src='https://www.svgrepo.com/show/475656/google-color.svg'
              alt='Google'
              className='h-5 w-5'
            />
            Login with Google
          </button>
        </form>

        <p className='mt-6 text-center text-sm text-gray-600'>
          Don’t have an account?{' '}
          <a href='/signup' className='font-medium text-black hover:underline'>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
