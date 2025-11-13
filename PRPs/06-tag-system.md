# PRP-06: Tag System

## Feature Overview

The Tag System enables users to organize and categorize their todos using custom color-coded labels with a many-to-many relationship model. Each user can create unlimited tags with personalized names and colors (hex codes), then apply multiple tags to any todo. The system provides full CRUD operations for tags, real-time visual updates, and powerful filtering capabilities. Tags are user-specific, ensuring privacy and personalization, with cascade deletion maintaining data integrity when tags are removed.

**Core Capabilities:**
- Create custom tags with names and color codes
- Edit tag properties (name, color) with instant reflection across all todos
- Delete tags with cascade removal from all associated todos
- Apply multiple tags to any todo (many-to-many relationship)
- Filter todos by tag selection
- Visual color-coded pills displayed on todos
- Tag management modal for centralized administration
- User-specific tags (isolated per user)
- Unique tag names per user (no duplicates)
- Default color fallback (#3B82F6 blue)

## User Stories

### Primary Users

**User Persona 1: Rachel - Multi-Project Coordinator**
- **Background**: Manages 5 different client projects simultaneously
- **Goal**: Visually distinguish tasks by client/project at a glance
- **Need**: "As a project coordinator, I want to create color-coded tags for each client so that I can quickly identify which tasks belong to which project without reading every title."

**User Persona 2: Tom - Personal Productivity Optimizer**
- **Background**: Uses GTD methodology with contexts (@home, @office, @errands)
- **Goal**: Filter tasks by context to work on location-appropriate tasks
- **Need**: "As a GTD practitioner, I want to tag todos with contexts and filter by tag so that I can see only tasks I can do in my current location."

**User Persona 3: Lisa - Categorization Enthusiast**
- **Background**: Likes highly organized systems with clear categorization
- **Goal**: Apply multiple categories to complex tasks (e.g., "Work" + "Urgent" + "Finance")
- **Need**: "As an organizer, I want to apply multiple tags to a single todo so that I can categorize tasks from different dimensions simultaneously."

### User Stories

1. **Create Tags**
   - As a user, I want to create a new tag with a custom name so that I can define my own categories
   - As a user, I want to choose a color for my tag so that it's visually distinctive
   - As a user, I want to enter hex codes manually so that I can use my brand colors
   - As a user, I want a default color applied if I don't choose one so that tag creation is fast

2. **Edit Tags**
   - As a user, I want to rename a tag so that I can correct typos or improve clarity
   - As a user, I want to change a tag's color so that I can adjust my visual system
   - As a user, I want changes to reflect immediately on all todos so that my system stays consistent
   - As a user, I want unique name validation so that I don't create duplicate tags

3. **Delete Tags**
   - As a user, I want to delete tags I no longer use so that my tag list stays clean
   - As a user, I want confirmation before deleting so that I don't lose data accidentally
   - As a user, I want tags automatically removed from todos when deleted so that orphaned references don't exist
   - As a user, I want to see which todos use a tag before deleting so that I understand the impact

4. **Apply Tags to Todos**
   - As a user, I want to select multiple tags when creating a todo so that I can categorize it fully
   - As a user, I want to toggle tags on/off easily so that I can quickly apply/remove categories
   - As a user, I want visual feedback (checkmarks) showing which tags are applied
   - As a user, I want tag changes to save immediately without extra clicks

5. **Filter by Tags**
   - As a user, I want to filter my todo list by a specific tag so that I can focus on one category
   - As a user, I want tag filters to combine with other filters (search, priority) so that I can narrow results precisely
   - As a user, I want to clear tag filters easily so that I can see all todos again
   - As a user, I want the filter to update my view instantly without page reload

6. **View Tags**
   - As a user, I want to see tags displayed as colored pills on todos so that categories are immediately visible
   - As a user, I want tag colors to be readable (white text on colored background) so that I can read them quickly
   - As a user, I want tags to wrap responsively on mobile so that they don't break the layout
   - As a user, I want to manage all my tags in one centralized modal so that I have a clear overview

## User Flow

### Flow 1: Create First Tag

```
1. User clicks "+ Manage Tags" button (top of page or near todo form)
2. Tag Management Modal opens:
   - Title: "Manage Tags"
   - Empty state: "No tags yet. Create your first one!"
   - Form section with:
     * "Tag Name" text input (placeholder: "e.g., Work, Personal, Urgent")
     * "Color" color picker (default: #3B82F6 blue)
     * "Create Tag" button
3. User types tag name (e.g., "Work")
4. User clicks color picker, selects green (#10B981)
5. User clicks "Create Tag" button
6. New tag appears in list section:
   - Tag pill showing "Work" with green background
   - Edit button (pencil icon)
   - Delete button (trash icon)
7. Success message briefly shows: "Tag created successfully"
8. User clicks "Close" or X to exit modal
9. Tag now available for use on todos
```

### Flow 2: Create Multiple Tags Rapidly

```
1. User has Tag Management Modal already open
2. User creates "Work" tag (green) - appears in list
3. User immediately creates "Personal" tag (blue) - appears below "Work"
4. User creates "Urgent" tag (red) - appears below "Personal"
5. User creates "Finance" tag (yellow) - appears below "Urgent"
6. All 4 tags visible in list, sorted by creation order
7. User closes modal
8. All tags available for immediate use on todos
```

### Flow 3: Apply Tags to New Todo

```
1. User fills out "Add new todo" form
2. Below the form, "Available Tags" section appears (if tags exist)
3. User sees 4 tag pills:
   - "Work" (green, unselected state with border)
   - "Personal" (blue, unselected)
   - "Urgent" (red, unselected)
   - "Finance" (yellow, unselected)
4. User clicks "Work" pill
   - Pill fills with green background
   - White checkmark appears
   - White text replaces gray text
5. User clicks "Urgent" pill
   - Pill fills with red background
   - Checkmark appears
6. User clicks "Add" to create todo
7. New todo appears with two tag pills displayed:
   - Small "Work" pill (green)
   - Small "Urgent" pill (red)
8. Tags persist on todo, visible in all views
```

### Flow 4: Apply Tags to Existing Todo (Edit Mode)

```
1. User sees todo "Prepare budget report" (no tags currently)
2. User clicks "Edit" button on the todo
3. Edit modal opens with:
   - Title field (pre-filled)
   - Priority dropdown
   - Due date picker
   - Tags section at bottom showing all available tags
4. Tags section shows:
   - "Work" (unselected)
   - "Finance" (unselected)
   - "Urgent" (unselected)
5. User clicks "Work" and "Finance" pills
   - Both turn colored with checkmarks
6. User clicks "Update" button
7. Todo closes edit mode and now displays:
   - "Prepare budget report"
   - Priority badge
   - "Work" tag pill (green)
   - "Finance" tag pill (yellow)
8. Tags saved permanently to database
```

### Flow 5: Edit Tag (Name and Color)

```
1. User opens Tag Management Modal
2. User sees "Work" tag (green) in list
3. User decides green is wrong, should be corporate blue
4. User clicks "Edit" button (pencil icon) next to "Work"
5. Edit form appears inline:
   - Text input shows "Work" (editable)
   - Color picker shows current green
   - "Update" button appears
   - "Cancel" button appears
6. User changes color picker to blue (#1E40AF)
7. User clicks "Update"
8. Tag pill updates to blue immediately in modal
9. User closes modal
10. All todos with "Work" tag now show blue pills
11. Change reflected across entire app instantly
```

### Flow 6: Delete Tag (With Cascade)

```
1. User has "Personal" tag applied to 3 todos
2. User opens Tag Management Modal
3. User clicks "Delete" button (trash icon) next to "Personal"
4. Confirmation dialog appears:
   - "Delete tag 'Personal'?"
   - "This tag is used on 3 todos. It will be removed from all of them."
   - "Cancel" button
   - "Delete" button (red)
5. User clicks "Delete" to confirm
6. Tag disappears from modal list
7. User closes modal
8. All 3 todos no longer show "Personal" tag pill
9. Database junction records deleted via CASCADE
10. Tag permanently removed from system
```

### Flow 7: Filter Todos by Tag

```
1. User has 20 todos with various tags:
   - 8 with "Work"
   - 5 with "Personal"
   - 3 with "Urgent"
   - 7 with "Finance"
   - Some with multiple tags
2. User clicks "All Tags" dropdown in filter section
3. Dropdown opens showing:
   - "All Tags" (currently selected)
   - "Work" pill
   - "Personal" pill
   - "Urgent" pill
   - "Finance" pill
4. User clicks "Work" pill
5. Dropdown closes
6. Todo list instantly filters to show only 8 todos tagged "Work"
7. Filter indicator shows: "Filtered by: Work ✕"
8. User can click ✕ to clear filter and see all 20 todos again
```

### Flow 8: Combined Filters (Search + Tag + Priority)

```
1. User has 50 todos across all categories
2. User types "report" in search box → narrows to 12 todos
3. User selects "High" priority filter → narrows to 5 todos
4. User selects "Finance" tag filter → narrows to 2 todos
5. Final view shows only 2 high-priority finance reports
6. All filters displayed as active indicators
7. User can remove any filter independently
8. Todos reappear as filters are cleared
```

## Technical Requirements

### Database Schema

#### Tags Table
```sql
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK(length(name) <= 50 AND length(name) > 0),
  color TEXT NOT NULL DEFAULT '#3B82F6' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name COLLATE NOCASE)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(user_id, name COLLATE NOCASE);
```

**Design Decisions:**
- `user_id` ensures tag isolation per user with CASCADE delete
- `name` limited to 50 chars for UI display, must be non-empty
- `color` must be valid 6-digit hex code (e.g., #3B82F6)
- `UNIQUE(user_id, name COLLATE NOCASE)` prevents duplicate tag names per user (case-insensitive)
- Default color #3B82F6 (Tailwind blue-500) if not specified
- `updated_at` tracks last modification for audit purposes

#### Todo_Tags Junction Table (Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
```

**Design Decisions:**
- Composite primary key `(todo_id, tag_id)` prevents duplicate associations
- Double CASCADE: deleting todo removes associations, deleting tag removes associations
- `created_at` for potential analytics (when was tag applied)
- Indexes on both foreign keys for fast bidirectional queries
- No `id` column needed (junction table pattern)

### TypeScript Interfaces

```typescript
// lib/db.ts or lib/types.ts

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string; // Hex format: #RRGGBB
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  color?: string; // Optional, defaults to #3B82F6
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

export interface TagResponse {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TodoWithTags extends Todo {
  tags?: TagResponse[];
}

// For applying tags to todos
export interface TagAssignment {
  todo_id: number;
  tag_id: number;
  created_at: string;
}
```

### API Endpoints

#### 1. GET /api/tags
**Purpose**: Fetch all tags for the authenticated user
```typescript
// Request
GET /api/tags

// Response (200 OK)
{
  "tags": [
    {
      "id": 1,
      "name": "Work",
      "color": "#10B981",
      "created_at": "2025-11-13T10:00:00Z",
      "updated_at": "2025-11-13T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Personal",
      "color": "#3B82F6",
      "created_at": "2025-11-13T11:00:00Z",
      "updated_at": "2025-11-13T11:00:00Z"
    }
  ]
}

// Error (401)
{ "error": "Not authenticated" }
```

**Sorting**: Returns tags ordered by creation date (oldest first) for consistent display.

#### 2. POST /api/tags
**Purpose**: Create a new tag
```typescript
// Request
POST /api/tags
Content-Type: application/json

{
  "name": "Urgent",
  "color": "#EF4444"
}

// Response (201 Created)
{
  "id": 3,
  "name": "Urgent",
  "color": "#EF4444",
  "created_at": "2025-11-13T12:00:00Z",
  "updated_at": "2025-11-13T12:00:00Z"
}

// Error (400)
{ "error": "Tag name is required" }
{ "error": "Tag name must be 50 characters or less" }
{ "error": "Invalid color format. Use hex format like #3B82F6" }
{ "error": "Tag name already exists" }

// Error (401)
{ "error": "Not authenticated" }
```

**Validation Rules:**
- Name required, 1-50 characters
- Color must match regex: `/^#[0-9A-Fa-f]{6}$/`
- Duplicate name check (case-insensitive)
- Default color #3B82F6 if not provided

#### 3. PUT /api/tags/:id
**Purpose**: Update tag name and/or color
```typescript
// Request
PUT /api/tags/3
Content-Type: application/json

{
  "color": "#F59E0B"
}

// Response (200 OK)
{
  "id": 3,
  "name": "Urgent",
  "color": "#F59E0B",
  "created_at": "2025-11-13T12:00:00Z",
  "updated_at": "2025-11-13T13:30:00Z"
}

// Error (400)
{ "error": "Tag name must be 50 characters or less" }
{ "error": "Invalid color format" }
{ "error": "Tag name already exists" }

// Error (404)
{ "error": "Tag not found" }

// Error (403)
{ "error": "Not authorized to modify this tag" }
```

**Update Behavior:**
- Partial updates supported (name only, color only, or both)
- Changes reflect immediately on all todos using the tag
- `updated_at` timestamp updated automatically

#### 4. DELETE /api/tags/:id
**Purpose**: Delete a tag and remove from all todos
```typescript
// Request
DELETE /api/tags/3

// Response (200 OK)
{
  "success": true,
  "affectedTodos": 5  // Number of todos that had this tag
}

// Error (404)
{ "error": "Tag not found" }

// Error (403)
{ "error": "Not authorized to delete this tag" }
```

**Cascade Behavior:**
- `ON DELETE CASCADE` automatically removes all `todo_tags` records
- No need for manual junction table cleanup
- Returns count of affected todos for user feedback

#### 5. GET /api/todos/:id/tags
**Purpose**: Get all tags for a specific todo
```typescript
// Request
GET /api/todos/42/tags

// Response (200 OK)
{
  "tags": [
    {
      "id": 1,
      "name": "Work",
      "color": "#10B981",
      "created_at": "2025-11-13T10:00:00Z",
      "updated_at": "2025-11-13T10:00:00Z"
    },
    {
      "id": 3,
      "name": "Urgent",
      "color": "#EF4444",
      "created_at": "2025-11-13T12:00:00Z",
      "updated_at": "2025-11-13T12:00:00Z"
    }
  ]
}

// Error (404)
{ "error": "Todo not found" }
```

#### 6. PUT /api/todos/:id/tags
**Purpose**: Set all tags for a todo (replaces existing)
```typescript
// Request
PUT /api/todos/42/tags
Content-Type: application/json

{
  "tagIds": [1, 3, 5]
}

// Response (200 OK)
{
  "tags": [
    { "id": 1, "name": "Work", "color": "#10B981", ... },
    { "id": 3, "name": "Urgent", "color": "#EF4444", ... },
    { "id": 5, "name": "Finance", "color": "#F59E0B", ... }
  ]
}

// Error (400)
{ "error": "tagIds must be an array" }
{ "error": "Invalid tag ID: 99 (tag does not exist or does not belong to you)" }

// Error (404)
{ "error": "Todo not found" }
```

**Replace Logic:**
1. Delete all existing `todo_tags` records for this todo
2. Insert new records for each tag ID in array
3. Validate all tag IDs belong to the authenticated user
4. Empty array removes all tags from todo

### Database Operations (lib/db.ts)

```typescript
// Tag CRUD operations

export const tagDB = {
  // Get all tags for a user
  getAll: (userId: number): Tag[] => {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? 
      ORDER BY created_at ASC
    `);
    return stmt.all(userId) as Tag[];
  },

  // Get tag by ID with ownership check
  getById: (id: number, userId: number): Tag | null => {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE id = ? AND user_id = ?
    `);
    return stmt.get(id, userId) as Tag | null;
  },

  // Create new tag
  create: (userId: number, input: CreateTagInput): Tag => {
    // Validate color format
    const color = input.color || '#3B82F6';
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error('Invalid color format. Use hex format like #3B82F6');
    }

    // Check for duplicate name (case-insensitive)
    const checkStmt = db.prepare(`
      SELECT id FROM tags 
      WHERE user_id = ? AND LOWER(name) = LOWER(?)
    `);
    const existing = checkStmt.get(userId, input.name);
    if (existing) {
      throw new Error('Tag name already exists');
    }

    // Insert tag
    const stmt = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(userId, input.name, color);

    // Return created tag
    return tagDB.getById(result.lastInsertRowid as number, userId)!;
  },

  // Update tag
  update: (id: number, userId: number, input: UpdateTagInput): Tag | null => {
    // Verify ownership
    const existing = tagDB.getById(id, userId);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      // Check for duplicate name if changing
      if (input.name !== existing.name) {
        const checkStmt = db.prepare(`
          SELECT id FROM tags 
          WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?
        `);
        const duplicate = checkStmt.get(userId, input.name, id);
        if (duplicate) {
          throw new Error('Tag name already exists');
        }
      }
      updates.push('name = ?');
      values.push(input.name);
    }

    if (input.color !== undefined) {
      // Validate color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
        throw new Error('Invalid color format');
      }
      updates.push('color = ?');
      values.push(input.color);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = datetime("now")');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tags 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);

    return tagDB.getById(id, userId);
  },

  // Delete tag
  delete: (id: number, userId: number): { success: boolean; affectedTodos: number } => {
    // Verify ownership
    const existing = tagDB.getById(id, userId);
    if (!existing) return { success: false, affectedTodos: 0 };

    // Count affected todos
    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT todo_id) as count 
      FROM todo_tags 
      WHERE tag_id = ?
    `);
    const { count } = countStmt.get(id) as { count: number };

    // Delete tag (CASCADE handles todo_tags cleanup)
    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    const result = stmt.run(id);

    return {
      success: result.changes > 0,
      affectedTodos: count
    };
  },

  // Get tags for a specific todo
  getForTodo: (todoId: number, userId: number): Tag[] => {
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN todo_tags tt ON t.id = tt.tag_id
      JOIN todos td ON tt.todo_id = td.id
      WHERE tt.todo_id = ? AND td.user_id = ?
      ORDER BY t.created_at ASC
    `);
    return stmt.all(todoId, userId) as Tag[];
  },

  // Set tags for a todo (replace all)
  setForTodo: (todoId: number, userId: number, tagIds: number[]): Tag[] => {
    // Verify todo ownership
    const todoStmt = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?');
    const todo = todoStmt.get(todoId, userId);
    if (!todo) throw new Error('Todo not found');

    // Verify all tags belong to user
    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => '?').join(',');
      const checkStmt = db.prepare(`
        SELECT COUNT(*) as count FROM tags 
        WHERE user_id = ? AND id IN (${placeholders})
      `);
      const { count } = checkStmt.get(userId, ...tagIds) as { count: number };
      if (count !== tagIds.length) {
        throw new Error('One or more tag IDs are invalid');
      }
    }

    // Delete existing associations
    const deleteStmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ?');
    deleteStmt.run(todoId);

    // Insert new associations
    if (tagIds.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)
      `);
      for (const tagId of tagIds) {
        insertStmt.run(todoId, tagId);
      }
    }

    // Return updated tags
    return tagDB.getForTodo(todoId, userId);
  },

  // Get todos by tag
  getTodosByTag: (tagId: number, userId: number): number[] => {
    const stmt = db.prepare(`
      SELECT tt.todo_id 
      FROM todo_tags tt
      JOIN todos t ON tt.todo_id = t.id
      WHERE tt.tag_id = ? AND t.user_id = ?
      ORDER BY t.created_at DESC
    `);
    const results = stmt.all(tagId, userId) as { todo_id: number }[];
    return results.map(r => r.todo_id);
  }
};
```

## UI Components

### Component 1: TagManagementModal

```typescript
// components/TagManagementModal.tsx

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagManagementModal({ isOpen, onClose }: TagManagementModalProps) {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    const response = await fetch('/api/tags');
    if (response.ok) {
      const data = await response.json();
      setTags(data.tags);
    }
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error);
        return;
      }

      const created = await response.json();
      setTags(prev => [...prev, created]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setError(null);
    } catch (err) {
      setError('Failed to create tag');
    }
  };

  const startEdit = (tag: TagResponse) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const updateTag = async (id: number) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, color: editColor }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error);
        return;
      }

      const updated = await response.json();
      setTags(prev => prev.map(t => t.id === id ? updated : t));
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError('Failed to update tag');
    }
  };

  const deleteTag = async (id: number, name: string) => {
    const confirmed = confirm(`Delete tag "${name}"? It will be removed from all todos.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const error = await response.json();
        setError(error.error);
        return;
      }

      setTags(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete tag');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Manage Tags</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Create Tag Form */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Create New Tag</h3>
          <form onSubmit={createTag} className="flex gap-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g., Work, Personal)"
              maxLength={50}
              className="flex-1 bg-gray-900 px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-12 h-10 cursor-pointer rounded"
            />
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Create Tag
            </button>
          </form>
        </div>

        {/* Tag List */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Your Tags</h3>
          {tags.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No tags yet. Create your first one above!</p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  {editingId === tag.id ? (
                    // Edit Mode
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={50}
                        className="flex-1 bg-gray-800 px-3 py-1.5 rounded text-white text-sm"
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-8 cursor-pointer rounded"
                      />
                      <button
                        onClick={() => updateTag(tag.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-500"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <span
                        className="px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => startEdit(tag)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id, tag.name)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Component 2: TagSelector (For Todo Form)

```typescript
// components/TagSelector.tsx

interface TagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<TagResponse[]>([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const response = await fetch('/api/tags');
    if (response.ok) {
      const data = await response.json();
      setTags(data.tags);
    }
  };

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">Tags (optional)</label>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'text-white border-2 border-transparent'
                  : 'text-gray-400 bg-gray-900 border-2 border-gray-700 hover:border-gray-600'
              }`}
              style={isSelected ? { backgroundColor: tag.color } : {}}
            >
              {isSelected && <span className="mr-1">✓</span>}
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Component 3: TagPills (Display on Todo)

```typescript
// components/TagPills.tsx

interface TagPillsProps {
  tags: TagResponse[];
  className?: string;
}

export function TagPills({ tags, className = '' }: TagPillsProps) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map(tag => (
        <span
          key={tag.id}
          className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
```

### Component 4: TagFilter (Dropdown)

```typescript
// components/TagFilter.tsx

interface TagFilterProps {
  selectedTagId: number | null;
  onChange: (tagId: number | null) => void;
}

export function TagFilter({ selectedTagId, onChange }: TagFilterProps) {
  const [tags, setTags] = useState<TagResponse[]>([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const response = await fetch('/api/tags');
    if (response.ok) {
      const data = await response.json();
      setTags(data.tags);
    }
  };

  return (
    <div className="relative">
      <select
        value={selectedTagId || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="bg-gray-800 px-3 py-2 rounded-lg text-sm focus:outline-none appearance-none pr-8"
      >
        <option value="">All Tags</option>
        {tags.map(tag => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Edge Cases

### 1. Duplicate Tag Name (Case-Insensitive)
**Scenario**: User tries to create "work" when "Work" already exists
- **Expected**: 400 error "Tag name already exists"
- **Implementation**: `UNIQUE(user_id, name COLLATE NOCASE)` constraint
- **UI**: Show error message, don't create duplicate

### 2. Invalid Hex Color
**Scenario**: User enters "#GGG123" or "blue" as color
- **Expected**: 400 error "Invalid color format"
- **Validation**: Regex `/^#[0-9A-Fa-f]{6}$/`
- **UI**: Color picker prevents most invalid inputs

### 3. Tag Name Length
**Scenario**: User enters 51+ character tag name
- **Expected**: Client maxLength=50, server CHECK constraint fails
- **UI**: Input prevents typing beyond 50 chars
- **Error**: "Tag name must be 50 characters or less"

### 4. Deleting Tag Used on Many Todos
**Scenario**: User deletes "Work" tag applied to 50 todos
- **Expected**: All 50 todo_tags records deleted via CASCADE
- **Confirmation**: Dialog shows "This tag is used on X todos"
- **Response**: Returns `affectedTodos: 50` for user feedback

### 5. Cross-User Tag Access
**Scenario**: User A tries to apply User B's tag via API manipulation
- **Expected**: 400 error "Invalid tag ID"
- **Protection**: Verify tag belongs to authenticated user before association
- **SQL**: `WHERE user_id = ? AND id IN (...)`

### 6. Tag Filter with No Matches
**Scenario**: User filters by "Finance" but no todos have that tag
- **Expected**: Empty state "No todos match your filters"
- **Behavior**: Filter remains active, user can clear it
- **Other filters**: Can still combine with search/priority

### 7. Applying 10+ Tags to One Todo
**Scenario**: User selects 15 tags for a single todo
- **Expected**: All 15 tags applied successfully
- **UI**: Tags wrap to multiple lines on display
- **Performance**: Batch insert for multiple tag associations

### 8. Editing Tag Color While Todos Visible
**Scenario**: User changes "Work" from green to blue while viewing todo list
- **Expected**: All visible "Work" pills update color immediately
- **Implementation**: React state management propagates changes
- **No Refresh**: Color changes without page reload

### 9. Deleting Todo with Tags
**Scenario**: User deletes todo that has 3 tags
- **Expected**: 3 todo_tags junction records deleted via CASCADE
- **Tag Remains**: Tags themselves not deleted (only associations)
- **Reusable**: Tags available for other todos

### 10. Empty Tag Name
**Scenario**: User submits tag form with whitespace only
- **Expected**: Button disabled, no API call made
- **Client Validation**: `!newTagName.trim()`
- **Server Validation**: `CHECK(length(name) > 0)`

### 11. Tag Selection Persistence
**Scenario**: User selects tags in todo form, then cancels
- **Expected**: Tag selection resets when form cleared
- **State Management**: Clear `selectedTagIds` on form reset
- **No Save**: Tags not saved to database until todo created

### 12. Concurrent Tag Updates
**Scenario**: Two browser tabs open, user edits tag in both
- **Expected**: Last write wins (standard database behavior)
- **Timestamps**: `updated_at` reflects most recent change
- **Refresh**: Other tab shows stale data until refresh

## Acceptance Criteria

### Must Have (P0)
- [ ] Users can create tags with custom names (1-50 chars)
- [ ] Users can choose tag colors via color picker
- [ ] Hex color validation enforces #RRGGBB format
- [ ] Tag names must be unique per user (case-insensitive)
- [ ] Users can edit tag name and color
- [ ] Users can delete tags with confirmation dialog
- [ ] Tag deletion cascades to remove from all todos
- [ ] Users can apply multiple tags to a single todo
- [ ] Tags display as colored pills on todos
- [ ] Users can filter todos by tag selection
- [ ] Tag filter combines with other filters (search, priority)
- [ ] All API endpoints validate user ownership
- [ ] Default color #3B82F6 applied if none chosen

### Should Have (P1)
- [ ] Tag management modal shows all tags in one view
- [ ] Visual feedback (checkmark) shows selected tags
- [ ] Tag pills wrap responsively on mobile
- [ ] Delete confirmation shows number of affected todos
- [ ] Error messages display for validation failures
- [ ] Optimistic UI updates for tag operations
- [ ] Tags sorted by creation date consistently
- [ ] Empty states for "no tags yet"

### Nice to Have (P2)
- [ ] Recently used tags shown first in selector
- [ ] Tag usage count displayed in management modal
- [ ] Bulk tag operations (delete multiple)
- [ ] Tag search/filter in management modal
- [ ] Tag color presets (quick selection)
- [ ] Tag export/import with todos
- [ ] Tag analytics (most used, least used)
- [ ] Tag suggestions based on todo title

## Testing Requirements

### E2E Tests (Playwright)

#### Test File: `tests/06-tag-system.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Tag System', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setupAuthenticatedSession();
  });

  test('should create a new tag', async ({ page }) => {
    // Open tag management modal
    await page.click('button:has-text("Manage Tags")');
    await expect(page.locator('h2:has-text("Manage Tags")')).toBeVisible();

    // Create tag
    await page.fill('input[placeholder*="Tag name"]', 'Work');
    await page.fill('input[type="color"]', '#10B981');
    await page.click('button:has-text("Create Tag")');

    // Verify tag appears in list
    await expect(page.locator('text=Work')).toBeVisible();
    
    // Verify tag has correct color
    const tagPill = page.locator('span:has-text("Work")').first();
    const bgColor = await tagPill.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(16, 185, 129)'); // #10B981 in RGB
  });

  test('should prevent duplicate tag names', async ({ page }) => {
    await helper.createTag('Urgent', '#EF4444');

    // Try to create duplicate (case-insensitive)
    await page.click('button:has-text("Manage Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'urgent');
    await page.click('button:has-text("Create Tag")');

    // Verify error message
    await expect(page.locator('text=Tag name already exists')).toBeVisible();
  });

  test('should apply tags to todo', async ({ page }) => {
    await helper.createTag('Work', '#10B981');
    await helper.createTag('Urgent', '#EF4444');

    // Create todo with tags
    await page.fill('input[placeholder*="Add a new todo"]', 'Complete report');
    
    // Select tags
    await page.click('button:has-text("Work")');
    await page.click('button:has-text("Urgent")');
    
    // Verify checkmarks
    await expect(page.locator('button:has-text("Work") >> span:has-text("✓")')).toBeVisible();
    
    // Create todo
    await page.click('button:has-text("Add")');

    // Verify tags appear on todo
    await expect(page.locator('.todo-item:has-text("Complete report") >> span:has-text("Work")')).toBeVisible();
    await expect(page.locator('.todo-item:has-text("Complete report") >> span:has-text("Urgent")')).toBeVisible();
  });

  test('should edit tag color', async ({ page }) => {
    await helper.createTag('Finance', '#F59E0B');
    await helper.createTodoWithTags('Budget review', ['Finance']);

    // Edit tag color
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Edit")');
    await page.fill('input[type="color"]', '#10B981'); // Change to green
    await page.click('button:has-text("Update")');
    await page.click('button:has-text("Close")');

    // Verify color updated on todo
    const tagPill = page.locator('.todo-item >> span:has-text("Finance")');
    const bgColor = await tagPill.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(16, 185, 129)'); // New color
  });

  test('should delete tag with cascade', async ({ page }) => {
    await helper.createTag('Personal', '#3B82F6');
    await helper.createTodoWithTags('Buy groceries', ['Personal']);
    await helper.createTodoWithTags('Call dentist', ['Personal']);

    // Delete tag
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    
    // Verify tag removed from modal
    await expect(page.locator('span:has-text("Personal")').first()).not.toBeVisible();
    
    await page.click('button:has-text("Close")');

    // Verify tag removed from todos
    await expect(page.locator('.todo-item >> span:has-text("Personal")')).not.toBeVisible();
  });

  test('should filter todos by tag', async ({ page }) => {
    await helper.createTag('Work', '#10B981');
    await helper.createTag('Personal', '#3B82F6');
    
    await helper.createTodoWithTags('Office task', ['Work']);
    await helper.createTodoWithTags('Home task', ['Personal']);
    await helper.createTodoWithTags('Mixed task', ['Work', 'Personal']);

    // Filter by Work tag
    await page.selectOption('select:has-option("All Tags")', { label: 'Work' });

    // Verify only Work-tagged todos visible
    await expect(page.locator('text=Office task')).toBeVisible();
    await expect(page.locator('text=Mixed task')).toBeVisible();
    await expect(page.locator('text=Home task')).not.toBeVisible();

    // Clear filter
    await page.selectOption('select:has-option("All Tags")', { label: 'All Tags' });
    
    // Verify all todos visible again
    await expect(page.locator('text=Home task')).toBeVisible();
  });

  test('should enforce 50 character tag name limit', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    
    const longName = 'a'.repeat(51);
    await page.fill('input[placeholder*="Tag name"]', longName);
    
    // Verify input truncated to 50 chars
    const value = await page.inputValue('input[placeholder*="Tag name"]');
    expect(value.length).toBe(50);
  });

  test('should handle tag with no todos', async ({ page }) => {
    await helper.createTag('Unused', '#9CA3AF');
    
    // Filter by unused tag
    await page.selectOption('select:has-option("All Tags")', { label: 'Unused' });
    
    // Verify empty state
    await expect(page.locator('text=No todos match your filters')).toBeVisible();
  });

  test('should preserve tag selections when editing todo', async ({ page }) => {
    await helper.createTag('Work', '#10B981');
    await helper.createTag('Urgent', '#EF4444');
    await helper.createTodoWithTags('Task 1', ['Work']);

    // Edit todo
    await page.click('.todo-item:has-text("Task 1") >> button:has-text("Edit")');
    
    // Verify Work tag selected
    await expect(page.locator('button:has-text("Work") >> span:has-text("✓")')).toBeVisible();
    
    // Add Urgent tag
    await page.click('button:has-text("Urgent")');
    await page.click('button:has-text("Update")');

    // Verify both tags on todo
    await expect(page.locator('.todo-item:has-text("Task 1") >> span:has-text("Work")')).toBeVisible();
    await expect(page.locator('.todo-item:has-text("Task 1") >> span:has-text("Urgent")')).toBeVisible();
  });
});
```

### API Tests (Unit/Integration)

```typescript
// tests/api/tags.test.ts

describe('POST /api/tags', () => {
  it('should create tag with valid data', async () => {
    const response = await request(app)
      .post('/api/tags')
      .send({ name: 'Work', color: '#10B981' })
      .expect(201);

    expect(response.body.name).toBe('Work');
    expect(response.body.color).toBe('#10B981');
  });

  it('should apply default color if not provided', async () => {
    const response = await request(app)
      .post('/api/tags')
      .send({ name: 'Work' })
      .expect(201);

    expect(response.body.color).toBe('#3B82F6');
  });

  it('should reject duplicate tag name', async () => {
    await createTag({ name: 'Work' });
    
    await request(app)
      .post('/api/tags')
      .send({ name: 'work' }) // Case-insensitive
      .expect(400);
  });

  it('should reject invalid hex color', async () => {
    await request(app)
      .post('/api/tags')
      .send({ name: 'Work', color: '#GGG' })
      .expect(400);
  });
});

describe('PUT /api/tags/:id', () => {
  it('should update tag name', async () => {
    const tag = await createTag({ name: 'Wrk', color: '#10B981' });
    
    const response = await request(app)
      .put(`/api/tags/${tag.id}`)
      .send({ name: 'Work' })
      .expect(200);

    expect(response.body.name).toBe('Work');
    expect(response.body.color).toBe('#10B981'); // Unchanged
  });

  it('should prevent duplicate name on update', async () => {
    await createTag({ name: 'Work' });
    const tag2 = await createTag({ name: 'Personal' });
    
    await request(app)
      .put(`/api/tags/${tag2.id}`)
      .send({ name: 'Work' })
      .expect(400);
  });
});

describe('DELETE /api/tags/:id', () => {
  it('should cascade delete tag associations', async () => {
    const tag = await createTag({ name: 'Work' });
    const todo1 = await createTodo({ title: 'Task 1' });
    const todo2 = await createTodo({ title: 'Task 2' });
    
    await associateTag(todo1.id, tag.id);
    await associateTag(todo2.id, tag.id);

    const response = await request(app)
      .delete(`/api/tags/${tag.id}`)
      .expect(200);

    expect(response.body.affectedTodos).toBe(2);

    // Verify associations deleted
    const associations = await db.prepare(
      'SELECT * FROM todo_tags WHERE tag_id = ?'
    ).all(tag.id);
    expect(associations.length).toBe(0);
  });
});

describe('PUT /api/todos/:id/tags', () => {
  it('should replace all tags for todo', async () => {
    const todo = await createTodo({ title: 'Task' });
    const tag1 = await createTag({ name: 'Old' });
    const tag2 = await createTag({ name: 'New' });
    
    await associateTag(todo.id, tag1.id);

    const response = await request(app)
      .put(`/api/todos/${todo.id}/tags`)
      .send({ tagIds: [tag2.id] })
      .expect(200);

    expect(response.body.tags.length).toBe(1);
    expect(response.body.tags[0].name).toBe('New');
  });

  it('should reject invalid tag IDs', async () => {
    const todo = await createTodo({ title: 'Task' });
    
    await request(app)
      .put(`/api/todos/${todo.id}/tags`)
      .send({ tagIds: [99999] })
      .expect(400);
  });
});
```

## Out of Scope

The following features are **explicitly excluded** from this PRP:

1. **Tag Hierarchies**: No parent/child tag relationships (flat structure only)
2. **Tag Aliases**: No multiple names for the same tag
3. **Tag Descriptions**: No long-form explanations or notes on tags
4. **Tag Icons**: Text-only labels (no custom icons or emojis)
5. **Tag Permissions**: No shared or public tags (user-specific only)
6. **Tag Analytics**: No usage statistics or trend reports
7. **Tag Suggestions**: No AI-powered tag recommendations
8. **Tag Groups**: No tag categories or folders
9. **Tag Rules**: No automatic tag application based on title/content
10. **Tag Shortcuts**: No keyboard shortcuts for quick tag application
11. **Tag Search**: No full-text search within tag names (dropdown only)
12. **Tag Import**: No bulk import from CSV or other formats
13. **Tag History**: No audit log of tag changes
14. **Tag Sorting**: No custom sort order (creation date only)
15. **Tag Limits**: No maximum tags per user (unlimited)

## Success Metrics

### Quantitative Metrics
- **Adoption Rate**: 50%+ of users create at least one tag within 14 days
- **Tag Usage**: Average 3-5 tags per user
- **Tagged Todos**: 40%+ of todos have at least one tag
- **Filter Usage**: Tag filter used in 30%+ of sessions
- **Performance**: Tag operations complete in <100ms (p95)

### Qualitative Metrics
- **User Satisfaction**: Positive feedback on tag organization in surveys
- **Feature Requests**: Reduced requests for "categorization" or "labels"
- **Usability**: <5% support tickets related to tag confusion
- **Visual Appeal**: Positive comments on color-coded pill design

### Technical Metrics
- **Data Integrity**: 0 orphaned todo_tags records (CASCADE works 100%)
- **Query Performance**: Tag filtering adds <50ms to query time
- **Database Size**: todo_tags table remains efficient at scale
- **API Response**: All tag endpoints return in <200ms (p99)

### Business Metrics
- **Engagement**: Users with tags have 20%+ higher DAU
- **Retention**: Users who create 3+ tags have 15%+ better 30-day retention
- **Feature Parity**: Matches tag capabilities of Todoist, TickTick, Any.do

---

## Implementation Checklist

### Phase 1: Database & Backend (Week 1)
- [ ] Create `tags` table with constraints
- [ ] Create `todo_tags` junction table
- [ ] Add indexes for performance
- [ ] Implement `tagDB` CRUD operations
- [ ] Add TypeScript interfaces
- [ ] Create all 6 API routes
- [ ] Add validation middleware
- [ ] Test CASCADE delete behavior
- [ ] Write unit tests for DB operations

### Phase 2: Tag Management (Week 2)
- [ ] Build `TagManagementModal` component
- [ ] Implement create tag form
- [ ] Add edit/delete functionality
- [ ] Add error handling and display
- [ ] Style modal to match design system
- [ ] Add color picker validation
- [ ] Test duplicate name prevention
- [ ] Implement optimistic updates

### Phase 3: Tag Application (Week 3)
- [ ] Build `TagSelector` component
- [ ] Integrate into todo create form
- [ ] Integrate into todo edit modal
- [ ] Add visual feedback (checkmarks)
- [ ] Create `TagPills` display component
- [ ] Add to todo list items
- [ ] Test multiple tag selection
- [ ] Handle tag state management

### Phase 4: Filtering & Polish (Week 4)
- [ ] Build `TagFilter` dropdown component
- [ ] Integrate with existing filter system
- [ ] Test combined filters (tag + search + priority)
- [ ] Add "filtered by" indicator
- [ ] Performance optimization (memoization)
- [ ] Write Playwright E2E tests
- [ ] Accessibility audit (ARIA, keyboard nav)
- [ ] Update USER_GUIDE.md
- [ ] Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Owner**: Development Team  
**Status**: Ready for Implementation
