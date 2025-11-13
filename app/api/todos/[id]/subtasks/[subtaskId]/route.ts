/**
 * API Route: /api/todos/[id]/subtasks/[subtaskId]
 * Handles PUT (update subtask) and DELETE (delete subtask)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB, db } from '@/lib/db';

/**
 * PUT /api/todos/[id]/subtasks/[subtaskId]
 * Update a subtask
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id, subtaskId } = await context.params;
  const todoId = parseInt(id, 10);
  const subtaskIdNum = parseInt(subtaskId, 10);

  if (isNaN(todoId) || isNaN(subtaskIdNum)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Verify subtask belongs to user's todo
  const subtask = db.prepare(`
    SELECT s.*, t.user_id 
    FROM subtasks s
    JOIN todos t ON s.todo_id = t.id
    WHERE s.id = ?
  `).get(subtaskIdNum) as any;

  if (!subtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  if (subtask.user_id !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, completed, position } = body;

  // Validate inputs
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title must be a non-empty string' }, { status: 400 });
    }
    if (title.length > 500) {
      return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
    }
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'Completed must be a boolean' }, { status: 400 });
  }

  if (position !== undefined && (typeof position !== 'number' || position < 0)) {
    return NextResponse.json({ error: 'Position must be a non-negative number' }, { status: 400 });
  }

  // Update subtask
  try {
    const updatedSubtask = subtaskDB.update(session.userId, todoId, subtaskIdNum, {
      title: title !== undefined ? title.trim() : undefined,
      completed,
      position
    });

    if (!updatedSubtask) {
      return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
    }

    return NextResponse.json({ subtask: updatedSubtask }, { status: 200 });
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

/**
 * DELETE /api/todos/[id]/subtasks/[subtaskId]
 * Delete a subtask
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id, subtaskId } = await context.params;
  const todoId = parseInt(id, 10);
  const subtaskIdNum = parseInt(subtaskId, 10);

  if (isNaN(todoId) || isNaN(subtaskIdNum)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Verify subtask belongs to user's todo
  const subtask = db.prepare(`
    SELECT s.*, t.user_id 
    FROM subtasks s
    JOIN todos t ON s.todo_id = t.id
    WHERE s.id = ?
  `).get(subtaskIdNum) as any;

  if (!subtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  if (subtask.user_id !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete subtask
  try {
    const deleted = subtaskDB.delete(session.userId, todoId, subtaskIdNum);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted_id: subtaskIdNum }, { status: 200 });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
