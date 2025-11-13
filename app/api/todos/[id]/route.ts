import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';

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
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const todo = todoDB.getById(session.userId, todoId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}

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
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, completed_at, priority, due_date, recurrence_pattern, reminder_minutes } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return NextResponse.json({ error: 'Title must be a string' }, { status: 400 });
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (trimmedTitle.length > 500) {
        return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
      }
    }

    // Validate completed_at if provided
    if (completed_at !== undefined && completed_at !== null && typeof completed_at !== 'string') {
      return NextResponse.json({ error: 'Completed_at must be a string or null' }, { status: 400 });
    }

    // Validate priority if provided
    if (priority !== undefined && priority !== null && !['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json({ 
        error: 'Priority must be one of: high, medium, low' 
      }, { status: 400 });
    }

    // Validate due_date if provided
    if (due_date !== undefined && due_date !== null) {
      const date = new Date(due_date);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
      }
    }

    const updatedTodo = todoDB.update(session.userId, todoId, {
      title,
      completed_at,
      priority,
      due_date,
      recurrence_pattern,
      reminder_minutes,
    });

    if (!updatedTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTodo, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

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
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const success = todoDB.delete(session.userId, todoId);
    if (!success) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
