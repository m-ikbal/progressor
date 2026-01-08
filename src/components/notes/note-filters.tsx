'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface NoteFiltersProps {
  categories: Category[];
}

export function NoteFilters({ categories }: NoteFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category');
  const currentPinned = searchParams.get('pinned');

  const hasFilters = currentCategory || currentPinned;

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/notes?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/notes');
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtrele:</span>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <Select
          value={currentCategory || 'all'}
          onValueChange={(value) => updateFilter('category', value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
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
      )}

      {/* Pinned Filter */}
      <Button
        variant={currentPinned === 'true' ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => updateFilter('pinned', currentPinned === 'true' ? null : 'true')}
      >
        <Pin className={`mr-2 h-4 w-4 ${currentPinned === 'true' ? 'fill-current' : ''}`} />
        Sabitlenmiş
      </Button>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Temizle
        </Button>
      )}
    </div>
  );
}

