import { FC, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { projectApi } from '../api/project.api';
import { teamApi } from '../api/team.api';
import { Project, Team, CreateProjectData } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';

export const ProjectsPage: FC = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedTeamId = searchParams.get('teamId');

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState<CreateProjectData>({
    name: '',
    description: '',
    teamId: preselectedTeamId || '',
    startDate: '',
    endDate: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, teamsData] = await Promise.all([
        projectApi.getUserProjects(),
        teamApi.getUserTeams(),
      ]);
      setProjects(projectsData);
      setTeams(teamsData);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (preselectedTeamId) {
      setNewProject((prev) => ({ ...prev, teamId: preselectedTeamId }));
      setShowCreateModal(true);
    }
  }, [preselectedTeamId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.teamId) return;

    try {
      setCreating(true);
      // Remove empty date strings to avoid validation errors
      const projectData = {
        ...newProject,
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined,
      };
      await projectApi.createProject(projectData);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        teamId: '',
        startDate: '',
        endDate: '',
      });
      fetchData();
    } catch (err: any) {
      console.error('Error creating project:', err);
      alert(err.response?.data?.message || 'Failed to create project');
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
              <Link to="/teams" className="text-gray-600 hover:text-primary-600">
                Teams
              </Link>
              <Link to="/projects" className="text-primary-600 font-medium">
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
          <h2 className="text-3xl font-bold">Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            disabled={teams.length === 0}
          >
            Create Project
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {teams.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            You need to create a team before you can create projects.{' '}
            <Link to="/teams" className="underline font-medium">
              Go to Teams
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started!</p>
            {teams.length > 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{project.tasks?.length || 0} task{project.tasks?.length !== 1 ? 's' : ''}</span>
                  {project.team && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {project.team.name}
                    </span>
                  )}
                </div>
                {(project.startDate || project.endDate) && (
                  <div className="text-xs text-gray-500 border-t pt-3 mt-3">
                    {project.startDate && (
                      <p>Start: {new Date(project.startDate).toLocaleDateString()}</p>
                    )}
                    {project.endDate && (
                      <p>End: {new Date(project.endDate).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-2">
                  Team *
                </label>
                <select
                  id="teamId"
                  value={newProject.teamId}
                  onChange={(e) => setNewProject({ ...newProject, teamId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProject({
                      name: '',
                      description: '',
                      teamId: '',
                      startDate: '',
                      endDate: '',
                    });
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
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
