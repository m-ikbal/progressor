import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { CategoryList } from '@/components/categories/category-list';

async function getCategories(userId: string) {
  const categories = await db.category.findMany({
    where: {
      userId,
      isArchived: false,
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          tasks: {
            where: { isArchived: false },
          },
          notes: {
            where: { isArchived: false },
          },
        },
      },
    },
  });

  // Get task stats for each category
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

      return {
        ...category,
        stats: {
          totalTasks,
          completedTasks,
          totalNotes: category._count.notes,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      };
    })
  );

  return categoriesWithStats;
}

export default async function CategoriesPage() {
  const session = await getAuthSession();
  const categories = await getCategories(session!.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground mt-1">
            Öğrenme alanlarınızı yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori
          </Link>
        </Button>
      </div>

      {/* Category List */}
      <Suspense fallback={<div className="h-64 skeleton rounded-xl" />}>
        <CategoryList categories={categories} />
      </Suspense>
    </div>
  );
}

