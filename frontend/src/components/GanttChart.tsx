import { FC, useEffect, useRef, useState } from 'react';
import { Gantt } from '@wx/gantt';
import '@wx/gantt/dist/gantt.css';
import { Task, TaskStatus, TaskPriority, DependencyType } from '../types';
import { taskApi, CreateTaskData, UpdateTaskData } from '../api/task.api';

interface GanttChartProps {
  projectId: string;
  tasks: Task[];
  onTasksChange: () => void;
}

// Convert our Task type to Gantt format
interface GanttTask {
  id: string;
  text: string;
  start_date: Date;
  end_date: Date;
  duration: number;
  progress: number;
  parent?: string;
  type?: string; // 'task', 'project', 'milestone'
  color?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignees?: string[];
}

interface GanttLink {
  id: string;
  source: string;
  target: string;
  type: string; // '0' = finish-to-start, '1' = start-to-start, '2' = finish-to-finish, '3' = start-to-finish
  lag?: number;
}

export const GanttChart: FC<GanttChartProps> = ({ projectId, tasks, onTasksChange }) => {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert dependency type to Gantt link type
  const dependencyTypeToGanttType = (type: DependencyType): string => {
    switch (type) {
      case DependencyType.FINISH_TO_START:
        return '0';
      case DependencyType.START_TO_START:
        return '1';
      case DependencyType.FINISH_TO_FINISH:
        return '2';
      case DependencyType.START_TO_FINISH:
        return '3';
      default:
        return '0';
    }
  };

  // Convert Gantt link type back to our dependency type
  const ganttTypeToDependencyType = (type: string): DependencyType => {
    switch (type) {
      case '1':
        return DependencyType.START_TO_START;
      case '2':
        return DependencyType.FINISH_TO_FINISH;
      case '3':
        return DependencyType.START_TO_FINISH;
      case '0':
      default:
        return DependencyType.FINISH_TO_START;
    }
  };

  // Convert our tasks to Gantt format
  const convertToGanttFormat = (tasks: Task[]): { tasks: GanttTask[]; links: GanttLink[] } => {
    const ganttTasks: GanttTask[] = tasks.map((task) => ({
      id: task.id,
      text: task.title,
      start_date: new Date(task.startDate),
      end_date: new Date(task.endDate),
      duration: task.duration || 1,
      progress: (task.progress || 0) / 100, // Gantt expects 0-1
      parent: task.parentId || undefined,
      type: task.isMilestone ? 'milestone' : 'task',
      color: task.color || undefined,
      status: task.status,
      priority: task.priority,
      assignees: task.assignees?.map((a) => `${a.user.firstName} ${a.user.lastName}`) || [],
    }));

    const ganttLinks: GanttLink[] = [];
    tasks.forEach((task) => {
      task.dependencies?.forEach((dep, index) => {
        ganttLinks.push({
          id: `${task.id}-${dep.dependsOnId}-${index}`,
          source: dep.dependsOnId,
          target: task.id,
          type: dependencyTypeToGanttType(dep.type),
          lag: dep.lagDays,
        });
      });
    });

    return { tasks: ganttTasks, links: ganttLinks };
  };

  // Initialize Gantt
  useEffect(() => {
    if (!ganttContainer.current || ganttInstance.current) return;

    // Initialize Gantt instance
    const gantt = new Gantt(ganttContainer.current, {
      // Configuration
      scales: [
        { unit: 'month', step: 1, format: 'MMMM yyyy' },
        { unit: 'day', step: 1, format: 'd' },
      ],
      columns: [
        { name: 'text', label: 'Task Name', width: '250px', align: 'left' },
        { name: 'start_date', label: 'Start', width: '100px', align: 'center' },
        { name: 'end_date', label: 'End', width: '100px', align: 'center' },
        { name: 'duration', label: 'Days', width: '60px', align: 'center' },
        { name: 'progress', label: 'Progress', width: '80px', align: 'center', template: (task: any) => `${Math.round(task.progress * 100)}%` },
        { name: 'assignees', label: 'Assigned To', width: '150px', align: 'left', template: (task: any) => task.assignees?.join(', ') || 'Unassigned' },
      ],
      // Enable features
      readonly: false,
      taskTypes: ['task', 'project', 'milestone'],
      links: true,
      autoSchedule: true, // Enable auto-scheduling
      workTime: {
        hours: [9, 18],
        days: [1, 2, 3, 4, 5], // Monday-Friday
      },
      // Styling
      cellWidth: 40,
      cellHeight: 38,
      minColWidth: 80,
      baselines: false,
      markers: [
        {
          start_date: new Date(),
          css: 'today',
          text: 'Today',
        },
      ],
    });

    ganttInstance.current = gantt;

    // Load initial data
    const { tasks: ganttTasks, links: ganttLinks } = convertToGanttFormat(tasks);
    gantt.parse({ data: ganttTasks, links: ganttLinks });

    // Event handlers
    gantt.attachEvent('onAfterTaskAdd', async (id: string, task: GanttTask) => {
      if (isCreating) return; // Prevent duplicate calls
      setIsCreating(true);

      try {
        const createData: CreateTaskData = {
          projectId,
          title: task.text,
          startDate: task.start_date.toISOString(),
          endDate: task.end_date.toISOString(),
          duration: task.duration,
          progress: Math.round((task.progress || 0) * 100),
          parentId: task.parent,
          isMilestone: task.type === 'milestone',
          color: task.color,
        };

        const newTask = await taskApi.createTask(createData);

        // Update the task ID in Gantt
        gantt.changeTaskId(id, newTask.id);

        onTasksChange();
      } catch (error: any) {
        console.error('Failed to create task:', error);
        gantt.deleteTask(id);
        alert(error.response?.data?.error || 'Failed to create task');
      } finally {
        setIsCreating(false);
      }
    });

    gantt.attachEvent('onAfterTaskUpdate', async (id: string, task: GanttTask) => {
      if (isUpdating) return;
      setIsUpdating(true);

      try {
        const updateData: UpdateTaskData = {
          title: task.text,
          startDate: task.start_date.toISOString(),
          endDate: task.end_date.toISOString(),
          duration: task.duration,
          progress: Math.round((task.progress || 0) * 100),
          isMilestone: task.type === 'milestone',
          color: task.color,
        };

        await taskApi.updateTask(id, updateData);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to update task:', error);
        alert(error.response?.data?.error || 'Failed to update task');
        // Reload data to revert changes
        onTasksChange();
      } finally {
        setIsUpdating(false);
      }
    });

    gantt.attachEvent('onAfterTaskDelete', async (id: string) => {
      try {
        await taskApi.deleteTask(id);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to delete task:', error);
        alert(error.response?.data?.error || 'Failed to delete task');
        onTasksChange();
      }
    });

    gantt.attachEvent('onAfterLinkAdd', async (id: string, link: GanttLink) => {
      try {
        await taskApi.addDependency(link.target, {
          dependsOnId: link.source,
          type: ganttTypeToDependencyType(link.type),
          lagDays: link.lag || 0,
        });
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to add dependency:', error);
        gantt.deleteLink(id);
        alert(error.response?.data?.error || 'Failed to add dependency. This might create a circular reference.');
      }
    });

    gantt.attachEvent('onAfterLinkDelete', async (id: string, link: GanttLink) => {
      try {
        await taskApi.removeDependency(link.target, link.source);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to remove dependency:', error);
        alert(error.response?.data?.error || 'Failed to remove dependency');
        onTasksChange();
      }
    });

    gantt.attachEvent('onTaskDblClick', (id: string) => {
      // Open task edit dialog (can be customized)
      gantt.showLightbox(id);
      return true;
    });

    // Progress drag event
    gantt.attachEvent('onAfterTaskDrag', async (id: string, mode: string) => {
      if (mode === 'progress') {
        const task = gantt.getTask(id);
        try {
          await taskApi.updateProgress(id, Math.round(task.progress * 100));
          onTasksChange();
        } catch (error: any) {
          console.error('Failed to update progress:', error);
          alert(error.response?.data?.error || 'Failed to update progress');
          onTasksChange();
        }
      }
    });

    // Cleanup
    return () => {
      if (ganttInstance.current) {
        ganttInstance.current.destructor();
        ganttInstance.current = null;
      }
    };
  }, []);

  // Update Gantt data when tasks change
  useEffect(() => {
    if (!ganttInstance.current) return;

    const { tasks: ganttTasks, links: ganttLinks } = convertToGanttFormat(tasks);
    ganttInstance.current.clearAll();
    ganttInstance.current.parse({ data: ganttTasks, links: ganttLinks });
  }, [tasks]);

  return (
    <div className="gantt-container">
      <div className="gantt-toolbar bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            onClick={() => ganttInstance.current?.createTask()}
          >
            + Add Task
          </button>
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            onClick={() => ganttInstance.current?.render()}
          >
            Refresh
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Zoom:</span>
            <button
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              onClick={() => ganttInstance.current?.ext.zoom.zoomIn()}
            >
              +
            </button>
            <button
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              onClick={() => ganttInstance.current?.ext.zoom.zoomOut()}
            >
              -
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              onChange={(e) => {
                const scales: any = {
                  day: [
                    { unit: 'day', step: 1, format: 'dd MMM' },
                    { unit: 'hour', step: 1, format: 'HH' },
                  ],
                  week: [
                    { unit: 'week', step: 1, format: 'Week #W' },
                    { unit: 'day', step: 1, format: 'dd' },
                  ],
                  month: [
                    { unit: 'month', step: 1, format: 'MMMM yyyy' },
                    { unit: 'day', step: 1, format: 'd' },
                  ],
                  quarter: [
                    { unit: 'quarter', step: 1, format: 'Q yyyy' },
                    { unit: 'month', step: 1, format: 'MMM' },
                  ],
                };
                ganttInstance.current?.config.scales = scales[e.target.value];
                ganttInstance.current?.render();
              }}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month" selected>Month</option>
              <option value="quarter">Quarter</option>
            </select>
          </div>
        </div>
      </div>
      <div ref={ganttContainer} style={{ width: '100%', height: '600px' }} />

      <style>{`
        .gantt_task_line.today {
          background-color: #ff0000;
          opacity: 0.3;
        }

        .gantt_task_line.milestone {
          background-color: #fbbf24;
        }

        .gantt_task_line {
          cursor: pointer;
        }

        .gantt_task_line:hover {
          opacity: 0.9;
        }

        .gantt_link_arrow {
          cursor: pointer;
        }

        .gantt_grid_scale {
          background-color: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .gantt_grid_head_cell {
          font-weight: 600;
          color: #374151;
        }

        .gantt_scale_line {
          border-top: 1px solid #e5e7eb;
          background-color: #f3f4f6;
        }

        .gantt_task {
          border-radius: 4px;
        }

        .gantt_task_progress {
          background-color: rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};
