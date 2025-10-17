import { FC, useEffect, useRef, useState } from 'react';
import { Gantt, Toolbar } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';
import { Task, TaskStatus, TaskPriority, DependencyType } from '../types';
import { taskApi, CreateTaskData, UpdateTaskData } from '../api/task.api';

interface GanttChartProps {
  projectId: string;
  tasks: Task[];
  onTasksChange: () => void;
}

// Gantt task format
interface GanttTask {
  id: string | number;
  text: string;
  start: Date;
  end: Date;
  duration: number;
  progress: number;
  parent?: string | number;
  type?: string;
  color?: string;
  custom_status?: TaskStatus;
  custom_priority?: TaskPriority;
}

// Gantt link format
interface GanttLink {
  id: string | number;
  source: string | number;
  target: string | number;
  type: string; // e2s, s2s, e2e, s2e
}

export const GanttChart: FC<GanttChartProps> = ({ projectId, tasks, onTasksChange }) => {
  const apiRef = useRef<any>(null);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [ganttLinks, setGanttLinks] = useState<GanttLink[]>([]);

  // Toolbar items configuration
  const toolbarItems = [
    {
      id: 'add-task',
      comp: 'button',
      icon: 'wxi-plus',
      text: 'Add Task',
      type: 'primary',
    },
    {
      id: 'delete-task',
      comp: 'button',
      icon: 'wxi-delete',
      text: 'Delete',
    },
    {
      type: 'separator',
    },
    {
      id: 'indent-task',
      comp: 'button',
      icon: 'wxi-indent',
      text: 'Indent',
    },
    {
      id: 'unindent-task',
      comp: 'button',
      icon: 'wxi-unindent',
      text: 'Unindent',
    },
    {
      type: 'separator',
    },
    {
      id: 'zoom-in',
      comp: 'button',
      icon: 'wxi-plus',
      text: 'Zoom In',
    },
    {
      id: 'zoom-out',
      comp: 'button',
      icon: 'wxi-minus',
      text: 'Zoom Out',
    },
  ];

  // Convert dependency type to Gantt link type
  const dependencyTypeToGanttType = (type: DependencyType): string => {
    switch (type) {
      case DependencyType.FINISH_TO_START:
        return 'e2s'; // end-to-start
      case DependencyType.START_TO_START:
        return 's2s'; // start-to-start
      case DependencyType.FINISH_TO_FINISH:
        return 'e2e'; // end-to-end
      case DependencyType.START_TO_FINISH:
        return 's2e'; // start-to-end
      default:
        return 'e2s';
    }
  };

  // Convert Gantt link type back to our dependency type
  const ganttTypeToDependencyType = (type: string): DependencyType => {
    switch (type) {
      case 's2s':
        return DependencyType.START_TO_START;
      case 'e2e':
        return DependencyType.FINISH_TO_FINISH;
      case 's2e':
        return DependencyType.START_TO_FINISH;
      case 'e2s':
      default:
        return DependencyType.FINISH_TO_START;
    }
  };

  // Convert our tasks to Gantt format
  useEffect(() => {
    const convertedTasks: GanttTask[] = tasks.map((task) => ({
      id: task.id,
      text: task.title,
      start: new Date(task.startDate),
      end: new Date(task.endDate),
      duration: task.duration || 1,
      progress: (task.progress || 0) / 100, // Gantt expects 0-1
      parent: task.parentId,
      type: task.isMilestone ? 'milestone' : 'task',
      color: task.color,
      custom_status: task.status,
      custom_priority: task.priority,
    }));

    const convertedLinks: GanttLink[] = [];
    tasks.forEach((task) => {
      task.dependencies?.forEach((dep) => {
        convertedLinks.push({
          id: `${task.id}-${dep.dependsOnId}`,
          source: dep.dependsOnId,
          target: task.id,
          type: dependencyTypeToGanttType(dep.type),
        });
      });
    });

    setGanttTasks(convertedTasks);
    setGanttLinks(convertedLinks);
  }, [tasks]);

  // Setup API event handlers
  useEffect(() => {
    if (!apiRef.current) return;

    const api = apiRef.current;

    // Handle task addition
    api.on('add-task', async (ev: any) => {
      try {
        const task = ev.task;
        const createData: CreateTaskData = {
          projectId,
          title: task.text || 'New Task',
          startDate: task.start?.toISOString() || new Date().toISOString(),
          endDate: task.end?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
          duration: task.duration || 1,
          progress: Math.round((task.progress || 0) * 100),
          parentId: task.parent,
          isMilestone: task.type === 'milestone',
          color: task.color,
        };

        await taskApi.createTask(createData);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to create task:', error);
        alert(error.response?.data?.error || 'Failed to create task');
      }
    });

    // Handle task update
    api.on('update-task', async (ev: any) => {
      try {
        const { id, task } = ev;
        const updateData: UpdateTaskData = {
          title: task.text,
          startDate: task.start?.toISOString(),
          endDate: task.end?.toISOString(),
          duration: task.duration,
          progress: Math.round((task.progress || 0) * 100),
          isMilestone: task.type === 'milestone',
          color: task.color,
        };

        await taskApi.updateTask(String(id), updateData);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to update task:', error);
        alert(error.response?.data?.error || 'Failed to update task');
        onTasksChange();
      }
    });

    // Handle task deletion
    api.on('delete-task', async (ev: any) => {
      try {
        await taskApi.deleteTask(String(ev.id));
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to delete task:', error);
        alert(error.response?.data?.error || 'Failed to delete task');
        onTasksChange();
      }
    });

    // Handle task move (drag)
    api.on('move-task', async (ev: any) => {
      try {
        const { id, task } = ev;
        const updateData: UpdateTaskData = {
          startDate: task.start?.toISOString(),
          endDate: task.end?.toISOString(),
          duration: task.duration,
        };

        await taskApi.updateTask(String(id), updateData);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to move task:', error);
        alert(error.response?.data?.error || 'Failed to move task');
        onTasksChange();
      }
    });

    // Handle link addition (dependency)
    api.on('add-link', async (ev: any) => {
      try {
        const { link } = ev;
        await taskApi.addDependency(String(link.target), {
          dependsOnId: String(link.source),
          type: ganttTypeToDependencyType(link.type),
          lagDays: 0,
        });
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to add dependency:', error);
        alert(error.response?.data?.error || 'Failed to add dependency. This might create a circular reference.');
      }
    });

    // Handle link deletion
    api.on('delete-link', async (ev: any) => {
      try {
        const { id } = ev;
        const link = ganttLinks.find(l => String(l.id) === String(id));
        if (link) {
          await taskApi.removeDependency(String(link.target), String(link.source));
          onTasksChange();
        }
      } catch (error: any) {
        console.error('Failed to remove dependency:', error);
        alert(error.response?.data?.error || 'Failed to remove dependency');
        onTasksChange();
      }
    });

  }, [apiRef.current, projectId, ganttLinks]);

  return (
    <div className="gantt-container">
      <link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
      <div className="gantt-wrapper" style={{ width: '100%', height: '700px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <Toolbar api={apiRef.current} items={toolbarItems} />
        <Gantt
          tasks={ganttTasks}
          links={ganttLinks}
          apiRef={apiRef}
          scales={[
            { unit: 'month', step: 1, format: 'MMMM yyyy' },
            { unit: 'day', step: 1, format: 'd' },
          ]}
          columns={[
            { id: 'text', label: 'Task Name', width: 250, align: 'left' },
            { id: 'start', label: 'Start', width: 100, align: 'center' },
            { id: 'end', label: 'End', width: 100, align: 'center' },
            { id: 'duration', label: 'Days', width: 60, align: 'center' },
          ]}
          cellWidth={50}
          cellHeight={38}
          scaleHeight={50}
          readonly={false}
        />
      </div>

      <style>{`
        .gantt-container {
          width: 100%;
        }

        .gantt-wrapper {
          display: flex;
          flex-direction: column;
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
