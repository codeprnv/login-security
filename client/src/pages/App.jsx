import React from 'react';

const App = () => {
  return (
    <div>
      <div className='flex items-center justify-center'>
        <form action=''>
          <div className='bg-red-400 text-2xl'>Sign Up</div>
          <label>First Name</label>
          <input type='text' />
          <label>Last Name</label>
          <input type='text' />
          <label>Mobile</label>
          <input type='number' />
          <label>Email</label>
          <input type='email' />
          <label>Password</label>
          <input type='password' />
          <div>
            <button>Sign In Google </button>
            <button>Sign In Email </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
