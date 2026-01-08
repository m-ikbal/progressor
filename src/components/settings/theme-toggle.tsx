'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  {
    value: 'light',
    label: 'Açık',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Koyu',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Sistem',
    icon: Monitor,
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Tema</p>
        <p className="text-sm text-muted-foreground">
          Uygulama temasını seçin
        </p>
      </div>

      <div className="flex gap-3">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
              theme === t.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-muted/50 hover:bg-muted'
            )}
          >
            <t.icon
              className={cn(
                'h-6 w-6',
                theme === t.value ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                theme === t.value ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

