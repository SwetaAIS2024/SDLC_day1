# Product Requirement Prompt (PRP): Todo App - Complete System

## Executive Summary

This is the **master Product Requirement Prompt** for a feature-rich, production-ready Todo application built with modern web technologies. The app provides passwordless authentication via WebAuthn/Passkeys, comprehensive task management with priority levels, recurring patterns, reminders, subtasks, tags, templates, and a calendar view—all synchronized to Singapore timezone.

**Target Users**: Individual professionals, students, and teams needing a secure, flexible task management solution without password fatigue.

**Tech Stack**: Next.js 16, React 19, SQLite (better-sqlite3), WebAuthn, Tailwind CSS 4, Playwright E2E testing.

**Deployment**: Railway.app with SQLite persistence

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [User Personas](#user-personas)
3. [System Architecture](#system-architecture)
4. [Core Features Overview](#core-features-overview)
5. [Technical Constraints](#technical-constraints)
6. [Database Schema](#database-schema)
7. [API Structure](#api-structure)
8. [Feature Specifications](#feature-specifications)
9. [Security Requirements](#security-requirements)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Requirements](#deployment-requirements)
12. [Success Metrics](#success-metrics)
13. [Out of Scope](#out-of-scope)
14. [Future Enhancements](#future-enhancements)

---

## Product Vision

### Problem Statement
Users need a reliable, secure task management system that:
- Eliminates password management overhead
- Handles complex scheduling patterns (recurring tasks, reminders)
- Provides organizational tools (tags, templates, subtasks)
- Works consistently across timezones (Singapore-centric)
- Maintains data integrity with import/export capabilities

### Solution
A Next.js-based todo application with:
- **Passwordless security** via WebAuthn biometric authentication
- **Rich task features** including priorities, recurrence, reminders, subtasks
- **Organizational tools** with color-coded tags and reusable templates
- **Time intelligence** with Singapore timezone standardization
- **Data portability** through JSON export/import

### Value Proposition
- ✅ **Zero passwords** - Login with fingerprint/face ID
- ✅ **Smart scheduling** - Automatic recurring task generation
- ✅ **Visual organization** - Color-coded priorities and tags
- ✅ **Progress tracking** - Subtask checklists with completion percentages
- ✅ **Time awareness** - Browser notifications before deadlines
- ✅ **Data ownership** - Export/backup entire task database

---

## User Personas

### Persona 1: Sarah - Busy Professional
**Demographics**: 28, Marketing Manager in Singapore  
**Goals**: Manage work projects, track deadlines, reduce stress  
**Pain Points**: Forgets passwords, misses deadlines, loses track of recurring meetings  
**Key Features**: Recurring todos, reminders, priority system, WebAuthn  
**Quote**: *"I need something that just works without another password to remember."*

### Persona 2: Alex - University Student
**Demographics**: 21, Computer Science student  
**Goals**: Track assignments, organize study sessions, balance multiple courses  
**Pain Points**: Overlapping deadlines, needs visual calendar, wants to categorize by subject  
**Key Features**: Tags, calendar view, subtasks, templates  
**Quote**: *"I wish I could see all my deadlines in one calendar and tag them by subject."*

### Persona 3: Jamie - Freelance Developer
**Demographics**: 34, Works across multiple clients  
**Goals**: Manage client projects, track billable tasks, maintain work-life balance  
**Pain Points**: Context switching, needs templates for similar tasks, wants to export data  
**Key Features**: Templates, tags, export/import, priorities  
**Quote**: *"I repeat the same setup process for each new client project."*

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  (Next.js 16 App Router - Client Components)               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   app/       │  │  Components  │  │   Hooks      │    │
│  │   page.tsx   │  │  (Inline)    │  │  useNotif.ts │    │
│  │   (~2200 ln) │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/Fetch
┌─────────────────────────────────────────────────────────────┐
│                      Backend (API Routes)                   │
│              (Next.js 16 - Server-Side)                     │
│                                                             │
│  /api/auth/*       - WebAuthn authentication               │
│  /api/todos        - CRUD operations                        │
│  /api/todos/[id]   - Individual todo management            │
│  /api/subtasks     - Subtask operations                     │
│  /api/tags         - Tag CRUD                               │
│  /api/templates    - Template management                    │
│  /api/notifications- Reminder checks                        │
│  /api/holidays     - Singapore holiday data                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ Synchronous calls
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (lib/db.ts)               │
│               better-sqlite3 - Synchronous                  │
│                                                             │
│  todoDB, tagDB, subtaskDB, templateDB, authDB, holidayDB   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                        │
│                       (todos.db)                            │
│                                                             │
│  Tables: users, authenticators, todos, subtasks,           │
│          tags, todo_tags, templates, holidays              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- @simplewebauthn/browser

**Backend**:
- Next.js API Routes
- @simplewebauthn/server
- jsonwebtoken (JWT sessions)

**Database**:
- better-sqlite3 (synchronous SQLite)
- Single file: `todos.db`

**Testing**:
- Playwright (E2E tests)
- Virtual WebAuthn authenticators

**Utilities**:
- lib/timezone.ts - Singapore timezone handling
- lib/auth.ts - Session management
- middleware.ts - Route protection

---

## Core Features Overview

### 1. WebAuthn/Passkeys Authentication
- Passwordless registration and login
- Biometric authentication (fingerprint, face ID, security key)
- JWT session management (7-day expiry)
- HTTP-only secure cookies
- Route protection via Next.js middleware

### 2. Todo CRUD Operations
- Create todos with title, due date, priority
- Edit todo properties
- Toggle completion status
- Delete todos
- Optimistic UI updates
- Singapore timezone enforcement

### 3. Priority System
- Three levels: High (red), Medium (yellow), Low (blue)
- Color-coded badges
- Automatic sorting (high → low, then by due date)
- Priority filtering

### 4. Recurring Todos
- Four patterns: Daily, Weekly, Monthly, Yearly
- Auto-generation of next instance on completion
- Intelligent due date calculation
- Metadata inheritance (priority, tags, reminder offset)

### 5. Reminders & Notifications
- Browser push notifications
- Configurable timing: 15m, 30m, 1h, 2h, 1d, 2d, 1w before due date
- Duplicate prevention with `last_notification_sent` tracking
- Polling mechanism (checks every 30 seconds)
- Permission request UI

### 6. Subtasks & Progress Tracking
- Checklist functionality per todo
- Visual progress bars (e.g., "2/5 completed - 40%")
- Position-based ordering
- Cascade delete with parent todo

### 7. Tag System
- Color-coded labels (hex colors)
- Many-to-many relationships
- Tag CRUD operations
- Filter by single or multiple tags
- Tag management modal

### 8. Template System
- Save todo patterns with subtasks
- Reusable templates with categories
- Due date offset calculation (e.g., "3 days from now")
- JSON serialization of subtask structure

### 9. Search & Filtering
- Real-time text search across titles
- Advanced search (title + tags)
- Multi-criteria filtering:
  - By priority (high/medium/low)
  - By completion status
  - By tag
  - Show overdue only
- Client-side filtering for performance

### 10. Export & Import
- JSON-based backup/restore
- Preserves todos, subtasks, tags, and relationships
- ID remapping on import to prevent conflicts
- Validation of imported data structure

### 11. Calendar View
- Monthly calendar display
- Singapore public holidays highlighted
- Todos displayed on due date cells
- Month navigation (prev/next)
- Click date to view todos

---

## Technical Constraints

### Must Follow

1. **Singapore Timezone Mandatory**
   - All date/time operations use `lib/timezone.ts`
   - Functions: `getSingaporeNow()`, `formatSingaporeDate()`
   - NEVER use `new Date()` directly

2. **Synchronous Database Operations**
   - better-sqlite3 is synchronous (no async/await for DB)
   - Prepared statements for all queries
   - Transaction support for multi-step operations

3. **Next.js 16 Async Params**
   - Route params are Promises: `const { id } = await params;`
   - Must await before accessing param values

4. **API Route Authentication Pattern**
   ```typescript
   export async function GET/POST/PUT/DELETE(request: NextRequest) {
     const session = await getSession();
     if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
     // Use session.userId for queries
   }
   ```

5. **Null Coalescing for Optional Fields**
   - Use `?? 0` or `?? null` for potentially undefined DB fields
   - Example: `counter: authenticator.counter ?? 0`

6. **Monolithic Client UI**
   - Main page (`app/page.tsx`) is ~2200 lines
   - Single file handles all todo features
   - Pattern chosen for simplicity over modularity

7. **Client vs Server Components**
   - Pages are client components (`'use client'`)
   - Never import `lib/db.ts` in client components
   - All DB operations via API routes

---

## Database Schema

### Tables

#### **users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);
```

#### **authenticators**
```sql
CREATE TABLE authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  credential_public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  credential_device_type TEXT,
  credential_backed_up INTEGER,
  transports TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **todos**
```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  recurrence_pattern TEXT,
  reminder_minutes INTEGER,
  last_notification_sent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Enums**:
- `priority`: 'high' | 'medium' | 'low'
- `recurrence_pattern`: 'daily' | 'weekly' | 'monthly' | 'yearly' | NULL

#### **subtasks**
```sql
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
```

#### **tags**
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TEXT NOT NULL,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **todo_tags** (Junction Table)
```sql
CREATE TABLE todo_tags (
  todo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

#### **templates**
```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date_offset_days INTEGER,
  subtasks_json TEXT,
  category TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**subtasks_json format**:
```json
[
  { "title": "Step 1", "position": 0 },
  { "title": "Step 2", "position": 1 }
]
```

#### **holidays**
```sql
CREATE TABLE holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'SG'
);
```

### Indexes
```sql
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_subtasks_todo_id ON subtasks(todo_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX idx_todo_tags_tag_id ON todo_tags(tag_id);
CREATE INDEX idx_holidays_date ON holidays(date);
```

---

## API Structure

### Authentication Endpoints

**POST /api/auth/register-options**
- Request: `{ username: string }`
- Response: WebAuthn registration options
- Purpose: Initiate passkey registration

**POST /api/auth/register-verify**
- Request: WebAuthn credential response
- Response: `{ success: boolean, user: User }`
- Purpose: Verify and store new authenticator

**POST /api/auth/login-options**
- Request: `{ username: string }`
- Response: WebAuthn authentication options
- Purpose: Initiate passkey login

**POST /api/auth/login-verify**
- Request: WebAuthn authentication response
- Response: `{ success: boolean }` + Set-Cookie with JWT
- Purpose: Verify authenticator and create session

**POST /api/auth/logout**
- Response: `{ success: boolean }` + Clear cookie
- Purpose: End user session

### Todo Endpoints

**GET /api/todos**
- Auth: Required
- Query: Optional filters (priority, tag, completed)
- Response: `{ todos: Todo[] }`
- Purpose: Retrieve user's todos with filtering

**POST /api/todos**
- Auth: Required
- Request: `{ title, priority?, due_date?, recurrence_pattern?, reminder_minutes? }`
- Response: `{ todo: Todo }`
- Purpose: Create new todo

**PUT /api/todos/[id]**
- Auth: Required
- Request: Partial todo updates OR `{ completed: true }` for recurring logic
- Response: `{ todo: Todo }`
- Purpose: Update todo or handle recurring completion

**DELETE /api/todos/[id]**
- Auth: Required
- Response: `{ success: boolean }`
- Purpose: Delete todo (cascade deletes subtasks)

**GET /api/todos/export**
- Auth: Required
- Response: `{ todos: Todo[], subtasks: Subtask[], tags: Tag[] }`
- Purpose: Export all user data as JSON

**POST /api/todos/import**
- Auth: Required
- Request: `{ todos, subtasks, tags }`
- Response: `{ success: boolean, imported: { todos, subtasks, tags } }`
- Purpose: Import data with ID remapping

### Subtask Endpoints

**GET /api/todos/[id]/subtasks**
- Auth: Required
- Response: `{ subtasks: Subtask[] }`

**POST /api/todos/[id]/subtasks**
- Auth: Required
- Request: `{ title: string, position?: number }`
- Response: `{ subtask: Subtask }`

**PUT /api/todos/[id]/subtasks/[subtaskId]**
- Auth: Required
- Request: `{ completed?: boolean, title?: string }`
- Response: `{ subtask: Subtask }`

**DELETE /api/todos/[id]/subtasks/[subtaskId]**
- Auth: Required
- Response: `{ success: boolean }`

### Tag Endpoints

**GET /api/tags**
- Auth: Required
- Response: `{ tags: Tag[] }`

**POST /api/tags**
- Auth: Required
- Request: `{ name: string, color: string }`
- Response: `{ tag: Tag }`

**PUT /api/tags/[id]**
- Auth: Required
- Request: `{ name?: string, color?: string }`
- Response: `{ tag: Tag }`

**DELETE /api/tags/[id]**
- Auth: Required
- Response: `{ success: boolean }`

**POST /api/todos/[id]/tags**
- Auth: Required
- Request: `{ tag_id: number }`
- Response: `{ success: boolean }`

**DELETE /api/todos/[id]/tags/[tagId]**
- Auth: Required
- Response: `{ success: boolean }`

### Template Endpoints

**GET /api/templates**
- Auth: Required
- Response: `{ templates: Template[] }`

**POST /api/templates**
- Auth: Required
- Request: `{ name, title, priority, due_date_offset_days?, subtasks_json?, category? }`
- Response: `{ template: Template }`

**POST /api/templates/[id]/use**
- Auth: Required
- Response: `{ todo: Todo }` (created from template)

**DELETE /api/templates/[id]**
- Auth: Required
- Response: `{ success: boolean }`

### Notification Endpoints

**GET /api/notifications/check**
- Auth: Required
- Response: `{ notifications: Array<{ todo_id, title, due_date }> }`
- Purpose: Check for todos with due reminders

### Holiday Endpoints

**GET /api/holidays**
- Query: `?year=2025&month=11`
- Response: `{ holidays: Holiday[] }`
- Purpose: Get Singapore holidays for calendar

---

## Feature Specifications

### Feature 1: WebAuthn Authentication

**User Stories**:
- As a user, I want to register with my fingerprint so I don't need a password
- As a user, I want to login quickly with Face ID on my device
- As a user, I want my session to persist across page refreshes

**Technical Implementation**:

1. **Registration Flow**:
   ```typescript
   // Client
   startRegistration(optionsResponse) → Authenticator prompt
   → POST /api/auth/register-verify with credential
   
   // Server
   verifyRegistrationResponse(credential, expectedChallenge)
   → Store credential in authenticators table
   → Create JWT session cookie
   ```

2. **Login Flow**:
   ```typescript
   // Client
   startAuthentication(optionsResponse) → Authenticator prompt
   → POST /api/auth/login-verify with assertion
   
   // Server
   verifyAuthenticationResponse(assertion, storedCredential)
   → Update counter field (prevent replay attacks)
   → Create JWT session cookie
   ```

3. **Session Management**:
   - JWT payload: `{ userId, username, exp }`
   - Cookie: `session` (HTTP-only, Secure in production)
   - Expiry: 7 days
   - Middleware checks session on protected routes

**Edge Cases**:
- User cancels authenticator prompt → Show error message
- Credential counter mismatch → Reject (replay attack)
- Duplicate username registration → Return 400 error
- Session expired → Redirect to login

**Testing Requirements**:
- E2E: Virtual authenticator registration and login flows
- Unit: JWT token generation and verification
- Security: CSRF protection, counter validation

---

### Feature 2: Todo CRUD with Priority System

**User Stories**:
- As a user, I want to create todos with high/medium/low priority
- As a user, I want to see high-priority todos at the top
- As a user, I want to edit todo properties without losing data
- As a user, I want to delete completed todos

**Technical Implementation**:

1. **Create Todo**:
   ```typescript
   POST /api/todos
   Body: {
     title: "Fix critical bug",
     priority: "high",
     due_date: "2025-11-13T14:00:00+08:00"
   }
   
   // Validation
   - title: required, non-empty, trim whitespace
   - priority: enum ['high', 'medium', 'low'], default 'medium'
   - due_date: ISO 8601, must be future (Singapore time)
   ```

2. **Read Todos**:
   ```typescript
   GET /api/todos?priority=high&completed=false
   
   // Sorting logic (applied in SQL or client)
   1. Priority: high → medium → low
   2. Due date: nearest first
   3. Created date: newest first
   ```

3. **Update Todo**:
   ```typescript
   PUT /api/todos/[id]
   Body: { title?: string, priority?: string, completed?: boolean }
   
   // Special handling for completion
   if (completed && todo.recurrence_pattern) {
     createNextRecurringInstance(todo);
   }
   ```

4. **Delete Todo**:
   ```typescript
   DELETE /api/todos/[id]
   // Cascade deletes subtasks (handled by DB foreign key)
   ```

**UI Components**:
- Priority badges with Tailwind classes:
  - High: `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
  - Medium: `bg-yellow-100 text-yellow-800`
  - Low: `bg-blue-100 text-blue-800`

**Edge Cases**:
- Empty title → Reject with validation error
- Due date in past → Reject or auto-adjust to 1 minute future
- Delete non-existent todo → 404 error
- Update todo owned by different user → 403 Forbidden

---

### Feature 3: Recurring Todos

**User Stories**:
- As a user, I want to create daily standup reminders
- As a user, I want weekly grocery shopping todos
- As a user, I want monthly bill payment reminders
- As a user, I want the next instance to automatically appear when I complete one

**Recurrence Patterns**:

| Pattern | Next Due Date Logic | Example |
|---------|-------------------|---------|
| Daily | Current due_date + 1 day | Due Nov 12 → Next Nov 13 |
| Weekly | Current due_date + 7 days | Due Nov 12 → Next Nov 19 |
| Monthly | Same day next month | Due Nov 12 → Next Dec 12 |
| Yearly | Same date next year | Due Nov 12 2025 → Next Nov 12 2026 |

**Technical Implementation**:

```typescript
// On completion of recurring todo
function handleRecurringCompletion(todo: Todo) {
  // 1. Mark current instance as completed
  db.prepare('UPDATE todos SET completed = 1 WHERE id = ?').run(todo.id);
  
  // 2. Calculate next due date (Singapore timezone)
  const nextDueDate = calculateNextDueDate(
    todo.due_date, 
    todo.recurrence_pattern
  );
  
  // 3. Create next instance
  const nextTodo = {
    ...todo,
    id: undefined, // New ID
    completed: 0,
    due_date: nextDueDate,
    created_at: getSingaporeNow(),
    updated_at: getSingaporeNow(),
    last_notification_sent: null // Reset notification
  };
  
  // 4. Copy tags from original todo
  const tags = getTagsForTodo(todo.id);
  const newTodoId = insertTodo(nextTodo);
  tags.forEach(tag => assignTagToTodo(newTodoId, tag.id));
  
  // 5. Copy subtasks (reset completion status)
  const subtasks = getSubtasksForTodo(todo.id);
  subtasks.forEach(subtask => {
    insertSubtask({
      todo_id: newTodoId,
      title: subtask.title,
      position: subtask.position,
      completed: 0
    });
  });
}
```

**Date Calculation Examples**:

```typescript
// Monthly edge case: Jan 31 → Feb 28 (non-leap) or Feb 29 (leap)
function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  
  // Handle month overflow (e.g., Jan 31 + 1 month = Feb 31 → Mar 3)
  if (newDate.getDate() !== date.getDate()) {
    newDate.setDate(0); // Set to last day of previous month
  }
  
  return newDate;
}
```

**Edge Cases**:
- Complete recurring todo without due date → Error (recurrence requires due date)
- Complete recurring todo with invalid pattern → Error
- Monthly recurrence on 31st → Adjusts to last day of month
- Yearly recurrence on Feb 29 (leap year) → Feb 28 next non-leap year

---

### Feature 4: Reminders & Notifications

**User Stories**:
- As a user, I want a notification 15 minutes before a meeting
- As a user, I want a daily reminder for my morning routine
- As a user, I want to grant notification permissions once

**Reminder Options**:

| Option | Minutes Before | Use Case |
|--------|---------------|----------|
| 15 min | 15 | Immediate reminders |
| 30 min | 30 | Short-notice prep |
| 1 hour | 60 | Meeting prep |
| 2 hours | 120 | Task setup |
| 1 day | 1440 | Day-before reminder |
| 2 days | 2880 | Early warning |
| 1 week | 10080 | Long-term planning |

**Technical Implementation**:

1. **Backend Check** (GET /api/notifications/check):
   ```typescript
   function getUpcomingReminders(userId: number) {
     const now = getSingaporeNow();
     
     return db.prepare(`
       SELECT id, title, due_date, reminder_minutes
       FROM todos
       WHERE user_id = ?
         AND completed = 0
         AND due_date IS NOT NULL
         AND reminder_minutes IS NOT NULL
         AND (last_notification_sent IS NULL OR last_notification_sent < ?)
     `).all(userId, now.toISOString());
   }
   
   // Filter todos where (due_date - reminder_minutes) <= now
   const dueNotifications = todos.filter(todo => {
     const dueDate = new Date(todo.due_date);
     const notifyTime = new Date(dueDate.getTime() - todo.reminder_minutes * 60000);
     return notifyTime <= now;
   });
   ```

2. **Frontend Polling**:
   ```typescript
   // useNotifications.ts hook
   useEffect(() => {
     const interval = setInterval(async () => {
       const response = await fetch('/api/notifications/check');
       const { notifications } = await response.json();
       
       notifications.forEach(notif => {
         new Notification(`Todo Due Soon: ${notif.title}`, {
           body: `Due at ${formatSingaporeDate(notif.due_date)}`,
           icon: '/icon.png'
         });
         
         // Mark notification as sent
         markNotificationSent(notif.todo_id);
       });
     }, 30000); // Check every 30 seconds
     
     return () => clearInterval(interval);
   }, []);
   ```

3. **Permission Request**:
   ```typescript
   async function requestNotificationPermission() {
     if (!("Notification" in window)) {
       alert("Browser doesn't support notifications");
       return false;
     }
     
     const permission = await Notification.requestPermission();
     return permission === "granted";
   }
   ```

**Edge Cases**:
- Permission denied → Show message, disable notification UI
- Browser doesn't support notifications → Hide notification options
- User closes tab → Notifications stop (no service worker)
- Duplicate notifications → Prevented by `last_notification_sent` field
- Todo completed after notification sent → Ignore in next check

---

### Feature 5: Subtasks & Progress Tracking

**User Stories**:
- As a user, I want to break down complex todos into steps
- As a user, I want to see progress as I complete steps
- As a user, I want to reorder subtasks

**Progress Calculation**:
```
Progress % = (completed_subtasks / total_subtasks) * 100
Example: 3 completed out of 5 total = 60%
```

**Technical Implementation**:

1. **Create Subtask**:
   ```typescript
   POST /api/todos/[id]/subtasks
   Body: { title: "Review code", position: 0 }
   
   // Auto-increment position if not provided
   const maxPosition = db.prepare(`
     SELECT MAX(position) as max FROM subtasks WHERE todo_id = ?
   `).get(todoId).max || -1;
   
   const newPosition = position ?? (maxPosition + 1);
   ```

2. **Toggle Subtask**:
   ```typescript
   PUT /api/todos/[id]/subtasks/[subtaskId]
   Body: { completed: true }
   
   // Update subtask
   db.prepare(`
     UPDATE subtasks SET completed = ? WHERE id = ?
   `).run(completed ? 1 : 0, subtaskId);
   ```

3. **Calculate Progress** (Client-side):
   ```typescript
   function getProgress(subtasks: Subtask[]): { completed: number, total: number, percentage: number } {
     const total = subtasks.length;
     const completed = subtasks.filter(s => s.completed).length;
     const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
     
     return { completed, total, percentage };
   }
   ```

4. **Progress Bar UI**:
   ```tsx
   <div className="w-full bg-gray-200 rounded-full h-2">
     <div 
       className="bg-green-500 h-2 rounded-full transition-all"
       style={{ width: `${percentage}%` }}
     />
   </div>
   <span className="text-sm text-gray-600">
     {completed}/{total} completed ({percentage}%)
   </span>
   ```

**Edge Cases**:
- Delete todo with subtasks → Cascade delete (DB foreign key)
- Subtask without title → Reject validation
- Reorder subtasks → Update position values, maintain uniqueness
- No subtasks → Show "0/0 completed (0%)" or hide progress

---

### Feature 6: Tag System

**User Stories**:
- As a user, I want to tag todos by project ("work", "personal")
- As a user, I want color-coded tags for visual organization
- As a user, I want to filter todos by tag

**Tag Design**:
- Name: Unique per user, case-insensitive
- Color: Hex color code (e.g., #3B82F6)
- Default colors: Blue, Red, Green, Yellow, Purple, Pink

**Technical Implementation**:

1. **Create Tag**:
   ```typescript
   POST /api/tags
   Body: { name: "work", color: "#3B82F6" }
   
   // Validation
   - name: 1-20 chars, alphanumeric + spaces
   - color: valid hex code (#RRGGBB)
   - Unique constraint: (user_id, LOWER(name))
   ```

2. **Assign Tag to Todo**:
   ```typescript
   POST /api/todos/[id]/tags
   Body: { tag_id: 5 }
   
   // Insert into junction table
   db.prepare(`
     INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)
   `).run(todoId, tagId);
   ```

3. **Filter by Tag** (Client-side):
   ```typescript
   const filteredTodos = todos.filter(todo => {
     if (selectedTagId) {
       return todo.tags.some(tag => tag.id === selectedTagId);
     }
     return true;
   });
   ```

4. **Tag Badge UI**:
   ```tsx
   <span 
     className="px-2 py-1 rounded-full text-xs font-medium"
     style={{ 
       backgroundColor: `${tag.color}20`, // 20 = 12% opacity
       color: tag.color,
       border: `1px solid ${tag.color}40`
     }}
   >
     {tag.name}
   </span>
   ```

**Edge Cases**:
- Duplicate tag name (case-insensitive) → Error
- Invalid hex color → Reject or use default
- Delete tag assigned to todos → Remove from junction table
- Tag with special characters → Sanitize input

---

### Feature 7: Template System

**User Stories**:
- As a user, I want to save recurring project setups as templates
- As a user, I want templates to include subtasks
- As a user, I want to set due dates relative to today

**Template Structure**:
```typescript
interface Template {
  id: number;
  name: string;              // "Weekly Report"
  title: string;             // "Submit weekly report"
  priority: Priority;
  due_date_offset_days: number | null; // 7 (due in 7 days)
  subtasks_json: string;     // JSON array of subtasks
  category: string | null;   // "work"
}
```

**Technical Implementation**:

1. **Save as Template**:
   ```typescript
   POST /api/templates
   Body: {
     name: "Weekly Report Template",
     title: "Submit weekly report",
     priority: "high",
     due_date_offset_days: 7,
     subtasks_json: JSON.stringify([
       { title: "Gather data", position: 0 },
       { title: "Write summary", position: 1 },
       { title: "Send to manager", position: 2 }
     ]),
     category: "work"
   }
   ```

2. **Use Template**:
   ```typescript
   POST /api/templates/[id]/use
   
   // Server logic
   const template = getTemplateById(id);
   const dueDate = template.due_date_offset_days 
     ? addDays(getSingaporeNow(), template.due_date_offset_days)
     : null;
   
   const newTodo = createTodo({
     title: template.title,
     priority: template.priority,
     due_date: dueDate?.toISOString()
   });
   
   // Create subtasks from JSON
   const subtasks = JSON.parse(template.subtasks_json);
   subtasks.forEach(subtask => {
     createSubtask(newTodo.id, subtask.title, subtask.position);
   });
   ```

**Edge Cases**:
- Template with invalid JSON subtasks → Validation error
- Negative due_date_offset_days → Reject or treat as "no due date"
- Delete template → Doesn't affect todos created from it
- Template name conflict → Allow (unlike tags)

---

### Feature 8: Search & Filtering

**User Stories**:
- As a user, I want to quickly find todos by title
- As a user, I want to filter by multiple criteria simultaneously
- As a user, I want to see only overdue todos

**Filter Criteria**:
- Text search (title)
- Priority (high/medium/low)
- Completion status (completed/active)
- Tag (single tag filter)
- Overdue (due_date < now && !completed)

**Technical Implementation**:

```typescript
// Client-side filtering (app/page.tsx)
const filteredTodos = useMemo(() => {
  return todos.filter(todo => {
    // Text search
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter && todo.priority !== priorityFilter) {
      return false;
    }
    
    // Completion filter
    if (completionFilter === 'active' && todo.completed) return false;
    if (completionFilter === 'completed' && !todo.completed) return false;
    
    // Tag filter
    if (tagFilter && !todo.tags.some(tag => tag.id === tagFilter)) {
      return false;
    }
    
    // Overdue filter
    if (showOverdueOnly) {
      if (!todo.due_date || todo.completed) return false;
      const dueDate = new Date(todo.due_date);
      const now = getSingaporeNow();
      if (dueDate >= now) return false;
    }
    
    return true;
  });
}, [todos, searchQuery, priorityFilter, completionFilter, tagFilter, showOverdueOnly]);
```

**Advanced Search** (Title + Tags):
```typescript
// Search in both title and tag names
const results = todos.filter(todo => {
  const query = searchQuery.toLowerCase();
  const titleMatch = todo.title.toLowerCase().includes(query);
  const tagMatch = todo.tags.some(tag => 
    tag.name.toLowerCase().includes(query)
  );
  return titleMatch || tagMatch;
});
```

**UI Components**:
- Search input with debounce (300ms)
- Filter dropdowns (priority, tag, status)
- "Clear Filters" button
- Result count: "Showing 5 of 23 todos"

---

### Feature 9: Export & Import

**User Stories**:
- As a user, I want to backup all my todos
- As a user, I want to migrate data to a new account
- As a user, I want to restore accidentally deleted todos

**Export Format** (JSON):
```json
{
  "version": "1.0",
  "exported_at": "2025-11-12T10:30:00+08:00",
  "todos": [
    {
      "id": 1,
      "title": "Fix bug",
      "completed": false,
      "priority": "high",
      "due_date": "2025-11-15T14:00:00+08:00",
      "recurrence_pattern": null,
      "reminder_minutes": 60,
      "tag_ids": [1, 3]
    }
  ],
  "subtasks": [
    {
      "id": 1,
      "todo_id": 1,
      "title": "Reproduce bug",
      "completed": true,
      "position": 0
    }
  ],
  "tags": [
    {
      "id": 1,
      "name": "work",
      "color": "#3B82F6"
    }
  ]
}
```

**Technical Implementation**:

1. **Export** (GET /api/todos/export):
   ```typescript
   const todos = todoDB.getByUserId(userId);
   const subtasks = todos.flatMap(todo => subtaskDB.getByTodoId(todo.id));
   const tags = tagDB.getByUserId(userId);
   
   // Add tag_ids array to each todo
   const todosWithTags = todos.map(todo => ({
     ...todo,
     tag_ids: getTagIdsForTodo(todo.id)
   }));
   
   const exportData = {
     version: "1.0",
     exported_at: getSingaporeNow().toISOString(),
     todos: todosWithTags,
     subtasks,
     tags
   };
   
   // Client downloads as JSON file
   const blob = new Blob([JSON.stringify(exportData, null, 2)], 
     { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `todos-export-${Date.now()}.json`;
   a.click();
   ```

2. **Import** (POST /api/todos/import):
   ```typescript
   // Validate structure
   if (!data.todos || !Array.isArray(data.todos)) {
     return { error: 'Invalid format' };
   }
   
   // ID remapping
   const todoIdMap = new Map(); // old_id → new_id
   const tagIdMap = new Map();
   
   // 1. Import tags (or match existing by name)
   for (const tag of data.tags) {
     const existing = tagDB.getByUserIdAndName(userId, tag.name);
     if (existing) {
       tagIdMap.set(tag.id, existing.id);
     } else {
       const newTag = tagDB.create({ ...tag, user_id: userId });
       tagIdMap.set(tag.id, newTag.id);
     }
   }
   
   // 2. Import todos
   for (const todo of data.todos) {
     const newTodo = todoDB.create({
       ...todo,
       id: undefined, // New ID
       user_id: userId
     });
     todoIdMap.set(todo.id, newTodo.id);
     
     // Assign tags
     (todo.tag_ids || []).forEach(oldTagId => {
       const newTagId = tagIdMap.get(oldTagId);
       if (newTagId) {
         assignTagToTodo(newTodo.id, newTagId);
       }
     });
   }
   
   // 3. Import subtasks
   for (const subtask of data.subtasks) {
     const newTodoId = todoIdMap.get(subtask.todo_id);
     if (newTodoId) {
       subtaskDB.create({
         ...subtask,
         id: undefined,
         todo_id: newTodoId
       });
     }
   }
   ```

**Validation Rules**:
- Required fields: todos, tags, subtasks arrays
- Todo must have: title
- Subtask must have: todo_id, title
- Tag must have: name, color
- Dates must be valid ISO 8601 format

**Edge Cases**:
- Duplicate tag names → Reuse existing tag
- Invalid JSON → Parse error, reject import
- Missing relationships (subtask.todo_id not in todos) → Skip
- Version mismatch → Show warning, attempt import

---

### Feature 10: Calendar View

**User Stories**:
- As a user, I want to see todos organized by due date
- As a user, I want to know Singapore public holidays
- As a user, I want to navigate between months

**Calendar Features**:
- Monthly grid view (Sun-Sat)
- Current day highlighted
- Todos displayed on due date cells
- Public holidays marked
- Month navigation (prev/next)

**Technical Implementation**:

1. **Generate Calendar Grid**:
   ```typescript
   function generateCalendarDays(year: number, month: number): CalendarDay[] {
     const firstDay = new Date(year, month, 1);
     const lastDay = new Date(year, month + 1, 0);
     const daysInMonth = lastDay.getDate();
     const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
     
     const days: CalendarDay[] = [];
     
     // Add empty cells for days before 1st
     for (let i = 0; i < startDayOfWeek; i++) {
       days.push({ date: null, isCurrentMonth: false });
     }
     
     // Add days of month
     for (let day = 1; day <= daysInMonth; day++) {
       const date = new Date(year, month, day);
       days.push({
         date,
         isCurrentMonth: true,
         isToday: isSameDay(date, getSingaporeNow())
       });
     }
     
     return days;
   }
   ```

2. **Fetch Holidays**:
   ```typescript
   GET /api/holidays?year=2025&month=11
   
   // Server
   const holidays = db.prepare(`
     SELECT * FROM holidays 
     WHERE date >= ? AND date < ?
       AND country = 'SG'
   `).all(
     `${year}-${month.toString().padStart(2, '0')}-01`,
     `${year}-${(month+1).toString().padStart(2, '0')}-01`
   );
   ```

3. **Display Todos on Calendar**:
   ```typescript
   // Group todos by date
   const todosByDate = todos.reduce((acc, todo) => {
     if (!todo.due_date) return acc;
     const dateKey = formatDate(todo.due_date, 'yyyy-MM-dd');
     if (!acc[dateKey]) acc[dateKey] = [];
     acc[dateKey].push(todo);
     return acc;
   }, {});
   
   // In calendar cell
   const todosForDay = todosByDate[formatDate(day.date, 'yyyy-MM-dd')] || [];
   ```

4. **Calendar Cell UI**:
   ```tsx
   <div className={`calendar-cell ${day.isToday ? 'bg-blue-100' : ''} ${holiday ? 'bg-red-50' : ''}`}>
     <div className="date-number">{day.date.getDate()}</div>
     {holiday && <div className="text-xs text-red-600">{holiday.name}</div>}
     {todosForDay.slice(0, 3).map(todo => (
       <div className="todo-preview text-xs truncate">
         {todo.title}
       </div>
     ))}
     {todosForDay.length > 3 && (
       <div className="text-xs text-gray-500">+{todosForDay.length - 3} more</div>
     )}
   </div>
   ```

**Singapore Public Holidays** (2025):
- New Year's Day: Jan 1
- Chinese New Year: Jan 29-30
- Good Friday: Apr 18
- Labour Day: May 1
- Vesak Day: May 12
- Hari Raya Puasa: Mar 31
- Hari Raya Haji: Jun 7
- National Day: Aug 9
- Deepavali: Oct 20
- Christmas: Dec 25

**Edge Cases**:
- Todo without due date → Not shown on calendar
- Multiple todos on same day → Show first 3, "+X more" indicator
- Month with 5 weeks vs 6 weeks → Dynamic row count
- Click on past date → Allow viewing past todos

---

## Security Requirements

### Authentication Security

1. **WebAuthn Implementation**:
   - Use challenge-response authentication (prevents replay attacks)
   - Verify origin matches expected RP ID
   - Validate authenticator counter increments
   - Store credentials securely in database

2. **Session Management**:
   - JWT tokens signed with secret key (env variable)
   - HTTP-only cookies (prevent XSS)
   - Secure flag in production (HTTPS)
   - 7-day expiration with no auto-renewal

3. **CSRF Protection**:
   - SameSite cookie attribute: `Lax` or `Strict`
   - Verify origin header on state-changing requests

### API Security

1. **Authorization**:
   - Every API route checks session
   - User can only access own data (filter by session.userId)
   - No direct ID manipulation (e.g., can't access /api/todos/123 if not owner)

2. **Input Validation**:
   - Sanitize all user inputs
   - Validate types and formats
   - Use prepared statements (prevent SQL injection)
   - Limit string lengths (prevent DoS)

3. **Rate Limiting** (Future Enhancement):
   - Limit requests per IP/user
   - Prevent brute force attacks

### Data Security

1. **Database**:
   - Single-user access (no shared data)
   - CASCADE delete for data integrity
   - No sensitive data stored (only todos, no passwords)

2. **Export/Import**:
   - Validate imported JSON structure
   - No arbitrary code execution
   - File size limits

---

## Testing Strategy

### E2E Testing (Playwright)

**Test Files**:
1. `tests/01-authentication.spec.ts`
   - Register new user
   - Login with existing user
   - Session persistence
   - Logout

2. `tests/02-todo-crud.spec.ts`
   - Create todo with priority
   - Edit todo title
   - Toggle completion
   - Delete todo

3. `tests/03-recurring-todos.spec.ts`
   - Create daily recurring todo
   - Complete and verify next instance
   - Test all recurrence patterns

4. `tests/04-subtasks.spec.ts`
   - Add subtasks to todo
   - Toggle subtask completion
   - Verify progress calculation

5. `tests/05-tags.spec.ts`
   - Create tags
   - Assign tags to todos
   - Filter by tag

6. `tests/06-reminders.spec.ts`
   - Set reminder on todo
   - Mock time to trigger notification
   - Verify notification sent

7. `tests/07-templates.spec.ts`
   - Save todo as template
   - Use template to create new todo
   - Verify subtasks copied

8. `tests/08-search-filter.spec.ts`
   - Search by title
   - Filter by priority
   - Combine multiple filters

9. `tests/09-export-import.spec.ts`
   - Export all data
   - Delete todos
   - Import and verify restoration

10. `tests/10-calendar.spec.ts`
    - Navigate calendar months
    - Verify todos on correct dates
    - Check holiday display

**Test Configuration**:
```typescript
// playwright.config.ts
export default {
  use: {
    timezoneId: 'Asia/Singapore',
    launchOptions: {
      args: ['--enable-features=WebAuthenticationTestingAPI']
    }
  }
}
```

### Unit Testing (Optional)

**Priority Areas**:
- `lib/timezone.ts` - Date calculations
- `lib/db.ts` - Database operations
- Recurrence logic - Next due date calculation
- Progress calculation - Subtask percentages

---

## Deployment Requirements

### Environment Variables

```env
# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# WebAuthn Configuration
RP_ID=localhost  # or your-domain.com
RP_NAME=Todo App
RP_ORIGIN=http://localhost:3000  # or https://your-domain.com

# Database
DATABASE_PATH=./todos.db

# Node Environment
NODE_ENV=production
```

### Railway Deployment

1. **Setup**:
   - Connect GitHub repository
   - Configure build command: `npm run build`
   - Configure start command: `npm start`
   - Add environment variables

2. **SQLite Persistence**:
   - Mount volume at `/app/data`
   - Set `DATABASE_PATH=/app/data/todos.db`
   - Ensure write permissions

3. **Health Check**:
   - Endpoint: `/api/health`
   - Response: `{ status: 'ok' }`

### Production Checklist

- ✅ HTTPS enabled (required for WebAuthn)
- ✅ JWT_SECRET set (not default value)
- ✅ RP_ID matches domain
- ✅ RP_ORIGIN matches deployment URL
- ✅ Database file persists across deployments
- ✅ Error logging configured
- ✅ CORS configured if needed
- ✅ Timezone set to Asia/Singapore

---

## Success Metrics

### User Engagement
- **Daily Active Users**: Users logging in daily
- **Average Todos Created**: Per user per week
- **Recurring Todo Usage**: % of users with recurring todos
- **Template Usage**: % of users creating templates

### Feature Adoption
- **WebAuthn Registration**: % completion rate
- **Reminder Opt-in**: % users enabling notifications
- **Tag Usage**: Average tags per user
- **Calendar Usage**: % users visiting calendar view
- **Export Usage**: % users exporting data

### Performance
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)

### Quality
- **Bug Reports**: < 5 per 100 users per month
- **Crash Rate**: < 0.1%
- **Test Coverage**: > 80% E2E coverage

---

## Out of Scope

### Explicitly Excluded Features

1. **Multi-user Collaboration**
   - No shared todos or workspaces
   - No real-time collaboration
   - No user invitations

2. **Mobile Apps**
   - No native iOS/Android apps
   - Web app is mobile-responsive

3. **Third-party Integrations**
   - No calendar sync (Google Calendar, Outlook)
   - No Slack/Teams notifications
   - No email reminders

4. **Advanced Features**
   - No file attachments
   - No comments/discussions
   - No time tracking
   - No Gantt charts
   - No dependencies between todos

5. **Social Features**
   - No user profiles
   - No following/followers
   - No public todos
   - No sharing

---

## Future Enhancements

### Phase 2 (Post-MVP)

1. **Smart Due Dates**
   - Natural language processing: "tomorrow at 3pm"
   - Suggest due dates based on patterns

2. **Analytics Dashboard**
   - Completion rates over time
   - Most productive hours
   - Tag usage statistics

3. **Bulk Operations**
   - Bulk edit (change priority for multiple todos)
   - Bulk delete
   - Bulk tag assignment

4. **Dark Mode Improvements**
   - Theme customization
   - Scheduled auto-switch

5. **Offline Support**
   - Service worker for offline access
   - Local-first with sync

### Phase 3 (Long-term)

1. **AI Features**
   - Auto-categorization (suggest tags)
   - Smart scheduling (optimal due dates)
   - Todo suggestions based on habits

2. **Advanced Recurrence**
   - Custom patterns (every 2 weeks on Monday)
   - Skip holidays
   - Exceptions (skip specific dates)

3. **Subtask Templates**
   - Conditional subtasks (if X, then Y)
   - Subtask dependencies

4. **Mobile Apps**
   - React Native apps for iOS/Android
   - Push notifications via FCM/APNs

5. **Integrations**
   - Calendar sync (2-way)
   - Email to todo
   - API for third-party apps

---

## Appendix

### Technology Decisions

**Why Next.js 16?**
- Full-stack framework (no separate backend)
- App Router for modern React patterns
- API routes for backend logic
- Excellent TypeScript support
- Built-in middleware for route protection

**Why better-sqlite3?**
- Synchronous API (simpler code)
- Single-file database (easy deployment)
- No separate DB server needed
- Excellent performance for single-user app
- Easy backup (just copy file)

**Why WebAuthn?**
- Passwordless = better security
- Native browser support (no library overhead)
- Biometric auth improves UX
- Phishing-resistant
- Future-proof (industry standard)

**Why Singapore Timezone?**
- Requirement specified by project
- Consistent timezone prevents edge cases
- Simplifies testing and debugging

### Code Style Guide

**TypeScript**:
- Strict mode enabled
- Explicit return types on functions
- No `any` types (use `unknown` if needed)
- Prefer interfaces over types

**React**:
- Functional components only
- Hooks for state management
- Prop types via TypeScript interfaces
- Extract complex logic to custom hooks

**Naming Conventions**:
- Components: PascalCase (`TodoItem`)
- Functions: camelCase (`createTodo`)
- Constants: UPPER_SNAKE_CASE (`MAX_TITLE_LENGTH`)
- Database tables: snake_case (`todo_tags`)

**File Organization**:
```
app/
  page.tsx          # Main todo page
  calendar/
    page.tsx        # Calendar view
  api/
    todos/
      route.ts      # GET /api/todos, POST /api/todos
      [id]/
        route.ts    # PUT/DELETE /api/todos/[id]
lib/
  db.ts             # Database layer
  auth.ts           # Session management
  timezone.ts       # Singapore timezone utilities
```

---

## Glossary

- **WebAuthn**: Web Authentication API for passwordless login
- **Passkey**: User credential stored in device (fingerprint, face ID, security key)
- **RP (Relying Party)**: Your application in WebAuthn terminology
- **JWT**: JSON Web Token for session management
- **better-sqlite3**: Synchronous SQLite library for Node.js
- **Recurrence Pattern**: Schedule for repeating todos (daily, weekly, etc.)
- **Subtask**: Child task belonging to a todo
- **Tag**: Label for categorizing todos
- **Template**: Reusable todo pattern
- **Singapore Timezone**: UTC+8, used for all date/time operations
- **Playwright**: E2E testing framework

---

**Document Version**: 1.0  
**Last Updated**: November 12, 2025  
**Author**: AI Agent  
**Status**: Master PRP - Ready for Implementation

---

## Usage Instructions for AI Agents

When implementing features from this PRP:

1. **Always reference** `.github/copilot-instructions.md` for project-specific patterns
2. **Use Singapore timezone** functions from `lib/timezone.ts`
3. **Follow API route patterns** with session authentication
4. **Maintain database schema** as defined in this document
5. **Write E2E tests** using Playwright with virtual authenticators
6. **Validate inputs** according to specifications
7. **Handle edge cases** listed in each feature section
8. **Update types** in `lib/db.ts` when adding fields
9. **Test with production-like data** (multiple todos, tags, subtasks)
10. **Document breaking changes** and migration steps

For specific feature implementation, reference individual PRP files in the `PRPs/` directory.
