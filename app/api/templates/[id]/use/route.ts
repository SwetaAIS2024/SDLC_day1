import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, todoDB, subtaskDB, todoTagDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';
import type { TemplateSubtask } from '@/lib/db';

// POST /api/templates/[id]/use - Create todo from template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const templateId = parseInt(id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    // Fetch template with tags
    const template = templateDB.getByIdWithTags(session.userId, templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Calculate due date
    let dueDate: string | null = null;
    
    // Custom due date takes precedence
    if (body.custom_due_date) {
      const customDate = new Date(body.custom_due_date);
      if (isNaN(customDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid custom_due_date format' },
          { status: 400 }
        );
      }
      dueDate = customDate.toISOString();
    } 
    // Otherwise use offset if specified
    else if (template.due_date_offset_days !== null && template.due_date_offset_days !== undefined) {
      const now = getSingaporeNow();
      const offsetDate = now.plus({ days: template.due_date_offset_days });
      dueDate = offsetDate.toISO();
    }

    // Create todo from template
    const todo = todoDB.create(session.userId, {
      title: template.name,
      priority: template.priority,
      recurrence_pattern: template.recurrence_pattern,
      due_date: dueDate,
      reminder_minutes: template.reminder_minutes,
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Failed to create todo from template' },
        { status: 500 }
      );
    }

    // Add description if template has one (update the todo)
    if (template.description) {
      // Note: We need to add description field to todos table or handle it separately
      // For now, we'll skip description as it's not in the current Todo schema
    }

    // Parse and create subtasks
    if (template.subtasks_json) {
      try {
        const subtasks: TemplateSubtask[] = JSON.parse(template.subtasks_json);
        for (const subtask of subtasks) {
          subtaskDB.create(todo.id, subtask.title, subtask.position);
        }
      } catch (error) {
        console.error('Error parsing subtasks JSON:', error);
        // Continue without subtasks
      }
    }

    // Copy tags to new todo
    if (template.tags && template.tags.length > 0) {
      const tagIds = template.tags.map(tag => tag.id);
      todoTagDB.setTags(todo.id, tagIds);
    }

    // Fetch the complete todo with subtasks and tags
    const completeTodo = todoDB.getByIdWithSubtasks(session.userId, todo.id);

    return NextResponse.json(
      {
        todo: completeTodo,
        message: `Todo created from template '${template.name}'`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating todo from template:', error);
    return NextResponse.json(
      { error: 'Failed to create todo from template' },
      { status: 500 }
    );
  }
}
