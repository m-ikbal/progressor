import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@/types';

// ============================================================================
// AUTH VALIDATIONS
// ============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email gereklidir')
    .email('Geçerli bir email adresi giriniz'),
  password: z
    .string()
    .min(1, 'Şifre gereklidir')
    .min(6, 'Şifre en az 6 karakter olmalıdır'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'İsim gereklidir')
    .min(2, 'İsim en az 2 karakter olmalıdır')
    .max(50, 'İsim en fazla 50 karakter olabilir'),
  email: z
    .string()
    .min(1, 'Email gereklidir')
    .email('Geçerli bir email adresi giriniz'),
  password: z
    .string()
    .min(1, 'Şifre gereklidir')
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'İsim en az 2 karakter olmalıdır')
    .max(50, 'İsim en fazla 50 karakter olabilir')
    .optional(),
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z
    .string()
    .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  confirmNewPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmNewPassword'],
});

// ============================================================================
// CATEGORY VALIDATIONS
// ============================================================================

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Kategori adı gereklidir')
    .min(2, 'Kategori adı en az 2 karakter olmalıdır')
    .max(50, 'Kategori adı en fazla 50 karakter olabilir'),
  description: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu giriniz (örn: #6366f1)')
    .optional(),
  icon: z
    .string()
    .max(50, 'İkon adı en fazla 50 karakter olabilir')
    .optional()
    .nullable(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  sortOrder: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
});

// ============================================================================
// TASK VALIDATIONS
// ============================================================================

const taskStatusValues = Object.values(TaskStatus) as [string, ...string[]];
const taskPriorityValues = Object.values(TaskPriority) as [string, ...string[]];

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Görev başlığı gereklidir')
    .min(2, 'Görev başlığı en az 2 karakter olmalıdır')
    .max(200, 'Görev başlığı en fazla 200 karakter olabilir'),
  description: z
    .string()
    .max(2000, 'Açıklama en fazla 2000 karakter olabilir')
    .optional()
    .nullable(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  progress: z
    .number()
    .int()
    .min(0, 'İlerleme 0\'dan küçük olamaz')
    .max(100, 'İlerleme 100\'den büyük olamaz')
    .optional(),
  dueDate: z
    .union([
      z.string().datetime(),
      // HTML <input type="date" /> sends YYYY-MM-DD
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.date(),
    ])
    .optional()
    .nullable(),
  categoryId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

// ============================================================================
// NOTE VALIDATIONS
// ============================================================================

export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Not başlığı gereklidir')
    .min(2, 'Not başlığı en az 2 karakter olmalıdır')
    .max(200, 'Not başlığı en fazla 200 karakter olabilir'),
  content: z
    .string()
    .max(50000, 'İçerik en fazla 50000 karakter olabilir')
    .optional(),
  isPinned: z.boolean().optional(),
  categoryId: z.string().cuid().optional().nullable(),
  taskId: z.string().cuid().optional().nullable(),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

// ============================================================================
// QUERY VALIDATIONS
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const taskFilterSchema = z.object({
  status: z
    .union([z.enum(taskStatusValues), z.array(z.enum(taskStatusValues))])
    .optional(),
  priority: z
    .union([z.enum(taskPriorityValues), z.array(z.enum(taskPriorityValues))])
    .optional(),
  categoryId: z.string().cuid().optional(),
  isArchived: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
});

export const noteFilterSchema = z.object({
  categoryId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
  isPinned: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type NoteFilterInput = z.infer<typeof noteFilterSchema>;
