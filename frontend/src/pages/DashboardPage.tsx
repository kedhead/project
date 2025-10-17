import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';
import { teamApi } from '../api/team.api';
import { projectApi } from '../api/project.api';
import { Team, Project } from '../types';

export const DashboardPage: FC = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsData, projectsData] = await Promise.all([
          teamApi.getUserTeams(),
          projectApi.getUserProjects(),
        ]);
        setTeams(teamsData);
        setProjects(projectsData);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const totalTasks = projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">PM Suite</h1>
            <div className="flex items-center space-x-4">
              <Link to="/teams" className="text-gray-600 hover:text-primary-600">
                Teams
              </Link>
              <Link to="/projects" className="text-gray-600 hover:text-primary-600">
                Projects
              </Link>
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-2">Teams</h3>
                <p className="text-3xl font-bold text-primary-600">{teams.length}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {teams.length === 0 ? 'No teams yet' : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
                </p>
                <Link to="/teams" className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-block">
                  View all teams →
                </Link>
              </div>
              <div className="card">
                <h3 className="text-xl font-semibold mb-2">Projects</h3>
                <p className="text-3xl font-bold text-primary-600">{projects.length}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
                </p>
                <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-block">
                  View all projects →
                </Link>
              </div>
              <div className="card">
                <h3 className="text-xl font-semibold mb-2">Tasks</h3>
                <p className="text-3xl font-bold text-primary-600">{totalTasks}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalTasks === 0 ? 'No tasks yet' : `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Recent Teams</h3>
                {teams.length === 0 ? (
                  <p className="text-gray-500 text-sm">No teams yet. Create your first team to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {teams.slice(0, 5).map((team) => (
                      <Link
                        key={team.id}
                        to={`/teams/${team.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
                <Link
                  to="/teams"
                  className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-700"
                >
                  View all teams →
                </Link>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
                {projects.length === 0 ? (
                  <p className="text-gray-500 text-sm">No projects yet. Create your first project to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.tasks?.length || 0} task{project.tasks?.length !== 1 ? 's' : ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
                <Link
                  to="/projects"
                  className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-700"
                >
                  View all projects →
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
