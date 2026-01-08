import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCategorySchema } from '@/lib/validations';
import {
  validateRequest,
  withAuth,
  successResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api-utils';

// GET /api/categories - Get all categories for current user
export async function GET() {
  return withAuth(async (userId) => {
    try {
      const categories = await db.category.findMany({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      });

      // Calculate stats for each category
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const taskStats = await db.task.groupBy({
            by: ['status'],
            where: {
              categoryId: category.id,
              isArchived: false,
            },
            _count: true,
          });

          const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);
          const completedTasks = taskStats.find((s) => s.status === 'COMPLETED')?._count || 0;
          const inProgressTasks = taskStats.find((s) => s.status === 'IN_PROGRESS')?._count || 0;

          return {
            ...category,
            stats: {
              totalTasks,
              completedTasks,
              inProgressTasks,
              totalNotes: category._count.notes,
              progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            },
          };
        })
      );

      return successResponse(categoriesWithStats);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  return withAuth(async (userId) => {
    try {
      const validation = await validateRequest(request, createCategorySchema);

      if (validation.error) {
        return validation.error;
      }

      const { name, description, color, icon } = validation.data;

      // Check for duplicate category name
      const existingCategory = await db.category.findFirst({
        where: {
          userId,
          name: {
            equals: name,
          },
          isArchived: false,
        },
      });

      if (existingCategory) {
        return errorResponse('Bu isimde bir kategori zaten mevcut', 409);
      }

      // Get max sort order
      const maxSortOrder = await db.category.aggregate({
        where: { userId },
        _max: { sortOrder: true },
      });

      const category = await db.category.create({
        data: {
          name,
          description,
          color: color || '#6366f1',
          icon,
          sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
          userId,
        },
        include: {
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      });

      return successResponse(category, 201);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

