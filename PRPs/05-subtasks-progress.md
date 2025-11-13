# PRP-05: Subtasks & Progress Tracking

## Feature Overview

The Subtasks & Progress Tracking feature enables users to break down complex todos into smaller, manageable checklist items with real-time visual progress indicators. Each todo can have unlimited subtasks that maintain their display order through position management. The system provides automatic progress calculation, visual progress bars, and cascade deletion to maintain data integrity. All subtask operations are optimized with immediate UI updates and proper error handling.

**Core Capabilities:**
- Create unlimited subtasks for any todo
- Toggle subtask completion with checkboxes
- Real-time progress bar showing completion percentage
- Text indicator displaying "X/Y subtasks" format
- Position-based ordering for consistent display
- Cascade deletion when parent todo is removed
- Expand/collapse subtask view for better organization
- Search functionality includes subtask titles
- Independent completion tracking (subtask ≠ parent todo)

## User Stories

### Primary Users

**User Persona 1: Maria - Project Manager**
- **Background**: Manages software development sprints with multiple deliverables
- **Goal**: Break down complex features into trackable sub-deliverables
- **Need**: "As a project manager, I want to create subtasks for each todo so that I can track granular progress on multi-step projects."

**User Persona 2: David - Personal Productivity Enthusiast**
- **Background**: Uses GTD methodology, likes detailed task breakdowns
- **Goal**: Organize shopping lists and errands with specific items
- **Need**: "As a GTD practitioner, I want to see visual progress bars so that I can quickly assess how much work remains on complex tasks."

**User Persona 3: Sophie - Event Coordinator**
- **Background**: Plans corporate events with extensive preparation checklists
- **Goal**: Track completion of venue setup, catering, tech requirements
- **Need**: "As an event coordinator, I want collapsible subtask lists so that I can focus on high-level todos but drill down when needed."

### User Stories

1. **Create Subtasks**
   - As a user, I want to click a "Subtasks" button on any todo to reveal the subtask interface
   - As a user, I want to add subtasks with just a title so that I can quickly build checklists
   - As a user, I want subtasks to appear immediately after creation with optimistic updates
   - As a user, I want to add unlimited subtasks to handle any complexity level

2. **View Progress**
   - As a user, I want to see a visual progress bar showing completion percentage (0-100%)
   - As a user, I want to see "X/Y subtasks" text indicator for exact counts
   - As a user, I want progress updates to happen instantly when I check/uncheck subtasks
   - As a user, I want to see progress even when subtasks are collapsed

3. **Complete Subtasks**
   - As a user, I want to click checkboxes to mark subtasks complete/incomplete
   - As a user, I want completion state to persist across page refreshes
   - As a user, I want subtask completion to update the parent's progress bar immediately
   - As a user, I want completed subtasks to remain visible (not auto-hidden)

4. **Organize Subtasks**
   - As a user, I want subtasks to maintain their creation order automatically
   - As a user, I want to collapse subtask lists to reduce visual clutter
   - As a user, I want the expand/collapse state to persist during my session
   - As a user, I want subtask titles to be searchable along with parent todos

5. **Delete Subtasks**
   - As a user, I want to delete individual subtasks via a delete button
   - As a user, I want all subtasks automatically deleted when I delete the parent todo
   - As a user, I want subtask deletion to update progress calculations immediately
   - As a user, I want deletion to be instant with optimistic UI updates

## User Flow

### Flow 1: Create First Subtask for a Todo

```
1. User sees their todo list on main page
2. User clicks "▶ Subtasks (0)" button on a todo
3. Subtask section expands below the todo
   - Shows "No subtasks yet" message
   - Shows input field with placeholder "Add a subtask..."
   - Shows "Add" button
4. User types subtask title (e.g., "Research vendors")
5. User presses Enter or clicks "Add" button
6. New subtask appears immediately:
   - Unchecked checkbox on the left
   - Subtask title in middle
   - Delete (×) button on right
7. Progress indicator appears: "0/1 subtasks" with empty progress bar
8. Input field clears, ready for next subtask
9. Button text updates to "▼ Subtasks (1)"
```

### Flow 2: Add Multiple Subtasks

```
1. User has subtask section already expanded
2. User types second subtask (e.g., "Compare pricing")
3. User presses Enter
4. Subtask appears at bottom of list
5. Progress updates to "0/2 subtasks"
6. User continues adding subtasks:
   - "Schedule demos"
   - "Make final decision"
   - "Send PO"
7. Progress shows "0/5 subtasks" with 0% progress bar
8. All subtasks display in creation order (position 1-5)
```

### Flow 3: Mark Subtasks Complete

```
1. User completes first subtask (research done)
2. User clicks checkbox next to "Research vendors"
3. Checkbox changes to checked state immediately
4. Progress bar animates from 0% to 20% (blue fill)
5. Text updates to "1/5 subtasks"
6. User checks "Compare pricing"
7. Progress bar animates to 40%
8. Text updates to "2/5 subtasks"
9. User can uncheck any subtask to reverse progress
```

### Flow 4: Collapse/Expand Subtasks

```
1. User has 5 subtasks showing (expanded state)
2. User clicks "▼ Subtasks (5)" button to collapse
3. Subtask list smoothly collapses (hides)
4. Button changes to "▶ Subtasks (5)"
5. Progress bar remains visible: "2/5 subtasks" with 40% bar
6. User can still see overall progress without details
7. User clicks "▶ Subtasks (5)" to expand again
8. Subtask list re-appears with all data intact
```

### Flow 5: Delete Individual Subtask

```
1. User decides "Schedule demos" is not needed
2. User hovers over subtask, sees delete (×) button highlighted
3. User clicks × button
4. Subtask disappears immediately
5. Progress recalculates: "2/4 subtasks" (50%)
6. Progress bar updates to 50% width
7. Remaining subtasks maintain their positions
8. No confirmation dialog (instant delete for subtasks)
```

### Flow 6: Delete Parent Todo (Cascade)

```
1. User has todo "Vendor Selection" with 4 subtasks
2. User clicks "Delete" on the parent todo
3. Confirmation dialog shows: "Delete this todo? This cannot be undone."
4. User confirms deletion
5. Entire todo disappears from list
6. All 4 subtasks automatically deleted (cascade)
7. Database constraint ensures no orphaned subtasks
8. No additional API calls needed for subtask cleanup
```

### Flow 7: Search Subtasks

```
1. User has multiple todos with subtasks
2. User types "vendor" in search box
3. Search results show:
   - Parent todo "Vendor Selection" (title match)
   - Parent todo "Budget Planning" (has subtask "Approve vendor contracts")
4. Both todos displayed even though only subtask matched in second case
5. User can expand "Budget Planning" to see the matching subtask
6. Search is case-insensitive and searches both todo + subtask titles
```

## Technical Requirements

### Database Schema

#### Subtasks Table
```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL,
  title TEXT NOT NULL CHECK(length(title) <= 200),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_position ON subtasks(todo_id, position);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(todo_id, completed);
```

**Design Decisions:**
- `todo_id` with CASCADE DELETE ensures orphaned subtasks are impossible
- `position` field maintains display order (0, 1, 2, 3...)
- `title` max length 200 chars (shorter than todos for UI hierarchy)
- `completed` is 0/1 boolean for SQLite compatibility
- Composite index on `(todo_id, position)` for fast ordered retrieval
- Index on `(todo_id, completed)` for progress calculations

### TypeScript Interfaces

```typescript
// lib/db.ts or lib/types.ts

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubtaskInput {
  title: string;
  position?: number; // Auto-calculated if not provided
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
  position?: number;
}

export interface SubtaskResponse {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TodoWithSubtasks extends Todo {
  subtasks?: SubtaskResponse[];
  subtask_progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}
```

### API Endpoints

#### 1. GET /api/todos/:id/subtasks
**Purpose**: Fetch all subtasks for a specific todo
```typescript
// Request
GET /api/todos/42/subtasks

// Response (200 OK)
{
  "subtasks": [
    {
      "id": 1,
      "todo_id": 42,
      "title": "Research vendors",
      "completed": true,
      "position": 0,
      "created_at": "2025-11-13T10:00:00Z",
      "updated_at": "2025-11-13T11:00:00Z"
    },
    {
      "id": 2,
      "todo_id": 42,
      "title": "Compare pricing",
      "completed": false,
      "position": 1,
      "created_at": "2025-11-13T10:05:00Z",
      "updated_at": "2025-11-13T10:05:00Z"
    }
  ],
  "progress": {
    "completed": 1,
    "total": 2,
    "percentage": 50
  }
}

// Error (404)
{ "error": "Todo not found" }

// Error (401)
{ "error": "Not authenticated" }
```

#### 2. POST /api/todos/:id/subtasks
**Purpose**: Create a new subtask for a todo
```typescript
// Request
POST /api/todos/42/subtasks
Content-Type: application/json

{
  "title": "Schedule demos"
}

// Response (201 Created)
{
  "id": 3,
  "todo_id": 42,
  "title": "Schedule demos",
  "completed": false,
  "position": 2,
  "created_at": "2025-11-13T12:00:00Z",
  "updated_at": "2025-11-13T12:00:00Z"
}

// Error (400)
{ "error": "Title is required" }
{ "error": "Title must be 200 characters or less" }

// Error (404)
{ "error": "Todo not found" }
```

**Position Logic:**
- Query max position for todo_id: `SELECT MAX(position) FROM subtasks WHERE todo_id = ?`
- New position = max_position + 1 (or 0 if no subtasks exist)

#### 3. PUT /api/todos/:todoId/subtasks/:subtaskId
**Purpose**: Update a subtask's title or completion status
```typescript
// Request
PUT /api/todos/42/subtasks/3
Content-Type: application/json

{
  "completed": true
}

// Response (200 OK)
{
  "id": 3,
  "todo_id": 42,
  "title": "Schedule demos",
  "completed": true,
  "position": 2,
  "created_at": "2025-11-13T12:00:00Z",
  "updated_at": "2025-11-13T13:00:00Z"
}

// Error (404)
{ "error": "Subtask not found" }

// Error (403)
{ "error": "Not authorized to modify this subtask" }
```

**Authorization Check:**
- Query subtask's todo_id
- Verify todo belongs to authenticated user
- Only allow update if ownership confirmed

#### 4. DELETE /api/todos/:todoId/subtasks/:subtaskId
**Purpose**: Delete a single subtask
```typescript
// Request
DELETE /api/todos/42/subtasks/3

// Response (200 OK)
{ "success": true }

// Error (404)
{ "error": "Subtask not found" }

// Error (403)
{ "error": "Not authorized to delete this subtask" }
```

**Position Management After Delete:**
- Option A: Leave gaps in positions (simpler, works fine)
- Option B: Reorder remaining subtasks (complex, not necessary)
- **Recommendation**: Option A - gaps don't affect display order

### Database Operations (lib/db.ts)

```typescript
// Subtask CRUD operations

export const subtaskDB = {
  // Get all subtasks for a todo (ordered by position)
  getByTodoId: (todoId: number): Subtask[] => {
    const stmt = db.prepare(`
      SELECT * FROM subtasks 
      WHERE todo_id = ? 
      ORDER BY position ASC
    `);
    return stmt.all(todoId) as Subtask[];
  },

  // Get subtask by ID with todo ownership check
  getById: (id: number, userId: number): Subtask | null => {
    const stmt = db.prepare(`
      SELECT s.* FROM subtasks s
      JOIN todos t ON s.todo_id = t.id
      WHERE s.id = ? AND t.user_id = ?
    `);
    return stmt.get(id, userId) as Subtask | null;
  },

  // Create new subtask
  create: (todoId: number, userId: number, input: CreateSubtaskInput): Subtask => {
    // Verify todo ownership
    const todoStmt = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?');
    const todo = todoStmt.get(todoId, userId);
    if (!todo) throw new Error('Todo not found or unauthorized');

    // Calculate next position
    const posStmt = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM subtasks WHERE todo_id = ?');
    const { next_pos } = posStmt.get(todoId) as { next_pos: number };

    // Insert subtask
    const stmt = db.prepare(`
      INSERT INTO subtasks (todo_id, title, position, completed)
      VALUES (?, ?, ?, 0)
    `);
    const result = stmt.run(todoId, input.title, next_pos);

    // Return created subtask
    return subtaskDB.getById(result.lastInsertRowid as number, userId)!;
  },

  // Update subtask
  update: (id: number, userId: number, input: UpdateSubtaskInput): Subtask | null => {
    // Verify ownership first
    const existing = subtaskDB.getById(id, userId);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.completed !== undefined) {
      updates.push('completed = ?');
      values.push(input.completed ? 1 : 0);
    }
    if (input.position !== undefined) {
      updates.push('position = ?');
      values.push(input.position);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = datetime("now")');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE subtasks 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);

    return subtaskDB.getById(id, userId);
  },

  // Delete subtask
  delete: (id: number, userId: number): boolean => {
    // Verify ownership
    const existing = subtaskDB.getById(id, userId);
    if (!existing) return false;

    const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Calculate progress for a todo
  getProgress: (todoId: number): { completed: number; total: number; percentage: number } => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM subtasks
      WHERE todo_id = ?
    `);
    const result = stmt.get(todoId) as { total: number; completed: number };
    const percentage = result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;
    return {
      completed: result.completed || 0,
      total: result.total || 0,
      percentage
    };
  },

  // Search subtasks by title
  search: (userId: number, query: string): number[] => {
    const stmt = db.prepare(`
      SELECT DISTINCT s.todo_id
      FROM subtasks s
      JOIN todos t ON s.todo_id = t.id
      WHERE t.user_id = ? AND s.title LIKE ?
    `);
    const results = stmt.all(userId, `%${query}%`) as { todo_id: number }[];
    return results.map(r => r.todo_id);
  }
};
```

## UI Components

### Component 1: SubtaskSection (Expandable Container)

```typescript
// app/todos/page.tsx or components/SubtaskSection.tsx

interface SubtaskSectionProps {
  todoId: number;
  initialSubtasks?: SubtaskResponse[];
  initialProgress?: { completed: number; total: number; percentage: number };
}

function SubtaskSection({ todoId, initialSubtasks = [], initialProgress }: SubtaskSectionProps) {
  const [subtasks, setSubtasks] = useState<SubtaskResponse[]>(initialSubtasks);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [progress, setProgress] = useState(initialProgress || { completed: 0, total: 0, percentage: 0 });

  // Fetch subtasks when expanded
  useEffect(() => {
    if (isExpanded && subtasks.length === 0) {
      fetchSubtasks();
    }
  }, [isExpanded]);

  const fetchSubtasks = async () => {
    const response = await fetch(`/api/todos/${todoId}/subtasks`);
    if (response.ok) {
      const data = await response.json();
      setSubtasks(data.subtasks);
      setProgress(data.progress);
    }
  };

  const createSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    // Optimistic update
    const tempSubtask: SubtaskResponse = {
      id: Date.now(),
      todo_id: todoId,
      title: newSubtaskTitle,
      completed: false,
      position: subtasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSubtasks(prev => [...prev, tempSubtask]);
    setProgress(prev => ({ ...prev, total: prev.total + 1 }));
    setNewSubtaskTitle('');

    // Server request
    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });

      if (response.ok) {
        const created = await response.json();
        setSubtasks(prev => prev.map(s => s.id === tempSubtask.id ? created : s));
      } else {
        // Rollback on error
        setSubtasks(prev => prev.filter(s => s.id !== tempSubtask.id));
        setProgress(prev => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      // Rollback
      setSubtasks(prev => prev.filter(s => s.id !== tempSubtask.id));
      setProgress(prev => ({ ...prev, total: prev.total - 1 }));
    }
  };

  const toggleSubtask = async (subtaskId: number, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;

    // Optimistic update
    setSubtasks(prev => prev.map(s => 
      s.id === subtaskId ? { ...s, completed: newCompleted } : s
    ));
    setProgress(prev => ({
      ...prev,
      completed: prev.completed + (newCompleted ? 1 : -1),
      percentage: Math.round(((prev.completed + (newCompleted ? 1 : -1)) / prev.total) * 100),
    }));

    // Server request
    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });

      if (!response.ok) {
        // Rollback
        setSubtasks(prev => prev.map(s => 
          s.id === subtaskId ? { ...s, completed: currentCompleted } : s
        ));
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + (newCompleted ? -1 : 1),
          percentage: Math.round(((prev.completed + (newCompleted ? -1 : 1)) / prev.total) * 100),
        }));
      }
    } catch (error) {
      // Rollback
      setSubtasks(prev => prev.map(s => 
        s.id === subtaskId ? { ...s, completed: currentCompleted } : s
      ));
    }
  };

  const deleteSubtask = async (subtaskId: number) => {
    const subtaskToDelete = subtasks.find(s => s.id === subtaskId);
    if (!subtaskToDelete) return;

    // Optimistic update
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    setProgress(prev => ({
      completed: prev.completed - (subtaskToDelete.completed ? 1 : 0),
      total: prev.total - 1,
      percentage: prev.total - 1 > 0 
        ? Math.round(((prev.completed - (subtaskToDelete.completed ? 1 : 0)) / (prev.total - 1)) * 100)
        : 0,
    }));

    // Server request
    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Rollback
        setSubtasks(prev => [...prev, subtaskToDelete].sort((a, b) => a.position - b.position));
        setProgress(prev => ({
          completed: prev.completed + (subtaskToDelete.completed ? 1 : 0),
          total: prev.total + 1,
          percentage: Math.round(((prev.completed + (subtaskToDelete.completed ? 1 : 0)) / (prev.total + 1)) * 100),
        }));
      }
    } catch (error) {
      // Rollback
      setSubtasks(prev => [...prev, subtaskToDelete].sort((a, b) => a.position - b.position));
    }
  };

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">
      {/* Toggle Button with Progress */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>Subtasks ({progress.total})</span>
        </button>
        {progress.total > 0 && (
          <span className="text-xs text-gray-400">
            {progress.completed}/{progress.total} subtasks
          </span>
        )}
      </div>

      {/* Progress Bar (always visible) */}
      {progress.total > 0 && (
        <div className="mb-3">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-2">
          {/* Subtask List */}
          {subtasks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No subtasks yet</p>
          ) : (
            <div className="space-y-1">
              {subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center space-x-2 group">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask.id, subtask.completed)}
                    className="w-4 h-4 cursor-pointer accent-blue-600"
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(subtask.id)}
                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask Form */}
          <form onSubmit={createSubtask} className="flex items-center space-x-2 mt-3">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask..."
              maxLength={200}
              className="flex-1 bg-gray-800 px-3 py-1.5 rounded text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

### Component 2: ProgressBar (Reusable)

```typescript
// components/ProgressBar.tsx

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBar({ completed, total, className = '' }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{completed}/{total} subtasks</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
```

### Component 3: SubtaskItem (Individual Row)

```typescript
// components/SubtaskItem.tsx

interface SubtaskItemProps {
  subtask: SubtaskResponse;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-800 group transition-colors">
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={() => onToggle(subtask.id, subtask.completed)}
        className="w-4 h-4 cursor-pointer accent-blue-600 flex-shrink-0"
        aria-label={`Mark "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
      />
      <span 
        className={`flex-1 text-sm ${
          subtask.completed 
            ? 'line-through text-gray-500' 
            : 'text-gray-200'
        }`}
      >
        {subtask.title}
      </span>
      <button
        onClick={() => onDelete(subtask.id)}
        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        aria-label={`Delete "${subtask.title}"`}
      >
        ✕
      </button>
    </div>
  );
}
```

## Edge Cases

### 1. Cascade Deletion Verification
**Scenario**: User deletes parent todo with 50 subtasks
- **Expected**: All 50 subtasks deleted via CASCADE constraint
- **Test**: Verify no orphaned subtasks remain in database
- **SQL**: `SELECT COUNT(*) FROM subtasks WHERE todo_id NOT IN (SELECT id FROM todos)`

### 2. Maximum Subtasks Performance
**Scenario**: User creates 100+ subtasks for a single todo
- **Expected**: UI remains responsive, progress bar accurate
- **Solution**: Use `ORDER BY position LIMIT 100` if pagination needed
- **Frontend**: Virtual scrolling for 100+ items

### 3. Concurrent Completion Updates
**Scenario**: User rapidly checks/unchecks multiple subtasks
- **Expected**: Progress bar updates smoothly, no race conditions
- **Solution**: Optimistic updates with debounced server sync
- **Test**: Check 5 subtasks in rapid succession

### 4. Subtask Title Validation
**Scenario**: User tries to create subtask with empty title or 201+ chars
- **Expected**: Client validation prevents submission
- **Server**: Returns 400 error if validation bypassed
- **Messages**: "Title is required" / "Title must be 200 characters or less"

### 5. Search with Subtasks
**Scenario**: User searches "budget", matches only subtask title
- **Expected**: Parent todo appears in results, subtask highlighted
- **Implementation**: Query returns distinct todo IDs where todo.title OR subtask.title matches
- **SQL**: `SELECT DISTINCT t.id FROM todos t LEFT JOIN subtasks s ON t.id = s.todo_id WHERE t.title LIKE ? OR s.title LIKE ?`

### 6. Zero Subtasks Progress Display
**Scenario**: Todo has 0 subtasks
- **Expected**: No progress bar shown, button shows "Subtasks (0)"
- **Avoid**: Division by zero in percentage calculation
- **Check**: `total > 0` before rendering progress

### 7. Unauthorized Access
**Scenario**: User tries to access another user's subtasks via direct API call
- **Expected**: 403 Forbidden or 404 Not Found
- **Implementation**: JOIN todos table to verify user_id ownership
- **SQL**: `SELECT s.* FROM subtasks s JOIN todos t ON s.todo_id = t.id WHERE s.id = ? AND t.user_id = ?`

### 8. Subtask Position Gaps
**Scenario**: Positions are [0, 1, 5, 7] after deletions
- **Expected**: Display order still correct (ASC sort works)
- **No Reordering**: Gaps are acceptable, simplifies deletion
- **New Position**: Always use `MAX(position) + 1`

### 9. Expand/Collapse State Persistence
**Scenario**: User expands subtasks, refreshes page
- **Expected**: State resets to collapsed (stateless)
- **Alternative**: Use sessionStorage to persist expand state
- **Decision**: Start collapsed to reduce initial data load

### 10. Subtask Completion vs Parent Completion
**Scenario**: All subtasks completed, parent todo still not completed
- **Expected**: Independent states (by design)
- **Rationale**: Parent represents overall task, subtasks are checklist
- **Future**: Optional feature to auto-complete parent when all subtasks done

## Acceptance Criteria

### Must Have (P0)
- [ ] Subtask CRUD operations work for all authenticated users
- [ ] Progress bar displays accurate percentage (0-100%)
- [ ] Text indicator shows "X/Y subtasks" format
- [ ] Expand/collapse functionality works without errors
- [ ] Cascade delete removes all subtasks when parent deleted
- [ ] Subtasks maintain position-based order
- [ ] Optimistic UI updates with rollback on errors
- [ ] Search includes subtask titles in results
- [ ] Authorization prevents cross-user subtask access

### Should Have (P1)
- [ ] Progress bar animates smoothly during updates
- [ ] Delete button appears on hover (not always visible)
- [ ] Keyboard Enter key creates subtask from input
- [ ] Empty state message shows when no subtasks exist
- [ ] Completed subtasks show line-through styling
- [ ] Progress visible even when subtasks collapsed
- [ ] API responses include progress object

### Nice to Have (P2)
- [ ] Subtask creation shows loading indicator
- [ ] Batch completion (select all checkbox)
- [ ] Subtask reordering via drag-and-drop
- [ ] Subtask due dates (independent from parent)
- [ ] Subtask assignment to team members

## Testing Requirements

### E2E Tests (Playwright)

#### Test File: `tests/05-subtasks-progress.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Subtasks & Progress Tracking', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setupAuthenticatedSession();
    await helper.createTodo('Project Planning', '2025-12-01T10:00');
  });

  test('should create first subtask and show progress', async ({ page }) => {
    // Expand subtasks
    await page.click('button:has-text("▶ Subtasks")');
    await expect(page.locator('text=No subtasks yet')).toBeVisible();

    // Create subtask
    await page.fill('input[placeholder="Add a subtask..."]', 'Define scope');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');

    // Verify subtask appears
    await expect(page.locator('text=Define scope')).toBeVisible();
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();

    // Verify progress bar
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  test('should update progress when subtasks completed', async ({ page }) => {
    // Create 3 subtasks
    await helper.addSubtask('Project Planning', 'Task 1');
    await helper.addSubtask('Project Planning', 'Task 2');
    await helper.addSubtask('Project Planning', 'Task 3');

    // Verify initial state
    await expect(page.locator('text=0/3 subtasks')).toBeVisible();

    // Complete first subtask
    await page.check('text=Task 1 >> ../.. >> input[type="checkbox"]');
    await expect(page.locator('text=1/3 subtasks')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '33');

    // Complete second subtask
    await page.check('text=Task 2 >> ../.. >> input[type="checkbox"]');
    await expect(page.locator('text=2/3 subtasks')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '67');

    // Complete third subtask
    await page.check('text=Task 3 >> ../.. >> input[type="checkbox"]');
    await expect(page.locator('text=3/3 subtasks')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '100');
  });

  test('should delete individual subtask', async ({ page }) => {
    await helper.addSubtask('Project Planning', 'Subtask to delete');
    await helper.addSubtask('Project Planning', 'Subtask to keep');

    // Hover and delete first subtask
    await page.hover('text=Subtask to delete');
    await page.click('text=Subtask to delete >> ../.. >> button:has-text("✕")');

    // Verify deletion
    await expect(page.locator('text=Subtask to delete')).not.toBeVisible();
    await expect(page.locator('text=Subtask to keep')).toBeVisible();
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();
  });

  test('should cascade delete all subtasks when parent deleted', async ({ page }) => {
    await helper.addSubtask('Project Planning', 'Subtask 1');
    await helper.addSubtask('Project Planning', 'Subtask 2');

    // Delete parent todo
    await page.click('text=Project Planning >> ../.. >> button:has-text("Delete")');
    await page.click('button:has-text("OK")'); // Confirm

    // Verify parent and subtasks gone
    await expect(page.locator('text=Project Planning')).not.toBeVisible();
    await expect(page.locator('text=Subtask 1')).not.toBeVisible();
    await expect(page.locator('text=Subtask 2')).not.toBeVisible();
  });

  test('should collapse and expand subtasks', async ({ page }) => {
    await helper.addSubtask('Project Planning', 'Visible subtask');

    // Collapse
    await page.click('button:has-text("▼ Subtasks")');
    await expect(page.locator('text=Visible subtask')).not.toBeVisible();
    await expect(page.locator('button:has-text("▶ Subtasks")')).toBeVisible();

    // Progress bar still visible
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    // Expand again
    await page.click('button:has-text("▶ Subtasks")');
    await expect(page.locator('text=Visible subtask')).toBeVisible();
  });

  test('should search subtask titles', async ({ page }) => {
    await helper.createTodo('Todo A', '2025-12-01T10:00');
    await helper.addSubtask('Todo A', 'Budget review');

    await helper.createTodo('Todo B', '2025-12-01T10:00');
    await helper.addSubtask('Todo B', 'Team meeting');

    // Search for "budget"
    await page.fill('input[placeholder*="Search"]', 'budget');

    // Should show Todo A (subtask match)
    await expect(page.locator('text=Todo A')).toBeVisible();
    await expect(page.locator('text=Todo B')).not.toBeVisible();
  });

  test('should handle rapid completion toggles', async ({ page }) => {
    await helper.addSubtask('Project Planning', 'Fast task 1');
    await helper.addSubtask('Project Planning', 'Fast task 2');
    await helper.addSubtask('Project Planning', 'Fast task 3');

    // Rapidly check all
    await page.check('text=Fast task 1 >> ../.. >> input[type="checkbox"]');
    await page.check('text=Fast task 2 >> ../.. >> input[type="checkbox"]');
    await page.check('text=Fast task 3 >> ../.. >> input[type="checkbox"]');

    // Verify final state
    await expect(page.locator('text=3/3 subtasks')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '100');
  });

  test('should enforce 200 character title limit', async ({ page }) => {
    await page.click('button:has-text("▶ Subtasks")');

    const longTitle = 'a'.repeat(201);
    await page.fill('input[placeholder="Add a subtask..."]', longTitle);

    // Verify max length attribute
    const input = page.locator('input[placeholder="Add a subtask..."]');
    await expect(input).toHaveAttribute('maxlength', '200');

    // Verify only 200 chars entered
    const value = await input.inputValue();
    expect(value.length).toBe(200);
  });
});
```

### API Tests (Unit/Integration)

```typescript
// tests/api/subtasks.test.ts

describe('POST /api/todos/:id/subtasks', () => {
  it('should create subtask with correct position', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    
    const response = await request(app)
      .post(`/api/todos/${todo.id}/subtasks`)
      .send({ title: 'First subtask' })
      .expect(201);

    expect(response.body.position).toBe(0);
    expect(response.body.completed).toBe(false);
  });

  it('should increment position for subsequent subtasks', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    
    await request(app)
      .post(`/api/todos/${todo.id}/subtasks`)
      .send({ title: 'Subtask 1' });

    const response = await request(app)
      .post(`/api/todos/${todo.id}/subtasks`)
      .send({ title: 'Subtask 2' })
      .expect(201);

    expect(response.body.position).toBe(1);
  });

  it('should reject empty title', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    
    await request(app)
      .post(`/api/todos/${todo.id}/subtasks`)
      .send({ title: '' })
      .expect(400);
  });

  it('should reject title over 200 chars', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    
    await request(app)
      .post(`/api/todos/${todo.id}/subtasks`)
      .send({ title: 'a'.repeat(201) })
      .expect(400);
  });
});

describe('GET /api/todos/:id/subtasks', () => {
  it('should return subtasks ordered by position', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    await createSubtask(todo.id, { title: 'Third', position: 2 });
    await createSubtask(todo.id, { title: 'First', position: 0 });
    await createSubtask(todo.id, { title: 'Second', position: 1 });

    const response = await request(app)
      .get(`/api/todos/${todo.id}/subtasks`)
      .expect(200);

    expect(response.body.subtasks[0].title).toBe('First');
    expect(response.body.subtasks[1].title).toBe('Second');
    expect(response.body.subtasks[2].title).toBe('Third');
  });

  it('should calculate progress correctly', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    await createSubtask(todo.id, { title: 'Done 1', completed: true });
    await createSubtask(todo.id, { title: 'Done 2', completed: true });
    await createSubtask(todo.id, { title: 'Pending', completed: false });

    const response = await request(app)
      .get(`/api/todos/${todo.id}/subtasks`)
      .expect(200);

    expect(response.body.progress).toEqual({
      completed: 2,
      total: 3,
      percentage: 67
    });
  });
});

describe('DELETE /api/todos/:id', () => {
  it('should cascade delete all subtasks', async () => {
    const todo = await createTodo({ title: 'Test Todo' });
    await createSubtask(todo.id, { title: 'Sub 1' });
    await createSubtask(todo.id, { title: 'Sub 2' });

    await request(app)
      .delete(`/api/todos/${todo.id}`)
      .expect(200);

    // Verify subtasks deleted
    const subtasks = await db.prepare('SELECT * FROM subtasks WHERE todo_id = ?').all(todo.id);
    expect(subtasks.length).toBe(0);
  });
});
```

## Out of Scope

The following features are **explicitly excluded** from this PRP:

1. **Subtask Reordering**: Drag-and-drop or manual position editing (use creation order only)
2. **Subtask Due Dates**: Independent deadlines for subtasks (only parent todo has due date)
3. **Subtask Priority**: Priority levels are parent-level only
4. **Subtask Recurrence**: Recurring patterns not supported for subtasks
5. **Subtask Reminders**: Notifications only for parent todos
6. **Subtask Assignment**: Multi-user assignment not in scope
7. **Subtask Comments**: No threaded discussions on subtasks
8. **Subtask Attachments**: File uploads not supported
9. **Subtask Templates**: Cannot save subtask patterns for reuse
10. **Auto-Complete Parent**: Parent todo does not auto-complete when all subtasks done
11. **Subtask Export**: Not included in JSON export (future enhancement)
12. **Subtask Tags**: Tags are parent-level only
13. **Nested Subtasks**: No sub-subtasks (single level only)
14. **Batch Operations**: No "select all" or multi-select for subtasks
15. **Subtask History**: No audit log for subtask changes

## Success Metrics

### Quantitative Metrics
- **Adoption Rate**: 60%+ of todos have at least 1 subtask within 30 days
- **Average Subtasks**: 3-5 subtasks per todo (indicates proper use)
- **Completion Rate**: Subtask completion rate matches or exceeds parent todo completion
- **Performance**: Subtask operations complete in <100ms (95th percentile)
- **Error Rate**: <1% of subtask API calls fail

### Qualitative Metrics
- **User Feedback**: Positive sentiment in user surveys about checklist feature
- **Support Tickets**: <5% of support requests related to subtask issues
- **Feature Requests**: Reduced requests for "task breakdown" or "checklist" features

### Technical Metrics
- **Database Integrity**: 0 orphaned subtasks (CASCADE works 100%)
- **Test Coverage**: >90% coverage for subtask-related code
- **API Response Time**: p95 < 100ms for subtask endpoints
- **Frontend Performance**: No layout shift when expanding/collapsing subtasks

### Business Metrics
- **User Retention**: Increased 7-day retention for users who create subtasks
- **Engagement**: Higher daily active usage for users with subtasks
- **Feature Parity**: Matches subtask capabilities of competitor apps (Todoist, Asana)

---

## Implementation Checklist

### Phase 1: Database & Backend (Week 1)
- [ ] Create `subtasks` table with migration script
- [ ] Implement `subtaskDB` CRUD operations in `lib/db.ts`
- [ ] Add TypeScript interfaces to `lib/types.ts`
- [ ] Create API routes: GET, POST, PUT, DELETE
- [ ] Add authorization checks (user ownership)
- [ ] Implement progress calculation function
- [ ] Test CASCADE delete behavior
- [ ] Write unit tests for database operations

### Phase 2: Frontend Components (Week 2)
- [ ] Build `SubtaskSection` expandable container
- [ ] Create `ProgressBar` reusable component
- [ ] Implement `SubtaskItem` row component
- [ ] Add expand/collapse toggle logic
- [ ] Implement optimistic updates with rollback
- [ ] Style components to match design system
- [ ] Add loading and error states
- [ ] Test responsive layout

### Phase 3: Integration (Week 3)
- [ ] Integrate subtasks into main todos page
- [ ] Add subtask search functionality
- [ ] Update todo list component to show progress
- [ ] Implement keyboard shortcuts (Enter to add)
- [ ] Add hover effects for delete buttons
- [ ] Test cross-browser compatibility
- [ ] Performance optimization (virtual scrolling if needed)
- [ ] Accessibility audit (ARIA labels, keyboard nav)

### Phase 4: Testing & Polish (Week 4)
- [ ] Write Playwright E2E tests (full test suite)
- [ ] Conduct user acceptance testing
- [ ] Fix bugs identified in testing
- [ ] Update USER_GUIDE.md documentation
- [ ] Record demo video for feature
- [ ] Prepare release notes
- [ ] Deploy to staging environment
- [ ] Final production release

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Owner**: Development Team  
**Status**: Ready for Implementation
