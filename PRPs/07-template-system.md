# PRP 07: Template System

## Feature Overview

The Template System allows users to save frequently used todo patterns (including title, description, priority, recurrence, reminders, tags, and subtasks) for quick reuse. Templates eliminate repetitive data entry for common tasks and workflows. Templates support due date offset calculation (e.g., "Due 3 days from creation") and organize saved patterns by optional categories.

**Key Capabilities:**
- Save existing todos as reusable templates
- Create todos from templates with automatic due date calculation
- Store subtasks as JSON-serialized arrays
- Organize templates by category (Work, Personal, Fitness, etc.)
- Edit and delete templates
- Quick template selection UI

**Technical Foundation:**
- New `templates` table with JSON subtasks column
- API endpoints for template CRUD and instantiation
- Template management UI in main todo page
- Due date offset calculation using Singapore timezone

---

## User Stories

### Primary Users

**Sarah - Project Manager**
> "I create weekly standup meeting todos every Monday with the same subtasks (prepare agenda, share notes, update tickets). I want to save this as a template so I can create it with one click instead of manually adding subtasks each week."

**Alex - Fitness Enthusiast**
> "My workout routine has recurring tasks like 'Gym Day' with specific exercises as subtasks. I want templates for different workout types (Leg Day, Cardio Day, Strength Day) that I can quickly schedule throughout the week."

**Jordan - Content Creator**
> "I publish blog posts regularly with a checklist (research, draft, edit, publish, promote). I need a 'Blog Post' template with these subtasks and a 7-day due date offset so I can plan multiple posts ahead."

---

## User Flow

### Flow 1: Creating a Template from Existing Todo

1. User creates a todo with title, description, priority, tags, and subtasks
2. User clicks "Save as Template" button on the todo card
3. Modal appears prompting for:
   - Template name (pre-filled with todo title)
   - Category (optional dropdown: Work, Personal, Fitness, etc.)
   - Due date offset in days (optional, e.g., "3" for 3 days from creation)
4. User confirms, system saves template with serialized subtasks JSON
5. Success toast: "Template 'Weekly Report' created"
6. Template appears in template management section

### Flow 2: Creating a Todo from Template

1. User opens "Templates" section (expandable panel or modal)
2. Templates displayed as cards grouped by category
3. User clicks "Use Template" button on desired template
4. System creates new todo:
   - Copies title, description, priority, recurrence, reminder offset
   - Deserializes subtasks JSON and creates subtask records
   - Copies associated tags
   - Calculates due date from offset (if specified)
5. New todo appears in todo list with all attributes
6. Success toast: "Todo created from 'Gym Day' template"

### Flow 3: Managing Templates

1. User opens template management interface
2. For each template, user can:
   - **Edit**: Modify name, category, description, default priority, due offset
   - **Delete**: Remove template (confirmation required)
   - **Preview**: View template details without creating todo
3. Changes save immediately with optimistic UI updates
4. Deleted templates removed from list instantly

---

## Technical Requirements

### Database Schema

**New Table: `templates`**

```sql
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,              -- Optional: "Work", "Personal", "Fitness", etc.
  priority TEXT DEFAULT 'medium',
  recurrence_pattern TEXT,    -- 'daily', 'weekly', 'monthly', 'yearly', NULL
  reminder_minutes INTEGER,   -- Minutes before due date (or NULL)
  due_date_offset_days INTEGER, -- Days from creation (or NULL for no due date)
  subtasks_json TEXT,         -- JSON array: [{"title": "Task 1", "position": 0}, ...]
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
```

**Relationships:**
- Templates ↔ Tags: Many-to-many via new `template_tags` table
- Templates → Todos: One-to-many (virtual, via instantiation)

**New Table: `template_tags`**

```sql
CREATE TABLE IF NOT EXISTS template_tags (
  template_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (template_id, tag_id),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### TypeScript Types

**Add to `lib/db.ts`:**

```typescript
export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  due_date_offset_days: number | null;
  subtasks_json: string | null; // JSON string
  created_at: string;
}

export interface TemplateWithTags extends Template {
  tags: Tag[];
}

export interface TemplateSubtask {
  title: string;
  position: number;
}
```

### API Endpoints

#### **POST /api/templates**
Create new template from existing todo or manually.

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  category?: string;
  priority: Priority;
  recurrence_pattern?: RecurrencePattern;
  reminder_minutes?: number;
  due_date_offset_days?: number;
  subtasks?: TemplateSubtask[]; // Will be JSON.stringified
  tag_ids?: number[];
}
```

**Response:** `201 Created`
```typescript
{
  template: TemplateWithTags;
}
```

**Validation:**
- `name` required, 1-200 chars
- `category` max 50 chars
- `due_date_offset_days` must be positive integer if provided
- `subtasks` array validated before JSON serialization

---

#### **GET /api/templates**
Retrieve all templates for authenticated user.

**Query Parameters:**
- `category` (optional): Filter by category

**Response:** `200 OK`
```typescript
{
  templates: TemplateWithTags[];
}
```

**Sorting:** By `created_at DESC` (newest first)

---

#### **GET /api/templates/[id]**
Get single template details.

**Response:** `200 OK`
```typescript
{
  template: TemplateWithTags;
  subtasks: TemplateSubtask[]; // Parsed from subtasks_json
}
```

---

#### **PUT /api/templates/[id]**
Update template details.

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  category?: string;
  priority?: Priority;
  recurrence_pattern?: RecurrencePattern;
  reminder_minutes?: number;
  due_date_offset_days?: number;
  subtasks?: TemplateSubtask[];
  tag_ids?: number[];
}
```

**Response:** `200 OK`
```typescript
{
  template: TemplateWithTags;
}
```

---

#### **DELETE /api/templates/[id]**
Delete template.

**Response:** `204 No Content`

---

#### **POST /api/templates/[id]/use**
Create todo from template.

**Request Body:**
```typescript
{
  adjust_due_date?: boolean; // Default true
  custom_due_date?: string; // ISO 8601, overrides offset calculation
}
```

**Response:** `201 Created`
```typescript
{
  todo: TodoWithSubtasksAndTags;
  message: string; // e.g., "Todo created from template 'Weekly Report'"
}
```

**Logic:**
1. Fetch template with tags
2. Calculate due date:
   - If `custom_due_date` provided: use it
   - Else if `due_date_offset_days` exists: `getSingaporeNow() + offset days`
   - Else: `null`
3. Create todo with template attributes
4. Parse `subtasks_json`, create subtask records linked to new todo
5. Copy template tags to todo
6. Return complete todo object

---

### Database Operations (`lib/db.ts`)

**Add `templateDB` object:**

```typescript
export const templateDB = {
  create: (template: Omit<Template, 'id' | 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO templates 
      (user_id, name, description, category, priority, recurrence_pattern, 
       reminder_minutes, due_date_offset_days, subtasks_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      template.user_id,
      template.name,
      template.description,
      template.category,
      template.priority,
      template.recurrence_pattern,
      template.reminder_minutes,
      template.due_date_offset_days,
      template.subtasks_json
    );
    return templateDB.getById(template.user_id, Number(info.lastInsertRowid));
  },

  getById: (userId: number, templateId: number): Template | null => {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?');
    return stmt.get(templateId, userId) as Template | null;
  },

  getAll: (userId: number, category?: string): Template[] => {
    if (category) {
      const stmt = db.prepare(
        'SELECT * FROM templates WHERE user_id = ? AND category = ? ORDER BY created_at DESC'
      );
      return stmt.all(userId, category) as Template[];
    }
    const stmt = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Template[];
  },

  update: (userId: number, templateId: number, updates: Partial<Template>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'user_id' && k !== 'created_at');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = db.prepare(`UPDATE templates SET ${setClause} WHERE id = ? AND user_id = ?`);
    stmt.run(...values, templateId, userId);
    return templateDB.getById(userId, templateId);
  },

  delete: (userId: number, templateId: number) => {
    const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?');
    stmt.run(templateId, userId);
  },

  addTag: (templateId: number, tagId: number) => {
    const stmt = db.prepare('INSERT OR IGNORE INTO template_tags (template_id, tag_id) VALUES (?, ?)');
    stmt.run(templateId, tagId);
  },

  removeTag: (templateId: number, tagId: number) => {
    const stmt = db.prepare('DELETE FROM template_tags WHERE template_id = ? AND tag_id = ?');
    stmt.run(templateId, tagId);
  },

  getTags: (templateId: number): Tag[] => {
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN template_tags tt ON t.id = tt.tag_id
      WHERE tt.template_id = ?
    `);
    return stmt.all(templateId) as Tag[];
  },
};
```

---

## UI Components

### Template Management Section

**Location:** `app/page.tsx` (within main todo page, after todo list)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Template, TemplateWithTags, TemplateSubtask, Priority, RecurrencePattern } from '@/lib/db';
import { getSingaporeNow, addDays, formatSingaporeDate } from '@/lib/timezone';

interface TemplateCardProps {
  template: TemplateWithTags;
  onUse: (templateId: number) => void;
  onEdit: (templateId: number) => void;
  onDelete: (templateId: number) => void;
}

function TemplateCard({ template, onUse, onEdit, onDelete }: TemplateCardProps) {
  const subtasks: TemplateSubtask[] = template.subtasks_json 
    ? JSON.parse(template.subtasks_json) 
    : [];

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
      {/* Category Badge */}
      {template.category && (
        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800 mb-2">
          {template.category}
        </span>
      )}

      {/* Template Name */}
      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>

      {/* Description */}
      {template.description && (
        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
      )}

      {/* Priority Badge */}
      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mt-2 ${priorityColors[template.priority]}`}>
        {template.priority.toUpperCase()}
      </span>

      {/* Metadata */}
      <div className="mt-3 space-y-1 text-xs text-gray-500">
        {template.recurrence_pattern && (
          <div>🔄 Recurs: {template.recurrence_pattern}</div>
        )}
        {template.due_date_offset_days && (
          <div>📅 Due: {template.due_date_offset_days} days after creation</div>
        )}
        {template.reminder_minutes && (
          <div>⏰ Reminder: {template.reminder_minutes} min before due</div>
        )}
        {subtasks.length > 0 && (
          <div>✓ {subtasks.length} subtasks</div>
        )}
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.map(tag => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-xs rounded"
              style={{ backgroundColor: tag.color, color: '#fff' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onUse(template.id)}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          Use Template
        </button>
        <button
          onClick={() => onEdit(template.id)}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<TemplateWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? '/api/templates'
        : `/api/templates?category=${selectedCategory}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjust_due_date: true }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message); // Or use toast notification
        // Trigger todo list refresh in parent component
      }
    } catch (error) {
      console.error('Failed to create todo from template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Delete this template?')) return;

    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Templates</h2>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as string)}
            className={`px-3 py-1.5 text-sm rounded ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {loading ? (
        <div>Loading templates...</div>
      ) : templates.length === 0 ? (
        <p className="text-gray-500">No templates yet. Save a todo as a template to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUseTemplate}
              onEdit={(id) => {/* Open edit modal */}}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### "Save as Template" Button on Todo Card

**Add to todo card component:**

```tsx
<button
  onClick={() => handleSaveAsTemplate(todo)}
  className="px-2 py-1 text-xs border border-purple-300 text-purple-600 rounded hover:bg-purple-50"
  title="Save as template"
>
  💾 Save as Template
</button>
```

**Handler function:**

```tsx
const handleSaveAsTemplate = async (todo: TodoWithSubtasksAndTags) => {
  const templateName = prompt('Template name:', todo.title);
  if (!templateName) return;

  const category = prompt('Category (optional):', '');

  const subtasksJson = JSON.stringify(
    todo.subtasks.map(st => ({ title: st.title, position: st.position }))
  );

  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName,
        description: todo.description,
        category: category || null,
        priority: todo.priority,
        recurrence_pattern: todo.recurrence_pattern,
        reminder_minutes: todo.reminder_minutes,
        due_date_offset_days: null, // User can edit later
        subtasks: todo.subtasks.map(st => ({ title: st.title, position: st.position })),
        tag_ids: todo.tags.map(t => t.id),
      }),
    });

    if (res.ok) {
      alert(`Template "${templateName}" created!`);
    }
  } catch (error) {
    console.error('Failed to create template:', error);
  }
};
```

---

## Edge Cases

### 1. Empty Subtasks Array
**Scenario:** User saves template from todo with no subtasks.
**Handling:** Store `null` or `"[]"` in `subtasks_json`. When instantiating, skip subtask creation.

```typescript
const subtasksJson = subtasks.length > 0 ? JSON.stringify(subtasks) : null;
```

### 2. Invalid JSON in subtasks_json
**Scenario:** Database corruption or manual editing causes malformed JSON.
**Handling:** Wrap JSON parsing in try-catch, default to empty array.

```typescript
let subtasks: TemplateSubtask[] = [];
try {
  subtasks = template.subtasks_json ? JSON.parse(template.subtasks_json) : [];
} catch (error) {
  console.error('Invalid subtasks JSON:', error);
  subtasks = [];
}
```

### 3. Due Date Offset with No Due Date
**Scenario:** Template has `due_date_offset_days = 0`.
**Handling:** Treat `0` as valid (due today). Use `null` for no due date.

```typescript
if (template.due_date_offset_days !== null) {
  const baseDate = getSingaporeNow();
  dueDate = addDays(baseDate, template.due_date_offset_days);
}
```

### 4. Custom Due Date Overrides Offset
**Scenario:** User provides `custom_due_date` when using template.
**Handling:** Custom date takes precedence. Validate ISO 8601 format.

```typescript
if (custom_due_date) {
  dueDate = new Date(custom_due_date);
  if (isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: 'Invalid custom_due_date' }, { status: 400 });
  }
} else if (template.due_date_offset_days !== null) {
  dueDate = addDays(getSingaporeNow(), template.due_date_offset_days);
}
```

### 5. Template with Deleted Tags
**Scenario:** Template references tags that have been deleted.
**Handling:** Use `LEFT JOIN` in query, filter out null tags.

```typescript
const tags = templateDB.getTags(templateId).filter(tag => tag !== null);
```

### 6. Large Subtasks Array (100+ items)
**Scenario:** User creates template with excessive subtasks.
**Handling:** 
- Impose limit (e.g., 50 subtasks max) in validation
- Return error if exceeded

```typescript
if (subtasks.length > 50) {
  return NextResponse.json({ error: 'Maximum 50 subtasks allowed' }, { status: 400 });
}
```

### 7. Concurrent Template Usage
**Scenario:** User clicks "Use Template" multiple times rapidly.
**Handling:** Disable button during request, or use debouncing.

```tsx
const [isCreating, setIsCreating] = useState(false);

const handleUseTemplate = async (templateId: number) => {
  if (isCreating) return;
  setIsCreating(true);
  try {
    // ... API call
  } finally {
    setIsCreating(false);
  }
};
```

### 8. Template Name Conflicts
**Scenario:** Multiple templates with same name but different categories.
**Handling:** Allow duplicates (templates have unique IDs). Display category in UI for disambiguation.

### 9. Null/Undefined Reminder Minutes
**Scenario:** Template has `reminder_minutes = null`.
**Handling:** When creating todo, skip reminder setup.

```typescript
reminder_minutes: template.reminder_minutes ?? null
```

### 10. Singapore Timezone in Due Date Calculation
**Scenario:** User in different timezone uses template with offset.
**Handling:** Always use `getSingaporeNow()` + offset, regardless of user's system timezone.

```typescript
import { getSingaporeNow, addDays } from '@/lib/timezone';

const dueDate = addDays(getSingaporeNow(), template.due_date_offset_days);
```

---

## Acceptance Criteria

### Functional Requirements

✅ **Template Creation**
- [ ] User can save existing todo as template via "Save as Template" button
- [ ] Template stores: name, description, category, priority, recurrence, reminder, due offset, subtasks (JSON), tags
- [ ] Subtasks serialized as JSON array: `[{"title": "...", "position": 0}, ...]`
- [ ] Template creation returns 201 with created template object
- [ ] Validation: name required (1-200 chars), category max 50 chars

✅ **Template Retrieval**
- [ ] GET /api/templates returns all user's templates sorted by created_at DESC
- [ ] Optional category filter works correctly
- [ ] Each template includes associated tags
- [ ] Subtasks JSON parsed into TemplateSubtask[] array

✅ **Template Instantiation**
- [ ] POST /api/templates/[id]/use creates new todo with all template attributes
- [ ] Due date calculated correctly:
  - Custom due date takes precedence if provided
  - Else uses `due_date_offset_days` + getSingaporeNow()
  - Else null (no due date)
- [ ] Subtasks created with correct titles and positions
- [ ] Tags copied to new todo via todo_tags table
- [ ] Returns 201 with complete todo object (TodoWithSubtasksAndTags)

✅ **Template Editing**
- [ ] PUT /api/templates/[id] updates specified fields only
- [ ] Can modify: name, description, category, priority, recurrence, reminder, due offset, subtasks, tags
- [ ] Subtasks re-serialized to JSON if updated
- [ ] Returns updated template object

✅ **Template Deletion**
- [ ] DELETE /api/templates/[id] removes template and template_tags entries (CASCADE)
- [ ] Returns 204 No Content
- [ ] Does not affect existing todos created from template

✅ **UI Requirements**
- [ ] Template management section displays templates as cards grouped by category
- [ ] Each card shows: name, description, priority badge, metadata (recurrence, due offset, reminder, subtask count), tags
- [ ] "Use Template" button creates todo and shows success message
- [ ] "Edit" button opens modal with editable fields
- [ ] "Delete" button shows confirmation dialog
- [ ] Category filter buttons work correctly

✅ **Singapore Timezone**
- [ ] Due date offset calculation uses `getSingaporeNow()` from lib/timezone.ts
- [ ] All timestamps stored in Singapore timezone (ISO 8601 with +08:00)

---

## Testing Requirements

### E2E Tests (Playwright)

**Test File:** `tests/07-template-system.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { authenticateUser } from './helpers';

test.describe('Template System', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/');
  });

  test('should create template from existing todo', async ({ page }) => {
    // Create todo with subtasks and tags
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder="Todo title"]', 'Weekly Report');
    await page.fill('textarea[placeholder="Description"]', 'Submit team progress report');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Add Subtask")');
    await page.fill('input[placeholder="Subtask title"]', 'Collect updates from team');
    await page.click('button:has-text("Create")');

    // Save as template
    await page.click('button:has-text("Save as Template")');
    await page.fill('input[placeholder="Template name"]', 'Weekly Report Template');
    await page.fill('input[placeholder="Category"]', 'Work');
    await page.click('button:has-text("Save Template")');

    // Verify template appears in list
    await page.click('button:has-text("Templates")');
    await expect(page.locator('text=Weekly Report Template')).toBeVisible();
  });

  test('should create todo from template with due date offset', async ({ page }) => {
    // Assume template exists with 3-day offset
    await page.click('button:has-text("Templates")');
    await page.click('button:has-text("Use Template")');

    // Verify new todo created with calculated due date
    const dueDateText = await page.locator('.todo-card').first().locator('.due-date').textContent();
    // Due date should be 3 days from now (validate format)
    expect(dueDateText).toContain('Due:');
  });

  test('should edit template name and category', async ({ page }) => {
    await page.click('button:has-text("Templates")');
    await page.click('button:has-text("Edit")');
    await page.fill('input[name="name"]', 'Updated Template Name');
    await page.selectOption('select[name="category"]', 'Personal');
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Updated Template Name')).toBeVisible();
    await expect(page.locator('text=Personal')).toBeVisible();
  });

  test('should delete template with confirmation', async ({ page }) => {
    await page.click('button:has-text("Templates")');
    
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation
    await page.click('button:has-text("Delete")');

    // Template should disappear
    await expect(page.locator('.template-card')).toHaveCount(0);
  });

  test('should handle template with no subtasks', async ({ page }) => {
    // Create template without subtasks
    await page.click('button:has-text("Save as Template")');
    await page.fill('input[placeholder="Template name"]', 'Simple Template');
    await page.click('button:has-text("Save Template")');

    // Use template
    await page.click('button:has-text("Templates")');
    await page.click('button:has-text("Use Template")');

    // Verify todo created without errors
    await expect(page.locator('text=Simple Template')).toBeVisible();
  });

  test('should filter templates by category', async ({ page }) => {
    await page.click('button:has-text("Templates")');
    await page.click('button:has-text("Work")');

    // Only work templates visible
    const cards = page.locator('.template-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('text=Work')).toBeVisible();
    }
  });

  test('should copy tags to todo when using template', async ({ page }) => {
    // Assume template has tags "urgent" and "team"
    await page.click('button:has-text("Templates")');
    await page.click('button:has-text("Use Template")');

    // Verify tags appear on new todo
    await expect(page.locator('.tag:has-text("urgent")')).toBeVisible();
    await expect(page.locator('.tag:has-text("team")')).toBeVisible();
  });

  test('should handle custom due date override', async ({ page }) => {
    await page.click('button:has-text("Templates")');
    await page.click('button:has-text("Use Template")');
    
    // Select custom due date in modal
    await page.fill('input[type="date"]', '2025-12-31');
    await page.click('button:has-text("Create Todo")');

    // Verify custom due date used
    await expect(page.locator('text=Due: 2025-12-31')).toBeVisible();
  });
});
```

### Unit Tests

**Test File:** `lib/__tests__/template-db.test.ts`

```typescript
import { templateDB, Priority } from '../db';

describe('Template Database Operations', () => {
  test('should create template with serialized subtasks', () => {
    const subtasks = [
      { title: 'Step 1', position: 0 },
      { title: 'Step 2', position: 1 },
    ];

    const template = templateDB.create({
      user_id: 1,
      name: 'Test Template',
      description: 'Description',
      category: 'Work',
      priority: 'medium',
      recurrence_pattern: null,
      reminder_minutes: null,
      due_date_offset_days: 3,
      subtasks_json: JSON.stringify(subtasks),
    });

    expect(template.name).toBe('Test Template');
    expect(template.subtasks_json).toContain('Step 1');
  });

  test('should retrieve templates by category', () => {
    templateDB.create({ user_id: 1, name: 'Work Template', category: 'Work', priority: 'high', subtasks_json: null });
    templateDB.create({ user_id: 1, name: 'Personal Template', category: 'Personal', priority: 'low', subtasks_json: null });

    const workTemplates = templateDB.getAll(1, 'Work');
    expect(workTemplates.length).toBe(1);
    expect(workTemplates[0].name).toBe('Work Template');
  });

  test('should handle null subtasks_json', () => {
    const template = templateDB.create({
      user_id: 1,
      name: 'No Subtasks',
      category: null,
      priority: 'medium',
      recurrence_pattern: null,
      reminder_minutes: null,
      due_date_offset_days: null,
      subtasks_json: null,
    });

    expect(template.subtasks_json).toBeNull();
  });

  test('should delete template cascades to template_tags', () => {
    const template = templateDB.create({ user_id: 1, name: 'Test', category: null, priority: 'medium', subtasks_json: null });
    templateDB.addTag(template.id, 1);

    templateDB.delete(1, template.id);

    const tags = templateDB.getTags(template.id);
    expect(tags.length).toBe(0);
  });
});
```

---

## Out of Scope

The following are **explicitly excluded** from this feature:

❌ **Template Sharing/Public Templates**
- Users cannot share templates with other users
- No public template library or marketplace
- Each template belongs to single user

❌ **Template Versioning**
- No history or version control for template edits
- Cannot rollback to previous template state

❌ **Conditional Template Logic**
- No "if-then" rules in templates (e.g., "if high priority, add extra subtask")
- No dynamic subtask generation based on context

❌ **Template Preview Before Use**
- No detailed preview modal showing exactly how todo will look
- (Could be added in future iteration)

❌ **Bulk Template Actions**
- Cannot create multiple todos from one template at once
- No batch template operations (duplicate, merge, etc.)

❌ **Template Import/Export**
- Templates not included in todo export/import JSON
- No standalone template backup file

❌ **AI-Suggested Templates**
- No machine learning recommendations based on usage patterns
- No automatic template creation from frequently repeated todos

---

## Success Metrics

### Quantitative Metrics

1. **Template Adoption Rate**
   - Target: 60% of active users create at least 1 template within 30 days
   - Measurement: `COUNT(DISTINCT user_id) FROM templates / total_active_users`

2. **Template Usage Frequency**
   - Target: Average 5 todos created from templates per user per month
   - Measurement: Track `POST /api/templates/[id]/use` calls per user

3. **Time Savings**
   - Target: 30% reduction in average time to create complex todos (with subtasks)
   - Measurement: Compare time-to-create before/after template feature launch

4. **Template Diversity**
   - Target: Average 3+ distinct categories per user
   - Measurement: `AVG(COUNT(DISTINCT category)) GROUP BY user_id`

5. **Subtask Complexity**
   - Target: Templates average 3+ subtasks each
   - Measurement: Parse `subtasks_json` and calculate average array length

### Qualitative Metrics

1. **User Feedback**
   - Collect feedback via in-app survey: "How useful are templates?"
   - Target: 80% rate 4/5 or 5/5 stars

2. **Feature Discovery**
   - Track how users learn about templates (onboarding tooltip, organic discovery)
   - Target: 50% discover via organic exploration

3. **Template Quality**
   - Monitor template names for meaningful patterns (not "Test Template 1")
   - Target: 70% of templates have descriptive names and categories

### Technical Metrics

1. **API Performance**
   - `POST /api/templates/[id]/use` response time < 200ms (p95)
   - Database query time for subtask deserialization < 50ms

2. **Error Rate**
   - Template creation/usage error rate < 1%
   - Zero critical errors (500 responses)

3. **Data Integrity**
   - 100% of `subtasks_json` fields contain valid JSON or null
   - Zero orphaned records in `template_tags` table

---

## Implementation Checklist

### Backend (API + Database)

- [ ] Add `templates` and `template_tags` tables to database schema in `lib/db.ts`
- [ ] Create `templateDB` object with CRUD methods
- [ ] Implement `POST /api/templates` (create template)
- [ ] Implement `GET /api/templates` (list templates with optional category filter)
- [ ] Implement `GET /api/templates/[id]` (get single template)
- [ ] Implement `PUT /api/templates/[id]` (update template)
- [ ] Implement `DELETE /api/templates/[id]` (delete template)
- [ ] Implement `POST /api/templates/[id]/use` (instantiate todo from template)
- [ ] Add TypeScript types: `Template`, `TemplateWithTags`, `TemplateSubtask`
- [ ] Handle subtasks JSON serialization/deserialization
- [ ] Implement due date offset calculation using Singapore timezone
- [ ] Add validation for template fields (name length, subtask count, etc.)

### Frontend (UI Components)

- [ ] Add "Save as Template" button to todo cards
- [ ] Create template creation modal/dialog
- [ ] Build template management section (grid of template cards)
- [ ] Implement category filter UI
- [ ] Add "Use Template", "Edit", "Delete" buttons to template cards
- [ ] Create template edit modal
- [ ] Implement optimistic UI updates for template operations
- [ ] Add loading states for template fetching
- [ ] Display subtask count and metadata on template cards
- [ ] Show tags on template cards with color coding

### Testing

- [ ] Write Playwright E2E tests for all user flows
- [ ] Add unit tests for `templateDB` operations
- [ ] Test JSON serialization/deserialization edge cases
- [ ] Verify Singapore timezone handling in due date calculations
- [ ] Test validation error handling (invalid input)
- [ ] Test CASCADE delete behavior (template deletion removes template_tags)

### Documentation

- [ ] Update `USER_GUIDE.md` with template system instructions
- [ ] Add API documentation for template endpoints
- [ ] Document subtasks JSON schema format
- [ ] Add inline code comments for complex logic (due date offset calculation)

---

**Last Updated:** November 13, 2025
**Status:** Ready for Implementation
**Estimated Effort:** 8-10 hours (backend + frontend + testing)
