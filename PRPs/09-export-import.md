# PRP 09: Export & Import

## Feature Overview

The Export & Import system enables users to backup and restore their entire todo collection, including all related data (subtasks, tags, templates) in a portable JSON format. The system handles ID remapping on import to prevent conflicts, preserves all relationships between entities, and validates data integrity throughout the process. This feature is essential for data portability, backup/recovery, migration between devices, and sharing todo collections.

**Key Capabilities:**
- Export all todos with subtasks, tags, and templates to JSON file
- Import JSON data with automatic ID remapping
- Preserve all relationships (todos↔subtasks, todos↔tags, templates↔tags)
- Validate data structure and integrity before import
- Handle duplicate names and merge conflicts
- Support partial imports (choose what to import)
- Track import statistics and report errors

**Technical Foundation:**
- Client-side JSON generation for export
- Server-side transaction processing for import
- ID remapping algorithm to prevent conflicts
- Relationship graph preservation
- Data validation with detailed error reporting
- Rollback on import failure

---

## User Stories

### Primary Users

**Emma - Power User Migrating Devices**
> "I'm switching from my work laptop to a new device. I want to export all my todos, templates, and tags, then import them on my new computer without losing any data or relationships between items."

**Liam - Backup Enthusiast**
> "Every Friday, I want to download a complete backup of my todo data as a JSON file. If something goes wrong, I need to be able to restore my data exactly as it was."

**Sophia - Team Collaborator**
> "I've created a set of project templates with associated tags that my team could benefit from. I want to export just my templates and tags, then share the JSON file so teammates can import them."

**Noah - Data Migration User**
> "I'm consolidating data from multiple accounts. I need to import todos from different JSON files without creating duplicate tags or breaking template relationships."

---

## User Flow

### Flow 1: Full Export

1. User clicks **"Export Data"** button in header/settings
2. System shows export options modal:
   - ☑️ Todos (with subtasks)
   - ☑️ Tags
   - ☑️ Templates
   - "Select All" / "Select None" buttons
3. User selects what to export (default: all checked)
4. User clicks **"Download JSON"** button
5. System generates JSON file with timestamp
6. Browser downloads file: `todos-backup-YYYY-MM-DD-HHMMSS.json`
7. Success message: "Exported X todos, Y tags, Z templates"

### Flow 2: Full Import (Clean Slate)

1. User clicks **"Import Data"** button
2. File picker opens
3. User selects previously exported JSON file
4. System validates JSON structure
5. Preview modal shows:
   - Import summary: "42 todos, 8 tags, 5 templates"
   - Warning: "This will add to your existing data"
   - Checkbox: "Merge duplicate tags by name"
6. User reviews and clicks **"Import"**
7. Progress indicator shows during import
8. Success modal displays:
   - "Successfully imported 42 todos, 8 tags, 5 templates"
   - "Skipped 2 duplicate tags (merged)"
   - Button: "View Imported Todos"

### Flow 3: Import with Conflicts

1. User initiates import with existing data
2. System detects conflicts:
   - Tag "Work" already exists with different color
   - Template "Weekly Review" already exists
3. Conflict resolution modal appears:
   - **Tags Conflicts (2 found):**
     - "Work" → Keep existing / Use imported / Create new "Work (2)"
   - **Template Conflicts (1 found):**
     - "Weekly Review" → Skip / Replace / Rename to "Weekly Review (imported)"
4. User selects resolution strategy
5. System processes import with chosen resolutions
6. Summary shows: "Imported 40 todos (2 skipped), merged 6 tags, replaced 1 template"

### Flow 4: Validation Failure

1. User selects corrupted/invalid JSON file
2. System validates structure
3. Error modal displays:
   - "❌ Import failed - invalid JSON format"
   - **Errors found:**
     - Line 45: Missing required field "title" in todo
     - Line 132: Invalid priority value "super-high"
     - Line 201: subtask.todo_id references non-existent todo
4. User clicks **"Download Error Report"** to get detailed log
5. User fixes JSON file and retries import

---

## Technical Requirements

### Data Structure

**Export JSON Format:**

```typescript
interface ExportData {
  version: string;              // Format version (e.g., "1.0")
  exported_at: string;          // ISO timestamp (Singapore timezone)
  exported_by: string;          // Username
  data: {
    todos: ExportedTodo[];
    tags: ExportedTag[];
    templates: ExportedTemplate[];
  };
  metadata: {
    todo_count: number;
    tag_count: number;
    template_count: number;
    subtask_count: number;
  };
}

interface ExportedTodo {
  // Original ID preserved for reference
  original_id: number;
  
  // Todo fields
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  due_date: string | null;                    // ISO string
  reminder_minutes: number | null;
  created_at: string;                         // ISO string
  updated_at: string;                         // ISO string
  
  // Related data
  subtasks: ExportedSubtask[];
  tag_ids: number[];                          // Original tag IDs
}

interface ExportedSubtask {
  original_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ExportedTag {
  original_id: number;
  name: string;
  color: string;                              // Hex color code
  created_at: string;
  updated_at: string;
}

interface ExportedTemplate {
  original_id: number;
  name: string;
  description: string | null;
  category: string | null;
  priority: 'high' | 'medium' | 'low';
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  reminder_minutes: number | null;
  due_date_offset_days: number | null;
  subtasks_json: string;                      // JSON array string
  tag_ids: number[];                          // Original tag IDs
  created_at: string;
  updated_at: string;
}
```

**Import Response:**

```typescript
interface ImportResult {
  success: boolean;
  statistics: {
    todos_imported: number;
    todos_skipped: number;
    subtasks_imported: number;
    tags_imported: number;
    tags_merged: number;
    tags_skipped: number;
    templates_imported: number;
    templates_skipped: number;
  };
  id_mapping: {
    todos: Record<number, number>;            // old_id → new_id
    tags: Record<number, number>;
    templates: Record<number, number>;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
}

interface ImportError {
  type: 'validation' | 'database' | 'constraint';
  entity: 'todo' | 'tag' | 'template' | 'subtask';
  original_id: number;
  field?: string;
  message: string;
}

interface ImportWarning {
  type: 'duplicate' | 'conflict' | 'skipped';
  entity: 'todo' | 'tag' | 'template';
  original_id: number;
  message: string;
}
```

### Database Schema

**No new tables required.** Uses existing:
- `todos` table
- `subtasks` table
- `tags` table
- `todo_tags` junction table
- `templates` table
- `template_tags` junction table

**Import Tracking (Optional Enhancement):**

```sql
CREATE TABLE IF NOT EXISTS import_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  todos_imported INTEGER NOT NULL,
  tags_imported INTEGER NOT NULL,
  templates_imported INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_log TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### API Endpoints

#### 1. Export Endpoint

**`GET /api/todos/export`**

**Query Parameters:**
- `include_todos` (boolean, default: true)
- `include_tags` (boolean, default: true)
- `include_templates` (boolean, default: true)
- `completed` (boolean, optional) - Filter completed todos

**Response:**
- **200 OK**: JSON file download with Content-Disposition header
- **401 Unauthorized**: Not authenticated
- **500 Internal Server Error**: Export failed

**Headers:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="todos-backup-2025-11-13-143022.json"
```

**Implementation Notes:**
- Use Singapore timezone for timestamps
- Include `version: "1.0"` in export data
- Preserve original IDs for import reference
- Serialize subtasks inline with each todo
- Include tag_ids arrays to preserve relationships

---

#### 2. Import Validation Endpoint

**`POST /api/todos/import/validate`**

**Request Body:**
```json
{
  "data": { /* ExportData object */ }
}
```

**Response:**
```json
{
  "valid": true,
  "summary": {
    "todos": 42,
    "tags": 8,
    "templates": 5,
    "subtasks": 137
  },
  "conflicts": {
    "tags": [
      {
        "name": "Work",
        "existing_color": "#3B82F6",
        "imported_color": "#EF4444"
      }
    ],
    "templates": [
      {
        "name": "Weekly Review",
        "action_required": true
      }
    ]
  },
  "errors": []
}
```

---

#### 3. Import Execution Endpoint

**`POST /api/todos/import`**

**Request Body:**
```json
{
  "data": { /* ExportData object */ },
  "options": {
    "merge_duplicate_tags": true,
    "skip_duplicate_templates": false,
    "conflict_resolution": {
      "tags": {
        "Work": "keep_existing" | "use_imported" | "create_new"
      },
      "templates": {
        "Weekly Review": "skip" | "replace" | "rename"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "todos_imported": 42,
    "todos_skipped": 0,
    "subtasks_imported": 137,
    "tags_imported": 6,
    "tags_merged": 2,
    "tags_skipped": 0,
    "templates_imported": 4,
    "templates_skipped": 1
  },
  "id_mapping": {
    "todos": { "1": 145, "2": 146 },
    "tags": { "1": 12, "2": 12 },
    "templates": { "1": 7 }
  },
  "errors": [],
  "warnings": [
    {
      "type": "duplicate",
      "entity": "tag",
      "original_id": 2,
      "message": "Tag 'Work' merged with existing tag"
    }
  ]
}
```

**Implementation Notes:**
- **Use database transaction** - rollback on any error
- **ID Remapping Algorithm:**
  1. Import tags first, build old_id → new_id mapping
  2. Import templates, remap template tag_ids using tag mapping
  3. Import todos, remap todo tag_ids
  4. Import subtasks with remapped todo_ids
  5. Create todo_tags relationships with remapped IDs
  6. Create template_tags relationships with remapped IDs

---

### TypeScript Types

**Add to `lib/types.ts`:**

```typescript
export interface ExportOptions {
  includeTodos: boolean;
  includeTags: boolean;
  includeTemplates: boolean;
  includeCompleted?: boolean;
}

export interface ImportOptions {
  mergeDuplicateTags: boolean;
  skipDuplicateTemplates: boolean;
  conflictResolution?: {
    tags?: Record<string, 'keep_existing' | 'use_imported' | 'create_new'>;
    templates?: Record<string, 'skip' | 'replace' | 'rename'>;
  };
}

export interface ImportProgress {
  stage: 'validating' | 'importing_tags' | 'importing_templates' | 'importing_todos' | 'complete';
  progress: number; // 0-100
  currentItem?: string;
}
```

---

## UI Components

### Export Modal Component

```tsx
'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeTodos: true,
    includeTags: true,
    includeTemplates: true,
    includeCompleted: true,
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(options);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Download size={24} />
          Export Data
        </h2>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeTodos}
              onChange={(e) => setOptions({ ...options, includeTodos: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-white">Todos (with subtasks)</span>
          </label>

          {options.includeTodos && (
            <label className="flex items-center gap-3 cursor-pointer ml-8">
              <input
                type="checkbox"
                checked={options.includeCompleted}
                onChange={(e) => setOptions({ ...options, includeCompleted: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-gray-300">Include completed todos</span>
            </label>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeTags}
              onChange={(e) => setOptions({ ...options, includeTags: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-white">Tags</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeTemplates}
              onChange={(e) => setOptions({ ...options, includeTemplates: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-white">Templates</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
            disabled={exporting || (!options.includeTodos && !options.includeTags && !options.includeTemplates)}
          >
            {exporting ? 'Exporting...' : 'Download JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Import Modal Component

```tsx
'use client';

import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, options: ImportOptions) => Promise<ImportResult>;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    mergeDuplicateTags: true,
    skipDuplicateTemplates: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const importResult = await onImport(file, options);
      setResult(importResult);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Upload size={24} />
          Import Data
        </h2>

        {!result ? (
          <>
            <div className="mb-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              />
              {file && (
                <p className="text-sm text-gray-400 mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.mergeDuplicateTags}
                  onChange={(e) => setOptions({ ...options, mergeDuplicateTags: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-white">Merge duplicate tags by name</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.skipDuplicateTemplates}
                  onChange={(e) => setOptions({ ...options, skipDuplicateTemplates: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-white">Skip duplicate templates</span>
              </label>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  This will add imported data to your existing todos. Review carefully before proceeding.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                disabled={!file || importing}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              {result.success ? (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={24} className="text-green-400" />
                    <h3 className="text-lg font-semibold text-green-200">Import Successful!</h3>
                  </div>
                  <div className="space-y-1 text-sm text-green-100">
                    <p>✓ {result.statistics.todos_imported} todos imported</p>
                    <p>✓ {result.statistics.subtasks_imported} subtasks imported</p>
                    <p>✓ {result.statistics.tags_imported} tags imported</p>
                    {result.statistics.tags_merged > 0 && (
                      <p>✓ {result.statistics.tags_merged} tags merged</p>
                    )}
                    <p>✓ {result.statistics.templates_imported} templates imported</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-200 mb-2">Import Failed</h3>
                  <div className="space-y-1 text-sm text-red-100">
                    {result.errors.map((error, i) => (
                      <p key={i}>• {error.message}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Edge Cases

### 1. Empty Export
**Scenario:** User has no data to export.
**Handling:** Allow export with empty arrays, display warning message.

```json
{
  "version": "1.0",
  "data": {
    "todos": [],
    "tags": [],
    "templates": []
  },
  "metadata": {
    "todo_count": 0,
    "tag_count": 0,
    "template_count": 0
  }
}
```

### 2. Malformed JSON
**Scenario:** User selects invalid/corrupted JSON file.
**Handling:** Validate JSON structure before processing, show specific errors.

```typescript
// Validation checks
if (!data.version) throw new Error('Missing version field');
if (!data.data) throw new Error('Missing data field');
if (!Array.isArray(data.data.todos)) throw new Error('Invalid todos array');
```

### 3. Missing Required Fields
**Scenario:** Todo in import missing required field (e.g., title).
**Handling:** Skip that todo, log error, continue with rest.

```typescript
for (const todo of importData.data.todos) {
  if (!todo.title?.trim()) {
    errors.push({
      type: 'validation',
      entity: 'todo',
      original_id: todo.original_id,
      field: 'title',
      message: 'Title is required'
    });
    continue;
  }
  // Process valid todo
}
```

### 4. Invalid Enum Values
**Scenario:** Priority value "super-high" (invalid).
**Handling:** Default to "medium", log warning.

```typescript
const validPriorities = ['high', 'medium', 'low'];
const priority = validPriorities.includes(todo.priority) 
  ? todo.priority 
  : 'medium';

if (todo.priority !== priority) {
  warnings.push({
    type: 'validation',
    entity: 'todo',
    original_id: todo.original_id,
    message: `Invalid priority "${todo.priority}", defaulted to "medium"`
  });
}
```

### 5. Circular References
**Scenario:** Subtask references non-existent todo_id.
**Handling:** Skip orphaned subtasks, log warning.

```typescript
const validTodoIds = new Set(todos.map(t => t.id));

for (const subtask of importData.subtasks) {
  if (!validTodoIds.has(subtask.todo_id_mapped)) {
    warnings.push({
      type: 'skipped',
      entity: 'subtask',
      original_id: subtask.original_id,
      message: 'Parent todo not found'
    });
    continue;
  }
  // Process valid subtask
}
```

### 6. Duplicate Tag Names with Different Colors
**Scenario:** Import has "Work" tag (#FF0000), user already has "Work" (#0000FF).
**Handling:** Offer resolution options:
- **Merge** (keep existing color)
- **Replace** (use imported color)
- **Create new** ("Work (2)")

### 7. Very Large Import Files (10,000+ todos)
**Scenario:** Import file > 10MB with thousands of todos.
**Handling:** 
- Process in batches of 500
- Show progress indicator
- Use database transaction per batch
- Allow cancellation

```typescript
const BATCH_SIZE = 500;
for (let i = 0; i < todos.length; i += BATCH_SIZE) {
  const batch = todos.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
  updateProgress(Math.min(100, ((i + BATCH_SIZE) / todos.length) * 100));
}
```

### 8. Import During Active Session
**Scenario:** User imports while editing a todo.
**Handling:** 
- Warn user about potential conflicts
- Recommend saving current work first
- Refresh page after successful import

### 9. Old Version Import
**Scenario:** User imports JSON from older app version.
**Handling:** 
- Check version field
- Apply migration transformations if needed
- Log version compatibility warning

```typescript
if (data.version === '0.9') {
  // Migrate old format to v1.0
  data.data.todos = migrateTodosV0_9toV1_0(data.data.todos);
  warnings.push({
    type: 'migration',
    message: 'Imported from older version, migrated to v1.0'
  });
}
```

### 10. Duplicate Template Names
**Scenario:** Import has template "Weekly Review", user already has one.
**Handling:** Options:
- **Skip** (don't import duplicate)
- **Replace** (overwrite existing)
- **Rename** (import as "Weekly Review (imported)")

---

## Acceptance Criteria

### Functional Requirements

✅ **Export Functionality**
- [ ] Export button available in header/settings
- [ ] User can select what to export (todos, tags, templates)
- [ ] Option to exclude completed todos
- [ ] JSON file downloads with timestamp filename
- [ ] Export includes all relationships preserved
- [ ] Original IDs preserved in export for reimport
- [ ] Timestamps in Singapore timezone
- [ ] Version number included in export

✅ **Import Functionality**
- [ ] File picker accepts only .json files
- [ ] JSON validation before import
- [ ] Preview modal shows import summary
- [ ] User can configure merge/skip options
- [ ] Progress indicator during import
- [ ] Transaction rollback on any error
- [ ] Success modal shows detailed statistics
- [ ] Errors and warnings logged and displayed

✅ **ID Remapping**
- [ ] All entity IDs remapped to prevent conflicts
- [ ] Relationships preserved after remapping:
  - Todo ↔ Subtasks
  - Todo ↔ Tags
  - Template ↔ Tags
- [ ] ID mapping returned in import response
- [ ] Original IDs never conflict with existing IDs

✅ **Data Validation**
- [ ] Required fields validated (title, name, etc.)
- [ ] Enum values validated (priority, recurrence)
- [ ] Date formats validated (ISO strings)
- [ ] Color codes validated (hex format)
- [ ] Relationships validated (foreign keys exist)
- [ ] JSON structure validated against schema

✅ **Conflict Resolution**
- [ ] Duplicate tags detected by name
- [ ] Duplicate templates detected by name
- [ ] User can choose merge/skip/replace strategy
- [ ] Merged tags preserve existing color by default
- [ ] Renamed entities get " (2)" suffix

✅ **Error Handling**
- [ ] Invalid JSON shows clear error message
- [ ] Validation errors list specific issues
- [ ] Import failures rollback all changes
- [ ] Error log downloadable for debugging
- [ ] Partial success not allowed (all-or-nothing per batch)

---

## Testing Requirements

### E2E Tests (Playwright)

**Test File:** `tests/09-export-import.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Export & Import', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
    // Create test data
    await createTodo(page, { title: 'Test Todo 1', priority: 'high' });
    await createTag(page, { name: 'Work', color: '#3B82F6' });
  });

  test('should export all data to JSON', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Data")'),
      page.click('button:has-text("Download JSON")')
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/todos-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json/);

    const content = await download.path();
    const json = JSON.parse(await fs.readFile(content, 'utf-8'));

    expect(json.version).toBe('1.0');
    expect(json.data.todos.length).toBeGreaterThan(0);
    expect(json.data.tags.length).toBeGreaterThan(0);
  });

  test('should import JSON file successfully', async ({ page }) => {
    // Export first
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Data")'),
      page.click('button:has-text("Download JSON")')
    ]);

    const exportPath = await download.path();

    // Clear data
    await deleteAllTodos(page);

    // Import
    await page.click('button:has-text("Import Data")');
    await page.setInputFiles('input[type="file"]', exportPath);
    await page.click('button:has-text("Import")');

    // Verify success
    await expect(page.locator('text=Import Successful')).toBeVisible();
    await expect(page.locator('text="1 todos imported"')).toBeVisible();
  });

  test('should handle duplicate tags during import', async ({ page }) => {
    // Create tag
    await createTag(page, { name: 'Work', color: '#3B82F6' });

    // Import file with same tag name
    await page.click('button:has-text("Import Data")');
    await page.setInputFiles('input[type="file"]', 'test-fixtures/duplicate-tags.json');
    await page.check('label:has-text("Merge duplicate tags")');
    await page.click('button:has-text("Import")');

    await expect(page.locator('text="1 tags merged"')).toBeVisible();
  });

  test('should validate JSON structure', async ({ page }) => {
    await page.click('button:has-text("Import Data")');
    await page.setInputFiles('input[type="file"]', 'test-fixtures/invalid.json');
    await page.click('button:has-text("Import")');

    await expect(page.locator('text=Import Failed')).toBeVisible();
    await expect(page.locator('text=/Missing required field/')).toBeVisible();
  });

  test('should preserve relationships after import', async ({ page }) => {
    // Export todo with subtasks and tags
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Data")'),
      page.click('button:has-text("Download JSON")')
    ]);

    // Clear and reimport
    await deleteAllTodos(page);
    await page.click('button:has-text("Import Data")');
    await page.setInputFiles('input[type="file"]', await download.path());
    await page.click('button:has-text("Import")');

    // Verify relationships preserved
    const todo = page.locator('.todo-card').first();
    await expect(todo.locator('.tag-badge')).toBeVisible();
    await todo.click('button:has-text("Subtasks")');
    await expect(todo.locator('.subtask-item')).toBeVisible();
  });

  test('should export only selected data types', async ({ page }) => {
    await page.click('button:has-text("Export Data")');
    await page.uncheck('label:has-text("Templates")');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download JSON")')
    ]);

    const content = await download.path();
    const json = JSON.parse(await fs.readFile(content, 'utf-8'));

    expect(json.data.templates).toEqual([]);
  });

  test('should handle large import files', async ({ page }) => {
    // Import file with 1000 todos
    await page.click('button:has-text("Import Data")');
    await page.setInputFiles('input[type="file"]', 'test-fixtures/large-import.json');
    await page.click('button:has-text("Import")');

    // Verify progress indicator
    await expect(page.locator('.progress-bar')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('text="1000 todos imported"')).toBeVisible({ timeout: 30000 });
  });
});
```

### Unit Tests

**Test File:** `lib/__tests__/import-export.test.ts`

```typescript
import { validateImportData, remapIds, mergeConflicts } from '../import-export';

describe('Import/Export Utilities', () => {
  test('should validate valid import data', () => {
    const data = {
      version: '1.0',
      data: {
        todos: [{ original_id: 1, title: 'Test', priority: 'high' }],
        tags: [],
        templates: []
      }
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing required fields', () => {
    const data = {
      version: '1.0',
      data: {
        todos: [{ original_id: 1, priority: 'high' }], // Missing title
        tags: [],
        templates: []
      }
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('title');
  });

  test('should remap IDs correctly', () => {
    const todos = [
      { original_id: 1, title: 'Todo 1', tag_ids: [10, 20] },
      { original_id: 2, title: 'Todo 2', tag_ids: [10] }
    ];

    const tagMapping = { 10: 101, 20: 102 };
    const startId = 500;

    const { remappedTodos, todoMapping } = remapIds(todos, tagMapping, startId);

    expect(remappedTodos[0].id).toBe(500);
    expect(remappedTodos[0].tag_ids).toEqual([101, 102]);
    expect(todoMapping[1]).toBe(500);
  });

  test('should merge duplicate tags by name', () => {
    const existingTags = [{ id: 1, name: 'Work', color: '#3B82F6' }];
    const importedTags = [{ original_id: 10, name: 'Work', color: '#EF4444' }];

    const result = mergeConflicts(existingTags, importedTags, { merge: true });

    expect(result.mapping[10]).toBe(1);
    expect(result.merged).toBe(1);
  });
});
```

---

## Out of Scope

The following are **explicitly excluded** from this feature:

❌ **Cloud Sync/Backup**
- No automatic cloud backup
- No sync across devices
- User must manually export/import

❌ **Incremental Import**
- No "import only new items" mode
- Full import only (with conflict resolution)

❌ **Selective Entity Import**
- Cannot import individual todos
- Cannot cherry-pick templates
- Import all or use filtering in export

❌ **Import from Other Formats**
- No CSV import/export
- No Excel format support
- JSON only

❌ **Scheduled Exports**
- No automatic daily/weekly backups
- User must manually trigger export

❌ **Version History**
- No snapshots of previous states
- No "restore to date X" functionality

❌ **Import Preview/Diff**
- No side-by-side comparison before import
- Summary preview only, not detailed diff

❌ **Multi-User Import**
- Cannot import from another user's export
- User-specific data only

❌ **Partial Rollback**
- Cannot undo individual imported items
- All-or-nothing rollback on error only

---

## Success Metrics

### Quantitative Metrics

1. **Feature Adoption Rate**
   - Target: 60% of users with 50+ todos export at least once
   - Measurement: Track export button clicks vs total users

2. **Import Success Rate**
   - Target: 95% of imports succeed without errors
   - Measurement: Successful imports / total import attempts

3. **Data Integrity**
   - Target: 100% of relationships preserved in round-trip (export → import)
   - Measurement: Automated test validation

4. **Average Export/Import Time**
   - Target: < 2 seconds for 500 todos
   - Measurement: Performance.now() timing

5. **Error Recovery Rate**
   - Target: < 5% of imports require manual intervention
   - Measurement: Imports with user action needed / total imports

### Qualitative Metrics

1. **User Confidence**
   - Survey: "How confident are you in backup/restore reliability?"
   - Target: 85% rate 4/5 or 5/5 stars

2. **Migration Success**
   - User feedback on device migrations
   - Target: < 2% report data loss

3. **Error Message Clarity**
   - Support tickets about import failures
   - Target: < 1% need support help

### Technical Metrics

1. **Export File Size**
   - Target: < 1MB for 1000 todos
   - Gzip compression recommended for large exports

2. **Import Performance**
   - Target: < 5 seconds for 1000 todos
   - Batch processing for scalability

3. **Transaction Safety**
   - Target: 0 partial imports (all-or-nothing guarantee)
   - Database transaction rollback on any error

---

## Implementation Checklist

### Backend Implementation

- [ ] Create `GET /api/todos/export` endpoint
- [ ] Create `POST /api/todos/import/validate` endpoint
- [ ] Create `POST /api/todos/import` endpoint
- [ ] Implement ID remapping algorithm
- [ ] Add transaction handling with rollback
- [ ] Implement conflict detection (tags, templates)
- [ ] Add data validation logic
- [ ] Handle Singapore timezone conversions
- [ ] Implement batch processing for large imports

### Frontend Implementation

- [ ] Add "Export Data" button in header
- [ ] Create ExportModal component
- [ ] Add "Import Data" button
- [ ] Create ImportModal component
- [ ] Implement file picker
- [ ] Add progress indicator
- [ ] Create success/error modals
- [ ] Add conflict resolution UI
- [ ] Implement download trigger
- [ ] Add import statistics display

### Testing

- [ ] Write E2E tests for export flow
- [ ] Write E2E tests for import flow
- [ ] Test ID remapping logic
- [ ] Test conflict resolution
- [ ] Test error handling
- [ ] Test large file imports (1000+ todos)
- [ ] Test relationship preservation
- [ ] Test transaction rollback

### Documentation

- [ ] Update USER_GUIDE.md with export/import instructions
- [ ] Add troubleshooting section
- [ ] Document JSON format specification
- [ ] Create migration guide for version updates

---

**Last Updated:** November 13, 2025  
**Status:** Ready for Implementation  
**Estimated Effort:** 10-12 hours (backend + frontend + testing)
