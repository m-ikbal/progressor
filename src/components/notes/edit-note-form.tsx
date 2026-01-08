'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Pin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateNoteSchema, type UpdateNoteInput } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface TaskOption {
  id: string;
  title: string;
}

interface EditNoteFormProps {
  noteId: string;
  categories: CategoryOption[];
  tasks: TaskOption[];
  initialNote: {
    title: string;
    content: string;
    isPinned: boolean;
    categoryId: string | null;
    taskId: string | null;
  };
}

export function EditNoteForm({ noteId, categories, tasks, initialNote }: EditNoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateNoteInput>({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: {
      title: initialNote.title,
      content: initialNote.content,
      isPinned: initialNote.isPinned,
      categoryId: initialNote.categoryId ?? undefined,
      taskId: initialNote.taskId ?? undefined,
    },
  });

  const isPinned = watch('isPinned') ?? false;

  const onSubmit = async (data: UpdateNoteInput) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Normalize empty strings
          content: data.content === '' ? '' : data.content,
          categoryId: data.categoryId ?? null,
          taskId: data.taskId ?? null,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: 'Hata',
          description: result.error || 'Not güncellenemedi',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Başarılı',
        description: 'Not güncellendi',
      });

      router.push('/notes');
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Not Düzenle</h1>
          <p className="text-muted-foreground mt-1">Notunuzu güncelleyin</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Not Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" error={!!errors.title} required>
                Not Başlığı
              </Label>
              <Input
                id="title"
                placeholder="Örn: React Performance İpuçları"
                error={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">İçerik</Label>
              <Textarea
                id="content"
                placeholder="Notunuzu buraya yazın... Markdown desteklenir."
                rows={12}
                className="font-mono text-sm"
                {...register('content')}
              />
              <p className="text-xs text-muted-foreground">
                Markdown formatını kullanabilirsiniz: # Başlık, **kalın**, *italik*, `kod`
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  defaultValue={initialNote.categoryId ?? 'none'}
                  onValueChange={(value) =>
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

              {/* Task */}
              <div className="space-y-2">
                <Label>İlişkili Görev</Label>
                <Select
                  defaultValue={initialNote.taskId ?? 'none'}
                  onValueChange={(value) =>
                    setValue('taskId', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Görev seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Görev yok</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pin */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setValue('isPinned', checked as boolean)}
              />
              <Label
                htmlFor="isPinned"
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Pin className="h-4 w-4" />
                Bu notu sabitle
              </Label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
                Kaydet
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/notes">İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


