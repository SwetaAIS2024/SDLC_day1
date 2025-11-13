'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, create a simple session (WebAuthn can be added later)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to main page
      router.push('/todos');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  const handleRegister = () => {
    // For now, just show an alert. Can be implemented later
    alert('Registration will be implemented with WebAuthn. For now, just enter any username to login.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-10 border border-gray-100 dark:border-slate-700 transition-colors duration-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-200">Todo App</h1>
            <p className="text-gray-600 dark:text-slate-400 text-base transition-colors duration-200">Sign in with your passkey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800 transition-colors duration-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePasskeyLogin} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-2 transition-colors duration-200">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium text-base hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign in with Passkey'}
            </button>

            {/* Register Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleRegister}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
              >
                Don&apos;t have an account? <span className="underline">Register</span>
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-colors duration-200">
            <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed transition-colors duration-200">
              <span className="font-semibold text-gray-800 dark:text-slate-200">Passkeys</span> use your device&apos;s biometrics (fingerprint, face recognition) or PIN for secure authentication. No passwords needed!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
