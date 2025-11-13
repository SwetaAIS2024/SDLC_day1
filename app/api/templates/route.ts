import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';
import type { Priority, RecurrencePattern, ReminderMinutes } from '@/lib/types';
import type { TemplateSubtask } from '@/lib/db';

// GET /api/templates - Get all templates for authenticated user
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Check for category filter
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const templates = templateDB.getAllWithTags(
      session.userId,
      category || undefined
    );

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (body.name.length < 1 || body.name.length > 200) {
      return NextResponse.json(
        { error: 'Template name must be between 1 and 200 characters' },
        { status: 400 }
      );
    }

    if (body.category && body.category.length > 50) {
      return NextResponse.json(
        { error: 'Category must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Validate subtasks array
    if (body.subtasks && Array.isArray(body.subtasks)) {
      if (body.subtasks.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 subtasks allowed' },
          { status: 400 }
        );
      }

      // Validate each subtask
      for (const subtask of body.subtasks) {
        if (!subtask.title || typeof subtask.title !== 'string') {
          return NextResponse.json(
            { error: 'Each subtask must have a title' },
            { status: 400 }
          );
        }
        if (subtask.title.length > 200) {
          return NextResponse.json(
            { error: 'Subtask title must be 200 characters or less' },
            { status: 400 }
          );
        }
      }
    }

    // Validate due_date_offset_days
    if (body.due_date_offset_days !== undefined && body.due_date_offset_days !== null) {
      if (typeof body.due_date_offset_days !== 'number' || body.due_date_offset_days < 0) {
        return NextResponse.json(
          { error: 'due_date_offset_days must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Serialize subtasks to JSON
    const subtasksJson = body.subtasks && body.subtasks.length > 0
      ? JSON.stringify(body.subtasks)
      : null;

    // Create template
    const template = templateDB.create({
      user_id: session.userId,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      priority: body.priority || 'medium',
      recurrence_pattern: body.recurrence_pattern || null,
      reminder_minutes: body.reminder_minutes || null,
      due_date_offset_days: body.due_date_offset_days || null,
      subtasks_json: subtasksJson,
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    // Add tags if provided
    if (body.tag_ids && Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
      templateDB.setTags(template.id, body.tag_ids);
    }

    // Fetch template with tags
    const templateWithTags = templateDB.getByIdWithTags(session.userId, template.id);

    return NextResponse.json({ template: templateWithTags }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
