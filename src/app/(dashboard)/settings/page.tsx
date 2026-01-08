import { getAuthSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { ProfileForm } from '@/components/settings/profile-form';
import { Separator } from '@/components/ui/separator';

export default async function SettingsPage() {
  const session = await getAuthSession();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Hesap ve uygulama ayarlarınızı yönetin
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Kişisel bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={session!.user} />
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Görünüm</CardTitle>
          <CardDescription>
            Uygulama görünümünü özelleştirin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
          <CardDescription>
            Bu işlemler geri alınamaz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Hesabı Sil</p>
              <p className="text-sm text-muted-foreground">
                Hesabınız ve tüm verileriniz kalıcı olarak silinir
              </p>
            </div>
            <button
              className="px-4 py-2 text-sm font-medium text-destructive border border-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
              disabled
            >
              Hesabı Sil
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

