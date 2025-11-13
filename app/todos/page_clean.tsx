'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatSingaporeDate, isPastDue } from '@/lib/timezone';
import { Priority, PRIORITY_CONFIG, TodoWithSubtasks } from '@/lib/types';

export default function TodosPage() {
    const router = useRouter();
    const [todos, setTodos] = useState<TodoWithSubtasks[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoDueDate, setNewTodoDueDate] = useState<string>('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

    const fetchUsername = async () => {
        try {
            const response = await fetch('/api/auth/session');
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error('Failed to fetch session');
            }
            const data = await response.json();
            setUsername(data.username || '');
        } catch (err) {
            console.error('Error fetching username:', err);
        }
    };

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/todos');
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error('Failed to fetch todos');
            }
            const data = await response.json();
            setTodos(data);
            setError(null);
        } catch (err) {
            setError('Failed to load todos. Please refresh the page.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
        fetchUsername();
    }, []);

    const createTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = newTodoTitle.trim();
        if (!title || !newTodoDueDate) return;

        const tempId = Date.now();
        const newTodo: TodoWithSubtasks = {
            id: tempId,
            title,
            completed: false,
            priority,
            recurrence_pattern: null,
            due_date: newTodoDueDate || null,
            reminder_minutes: null,
            last_notification_sent: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subtasks: [],
            progress: 0,
            tags: [],
        };

        setTodos(prev => [newTodo, ...prev]);
        setNewTodoTitle('');
        setNewTodoDueDate('');
        setPriority('medium');

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    priority,
                    due_date: newTodoDueDate || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create todo');
            }

            const createdTodo = await response.json();
            setTodos(prev => prev.map(t => t.id === tempId ? createdTodo : t));
        } catch (err) {
            setTodos(prev => prev.filter(t => t.id !== tempId));
            setError('Failed to create todo. Please try again.');
            console.error(err);
        }
    };

    const updateTodo = async (id: number, updates: Partial<TodoWithSubtasks>) => {
        const originalTodo = todos.find(t => t.id === id);
        if (!originalTodo) return;

        setTodos(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ));

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Failed to update todo');
            }

            const updatedTodo = await response.json();
            setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
        } catch (err) {
            setTodos(prev => prev.map(t => t.id === id ? originalTodo : t));
            setError('Failed to update todo. Please try again.');
            console.error(err);
        }
    };

    const deleteTodo = async (id: number) => {
        const confirmed = window.confirm('Delete this todo? This cannot be undone.');
        if (!confirmed) return;

        const originalTodo = todos.find(t => t.id === id);
        if (!originalTodo) return;

        setTodos(prev => prev.filter(t => t.id !== id));

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete todo');
            }
        } catch (err) {
            setTodos(prev => [...prev, originalTodo].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ));
            setError('Failed to delete todo. Please try again.');
            console.error(err);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/login');
            }
        } catch (err) {
            console.error('Logout error:', err);
            setError('Failed to logout');
        }
    };

    // Filter todos
    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    // Sort todos
    const sortedTodos = filteredTodos.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        const priorityOrder: Record<Priority, number> = { high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const pendingTodos = sortedTodos.filter(t => !t.completed);
    const completedTodos = sortedTodos.filter(t => t.completed);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading todos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Todo App</h1>
                            <p className="text-gray-600 mt-1">Welcome, {username || 'hninnn'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
                                Data
                            </button>
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                                Calendar
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                📋 Templates
                            </button>
                            <button className="px-3 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                                🔔
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                            <p>{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-800 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Todo Form */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <form onSubmit={createTodo} className="space-y-4">
                        <div className="flex gap-3 items-center">
                            <input
                                type="text"
                                value={newTodoTitle}
                                onChange={(e) => setNewTodoTitle(e.target.value)}
                                placeholder="Add a new todo..."
                                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={500}
                            />
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="low">Low</option>
                            </select>
                            <input
                                type="datetime-local"
                                value={newTodoDueDate}
                                onChange={(e) => setNewTodoDueDate(e.target.value)}
                                className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={!newTodoTitle.trim() || !newTodoDueDate}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label>Repeat</label>
                            </div>
                            <label>Reminder:</label>
                            <select className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">None</option>
                                <option value="15">15 minutes before</option>
                                <option value="30">30 minutes before</option>
                                <option value="60">1 hour before</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <label className="text-gray-700">Use Template:</label>
                            <select className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select a template...</option>
                                <option>Work Task</option>
                                <option>Personal Errand</option>
                                <option>Meeting</option>
                            </select>
                        </div>
                    </form>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search todos and subtasks..."
                                className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute left-3 top-3 text-gray-400">
                                🔍
                            </div>
                        </div>

                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>

                        <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                            ▼ Advanced
                        </button>
                    </div>
                </div>

                {/* Pending Todos */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-blue-600">Pending ({pendingTodos.length})</h2>

                    {pendingTodos.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No pending todos. Add one above!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingTodos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <input
                                            type="checkbox"
                                            checked={todo.completed}
                                            onChange={(e) => updateTodo(todo.id, { completed: e.target.checked })}
                                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-lg font-medium text-gray-900">{todo.title}</p>
                                                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${todo.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                                        todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {PRIORITY_CONFIG[todo.priority].label}
                                                </span>
                                                <span className="text-gray-400">0</span>
                                            </div>
                                            {todo.due_date && (
                                                <p className={`text-sm ${isPastDue(todo.due_date) && !todo.completed
                                                        ? 'text-orange-500 font-medium'
                                                        : 'text-gray-500'
                                                    }`}>
                                                    {isPastDue(todo.due_date) && !todo.completed && 'Due in 4 hours '}
                                                    ({formatSingaporeDate(todo.due_date).split(' ').slice(1).join(' ')})
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
                                                ▶ Subtasks
                                            </button>
                                            <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteTodo(todo.id)}
                                                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="text-3xl font-bold text-red-500">0</div>
                        <div className="text-gray-600">Overdue</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-blue-500">{pendingTodos.length}</div>
                        <div className="text-gray-600">Pending</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-green-500">{completedTodos.length}</div>
                        <div className="text-gray-600">Completed</div>
                    </div>
                </div>
            </div>
        </div>
    );
}