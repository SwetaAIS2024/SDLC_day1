# Search & Filtering - User Quickstart Guide

Welcome to the Search & Filtering feature! This guide will help you quickly find and organize your todos using powerful search and filtering tools.

---

## Quick Start (3 Steps)

### 1. Search for Todos

Type in the search bar to find todos by title or description:

```
Search: "meeting"
→ Shows: "Prepare meeting agenda", "Team meeting notes"
```

**Pro Tip:** Check "Include tags in search" to also search by tag names!

### 2. Apply Filters

Click the "Filters" button to open the filter panel:
- **Status:** All, Incomplete, or Completed
- **Priority:** High, Medium, Low (select multiple)
- **Tags:** Click tags to filter by them
- **Due Date:** Today, This Week, Overdue, etc.

### 3. Clear Filters

Click individual badge X buttons, or use "Clear All Filters" to start fresh.

---

## Common Use Cases

### Use Case 1: Find Overdue Tasks

**Scenario:** You want to catch up on missed deadlines.

**Steps:**
1. Click "Filters"
2. Under "Due Date", select "Overdue"
3. Review the list of incomplete todos with past due dates

**Result:** Quickly see what needs immediate attention.

---

### Use Case 2: Focus on High-Priority Work

**Scenario:** You need to focus on urgent tasks for today.

**Steps:**
1. Click "Filters"
2. Check "High" under Priority
3. Select "Incomplete" under Status

**Result:** See only unfinished high-priority todos.

---

### Use Case 3: Search by Project Tag

**Scenario:** You want to see all tasks for a specific project.

**Steps:**
1. Click "Filters"
2. Click the "ProjectX" tag in the Tags section

**Result:** All todos tagged with "ProjectX" appear.

---

### Use Case 4: Plan This Week

**Scenario:** Monday morning - review what's due this week.

**Steps:**
1. Click "Filters"
2. Under "Due Date", select "This Week"
3. Optionally add Status: "Incomplete"

**Result:** See your week's workload at a glance.

---

### Use Case 5: Combined Search

**Scenario:** Find high-priority client todos.

**Steps:**
1. Type "client" in search bar
2. Click "Filters"
3. Check "High" under Priority
4. Optionally select "Client" tag

**Result:** Narrow down to exactly what you need.

---

## Feature Details

### Search Bar

**Basic Search:**
- Searches todo titles and descriptions
- Case-insensitive
- Supports special characters and emoji (📝, 🎯, etc.)
- Max 100 characters

**Advanced Search:**
- Enable "Include tags in search" checkbox
- Also searches tag names
- Example: Search "urgent" finds todos with "urgent" tag

---

### Filter Panel

#### Status Filter (Radio Buttons)
- **All:** Show completed and incomplete todos
- **Incomplete:** Only active tasks
- **Completed:** Only finished tasks

#### Priority Filter (Checkboxes)
- Select one or more priorities
- **Multiple selections = OR logic** (High OR Medium)
- Color-coded: 🔴 High | 🟡 Medium | 🔵 Low

#### Tag Filter (Clickable Chips)
- Click tags to toggle selection
- **Multiple tags = OR logic** (Work OR Personal)
- Selected tags have a blue ring
- If no tags exist, you'll see: "No tags available. Create tags to filter by them."

#### Due Date Range (Dropdown)
- **All:** No date filtering
- **Overdue:** Incomplete todos past their due date
- **Today:** Due today (Singapore timezone)
- **This Week:** Due within current week (Monday-Sunday)
- **This Month:** Due within current month
- **No Due Date:** Todos without a due date

---

### Active Filter Badges

When filters are active, colored badges appear showing what's applied:

- **Purple:** Search terms
- **Green:** Status filter
- **Red/Yellow/Blue:** Priority filters
- **Tag Colors:** Tag filters (uses tag's custom color)
- **Indigo:** Due date range

**Remove Filters:**
- Click the X on any badge to remove that specific filter
- Or click "Clear All" in the filter panel

---

### Filter Stats

When filtering, see: **"Showing X of Y todos"**

This helps you understand how many todos match your criteria.

---

## Tips & Best Practices

### 1. Start Broad, Then Narrow

Don't apply all filters at once. Start with one filter and add more:
1. First: Select "Incomplete"
2. Then: Add "High" priority
3. Finally: Search for specific text

### 2. Use Tags Effectively

Create tags for:
- Projects: "ProjectX", "ClientA"
- Contexts: "Home", "Office", "Mobile"
- Themes: "Learning", "Finance", "Health"

Then use tag filters to group related todos.

### 3. Weekly Planning Workflow

**Monday Morning:**
1. Filter by "This Week"
2. Check "Incomplete" status
3. Review and prioritize your week

**Friday Afternoon:**
1. Filter by "Completed"
2. Select "This Week"
3. Review your accomplishments!

### 4. Daily Focus Workflow

**Start of Day:**
1. Filter by "Overdue" - tackle these first
2. Then filter by "Today" - your daily goals
3. Finally check "High" priority - urgent items

### 5. Search Shortcuts

- **Find client work:** Search "client" + Tag filter "Work"
- **Find meeting prep:** Search "meeting" or "agenda"
- **Find recurring tasks:** Search "weekly" or "monthly"

---

## Frequently Asked Questions

### Q: Why don't I see any todos after filtering?

**A:** Your filters might be too restrictive. Click "Clear All Filters" to reset, then apply filters one at a time to see which one is causing empty results.

### Q: Can I save my favorite filter combinations?

**A:** Not yet! This is a planned feature for Phase 2. For now, you'll need to manually reapply filters each session.

### Q: How does "Overdue" work?

**A:** "Overdue" shows only **incomplete** todos with a due date in the past (based on Singapore timezone). Completed todos are never shown as overdue.

### Q: What does the number in "Filters (3)" mean?

**A:** It shows how many individual filters are currently active. In this example, you have 3 active filters applied.

### Q: Can I filter by multiple tags with AND logic?

**A:** Not currently - multiple tag selections use OR logic (shows todos with ANY selected tag). AND logic (todos with ALL selected tags) is a potential future enhancement.

### Q: Does search work on subtask titles?

**A:** No, the new search & filter system searches only todo titles, descriptions, and tag names (when advanced search is enabled). Subtasks are not included in search currently.

### Q: What happens to my filters when I create a new todo?

**A:** Filters remain active! If your new todo matches the current filters, it will appear in the list. Otherwise, you won't see it until you adjust or clear filters.

### Q: Can I share a filtered view with someone?

**A:** Not yet - filters are not saved in the URL. This is planned for a future update to enable shareable filtered views.

---

## Keyboard Shortcuts (Planned)

The following shortcuts are planned for Phase 2:

- `Ctrl/Cmd + F` - Focus search bar
- `Ctrl/Cmd + K` - Clear all filters
- `Ctrl/Cmd + Shift + F` - Toggle filter panel

---

## Performance Notes

The filter system is designed for speed:

- **Debounced search:** Results appear 300ms after you stop typing
- **Client-side filtering:** No server requests needed (instant results)
- **Optimized for 1000+ todos:** Smooth performance even with large lists

If you experience slowness, try:
1. Clearing your browser cache
2. Closing other browser tabs
3. Reloading the page

---

## Troubleshooting

### Issue: Search isn't working

**Solution:** Wait ~300ms after typing for results to appear. This prevents lag while typing.

### Issue: Tag filter shows no results

**Solution:** Make sure the todo actually has that tag. Click on a todo to edit and verify its tags.

### Issue: "This Week" shows unexpected todos

**Solution:** Remember dates are in Singapore timezone (SGT). Check if the todo's due date falls within Monday-Sunday of the current week.

### Issue: Filter panel won't open

**Solution:** Try refreshing the page. If the issue persists, check your browser console for errors.

---

## Examples Gallery

### Example 1: Project Manager

**Goal:** Review all incomplete high-priority tasks for Project Alpha

**Filters:**
- Search: (empty)
- Status: Incomplete
- Priority: High ✓
- Tags: ProjectAlpha ✓
- Due Date: All

**Result:** 5 of 47 todos

---

### Example 2: Freelancer

**Goal:** Find all client work due this week

**Filters:**
- Search: (empty)
- Status: Incomplete
- Priority: (none)
- Tags: Client ✓
- Due Date: This Week

**Result:** 12 of 67 todos

---

### Example 3: Student

**Goal:** Catch up on overdue assignments

**Filters:**
- Search: assignment
- Status: Incomplete
- Priority: (none)
- Tags: (none)
- Due Date: Overdue

**Result:** 3 of 34 todos

---

## What's Next?

Now that you know how to search and filter, explore these related features:

1. **Tags:** Create and manage tags for better organization
2. **Priority System:** Learn how to set priorities effectively
3. **Due Dates:** Schedule tasks with reminders
4. **Templates:** Save frequent todo patterns

---

## Need Help?

- **Check the full documentation:** See `SEARCH_FILTERING_IMPLEMENTATION.md`
- **Report bugs:** Use the feedback form
- **Request features:** Submit enhancement ideas

**Happy filtering! 🎯**

---

Last Updated: November 13, 2025
