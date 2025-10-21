import { FC, useEffect, useRef, useState } from 'react';
import { Gantt, Toolbar, defaultEditorShape } from 'wx-react-gantt';
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
  const handlersRegistered = useRef(false);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [ganttLinks, setGanttLinks] = useState<GanttLink[]>([]);

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
      progress: task.progress || 0, // Show as 0-100 for display
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

  // Setup API event handlers using useEffect
  useEffect(() => {
    if (!apiRef.current || handlersRegistered.current) return;

    const api = apiRef.current;
    handlersRegistered.current = true;

    // Disable the popup editor completely
    // Inline editing in grid cells should still work (single-click on cells)
    // This prevents the popup editor that appears on double-click of task bars
    api.intercept('show-editor', (ev: any) => {
      console.log('Intercepted show-editor event', ev);
      // Return false to prevent the popup editor from opening
      return false;
    });

    // Handle task addition
    let isCreating = false;
    const handleAddTask = async (ev: any) => {
      if (isCreating) {
        console.log('Task creation already in progress, skipping...');
        return;
      }

      try {
        isCreating = true;
        const task = ev.task;
        const createData: CreateTaskData = {
          projectId,
          title: task.text || 'New Task',
          startDate: task.start?.toISOString() || new Date().toISOString(),
          endDate: task.end?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
          duration: task.duration || 1,
          progress: Math.round(task.progress || 0), // Already 0-100
          parentId: task.parent && task.parent !== 0 ? String(task.parent) : undefined,
          isMilestone: task.type === 'milestone',
          color: task.color,
        };

        await taskApi.createTask(createData);
        setTimeout(() => {
          onTasksChange();
          isCreating = false;
        }, 500);
      } catch (error: any) {
        isCreating = false;
        console.error('Failed to create task:', error);
        alert(error.response?.data?.error || 'Failed to create task');
      }
    };

    // Handle task update
    const handleUpdateTask = async (ev: any) => {
      try {
        const { id, task } = ev;
        const updateData: UpdateTaskData = {};

        if (task.text !== undefined) updateData.title = task.text;
        if (task.start) updateData.startDate = task.start.toISOString();
        if (task.end) updateData.endDate = task.end.toISOString();
        if (task.duration !== undefined) updateData.duration = task.duration;
        if (task.progress !== undefined) updateData.progress = Math.round(task.progress); // Already 0-100
        if (task.type !== undefined) updateData.isMilestone = task.type === 'milestone';
        if (task.color) updateData.color = task.color;

        await taskApi.updateTask(String(id), updateData);
        // Don't refresh immediately to allow inline editing to work smoothly
        // onTasksChange();
      } catch (error: any) {
        console.error('Failed to update task:', error);
        alert(error.response?.data?.error || 'Failed to update task');
      }
    };

    // Handle task deletion
    const handleDeleteTask = async (ev: any) => {
      try {
        await taskApi.deleteTask(String(ev.id));
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to delete task:', error);
        alert(error.response?.data?.error || 'Failed to delete task');
        onTasksChange();
      }
    };

    // Handle task move (drag)
    const handleMoveTask = async (ev: any) => {
      try {
        const { id, task } = ev;
        const updateData: UpdateTaskData = {};

        if (task.start) updateData.startDate = task.start.toISOString();
        if (task.end) updateData.endDate = task.end.toISOString();
        if (task.duration !== undefined) updateData.duration = task.duration;

        await taskApi.updateTask(String(id), updateData);
        onTasksChange();
      } catch (error: any) {
        console.error('Failed to move task:', error);
        alert(error.response?.data?.error || 'Failed to move task');
        onTasksChange();
      }
    };

    // Handle link addition (dependency)
    const handleAddLink = async (ev: any) => {
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
    };

    // Handle link deletion
    const handleDeleteLink = async (ev: any) => {
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
    };

    api.on('add-task', handleAddTask);
    api.on('update-task', handleUpdateTask);
    api.on('delete-task', handleDeleteTask);
    api.on('move-task', handleMoveTask);
    api.on('add-link', handleAddLink);
    api.on('delete-link', handleDeleteLink);

  }, [apiRef.current]);

  return (
    <div className="gantt-container">
      <link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
      <div className="gantt-wrapper">
        <Toolbar api={apiRef.current} />
        <Gantt
          init={(api) => (apiRef.current = api)}
          tasks={ganttTasks}
          links={ganttLinks}
          scales={[
            { unit: 'month', step: 1, format: 'MMMM yyyy' },
            { unit: 'day', step: 1, format: 'd' },
          ]}
          columns={[
            { id: 'text', label: 'Task Name', width: 300, align: 'left', editor: 'text' },
            { id: 'start', label: 'Start', width: 110, align: 'center', editor: 'date' },
            { id: 'end', label: 'End', width: 110, align: 'center', editor: 'date' },
            { id: 'duration', label: 'Days', width: 70, align: 'center', editor: 'number' },
            { id: 'progress', label: 'Progress %', width: 90, align: 'center', editor: 'number' },
          ]}
          cellWidth={60}
          cellHeight={44}
          scaleHeight={60}
          readonly={false}
        />
      </div>

      <style>{`
        .gantt-container {
          width: 100%;
          height: 800px;
          display: flex;
          flex-direction: column;
        }

        .gantt-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        /* Toolbar styling */
        .wx-toolbar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 16px !important;
          min-height: 60px !important;
          display: flex !important;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          z-index: 100;
        }

        .wx-toolbar button {
          background-color: #ffffff !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          padding: 8px 16px !important;
          cursor: pointer !important;
          font-size: 14px !important;
          color: #374151 !important;
          transition: all 0.2s !important;
          font-weight: 500 !important;
          height: auto !important;
          min-height: 36px !important;
        }

        .wx-toolbar button:hover {
          background-color: #f9fafb !important;
          border-color: #9ca3af !important;
        }

        .wx-toolbar button:active {
          background-color: #f3f4f6 !important;
        }

        .wx-toolbar button.wx-primary {
          background-color: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
        }

        .wx-toolbar button.wx-primary:hover {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }

        /* Gantt main container */
        .wx-gantt {
          flex: 1;
          overflow: hidden;
        }

        /* Task bar styling - Make them visible and colorful */
        .wx-bar {
          border-radius: 6px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.12) !important;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%) !important;
          border: 1px solid #1d4ed8 !important;
          min-height: 28px !important;
          height: 28px !important;
        }

        .wx-bar:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .wx-bar.wx-milestone {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
          border: 2px solid #d97706 !important;
          width: 20px !important;
          height: 20px !important;
          transform: rotate(45deg);
        }

        /* Task text on bars */
        .wx-bar-label {
          color: white !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
          padding: 0 8px !important;
        }

        /* Grid styling */
        .wx-grid {
          font-size: 14px !important;
        }

        .wx-grid-header {
          background-color: #f9fafb !important;
          border-bottom: 2px solid #e5e7eb !important;
          font-weight: 600 !important;
          color: #111827 !important;
          font-size: 14px !important;
          padding: 12px 8px !important;
        }

        .wx-grid-row {
          border-bottom: 1px solid #e5e7eb !important;
          transition: background-color 0.15s ease !important;
        }

        .wx-grid-row:hover {
          background-color: #f9fafb !important;
        }

        .wx-grid-cell {
          padding: 10px 8px !important;
          font-size: 14px !important;
          color: #374151 !important;
          cursor: pointer !important;
          border-right: 1px solid #f3f4f6 !important;
        }

        .wx-grid-cell:first-child {
          font-weight: 500 !important;
          color: #111827 !important;
        }

        /* Inline editing */
        .wx-grid-cell input {
          width: 100% !important;
          border: 1px solid #3b82f6 !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
          font-size: 14px !important;
          outline: none !important;
        }

        /* Scale/Timeline styling */
        .wx-scale {
          background-color: #f3f4f6 !important;
          border-bottom: 1px solid #e5e7eb !important;
          font-size: 14px !important;
        }

        .wx-scale-cell {
          font-weight: 500 !important;
          color: #111827 !important;
          padding: 8px 4px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
        }

        /* Timeline cells - make dates more readable */
        .wx-chart-header {
          font-size: 14px !important;
        }

        .wx-chart-header .wx-scale-cell {
          font-size: 14px !important;
          font-weight: 600 !important;
          padding: 10px 6px !important;
        }

        /* Day numbers in timeline */
        .wx-chart-header .wx-scale-cell:last-child .wx-scale-text {
          font-size: 13px !important;
        }

        /* Editor/Modal styling */
        .wx-modal {
          z-index: 1000 !important;
        }

        .wx-modal-content {
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          max-width: 500px !important;
        }

        .wx-modal-header {
          padding: 20px 24px !important;
          border-bottom: 1px solid #e5e7eb !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #111827 !important;
        }

        .wx-modal-body {
          padding: 24px !important;
        }

        .wx-modal-footer {
          padding: 16px 24px !important;
          border-top: 1px solid #e5e7eb !important;
          display: flex !important;
          gap: 12px !important;
          justify-content: flex-end !important;
        }

        /* Form fields in editor */
        .wx-field {
          margin-bottom: 20px !important;
        }

        .wx-field label {
          display: block !important;
          margin-bottom: 6px !important;
          font-weight: 500 !important;
          color: #374151 !important;
          font-size: 14px !important;
        }

        .wx-field input[type="text"],
        .wx-field input[type="date"],
        .wx-field input[type="number"],
        .wx-field textarea {
          width: 100% !important;
          padding: 10px 12px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          font-size: 14px !important;
          transition: all 0.2s !important;
        }

        .wx-field input:focus,
        .wx-field textarea:focus {
          outline: none !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }

        /* Slider styling */
        .wx-slider {
          height: 6px !important;
          border-radius: 3px !important;
          background-color: #e5e7eb !important;
        }

        .wx-slider-thumb {
          width: 18px !important;
          height: 18px !important;
          border-radius: 50% !important;
          background-color: #3b82f6 !important;
          border: 2px solid white !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }

        /* Progress bar in tasks */
        .wx-progress {
          background-color: rgba(59, 130, 246, 0.3) !important;
          border-radius: 3px !important;
        }

        /* Links/Dependencies */
        .wx-link {
          stroke: #3b82f6 !important;
          stroke-width: 2px !important;
        }

        .wx-link:hover {
          stroke: #2563eb !important;
          stroke-width: 3px !important;
        }

        /* Scrollbars */
        .wx-gantt ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .wx-gantt ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .wx-gantt ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }

        .wx-gantt ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};
