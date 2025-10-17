import { FC } from 'react';
import { Link } from 'react-router-dom';

export const HomePage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Project Management Suite</h1>
        <p className="text-2xl mb-8">Manage your projects with powerful Gantt charts</p>
        <div className="space-x-4">
          <Link to="/login" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
            Login
          </Link>
          <Link to="/register" className="btn-secondary bg-primary-800 text-white hover:bg-primary-900">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};
