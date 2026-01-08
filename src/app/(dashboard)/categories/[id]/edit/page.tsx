'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { updateCategorySchema, type UpdateCategoryInput } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

const colorOptions = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
];

interface EditCategoryPageProps {
  params: { id: string };
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      color: colorOptions[0],
    },
  });

  const selectedColor = watch('color') || colorOptions[0];
  const categoryName = watch('name') || '';

  const categoryId = useMemo(() => params.id, [params.id]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'GET',
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          toast({
            title: 'Hata',
            description: result.error || 'Kategori bulunamadı',
            variant: 'destructive',
          });
          router.push('/categories');
          return;
        }

        if (!isMounted) return;
        // result.data is used by successResponse; but fallback to raw result for safety
        const category = result.data ?? result;
        setValue('name', category.name);
        setValue('description', category.description ?? null);
        setValue('color', category.color || colorOptions[0]);
        setValue('icon', category.icon ?? null);
      } catch {
        toast({
          title: 'Hata',
          description: 'Kategori yüklenemedi',
          variant: 'destructive',
        });
        router.push('/categories');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [categoryId, router, setValue, toast]);

  const onSubmit = async (data: UpdateCategoryInput) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          color: selectedColor,
          description: data.description === '' ? null : data.description,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: 'Hata',
          description: result.error || 'Kategori güncellenemedi',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Başarılı',
        description: 'Kategori güncellendi',
      });

      router.push('/categories');
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
        <Link
          href="/categories"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategori Düzenle</h1>
          <p className="text-muted-foreground mt-1">
            Öğrenme alanı bilgilerini güncelleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" error={!!errors.name} required>
                Kategori Adı
              </Label>
              <Input
                id="name"
                placeholder="Örn: Yazılım Geliştirme"
                error={!!errors.name}
                disabled={isLoading}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Bu kategori hakkında kısa bir açıklama..."
                rows={3}
                disabled={isLoading}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Renk</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    disabled={isLoading}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Önizleme</Label>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div>
                    <p className="font-semibold">
                      {categoryName ? categoryName : 'Kategori'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Görevler ve notlar kategori sayfasında güncellenir
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" isLoading={isSubmitting} disabled={isLoading}>
                {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
                Kaydet
              </Button>
              <Link href="/categories" className={buttonVariants({ variant: 'outline' })}>
                İptal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


