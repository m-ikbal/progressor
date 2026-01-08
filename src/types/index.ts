// ============================================================================
// Task Enums (as string literals for SQLite compatibility)
// ============================================================================

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// User Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  _count?: {
    tasks: number;
    notes: number;
  };
}

export interface CategoryWithStats extends Category {
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalNotes: number;
    progress: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isArchived?: boolean;
}

// ============================================================================
// Task Types
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate: Date | null;
  completedAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId: string | null;
  category?: Category | null;
  _count?: {
    notes: number;
  };
}

export interface TaskWithCategory extends Task {
  category: Category | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  dueDate?: Date | string;
  categoryId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  dueDate?: Date | string | null;
  categoryId?: string | null;
  isArchived?: boolean;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  categoryId?: string;
  isArchived?: boolean;
  search?: string;
}

// ============================================================================
// Note Types
// ============================================================================

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId: string | null;
  taskId: string | null;
  category?: Category | null;
  task?: Task | null;
}

export interface NoteWithRelations extends Note {
  category: Category | null;
  task: Task | null;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  isPinned?: boolean;
  categoryId?: string;
  taskId?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  isPinned?: boolean;
  categoryId?: string | null;
  taskId?: string | null;
  isArchived?: boolean;
}

export interface NoteFilters {
  categoryId?: string;
  taskId?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  search?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalCategories: number;
  totalNotes: number;
  overallProgress: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'note_created' | 'category_created';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

// ============================================================================
// UI Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}
