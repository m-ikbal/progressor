import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { NewTaskForm } from '@/components/tasks/new-task-form';

export default async function NewTaskPage() {
  const session = await getAuthSession();

  const categories = await db.category.findMany({
    where: { userId: session!.user.id, isArchived: false },
    select: { id: true, name: true, color: true },
    orderBy: { sortOrder: 'asc' },
  });

  return <NewTaskForm categories={categories} />;
}

