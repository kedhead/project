import { FC, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '../api/project.api';
import { taskApi } from '../api/task.api';
import { Project, ProjectStats, Task } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';
import { GanttChart } from '../components/GanttChart';

export const ProjectDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');

  const fetchProjectData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [projectData, statsData, tasksData] = await Promise.all([
        projectApi.getProjectById(id),
        projectApi.getProjectStats(id),
        taskApi.getProjectTasks(id),
      ]);
      setProject(projectData);
      setStats(statsData);
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleDeleteProject = async () => {
    if (!project || !id) return;
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) return;

    try {
      await projectApi.deleteProject(id);
      navigate('/projects');
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <Link to="/projects" className="btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="mb-6">
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Projects
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mb-2">{project.description}</p>
              )}
              {project.team && (
                <Link
                  to={`/teams/${project.team.id}`}
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  Team: {project.team.name} →
                </Link>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
            >
              Delete Project
            </button>
          </div>
        </div>

        {/* Project Dates */}
        {(project.startDate || project.endDate) && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <div className="grid grid-cols-2 gap-4">
              {project.startDate && (
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="text-lg font-medium">
                    {new Date(project.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {project.endDate && (
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="text-lg font-medium">
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Statistics */}
        {stats && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Project Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalTasks}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">To Do</p>
                <p className="text-2xl font-bold text-gray-600">{stats.todoTasks}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Blocked</p>
                <p className="text-2xl font-bold text-red-600">{stats.blockedTasks}</p>
              </div>
            </div>
            {stats.totalTasks > 0 && (
              <div className="card mt-4">
                <p className="text-sm text-gray-500 mb-2">Completion Rate</p>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  ></div>
                </div>
                <p className="text-lg font-semibold">{stats.completionPercentage.toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Tasks Section with Gantt Chart */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks ({tasks.length})</h2>
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-4 py-2 rounded ${viewMode === 'gantt' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                  onClick={() => setViewMode('gantt')}
                >
                  Gantt Chart
                </button>
                <button
                  className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                  onClick={() => setViewMode('list')}
                >
                  List View
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'gantt' ? (
            tasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No tasks yet. Create your first task using the Gantt chart!</p>
                <p className="text-sm text-gray-400">Click "Add Task" in the Gantt toolbar below to get started.</p>
              </div>
            ) : null
          ) : null}

          {viewMode === 'gantt' && (
            <div className="mt-4">
              <GanttChart projectId={id!} tasks={tasks} onTasksChange={fetchProjectData} />
            </div>
          )}

          {viewMode === 'list' && (
            tasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No tasks yet. Switch to Gantt view to create tasks!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        {task.isMilestone && (
                          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Milestone
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : task.status === 'BLOCKED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : task.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4">
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">Assigned to:</span>
                            <div className="flex -space-x-2">
                              {task.assignees.slice(0, 3).map((assignee) => (
                                <div
                                  key={assignee.id}
                                  className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium border-2 border-white"
                                  title={`${assignee.user.firstName} ${assignee.user.lastName}`}
                                >
                                  {assignee.user.firstName[0]}{assignee.user.lastName[0]}
                                </div>
                              ))}
                              {task.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white">
                                  +{task.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Duration: {task.duration} days
                        </div>
                        <div className="text-xs text-gray-500">
                          Progress: {task.progress}%
                        </div>
                      </div>
                      {task.endDate && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(task.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Depends on: {task.dependencies.map(d => d.dependsOn.title).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};
