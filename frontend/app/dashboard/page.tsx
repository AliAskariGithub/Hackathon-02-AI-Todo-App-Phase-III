'use client';

import { useSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useOptimistic, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/services/api-client';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  ClipboardList,
  Search,
  Filter,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

// API client for backend connection
const taskApi = {
  getTasks: async (userId: string, token: string): Promise<Task[]> => {
    return apiClient.get<Task[]>(`/api/${userId}/tasks`, token);
  },
  createTask: async (userId: string, taskData: Omit<Task, 'id'>, token: string): Promise<Task> => {
    return apiClient.post<Task>(`/api/${userId}/tasks`, taskData, token);
  },
  updateTask: async (userId: string, id: string, taskData: Partial<Task>, token: string): Promise<Task> => {
    return apiClient.put<Task>(`/api/${userId}/tasks/${id}`, taskData, token);
  },
  deleteTask: async (userId: string, id: string, token: string): Promise<{ success: boolean }> => {
    try {
      await apiClient.delete(`/api/${userId}/tasks/${id}`, token);
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false };
    }
  }
};

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  interface OptimisticTask {
    type: 'add' | 'update' | 'delete';
    data: Task;
  }

  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Optimistic updates
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, newTask: OptimisticTask) => {
      if (newTask.type === 'add') {
        return [{ ...newTask.data, id: 'optimistic-' + Date.now() }, ...state];
      }
      if (newTask.type === 'update') {
        return state.map(t =>
          t.id === newTask.data.id ? { ...t, ...newTask.data } : t
        );
      }
      if (newTask.type === 'delete') {
        return state.filter(t => t.id !== newTask.data.id);
      }
      return state;
    }
  );

  // Load tasks on mount
  useEffect(() => {
    if (!isPending && session === null) {
      router.push('/login');
    } else if (session) {
      const loadTasks = async () => {
        setIsLoadingTasks(true);
        const userId = session?.user?.id;
        const token = session?.session?.token;
        try {
          if (userId && token) {
            const loadedTasks = await taskApi.getTasks(userId, token);
            setTasks(loadedTasks as Task[]);
          }
        } catch (error) {
          console.error('Error loading tasks:', error);
        } finally {
          setIsLoadingTasks(false);
        }
      };
      loadTasks();
    }
  }, [session, isPending, router]);

  // Handle task creation via dialog
  const handleAddTaskViaDialog = async (taskData: { title: string; description?: string }) => {
    const newTask: Omit<Task, 'id'> = {
      title: taskData.title,
      description: taskData.description,
      completed: false,
    };

    const tempId = 'optimistic-' + Date.now();

    // Optimistically add task
    startTransition(() => {
      addOptimisticTask({ type: 'add', data: { ...newTask, id: tempId } });
    });

    const userId = session?.user?.id;
    const token = session?.session?.token;
    if (userId && token) {
      try {
        const createdTask: Task = await taskApi.createTask(userId, newTask, token);
        setTasks(prev => [createdTask, ...prev.filter(t => !t.id.startsWith('optimistic-'))]);
        return createdTask;
      } catch (error) {
        console.error('Error creating task:', error);
        setTasks(prev => prev.filter(t => !t.id.startsWith('optimistic-')));
        throw error;
      }
    } else {
      setTasks(prev => prev.filter(t => !t.id.startsWith('optimistic-')));
      throw new Error('No user session available');
    }
  };

  // Handle dialog submission
  const handleDialogSubmit = async (taskData: { title: string; description?: string }) => {
    setIsCreatingTask(true);
    try {
      await handleAddTaskViaDialog(taskData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (task: Task) => {
    setUpdatingTaskId(task.id);
    const updatedTask = { ...task, completed: !task.completed };

    // Optimistically update
    addOptimisticTask({ type: 'update', data: updatedTask });

    const userId = session?.user?.id;
    const token = session?.session?.token;
    if (userId && token) {
      try {
        await taskApi.updateTask(userId, task.id, updatedTask, token);
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      } catch (error) {
        console.error('Error updating task:', error);
        // Revert optimistic update on error
        addOptimisticTask({ type: 'update', data: task });
      } finally {
        setUpdatingTaskId(null);
      }
    } else {
      setUpdatingTaskId(null);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);

    // Optimistically delete
    addOptimisticTask({ type: 'delete', data: { id: taskId, title: '', completed: false } });

    const userId = session?.user?.id;
    const token = session?.session?.token;
    if (userId && token) {
      try {
        await taskApi.deleteTask(userId, taskId, token);
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
        // Could revert optimistic update here if needed
      } finally {
        setDeletingTaskId(null);
      }
    } else {
      setDeletingTaskId(null);
    }
  };

  // Filter and search tasks
  const filteredTasks = optimisticTasks
    .filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    })
    .filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Calculate statistics
  const totalTasks = optimisticTasks.length;
  const completedTasks = optimisticTasks.filter(task => task.completed).length;
  const remainingTasks = totalTasks - completedTasks;

  // Loading state
  if (isPending) {
    return (
      <PageWrapper className="min-h-screen py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-125 h-125 rounded-full bg-primary/5 blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-5%] w-150 h-150 rounded-full bg-purple-500/5 blur-[120px] animate-pulse-slow delay-1000" />
        </div>

        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <PageWrapper className="min-h-screen py-20 relative overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-125 h-125 rounded-full bg-primary/5 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-150 h-150 rounded-full bg-purple-500/5 blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="container mx-auto py-8 px-4 max-w-6xl relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-black tracking-tight"
            >
              Good <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-emerald-400">Morning</span>,
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-muted-foreground mt-2 font-light"
            >
              {session?.user?.name || 'User'}. Ready to conquer the day?
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 bg-background/50 backdrop-blur-md p-1 rounded-full border border-border/50"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-9 h-10 w-full md:w-64 bg-transparent border-none focus-visible:ring-0 rounded-full"
              />
            </div>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Calendar className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Filter className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Summary Cards */}
        <SummaryCards
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          remainingTasks={remainingTasks}
          isLoading={isLoadingTasks && optimisticTasks.length === 0}
        />

        {/* Tasks Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Tasks
            </h2>
            <div className="flex gap-2 p-1 bg-muted/30 rounded-lg">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    filter === f
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {isLoadingTasks && optimisticTasks.length === 0 ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Skeleton className="h-48 rounded-2xl" />
                  </motion.div>
                ))
              ) : filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-20 text-center"
                >
                  <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    {searchQuery ? 'No tasks found' : 'All caught up!'}
                  </h3>
                  <p className="text-muted-foreground/60">
                    {searchQuery
                      ? 'Try adjusting your search or filters.'
                      : 'No tasks found. Create your first task!'}
                  </p>
                </motion.div>
              ) : (
                filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.3,
                      delay: prefersReducedMotion ? 0 : Math.min(index * 0.05, 0.3)
                    }}
                    whileHover={prefersReducedMotion ? {} : { y: -5, transition: { duration: 0.2 } }}
                    className="group"
                  >
                    <div className={cn(
                      "h-full relative bg-background/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 transition-all duration-300",
                      "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
                      task.completed && "opacity-60 bg-muted/20 grayscale-[0.5]"
                    )}>
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className={cn(
                              "font-semibold text-lg leading-tight transition-all",
                              task.completed && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </h3>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2 mt-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTask(task)}
                            disabled={updatingTaskId === task.id}
                            className={cn(
                              "flex-1 justify-start gap-2 h-9 rounded-xl transition-colors",
                              task.completed
                                ? "text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            )}
                          >
                            {updatingTaskId === task.id ? (
                              <>
                                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                <span className="font-medium">{task.completed ? 'Undoing...' : 'Completing...'}</span>
                              </>
                            ) : (
                              <>
                                {task.completed ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                <span className="font-medium">{task.completed ? "Undo" : "Mark as Complete"}</span>
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deletingTaskId === task.id}
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            {deletingTaskId === task.id ? (
                              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setIsCreateDialogOpen(true)}
        label="Create new task"
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleDialogSubmit}
        isSubmitting={isCreatingTask}
      />
    </PageWrapper>
  );
}