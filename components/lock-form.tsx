'use client';

import { useActionState, useTransition } from 'react';
import { unlockSessionAction, logoutAction } from '@/lib/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, LockKeyhole, Loader2, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function LockForm({ email }: { email: string }) {
    const [state, formAction, isPending] = useActionState(unlockSessionAction, undefined);
    const [isLoggingOut, startLogout] = useTransition();

    const handleLogout = () => {
        startLogout(() => {
            logoutAction();
        });
    };

    return (
        <>
            <div className="relative mb-8 inline-block">
                <Avatar className="mx-auto h-24 w-24 border-4 border-primary/20 bg-muted">
                    <AvatarFallback className="text-2xl">{email.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 dark:border-slate-900">
                    <LockKeyhole className="h-3 w-3 text-white" />
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Сессия заблокирована</h2>
                <p className="font-medium text-primary">{email}</p>
                <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">Введите пароль для продолжения</p>
            </div>

            <form action={formAction} className="space-y-4">
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Ваш пароль"
                        required
                        disabled={isPending || isLoggingOut}
                        autoComplete="current-password"
                        autoFocus
                        className="h-14 bg-white/50 px-4 text-center dark:bg-slate-800/50"
                    />
                </div>

                {state?.error && (
                    <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{state.error}</span>
                    </div>
                )}

                <Button
                    type="submit"
                    className="h-14 w-full text-base font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                    disabled={isPending || isLoggingOut}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Разблокировка...
                        </>
                    ) : (
                        'Разблокировать сессию'
                    )}
                </Button>

                <div className="pt-6">
                    <button
                        type="button"
                        className="mx-auto flex items-center justify-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
                        disabled={isPending || isLoggingOut}
                        onClick={handleLogout}
                    >
                        {isLoggingOut ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <LogOut className="h-5 w-5" />
                        )}
                        Выйти и сменить аккаунт
                    </button>
                </div>
            </form>
        </>
    );
}
