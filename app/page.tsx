/**
 * Main Todo Page Component
 * Per copilot-instructions.md: Monolithic client component (~2200 lines in full app)
 * This implementation covers CRUD operations from PRP-01
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Todo, RecurrencePattern, Subtask } from '@/lib/db';
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone';
import { RecurrenceSelector } from '@/components/RecurrenceSelector';
import { RecurrenceIcon } from '@/components/RecurrenceIndicator';

export default function TodoPage() {
  // State management
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [newRecurrencePattern, setNewRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  
  // Subtask state
  const [subtasks, setSubtasks] = useState<Record<number, Subtask[]>>({});
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data = await res.json();
      setTodos(data.todos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Create todo with optimistic update pattern
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) {
      setError('Title is required');
      return;
    }

    if (newTodoTitle.length > 500) {
      setError('Title must be 500 characters or less');
      return;
    }

    const tempId = Date.now(); // Temporary ID for optimistic update
    const optimisticTodo: Todo = {
      id: tempId,
      user_id: 0, // Will be set by server
      title: newTodoTitle.trim(),
      completed_at: null,
      due_date: newTodoDueDate || null,
      created_at: getSingaporeNow().toISOString(),
      updated_at: getSingaporeNow().toISOString(),
      priority: null,
      recurrence_pattern: newRecurrencePattern,
      reminder_minutes: null,
      last_notification_sent: null,
    };

    // Optimistic update - show immediately
    setTodos((prev) => [optimisticTodo, ...prev]);
    setNewTodoTitle('');
    setNewTodoDueDate('');
    setNewRecurrencePattern(null);
    setError(null);

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          due_date: newTodoDueDate || null,
          recurrence_pattern: newRecurrencePattern,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create todo');
      }

      const createdTodo: Todo = await res.json();

      // Replace optimistic todo with real server-confirmed one
      setTodos((prev) => prev.map((t) => (t.id === tempId ? createdTodo : t)));
    } catch (err) {
      // Rollback optimistic update on error
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Toggle completion with optimistic update
  const handleToggleComplete = async (todo: Todo) => {
    const newCompletedAt = todo.completed_at ? null : getSingaporeNow().toISOString();

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed_at: newCompletedAt } : t))
    );

    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: newCompletedAt }),
      });

      if (!res.ok) throw new Error('Failed to update todo');

      const responseData = await res.json();
      
      // Check if this was a recurring todo completion
      if (responseData.next_instance) {
        // Replace completed todo and add next instance
        setTodos((prev) => {
          const filtered = prev.map((t) => (t.id === todo.id ? responseData.completed_todo : t));
          return [responseData.next_instance, ...filtered];
        });
        
        // Show success message with next due date
        const nextDueDate = formatSingaporeDate(responseData.next_instance.due_date);
        alert(`✅ ${responseData.message}\n\nNext occurrence created with due date: ${nextDueDate}`);
      } else {
        // Regular todo - just update it
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? responseData : t)));
      }
    } catch (err) {
      // Rollback on error
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed_at: todo.completed_at } : t))
      );
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Start editing
  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date || '');
  };

  // Save edit with optimistic update
  const handleSaveEdit = async (todoId: number) => {
    if (!editTitle.trim()) {
      setError('Title is required');
      return;
    }

    if (editTitle.length > 500) {
      setError('Title must be 500 characters or less');
      return;
    }

    const originalTodo = todos.find((t) => t.id === todoId);

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, title: editTitle.trim(), due_date: editDueDate || null } : t
      )
    );
    setEditingId(null);

    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          due_date: editDueDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update todo');

      const updatedTodo: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === todoId ? updatedTodo : t)));
      setError(null);
    } catch (err) {
      // Rollback on error
      if (originalTodo) {
        setTodos((prev) => prev.map((t) => (t.id === todoId ? originalTodo : t)));
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Delete todo with optimistic update
  const handleDelete = async (todoId: number) => {
    const subtaskCount = subtasks[todoId]?.length || 0;
    const message = subtaskCount > 0 
      ? `Delete this todo and ${subtaskCount} subtask${subtaskCount > 1 ? 's' : ''}?`
      : 'Are you sure you want to delete this todo?';
    
    if (!confirm(message)) return;

    const originalTodos = [...todos];

    // Optimistic update - remove immediately
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    // Remove subtasks from state
    setSubtasks((prev) => {
      const newSubtasks = { ...prev };
      delete newSubtasks[todoId];
      return newSubtasks;
    });

    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete todo');
      setError(null);
    } catch (err) {
      // Rollback on error
      setTodos(originalTodos);
      setError(err instanceof Error ? err.message : 'Unknown error');
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
      setError(null);
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
      setError(null);
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Todos</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Todo Form */}
      <form onSubmit={handleCreateTodo} className="mb-8 flex gap-2">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />
        <input
          type="date"
          value={newTodoDueDate}
          onChange={(e) => setNewTodoDueDate(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <RecurrenceSelector
          value={newRecurrencePattern}
          onChange={setNewRecurrencePattern}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Add
        </button>
      </form>

      {/* Todo List */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No todos yet. Create one above!</p>
        ) : (
          todos.map((todo) => {
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
                    className="w-5 h-5 cursor-pointer"
                  />

                  {/* Todo Content */}
                  {editingId === todo.id ? (
                    <>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded"
                        maxLength={500}
                      />
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="px-2 py-1 border rounded"
                      />
                      <button
                        onClick={() => handleSaveEdit(todo.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className={`${todo.completed_at ? 'line-through text-gray-500' : ''}`}>
                          {todo.title}
                          {todo.recurrence_pattern && (
                            <span className="ml-2">
                              <RecurrenceIcon pattern={todo.recurrence_pattern} />
                            </span>
                          )}
                        </p>
                        {todo.due_date && (
                          <p className="text-sm text-gray-500">
                            Due: {formatSingaporeDate(todo.due_date, 'date')}
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
                        onClick={() => handleStartEdit(todo)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
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
