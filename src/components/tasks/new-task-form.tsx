'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
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
import { createTaskSchema, type CreateTaskInput } from '@/lib/validations';
import { taskStatusConfig, taskPriorityConfig } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TaskStatus, TaskPriority } from '@/types';

interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface NewTaskFormProps {
  categories: CategoryOption[];
}

export function NewTaskForm({ categories }: NewTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: 'TODO',
      priority: 'MEDIUM',
      progress: 0,
    },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Hata',
          description: result.error || 'Görev oluşturulamadı',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Başarılı',
        description: 'Görev oluşturuldu',
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
        <Link href="/tasks" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Görev</h1>
          <p className="text-muted-foreground mt-1">Yeni bir görev oluşturun</p>
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
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
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
                  defaultValue="TODO"
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
                  defaultValue="MEDIUM"
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
                Oluştur
              </Button>
              <Link href="/tasks" className={buttonVariants({ variant: 'outline' })}>
                İptal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


