'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Email адрес
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@school.edu"
          required
          disabled={isPending}
          autoComplete="email"
          className="h-12 bg-white px-4 py-3 dark:bg-slate-800"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Пароль
          </Label>
          <a href="#" className="text-sm font-semibold text-primary hover:underline" tabIndex={-1}>
            Забыли пароль?
          </a>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={isPending}
          autoComplete="current-password"
          className="h-12 bg-white px-4 py-3 dark:bg-slate-800"
        />
      </div>

      <div className="flex items-center">
        <input
          className="h-5 w-5 rounded border-slate-300 text-primary transition-all focus:ring-primary"
          id="remember"
          type="checkbox"
        />
        <label className="ml-3 text-sm text-slate-600 dark:text-slate-400" htmlFor="remember">
          Оставаться в системе 30 дней
        </label>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="flex h-12 w-full items-center justify-center gap-2 text-base font-bold shadow-lg transition-all hover:bg-primary/90"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Вход...
          </>
        ) : (
          <>
            <span>Войти</span>
            <LogIn className="h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
}
