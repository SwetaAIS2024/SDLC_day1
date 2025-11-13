/**
 * Notifications Hook
 * PRP-04: Manages browser notifications and polling for todo reminders
 */

'use client';

import { useEffect, useState } from 'react';
import type { Todo } from '@/lib/types';

const POLL_INTERVAL = 60000; // 60 seconds

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPolling, setIsPolling] = useState(false);

  // Check permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setIsPolling(true);
      }
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Show browser notification
  const showNotification = (todo: Todo) => {
    if (permission !== 'granted') return;

    const title = '⏰ Todo Reminder';
    const body = `Due soon: ${todo.title}`;
    
    const notification = new Notification(title, {
      body,
      icon: '/icon.png', // You can add an icon if you have one
      badge: '/badge.png',
      tag: `todo-${todo.id}`, // Prevents duplicates
      requireInteraction: true, // Notification stays until user interacts
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // Check for pending notifications
  const checkNotifications = async () => {
    if (permission !== 'granted') return;

    try {
      const response = await fetch('/api/notifications/check');
      if (!response.ok) return;

      const data = await response.json();
      
      if (data.todos && data.todos.length > 0) {
        data.todos.forEach((todo: Todo) => {
          showNotification(todo);
        });
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  // Start polling when granted
  useEffect(() => {
    if (permission !== 'granted' || !isPolling) return;

    // Check immediately
    checkNotifications();

    // Then poll every 60 seconds
    const intervalId = setInterval(checkNotifications, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [permission, isPolling]);

  return {
    permission,
    requestPermission,
    isPolling,
    checkNotifications,
  };
}
