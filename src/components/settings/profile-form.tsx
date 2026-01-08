'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
    },
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);

    try {
      // In a real app, this would call an API endpoint
      toast({
        title: 'Başarılı',
        description: 'Profiliniz güncellendi',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Profil güncellenemedi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.image || undefined} alt={user.name || ''} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" error={!!errors.name}>
          İsim
        </Label>
        <Input
          id="name"
          placeholder="Adınız Soyadınız"
          error={!!errors.name}
          leftIcon={<User className="h-4 w-4" />}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" error={!!errors.email}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="ornek@email.com"
          error={!!errors.email}
          disabled
          {...register('email')}
        />
        <p className="text-xs text-muted-foreground">
          Email adresi değiştirilemez
        </p>
      </div>

      <Button type="submit" isLoading={isLoading} disabled={!isDirty}>
        {!isLoading && <Save className="mr-2 h-4 w-4" />}
        Kaydet
      </Button>
    </form>
  );
}

