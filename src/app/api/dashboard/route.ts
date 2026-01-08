import { db } from '@/lib/db';
import { withAuth, successResponse, serverErrorResponse } from '@/lib/api-utils';

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  return withAuth(async (userId) => {
    try {
      // Get task counts by status
      const taskStats = await db.task.groupBy({
        by: ['status'],
        where: {
          userId,
          isArchived: false,
        },
        _count: true,
      });

      const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);
      const completedTasks = taskStats.find((s) => s.status === 'COMPLETED')?._count || 0;
      const inProgressTasks = taskStats.find((s) => s.status === 'IN_PROGRESS')?._count || 0;
      const todoTasks = taskStats.find((s) => s.status === 'TODO')?._count || 0;

      // Get category count
      const totalCategories = await db.category.count({
        where: {
          userId,
          isArchived: false,
        },
      });

      // Get note count
      const totalNotes = await db.note.count({
        where: {
          userId,
          isArchived: false,
        },
      });

      // Calculate overall progress
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Get category progress
      const categories = await db.category.findMany({
        where: {
          userId,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          color: true,
        },
      });

      const categoryProgress = await Promise.all(
        categories.map(async (category) => {
          const catTaskStats = await db.task.groupBy({
            by: ['status'],
            where: {
              categoryId: category.id,
              isArchived: false,
            },
            _count: true,
          });

          const catTotalTasks = catTaskStats.reduce((sum, stat) => sum + stat._count, 0);
          const catCompletedTasks =
            catTaskStats.find((s) => s.status === 'COMPLETED')?._count || 0;

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
        where: {
          userId,
          isArchived: false,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      // Get upcoming tasks (due soon)
      const upcomingTasks = await db.task.findMany({
        where: {
          userId,
          isArchived: false,
          status: { not: 'COMPLETED' },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      // Get pinned notes
      const pinnedNotes = await db.note.findMany({
        where: {
          userId,
          isArchived: false,
          isPinned: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return successResponse({
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          totalCategories,
          totalNotes,
          overallProgress,
        },
        categoryProgress,
        recentTasks,
        upcomingTasks,
        pinnedNotes,
      });
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

