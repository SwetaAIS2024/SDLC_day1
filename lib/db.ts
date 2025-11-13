/**
 * Database Layer - Single Source of Truth
 * Per copilot-instructions.md Pattern #2
 * All database interfaces and CRUD operations in one file
 */

import Database from 'better-sqlite3';
import { getSingaporeNow } from './timezone';

// Database file in project root
const db = new Database('todos.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// TypeScript Types
export type Priority = 'low' | 'medium' | 'high';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed_at: string | null;
  due_date: string | null; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
  priority: Priority | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
}

export interface CreateTodoInput {
  title: string;
  due_date?: string | null;
  priority?: Priority;
  recurrence_pattern?: RecurrencePattern;
  reminder_minutes?: number;
}

export interface UpdateTodoInput {
  title?: string;
  completed_at?: string | null;
  due_date?: string | null;
  priority?: Priority;
  recurrence_pattern?: RecurrencePattern;
  reminder_minutes?: number;
}

// Subtask interfaces
export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean; // Converted from 0/1 in DB
  position: number;
  created_at: string; // ISO 8601 format
}

export interface SubtaskCreateInput {
  todo_id: number;
  title: string;
  position?: number; // Auto-calculated if omitted
}

export interface SubtaskUpdateInput {
  title?: string;
  completed?: boolean;
  position?: number;
}

export interface SubtaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

// Extended Todo interface with subtasks
export interface TodoWithSubtasks extends Todo {
  subtasks: Subtask[];
  progress: SubtaskProgress;
}

// Initialize Database Schema
db.exec(`
  -- Users table (stub for PRP-11)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Todos table
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(title) >= 1 AND length(title) <= 500),
    completed_at TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
    recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    reminder_minutes INTEGER,
    last_notification_sent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);

  -- Subtasks table (Feature F06)
  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 500),
    completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
    position INTEGER NOT NULL DEFAULT 0 CHECK(position >= 0),
    created_at TEXT NOT NULL,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
  CREATE INDEX IF NOT EXISTS idx_subtasks_position ON subtasks(todo_id, position);

  -- Create default user for development (will be replaced by WebAuthn in PRP-11)
  INSERT OR IGNORE INTO users (id, username) VALUES (1, 'dev-user');
`);

// Todo CRUD Operations
export const todoDB = {
  /**
   * Create new todo
   * All DB operations are synchronous (better-sqlite3)
   */
  create: (userId: number, input: CreateTodoInput): Todo => {
    const now = getSingaporeNow().toISOString();
    const stmt = db.prepare(`
      INSERT INTO todos (
        user_id, title, due_date, created_at, updated_at,
        priority, recurrence_pattern, reminder_minutes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      input.title,
      input.due_date || null,
      now,
      now,
      input.priority || null,
      input.recurrence_pattern || null,
      input.reminder_minutes || null
    );

    const todo = todoDB.getById(userId, result.lastInsertRowid as number);
    if (!todo) throw new Error('Failed to retrieve created todo');
    return todo;
  },

  /**
   * Get all todos for a user
   * Sorted by creation date (newest first)
   */
  getAll: (userId: number): Todo[] => {
    const stmt = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Todo[];
  },

  /**
   * Get single todo by ID
   * Returns null if not found or doesn't belong to user
   */
  getById: (userId: number, todoId: number): Todo | null => {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
    return (stmt.get(todoId, userId) as Todo) || null;
  },

  /**
   * Update todo with dynamic field updates
   * Only updates fields present in input object
   */
  update: (userId: number, todoId: number, input: UpdateTodoInput): Todo | null => {
    const now = getSingaporeNow().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    // Build dynamic UPDATE query based on provided fields
    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(input.completed_at);
    }
    if (input.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(input.due_date);
    }
    if (input.priority !== undefined) {
      updates.push('priority = ?');
      values.push(input.priority);
    }
    if (input.recurrence_pattern !== undefined) {
      updates.push('recurrence_pattern = ?');
      values.push(input.recurrence_pattern);
    }
    if (input.reminder_minutes !== undefined) {
      updates.push('reminder_minutes = ?');
      values.push(input.reminder_minutes);
    }

    // If no fields to update, just return current todo
    if (updates.length === 0) return todoDB.getById(userId, todoId);

    // Always update updated_at timestamp
    updates.push('updated_at = ?');
    values.push(now);
    values.push(todoId, userId);

    const stmt = db.prepare(`
      UPDATE todos
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);
    return todoDB.getById(userId, todoId);
  },

  /**
   * Delete todo
   * Returns true if deleted, false if not found
   */
  delete: (userId: number, todoId: number): boolean => {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
    const result = stmt.run(todoId, userId);
    return result.changes > 0;
  },
};

// Subtask CRUD Operations (Feature F06)
export const subtaskDB = {
  /**
   * Get all subtasks for a todo
   * Ordered by position ASC
   */
  getByTodoId(todoId: number): Subtask[] {
    const rows = db.prepare(`
      SELECT * FROM subtasks 
      WHERE todo_id = ? 
      ORDER BY position ASC, id ASC
    `).all(todoId) as any[];
    
    return rows.map(row => ({
      ...row,
      completed: row.completed === 1
    }));
  },

  /**
   * Get single subtask by ID
   */
  getById(id: number): Subtask | null {
    const row = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as any;
    if (!row) return null;
    return { ...row, completed: row.completed === 1 };
  },

  /**
   * Create new subtask
   * Auto-calculates position if not provided
   */
  create(input: SubtaskCreateInput): Subtask {
    const now = getSingaporeNow().toISOString();
    
    // Calculate position if not provided
    let position = input.position;
    if (position === undefined) {
      const maxPos = db.prepare(`
        SELECT MAX(position) as max FROM subtasks WHERE todo_id = ?
      `).get(input.todo_id) as { max: number | null };
      position = (maxPos?.max ?? -1) + 1;
    }

    const result = db.prepare(`
      INSERT INTO subtasks (todo_id, title, completed, position, created_at)
      VALUES (?, ?, 0, ?, ?)
    `).run(input.todo_id, input.title.trim(), position, now);

    const subtask = subtaskDB.getById(result.lastInsertRowid as number);
    if (!subtask) throw new Error('Failed to retrieve created subtask');
    return subtask;
  },

  /**
   * Update subtask with dynamic field updates
   * Only updates fields present in input object
   */
  update(id: number, input: SubtaskUpdateInput): Subtask | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title.trim());
    }
    if (input.completed !== undefined) {
      updates.push('completed = ?');
      values.push(input.completed ? 1 : 0);
    }
    if (input.position !== undefined) {
      updates.push('position = ?');
      values.push(input.position);
    }

    if (updates.length === 0) {
      return subtaskDB.getById(id);
    }

    values.push(id);
    db.prepare(`
      UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    return subtaskDB.getById(id);
  },

  /**
   * Delete subtask
   * Returns true if deleted, false if not found
   */
  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  /**
   * Delete all subtasks for a todo
   * Used internally, cascade handles this automatically
   */
  deleteByTodoId(todoId: number): number {
    const result = db.prepare('DELETE FROM subtasks WHERE todo_id = ?').run(todoId);
    return result.changes;
  },

  /**
   * Calculate progress for a todo
   */
  calculateProgress(todoId: number): SubtaskProgress {
    const subtasks = subtaskDB.getByTodoId(todoId);
    const total = subtasks.length;
    const completed = subtasks.filter(s => s.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }
};

// Export database instance for advanced usage if needed
export { db };
