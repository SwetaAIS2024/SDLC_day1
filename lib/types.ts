// TypeScript Types (safe for client-side imports)
// This file contains NO database code, only type definitions

// Priority enum
export type Priority = 'high' | 'medium' | 'low';

// Recurrence pattern enum
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Priority display configuration
export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    sortOrder: 0,
  },
  medium: {
    label: 'Medium',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    sortOrder: 1,
  },
  low: {
    label: 'Low',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    sortOrder: 2,
  },
} as const;

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;
  credential_public_key: Buffer;
  counter: number;
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed_at: string | null;
  priority: Priority | null;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoInput {
  title: string;
  priority?: Priority | null;
  due_date?: string | null;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
}

export interface UpdateTodoInput {
  title?: string;
  completed_at?: string | null;
  priority?: Priority | null;
  due_date?: string | null;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
  last_notification_sent?: string | null;
}
