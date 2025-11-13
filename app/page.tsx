'use client';

import { useState, useEffect } from 'react';
import { Todo, Priority, Subtask } from '@/lib/types';
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

  // Subtask state
  const [subtasks, setSubtasks] = useState<Record<number, Subtask[]>>({});
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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
    const subtaskCount = subtasks[todo.id]?.length || 0;
    const message = subtaskCount > 0 
      ? `Delete this todo and ${subtaskCount} subtask${subtaskCount > 1 ? 's' : ''}?`
      : 'Are you sure you want to delete this todo?';
    
    if (!confirm(message)) return;

    const originalTodos = [...todos];

    // Optimistic update
    setTodos(todos => todos.filter(t => t.id !== todo.id));
    // Remove subtasks from state
    setSubtasks((prev) => {
      const newSubtasks = { ...prev };
      delete newSubtasks[todo.id];
      return newSubtasks;
    });

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

  // Toggle todo expansion to show/hide subtasks
  const toggleExpand = async (todoId: number) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
      // Load subtasks if not already loaded
      if (!subtasks[todoId]) {
        await fetchSubtasks(todoId);
      }
    }
    setExpandedTodos(newExpanded);
  };

  // Fetch subtasks for a todo
  const fetchSubtasks = async (todoId: number) => {
    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks`);
      if (!res.ok) throw new Error('Failed to fetch subtasks');
      const data = await res.json();
      setSubtasks((prev) => ({ ...prev, [todoId]: data.subtasks }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subtasks');
    }
  };

  // Add subtask
  const handleAddSubtask = async (todoId: number) => {
    if (!newSubtaskTitle.trim()) {
      setError('Subtask title is required');
      return;
    }

    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });

      if (!res.ok) throw new Error('Failed to create subtask');
      const data = await res.json();
      
      setSubtasks((prev) => ({
        ...prev,
        [todoId]: [...(prev[todoId] || []), data.subtask],
      }));
      setNewSubtaskTitle('');
      setAddingSubtaskTo(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask');
    }
  };

  // Toggle subtask completion
  const handleToggleSubtask = async (todoId: number, subtaskId: number, completed: boolean) => {
    // Optimistic update
    setSubtasks((prev) => ({
      ...prev,
      [todoId]: prev[todoId].map((s) =>
        s.id === subtaskId ? { ...s, completed } : s
      ),
    }));

    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (!res.ok) throw new Error('Failed to update subtask');
      const data = await res.json();
      
      // Update with server response
      setSubtasks((prev) => ({
        ...prev,
        [todoId]: prev[todoId].map((s) =>
          s.id === subtaskId ? data.subtask : s
        ),
      }));
    } catch (err) {
      // Rollback on error
      setSubtasks((prev) => ({
        ...prev,
        [todoId]: prev[todoId].map((s) =>
          s.id === subtaskId ? { ...s, completed: !completed } : s
        ),
      }));
      setError(err instanceof Error ? err.message : 'Failed to update subtask');
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (todoId: number, subtaskId: number) => {
    const originalSubtasks = subtasks[todoId];

    // Optimistic update
    setSubtasks((prev) => ({
      ...prev,
      [todoId]: prev[todoId].filter((s) => s.id !== subtaskId),
    }));

    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subtask');
      setError('');
    } catch (err) {
      // Rollback on error
      setSubtasks((prev) => ({
        ...prev,
        [todoId]: originalSubtasks,
      }));
      setError(err instanceof Error ? err.message : 'Failed to delete subtask');
    }
  };

  // Calculate progress for a todo
  const calculateProgress = (todoId: number) => {
    const todoSubtasks = subtasks[todoId] || [];
    const total = todoSubtasks.length;
    const completed = todoSubtasks.filter((s) => s.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
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
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {priorityFilter === 'all' 
              ? 'No todos yet. Create one above!' 
              : `No ${priorityFilter} priority todos.`
            }
          </p>
        ) : (
          filteredTodos.map((todo) => {
            const isExpanded = expandedTodos.has(todo.id);
            const progress = calculateProgress(todo.id);
            const todoSubtasks = subtasks[todo.id] || [];

            return (
              <div key={todo.id} className="bg-white border rounded-lg hover:shadow-md transition">
                <div className="flex items-center gap-3 p-4">
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(todo.id)}
                    className="text-gray-500 hover:text-gray-700 transition"
                  >
                    <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={!!todo.completed_at}
                    onChange={() => handleToggleComplete(todo)}
                    className="w-5 h-5 cursor-pointer accent-blue-500"
                  />

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
                        {/* Priority Badge */}
                        {todo.priority && (
                          <div className="mb-1">
                            <PriorityBadge priority={todo.priority} />
                          </div>
                        )}
                        {/* Title */}
                        <p className={`${todo.completed_at ? 'line-through text-gray-500' : 'text-gray-900'}`}>
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
                        {/* Compact Progress Indicator */}
                        {progress.total > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 max-w-[200px] bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEdit(todo)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(todo)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {/* Subtasks Section (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t pt-3">
                    {/* Progress Bar */}
                    {todoSubtasks.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Progress
                          </span>
                          <span className="text-sm text-gray-600">
                            {progress.completed}/{progress.total} completed ({progress.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Subtask List */}
                    <div className="space-y-1 mb-3">
                      {todoSubtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={(e) => handleToggleSubtask(todo.id, subtask.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              subtask.completed
                                ? 'line-through text-gray-500'
                                : 'text-gray-700'
                            }`}
                          >
                            {subtask.title}
                          </span>
                          <button
                            onClick={() => handleDeleteSubtask(todo.id, subtask.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                            title="Delete subtask"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Subtask Input */}
                    {addingSubtaskTo === todo.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubtask(todo.id);
                            if (e.key === 'Escape') setAddingSubtaskTo(null);
                          }}
                          placeholder="Enter subtask title..."
                          className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddSubtask(todo.id)}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingSubtaskTo(null);
                            setNewSubtaskTitle('');
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingSubtaskTo(todo.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Subtask
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
