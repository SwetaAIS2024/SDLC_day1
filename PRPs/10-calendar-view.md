# PRP 10: Calendar View

## Feature Overview

The Calendar View provides a visual, monthly calendar interface for viewing and managing todos based on their due dates. This feature integrates Singapore public holidays, offers intuitive month navigation, and displays todos color-coded by priority. Users can seamlessly switch between list and calendar views to get both detailed task management and high-level schedule visualization.

**Key Capabilities:**
- Monthly calendar grid with proper week/day layout
- Todo visualization on due date cells with priority color coding
- Singapore public holidays displayed and highlighted
- Month navigation (previous/next/today/jump to date)
- Responsive design for mobile and desktop
- Day cell interactions (click to view todos, hover for preview)
- Current day highlighting
- Weekend styling differentiation
- Todo count indicators per day
- Seamless integration with existing todo system

**Technical Foundation:**
- Dedicated `/calendar` route with client component
- Reuses existing todos API (`GET /api/todos`)
- Leverages Singapore timezone utilities from `lib/timezone.ts`
- Uses Luxon DateTime for date calculations
- Fetches holidays from existing `holidays` table
- Dark mode support matching app theme

---

## User Stories

### Primary Users

**Rachel - Weekly Planner**
> "Every Monday morning, I want to see my entire week in a calendar view to understand my workload distribution. I need to quickly spot days that are too busy and move tasks around to balance my schedule."

**David - Visual Learner**
> "I struggle with long todo lists. I prefer seeing my tasks on a calendar where I can visualize when things are due. Color-coding by priority helps me identify critical deadlines at a glance."

**Sarah - Holiday Planner**
> "I need to see Singapore public holidays on my calendar so I can plan my work tasks around them. I don't want to schedule important deadlines on holidays when offices are closed."

**Michael - Month-at-a-Glance User**
> "At the start of each month, I want to review all my tasks for the next 30 days in a calendar format. This helps me identify potential conflicts and plan my month strategically."

---

## User Flow

### Flow 1: Accessing Calendar View

1. User is on main todo list page (`/`)
2. User clicks **"📅 Calendar"** button in header navigation
3. Browser navigates to `/calendar` route
4. System:
   - Fetches all todos for current user
   - Fetches Singapore holidays for current month
   - Calculates current month date range
   - Renders calendar grid
5. Calendar displays with:
   - Current month/year in header
   - Calendar grid (7 columns × 5-6 rows)
   - Todos placed on their due date cells
   - Holidays highlighted
   - Current day marked

### Flow 2: Navigating Between Months

1. User viewing calendar (e.g., November 2025)
2. User clicks **"Previous Month" (◀)** button
3. Calendar updates to October 2025:
   - Grid rebuilds for October
   - Todos with October due dates displayed
   - October holidays fetched/shown
   - Month/year header updates
4. User clicks **"Next Month" (▶)** button twice
5. Calendar advances to December 2025
6. User clicks **"Today"** button
7. Calendar jumps back to November 2025 (current month)

### Flow 3: Viewing Day Details

1. User viewing calendar with multiple todos on November 15
2. User hovers over November 15 cell:
   - Cell background highlights
   - Cursor changes to pointer
3. User clicks November 15 cell
4. Modal/panel opens showing:
   - Date: "Friday, November 15, 2025"
   - All todos due on that date (with full details)
   - Priority badges, titles, times
   - Quick actions (mark complete, edit)
5. User clicks "Close" or clicks outside
6. Modal closes, returns to calendar view

### Flow 4: Mobile Calendar Interaction

1. User accesses calendar on mobile device
2. Calendar displays in vertical layout:
   - Smaller day cells
   - Todo count badges (e.g., "3 tasks")
   - Abbreviated month names
3. User taps on a day with todos
4. Slide-up panel appears with day details
5. User swipes horizontally to navigate months
6. User taps "List View" to return to todo list

### Flow 5: Identifying Busy Days

1. User opens calendar for current month
2. System displays todo counts on each day:
   - November 10: "5 todos" (red indicator - high load)
   - November 15: "2 todos" (yellow indicator - medium)
   - November 20: "1 todo" (green indicator - light)
3. User identifies November 10 as overloaded
4. User clicks edit on a todo, changes due date to November 12
5. Calendar updates in real-time:
   - November 10 now shows "4 todos"
   - November 12 now shows "1 todo"

---

## Technical Requirements

### Data Structure

**Calendar State Interface:**

```typescript
interface CalendarState {
  currentDate: DateTime;           // Luxon DateTime object (Singapore timezone)
  viewDate: DateTime;               // Currently viewed month/year
  todos: Todo[];                    // All user todos
  holidays: Holiday[];              // Singapore holidays for view month
  selectedDate: DateTime | null;   // Currently selected day (for modal)
}

interface CalendarDay {
  date: DateTime;                   // Full date object
  dayNumber: number;                // 1-31
  isCurrentMonth: boolean;          // True if day belongs to viewed month
  isToday: boolean;                 // True if today's date
  isWeekend: boolean;               // True if Saturday/Sunday
  isHoliday: boolean;               // True if Singapore public holiday
  holidayName?: string;             // Holiday name if applicable
  todos: Todo[];                    // Todos due on this day
  todoCount: number;                // Total todos for this day
  highPriorityCount: number;        // Count of high-priority todos
}

interface CalendarMonth {
  year: number;
  month: number;                    // 1-12
  monthName: string;                // "November"
  weeks: CalendarDay[][];           // Array of weeks (each week is array of 7 days)
  firstDayOfMonth: DateTime;
  lastDayOfMonth: DateTime;
  daysInMonth: number;
}

interface Holiday {
  id: number;
  name: string;
  date: string;                     // ISO date string (YYYY-MM-DD)
  year: number;
  is_recurring: boolean;
}
```

---

### Database Schema

**No new tables required.** Uses existing:

- `todos` table (for due date queries)
- `holidays` table (already exists per copilot-instructions.md)

**Holidays Table Reference:**
```sql
-- Already exists in database
CREATE TABLE holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,           -- ISO date: YYYY-MM-DD
  year INTEGER NOT NULL,
  is_recurring BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL
);
```

**Key Queries:**

```sql
-- Get todos with due dates in specific month range
SELECT * FROM todos 
WHERE user_id = ? 
  AND due_date IS NOT NULL
  AND due_date >= ? 
  AND due_date <= ?
ORDER BY due_date ASC, priority DESC;

-- Get holidays for specific month/year
SELECT * FROM holidays
WHERE (year = ? OR is_recurring = 1)
  AND strftime('%m', date) = ?
ORDER BY date ASC;
```

---

### API Endpoints

#### 1. Get Calendar Data

**`GET /api/calendar`**

**Query Parameters:**
- `year` (number, required) - Year to view (e.g., 2025)
- `month` (number, required) - Month to view (1-12)

**Response:**
```json
{
  "month": 11,
  "year": 2025,
  "monthName": "November",
  "daysInMonth": 30,
  "firstDayOfWeek": 6,
  "todos": [
    {
      "id": 1,
      "title": "Team Meeting",
      "due_date": "2025-11-15T14:00:00+08:00",
      "priority": "high",
      "completed": false,
      "recurrence_pattern": null,
      "reminder_minutes": 30
    }
  ],
  "holidays": [
    {
      "id": 1,
      "name": "Deepavali",
      "date": "2025-11-01",
      "year": 2025,
      "is_recurring": true
    }
  ]
}
```

**Implementation Notes:**
- Validate month (1-12) and year (1900-2100)
- Use Singapore timezone for date range calculations
- Fetch todos where due_date within month range
- Include holidays for the specific year/month
- Return 400 for invalid month/year values

---

#### 2. Get Todos for Specific Day

**`GET /api/calendar/day`**

**Query Parameters:**
- `date` (string, required) - ISO date string (YYYY-MM-DD)

**Response:**
```json
{
  "date": "2025-11-15",
  "dayName": "Friday",
  "isHoliday": false,
  "holidayName": null,
  "todos": [
    {
      "id": 1,
      "title": "Team Meeting",
      "due_date": "2025-11-15T14:00:00+08:00",
      "priority": "high",
      "completed": false,
      "subtasks": [
        {
          "id": 1,
          "title": "Prepare agenda",
          "completed": true
        }
      ],
      "tags": [
        {
          "id": 1,
          "name": "Work",
          "color": "#3B82F6"
        }
      ]
    }
  ],
  "todoCount": 1,
  "completedCount": 0
}
```

**Implementation Notes:**
- Parse date string and convert to Singapore timezone
- Fetch todos with due_date on that specific day
- Include subtasks and tags for each todo
- Calculate completion statistics
- Check if date is a holiday
- Return empty array if no todos

---

### TypeScript Types

**Add to `lib/types.ts`:**

```typescript
export interface CalendarViewState {
  viewDate: Date;                   // Currently viewed month
  selectedDate: Date | null;        // Selected day for modal
  showDayModal: boolean;
  dayModalData: DayModalData | null;
}

export interface DayModalData {
  date: string;                     // YYYY-MM-DD
  dayName: string;                  // "Monday", "Tuesday", etc.
  isHoliday: boolean;
  holidayName?: string;
  todos: TodoWithRelations[];
  todoCount: number;
  completedCount: number;
}

export interface TodoWithRelations extends Todo {
  subtasks: Subtask[];
  tags: Tag[];
}

export interface CalendarDayCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  todos: Todo[];
  highPriorityCount: number;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDayCell[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  weeks: CalendarWeek[];
}
```

**Add to `lib/db.ts`:**

```typescript
export interface HolidayDB {
  getHolidaysByMonth(year: number, month: number): Holiday[];
  getHolidayByDate(date: string): Holiday | null;
  getAllHolidays(year: number): Holiday[];
}

// Export holidays DB object
export const holidayDB: HolidayDB = {
  getHolidaysByMonth(year: number, month: number): Holiday[] {
    const monthStr = month.toString().padStart(2, '0');
    return db.prepare(`
      SELECT * FROM holidays
      WHERE (year = ? OR is_recurring = 1)
        AND strftime('%m', date) = ?
      ORDER BY date ASC
    `).all(year, monthStr) as Holiday[];
  },

  getHolidayByDate(date: string): Holiday | null {
    const year = parseInt(date.split('-')[0]);
    return db.prepare(`
      SELECT * FROM holidays
      WHERE date = ? AND (year = ? OR is_recurring = 1)
      LIMIT 1
    `).get(date, year) as Holiday | null;
  },

  getAllHolidays(year: number): Holiday[] {
    return db.prepare(`
      SELECT * FROM holidays
      WHERE year = ? OR is_recurring = 1
      ORDER BY date ASC
    `).all(year) as Holiday[];
  }
};
```

---

### Calendar Utility Functions

**Add to `lib/calendar-utils.ts`:**

```typescript
import { DateTime } from 'luxon';
import { Todo } from './db';
import { CalendarDayCell, CalendarWeek, CalendarMonth } from './types';

const SINGAPORE_ZONE = 'Asia/Singapore';

/**
 * Generate calendar month grid with todos and holidays
 */
export function generateCalendarMonth(
  year: number,
  month: number,
  todos: Todo[],
  holidays: { date: string; name: string }[]
): CalendarMonth {
  const firstDay = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: SINGAPORE_ZONE }
  );
  const lastDay = firstDay.endOf('month');
  const daysInMonth = lastDay.day;

  // Build holiday map for quick lookup
  const holidayMap = new Map(
    holidays.map(h => [h.date, h.name])
  );

  // Build todo map grouped by date
  const todosByDate = new Map<string, Todo[]>();
  todos.forEach(todo => {
    if (!todo.due_date) return;
    const dueDate = DateTime.fromISO(todo.due_date, { zone: SINGAPORE_ZONE });
    const dateKey = dueDate.toISODate();
    if (!todosByDate.has(dateKey)) {
      todosByDate.set(dateKey, []);
    }
    todosByDate.get(dateKey)!.push(todo);
  });

  // Generate weeks
  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarDayCell[] = [];
  let weekNumber = 1;

  // Pad beginning of month with previous month days
  const firstDayOfWeek = firstDay.weekday % 7; // 0 = Sunday
  for (let i = 0; i < firstDayOfWeek; i++) {
    const date = firstDay.minus({ days: firstDayOfWeek - i });
    currentWeek.push(createDayCell(date, false, holidayMap, todosByDate));
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = DateTime.fromObject({ year, month, day }, { zone: SINGAPORE_ZONE });
    currentWeek.push(createDayCell(date, true, holidayMap, todosByDate));

    if (currentWeek.length === 7) {
      weeks.push({ weekNumber, days: currentWeek });
      currentWeek = [];
      weekNumber++;
    }
  }

  // Pad end of month with next month days
  if (currentWeek.length > 0) {
    const remainingDays = 7 - currentWeek.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = lastDay.plus({ days: i });
      currentWeek.push(createDayCell(date, false, holidayMap, todosByDate));
    }
    weeks.push({ weekNumber, days: currentWeek });
  }

  return {
    year,
    month,
    monthName: firstDay.toFormat('MMMM'),
    weeks
  };
}

/**
 * Create a calendar day cell with all metadata
 */
function createDayCell(
  date: DateTime,
  isCurrentMonth: boolean,
  holidayMap: Map<string, string>,
  todosByDate: Map<string, Todo[]>
): CalendarDayCell {
  const dateKey = date.toISODate()!;
  const today = DateTime.now().setZone(SINGAPORE_ZONE);
  const todosForDay = todosByDate.get(dateKey) || [];
  const isHoliday = holidayMap.has(dateKey);

  return {
    date: date.toJSDate(),
    dayNumber: date.day,
    isCurrentMonth,
    isToday: date.hasSame(today, 'day'),
    isWeekend: date.weekday === 6 || date.weekday === 7, // Saturday or Sunday
    isHoliday,
    holidayName: isHoliday ? holidayMap.get(dateKey) : undefined,
    todos: todosForDay,
    highPriorityCount: todosForDay.filter(t => t.priority === 'high').length
  };
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Navigate to next month
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Get current month and year in Singapore timezone
 */
export function getCurrentMonth(): { year: number; month: number } {
  const now = DateTime.now().setZone(SINGAPORE_ZONE);
  return { year: now.year, month: now.month };
}
```

---

## UI Components

### Main Calendar Page Component

**File:** `app/calendar/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import { Todo, Holiday } from '@/lib/db';
import { generateCalendarMonth, getPreviousMonth, getNextMonth, getCurrentMonth } from '@/lib/calendar-utils';
import { CalendarMonth, CalendarDayCell } from '@/lib/types';
import { CalendarGrid } from '@/app/components/CalendarGrid';
import { DayModal } from '@/app/components/DayModal';

export default function CalendarPage() {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(() => {
    const { year, month } = getCurrentMonth();
    return { year, month };
  });
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDayCell | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth | null>(null);

  // Fetch calendar data
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/calendar?year=${viewDate.year}&month=${viewDate.month}`
        );
        if (!response.ok) throw new Error('Failed to fetch calendar data');
        
        const data = await response.json();
        setTodos(data.todos);
        setHolidays(data.holidays);
      } catch (error) {
        console.error('Error fetching calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [viewDate]);

  // Generate calendar grid when data changes
  useEffect(() => {
    if (todos && holidays) {
      const month = generateCalendarMonth(
        viewDate.year,
        viewDate.month,
        todos,
        holidays
      );
      setCalendarMonth(month);
    }
  }, [todos, holidays, viewDate]);

  const handlePreviousMonth = () => {
    setViewDate(getPreviousMonth(viewDate.year, viewDate.month));
  };

  const handleNextMonth = () => {
    setViewDate(getNextMonth(viewDate.year, viewDate.month));
  };

  const handleToday = () => {
    setViewDate(getCurrentMonth());
  };

  const handleDayClick = (day: CalendarDayCell) => {
    setSelectedDay(day);
  };

  const handleCloseDayModal = () => {
    setSelectedDay(null);
  };

  const handleBackToList = () => {
    router.push('/');
  };

  if (loading || !calendarMonth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Calendar size={32} />
            Calendar View
          </h1>
          
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
          >
            <List size={20} />
            List View
          </button>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-white">
              {calendarMonth.monthName} {calendarMonth.year}
            </h2>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Today
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
            aria-label="Next month"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid
          month={calendarMonth}
          onDayClick={handleDayClick}
        />

        {/* Day Detail Modal */}
        {selectedDay && (
          <DayModal
            day={selectedDay}
            onClose={handleCloseDayModal}
            onTodoUpdate={() => {
              // Refresh calendar data
              setViewDate({ ...viewDate });
            }}
          />
        )}
      </div>
    </div>
  );
}
```

---

### Calendar Grid Component

**File:** `app/components/CalendarGrid.tsx`

```tsx
'use client';

import { CalendarMonth, CalendarDayCell } from '@/lib/types';
import { CalendarDayComponent } from './CalendarDay';

interface CalendarGridProps {
  month: CalendarMonth;
  onDayClick: (day: CalendarDayCell) => void;
}

export function CalendarGrid({ month, onDayClick }: CalendarGridProps) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-slate-700">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-3 text-center font-semibold text-white border-r border-slate-600 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      {month.weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 border-t border-slate-700">
          {week.days.map((day, dayIndex) => (
            <CalendarDayComponent
              key={`${day.date.toISOString()}-${dayIndex}`}
              day={day}
              onClick={() => onDayClick(day)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

### Calendar Day Cell Component

**File:** `app/components/CalendarDay.tsx`

```tsx
'use client';

import { CalendarDayCell } from '@/lib/types';

interface CalendarDayProps {
  day: CalendarDayCell;
  onClick: () => void;
}

export function CalendarDayComponent({ day, onClick }: CalendarDayProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const dayClasses = [
    'min-h-[100px] p-2 border-r border-slate-700 last:border-r-0',
    'hover:bg-slate-700/50 cursor-pointer transition-colors',
    !day.isCurrentMonth && 'bg-slate-900/50 text-gray-600',
    day.isToday && 'bg-blue-900/30 ring-2 ring-blue-500',
    day.isWeekend && 'bg-slate-800/50',
    day.isHoliday && 'bg-purple-900/20'
  ].filter(Boolean).join(' ');

  return (
    <div className={dayClasses} onClick={onClick}>
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-semibold ${
          day.isToday ? 'text-blue-400' : 
          day.isCurrentMonth ? 'text-white' : 
          'text-gray-600'
        }`}>
          {day.dayNumber}
        </span>
        
        {day.highPriorityCount > 0 && (
          <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
            {day.highPriorityCount}
          </span>
        )}
      </div>

      {/* Holiday indicator */}
      {day.isHoliday && day.holidayName && (
        <div className="text-xs text-purple-300 mb-1 truncate" title={day.holidayName}>
          🎉 {day.holidayName}
        </div>
      )}

      {/* Todos */}
      <div className="space-y-1">
        {day.todos.slice(0, 3).map(todo => (
          <div
            key={todo.id}
            className={`text-xs truncate ${getPriorityColor(todo.priority)} ${
              todo.completed ? 'line-through opacity-50' : ''
            }`}
            title={todo.title}
          >
            • {todo.title}
          </div>
        ))}
        
        {day.todos.length > 3 && (
          <div className="text-xs text-gray-400">
            +{day.todos.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Day Detail Modal Component

**File:** `app/components/DayModal.tsx`

```tsx
'use client';

import { X } from 'lucide-react';
import { DateTime } from 'luxon';
import { CalendarDayCell } from '@/lib/types';

interface DayModalProps {
  day: CalendarDayCell;
  onClose: () => void;
  onTodoUpdate: () => void;
}

export function DayModal({ day, onClose, onTodoUpdate }: DayModalProps) {
  const date = DateTime.fromJSDate(day.date).setZone('Asia/Singapore');
  const formattedDate = date.toFormat('EEEE, MMMM d, yyyy');

  const handleToggleComplete = async (todoId: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      
      if (response.ok) {
        onTodoUpdate();
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">{formattedDate}</h2>
            {day.isHoliday && day.holidayName && (
              <p className="text-sm text-purple-300 mt-1">🎉 {day.holidayName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {day.todos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No todos for this day</p>
          ) : (
            <div className="space-y-3">
              {day.todos.map(todo => (
                <div
                  key={todo.id}
                  className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id, todo.completed)}
                      className="mt-1 w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityBadge(todo.priority)} text-white`}>
                          {todo.priority}
                        </span>
                        {todo.recurrence_pattern && (
                          <span className="text-xs text-purple-300">
                            🔄 {todo.recurrence_pattern}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-white font-medium ${
                        todo.completed ? 'line-through opacity-50' : ''
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.due_date && (
                        <p className="text-sm text-gray-400 mt-1">
                          Due: {DateTime.fromISO(todo.due_date).toFormat('h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Edge Cases

### 1. Month with 6 Weeks
**Scenario:** Some months span 6 weeks (e.g., May 2025 starts on Thursday).
**Handling:** 
- Calendar grid dynamically adjusts height
- All 6 weeks displayed in grid
- Scroll if needed on small screens

```typescript
// Calendar grid accommodates variable week count
{month.weeks.map((week, index) => (
  <WeekRow key={index} week={week} />
))}
```

### 2. No Todos in Month
**Scenario:** User views month with zero todos.
**Handling:**
- Calendar displays normally
- Days show no todo indicators
- Empty state message in day modal
- No performance issues

### 3. Many Todos on Single Day (10+)
**Scenario:** User has 15 todos due on same day.
**Handling:**
- Show first 3 todos in cell
- Display "+12 more" indicator
- Full list in day modal when clicked
- Modal scrollable for long lists

```tsx
{day.todos.slice(0, 3).map(todo => (
  <TodoPreview key={todo.id} todo={todo} />
))}
{day.todos.length > 3 && (
  <div className="text-xs text-gray-400">
    +{day.todos.length - 3} more
  </div>
)}
```

### 4. Timezone Edge Cases
**Scenario:** Todo due at 11:59 PM could appear on different day in different timezones.
**Handling:**
- All dates consistently use Singapore timezone
- Use `lib/timezone.ts` utilities for all date operations
- Test with dates near midnight

```typescript
import { getSingaporeNow, toSingaporeDate } from '@/lib/timezone';

const dueDate = toSingaporeDate(todo.due_date);
const dayKey = dueDate.toISODate(); // Always Singapore timezone
```

### 5. Recurring Holidays
**Scenario:** Holiday like "Chinese New Year" changes date each year.
**Handling:**
- `is_recurring` flag in holidays table
- Fetch holidays for current year
- Recurring holidays checked for date match
- Non-recurring holidays filtered by year

```sql
SELECT * FROM holidays
WHERE (year = 2025 OR is_recurring = 1)
  AND strftime('%m', date) = '11'
```

### 6. Mobile Small Screen
**Scenario:** Calendar grid too small on mobile (< 375px width).
**Handling:**
- Responsive grid with `min-h-[80px]` instead of `min-h-[100px]`
- Todo titles abbreviated
- Show only todo count badge, not titles
- Day modal shows full details

```css
@media (max-width: 640px) {
  .calendar-day {
    min-height: 80px;
    padding: 0.5rem;
  }
  .todo-preview {
    display: none; /* Hide on mobile */
  }
  .todo-count-badge {
    display: block; /* Show count instead */
  }
}
```

### 7. Long Holiday Names
**Scenario:** Holiday name "Hari Raya Puasa" too long for cell.
**Handling:**
- CSS `truncate` class
- Full name in hover tooltip
- Abbreviate common holidays on mobile

```tsx
<div className="text-xs text-purple-300 truncate" title={day.holidayName}>
  🎉 {day.holidayName}
</div>
```

### 8. Year Boundary Navigation
**Scenario:** User navigates from December 2025 to January 2026.
**Handling:**
- `getNextMonth()` handles year increment
- `getPreviousMonth()` handles year decrement
- Fetch holidays for new year

```typescript
export function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}
```

### 9. Completed Todos Display
**Scenario:** Should completed todos show on calendar?
**Handling:**
- Show all todos (completed and incomplete)
- Strike-through completed todos
- Opacity reduced to 50%
- Allow toggling completion from day modal

### 10. Network Failure During Fetch
**Scenario:** API request fails when loading calendar.
**Handling:**
- Show error message
- Retry button
- Graceful degradation (show empty calendar)
- Don't crash entire page

```tsx
if (error) {
  return (
    <div className="text-center text-red-400 p-8">
      <p>Failed to load calendar data</p>
      <button onClick={retryFetch} className="mt-4 px-4 py-2 bg-blue-600 rounded">
        Retry
      </button>
    </div>
  );
}
```

---

## Acceptance Criteria

### Functional Requirements

✅ **Calendar Display**
- [ ] Monthly calendar grid displays with 7 columns (Sun-Sat)
- [ ] Grid shows 5-6 weeks depending on month
- [ ] Current day highlighted with distinct styling
- [ ] Weekends styled differently from weekdays
- [ ] Days from previous/next month shown in muted color
- [ ] Calendar responsive on mobile and desktop

✅ **Todo Integration**
- [ ] Todos displayed on their due date cells
- [ ] Todo titles truncated if too long
- [ ] First 3 todos visible per day, "+X more" for overflow
- [ ] Completed todos shown with strike-through
- [ ] Todo color-coded by priority (red/yellow/blue)
- [ ] High-priority count badge on days with high-priority todos
- [ ] Todos without due dates not shown on calendar

✅ **Holiday Display**
- [ ] Singapore public holidays highlighted
- [ ] Holiday names shown on calendar cells
- [ ] Holiday indicator (emoji or icon) displayed
- [ ] Holidays fetched from database
- [ ] Recurring holidays handled correctly

✅ **Navigation**
- [ ] Previous month button navigates backward
- [ ] Next month button navigates forward
- [ ] "Today" button jumps to current month
- [ ] Month/year displayed in header
- [ ] Year boundaries handled (Dec → Jan with year change)
- [ ] Navigation preserves authentication state

✅ **Day Detail Modal**
- [ ] Clicking day cell opens modal
- [ ] Modal shows full list of todos for that day
- [ ] Day name and date displayed (e.g., "Friday, November 15, 2025")
- [ ] Holiday name shown if applicable
- [ ] Todos display with full details (title, priority, time, tags)
- [ ] Checkboxes allow marking todos complete/incomplete
- [ ] Modal closeable via X button, outside click, or ESC key
- [ ] Changes in modal reflect immediately on calendar

✅ **Integration with Todo System**
- [ ] Calendar fetches todos from existing `/api/todos` endpoint
- [ ] Completing todo in modal updates todo list
- [ ] Creating todo with due date shows on calendar
- [ ] Editing todo due date moves it on calendar
- [ ] Deleting todo removes from calendar
- [ ] Calendar view link accessible from main page

✅ **Timezone Handling**
- [ ] All dates use Singapore timezone
- [ ] Midnight boundaries respect Singapore timezone
- [ ] Due date times displayed correctly
- [ ] Date calculations use Luxon with Singapore zone

---

## Testing Requirements

### E2E Tests (Playwright)

**Test File:** `tests/10-calendar-view.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { DateTime } from 'luxon';

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/');
  });

  test('should navigate to calendar view', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await expect(page).toHaveURL('/calendar');
    await expect(page.locator('h1:has-text("Calendar View")')).toBeVisible();
  });

  test('should display current month calendar', async ({ page }) => {
    await page.goto('/calendar');
    
    const now = DateTime.now().setZone('Asia/Singapore');
    const monthYear = now.toFormat('MMMM yyyy');
    
    await expect(page.locator(`h2:has-text("${monthYear}")`)).toBeVisible();
    
    // Check week day headers
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const day of weekDays) {
      await expect(page.locator(`text="${day}"`).first()).toBeVisible();
    }
  });

  test('should navigate between months', async ({ page }) => {
    await page.goto('/calendar');
    
    // Get current month
    const currentMonth = await page.locator('h2').textContent();
    
    // Click next month
    await page.click('button[aria-label="Next month"]');
    const nextMonth = await page.locator('h2').textContent();
    expect(nextMonth).not.toBe(currentMonth);
    
    // Click previous month twice to go back
    await page.click('button[aria-label="Previous month"]');
    await page.click('button[aria-label="Previous month"]');
    const previousMonth = await page.locator('h2').textContent();
    expect(previousMonth).not.toBe(currentMonth);
  });

  test('should return to current month with Today button', async ({ page }) => {
    await page.goto('/calendar');
    
    // Navigate away from current month
    await page.click('button[aria-label="Next month"]');
    await page.click('button[aria-label="Next month"]');
    
    // Click Today button
    await page.click('button:has-text("Today")');
    
    // Verify current month displayed
    const now = DateTime.now().setZone('Asia/Singapore');
    const monthYear = now.toFormat('MMMM yyyy');
    await expect(page.locator(`h2:has-text("${monthYear}")`)).toBeVisible();
  });

  test('should display todos on their due dates', async ({ page }) => {
    // Create todo with specific due date
    const tomorrow = DateTime.now()
      .setZone('Asia/Singapore')
      .plus({ days: 1 })
      .startOf('day')
      .set({ hour: 14, minute: 0 });
    
    await createTodo(page, {
      title: 'Calendar Test Todo',
      dueDate: tomorrow.toISO(),
      priority: 'high'
    });
    
    // Navigate to calendar
    await page.goto('/calendar');
    
    // Find the day cell with the todo
    const dayCell = page.locator(`text="Calendar Test Todo"`);
    await expect(dayCell).toBeVisible();
  });

  test('should show high-priority todo count badge', async ({ page }) => {
    const tomorrow = DateTime.now()
      .setZone('Asia/Singapore')
      .plus({ days: 1 });
    
    // Create 2 high-priority todos
    await createTodo(page, {
      title: 'High Priority 1',
      dueDate: tomorrow.toISO(),
      priority: 'high'
    });
    await createTodo(page, {
      title: 'High Priority 2',
      dueDate: tomorrow.toISO(),
      priority: 'high'
    });
    
    await page.goto('/calendar');
    
    // Check for badge showing count
    const badge = page.locator('.bg-red-500:has-text("2")');
    await expect(badge).toBeVisible();
  });

  test('should open day detail modal on day click', async ({ page }) => {
    // Create todo
    const tomorrow = DateTime.now()
      .setZone('Asia/Singapore')
      .plus({ days: 1 })
      .set({ hour: 14 });
    
    await createTodo(page, {
      title: 'Modal Test Todo',
      dueDate: tomorrow.toISO(),
      priority: 'medium'
    });
    
    await page.goto('/calendar');
    
    // Click on day with todo
    await page.click(`text="Modal Test Todo"`);
    
    // Verify modal opens
    const dayName = tomorrow.toFormat('EEEE, MMMM d, yyyy');
    await expect(page.locator(`text="${dayName}"`)).toBeVisible();
    await expect(page.locator('text="Modal Test Todo"')).toBeVisible();
  });

  test('should allow completing todo from day modal', async ({ page }) => {
    const tomorrow = DateTime.now()
      .setZone('Asia/Singapore')
      .plus({ days: 1 });
    
    await createTodo(page, {
      title: 'Complete Me',
      dueDate: tomorrow.toISO(),
      priority: 'high'
    });
    
    await page.goto('/calendar');
    
    // Open day modal
    await page.click('text="Complete Me"');
    
    // Check the checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    
    // Verify strike-through applied
    await expect(page.locator('.line-through:has-text("Complete Me")')).toBeVisible();
  });

  test('should display Singapore holidays', async ({ page }) => {
    // Assuming holidays are seeded in database
    await page.goto('/calendar');
    
    // Check for holiday indicators (if any in current month)
    const holidayEmoji = page.locator('text="🎉"');
    const count = await holidayEmoji.count();
    
    // If holidays exist, verify display
    if (count > 0) {
      await expect(holidayEmoji.first()).toBeVisible();
    }
  });

  test('should handle month with no todos', async ({ page }) => {
    await page.goto('/calendar');
    
    // Navigate to far future month (likely no todos)
    await page.click('button[aria-label="Next month"]');
    await page.click('button[aria-label="Next month"]');
    await page.click('button[aria-label="Next month"]');
    
    // Calendar should still display without errors
    await expect(page.locator('h2')).toBeVisible();
    
    // Click on a day
    const dayCells = page.locator('.min-h-\\[100px\\]');
    await dayCells.first().click();
    
    // Modal should show "No todos"
    await expect(page.locator('text="No todos for this day"')).toBeVisible();
  });

  test('should navigate back to list view', async ({ page }) => {
    await page.goto('/calendar');
    
    await page.click('button:has-text("List View")');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text="Add a new todo"')).toBeVisible();
  });

  test('should highlight current day', async ({ page }) => {
    await page.goto('/calendar');
    
    const today = DateTime.now().setZone('Asia/Singapore').day;
    
    // Find today's cell (with ring styling)
    const todayCell = page.locator(`.ring-2.ring-blue-500:has-text("${today}")`);
    await expect(todayCell).toBeVisible();
  });

  test('should show multiple todos and overflow indicator', async ({ page }) => {
    const tomorrow = DateTime.now()
      .setZone('Asia/Singapore')
      .plus({ days: 1 });
    
    // Create 5 todos
    for (let i = 1; i <= 5; i++) {
      await createTodo(page, {
        title: `Todo ${i}`,
        dueDate: tomorrow.toISO(),
        priority: 'medium'
      });
    }
    
    await page.goto('/calendar');
    
    // Should show first 3 and "+2 more"
    await expect(page.locator('text="Todo 1"')).toBeVisible();
    await expect(page.locator('text="Todo 2"')).toBeVisible();
    await expect(page.locator('text="Todo 3"')).toBeVisible();
    await expect(page.locator('text="+2 more"')).toBeVisible();
    
    // Click to open modal
    await page.click('text="Todo 1"');
    
    // All 5 should be visible in modal
    await expect(page.locator('text="Todo 4"')).toBeVisible();
    await expect(page.locator('text="Todo 5"')).toBeVisible();
  });
});
```

### Unit Tests

**Test File:** `lib/__tests__/calendar-utils.test.ts`

```typescript
import { DateTime } from 'luxon';
import {
  generateCalendarMonth,
  getPreviousMonth,
  getNextMonth,
  getCurrentMonth
} from '../calendar-utils';

describe('Calendar Utilities', () => {
  test('should generate correct calendar for November 2025', () => {
    const todos = [];
    const holidays = [];
    
    const calendar = generateCalendarMonth(2025, 11, todos, holidays);
    
    expect(calendar.year).toBe(2025);
    expect(calendar.month).toBe(11);
    expect(calendar.monthName).toBe('November');
    expect(calendar.weeks.length).toBeGreaterThanOrEqual(5);
    expect(calendar.weeks.length).toBeLessThanOrEqual(6);
  });

  test('should correctly identify weekends', () => {
    const calendar = generateCalendarMonth(2025, 11, [], []);
    
    const allDays = calendar.weeks.flatMap(week => week.days);
    const weekends = allDays.filter(day => day.isWeekend);
    
    // November 2025 has 8-9 weekend days depending on padding
    expect(weekends.length).toBeGreaterThan(6);
  });

  test('should place todos on correct dates', () => {
    const todos = [
      {
        id: 1,
        title: 'Test Todo',
        due_date: '2025-11-15T14:00:00+08:00',
        priority: 'high',
        completed: false
      }
    ];
    
    const calendar = generateCalendarMonth(2025, 11, todos, []);
    
    const nov15 = calendar.weeks
      .flatMap(week => week.days)
      .find(day => day.dayNumber === 15 && day.isCurrentMonth);
    
    expect(nov15?.todos.length).toBe(1);
    expect(nov15?.todos[0].title).toBe('Test Todo');
  });

  test('should identify holidays correctly', () => {
    const holidays = [
      { date: '2025-11-01', name: 'Deepavali' }
    ];
    
    const calendar = generateCalendarMonth(2025, 11, [], holidays);
    
    const nov1 = calendar.weeks
      .flatMap(week => week.days)
      .find(day => day.dayNumber === 1 && day.isCurrentMonth);
    
    expect(nov1?.isHoliday).toBe(true);
    expect(nov1?.holidayName).toBe('Deepavali');
  });

  test('should handle month navigation', () => {
    expect(getNextMonth(2025, 11)).toEqual({ year: 2025, month: 12 });
    expect(getNextMonth(2025, 12)).toEqual({ year: 2026, month: 1 });
    
    expect(getPreviousMonth(2025, 11)).toEqual({ year: 2025, month: 10 });
    expect(getPreviousMonth(2025, 1)).toEqual({ year: 2024, month: 12 });
  });

  test('should get current month in Singapore timezone', () => {
    const { year, month } = getCurrentMonth();
    
    expect(year).toBeGreaterThan(2024);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  test('should count high-priority todos correctly', () => {
    const todos = [
      { id: 1, title: 'Todo 1', due_date: '2025-11-15T10:00:00+08:00', priority: 'high', completed: false },
      { id: 2, title: 'Todo 2', due_date: '2025-11-15T14:00:00+08:00', priority: 'high', completed: false },
      { id: 3, title: 'Todo 3', due_date: '2025-11-15T16:00:00+08:00', priority: 'medium', completed: false }
    ];
    
    const calendar = generateCalendarMonth(2025, 11, todos, []);
    
    const nov15 = calendar.weeks
      .flatMap(week => week.days)
      .find(day => day.dayNumber === 15 && day.isCurrentMonth);
    
    expect(nov15?.highPriorityCount).toBe(2);
  });
});
```

---

## Out of Scope

The following are **explicitly excluded** from this feature:

❌ **Drag-and-Drop Rescheduling**
- Cannot drag todos between dates on calendar
- Must use edit modal to change due dates

❌ **Week View / Day View**
- Only monthly view supported
- No weekly or daily calendar layouts

❌ **Calendar Event Creation**
- Cannot create todos directly from calendar
- Must use main todo form

❌ **Multi-Month View**
- Shows one month at a time only
- No quarter or year overview

❌ **Calendar Sharing/Export**
- No iCal export
- No Google Calendar sync
- No sharing calendar with others

❌ **Customizable Week Start Day**
- Week always starts on Sunday
- No user preference for Monday start

❌ **Recurring Event Instances**
- Recurring todos show only current instance
- No visualization of all future occurrences

❌ **Time Slots / Hourly View**
- No time-of-day breakdown
- Shows only dates, not specific times

❌ **Print-Friendly Format**
- No special print stylesheet
- No PDF export of calendar

❌ **Mini Calendar Widget**
- No embedded calendar on main page
- Separate full-page view only

❌ **Calendar Notifications**
- No calendar-specific alerts
- Uses existing reminder system only

---

## Success Metrics

### Quantitative Metrics

1. **Feature Adoption Rate**
   - Target: 70% of users access calendar view at least once per week
   - Measurement: Track `/calendar` route visits vs active users

2. **Calendar Engagement Time**
   - Target: Average 2+ minutes per calendar session
   - Measurement: Time between calendar page load and navigation away

3. **Day Modal Interaction Rate**
   - Target: 50% of calendar sessions include at least 1 day modal open
   - Measurement: Day click events / total calendar sessions

4. **Task Completion from Calendar**
   - Target: 15% of todo completions initiated from calendar day modal
   - Measurement: Completions via calendar vs total completions

5. **Month Navigation Usage**
   - Target: 60% of users navigate to future months
   - Measurement: Next month clicks / total calendar sessions

### Qualitative Metrics

1. **User Satisfaction**
   - Survey: "How helpful is the calendar view for planning?"
   - Target: 80% rate 4/5 or 5/5 stars

2. **Visual Clarity**
   - User feedback on color coding and layout
   - Target: < 5% report visibility issues

3. **Mobile Usability**
   - Mobile-specific satisfaction survey
   - Target: 75% find mobile calendar usable

### Technical Metrics

1. **Page Load Performance**
   - Target: < 2 seconds for calendar initial render
   - Measurement: First contentful paint time

2. **API Response Time**
   - Target: < 500ms for `/api/calendar` endpoint
   - Measurement: Server-side timing logs

3. **Month Transition Speed**
   - Target: < 300ms for month navigation
   - Measurement: Time from button click to new month render

### Behavioral Metrics

1. **Discovery of Overload Days**
   - Users who reschedule tasks after viewing calendar
   - Target: 25% of calendar users edit due dates within session

2. **Holiday Awareness**
   - Reduced task creation on holiday dates
   - Target: 50% fewer todos scheduled on holidays after calendar launch

3. **Advance Planning**
   - Increased todos created with future due dates (2+ weeks)
   - Target: 20% increase in future-dated todos

---

## Implementation Checklist

### Backend Implementation

- [ ] Create `GET /api/calendar` endpoint
- [ ] Create `GET /api/calendar/day` endpoint
- [ ] Add holiday database queries to `lib/db.ts`
- [ ] Implement date range filtering for todos
- [ ] Add month/year validation
- [ ] Handle Singapore timezone in queries
- [ ] Test with various date ranges

### Frontend Implementation

- [ ] Create `/calendar` route and page component
- [ ] Build `CalendarGrid` component
- [ ] Build `CalendarDay` cell component
- [ ] Build `DayModal` component
- [ ] Implement month navigation logic
- [ ] Add "Calendar" button to main page header
- [ ] Add "List View" button to calendar page
- [ ] Implement current day highlighting
- [ ] Add weekend and holiday styling
- [ ] Implement todo completion from modal
- [ ] Add responsive mobile layout

### Utility Functions

- [ ] Create `lib/calendar-utils.ts`
- [ ] Implement `generateCalendarMonth()`
- [ ] Implement `getPreviousMonth()` and `getNextMonth()`
- [ ] Implement `getCurrentMonth()`
- [ ] Add date grouping functions
- [ ] Add holiday lookup functions

### Testing

- [ ] Write E2E tests for calendar navigation
- [ ] Test day modal interactions
- [ ] Test todo display on calendar
- [ ] Test month boundaries (Dec → Jan)
- [ ] Test holiday display
- [ ] Test responsive layouts
- [ ] Test timezone handling
- [ ] Write unit tests for calendar utilities
- [ ] Test with empty calendar
- [ ] Test with overloaded days (10+ todos)

### Documentation

- [ ] Update USER_GUIDE.md with calendar section
- [ ] Document keyboard shortcuts (if any)
- [ ] Add troubleshooting for common issues
- [ ] Create screenshot examples

---

**Last Updated:** November 13, 2025  
**Status:** Ready for Implementation  
**Estimated Effort:** 12-15 hours (backend + frontend + utilities + testing)
