import React, { useState } from 'react';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    mobile: '',
    email: '',
    password: '',
  });

  const onChangeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <div className='m-10 w-full max-w-sm rounded-lg bg-white p-8 shadow'>
        <h2 className='mb-2 text-center text-2xl font-semibold'>
          Create an account
        </h2>
        <p className='mb-6 text-center text-sm text-gray-500'>
          Enter your details below to create your account
        </p>

        <form className='space-y-3'>
          <div>
            <label
              htmlFor='firstname'
              className='block text-sm font-medium text-gray-700'
            >
              First Name
            </label>
            <input
              type='text'
              id='firstname'
              name='firstname'
              placeholder='Harsh'
              value={formData.firstname}
              onChange={onChangeHandler}
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

          <div>
            <label
              htmlFor='lastname'
              className='block text-sm font-medium text-gray-700'
            >
              Last Name
            </label>
            <input
              type='text'
              id='lastname'
              name='lastname'
              placeholder='Vishwakarma'
              value={formData.lastname}
              onChange={onChangeHandler}
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

          <div>
            <label
              htmlFor='mobile'
              className='block text-sm font-medium text-gray-700'
            >
              Mobile
            </label>
            <input
              type='text'
              id='mobile'
              name='mobile'
              placeholder='727847482'
              value={formData.mobile}
              onChange={onChangeHandler}
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

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
              name='email'
              placeholder='m@example.com'
              value={formData.email}
              onChange={onChangeHandler}
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700'
            >
              Password
            </label>
            <input
              type='password'
              id='password'
              name='password'
              placeholder='********'
              value={formData.password}
              onChange={onChangeHandler}
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none'
            />
          </div>

          <button
            type='submit'
            className='w-full rounded-md bg-black py-2 text-white transition hover:bg-gray-800'
          >
            Sign up
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
            Sign up with Google
          </button>
        </form>

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
