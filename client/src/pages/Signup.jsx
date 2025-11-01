import React, { useState } from "react";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    mobile: "",
    email: "",
    password: "",
  });

  const onChangeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4">Create your account</h2>
        <p className="mb-6 text-gray-600 text-sm">
          Fill in the form below to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstname"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={onChangeHandler}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Harsh"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastname"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={onChangeHandler}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Vishwakarma"
            />
          </div>

          {/* Mobile */}
          <div>
            <label
              htmlFor="mobile"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Mobile
            </label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={onChangeHandler}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="727847482"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={onChangeHandler}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="m@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="flex justify-between mb-1 text-sm font-medium text-gray-700"
            >
              <span>Password</span>
              <a href="#" className="text-xs text-gray-500 hover:underline">
                Forgot your password?
              </a>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={onChangeHandler}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="********"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900 transition"
          >
            Sign Up
          </button>

          {/* Google signup */}
          <button
            type="button"
            className="w-full border border-gray-300 flex items-center justify-center gap-2 py-2 rounded-md hover:bg-gray-100 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign up with Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-black hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
