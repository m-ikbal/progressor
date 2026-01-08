import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { TaskFilters } from '@/components/tasks/task-filters';
import type { TaskPriority, TaskStatus } from '@/types';

interface TasksPageProps {
  searchParams: {
    status?: string;
    priority?: string;
    category?: string;
  };
}

async function getTasks(userId: string, filters: TasksPageProps['searchParams']) {
  const where: any = {
    userId,
    isArchived: false,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.category) {
    where.categoryId = filters.category;
  }

  const tasks = await db.task.findMany({
    where,
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      _count: {
        select: {
          notes: {
            where: { isArchived: false },
          },
        },
      },
    },
  });

  // Prisma schema uses `String` fields for SQLite compatibility; narrow them to our app unions.
  return tasks.map((t) => ({
    ...t,
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
  }));
}

async function getCategories(userId: string) {
  return db.category.findMany({
    where: { userId, isArchived: false },
    select: { id: true, name: true, color: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await getAuthSession();
  const [tasks, categories] = await Promise.all([
    getTasks(session!.user.id, searchParams),
    getCategories(session!.user.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Görevler</h1>
          <p className="text-muted-foreground mt-1">
            Tüm görevlerinizi yönetin ve takip edin
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Görev
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters categories={categories} />

      {/* Task List */}
      <Suspense fallback={<div className="h-64 skeleton rounded-xl" />}>
        <TaskList tasks={tasks} />
      </Suspense>
    </div>
  );
}

