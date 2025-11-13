import Database from 'better-sqlite3';
import { getSingaporeNow } from './timezone';
import type { 
  Priority,
  User,
  Authenticator,
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  Subtask,
  CreateSubtaskInput,
  UpdateSubtaskInput
} from './types';

// Re-export all types for convenience
export * from './types';

// Initialize database
const db = new Database('todos.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS authenticators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    credential_public_key BLOB NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(title) >= 1 AND length(title) <= 500),
    completed_at TEXT,
    due_date TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
    recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    reminder_minutes INTEGER,
    last_notification_sent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);

  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(title) >= 1 AND length(title) <= 500),
    completed BOOLEAN NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
`);

// Migrations are handled inline - no separate migration needed as schema uses IF NOT EXISTS

// Create index for priority-based queries
db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)`);

// DEV MODE: Insert default user for testing if none exists
if (process.env.NODE_ENV === 'development') {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    db.prepare('INSERT INTO users (id, username) VALUES (1, ?)').run('dev-user');
  }
}

// Export database instance
export { db };

// Re-export types for convenience
export type { 
  Priority, 
  User, 
  Authenticator, 
  Todo, 
  CreateTodoInput, 
  UpdateTodoInput,
  Subtask,
  CreateSubtaskInput,
  UpdateSubtaskInput
} from './types';

// ============================================================================
// Database Operations
// ============================================================================

export const todoDB = {
  // Create a new todo
  create(userId: number, input: CreateTodoInput): Todo {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, priority, due_date, recurrence_pattern, reminder_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = getSingaporeNow().toISOString();
    const result = stmt.run(
      userId,
      input.title.trim(),
      input.priority || null,
      input.due_date || null,
      input.recurrence_pattern || null,
      input.reminder_minutes || null,
      now,
      now
    );
    
    return this.getById(userId, result.lastInsertRowid as number)!;
  },

  // Get all todos for a user, sorted by priority
  getAll(userId: number): Todo[] {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? 
      ORDER BY 
        CASE priority
          WHEN 'high' THEN 0
          WHEN 'medium' THEN 1
          WHEN 'low' THEN 2
          ELSE 3
        END,
        created_at DESC
    `);
    return stmt.all(userId) as Todo[];
  },

  // Get todos by priority
  getByPriority(userId: number, priority: Priority): Todo[] {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? AND priority = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, priority) as Todo[];
  },

  // Get count by priority (for filter badges)
  getCountByPriority(userId: number): Record<Priority, number> {
    const stmt = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM todos
      WHERE user_id = ? AND completed_at IS NULL AND priority IS NOT NULL
      GROUP BY priority
    `);
    
    const results = stmt.all(userId) as { priority: Priority; count: number }[];
    
    return {
      high: results.find(r => r.priority === 'high')?.count || 0,
      medium: results.find(r => r.priority === 'medium')?.count || 0,
      low: results.find(r => r.priority === 'low')?.count || 0,
    };
  },

  // Get a single todo by ID
  getById(userId: number, id: number): Todo | undefined {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE id = ? AND user_id = ?
    `);
    return stmt.get(id, userId) as Todo | undefined;
  },

  // Update a todo
  update(userId: number, id: number, input: UpdateTodoInput): Todo | undefined {
    const todo = this.getById(userId, id);
    if (!todo) return undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title.trim());
    }
    if (input.completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(input.completed_at);
    }
    if (input.priority !== undefined) {
      updates.push('priority = ?');
      values.push(input.priority);
    }
    if (input.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(input.due_date);
    }
    if (input.recurrence_pattern !== undefined) {
      updates.push('recurrence_pattern = ?');
      values.push(input.recurrence_pattern);
    }
    if (input.reminder_minutes !== undefined) {
      updates.push('reminder_minutes = ?');
      values.push(input.reminder_minutes);
    }
    if (input.last_notification_sent !== undefined) {
      updates.push('last_notification_sent = ?');
      values.push(input.last_notification_sent);
    }

    if (updates.length === 0) return todo;

    updates.push('updated_at = ?');
    values.push(getSingaporeNow().toISOString());
    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE todos 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(...values);

    return this.getById(userId, id);
  },

  // Delete a todo
  delete(userId: number, id: number): boolean {
    const stmt = db.prepare(`
      DELETE FROM todos 
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },
};

// User database operations (for auth)
export const userDB = {
  create(username: string): User {
    const stmt = db.prepare(`
      INSERT INTO users (username, created_at)
      VALUES (?, ?)
    `);
    
    const now = getSingaporeNow().toISOString();
    const result = stmt.run(username, now);
    
    return this.getById(result.lastInsertRowid as number)!;
  },

  getById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  getByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  },
};

// Authenticator database operations (for WebAuthn)
export const authenticatorDB = {
  create(userId: number, credentialId: string, publicKey: Buffer, counter: number): Authenticator {
    const stmt = db.prepare(`
      INSERT INTO authenticators (user_id, credential_id, credential_public_key, counter, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const now = getSingaporeNow().toISOString();
    const result = stmt.run(userId, credentialId, publicKey, counter, now);
    
    return this.getById(result.lastInsertRowid as number)!;
  },

  getById(id: number): Authenticator | undefined {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE id = ?');
    return stmt.get(id) as Authenticator | undefined;
  },

  getByCredentialId(credentialId: string): Authenticator | undefined {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE credential_id = ?');
    return stmt.get(credentialId) as Authenticator | undefined;
  },

  getByUserId(userId: number): Authenticator[] {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE user_id = ?');
    return stmt.all(userId) as Authenticator[];
  },

  updateCounter(id: number, counter: number): void {
    const stmt = db.prepare('UPDATE authenticators SET counter = ? WHERE id = ?');
    stmt.run(counter, id);
  },
};

// Subtask database operations
export const subtaskDB = {
  // Get all subtasks for a todo
  getAllForTodo(userId: number, todoId: number): import('./types').Subtask[] {
    // First verify the todo belongs to the user
    const todo = todoDB.getById(userId, todoId);
    if (!todo) return [];

    const stmt = db.prepare(`
      SELECT * FROM subtasks 
      WHERE todo_id = ?
      ORDER BY position ASC, created_at ASC
    `);
    return stmt.all(todoId) as import('./types').Subtask[];
  },

  // Create a new subtask
  create(userId: number, todoId: number, input: import('./types').CreateSubtaskInput): import('./types').Subtask {
    // Verify the todo belongs to the user
    const todo = todoDB.getById(userId, todoId);
    if (!todo) throw new Error('Todo not found');

    // Get the next position
    const posStmt = db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos 
      FROM subtasks 
      WHERE todo_id = ?
    `);
    const { next_pos } = posStmt.get(todoId) as { next_pos: number };

    const stmt = db.prepare(`
      INSERT INTO subtasks (todo_id, title, position, completed, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `);
    
    const now = getSingaporeNow().toISOString();
    const result = stmt.run(todoId, input.title.trim(), next_pos, now, now);
    
    return this.getById(userId, todoId, result.lastInsertRowid as number)!;
  },

  // Get a single subtask by ID
  getById(userId: number, todoId: number, subtaskId: number): import('./types').Subtask | undefined {
    // Verify the todo belongs to the user
    const todo = todoDB.getById(userId, todoId);
    if (!todo) return undefined;

    const stmt = db.prepare(`
      SELECT * FROM subtasks 
      WHERE id = ? AND todo_id = ?
    `);
    return stmt.get(subtaskId, todoId) as import('./types').Subtask | undefined;
  },

  // Update a subtask
  update(userId: number, todoId: number, subtaskId: number, input: import('./types').UpdateSubtaskInput): import('./types').Subtask {
    const subtask = this.getById(userId, todoId, subtaskId);
    if (!subtask) throw new Error('Subtask not found');

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

    if (updates.length === 0) return subtask;

    updates.push('updated_at = ?');
    values.push(getSingaporeNow().toISOString());
    values.push(subtaskId, todoId);

    const stmt = db.prepare(`
      UPDATE subtasks 
      SET ${updates.join(', ')}
      WHERE id = ? AND todo_id = ?
    `);
    stmt.run(...values);

    return this.getById(userId, todoId, subtaskId)!;
  },

  // Delete a subtask
  delete(userId: number, todoId: number, subtaskId: number): boolean {
    // Verify ownership
    const subtask = this.getById(userId, todoId, subtaskId);
    if (!subtask) return false;

    const stmt = db.prepare(`
      DELETE FROM subtasks 
      WHERE id = ? AND todo_id = ?
    `);
    const result = stmt.run(subtaskId, todoId);
    return result.changes > 0;
  },

  // Delete all subtasks for a todo (used when deleting a todo)
  deleteAllForTodo(userId: number, todoId: number): boolean {
    // Verify the todo belongs to the user
    const todo = todoDB.getById(userId, todoId);
    if (!todo) return false;

    const stmt = db.prepare(`DELETE FROM subtasks WHERE todo_id = ?`);
    const result = stmt.run(todoId);
    return result.changes > 0;
  },

  // Reorder subtasks
  reorder(userId: number, todoId: number, subtaskIds: number[]): void {
    // Verify the todo belongs to the user
    const todo = todoDB.getById(userId, todoId);
    if (!todo) throw new Error('Todo not found');

    const stmt = db.prepare(`
      UPDATE subtasks 
      SET position = ?, updated_at = ?
      WHERE id = ? AND todo_id = ?
    `);

    const now = getSingaporeNow().toISOString();
    subtaskIds.forEach((id, index) => {
      stmt.run(index, now, id, todoId);
    });
  },
};

// Helper function to calculate progress
export function calculateProgress(subtasks: import('./types').Subtask[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = subtasks.length;
  const completed = subtasks.filter(s => s.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}
