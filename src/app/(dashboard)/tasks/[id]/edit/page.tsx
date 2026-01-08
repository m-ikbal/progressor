import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditTaskForm } from '@/components/tasks/edit-task-form';
import type { TaskPriority, TaskStatus } from '@/types';

interface EditTaskPageProps {
  params: { id: string };
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const session = await getAuthSession();

  const [task, categories] = await Promise.all([
    db.task.findFirst({
      where: { id: params.id, userId: session!.user.id, isArchived: false },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        progress: true,
        dueDate: true,
        categoryId: true,
      },
    }),
    db.category.findMany({
      where: { userId: session!.user.id, isArchived: false },
      select: { id: true, name: true, color: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  if (!task) {
    redirect('/tasks');
  }

  return (
    <EditTaskForm
      taskId={task.id}
      categories={categories}
      initialTask={{
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        progress: task.progress,
        dueDate: task.dueDate ? toDateInputValue(task.dueDate) : null,
        categoryId: task.categoryId,
      }}
    />
  );
}


