'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatRelativeTime, taskStatusConfig, taskPriorityConfig } from '@/lib/utils';
import { TaskStatus, TaskPriority } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLoadingSet } from '@/hooks/use-loading-set';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface RecentTasksProps {
  tasks: Task[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { loading: loadingTasks, start, stop } = useLoadingSet<string>();

  const onComplete = async (taskId: string) => {
    start(taskId);
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
      stop(taskId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Son Görevler</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">
              Tümünü Gör
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Henüz görev eklenmemiş</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/tasks">İlk görevinizi oluşturun</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, index) => {
                const statusConfig = taskStatusConfig[task.status];
                const priorityConfig = taskPriorityConfig[task.priority];
                const isLoading = loadingTasks.has(task.id);
                const isCompleted = task.status === 'COMPLETED';

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div
                      className={`relative block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                        isLoading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Link
                        href={`/tasks/${task.id}`}
                        className="absolute inset-0 z-0"
                      />
                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                           <div
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                           >
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => onComplete(task.id)}
                              disabled={isCompleted || isLoading}
                              className="mt-1"
                            />
                           </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {task.category && (
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: task.category.color }}
                                />
                              )}
                              <h4 className={`font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatRelativeTime(task.updatedAt)}</span>
                              {task.category && (
                                <>
                                  <span>•</span>
                                  <span>{task.category.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`${priorityConfig.color} ${priorityConfig.bgColor} border-0`}
                          >
                            {priorityConfig.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${statusConfig.color} ${statusConfig.bgColor} border-0`}
                          >
                            {statusConfig.label}
                          </Badge>
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
