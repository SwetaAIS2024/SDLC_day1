import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const now = getSingaporeNow();
    const currentTime = now.getTime();

    // Get all incomplete todos with reminders and due dates
    const todos = todoDB.getAll(session.userId);
    
    const todosNeedingNotification = todos.filter(todo => {
      // Must have reminder set and due date
      if (!todo.reminder_minutes || !todo.due_date || todo.completed_at) {
        return false;
      }

      // Calculate reminder time
      const dueDate = new Date(todo.due_date);
      const reminderTime = dueDate.getTime() - (todo.reminder_minutes * 60 * 1000);

      // Check if it's time to send reminder
      if (currentTime < reminderTime) {
        return false; // Too early
      }

      // Check if already notified
      if (todo.last_notification_sent) {
        const lastNotified = new Date(todo.last_notification_sent).getTime();
        // Don't notify again if notified within the last hour
        if (currentTime - lastNotified < 60 * 60 * 1000) {
          return false;
        }
      }

      return true;
    });

    // Update last_notification_sent for todos being notified
    const notificationTime = now.toISOString();
    todosNeedingNotification.forEach(todo => {
      todoDB.update(session.userId, todo.id, {
        last_notification_sent: notificationTime
      });
    });

    return NextResponse.json({
      todos: todosNeedingNotification,
      count: todosNeedingNotification.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking notifications:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}
