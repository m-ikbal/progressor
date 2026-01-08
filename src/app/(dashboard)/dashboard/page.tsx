import { Suspense } from 'react';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { CategoryProgress } from '@/components/dashboard/category-progress';
import { RecentTasks } from '@/components/dashboard/recent-tasks';
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks';
import { PinnedNotes } from '@/components/dashboard/pinned-notes';
import { QuickActions } from '@/components/dashboard/quick-actions';
import type { TaskPriority, TaskStatus } from '@/types';
import {
  DashboardStatsSkeleton,
  CategoryProgressSkeleton,
  RecentTasksSkeleton,
  UpcomingTasksSkeleton,
  PinnedNotesSkeleton,
} from '@/components/dashboard/dashboard-skeletons';

async function getDashboardData(userId: string) {
  // Get task counts by status
  const taskStats = await db.task.groupBy({
    by: ['status'],
    where: {
      userId,
      isArchived: false,
    },
    _count: true,
  });

  const totalTasks = taskStats.reduce((sum: number, stat: any) => sum + stat._count, 0);
  const completedTasks = taskStats.find((s: any) => s.status === 'COMPLETED')?._count || 0;
  const inProgressTasks = taskStats.find((s: any) => s.status === 'IN_PROGRESS')?._count || 0;
  const todoTasks = taskStats.find((s: any) => s.status === 'TODO')?._count || 0;

  // Get category count
  const totalCategories = await db.category.count({
    where: { userId, isArchived: false },
  });

  // Get note count
  const totalNotes = await db.note.count({
    where: { userId, isArchived: false },
  });

  // Calculate overall progress
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get categories with progress
  const categories = await db.category.findMany({
    where: { userId, isArchived: false },
    select: { id: true, name: true, color: true },
  });

  const categoryProgress = await Promise.all(
    categories.map(async (category: any) => {
      const catTaskStats = await db.task.groupBy({
        by: ['status'],
        where: { categoryId: category.id, isArchived: false },
        _count: true,
      });

      const catTotalTasks = catTaskStats.reduce((sum: number, stat: any) => sum + stat._count, 0);
      const catCompletedTasks = catTaskStats.find((s: any) => s.status === 'COMPLETED')?._count || 0;

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        totalTasks: catTotalTasks,
        completedTasks: catCompletedTasks,
        progress: catTotalTasks > 0 ? Math.round((catCompletedTasks / catTotalTasks) * 100) : 0,
      };
    })
  );

  // Get recent tasks
  const recentTasks = await db.task.findMany({
    where: { userId, isArchived: false },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // Get upcoming tasks
  const upcomingTasks = await db.task.findMany({
    where: {
      userId,
      isArchived: false,
      status: { not: 'COMPLETED' },
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // Get pinned notes
  const pinnedNotes = await db.note.findMany({
    where: { userId, isArchived: false, isPinned: true },
    orderBy: { updatedAt: 'desc' },
    take: 4,
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  return {
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalCategories,
      totalNotes,
      overallProgress,
    },
    categoryProgress: categoryProgress.filter((c: any) => c.totalTasks > 0),
    // Prisma schema uses `String` fields for SQLite compatibility; narrow them to our app unions.
    recentTasks: recentTasks.map((t) => ({
      ...t,
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
    })),
    upcomingTasks: upcomingTasks.map((t) => ({
      ...t,
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
    })),
    pinnedNotes,
  };
}

export default async function DashboardPage() {
  const session = await getAuthSession();
  const data = await getDashboardData(session!.user.id);

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Hoş geldin, {session?.user.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          İşte öğrenme yolculuğunun özeti
        </p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Stats */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats stats={data.stats} />
      </Suspense>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Progress */}
          {data.categoryProgress.length > 0 && (
            <Suspense fallback={<CategoryProgressSkeleton />}>
              <CategoryProgress categories={data.categoryProgress} />
            </Suspense>
          )}

          {/* Recent Tasks */}
          <Suspense fallback={<RecentTasksSkeleton />}>
            <RecentTasks tasks={data.recentTasks} />
          </Suspense>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Suspense fallback={<UpcomingTasksSkeleton />}>
            <UpcomingTasks tasks={data.upcomingTasks} />
          </Suspense>

          {/* Pinned Notes */}
          {data.pinnedNotes.length > 0 && (
            <Suspense fallback={<PinnedNotesSkeleton />}>
              <PinnedNotes notes={data.pinnedNotes} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

