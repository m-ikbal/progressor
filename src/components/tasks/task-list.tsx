'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Clock,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  formatDate,
  formatRelativeTime,
  taskStatusConfig,
  taskPriorityConfig,
  isOverdue,
  cn,
} from '@/lib/utils';
import { TaskStatus, TaskPriority } from '@/types';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate: Date | null;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  _count: {
    notes: number;
  };
}

interface TaskListProps {
  tasks: Task[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const priorityBorderClass: Record<TaskPriority, string> = {
  URGENT: 'border-l-4 border-l-red-500',
  HIGH: 'border-l-4 border-l-orange-500',
  MEDIUM: 'border-l-4 border-l-yellow-500',
  LOW: 'border-l-4 border-l-slate-400',
};

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz görev yok</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Yapılacaklar listenizi oluşturmaya başlayın. İlerlemenizi takip edin
            ve hedeflerinize ulaşın.
          </p>
          <Button asChild>
            <Link href="/tasks/new">
              İlk Görevinizi Oluşturun
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group tasks by status
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const statusOrder: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {statusOrder.map((status) => {
        const statusTasks = groupedTasks[status];
        if (!statusTasks || statusTasks.length === 0) return null;

        const config = taskStatusConfig[status];

        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className={`${config.color} ${config.bgColor} border-0`}
              >
                {config.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {statusTasks.length} görev
              </span>
            </div>

            <div className="space-y-3">
              {statusTasks.map((task) => {
                const priorityConfig = taskPriorityConfig[task.priority];
                const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLETED';

                return (
                  <motion.div key={task.id} variants={itemVariants}>
                    <Card
                      className={cn(
                        'hover:shadow-md transition-shadow',
                        priorityBorderClass[task.priority]
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {task.category && (
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: task.category.color }}
                                />
                              )}
                              <Link
                                href={`/tasks/${task.id}`}
                                className="font-semibold hover:text-primary transition-colors truncate"
                              >
                                {task.title}
                              </Link>
                            </div>

                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {task.description}
                              </p>
                            )}

                            {/* Progress bar */}
                            {task.status !== 'COMPLETED' && task.progress > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span>İlerleme</span>
                                  <span>{task.progress}%</span>
                                </div>
                                <Progress value={task.progress} className="h-1.5" />
                              </div>
                            )}

                            {/* Meta info */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              {task.category && (
                                <span>{task.category.name}</span>
                              )}
                              {task.dueDate && (
                                <div
                                  className={cn(
                                    'flex items-center gap-1',
                                    overdue && 'text-destructive'
                                  )}
                                >
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {formatDate(task.dueDate, { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              )}
                              {task._count.notes > 0 && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>{task._count.notes}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatRelativeTime(task.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`${priorityConfig.color} ${priorityConfig.bgColor} border-0 text-xs`}
                            >
                              {priorityConfig.label}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/tasks/${task.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Düzenle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

