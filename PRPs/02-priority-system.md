# PRP-02: Priority System

**Feature**: Three-Level Priority Classification for Todos  
**Priority**: P0 (Core Feature)  
**Status**: Specification  
**Last Updated**: November 13, 2025  
**Depends On**: PRP-01 (Todo CRUD Operations)

---

## 📋 Feature Overview

The Priority System enables users to categorize their todos into three distinct priority levels: **High**, **Medium**, and **Low**. Each priority level is visually distinguished by color-coded badges (red for high, yellow for medium, blue for low), allowing users to quickly identify urgent tasks at a glance. The system automatically sorts todos by priority, ensuring high-priority items appear first, followed by medium and low priority tasks.

Users can filter the todo list to show only specific priority levels, helping them focus on what matters most. Priority can be set when creating a new todo or updated at any time through the edit interface.

### Key Capabilities
- **Three Priority Levels**: High, Medium, Low (with default being Medium)
- **Visual Indicators**: Color-coded badges for instant recognition
- **Automatic Sorting**: High → Medium → Low → No priority set
- **Priority Filtering**: Show only todos of selected priority levels
- **Inline Priority Selection**: Dropdown selector in create/edit forms
- **Priority Modification**: Change priority at any time without affecting other todo properties

### Business Value
- Helps users focus on urgent tasks first
- Reduces decision fatigue by pre-sorting tasks
- Improves task completion rates by 25-30% (industry benchmark)
- Enables better time management and productivity

---

## 👥 User Stories

### Primary User Persona: Busy Professional Managing Multiple Projects

**As a** project manager juggling multiple deadlines  
**I want to** mark certain todos as high priority  
**So that** I can quickly see which tasks need immediate attention

**As a** productivity-focused user  
**I want to** see my high-priority tasks at the top of my list  
**So that** I don't overlook critical work while scrolling through todos

**As a** detail-oriented individual  
**I want to** filter my todos by priority level  
**So that** I can focus exclusively on urgent tasks during peak productivity hours

**As a** user who plans ahead  
**I want to** assign priorities when creating new todos  
**So that** I can immediately categorize tasks by importance

**As a** user whose priorities change  
**I want to** easily update a todo's priority  
**So that** my list reflects my current needs without recreating tasks

**As a** visual thinker  
**I want to** see color-coded priority indicators  
**So that** I can instantly recognize task urgency without reading labels

---

## 🔄 User Flow

### Flow 1: Creating a Todo with Priority

1. User clicks "Add Todo" button
2. Todo creation form appears with:
   - Title input field (required)
   - Due date picker (optional)
   - **Priority dropdown** (defaults to "Medium")
3. User selects priority from dropdown: High / Medium / Low
4. User enters title and optionally sets due date
5. User clicks "Add" or presses Enter
6. **Optimistic Update**: Todo appears in list with colored priority badge
7. API request sent to server with priority field
8. On success: Todo confirmed with proper sorting
9. On failure: Todo removed, error shown

### Flow 2: Viewing Todos Sorted by Priority

1. User lands on main page with existing todos
2. App fetches todos from `/api/todos`
3. Todos automatically sorted by priority:
   - **High priority** (red badges) appear first
   - **Medium priority** (yellow badges) appear next
   - **Low priority** (blue badges) appear last
   - Todos without priority appear at the end
4. Within each priority level, todos sorted by creation date (newest first)

### Flow 3: Changing Todo Priority

1. User clicks "Edit" icon on a todo
2. Todo enters edit mode with inline editing
3. Priority dropdown shows current priority value
4. User selects new priority from dropdown
5. User clicks "Save" or presses Enter
6. **Optimistic Update**: 
   - Badge color changes immediately
   - Todo repositions in list according to new priority
7. API PUT request sent to `/api/todos/[id]`
8. On success: Position and priority confirmed
9. On failure: Todo reverts to original priority and position

### Flow 4: Filtering Todos by Priority

1. User sees priority filter buttons above todo list:
   - "All" (selected by default)
   - "High" with red indicator
   - "Medium" with yellow indicator
   - "Low" with blue indicator
2. User clicks "High" filter button
3. **Instant client-side filtering**: Only high-priority todos shown
4. Count badge shows number of filtered todos (e.g., "High (5)")
5. User clicks "All" to clear filter and see all todos again
6. Filter state persists during session (not across page refreshes)

### Flow 5: Bulk Priority Update (Future Enhancement Preview)

1. User selects multiple todos via checkboxes
2. Bulk actions toolbar appears with "Set Priority" dropdown
3. User selects new priority from dropdown
4. All selected todos update priority simultaneously
5. Todos reposition according to new priorities

**Note**: Flow 5 is out of scope for initial implementation but documented for future reference.

---

## 🛠️ Technical Requirements

### Database Schema Changes

**Table**: `todos` (modifications to existing table from PRP-01)

```sql
-- Add priority column to existing todos table
ALTER TABLE todos ADD COLUMN priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium';

-- Create index for efficient priority-based queries
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
```

**Migration Strategy**:
```typescript
// In lib/db.ts initialization
try {
  db.exec(`ALTER TABLE todos ADD COLUMN priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium'`);
} catch (error) {
  // Column already exists, ignore error
}

db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)`);
```

### TypeScript Types

**File**: `lib/db.ts`

```typescript
// Priority enum
export type Priority = 'high' | 'medium' | 'low';

// Updated Todo interface
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;  // NEW: Required field with default
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Updated CreateTodoInput
export interface CreateTodoInput {
  title: string;
  priority?: Priority;  // NEW: Optional, defaults to 'medium'
  due_date?: string | null;
}

// Updated UpdateTodoInput
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  priority?: Priority;  // NEW: Allow priority updates
  due_date?: string | null;
}

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
```

### Database Operations Updates

**File**: `lib/db.ts`

```typescript
export const todoDB = {
  // Updated create method
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

  // Updated getAll method with priority sorting
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

  // Filter by priority
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

  // Updated update method (includes priority field handling)
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

  // Existing methods (getById, delete) remain unchanged
};
```

### API Endpoints Updates

#### POST `/api/todos` - Create Todo (Updated)

**Request Body**:
```typescript
{
  title: string;           // Required, 1-500 characters
  priority?: 'high' | 'medium' | 'low';  // NEW: Optional, defaults to 'medium'
  due_date?: string;       // Optional, ISO 8601 format
}
```

**Response** (201 Created):
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: false;
  priority: 'high' | 'medium' | 'low';  // NEW: Always present
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
```

**Implementation Changes** (`app/api/todos/route.ts`):

```typescript
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, priority, due_date } = body as CreateTodoInput;

    // Existing title validation...

    // NEW: Validate priority if provided
    if (priority !== undefined && !['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json({ 
        error: 'Priority must be one of: high, medium, low' 
      }, { status: 400 });
    }

    // Existing due_date validation...

    const todo = todoDB.create(session.userId, { 
      title: trimmedTitle, 
      priority,  // NEW: Pass priority
      due_date 
    });
    return NextResponse.json(todo, { status: 201 });

  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
```

#### PUT `/api/todos/[id]` - Update Todo (Updated)

**Request Body**:
```typescript
{
  title?: string;
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';  // NEW: Allow priority updates
  due_date?: string | null;
}
```

**Implementation Changes** (`app/api/todos/[id]/route.ts`):

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
    const { title, completed, priority, due_date } = body;

    // Existing validations...

    // NEW: Validate priority if provided
    if (priority !== undefined && !['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json({ 
        error: 'Priority must be one of: high, medium, low' 
      }, { status: 400 });
    }

    const updatedTodo = todoDB.update(session.userId, todoId, {
      title,
      completed,
      priority,  // NEW: Include priority
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

#### GET `/api/todos/priority-counts` - Get Priority Counts (NEW)

**Response** (200 OK):
```typescript
{
  high: number;
  medium: number;
  low: number;
}
```

**Implementation** (`app/api/todos/priority-counts/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const counts = todoDB.getCountByPriority(session.userId);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error('Error fetching priority counts:', error);
    return NextResponse.json({ error: 'Failed to fetch priority counts' }, { status: 500 });
  }
}
```

---

## 🎨 UI Components

### Priority Badge Component

**File**: `components/PriorityBadge.tsx`

```typescript
import { Priority, PRIORITY_CONFIG } from '@/lib/db';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
        border
      `}
    >
      {config.label}
    </span>
  );
}
```

### Priority Selector Component

**File**: `components/PrioritySelector.tsx`

```typescript
import { Priority, PRIORITY_CONFIG } from '@/lib/db';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}

export function PrioritySelector({ value, onChange, disabled = false }: PrioritySelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      disabled={disabled}
      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
        <option key={key} value={key}>
          {config.label}
        </option>
      ))}
    </select>
  );
}
```

### Priority Filter Buttons Component

**File**: `components/PriorityFilter.tsx`

```typescript
import { Priority, PRIORITY_CONFIG } from '@/lib/db';

interface PriorityFilterProps {
  selectedPriority: Priority | 'all';
  onFilterChange: (priority: Priority | 'all') => void;
  counts: Record<Priority, number>;
}

export function PriorityFilter({ selectedPriority, onFilterChange, counts }: PriorityFilterProps) {
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onFilterChange('all')}
        className={`
          px-4 py-2 rounded-lg font-medium transition
          ${selectedPriority === 'all' 
            ? 'bg-gray-800 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        All ({totalCount})
      </button>
      
      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
        const priority = key as Priority;
        const count = counts[priority];
        
        return (
          <button
            key={key}
            onClick={() => onFilterChange(priority)}
            className={`
              px-4 py-2 rounded-lg font-medium transition
              border-2
              ${selectedPriority === priority
                ? `${config.bgColor} ${config.textColor} ${config.borderColor}`
                : `bg-white ${config.textColor} border-gray-200 hover:${config.bgColor}`
              }
            `}
          >
            {config.label} ({count})
          </button>
        );
      })}
    </div>
  );
}
```

### Updated Main Todo Page

**File**: `app/page.tsx` (key additions)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Todo, Priority } from '@/lib/db';
import { PriorityBadge } from '@/components/PriorityBadge';
import { PrioritySelector } from '@/components/PrioritySelector';
import { PriorityFilter } from '@/components/PriorityFilter';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');  // NEW
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');  // NEW
  const [priorityCounts, setPriorityCounts] = useState({ high: 0, medium: 0, low: 0 });  // NEW
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPriority, setEditPriority] = useState<Priority>('medium');  // NEW
  // ... existing state

  useEffect(() => {
    fetchTodos();
    fetchPriorityCounts();  // NEW
  }, []);

  const fetchPriorityCounts = async () => {
    try {
      const response = await fetch('/api/todos/priority-counts');
      if (!response.ok) throw new Error('Failed to fetch counts');
      const data = await response.json();
      setPriorityCounts(data);
    } catch (err) {
      console.error('Error fetching priority counts:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const optimisticTodo: Todo = {
      id: Date.now(),
      user_id: 0,
      title: newTitle.trim(),
      completed: false,
      priority: newPriority,  // NEW
      due_date: newDueDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update with proper sorting
    setTodos([optimisticTodo, ...todos].sort(sortByPriority));  // NEW: Sort by priority
    setNewTitle('');
    setNewDueDate('');
    setNewPriority('medium');  // NEW: Reset to default

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: newPriority,  // NEW
          due_date: newDueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create todo');
      const createdTodo = await response.json();

      setTodos(todos => todos.map(t => t.id === optimisticTodo.id ? createdTodo : t));
      fetchPriorityCounts();  // NEW: Update counts
    } catch (err) {
      setTodos(todos => todos.filter(t => t.id !== optimisticTodo.id));
      setError('Failed to create todo');
      console.error(err);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date || '');
    setEditPriority(todo.priority);  // NEW
  };

  const handleSaveEdit = async (todo: Todo) => {
    if (!editTitle.trim()) return;

    const originalTodo = todo;

    setTodos(todos => 
      todos.map(t =>
        t.id === todo.id 
          ? { ...t, title: editTitle.trim(), due_date: editDueDate || null, priority: editPriority }  // NEW: Include priority
          : t
      ).sort(sortByPriority)  // NEW: Re-sort after edit
    );
    setEditingId(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          priority: editPriority,  // NEW
          due_date: editDueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos => todos.map(t => t.id === todo.id ? updatedTodo : t).sort(sortByPriority));
      fetchPriorityCounts();  // NEW: Update counts
    } catch (err) {
      setTodos(todos => todos.map(t => t.id === todo.id ? originalTodo : t));
      setEditingId(todo.id);
      setError('Failed to update todo');
      console.error(err);
    }
  };

  // NEW: Sorting function
  const sortByPriority = (a: Todo, b: Todo) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Same priority: sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  // NEW: Filter todos by priority
  const filteredTodos = priorityFilter === 'all' 
    ? todos 
    : todos.filter(t => t.priority === priorityFilter);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Todos</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* NEW: Priority Filter */}
      <PriorityFilter
        selectedPriority={priorityFilter}
        onFilterChange={setPriorityFilter}
        counts={priorityCounts}
      />

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
        {/* NEW: Priority Selector */}
        <PrioritySelector
          value={newPriority}
          onChange={setNewPriority}
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
        {filteredTodos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {priorityFilter === 'all' 
              ? 'No todos yet. Create one above!' 
              : `No ${priorityFilter} priority todos.`
            }
          </p>
        ) : (
          filteredTodos.map(todo => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo)}
                className="w-5 h-5 cursor-pointer"
              />

              {editingId === todo.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={500}
                  />
                  {/* NEW: Priority Selector in Edit Mode */}
                  <PrioritySelector
                    value={editPriority}
                    onChange={setEditPriority}
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
                    <div className="flex items-center gap-2">
                      {/* NEW: Priority Badge */}
                      <PriorityBadge priority={todo.priority} />
                      <p className={`${todo.completed ? 'line-through text-gray-400' : ''}`}>
                        {todo.title}
                      </p>
                    </div>
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

### 1. Invalid Priority Value from Client
**Scenario**: Malicious or buggy client sends priority value other than 'high', 'medium', 'low'  
**Handling**:
- Server validation rejects with 400 error: "Priority must be one of: high, medium, low"
- Database CHECK constraint provides second layer of protection
- Client dropdown prevents invalid selection in normal use

### 2. Missing Priority During Migration
**Scenario**: Existing todos created before priority feature lack priority field  
**Handling**:
- Database migration sets `DEFAULT 'medium'` on column
- All existing todos automatically assigned 'medium' priority
- No null/undefined values possible

### 3. Priority Change Affecting Sort Order
**Scenario**: User changes todo from 'low' to 'high' while viewing filtered list  
**Handling**:
- Todo immediately repositions to top of list (optimistic update)
- If filter is active and new priority doesn't match filter, todo disappears
- Priority counts update to reflect change
- User sees smooth transition with no page refresh

### 4. Concurrent Priority Edits
**Scenario**: User edits same todo's priority in two browser tabs  
**Handling**:
- Last write wins (consistent with other todo updates)
- Both tabs re-fetch on save, eventually showing same priority
- No data corruption due to atomic database updates

### 5. Filtering Edge Cases
**Scenario**: User filters by 'high' priority but no high-priority todos exist  
**Handling**:
- Show empty state: "No high priority todos."
- Filter button shows count of 0: "High (0)"
- User can still create new high-priority todos
- Filter persists during session

### 6. Priority Display During Optimistic Update Failure
**Scenario**: Priority update fails due to network error after optimistic UI change  
**Handling**:
- Todo reverts to original priority
- Badge color changes back immediately
- Todo repositions to original location in sorted list
- Error message shown: "Failed to update todo"

### 7. Sort Stability Within Priority Levels
**Scenario**: Multiple todos with same priority  
**Handling**:
- Secondary sort by `created_at DESC` (newest first)
- Consistent ordering across page refreshes
- Position doesn't change unless priority or creation date differs

### 8. Priority Badge Accessibility
**Scenario**: Color-blind users cannot distinguish priority badges by color alone  
**Handling**:
- Badge includes text label (High/Medium/Low)
- ARIA labels on interactive elements
- Keyboard navigation support for priority selector
- Future: Consider icons in addition to colors

### 9. Priority Counts Out of Sync
**Scenario**: Counts in filter buttons don't match actual todo counts  
**Handling**:
- Counts refresh after create/update/delete operations
- Counts query only includes incomplete todos (completed todos excluded)
- If discrepancy occurs, counts refresh on next page load
- Consider debounced count refresh for heavy usage

### 10. Default Priority Selection
**Scenario**: User wants different default priority than 'medium'  
**Handling**:
- Out of scope for this PRP (user preferences in future)
- Current implementation always defaults to 'medium'
- Last selected priority doesn't persist across page refreshes
- Reset to 'medium' after creating todo

---

## ✅ Acceptance Criteria

### Functional Requirements

1. **Priority Assignment**
   - [ ] User can select priority when creating a new todo
   - [ ] Priority defaults to 'medium' if not specified
   - [ ] Priority selector shows three options: High, Medium, Low
   - [ ] Selected priority is saved to database correctly

2. **Priority Display**
   - [ ] Each todo displays a color-coded priority badge
   - [ ] High priority shows red badge with "High" label
   - [ ] Medium priority shows yellow badge with "Medium" label
   - [ ] Low priority shows blue badge with "Low" label
   - [ ] Badge appears next to todo title in list view

3. **Priority Editing**
   - [ ] User can change priority in edit mode
   - [ ] Priority selector shows current priority value
   - [ ] Changing priority triggers re-sort of todo list
   - [ ] Priority change persists after save

4. **Automatic Sorting**
   - [ ] Todos automatically sorted by priority: High → Medium → Low
   - [ ] Within same priority, sorted by creation date (newest first)
   - [ ] Sort order maintained across page refreshes
   - [ ] Sort order updates immediately after priority changes

5. **Priority Filtering**
   - [ ] Filter buttons shown for All, High, Medium, Low
   - [ ] Filter buttons display count of todos for each priority
   - [ ] Clicking filter button shows only matching todos
   - [ ] "All" filter shows all todos regardless of priority
   - [ ] Filter selection persists during current session
   - [ ] Filter resets to "All" on page refresh

### Non-Functional Requirements

6. **Visual Design**
   - [ ] Priority badges use consistent color scheme across app
   - [ ] Badge colors have sufficient contrast for accessibility (WCAG AA)
   - [ ] Priority selector styled consistently with other form controls
   - [ ] Filter buttons have clear active/inactive states

7. **Performance**
   - [ ] Priority-based sorting completes in < 50ms for 1000 todos
   - [ ] Filter application is instant (client-side filtering)
   - [ ] No visible lag when changing priority in edit mode
   - [ ] Priority counts query completes in < 100ms

8. **Data Integrity**
   - [ ] Database CHECK constraint prevents invalid priority values
   - [ ] Existing todos migrated with default 'medium' priority
   - [ ] Priority field is non-nullable in database
   - [ ] API validation rejects invalid priority values

9. **Backward Compatibility**
   - [ ] Database migration runs without errors
   - [ ] Existing todo CRUD operations continue to work
   - [ ] API endpoints remain backward compatible
   - [ ] No breaking changes to existing tests

10. **Error Handling**
    - [ ] Invalid priority values return clear error messages
    - [ ] Failed priority updates rollback optimistic changes
    - [ ] Network errors don't corrupt local todo state
    - [ ] Priority count fetch failures don't crash UI

---

## 🧪 Testing Requirements

### E2E Tests (Playwright)

**File**: `tests/03-priority-system.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Priority System', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.registerAndLogin();
  });

  test('should create todo with default medium priority', async ({ page }) => {
    await helper.createTodo('Default priority todo');
    
    const badge = page.locator('text=Default priority todo').locator('..').locator('[class*="bg-yellow"]');
    await expect(badge).toContainText('Medium');
  });

  test('should create todo with high priority', async ({ page }) => {
    await page.fill('input[placeholder*="What needs to be done"]', 'Urgent task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    
    const badge = page.locator('text=Urgent task').locator('..').locator('[class*="bg-red"]');
    await expect(badge).toContainText('High');
  });

  test('should create todo with low priority', async ({ page }) => {
    await page.fill('input[placeholder*="What needs to be done"]', 'Low priority task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');
    
    const badge = page.locator('text=Low priority task').locator('..').locator('[class*="bg-blue"]');
    await expect(badge).toContainText('Low');
  });

  test('should display correct priority badge colors', async ({ page }) => {
    await helper.createTodoWithPriority('High priority', 'high');
    await helper.createTodoWithPriority('Medium priority', 'medium');
    await helper.createTodoWithPriority('Low priority', 'low');
    
    await expect(page.locator('text=High priority').locator('..').locator('[class*="bg-red"]')).toBeVisible();
    await expect(page.locator('text=Medium priority').locator('..').locator('[class*="bg-yellow"]')).toBeVisible();
    await expect(page.locator('text=Low priority').locator('..').locator('[class*="bg-blue"]')).toBeVisible();
  });

  test('should sort todos by priority automatically', async ({ page }) => {
    await helper.createTodoWithPriority('Low task', 'low');
    await helper.createTodoWithPriority('High task', 'high');
    await helper.createTodoWithPriority('Medium task', 'medium');
    
    const todos = page.locator('[class*="bg-white border rounded-lg"]');
    await expect(todos.nth(0)).toContainText('High task');
    await expect(todos.nth(1)).toContainText('Medium task');
    await expect(todos.nth(2)).toContainText('Low task');
  });

  test('should maintain sort order within same priority', async ({ page }) => {
    await helper.createTodoWithPriority('High 1', 'high');
    await page.waitForTimeout(100);
    await helper.createTodoWithPriority('High 2', 'high');
    await page.waitForTimeout(100);
    await helper.createTodoWithPriority('High 3', 'high');
    
    const todos = page.locator('[class*="bg-white border rounded-lg"]');
    await expect(todos.nth(0)).toContainText('High 3'); // Newest first
    await expect(todos.nth(1)).toContainText('High 2');
    await expect(todos.nth(2)).toContainText('High 1');
  });

  test('should change priority in edit mode', async ({ page }) => {
    await helper.createTodoWithPriority('Change priority', 'low');
    
    await page.click('button:has-text("Edit")');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Save")');
    
    const badge = page.locator('text=Change priority').locator('..').locator('[class*="bg-red"]');
    await expect(badge).toContainText('High');
  });

  test('should re-sort after priority change', async ({ page }) => {
    await helper.createTodoWithPriority('Task 1', 'high');
    await helper.createTodoWithPriority('Task 2', 'low');
    
    // Change Task 2 from low to high
    await page.locator('text=Task 2').locator('..').locator('button:has-text("Edit")').click();
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Save")');
    
    // Both should now be at top (high priority)
    const todos = page.locator('[class*="bg-white border rounded-lg"]');
    await expect(todos.nth(0)).toContainText('Task 2'); // Newer
    await expect(todos.nth(1)).toContainText('Task 1');
  });

  test('should filter by high priority', async ({ page }) => {
    await helper.createTodoWithPriority('High task', 'high');
    await helper.createTodoWithPriority('Medium task', 'medium');
    await helper.createTodoWithPriority('Low task', 'low');
    
    await page.click('button:has-text("High")');
    
    await expect(page.locator('text=High task')).toBeVisible();
    await expect(page.locator('text=Medium task')).not.toBeVisible();
    await expect(page.locator('text=Low task')).not.toBeVisible();
  });

  test('should filter by medium priority', async ({ page }) => {
    await helper.createTodoWithPriority('High task', 'high');
    await helper.createTodoWithPriority('Medium task', 'medium');
    await helper.createTodoWithPriority('Low task', 'low');
    
    await page.click('button:has-text("Medium")');
    
    await expect(page.locator('text=High task')).not.toBeVisible();
    await expect(page.locator('text=Medium task')).toBeVisible();
    await expect(page.locator('text=Low task')).not.toBeVisible();
  });

  test('should filter by low priority', async ({ page }) => {
    await helper.createTodoWithPriority('High task', 'high');
    await helper.createTodoWithPriority('Medium task', 'medium');
    await helper.createTodoWithPriority('Low task', 'low');
    
    await page.click('button:has-text("Low")');
    
    await expect(page.locator('text=High task')).not.toBeVisible();
    await expect(page.locator('text=Medium task')).not.toBeVisible();
    await expect(page.locator('text=Low task')).toBeVisible();
  });

  test('should show all todos with "All" filter', async ({ page }) => {
    await helper.createTodoWithPriority('High task', 'high');
    await helper.createTodoWithPriority('Medium task', 'medium');
    await helper.createTodoWithPriority('Low task', 'low');
    
    await page.click('button:has-text("Low")'); // First filter by low
    await page.click('button:has-text("All")'); // Then show all
    
    await expect(page.locator('text=High task')).toBeVisible();
    await expect(page.locator('text=Medium task')).toBeVisible();
    await expect(page.locator('text=Low task')).toBeVisible();
  });

  test('should display correct priority counts', async ({ page }) => {
    await helper.createTodoWithPriority('High 1', 'high');
    await helper.createTodoWithPriority('High 2', 'high');
    await helper.createTodoWithPriority('Medium 1', 'medium');
    await helper.createTodoWithPriority('Low 1', 'low');
    await helper.createTodoWithPriority('Low 2', 'low');
    await helper.createTodoWithPriority('Low 3', 'low');
    
    await expect(page.locator('button:has-text("High (2)")')).toBeVisible();
    await expect(page.locator('button:has-text("Medium (1)")')).toBeVisible();
    await expect(page.locator('button:has-text("Low (3)")')).toBeVisible();
  });

  test('should update counts after todo creation', async ({ page }) => {
    await expect(page.locator('button:has-text("High (0)")')).toBeVisible();
    
    await helper.createTodoWithPriority('High task', 'high');
    
    await expect(page.locator('button:has-text("High (1)")')).toBeVisible();
  });

  test('should update counts after priority change', async ({ page }) => {
    await helper.createTodoWithPriority('Task', 'low');
    await expect(page.locator('button:has-text("Low (1)")')).toBeVisible();
    
    await page.click('button:has-text("Edit")');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('button:has-text("High (1)")')).toBeVisible();
    await expect(page.locator('button:has-text("Low (0)")')).toBeVisible();
  });

  test('should persist priority across page refresh', async ({ page }) => {
    await helper.createTodoWithPriority('Persistent high', 'high');
    
    await page.reload();
    
    const badge = page.locator('text=Persistent high').locator('..').locator('[class*="bg-red"]');
    await expect(badge).toContainText('High');
  });

  test('should show empty state for filtered priority with no todos', async ({ page }) => {
    await page.click('button:has-text("High")');
    
    await expect(page.locator('text=No high priority todos')).toBeVisible();
  });

  test('should handle priority change with optimistic rollback on error', async ({ page }) => {
    // This test would require mocking API failure
    // Implementation depends on testing strategy for network errors
  });
});
```

### Helper Methods Update

**File**: `tests/helpers.ts` (additions)

```typescript
export class TestHelper {
  // Existing methods...

  async createTodoWithPriority(title: string, priority: 'high' | 'medium' | 'low') {
    await this.page.fill('input[placeholder*="What needs to be done"]', title);
    await this.page.selectOption('select', priority);
    await this.page.click('button:has-text("Add")');
    await this.page.waitForSelector(`text=${title}`);
  }
}
```

### Unit Tests (Optional)

**File**: `lib/__tests__/priority.test.ts`

```typescript
import { todoDB, Priority } from '../db';

describe('Priority System', () => {
  const TEST_USER_ID = 1;

  beforeEach(() => {
    db.exec('DELETE FROM todos');
  });

  test('should create todo with specified priority', () => {
    const todo = todoDB.create(TEST_USER_ID, { 
      title: 'Test', 
      priority: 'high' 
    });
    expect(todo.priority).toBe('high');
  });

  test('should default to medium priority when not specified', () => {
    const todo = todoDB.create(TEST_USER_ID, { title: 'Test' });
    expect(todo.priority).toBe('medium');
  });

  test('should sort todos by priority correctly', () => {
    todoDB.create(TEST_USER_ID, { title: 'Low', priority: 'low' });
    todoDB.create(TEST_USER_ID, { title: 'High', priority: 'high' });
    todoDB.create(TEST_USER_ID, { title: 'Medium', priority: 'medium' });

    const todos = todoDB.getAll(TEST_USER_ID);
    expect(todos.map(t => t.priority)).toEqual(['high', 'medium', 'low']);
  });

  test('should filter todos by priority', () => {
    todoDB.create(TEST_USER_ID, { title: 'High 1', priority: 'high' });
    todoDB.create(TEST_USER_ID, { title: 'High 2', priority: 'high' });
    todoDB.create(TEST_USER_ID, { title: 'Low', priority: 'low' });

    const highPriority = todoDB.getByPriority(TEST_USER_ID, 'high');
    expect(highPriority).toHaveLength(2);
    expect(highPriority.every(t => t.priority === 'high')).toBe(true);
  });

  test('should return correct priority counts', () => {
    todoDB.create(TEST_USER_ID, { title: 'High', priority: 'high' });
    todoDB.create(TEST_USER_ID, { title: 'Medium 1', priority: 'medium' });
    todoDB.create(TEST_USER_ID, { title: 'Medium 2', priority: 'medium' });

    const counts = todoDB.getCountByPriority(TEST_USER_ID);
    expect(counts).toEqual({ high: 1, medium: 2, low: 0 });
  });

  test('should update priority', () => {
    const todo = todoDB.create(TEST_USER_ID, { title: 'Test', priority: 'low' });
    const updated = todoDB.update(TEST_USER_ID, todo.id, { priority: 'high' });
    
    expect(updated?.priority).toBe('high');
  });
});
```

---

## 🚫 Out of Scope

The following features are **explicitly excluded** from this PRP:

1. **Custom Priority Levels** - Only three predefined levels (no user-defined priorities)
2. **Priority Icons** - Text labels only (no visual icons like flags or stars)
3. **Bulk Priority Updates** - Changing priority for multiple todos at once
4. **Priority-Based Notifications** - Different notification timing based on priority
5. **User-Configurable Colors** - Fixed color scheme (no customization)
6. **Priority History** - No tracking of priority changes over time
7. **Default Priority Preferences** - Always defaults to 'medium' (no user setting)
8. **Priority-Based Deadlines** - No automatic due date suggestions based on priority
9. **Smart Priority Suggestions** - No AI/ML-based priority recommendations
10. **Priority Statistics** - No analytics on priority distribution or completion rates
11. **Keyboard Shortcuts** - No keyboard shortcuts for priority selection
12. **Drag-and-Drop Priority** - No drag-to-reorder for manual priority override
13. **Priority Templates** - Templates (PRP-07) will include priority, but no priority-specific templates
14. **Priority in Calendar View** - Calendar (PRP-10) will show priority, but covered in that PRP
15. **Mobile Gestures** - No swipe-to-change-priority on mobile (web only)

---

## 📊 Success Metrics

### User Engagement Metrics

1. **Priority Usage Rate**
   - Target: 70% of todos have explicitly set priority (not just default medium)
   - Measure: Todos with non-default priority / Total todos

2. **High-Priority Completion Rate**
   - Target: 85% of high-priority todos completed within 7 days
   - Measure: Completed high-priority todos / Total high-priority todos

3. **Filter Usage**
   - Target: 40% of active users use priority filters weekly
   - Measure: Users who clicked filter button / Total active users

### Performance Metrics

4. **Sort Performance**
   - Target: Priority-based sort completes in < 50ms for 1000 todos
   - Measure: SQL query execution time

5. **Filter Response Time**
   - Target: Instant (< 16ms for 60fps)
   - Measure: Client-side filter function execution time

6. **Count Query Performance**
   - Target: Priority count endpoint responds in < 100ms
   - Measure: API response time

### User Experience Metrics

7. **Visual Clarity**
   - Target: 95% of users can identify priority at a glance (user testing)
   - Measure: User testing success rate

8. **Edit Efficiency**
   - Target: Change priority in < 2 seconds
   - Measure: Time from clicking edit to saving priority change

9. **Color Accessibility**
   - Target: WCAG AA contrast ratio (4.5:1 minimum)
   - Measure: Automated accessibility audit

### Data Quality Metrics

10. **Migration Success**
    - Target: 100% of existing todos assigned default priority
    - Measure: Todos with NULL priority after migration

11. **Validation Success**
    - Target: 0 invalid priority values in database
    - Measure: Database integrity check

12. **Consistency**
    - Target: Priority and sort order match 100% of the time
    - Measure: Frontend sort order vs database query results

### Behavioral Metrics (Post-Launch)

13. **Priority Distribution**
    - Expected: 20% high, 50% medium, 30% low (natural distribution)
    - Measure: Priority distribution across all todos

14. **Priority Change Frequency**
    - Target: < 15% of todos have priority changed after creation
    - Measure: Todos with updated priority / Total todos

15. **Completion Rate by Priority**
    - Hypothesis: High > Medium > Low completion rates
    - Measure: Completion percentage for each priority level

---

## 📝 Implementation Notes

### Database Migration Steps

1. Add priority column with default value
2. Create index on priority column
3. Verify all existing todos have 'medium' priority
4. Test priority-based queries performance
5. Deploy migration in production with rollback plan

### Color Scheme Rationale

- **Red (High)**: Universal indicator of urgency and importance
- **Yellow (Medium)**: Warning/attention color, moderate urgency
- **Blue (Low)**: Calm color, low stress, can wait

### Performance Considerations

- Priority filtering done client-side for instant response
- Server-side sorting via SQL for consistency
- Priority counts cached on client, refreshed after mutations
- Consider memoization for sort function if performance issues arise

### Accessibility Considerations

- Text labels on all badges (not color alone)
- ARIA labels on filter buttons
- Keyboard navigation for priority selector
- Screen reader announcements for priority changes

### Next Steps After Implementation

1. Run full E2E test suite
2. Perform accessibility audit with axe DevTools
3. Load test with 10,000+ todos
4. Gather user feedback on color choices
5. Monitor priority distribution metrics
6. Proceed to PRP-03 (Recurring Todos)

---

## 🔗 Related PRPs

- **PRP-01: Todo CRUD Operations** - Foundation (required)
- **PRP-03: Recurring Todos** - Recurring instances inherit priority
- **PRP-04: Reminders & Notifications** - Could use priority for notification timing (future)
- **PRP-07: Template System** - Templates save priority along with other fields
- **PRP-08: Search & Filtering** - Priority filtering complements search
- **PRP-09: Export & Import** - Priority included in export data
- **PRP-10: Calendar View** - Calendar displays priority badges

---

**Document Version**: 1.0  
**Author**: Senior Product Engineer  
**Review Status**: Ready for Implementation  
**Estimated Implementation Time**: 6-8 hours for experienced Next.js developer
