# Template System - Quick Start Guide

## What are Templates?

Templates are reusable todo patterns that save you time when creating similar tasks repeatedly. Think of them as "blueprints" for your todos - they remember all the details like priority, subtasks, tags, and even calculate due dates automatically.

---

## Getting Started

### Step 1: Create a Todo

First, create a todo with all the details you want to reuse:

```
Title: Weekly Team Meeting
Priority: High
Subtasks:
  - Prepare agenda
  - Share meeting notes
  - Update project board
Tags: Work, Team
```

### Step 2: Save as Template

Click the **💾 Template** button on your todo card. You'll be prompted for:

1. **Template Name**: Give it a memorable name (e.g., "Weekly Team Meeting Template")
2. **Category** (optional): Organize templates (e.g., "Work", "Personal", "Fitness")
3. **Due Date Offset** (optional): How many days from now should todos be due? (e.g., "3" for 3 days)

**Example**:
- Template Name: `Weekly Team Meeting Template`
- Category: `Work`
- Due Offset: `3` (due in 3 days)

✅ Your template is saved!

### Step 3: Use Your Template

1. Click **📋 Templates** button in the header
2. Browse or filter by category
3. Find your template and click **Use Template**
4. A new todo is created instantly with:
   - Same title, priority, and tags
   - All subtasks copied over
   - Due date automatically calculated (today + offset)

---

## Common Use Cases

### 🏢 Project Manager - Weekly Reports

**Template**: "Weekly Status Report"
- **Category**: Work
- **Priority**: High
- **Due Offset**: 7 days (every Friday)
- **Subtasks**:
  - Collect team updates
  - Draft report
  - Send to stakeholders
- **Tags**: Reporting, Team

**Usage**: Every Monday, click "Use Template" to create next Friday's report with all checklist items.

### 💪 Fitness Enthusiast - Workout Days

**Templates**:
1. "Leg Day"
   - **Category**: Fitness
   - **Priority**: Medium
   - **Subtasks**: Squats, Lunges, Deadlifts, Calf raises
   - **Tags**: Gym, Strength

2. "Cardio Day"
   - **Category**: Fitness
   - **Priority**: Medium
   - **Subtasks**: Warm-up, 30min run, Cool-down, Stretching
   - **Tags**: Gym, Cardio

**Usage**: Schedule workouts for the week in seconds by using templates instead of recreating each todo.

### ✍️ Content Creator - Blog Publishing

**Template**: "Publish Blog Post"
- **Category**: Content
- **Priority**: High
- **Due Offset**: 7 days
- **Subtasks**:
  - Research topic
  - Write draft
  - Edit and proofread
  - Create images
  - Schedule post
  - Share on social media
- **Tags**: Blogging, Marketing

**Usage**: Start a new post by using the template, automatically scheduling publication 1 week out.

### 🏠 Homeowner - Monthly Chores

**Template**: "Monthly House Cleaning"
- **Category**: Personal
- **Priority**: Medium
- **Due Offset**: 30 days
- **Recurrence**: Monthly
- **Subtasks**:
  - Clean gutters
  - Change HVAC filters
  - Deep clean kitchen
  - Organize garage
- **Tags**: Home, Maintenance

**Usage**: Create recurring monthly cleaning tasks with one click.

---

## Template Management

### View All Templates

1. Click **📋 Templates** in the header
2. Browse templates in grid view
3. Use category filter buttons to find templates quickly

### Edit a Template

1. Open Templates modal
2. Click **Edit** on any template
3. Modify:
   - Template name
   - Category
   - Due date offset
4. Click **Update** to save changes

**Note**: Editing a template doesn't affect todos already created from it. Only future uses will have the updated values.

### Delete a Template

1. Open Templates modal
2. Click **Delete** on the template
3. Confirm deletion

⚠️ **Warning**: Deleting a template is permanent, but todos created from it are NOT deleted.

### Filter by Category

Use category buttons at the top of the template modal to filter:
- **All**: Show every template
- **Work**: Only work-related templates
- **Personal**: Personal templates
- **Custom Categories**: Any categories you've created

---

## Tips & Best Practices

### 📝 Naming Templates

**Good Names**:
- "Weekly Team Standup"
- "Monthly Budget Review"
- "Morning Workout Routine"

**Bad Names**:
- "Template 1"
- "Todo"
- "asdf"

**Why**: Descriptive names help you find the right template quickly.

### 🗂️ Use Categories

Group similar templates:
- **Work**: Professional tasks
- **Personal**: Home, family, hobbies
- **Fitness**: Workouts, health
- **Learning**: Courses, reading, practice

**Benefit**: Filter instantly to the templates you need.

### ⏱️ Set Smart Due Offsets

**Examples**:
- Weekly tasks: 7 days
- Daily tasks: 1 day
- Monthly reviews: 30 days
- Urgent tasks: 0 days (due today)

**Tip**: Leave offset blank if due dates vary (you can set them manually when creating the todo).

### ✓ Keep Subtasks Generic

**Good Subtasks** (reusable):
- "Collect data"
- "Draft report"
- "Review with team"

**Bad Subtasks** (too specific):
- "Collect Q3 2025 sales data"
- "Draft October report"

**Why**: Generic subtasks work for multiple uses. Edit specific details in the todo itself.

### 🏷️ Pre-Select Tags

Add relevant tags to templates so todos are auto-tagged:
- Work templates → `Work`, `Team`
- Urgent templates → `Urgent`, `Priority`
- Routine templates → `Routine`, `Maintenance`

**Benefit**: Instant categorization and filtering.

---

## Keyboard Shortcuts & Quick Actions

While there are no dedicated keyboard shortcuts yet, here's how to be efficient:

1. **Quick Save**: After creating a todo, immediately click 💾 Template
2. **Bulk Creation**: Use a template multiple times in a row for batch planning
3. **Template First**: Create templates BEFORE todos for new workflows

---

## Troubleshooting

### Template Not Creating Todo

**Problem**: Clicking "Use Template" doesn't create a todo.

**Solutions**:
- Check if you're logged in (refresh page)
- Verify template has a valid name
- Check browser console for errors
- Try refreshing the Templates modal

### Subtasks Missing from New Todo

**Problem**: Template has subtasks, but new todo doesn't.

**Solutions**:
- Expand subtasks section on the new todo (click ▶ Subtasks)
- Verify template subtasks were saved (Edit template to check)
- Re-save template with subtasks

### Due Date Not Set

**Problem**: New todo has no due date despite template having offset.

**Solutions**:
- Check if template has `due_date_offset_days` set (Edit template)
- Verify offset is not 0 (0 = no due date)
- Manually set due date on the todo if needed

### Tags Not Appearing

**Problem**: Template has tags, but new todo doesn't.

**Solutions**:
- Verify tags still exist (go to Manage Tags)
- Check if tags were removed since template creation
- Re-edit template to re-associate tags

---

## FAQs

**Q: Can I share templates with other users?**  
A: Not yet. Templates are private to your account. This feature is planned for Phase 2.

**Q: Can I edit a todo created from a template?**  
A: Yes! Todos created from templates are normal todos. Edit them as usual.

**Q: Does editing a template update existing todos?**  
A: No. Template changes only affect new todos created from the template.

**Q: How many templates can I create?**  
A: There's no hard limit, but we recommend keeping templates organized with categories.

**Q: Can I export/import templates?**  
A: Not currently. Templates are stored in your database. Export/import is a planned feature.

**Q: What happens to templates if I delete a tag?**  
A: The tag is removed from the template automatically (CASCADE delete). Templates remain intact.

**Q: Can I have recurring templates?**  
A: Templates store the recurrence pattern. When you use a template with recurrence, the new todo will be recurring.

**Q: Can I preview a template before using it?**  
A: Not yet. You can see metadata (subtasks count, tags, priority) in the template card. Full preview is planned.

---

## Advanced Features

### Due Date Offset Math

**How it works**:
```
Template Due Offset: 3 days
Today: November 13, 2025
New Todo Due Date: November 16, 2025 (3 days from now)
```

**Custom Due Dates**:
When using a template, you can override the offset by providing a custom due date via the API (advanced users only).

### JSON Subtasks Format

Subtasks are stored as JSON:
```json
[
  {"title": "Step 1", "position": 0},
  {"title": "Step 2", "position": 1}
]
```

**Validation**:
- Max 50 subtasks per template
- Max 200 characters per subtask title

---

## Best Workflows

### Morning Planning Routine

1. Open Templates modal
2. Use "Daily Planning" template → Creates todo with planning checklist
3. Use "Check Emails" template
4. Use "Review Calendar" template
5. Close modal → 3 todos created in 10 seconds

### Weekly Reset

1. Every Monday, use templates:
   - "Weekly Goals"
   - "Client Check-ins"
   - "Team 1:1s"
2. All due dates auto-calculated for the week
3. All subtasks and tags pre-filled

### Project Kickoff

1. Create templates for project phases:
   - "Phase 1: Research"
   - "Phase 2: Design"
   - "Phase 3: Development"
   - "Phase 4: Testing"
2. Use each template at project start
3. Adjust due dates manually based on timeline

---

## Feedback & Support

Found a bug? Have a feature request?

- Check `TEMPLATE_SYSTEM_IMPLEMENTATION.md` for technical details
- Review `USER_GUIDE.md` for general app usage
- Refer to `PRPs/07-template-system.md` for original requirements

---

**Happy Templating! 🎉**

*Last Updated: November 13, 2025*
