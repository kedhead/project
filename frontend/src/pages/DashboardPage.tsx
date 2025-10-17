import { FC } from 'react';

export const DashboardPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">PM Suite</h1>
            <div className="flex space-x-4">
              <button className="btn-secondary">Profile</button>
              <button className="btn-primary">Logout</button>
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
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Tasks</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Teams</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
          </div>
        </div>
      </main>
    </div>
  );
};
