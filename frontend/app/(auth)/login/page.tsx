'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { resetUserCache } from '@/components/layout/header';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(email, password);
      resetUserCache();
      window.location.href = '/';
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium ml-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline opacity-80">
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="pt-4 text-center text-sm text-muted-foreground border-t border-border/40">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
