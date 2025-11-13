# PRP-01: Todo CRUD Operations

**Feature**: Core Todo Create, Read, Update, Delete Operations  
**Priority**: P0 (Foundation)  
**Status**: Specification  
**Last Updated**: November 13, 2025

---

## 📋 Feature Overview

The Todo CRUD Operations feature provides the foundational data management layer for the todo application. Users can create new todos with titles and optional due dates, view all their todos in a list, edit existing todos, and delete completed or unwanted items. All operations must respect Singapore timezone (`Asia/Singapore`) for date/time handling, implement proper validation rules, and provide optimistic UI updates for a responsive user experience.

This feature serves as the base upon which all other todo features (priority, recurrence, subtasks, tags) will be built.

### Key Capabilities
- **Create**: Add new todos with title (required) and due date (optional)
- **Read**: Display all todos for the authenticated user
- **Update**: Modify todo title, due date, and completion status
- **Delete**: Remove todos permanently with confirmation
- **Timezone**: All dates use Singapore timezone consistently
- **Validation**: Client and server-side validation for data integrity
- **Optimistic Updates**: Immediate UI feedback before server confirmation

---

## 👥 User Stories

### Primary User Persona: Busy Professional in Singapore

**As a** busy professional working in Singapore  
**I want to** quickly capture tasks as they come to mind  
**So that** I don't forget important work and personal commitments

**As a** task-oriented user  
**I want to** see all my todos in one place  
**So that** I have a clear overview of what needs to be done

**As a** productive individual  
**I want to** mark todos as complete when finished  
**So that** I can track my progress and stay motivated

**As a** user who changes plans  
**I want to** edit or delete todos  
**So that** my todo list reflects my current priorities

**As a** Singapore-based user  
**I want to** all dates and times to match my local timezone  
**So that** due dates are accurate and not confusing

---

## 🔄 User Flow

### Flow 1: Creating a New Todo

1. User clicks "Add Todo" button
2. Input field appears with focus on title field
3. User types todo title (required)
4. User optionally selects due date using date picker
5. User presses Enter or clicks "Save" button
6. **Optimistic Update**: Todo appears immediately in the list (grayed out)
7. API request sent to server
8. On success: Todo updates with full styling and ID
9. On failure: Todo removed from list, error message displayed

### Flow 2: Viewing Todos

1. User lands on main page (already authenticated)
2. App fetches todos from `/api/todos` endpoint
3. Todos displayed in list format, sorted by creation date (newest first)
4. Each todo shows: title, due date (if set), completion status

### Flow 3: Completing/Uncompleting a Todo

1. User clicks checkbox next to todo
2. **Optimistic Update**: Checkbox toggles immediately, todo styling updates
3. API PATCH request sent to `/api/todos/[id]`
4. On success: State confirmed
5. On failure: Checkbox reverts, error message displayed

### Flow 4: Editing a Todo

1. User clicks "Edit" icon on todo item
2. Todo switches to edit mode (inline editing)
3. Title becomes editable input field
4. Due date becomes editable date picker
5. User modifies title and/or due date
6. User clicks "Save" or presses Enter
7. **Optimistic Update**: Changes appear immediately
8. API PUT request sent to `/api/todos/[id]`
9. On success: State confirmed
10. On failure: Changes reverted, error message displayed

### Flow 5: Deleting a Todo

1. User clicks "Delete" icon on todo item
2. Confirmation dialog appears: "Are you sure you want to delete this todo?"
3. User confirms deletion
4. **Optimistic Update**: Todo removed from list immediately
5. API DELETE request sent to `/api/todos/[id]`
6. On success: Deletion confirmed
7. On failure: Todo restored to list, error message displayed

---

## 🛠️ Technical Requirements

### Database Schema

**Table**: `todos`

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL CHECK(length(title) >= 1 AND length(title) <= 500),
  completed BOOLEAN NOT NULL DEFAULT 0,
  due_date TEXT,  -- ISO 8601 format in Singapore timezone
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
```

**Note**: In the full implementation, this table will have additional columns for priority, recurrence, etc. This PRP focuses on the core columns only.

### TypeScript Types

**File**: `lib/db.ts`

```typescript
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null; // ISO 8601 string in Singapore timezone
  created_at: string;
  updated_at: string;
}

export interface CreateTodoInput {
  title: string;
  due_date?: string | null; // Optional, ISO 8601 string
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  due_date?: string | null;
}
```

### Database Operations

**File**: `lib/db.ts`

```typescript
export const todoDB = {
  // Create a new todo
  create(userId: number, input: CreateTodoInput): Todo {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const now = getSingaporeNow().toISOString();
    const result = stmt.run(
      userId,
      input.title.trim(),
      input.due_date || null,
      now,
      now
    );
    
    return this.getById(userId, result.lastInsertRowid as number)!;
  },

  // Get all todos for a user
  getAll(userId: number): Todo[] {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(userId) as Todo[];
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
```

### API Endpoints

#### POST `/api/todos` - Create Todo

**Request Body**:
```typescript
{
  title: string;        // Required, 1-500 characters
  due_date?: string;    // Optional, ISO 8601 format
}
```

**Response** (201 Created):
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: false;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input (missing title, title too long, invalid date format)
- `401 Unauthorized`: No valid session
- `500 Internal Server Error`: Database error

**Implementation** (`app/api/todos/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, CreateTodoInput } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, due_date } = body as CreateTodoInput;

    // Validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (trimmedTitle.length > 500) {
      return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
    }

    // Validate due_date if provided
    if (due_date !== undefined && due_date !== null) {
      const date = new Date(due_date);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
      }
    }

    const todo = todoDB.create(session.userId, { title: trimmedTitle, due_date });
    return NextResponse.json(todo, { status: 201 });

  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
```

#### GET `/api/todos` - Get All Todos

**Response** (200 OK):
```typescript
[
  {
    id: number;
    user_id: number;
    title: string;
    completed: boolean;
    due_date: string | null;
    created_at: string;
    updated_at: string;
  },
  // ... more todos
]
```

**Error Responses**:
- `401 Unauthorized`: No valid session
- `500 Internal Server Error`: Database error

**Implementation** (`app/api/todos/route.ts`):

```typescript
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const todos = todoDB.getAll(session.userId);
    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}
```

#### GET `/api/todos/[id]` - Get Single Todo

**Response** (200 OK):
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
```

**Error Responses**:
- `401 Unauthorized`: No valid session
- `404 Not Found`: Todo not found or doesn't belong to user
- `500 Internal Server Error`: Database error

**Implementation** (`app/api/todos/[id]/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const todo = todoDB.getById(session.userId, todoId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}
```

#### PUT `/api/todos/[id]` - Update Todo

**Request Body**:
```typescript
{
  title?: string;       // Optional, 1-500 characters
  completed?: boolean;  // Optional
  due_date?: string | null;  // Optional, ISO 8601 or null to clear
}
```

**Response** (200 OK):
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: No valid session
- `404 Not Found`: Todo not found
- `500 Internal Server Error`: Database error

**Implementation** (`app/api/todos/[id]/route.ts`):

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, completed, due_date } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return NextResponse.json({ error: 'Title must be a string' }, { status: 400 });
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (trimmedTitle.length > 500) {
        return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
      }
    }

    // Validate completed if provided
    if (completed !== undefined && typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Completed must be a boolean' }, { status: 400 });
    }

    // Validate due_date if provided
    if (due_date !== undefined && due_date !== null) {
      const date = new Date(due_date);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
      }
    }

    const updatedTodo = todoDB.update(session.userId, todoId, {
      title,
      completed,
      due_date,
    });

    if (!updatedTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTodo, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}
```

#### DELETE `/api/todos/[id]` - Delete Todo

**Response** (200 OK):
```typescript
{
  message: "Todo deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: No valid session
- `404 Not Found`: Todo not found
- `500 Internal Server Error`: Database error

**Implementation** (`app/api/todos/[id]/route.ts`):

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const success = todoDB.delete(session.userId, todoId);
    if (!success) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
```

### Timezone Utilities

**File**: `lib/timezone.ts`

```typescript
import { toZonedTime, format } from 'date-fns-tz';

const SINGAPORE_TZ = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return toZonedTime(new Date(), SINGAPORE_TZ);
}

/**
 * Convert any date to Singapore timezone
 */
export function toSingaporeTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, SINGAPORE_TZ);
}

/**
 * Format date in Singapore timezone
 */
export function formatSingaporeDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(toZonedTime(dateObj, SINGAPORE_TZ), formatStr, { timeZone: SINGAPORE_TZ });
}

/**
 * Parse date string and return ISO string in Singapore timezone
 */
export function parseSingaporeDate(dateStr: string): string {
  const date = new Date(dateStr);
  return toZonedTime(date, SINGAPORE_TZ).toISOString();
}
```

---

## 🎨 UI Components

### Main Todo Page Component

**File**: `app/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/lib/db';
import { formatSingaporeDate } from '@/lib/timezone';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const optimisticTodo: Todo = {
      id: Date.now(), // Temporary ID
      user_id: 0,
      title: newTitle.trim(),
      completed: false,
      due_date: newDueDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setTodos([optimisticTodo, ...todos]);
    setNewTitle('');
    setNewDueDate('');

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          due_date: newDueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create todo');
      const createdTodo = await response.json();

      // Replace optimistic todo with real one
      setTodos(todos => todos.map(t => t.id === optimisticTodo.id ? createdTodo : t));
    } catch (err) {
      // Rollback optimistic update
      setTodos(todos => todos.filter(t => t.id !== optimisticTodo.id));
      setError('Failed to create todo');
      console.error(err);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const newCompleted = !todo.completed;

    // Optimistic update
    setTodos(todos => todos.map(t =>
      t.id === todo.id ? { ...t, completed: newCompleted } : t
    ));

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });

      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos => todos.map(t => t.id === todo.id ? updatedTodo : t));
    } catch (err) {
      // Rollback optimistic update
      setTodos(todos => todos.map(t =>
        t.id === todo.id ? { ...t, completed: !newCompleted } : t
      ));
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date || '');
  };

  const handleSaveEdit = async (todo: Todo) => {
    if (!editTitle.trim()) return;

    const originalTodo = todo;

    // Optimistic update
    setTodos(todos => todos.map(t =>
      t.id === todo.id ? { ...t, title: editTitle.trim(), due_date: editDueDate || null } : t
    ));
    setEditingId(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          due_date: editDueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos => todos.map(t => t.id === todo.id ? updatedTodo : t));
    } catch (err) {
      // Rollback optimistic update
      setTodos(todos => todos.map(t => t.id === todo.id ? originalTodo : t));
      setEditingId(todo.id);
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    const originalTodos = [...todos];

    // Optimistic update
    setTodos(todos => todos.filter(t => t.id !== todo.id));

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete todo');
    } catch (err) {
      // Rollback optimistic update
      setTodos(originalTodos);
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading todos...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Todos</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Todo Form */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={!newTitle.trim()}
        >
          Add
        </button>
      </form>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No todos yet. Create one above!</p>
        ) : (
          todos.map(todo => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo)}
                className="w-5 h-5 cursor-pointer"
              />

              {/* Todo Content */}
              {editingId === todo.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={500}
                  />
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSaveEdit(todo)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className={`${todo.completed ? 'line-through text-gray-400' : ''}`}>
                      {todo.title}
                    </p>
                    {todo.due_date && (
                      <p className="text-sm text-gray-500">
                        Due: {formatSingaporeDate(todo.due_date, 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(todo)}
                    className="px-3 py-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(todo)}
                    className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## ⚠️ Edge Cases

### 1. Empty or Whitespace-Only Titles
**Scenario**: User submits a todo with only spaces or empty string  
**Handling**: 
- Client: Disable submit button when title is empty after trim
- Server: Return 400 error with message "Title cannot be empty"
- UI: Show validation error below input field

### 2. Extremely Long Titles
**Scenario**: User pastes or types a title exceeding 500 characters  
**Handling**:
- Client: Set `maxLength={500}` on input field
- Server: Validate and return 400 error if > 500 chars
- UI: Show character count when > 400 characters

### 3. Invalid Date Formats
**Scenario**: Malformed date string sent to API  
**Handling**:
- Server: Validate using `new Date(due_date)` and check `isNaN(date.getTime())`
- Return 400 error with message "Invalid due date format"
- Client: Use native date picker to prevent invalid input

### 4. Past Due Dates
**Scenario**: User selects a date in the past  
**Handling**:
- Allow past dates (user might be logging completed historical tasks)
- Visual indicator: Show past due dates in red text
- No server-side rejection

### 5. Concurrent Edits (Race Condition)
**Scenario**: User edits a todo in two browser tabs simultaneously  
**Handling**:
- Last write wins (no conflict resolution in this version)
- Use `updated_at` timestamp for future optimistic locking
- Consider websockets for real-time sync in future iterations

### 6. Network Failures During Optimistic Updates
**Scenario**: API call fails after optimistic UI update  
**Handling**:
- Store original state before optimistic update
- On error, rollback to original state
- Show error toast notification
- Allow user to retry operation

### 7. Deleted Todo While Editing
**Scenario**: User deletes a todo in one tab while editing it in another  
**Handling**:
- Server returns 404 on save attempt
- Client shows error: "This todo no longer exists"
- Remove from local state

### 8. Session Expiration
**Scenario**: User's session expires while using the app  
**Handling**:
- API returns 401 Unauthorized
- Client redirects to login page
- Preserve unsaved changes in localStorage (future enhancement)

### 9. Database Connection Loss
**Scenario**: SQLite database file is locked or inaccessible  
**Handling**:
- Return 500 error with generic message "Failed to [operation] todo"
- Log detailed error server-side
- Client shows retry option

### 10. Special Characters in Title
**Scenario**: User enters emojis, unicode, or special characters  
**Handling**:
- Allow all unicode characters (SQLite TEXT type supports it)
- No sanitization needed (not rendering as HTML)
- Preserve exact input

---

## ✅ Acceptance Criteria

### Functional Requirements

1. **Create Todo**
   - [ ] User can create a todo with only a title (no due date)
   - [ ] User can create a todo with title and due date
   - [ ] Title is required and must be 1-500 characters
   - [ ] Title is trimmed of leading/trailing whitespace
   - [ ] Due date is optional and stored in Singapore timezone
   - [ ] New todo appears at the top of the list
   - [ ] New todo is not completed by default

2. **Read Todos**
   - [ ] All todos for the authenticated user are displayed
   - [ ] Todos are sorted by creation date (newest first)
   - [ ] Each todo shows: title, completion status, due date (if set)
   - [ ] Empty state message shown when no todos exist

3. **Update Todo**
   - [ ] User can toggle todo completion status
   - [ ] User can edit todo title
   - [ ] User can edit todo due date
   - [ ] User can remove due date by clearing it
   - [ ] Completed todos show strikethrough styling
   - [ ] Changes persist across page refreshes

4. **Delete Todo**
   - [ ] User can delete a todo
   - [ ] Confirmation dialog appears before deletion
   - [ ] Todo is removed from list after deletion
   - [ ] Deletion is permanent (no undo in this version)

### Non-Functional Requirements

5. **Timezone Handling**
   - [ ] All dates use Singapore timezone (`Asia/Singapore`)
   - [ ] Date formatting shows Singapore local time
   - [ ] Due dates are stored in ISO 8601 format

6. **Validation**
   - [ ] Client-side validation prevents invalid submissions
   - [ ] Server-side validation rejects invalid data
   - [ ] Clear error messages for validation failures

7. **Optimistic Updates**
   - [ ] UI updates immediately on user action
   - [ ] Changes confirmed when server responds
   - [ ] Rollback occurs on server error
   - [ ] Loading states shown during network requests

8. **Error Handling**
   - [ ] Network errors show user-friendly messages
   - [ ] Server errors logged for debugging
   - [ ] UI remains functional after errors
   - [ ] Users can retry failed operations

9. **Performance**
   - [ ] Todo list renders in < 100ms for up to 1000 todos
   - [ ] API responses within 200ms for CRUD operations
   - [ ] No unnecessary re-renders

10. **Security**
    - [ ] All endpoints require authentication
    - [ ] Users can only access their own todos
    - [ ] SQL injection prevented via prepared statements
    - [ ] XSS prevented (no HTML rendering in titles)

---

## 🧪 Testing Requirements

### E2E Tests (Playwright)

**File**: `tests/02-todo-crud.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Todo CRUD Operations', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.registerAndLogin();
  });

  test('should create a todo with title only', async ({ page }) => {
    await helper.createTodo('Buy groceries');
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  test('should create a todo with title and due date', async ({ page }) => {
    await helper.createTodo('Finish report', '2025-12-31');
    await expect(page.locator('text=Finish report')).toBeVisible();
    await expect(page.locator('text=Due: Dec 31, 2025')).toBeVisible();
  });

  test('should not create todo with empty title', async ({ page }) => {
    await page.fill('input[placeholder*="What needs to be done"]', '   ');
    const addButton = page.locator('button:has-text("Add")');
    await expect(addButton).toBeDisabled();
  });

  test('should display all todos', async ({ page }) => {
    await helper.createTodo('Todo 1');
    await helper.createTodo('Todo 2');
    await helper.createTodo('Todo 3');

    await expect(page.locator('text=Todo 1')).toBeVisible();
    await expect(page.locator('text=Todo 2')).toBeVisible();
    await expect(page.locator('text=Todo 3')).toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    await helper.createTodo('Test todo');
    
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    
    await expect(page.locator('text=Test todo')).toHaveClass(/line-through/);
    
    await checkbox.uncheck();
    await expect(page.locator('text=Test todo')).not.toHaveClass(/line-through/);
  });

  test('should edit todo title', async ({ page }) => {
    await helper.createTodo('Original title');
    
    await page.locator('button:has-text("Edit")').first().click();
    await page.fill('input[value="Original title"]', 'Updated title');
    await page.locator('button:has-text("Save")').click();
    
    await expect(page.locator('text=Updated title')).toBeVisible();
    await expect(page.locator('text=Original title')).not.toBeVisible();
  });

  test('should edit todo due date', async ({ page }) => {
    await helper.createTodo('Task', '2025-12-01');
    
    await page.locator('button:has-text("Edit")').first().click();
    await page.fill('input[type="date"]', '2025-12-15');
    await page.locator('button:has-text("Save")').click();
    
    await expect(page.locator('text=Due: Dec 15, 2025')).toBeVisible();
  });

  test('should cancel edit', async ({ page }) => {
    await helper.createTodo('Original');
    
    await page.locator('button:has-text("Edit")').first().click();
    await page.fill('input[value="Original"]', 'Modified');
    await page.locator('button:has-text("Cancel")').click();
    
    await expect(page.locator('text=Original')).toBeVisible();
    await expect(page.locator('text=Modified')).not.toBeVisible();
  });

  test('should delete todo with confirmation', async ({ page }) => {
    await helper.createTodo('To be deleted');
    
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("Delete")').first().click();
    
    await expect(page.locator('text=To be deleted')).not.toBeVisible();
  });

  test('should not delete todo when canceling confirmation', async ({ page }) => {
    await helper.createTodo('To be kept');
    
    page.on('dialog', dialog => dialog.dismiss());
    await page.locator('button:has-text("Delete")').first().click();
    
    await expect(page.locator('text=To be kept')).toBeVisible();
  });

  test('should show empty state when no todos', async ({ page }) => {
    await expect(page.locator('text=No todos yet')).toBeVisible();
  });

  test('should persist todos across page refresh', async ({ page }) => {
    await helper.createTodo('Persistent todo');
    await page.reload();
    await expect(page.locator('text=Persistent todo')).toBeVisible();
  });

  test('should handle long titles', async ({ page }) => {
    const longTitle = 'A'.repeat(500);
    await helper.createTodo(longTitle);
    await expect(page.locator(`text=${longTitle}`)).toBeVisible();
  });

  test('should show error for titles exceeding 500 characters', async ({ page }) => {
    const tooLongTitle = 'A'.repeat(501);
    await page.fill('input[placeholder*="What needs to be done"]', tooLongTitle);
    
    // Input should truncate at 500 due to maxLength
    const inputValue = await page.inputValue('input[placeholder*="What needs to be done"]');
    expect(inputValue.length).toBe(500);
  });
});
```

### Unit Tests (Jest - Optional for Future)

**File**: `lib/__tests__/todoDB.test.ts`

```typescript
import { todoDB, CreateTodoInput } from '../db';
import { getSingaporeNow } from '../timezone';

describe('todoDB', () => {
  const TEST_USER_ID = 1;

  beforeEach(() => {
    // Clear todos table before each test
    db.exec('DELETE FROM todos');
  });

  describe('create', () => {
    it('should create a todo with title only', () => {
      const input: CreateTodoInput = { title: 'Test todo' };
      const todo = todoDB.create(TEST_USER_ID, input);

      expect(todo.title).toBe('Test todo');
      expect(todo.user_id).toBe(TEST_USER_ID);
      expect(todo.completed).toBe(false);
      expect(todo.due_date).toBeNull();
      expect(todo.id).toBeGreaterThan(0);
    });

    it('should create a todo with title and due date', () => {
      const dueDate = getSingaporeNow().toISOString();
      const input: CreateTodoInput = { title: 'Test todo', due_date: dueDate };
      const todo = todoDB.create(TEST_USER_ID, input);

      expect(todo.title).toBe('Test todo');
      expect(todo.due_date).toBe(dueDate);
    });

    it('should trim title whitespace', () => {
      const input: CreateTodoInput = { title: '  Trimmed  ' };
      const todo = todoDB.create(TEST_USER_ID, input);

      expect(todo.title).toBe('Trimmed');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no todos', () => {
      const todos = todoDB.getAll(TEST_USER_ID);
      expect(todos).toEqual([]);
    });

    it('should return todos in descending creation order', () => {
      todoDB.create(TEST_USER_ID, { title: 'First' });
      todoDB.create(TEST_USER_ID, { title: 'Second' });
      todoDB.create(TEST_USER_ID, { title: 'Third' });

      const todos = todoDB.getAll(TEST_USER_ID);
      expect(todos.map(t => t.title)).toEqual(['Third', 'Second', 'First']);
    });

    it('should only return todos for specified user', () => {
      todoDB.create(1, { title: 'User 1 todo' });
      todoDB.create(2, { title: 'User 2 todo' });

      const user1Todos = todoDB.getAll(1);
      expect(user1Todos).toHaveLength(1);
      expect(user1Todos[0].title).toBe('User 1 todo');
    });
  });

  describe('update', () => {
    it('should update todo title', () => {
      const todo = todoDB.create(TEST_USER_ID, { title: 'Original' });
      const updated = todoDB.update(TEST_USER_ID, todo.id, { title: 'Updated' });

      expect(updated?.title).toBe('Updated');
    });

    it('should update completion status', () => {
      const todo = todoDB.create(TEST_USER_ID, { title: 'Todo' });
      const updated = todoDB.update(TEST_USER_ID, todo.id, { completed: true });

      expect(updated?.completed).toBe(true);
    });

    it('should return undefined for non-existent todo', () => {
      const updated = todoDB.update(TEST_USER_ID, 99999, { title: 'Updated' });
      expect(updated).toBeUndefined();
    });

    it('should not update todo from different user', () => {
      const todo = todoDB.create(1, { title: 'User 1 todo' });
      const updated = todoDB.update(2, todo.id, { title: 'Hacked' });

      expect(updated).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete existing todo', () => {
      const todo = todoDB.create(TEST_USER_ID, { title: 'To delete' });
      const success = todoDB.delete(TEST_USER_ID, todo.id);

      expect(success).toBe(true);
      expect(todoDB.getById(TEST_USER_ID, todo.id)).toBeUndefined();
    });

    it('should return false for non-existent todo', () => {
      const success = todoDB.delete(TEST_USER_ID, 99999);
      expect(success).toBe(false);
    });

    it('should not delete todo from different user', () => {
      const todo = todoDB.create(1, { title: 'User 1 todo' });
      const success = todoDB.delete(2, todo.id);

      expect(success).toBe(false);
      expect(todoDB.getById(1, todo.id)).toBeDefined();
    });
  });
});
```

---

## 🚫 Out of Scope

The following features are **explicitly excluded** from this PRP and will be covered in separate PRPs:

1. **Priority System** (PRP-02) - High/Medium/Low priority levels
2. **Recurring Todos** (PRP-03) - Daily/weekly/monthly/yearly patterns
3. **Reminders & Notifications** (PRP-04) - Browser notifications before due dates
4. **Subtasks** (PRP-05) - Checklist items within todos
5. **Tags** (PRP-06) - Color-coded labels for categorization
6. **Templates** (PRP-07) - Reusable todo patterns
7. **Search & Filtering** (PRP-08) - Advanced filtering options
8. **Export/Import** (PRP-09) - Backup and restore functionality
9. **Calendar View** (PRP-10) - Monthly calendar display
10. **Authentication** (PRP-11) - Will use mock/bypass for initial development
11. **Undo/Redo** - Not planned for MVP
12. **Drag-and-Drop Reordering** - Not planned for MVP
13. **Collaborative Todos** - Single-user app only
14. **Mobile App** - Web-only for MVP
15. **Offline Mode** - Requires network connection

---

## 📊 Success Metrics

### User Experience Metrics

1. **Task Completion Time**
   - Target: Create a todo in < 3 seconds
   - Measure: Time from clicking "Add" to seeing todo in list

2. **Error Rate**
   - Target: < 1% of operations result in errors
   - Measure: Failed API calls / Total API calls

3. **Optimistic Update Success**
   - Target: 99%+ of optimistic updates confirmed by server
   - Measure: Rollbacks / Total optimistic updates

### Technical Performance Metrics

4. **API Response Time**
   - Target: p95 < 200ms for all CRUD operations
   - Measure: Server-side timing logs

5. **Time to Interactive (TTI)**
   - Target: < 2 seconds on 3G connection
   - Measure: Lighthouse performance score

6. **Database Query Performance**
   - Target: All queries < 50ms
   - Measure: SQLite execution time logs

### Reliability Metrics

7. **Uptime**
   - Target: 99.9% uptime
   - Measure: Server availability monitoring

8. **Data Consistency**
   - Target: 100% (no data loss)
   - Measure: Regular database integrity checks

9. **Session Stability**
   - Target: < 0.1% unexpected logouts
   - Measure: Session expiration logs vs expected expirations

### Adoption Metrics (Post-Launch)

10. **Daily Active Users**
    - Target: 80% of registered users active weekly
    - Measure: Unique users making ≥1 CRUD operation per week

11. **Average Todos Per User**
    - Target: 10-50 active todos per user
    - Measure: Median todo count across all users

12. **Feature Engagement**
    - Target: 60% of users use due dates
    - Measure: Todos with due_date set / Total todos

---

## 📝 Implementation Notes

### Database Migration

Add to `lib/db.ts` initialization:

```typescript
// Create todos table
db.exec(`
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
```

### Dependencies

Ensure these packages are installed:

```bash
npm install date-fns date-fns-tz
npm install -D @types/better-sqlite3
```

### Next Steps After Implementation

1. Test all CRUD operations manually
2. Run E2E test suite: `npx playwright test tests/02-todo-crud.spec.ts`
3. Verify Singapore timezone handling with different timezones
4. Load test with 1000+ todos
5. Proceed to PRP-02 (Priority System)

---

## 🔗 Related PRPs

- **PRP-02: Priority System** - Depends on todo CRUD foundation
- **PRP-03: Recurring Todos** - Extends update logic for recurrence
- **PRP-05: Subtasks** - Adds child entities to todos
- **PRP-06: Tags** - Many-to-many relationship with todos
- **PRP-11: Authentication** - Provides user sessions for authorization

---

**Document Version**: 1.0  
**Author**: Senior Product Engineer  
**Review Status**: Ready for Implementation  
**Estimated Implementation Time**: 8-12 hours for experienced Next.js developer
