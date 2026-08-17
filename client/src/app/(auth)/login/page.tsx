'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginRequest } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user, token } = await loginRequest(form.email, form.password);
      setAuth(user, token);
      router.push('/chat');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <MessageCircle className="w-7 h-7 text-indigo-500" />
          <h1 className="text-xl font-semibold text-white">PennChat</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-1">Welcome back</h2>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Log in
          </Button>

          <p className="text-sm text-neutral-400 text-center pt-2">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}