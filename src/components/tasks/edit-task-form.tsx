'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTaskSchema, type UpdateTaskInput } from '@/lib/validations';
import { taskStatusConfig, taskPriorityConfig } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus } from '@/types';

interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface EditTaskFormProps {
  taskId: string;
  categories: CategoryOption[];
  initialTask: {
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    dueDate: string | null; // YYYY-MM-DD for <input type="date" />
    categoryId: string | null;
  };
}

export function EditTaskForm({ taskId, categories, initialTask }: EditTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: initialTask.title,
      description: initialTask.description ?? undefined,
      status: initialTask.status,
      priority: initialTask.priority,
      progress: initialTask.progress,
      dueDate: initialTask.dueDate ?? undefined,
      categoryId: initialTask.categoryId ?? undefined,
    },
  });

  const onSubmit = async (data: UpdateTaskInput) => {
    try {
      const normalizedProgress =
        typeof data.progress === 'number' && Number.isNaN(data.progress) ? undefined : data.progress;

      const normalizedDueDate = data.dueDate === '' ? null : (data.dueDate ?? undefined);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          progress: normalizedProgress,
          // Allow clearing fields:
          dueDate: normalizedDueDate,
          categoryId: data.categoryId ?? null,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: 'Hata',
          description: result.error || 'Görev güncellenemedi',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Başarılı',
        description: 'Görev güncellendi',
      });

      router.push('/tasks');
      router.refresh();
    } catch {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Görev Düzenle</h1>
          <p className="text-muted-foreground mt-1">Görevinizi güncelleyin</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Görev Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" error={!!errors.title} required>
                Görev Başlığı
              </Label>
              <Input
                id="title"
                placeholder="Örn: React Hooks öğren"
                error={!!errors.title}
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Görev hakkında detaylar..."
                rows={4}
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  defaultValue={initialTask.categoryId ?? 'none'}
                  onValueChange={(value: string) =>
                    setValue('categoryId', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategorisiz</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  defaultValue={initialTask.status}
                  onValueChange={(value: string) => setValue('status', value as TaskStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select
                  defaultValue={initialTask.priority}
                  onValueChange={(value: string) => setValue('priority', value as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskPriorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                <Input id="dueDate" type="date" {...register('dueDate')} />
                {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <Label htmlFor="progress">İlerleme (%)</Label>
              <Input
                id="progress"
                type="number"
                min={0}
                max={100}
                placeholder="0"
                {...register('progress', { valueAsNumber: true })}
              />
              {errors.progress && (
                <p className="text-sm text-destructive">{errors.progress.message}</p>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
                Kaydet
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/tasks">İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


