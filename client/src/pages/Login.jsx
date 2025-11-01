import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const handleSubmit = (values) => {
    console.log("Login Data:", values);
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-sm rounded-lg bg-white p-8 shadow'>
        <h2 className='mb-2 text-center text-2xl font-semibold'>
          Login to your account
        </h2>
        <p className='mb-6 text-center text-sm text-gray-500'>
          Enter your email below to login to your account
        </p>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="m@example.com"
                  className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.email && touched.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-black"
                  }`}
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.password && touched.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-black"
                  }`}
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Login button */}
              <button
                type="submit"
                className="w-full py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
              >
                Login
              </button>

              {/* Google login */}
              <button
                type="button"
                className="w-full py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 transition"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Login with Google
              </button>
            </Form>
          )}
        </Formik>

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
