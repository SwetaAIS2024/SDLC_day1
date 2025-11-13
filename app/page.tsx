'use client';

import { useState, useEffect } from 'react';
import { Todo, Priority } from '@/lib/types';
import { formatSingaporeDate } from '@/lib/timezone';
import { PriorityBadge } from '@/components/PriorityBadge';
import { PrioritySelector } from '@/components/PrioritySelector';
import { PriorityFilter } from '@/components/PriorityFilter';
import { ReminderSelector } from '@/components/ReminderSelector';
import { useNotifications } from '@/lib/hooks/useNotifications';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newReminderMinutes, setNewReminderMinutes] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [priorityCounts, setPriorityCounts] = useState({ high: 0, medium: 0, low: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editReminderMinutes, setEditReminderMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notifications hook
  const { permission, requestPermission } = useNotifications();

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
    fetchPriorityCounts();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriorityCounts = async () => {
    try {
      const response = await fetch('/api/todos/priority-counts');
      if (!response.ok) throw new Error('Failed to fetch counts');
      const data = await response.json();
      setPriorityCounts(data);
    } catch (err) {
      console.error('Error fetching priority counts:', err);
    }
  };

  // Sorting function for priority
  const sortByPriority = (a: Todo, b: Todo) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, null: 3 };
    const aPriority = priorityOrder[a.priority || 'null'];
    const bPriority = priorityOrder[b.priority || 'null'];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Same priority: sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  // Filter todos by priority
  const filteredTodos = priorityFilter === 'all' 
    ? todos 
    : todos.filter(t => t.priority === priorityFilter);

  // Helper function to format reminder text
  const getReminderText = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min before`;
    if (minutes < 1440) return `${minutes / 60} hr before`;
    if (minutes < 10080) return `${minutes / 1440} day before`;
    return `${minutes / 10080} week before`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const optimisticTodo: Todo = {
      id: Date.now(), // Temporary ID
      user_id: 0,
      title: newTitle.trim(),
      completed_at: null,
      priority: newPriority,
      due_date: newDueDate || null,
      recurrence_pattern: null,
      reminder_minutes: newReminderMinutes,
      last_notification_sent: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update with proper sorting
    setTodos([optimisticTodo, ...todos].sort(sortByPriority));
    setNewTitle('');
    setNewDueDate('');
    setNewPriority('medium');
    setNewReminderMinutes(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: newPriority,
          due_date: newDueDate || null,
          reminder_minutes: newReminderMinutes,
        }),
      });

      if (!response.ok) throw new Error('Failed to create todo');
      const createdTodo = await response.json();

      // Replace optimistic todo with real one
      setTodos(todos => todos.map(t => t.id === optimisticTodo.id ? createdTodo : t));
      fetchPriorityCounts();
    } catch (err) {
      // Rollback optimistic update
      setTodos(todos => todos.filter(t => t.id !== optimisticTodo.id));
      setError('Failed to create todo');
      console.error(err);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const newCompletedAt = todo.completed_at ? null : new Date().toISOString();

    // Optimistic update
    setTodos(todos => todos.map(t =>
      t.id === todo.id ? { ...t, completed_at: newCompletedAt } : t
    ));

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: newCompletedAt }),
      });

      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos => todos.map(t => t.id === todo.id ? updatedTodo : t));
      fetchPriorityCounts(); // Refresh counts when completing/uncompleting
    } catch (err) {
      // Rollback optimistic update
      setTodos(todos => todos.map(t =>
        t.id === todo.id ? { ...t, completed_at: todo.completed_at } : t
      ));
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:mm)
    if (todo.due_date) {
      const date = new Date(todo.due_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setEditDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setEditDueDate('');
    }
    setEditPriority(todo.priority || 'medium');
    setEditReminderMinutes(todo.reminder_minutes);
  };

  const handleSaveEdit = async (todo: Todo) => {
    if (!editTitle.trim()) return;

    const originalTodo = todo;

    // Optimistic update
    setTodos(todos => todos.map(t =>
      t.id === todo.id 
        ? { ...t, title: editTitle.trim(), due_date: editDueDate || null, priority: editPriority, reminder_minutes: editReminderMinutes } 
        : t
    ).sort(sortByPriority));
    setEditingId(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          priority: editPriority,
          due_date: editDueDate || null,
          reminder_minutes: editReminderMinutes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos => todos.map(t => t.id === todo.id ? updatedTodo : t).sort(sortByPriority));
      fetchPriorityCounts();
    } catch (err) {
      // Rollback optimistic update
      setTodos(todos => todos.map(t => t.id === todo.id ? originalTodo : t));
      setEditingId(todo.id);
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    const originalTodos = [...todos];

    // Optimistic update
    setTodos(todos => todos.filter(t => t.id !== todo.id));

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete todo');
      fetchPriorityCounts(); // Refresh counts after deleting
    } catch (err) {
      // Rollback optimistic update
      setTodos(originalTodos);
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading todos...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Todos</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Priority Filter */}
      <PriorityFilter
        selectedPriority={priorityFilter}
        onFilterChange={setPriorityFilter}
        counts={priorityCounts}
      />

      {/* Notification Permission Button */}
      <div className="mb-4">
        {permission === 'default' && (
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            🔔 Enable Notifications
          </button>
        )}
        {permission === 'granted' && (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg inline-block">
            ✅ Notifications Enabled
          </div>
        )}
        {permission === 'denied' && (
          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg inline-block">
            ❌ Notifications Blocked (Enable in browser settings)
          </div>
        )}
      </div>

      {/* Create Todo Form */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />
        {/* Priority Selector */}
        <PrioritySelector
          value={newPriority}
          onChange={setNewPriority}
        />
        <input
          type="datetime-local"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ReminderSelector
          value={newReminderMinutes}
          onChange={setNewReminderMinutes}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={!newTitle.trim()}
        >
          Add
        </button>
      </form>

      {/* Todo List */}
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {priorityFilter === 'all' 
              ? 'No todos yet. Create one above!' 
              : `No ${priorityFilter} priority todos.`
            }
          </p>
        ) : (
          filteredTodos.map(todo => (
            <div
              key={todo.id}
              className="flex items-start gap-4 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition"
            >
              {/* Checkbox - Simplified */}
              <label className="flex items-center pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!todo.completed_at}
                  onChange={() => {
                    console.log('Checkbox clicked for todo:', todo.id);
                    handleToggleComplete(todo);
                  }}
                  className="w-6 h-6 cursor-pointer accent-blue-500"
                />
              </label>

              {/* Todo Content */}
              {editingId === todo.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={500}
                  />
                  {/* Priority Selector in Edit Mode */}
                  <PrioritySelector
                    value={editPriority}
                    onChange={setEditPriority}
                  />
                  <input
                    type="datetime-local"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ReminderSelector
                    value={editReminderMinutes}
                    onChange={setEditReminderMinutes}
                  />
                  <button
                    onClick={() => handleSaveEdit(todo)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    {/* Priority Badge - Display above title */}
                    {todo.priority && (
                      <div className="mb-1">
                        <PriorityBadge priority={todo.priority} />
                      </div>
                    )}
                    {/* Title */}
                    <p className={`text-base ${todo.completed_at ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {todo.title}
                    </p>
                    {/* Due Date and Reminder */}
                    {todo.due_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {formatSingaporeDate(todo.due_date, 'MMM dd, yyyy HH:mm')}
                        {todo.reminder_minutes && (
                          <span className="ml-2 text-orange-500">
                            🔔 {getReminderText(todo.reminder_minutes)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(todo)}
                    className="px-3 py-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(todo)}
                    className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
