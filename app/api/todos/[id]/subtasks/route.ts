/**
 * API Route: /api/todos/[id]/subtasks
 * Handles GET (list subtasks) and POST (create subtask)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';

/**
 * GET /api/todos/[id]/subtasks
 * Retrieve all subtasks for a todo
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const todoId = parseInt(id, 10);

  if (isNaN(todoId)) {
    return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
  }

  // Verify todo belongs to user
  const todo = todoDB.getById(session.userId, todoId);
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  // Get subtasks
  const subtasks = subtaskDB.getAllForTodo(session.userId, todoId);

  return NextResponse.json({ subtasks }, { status: 200 });
}

/**
 * POST /api/todos/[id]/subtasks
 * Create a new subtask
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const todoId = parseInt(id, 10);

  if (isNaN(todoId)) {
    return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
  }

  // Verify todo belongs to user
  const todo = todoDB.getById(session.userId, todoId);
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, position } = body;

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (title.length > 500) {
    return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
  }

  // Validate position if provided
  if (position !== undefined && (typeof position !== 'number' || position < 0)) {
    return NextResponse.json({ error: 'Position must be a non-negative number' }, { status: 400 });
  }

  // Create subtask
  try {
    const subtask = subtaskDB.create(session.userId, todoId, {
      title: title.trim()
    });

    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }
}
