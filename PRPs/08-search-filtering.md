# PRP 08: Search & Filtering

## Feature Overview

The Search & Filtering system enables users to quickly find specific todos in large lists through real-time text search and multi-criteria filtering. The system supports basic text search (title/description), advanced search (including tags), and compound filters (status, priority, tags, due date ranges). All operations are performed client-side for instant responsiveness, with debouncing to optimize performance.

**Key Capabilities:**
- Real-time text search across todo titles and descriptions
- Advanced search mode including tag names
- Multi-select tag filtering
- Priority level filtering (High/Medium/Low)
- Status filtering (Completed/Incomplete/All)
- Due date range filtering (Today, This Week, Overdue, etc.)
- Combine multiple filters simultaneously
- Clear all filters with one click
- Client-side filtering for sub-100ms response times

**Technical Foundation:**
- No additional database tables (uses existing todos, tags, subtasks)
- Pure client-side filtering with React state
- Debounced search input (300ms delay)
- Memoized filter functions for performance
- URL query params for shareable filter states (optional)

---

## User Stories

### Primary Users

**Emma - Power User with 200+ Todos**
> "I have hundreds of todos accumulated over months. When I need to find a specific task, I want to search by keyword and see results instantly. I also want to filter by tag like 'urgent' to see only critical items."

**Liam - Project Manager**
> "I manage multiple projects with different priorities. I need to filter todos by 'High' priority AND 'Work' tag to focus on critical work items. Then I want to clear filters and view all todos again."

**Sophia - Freelancer**
> "At the start of each week, I filter todos due 'This Week' to plan my schedule. Sometimes I also search for specific client names in todo descriptions to review all tasks for that client."

**Noah - Student**
> "During exam season, I filter for 'overdue' todos to catch up on missed assignments. I also search for course names like 'CS101' to see all related tasks quickly."

---

## User Flow

### Flow 1: Basic Text Search

1. User types in search bar at top of todo list
2. After 300ms debounce, search executes
3. System filters todos where:
   - Title contains search term (case-insensitive), OR
   - Description contains search term
4. Filtered todos display in real-time
5. Search result count shown: "Showing 5 of 42 todos"
6. User clears search (X button or backspace) to see all todos

### Flow 2: Advanced Search (Including Tags)

1. User toggles "Advanced Search" switch/checkbox
2. Search now includes tag names in filter criteria
3. User types "urgent"
4. System filters todos where:
   - Title contains "urgent", OR
   - Description contains "urgent", OR
   - Any associated tag name contains "urgent"
5. Todos tagged with "urgent" or "urgency" appear in results
6. User can toggle advanced search off to revert to basic search

### Flow 3: Multi-Criteria Filtering

1. User opens "Filters" panel (collapsible section or modal)
2. User selects filters:
   - **Priority**: High, Medium (multi-select checkboxes)
   - **Status**: Incomplete only (radio buttons)
   - **Tags**: "Work", "Meeting" (multi-select tag chips)
   - **Due Date**: "This Week" (dropdown)
3. Filters apply immediately with AND logic:
   - (Priority = High OR Medium) AND
   - (Status = Incomplete) AND
   - (Has tag "Work" OR "Meeting") AND
   - (Due date within this week)
4. Active filter badges display above todo list
5. User clicks "Clear All Filters" button to reset

### Flow 4: Combining Search + Filters

1. User types "report" in search bar
2. Filters apply (shows todos with "report" in title/description)
3. User then selects "High" priority filter
4. Results narrow to high-priority todos containing "report"
5. All criteria stack (search AND priority filter)
6. User can remove individual filters or clear all

---

## Technical Requirements

### Database Schema

**No new tables required.** Filtering uses existing data:
- `todos` table (title, description, priority, completed, due_date)
- `tags` table + `todo_tags` junction table
- `subtasks` table (for progress percentage calculations)

### TypeScript Types

**Add to `app/page.tsx` or create `lib/types.ts`:**

```typescript
export type FilterStatus = 'all' | 'completed' | 'incomplete';
export type FilterDueDateRange = 'all' | 'today' | 'this-week' | 'this-month' | 'overdue' | 'no-due-date';

export interface SearchFilters {
  searchTerm: string;
  advancedSearch: boolean; // Include tags in search
  status: FilterStatus;
  priorities: Priority[]; // Multi-select
  tagIds: number[]; // Multi-select
  dueDateRange: FilterDueDateRange;
}

export interface FilterStats {
  totalTodos: number;
  filteredTodos: number;
  activeFilterCount: number;
}
```

### API Endpoints

**No new API endpoints required.** All filtering happens client-side using data already fetched from:
- `GET /api/todos` (returns all user's todos with tags and subtasks)
- `GET /api/tags` (returns all user's tags)

**Why Client-Side?**
- Instant feedback (no network latency)
- Typical todo lists < 1000 items (manageable in browser memory)
- Reduces server load
- Enables complex compound filters without complex SQL queries
- Simplifies implementation (no backend changes needed)

### Filter Logic Implementation

**Core filtering function in `app/page.tsx`:**

```typescript
import { useMemo, useState } from 'react';
import { TodoWithSubtasksAndTags, Priority } from '@/lib/db';
import { getSingaporeNow, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '@/lib/timezone';

function filterTodos(
  todos: TodoWithSubtasksAndTags[],
  filters: SearchFilters
): TodoWithSubtasksAndTags[] {
  return todos.filter(todo => {
    // 1. Search Term Filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesTitle = todo.title.toLowerCase().includes(term);
      const matchesDescription = todo.description?.toLowerCase().includes(term) || false;
      
      let matchesTags = false;
      if (filters.advancedSearch) {
        matchesTags = todo.tags.some(tag => tag.name.toLowerCase().includes(term));
      }

      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // 2. Status Filter
    if (filters.status === 'completed' && !todo.completed) return false;
    if (filters.status === 'incomplete' && todo.completed) return false;

    // 3. Priority Filter (multi-select, OR logic)
    if (filters.priorities.length > 0) {
      if (!filters.priorities.includes(todo.priority)) return false;
    }

    // 4. Tag Filter (multi-select, OR logic)
    if (filters.tagIds.length > 0) {
      const todoTagIds = todo.tags.map(t => t.id);
      const hasAnySelectedTag = filters.tagIds.some(id => todoTagIds.includes(id));
      if (!hasAnySelectedTag) return false;
    }

    // 5. Due Date Range Filter
    if (filters.dueDateRange !== 'all') {
      const now = getSingaporeNow();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      if (filters.dueDateRange === 'no-due-date') {
        if (todo.due_date !== null) return false;
      } else if (filters.dueDateRange === 'overdue') {
        if (!todo.due_date || new Date(todo.due_date) >= todayStart || todo.completed) {
          return false;
        }
      } else if (filters.dueDateRange === 'today') {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        if (dueDate < todayStart || dueDate > todayEnd) return false;
      } else if (filters.dueDateRange === 'this-week') {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        if (dueDate < weekStart || dueDate > weekEnd) return false;
      } else if (filters.dueDateRange === 'this-month') {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        if (dueDate < monthStart || dueDate > monthEnd) return false;
      }
    }

    return true; // Passed all filters
  });
}
```

### Performance Optimization

**Debounced Search Input:**

```typescript
import { useEffect, useState } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in component
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);

// Use debouncedSearch in filters
const filters: SearchFilters = {
  searchTerm: debouncedSearch,
  // ... other filters
};
```

**Memoized Filtered Results:**

```typescript
const filteredTodos = useMemo(() => {
  return filterTodos(todos, filters);
}, [todos, filters]);
```

---

## UI Components

### Search Bar Component

```tsx
'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  advancedSearch: boolean;
  onToggleAdvanced: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  advancedSearch,
  onToggleAdvanced,
  placeholder = 'Search todos...'
}: SearchBarProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Advanced Search Toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={advancedSearch}
          onChange={onToggleAdvanced}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span>Include tags in search</span>
      </label>
    </div>
  );
}
```

### Filter Panel Component

```tsx
'use client';

import { Priority, Tag } from '@/lib/db';
import { FilterStatus, FilterDueDateRange } from '@/lib/types';

interface FilterPanelProps {
  status: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  selectedPriorities: Priority[];
  onPrioritiesChange: (priorities: Priority[]) => void;
  selectedTagIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
  dueDateRange: FilterDueDateRange;
  onDueDateRangeChange: (range: FilterDueDateRange) => void;
  availableTags: Tag[];
  onClearAll: () => void;
}

export function FilterPanel({
  status,
  onStatusChange,
  selectedPriorities,
  onPrioritiesChange,
  selectedTagIds,
  onTagIdsChange,
  dueDateRange,
  onDueDateRangeChange,
  availableTags,
  onClearAll,
}: FilterPanelProps) {
  const togglePriority = (priority: Priority) => {
    if (selectedPriorities.includes(priority)) {
      onPrioritiesChange(selectedPriorities.filter(p => p !== priority));
    } else {
      onPrioritiesChange([...selectedPriorities, priority]);
    }
  };

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onTagIdsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagIdsChange([...selectedTagIds, tagId]);
    }
  };

  const hasActiveFilters = 
    status !== 'all' ||
    selectedPriorities.length > 0 ||
    selectedTagIds.length > 0 ||
    dueDateRange !== 'all';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="space-y-1">
          {(['all', 'incomplete', 'completed'] as FilterStatus[]).map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                checked={status === s}
                onChange={() => onStatusChange(s)}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="space-y-1">
          {(['high', 'medium', 'low'] as Priority[]).map(p => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPriorities.includes(p)}
                onChange={() => togglePriority(p)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{p}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        {availableTags.length === 0 ? (
          <p className="text-sm text-gray-500">No tags available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 text-sm rounded transition ${
                  selectedTagIds.includes(tag.id)
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: tag.color, color: '#fff' }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due Date Range Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
        <select
          value={dueDateRange}
          onChange={(e) => onDueDateRangeChange(e.target.value as FilterDueDateRange)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="this-week">Due This Week</option>
          <option value="this-month">Due This Month</option>
          <option value="no-due-date">No Due Date</option>
        </select>
      </div>
    </div>
  );
}
```

### Active Filter Badges

```tsx
'use client';

import { X } from 'lucide-react';
import { Priority, Tag } from '@/lib/db';
import { FilterStatus, FilterDueDateRange } from '@/lib/types';

interface ActiveFilterBadgesProps {
  status: FilterStatus;
  onRemoveStatus: () => void;
  selectedPriorities: Priority[];
  onRemovePriority: (priority: Priority) => void;
  selectedTags: Tag[];
  onRemoveTag: (tagId: number) => void;
  dueDateRange: FilterDueDateRange;
  onRemoveDueDateRange: () => void;
  searchTerm: string;
  onRemoveSearch: () => void;
}

export function ActiveFilterBadges({
  status,
  onRemoveStatus,
  selectedPriorities,
  onRemovePriority,
  selectedTags,
  onRemoveTag,
  dueDateRange,
  onRemoveDueDateRange,
  searchTerm,
  onRemoveSearch,
}: ActiveFilterBadgesProps) {
  const hasActiveFilters =
    searchTerm ||
    status !== 'all' ||
    selectedPriorities.length > 0 ||
    selectedTags.length > 0 ||
    dueDateRange !== 'all';

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {searchTerm && (
        <FilterBadge label={`Search: "${searchTerm}"`} onRemove={onRemoveSearch} />
      )}

      {status !== 'all' && (
        <FilterBadge label={`Status: ${status}`} onRemove={onRemoveStatus} />
      )}

      {selectedPriorities.map(priority => (
        <FilterBadge
          key={priority}
          label={`Priority: ${priority}`}
          onRemove={() => onRemovePriority(priority)}
        />
      ))}

      {selectedTags.map(tag => (
        <FilterBadge
          key={tag.id}
          label={`Tag: ${tag.name}`}
          onRemove={() => onRemoveTag(tag.id)}
          color={tag.color}
        />
      ))}

      {dueDateRange !== 'all' && (
        <FilterBadge
          label={`Due: ${dueDateRange.replace('-', ' ')}`}
          onRemove={onRemoveDueDateRange}
        />
      )}
    </div>
  );
}

function FilterBadge({
  label,
  onRemove,
  color,
}: {
  label: string;
  onRemove: () => void;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
      style={
        color
          ? { backgroundColor: color, color: '#fff' }
          : { backgroundColor: '#e5e7eb', color: '#374151' }
      }
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-black/10 rounded-full p-0.5"
        title="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
```

### Filter Stats Display

```tsx
interface FilterStatsProps {
  totalTodos: number;
  filteredTodos: number;
}

export function FilterStats({ totalTodos, filteredTodos }: FilterStatsProps) {
  if (totalTodos === filteredTodos) return null;

  return (
    <div className="text-sm text-gray-600 mb-2">
      Showing <span className="font-semibold">{filteredTodos}</span> of{' '}
      <span className="font-semibold">{totalTodos}</span> todos
    </div>
  );
}
```

---

## Edge Cases

### 1. Empty Search Results
**Scenario:** User's search/filters return zero todos.
**Handling:** Display empty state message with clear filters button.

```tsx
{filteredTodos.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg mb-4">No todos match your filters</p>
    <button
      onClick={handleClearAllFilters}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Clear All Filters
    </button>
  </div>
)}
```

### 2. Special Characters in Search
**Scenario:** User searches for regex special characters like `*`, `[`, `.`.
**Handling:** Escape special characters or use plain string matching (no regex).

```typescript
// Safe approach: use string.includes() instead of regex
const matchesTitle = todo.title.toLowerCase().includes(term.toLowerCase());
```

### 3. Very Long Search Terms (>100 chars)
**Scenario:** User pastes extremely long text into search bar.
**Handling:** Truncate or limit search term length.

```typescript
const MAX_SEARCH_LENGTH = 100;
const handleSearchChange = (value: string) => {
  setSearchInput(value.slice(0, MAX_SEARCH_LENGTH));
};
```

### 4. Rapid Filter Changes
**Scenario:** User toggles multiple filters quickly in succession.
**Handling:** Debouncing already handles search input. Filter changes apply immediately (no debounce needed for checkboxes).

### 5. Conflicting Filters
**Scenario:** User filters for "Completed" status + "Overdue" due date (no logical match).
**Handling:** Show empty results. Display message: "No todos match these criteria. Try adjusting filters."

### 6. Large Todo Lists (1000+ items)
**Scenario:** Performance degradation with many todos.
**Handling:** 
- Use `useMemo` for filtered results
- Consider virtualization (react-window) for rendering
- Add loading skeleton during initial fetch

```typescript
const filteredTodos = useMemo(() => {
  return filterTodos(todos, filters);
}, [todos, filters]);
```

### 7. No Tags Created Yet
**Scenario:** User opens tag filter but has no tags.
**Handling:** Display message "No tags available. Create tags to filter by them."

### 8. Unicode/Emoji in Search
**Scenario:** User searches for emoji or non-English characters.
**Handling:** Unicode-safe string matching works by default with `.includes()`.

```typescript
// Works correctly with emoji and Unicode
'📝 Write report'.toLowerCase().includes('📝'); // true
'项目会议'.includes('会议'); // true
```

### 9. Date Range Edge Cases
**Scenario:** User filters "This Week" on Sunday night vs Monday morning.
**Handling:** Use Singapore timezone functions consistently.

```typescript
import { getSingaporeNow, startOfWeek, endOfWeek } from '@/lib/timezone';

const now = getSingaporeNow();
const weekStart = startOfWeek(now); // Always starts on Monday in Singapore
const weekEnd = endOfWeek(now);
```

### 10. Filter State Persistence
**Scenario:** User refreshes page and loses filter state.
**Handling:** 
- Option 1: Store filters in localStorage
- Option 2: Encode filters in URL query params
- Option 3: Accept transient state (simplest)

**URL Query Params Approach (Optional):**

```typescript
import { useRouter, useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const router = useRouter();

useEffect(() => {
  const params = new URLSearchParams();
  if (filters.searchTerm) params.set('search', filters.searchTerm);
  if (filters.status !== 'all') params.set('status', filters.status);
  // ... encode other filters

  router.replace(`/?${params.toString()}`, { scroll: false });
}, [filters]);
```

---

## Acceptance Criteria

### Functional Requirements

✅ **Basic Text Search**
- [ ] Search input filters todos by title (case-insensitive)
- [ ] Search input filters todos by description
- [ ] Search term is debounced (300ms delay)
- [ ] Clearing search (X button or empty input) shows all todos
- [ ] Empty search results display helpful message

✅ **Advanced Search**
- [ ] "Include tags in search" checkbox toggles advanced mode
- [ ] Advanced search filters by tag names in addition to title/description
- [ ] Partial tag name matches work (e.g., "urg" matches "urgent" tag)

✅ **Status Filter**
- [ ] Radio buttons for "All", "Incomplete", "Completed"
- [ ] Only one status can be selected at a time
- [ ] Status filter applies immediately (no submit button)

✅ **Priority Filter**
- [ ] Checkboxes for "High", "Medium", "Low"
- [ ] Multiple priorities can be selected (OR logic)
- [ ] Deselecting all priorities shows all priorities (no filter)

✅ **Tag Filter**
- [ ] All user's tags displayed as clickable chips
- [ ] Selected tags have visual indicator (ring/border)
- [ ] Multiple tags can be selected (OR logic)
- [ ] Todos with ANY selected tag are shown

✅ **Due Date Range Filter**
- [ ] Dropdown with options: All, Overdue, Today, This Week, This Month, No Due Date
- [ ] "Overdue" shows incomplete todos with due_date < today
- [ ] "Today" shows todos due today (Singapore timezone)
- [ ] "This Week" shows todos due within current week (Monday-Sunday)
- [ ] "This Month" shows todos due within current month
- [ ] "No Due Date" shows todos with null due_date

✅ **Combined Filters**
- [ ] All filters work together with AND logic
- [ ] Search term + filters narrow results correctly
- [ ] Active filter badges display above todo list
- [ ] Each badge can be removed individually
- [ ] "Clear All Filters" button resets everything

✅ **UI Requirements**
- [ ] Filter stats show "X of Y todos" when filters active
- [ ] Empty state message when no results
- [ ] Smooth transitions when filters change
- [ ] Filter panel can be collapsed/expanded (optional)
- [ ] Mobile-responsive layout

✅ **Performance**
- [ ] Filtering completes in < 100ms for 500 todos
- [ ] Search input debouncing prevents excessive re-renders
- [ ] Filtered results memoized with `useMemo`

---

## Testing Requirements

### E2E Tests (Playwright)

**Test File:** `tests/08-search-filtering.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { authenticateUser, createTodo, createTag } from './helpers';

test.describe('Search & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/');

    // Create test data
    await createTodo(page, { title: 'Buy groceries', priority: 'high' });
    await createTodo(page, { title: 'Write report', priority: 'medium', description: 'Quarterly report' });
    await createTodo(page, { title: 'Call dentist', priority: 'low' });
    
    const urgentTag = await createTag(page, { name: 'urgent', color: '#ff0000' });
    await page.goto('/'); // Reload to see todos with tags
  });

  test('should filter todos by search term in title', async ({ page }) => {
    await page.fill('input[placeholder="Search todos..."]', 'report');
    await page.waitForTimeout(350); // Wait for debounce

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos.first()).toContainText('Write report');
  });

  test('should filter todos by search term in description', async ({ page }) => {
    await page.fill('input[placeholder="Search todos..."]', 'quarterly');
    await page.waitForTimeout(350);

    await expect(page.locator('.todo-card:has-text("Write report")')).toBeVisible();
  });

  test('should clear search with X button', async ({ page }) => {
    await page.fill('input[placeholder="Search todos..."]', 'report');
    await page.waitForTimeout(350);
    
    await page.click('button[title="Clear search"]');
    
    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(3); // All todos visible
  });

  test('should include tags in advanced search', async ({ page }) => {
    await page.check('input[type="checkbox"] + span:has-text("Include tags")');
    await page.fill('input[placeholder="Search todos..."]', 'urgent');
    await page.waitForTimeout(350);

    // Todos with "urgent" tag should appear
    await expect(page.locator('.todo-card')).toHaveCount(1);
  });

  test('should filter by priority (single selection)', async ({ page }) => {
    await page.check('input[type="checkbox"] + span:has-text("High")');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos.first()).toContainText('Buy groceries');
  });

  test('should filter by multiple priorities (OR logic)', async ({ page }) => {
    await page.check('input[type="checkbox"] + span:has-text("High")');
    await page.check('input[type="checkbox"] + span:has-text("Medium")');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(2);
  });

  test('should filter by status (incomplete only)', async ({ page }) => {
    // Mark one todo as complete
    await page.click('.todo-card:has-text("Call dentist") input[type="checkbox"]');

    await page.check('input[type="radio"] + span:has-text("Incomplete")');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(2);
    await expect(page.locator('.todo-card:has-text("Call dentist")')).not.toBeVisible();
  });

  test('should filter by tag selection', async ({ page }) => {
    // Click tag chip to filter
    await page.click('button:has-text("urgent")');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(1);
  });

  test('should filter by due date range (Today)', async ({ page }) => {
    await page.selectOption('select', 'today');

    // Only todos due today should show
    // (Requires test data with today's due date)
  });

  test('should filter by due date range (Overdue)', async ({ page }) => {
    await page.selectOption('select', 'overdue');

    // Only overdue incomplete todos should show
  });

  test('should combine search + priority filter', async ({ page }) => {
    await page.fill('input[placeholder="Search todos..."]', 'Buy');
    await page.waitForTimeout(350);
    await page.check('input[type="checkbox"] + span:has-text("High")');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos.first()).toContainText('Buy groceries');
  });

  test('should display filter stats', async ({ page }) => {
    await page.check('input[type="checkbox"] + span:has-text("High")');

    await expect(page.locator('text=/Showing 1 of 3 todos/')).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    await page.fill('input[placeholder="Search todos..."]', 'nonexistent');
    await page.waitForTimeout(350);

    await expect(page.locator('text="No todos match your filters"')).toBeVisible();
  });

  test('should clear all filters with button', async ({ page }) => {
    await page.fill('input[placeholder="Search todos..."]', 'report');
    await page.check('input[type="checkbox"] + span:has-text("High")');
    await page.click('button:has-text("Clear All Filters")');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(3);
    await expect(page.locator('input[placeholder="Search todos..."]')).toHaveValue('');
  });

  test('should remove individual filter badge', async ({ page }) => {
    await page.check('input[type="checkbox"] + span:has-text("High")');
    
    // Click X on "Priority: High" badge
    await page.click('.filter-badge:has-text("Priority: High") button');

    const visibleTodos = page.locator('.todo-card');
    await expect(visibleTodos).toHaveCount(3);
  });

  test('should handle special characters in search', async ({ page }) => {
    await createTodo(page, { title: 'Todo with [brackets]' });
    
    await page.fill('input[placeholder="Search todos..."]', '[brackets]');
    await page.waitForTimeout(350);

    await expect(page.locator('.todo-card:has-text("[brackets]")')).toBeVisible();
  });

  test('should handle Unicode/emoji in search', async ({ page }) => {
    await createTodo(page, { title: '📝 Meeting notes' });
    
    await page.fill('input[placeholder="Search todos..."]', '📝');
    await page.waitForTimeout(350);

    await expect(page.locator('.todo-card:has-text("📝")')).toBeVisible();
  });
});
```

### Unit Tests

**Test File:** `lib/__tests__/filter-todos.test.ts`

```typescript
import { filterTodos } from '../filters';
import { TodoWithSubtasksAndTags, Priority } from '../db';

describe('Filter Todos Function', () => {
  const mockTodos: TodoWithSubtasksAndTags[] = [
    {
      id: 1,
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
      priority: 'high',
      completed: false,
      due_date: '2025-11-15T10:00:00+08:00',
      tags: [{ id: 1, name: 'urgent', color: '#ff0000' }],
      subtasks: [],
    },
    {
      id: 2,
      title: 'Write report',
      description: 'Quarterly report',
      priority: 'medium',
      completed: false,
      due_date: null,
      tags: [],
      subtasks: [],
    },
    {
      id: 3,
      title: 'Call dentist',
      description: null,
      priority: 'low',
      completed: true,
      due_date: '2025-11-10T09:00:00+08:00',
      tags: [],
      subtasks: [],
    },
  ];

  test('should filter by search term in title', () => {
    const filters = { searchTerm: 'report', advancedSearch: false };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Write report');
  });

  test('should filter by search term in description', () => {
    const filters = { searchTerm: 'quarterly', advancedSearch: false };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(1);
  });

  test('should include tags in advanced search', () => {
    const filters = { searchTerm: 'urgent', advancedSearch: true };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(1);
    expect(result[0].tags[0].name).toBe('urgent');
  });

  test('should filter by priority', () => {
    const filters = { priorities: ['high' as Priority] };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(1);
    expect(result[0].priority).toBe('high');
  });

  test('should filter by multiple priorities', () => {
    const filters = { priorities: ['high' as Priority, 'medium' as Priority] };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(2);
  });

  test('should filter by status (completed)', () => {
    const filters = { status: 'completed' };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(1);
    expect(result[0].completed).toBe(true);
  });

  test('should filter by status (incomplete)', () => {
    const filters = { status: 'incomplete' };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(2);
  });

  test('should combine multiple filters (AND logic)', () => {
    const filters = {
      searchTerm: 'Buy',
      priorities: ['high' as Priority],
      status: 'incomplete',
    };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Buy groceries');
  });

  test('should return empty array when no matches', () => {
    const filters = { searchTerm: 'nonexistent' };
    const result = filterTodos(mockTodos, filters);
    expect(result.length).toBe(0);
  });
});
```

---

## Out of Scope

The following are **explicitly excluded** from this feature:

❌ **Server-Side Filtering**
- No backend API endpoints for filtering (all client-side)
- No database queries for search/filter operations

❌ **Full-Text Search with Ranking**
- No relevance scoring or result ranking
- No fuzzy matching or typo tolerance
- No search result highlighting in text

❌ **Saved Searches/Filters**
- Users cannot save filter presets
- No "Favorites" or named filter combinations

❌ **Advanced Query Syntax**
- No boolean operators (AND/OR/NOT in search input)
- No field-specific search (e.g., `title:report priority:high`)

❌ **Filter Analytics**
- No tracking of most-used filters
- No filter suggestions based on usage patterns

❌ **Infinite Scroll/Pagination**
- All filtered results shown at once
- No "Load more" or virtual scrolling (unless 1000+ todos)

❌ **Export Filtered Results**
- Cannot export only filtered todos (exports all todos)

❌ **Regex Search**
- No regular expression support in search input
- Plain string matching only

❌ **Search History**
- No dropdown of recent searches
- No autocomplete suggestions

---

## Success Metrics

### Quantitative Metrics

1. **Feature Adoption Rate**
   - Target: 80% of users with 20+ todos use search/filtering within 7 days
   - Measurement: Track search input interactions and filter changes

2. **Search Effectiveness**
   - Target: 90% of searches return 1+ results
   - Measurement: Log searches with 0 results vs total searches

3. **Average Search Response Time**
   - Target: < 50ms for 90% of searches (client-side filtering)
   - Measurement: Performance.now() timing in filter function

4. **Filter Usage Frequency**
   - Target: Average 5 filter operations per user per week
   - Measurement: Count filter state changes (priority, tag, status, due date)

5. **Filter Combination Rate**
   - Target: 40% of filter sessions use 2+ criteria
   - Measurement: Track simultaneous active filters

### Qualitative Metrics

1. **User Satisfaction**
   - Survey: "How easy is it to find specific todos?"
   - Target: 85% rate 4/5 or 5/5 stars

2. **Feature Discovery**
   - Observe how quickly users find filter panel (analytics or user testing)
   - Target: 70% discover within first 10 minutes of use

3. **Empty State Handling**
   - Monitor support requests about "missing todos" (actually filtered out)
   - Target: < 2% of users report confusion

### Technical Metrics

1. **Client-Side Performance**
   - Filter function execution time < 100ms for 500 todos (p95)
   - React re-render count < 5 per filter change

2. **Browser Memory Usage**
   - No memory leaks during extended filter sessions
   - Memory footprint increase < 10MB for 1000 todos

3. **Debounce Effectiveness**
   - Search input debouncing reduces API calls by 80%
   - (If server-side search added later)

---

## Implementation Checklist

### Frontend State Management

- [ ] Add `SearchFilters` interface to types
- [ ] Create state variables for all filter criteria
- [ ] Implement debounced search input hook
- [ ] Create memoized `filterTodos` function
- [ ] Add active filter count calculation

### UI Components

- [ ] Build `SearchBar` component with advanced toggle
- [ ] Build `FilterPanel` component with all filter types
- [ ] Create `ActiveFilterBadges` component
- [ ] Add `FilterStats` display component
- [ ] Create empty state component for no results
- [ ] Add "Clear All Filters" button

### Filter Logic

- [ ] Implement text search (title + description)
- [ ] Add advanced search (include tags)
- [ ] Implement status filter (completed/incomplete)
- [ ] Implement priority multi-select filter
- [ ] Implement tag multi-select filter
- [ ] Implement due date range filter with Singapore timezone
- [ ] Combine all filters with AND logic

### Performance Optimization

- [ ] Use `useMemo` for filtered results
- [ ] Implement debounced search (300ms)
- [ ] Test with 1000+ todos for performance
- [ ] Add loading skeleton during initial fetch

### Edge Case Handling

- [ ] Handle empty search results gracefully
- [ ] Escape special characters in search
- [ ] Limit search term length (100 chars)
- [ ] Handle no tags available state
- [ ] Handle conflicting filters (show empty)
- [ ] Support Unicode/emoji in search

### Testing

- [ ] Write Playwright E2E tests for all filter types
- [ ] Test combined filters (search + priority + tags)
- [ ] Test empty states and error cases
- [ ] Write unit tests for `filterTodos` function
- [ ] Test performance with large datasets

### Documentation

- [ ] Update `USER_GUIDE.md` with search/filter instructions
- [ ] Add inline comments for complex filter logic
- [ ] Document filter combination behavior (AND vs OR)

### Optional Enhancements

- [ ] Add URL query params for shareable filter states
- [ ] Implement filter panel collapse/expand
- [ ] Add keyboard shortcuts for quick filters (optional)
- [ ] Create filter preset system (saved filters)

---

**Last Updated:** November 13, 2025
**Status:** Ready for Implementation
**Estimated Effort:** 6-8 hours (frontend components + filtering logic + testing)
