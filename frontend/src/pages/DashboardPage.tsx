import { FC } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: FC = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">PM Suite</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button onClick={handleLogout} className="btn-primary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Projects</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-2">No projects yet</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Tasks</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-2">No tasks yet</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Teams</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-2">No teams yet</p>
          </div>
        </div>
        <div className="mt-8">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">User Information</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p>
                <span className="font-medium">Role:</span> {user?.role}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
