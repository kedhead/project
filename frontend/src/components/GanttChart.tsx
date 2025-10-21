import { FC, useEffect, useRef, useState } from 'react';
import { Task, DependencyType } from '../types';
import { taskApi, CreateTaskData, UpdateTaskData } from '../api/task.api';
// @ts-ignore - Svelte component import
import SvelteGanttComponent from './SvelteGantt.svelte';

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
}

// Gantt link format
interface GanttLink {
  id: string | number;
  source: string | number;
  target: string | number;
  type: string; // e2s, s2s, e2e, s2e
}

export const GanttChart: FC<GanttChartProps> = ({ projectId, tasks, onTasksChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svelteComponentRef = useRef<any>(null);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [ganttLinks, setGanttLinks] = useState<GanttLink[]>([]);

  // Convert dependency type to Gantt link type
  const dependencyTypeToGanttType = (type: DependencyType): string => {
    switch (type) {
      case DependencyType.FINISH_TO_START:
        return 'e2s';
      case DependencyType.START_TO_START:
        return 's2s';
      case DependencyType.FINISH_TO_FINISH:
        return 'e2e';
      case DependencyType.START_TO_FINISH:
        return 's2e';
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
      progress: task.progress || 0,
      parent: task.parentId,
      type: task.isMilestone ? 'milestone' : 'task',
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

  // Event handlers for CRUD operations
  const handleTaskAdd = async (ev: any) => {
    try {
      console.log('=== ADD-TASK EVENT ===');
      console.log('Event:', ev);

      const task = ev.task || ev;
      const createData: CreateTaskData = {
        projectId,
        title: task.text || 'New Task',
        startDate: task.start?.toISOString() || new Date().toISOString(),
        endDate: task.end?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
        duration: task.duration || 1,
        progress: Math.round(task.progress || 0),
        parentId: task.parent && task.parent !== 0 ? String(task.parent) : undefined,
        isMilestone: task.type === 'milestone',
      };

      await taskApi.createTask(createData);
      setTimeout(() => {
        onTasksChange();
      }, 500);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      alert(error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleTaskUpdate = async (ev: any) => {
    try {
      console.log('=== UPDATE-TASK EVENT ===');
      console.log('Event:', ev);

      const { id, task } = ev;
      const updateData: UpdateTaskData = {};

      if (task.text !== undefined) updateData.title = task.text;
      if (task.start) updateData.startDate = task.start.toISOString();
      if (task.end) updateData.endDate = task.end.toISOString();
      if (task.duration !== undefined) updateData.duration = task.duration;
      if (task.progress !== undefined) updateData.progress = Math.round(task.progress);
      if (task.type !== undefined) updateData.isMilestone = task.type === 'milestone';

      console.log('Updating task:', id, updateData);
      await taskApi.updateTask(String(id), updateData);
      console.log('Task updated successfully');

      // Refresh after update
      onTasksChange();
    } catch (error: any) {
      console.error('Failed to update task:', error);
      alert(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleTaskDelete = async (ev: any) => {
    try {
      console.log('=== DELETE-TASK EVENT ===');
      console.log('Event:', ev);

      await taskApi.deleteTask(String(ev.id));
      onTasksChange();
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      alert(error.response?.data?.error || 'Failed to delete task');
      onTasksChange();
    }
  };

  const handleLinkAdd = async (ev: any) => {
    try {
      console.log('=== ADD-LINK EVENT ===');
      console.log('Event:', ev);

      const { link } = ev;
      await taskApi.addDependency(String(link.target), {
        dependsOnId: String(link.source),
        type: ganttTypeToDependencyType(link.type),
        lagDays: 0,
      });
      onTasksChange();
    } catch (error: any) {
      console.error('Failed to add dependency:', error);
      alert(error.response?.data?.error || 'Failed to add dependency');
    }
  };

  const handleLinkDelete = async (ev: any) => {
    try {
      console.log('=== DELETE-LINK EVENT ===');
      console.log('Event:', ev);

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

  // Mount/unmount Svelte component
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Mounting Svelte Gantt component...');

    // Mount the Svelte component
    svelteComponentRef.current = new SvelteGanttComponent({
      target: containerRef.current,
      props: {
        tasks: ganttTasks,
        links: ganttLinks,
        onTaskAdd: handleTaskAdd,
        onTaskUpdate: handleTaskUpdate,
        onTaskDelete: handleTaskDelete,
        onLinkAdd: handleLinkAdd,
        onLinkDelete: handleLinkDelete,
      },
    });

    console.log('Svelte Gantt component mounted');

    // Cleanup on unmount
    return () => {
      if (svelteComponentRef.current) {
        console.log('Unmounting Svelte Gantt component');
        svelteComponentRef.current.$destroy();
      }
    };
  }, []); // Only mount once

  // Update props when tasks/links change
  useEffect(() => {
    if (svelteComponentRef.current) {
      console.log('Updating Svelte component props...');
      svelteComponentRef.current.$set({
        tasks: ganttTasks,
        links: ganttLinks,
      });
    }
  }, [ganttTasks, ganttLinks]);

  return (
    <div className="gantt-container">
      <link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
      <div ref={containerRef} style={{ width: '100%', height: '800px' }} />
    </div>
  );
};
