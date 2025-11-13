import Database from 'better-sqlite3';
import { getSingaporeNow } from './timezone';
import type { 
  Priority,
  User,
  Authenticator,
  Todo,
  CreateTodoInput,
  UpdateTodoInput
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
    completed BOOLEAN NOT NULL DEFAULT 0,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
`);

// Add priority column to existing todos table (migration)
try {
  db.exec(`ALTER TABLE todos ADD COLUMN priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium'`);
} catch (error) {
  // Column already exists, ignore error
}

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
  UpdateTodoInput 
} from './types';

// ============================================================================
// Database Operations
// ============================================================================

export const todoDB = {
  // Create a new todo
  create(userId: number, input: CreateTodoInput): Todo {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, priority, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const now = getSingaporeNow().toISOString();
    const result = stmt.run(
      userId,
      input.title.trim(),
      input.priority || 'medium',  // Default to medium
      input.due_date || null,
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
      WHERE user_id = ? AND completed = 0
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
    if (input.completed !== undefined) {
      updates.push('completed = ?');
      values.push(input.completed ? 1 : 0);
    }
    if (input.priority !== undefined) {
      updates.push('priority = ?');
      values.push(input.priority);
    }
    if (input.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(input.due_date);
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
