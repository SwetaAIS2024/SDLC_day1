import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';
import type { TemplateSubtask } from '@/lib/db';

// GET /api/templates/[id] - Get single template with details
export async function GET(
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

    const template = templateDB.getByIdWithTags(session.userId, templateId);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Parse subtasks JSON
    let subtasks: TemplateSubtask[] = [];
    if (template.subtasks_json) {
      try {
        subtasks = JSON.parse(template.subtasks_json);
      } catch (error) {
        console.error('Invalid subtasks JSON:', error);
        subtasks = [];
      }
    }

    return NextResponse.json({ template, subtasks }, { status: 200 });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update template
export async function PUT(
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

    // Check if template exists and belongs to user
    const existingTemplate = templateDB.getById(session.userId, templateId);
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validation
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length < 1 || body.name.length > 200) {
        return NextResponse.json(
          { error: 'Template name must be between 1 and 200 characters' },
          { status: 400 }
        );
      }
    }

    if (body.category !== undefined && body.category !== null && body.category.length > 50) {
      return NextResponse.json(
        { error: 'Category must be 50 characters or less' },
        { status: 400 }
      );
    }

    if (body.subtasks && Array.isArray(body.subtasks)) {
      if (body.subtasks.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 subtasks allowed' },
          { status: 400 }
        );
      }

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

    if (body.due_date_offset_days !== undefined && body.due_date_offset_days !== null) {
      if (typeof body.due_date_offset_days !== 'number' || body.due_date_offset_days < 0) {
        return NextResponse.json(
          { error: 'due_date_offset_days must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Prepare updates object
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.recurrence_pattern !== undefined) updates.recurrence_pattern = body.recurrence_pattern;
    if (body.reminder_minutes !== undefined) updates.reminder_minutes = body.reminder_minutes;
    if (body.due_date_offset_days !== undefined) updates.due_date_offset_days = body.due_date_offset_days;

    // Handle subtasks serialization
    if (body.subtasks !== undefined) {
      updates.subtasks_json = body.subtasks && body.subtasks.length > 0
        ? JSON.stringify(body.subtasks)
        : null;
    }

    // Update template
    const updatedTemplate = templateDB.update(session.userId, templateId, updates);

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    // Update tags if provided
    if (body.tag_ids !== undefined && Array.isArray(body.tag_ids)) {
      templateDB.setTags(templateId, body.tag_ids);
    }

    // Fetch updated template with tags
    const templateWithTags = templateDB.getByIdWithTags(session.userId, templateId);

    return NextResponse.json({ template: templateWithTags }, { status: 200 });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
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

    // Check if template exists and belongs to user
    const existingTemplate = templateDB.getById(session.userId, templateId);
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete template (CASCADE will remove template_tags entries)
    const deleted = templateDB.delete(session.userId, templateId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
