'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, getDaysUntilDue, cn } from '@/lib/utils';
import { TaskStatus, TaskPriority } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface UpcomingTasksProps {
  tasks: Task[];
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

  const onComplete = async (taskId: string) => {
    setLoadingTasks((prev) => new Set(prev).add(taskId));
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED', progress: 100 }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      toast({
        title: 'Görev tamamlandı',
        description: 'Görev başarıyla tamamlandı olarak işaretlendi.',
        variant: 'success',
      });
      
      router.refresh();
    } catch (error) {
      toast({
        title: 'Hata oluştu',
        description: 'Görev güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Yaklaşan Görevler</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks?filter=upcoming">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Yaklaşan görev yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => {
                const daysUntil = getDaysUntilDue(task.dueDate);
                const isUrgent = daysUntil !== null && daysUntil <= 1;
                const isLoading = loadingTasks.has(task.id);
                const isCompleted = task.status === 'COMPLETED';

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div
                      className={cn(
                        'relative block p-3 rounded-lg border transition-colors hover:bg-accent/50',
                        isUrgent && 'border-orange-500/50 bg-orange-500/5',
                        isLoading && 'opacity-50 pointer-events-none'
                      )}
                    >
                      <Link
                        href={`/tasks/${task.id}`}
                        className="absolute inset-0 z-0"
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="mt-1"
                        >
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onComplete(task.id)}
                            disabled={isCompleted || isLoading}
                          />
                        </div>
                        {task.category && (
                          <div
                            className="w-1 h-full min-h-[40px] rounded-full shrink-0"
                            style={{ backgroundColor: task.category.color }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("font-medium text-sm truncate", isCompleted && "line-through text-muted-foreground")}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {isUrgent ? (
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                            ) : (
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                'text-xs',
                                isUrgent
                                  ? 'text-orange-500 font-medium'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {task.dueDate && formatDate(task.dueDate, { day: 'numeric', month: 'short' })}
                              {daysUntil !== null && (
                                <span className="ml-1">
                                  ({daysUntil === 0 ? 'Bugün' : daysUntil === 1 ? 'Yarın' : `${daysUntil} gün`})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
