import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamApi } from '../api/team.api';
import { Team, CreateTeamData } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';

export const TeamsPage: FC = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState<CreateTeamData>({
    name: '',
    description: '',
  });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await teamApi.getUserTeams();
      setTeams(data);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    try {
      setCreating(true);
      await teamApi.createTeam(newTeam);
      setShowCreateModal(false);
      setNewTeam({ name: '', description: '' });
      fetchTeams();
    } catch (err: any) {
      console.error('Error creating team:', err);
      alert(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
              PM Suite
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link to="/teams" className="text-primary-600 font-medium">
                Teams
              </Link>
              <Link to="/projects" className="text-gray-600 hover:text-primary-600">
                Projects
              </Link>
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <button onClick={() => logout()} className="btn-primary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Teams</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Team
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-500 mb-6">Create your first team to get started!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
                {team.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{team.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                  <span>{team.projects?.length || 0} project{team.projects?.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeam({ name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
