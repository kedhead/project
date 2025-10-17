import { FC } from 'react';
import { Link } from 'react-router-dom';

export const RegisterPage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="card max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Create Account</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                className="input-field"
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                className="input-field"
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="input-field"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="input-field"
              placeholder="Create a password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="input-field"
              placeholder="Confirm your password"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
