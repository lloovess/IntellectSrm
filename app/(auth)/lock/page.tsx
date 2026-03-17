import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LockForm from '@/components/lock-form';

export const metadata = {
    title: 'Сессия заблокирована | SRM Intellect',
    description: 'Ваша сессия была заблокирована из соображений безопасности.',
};

export default async function LockPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <section className="relative flex min-h-screen items-center justify-center p-6 font-sans">
            {/* Mock Background (Blurred Dashboard) */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-background">
                <div className="grid grid-cols-12 gap-6 p-8 opacity-30 filter blur-md">
                    <div className="col-span-3 h-64 rounded-xl bg-slate-300 dark:bg-slate-800"></div>
                    <div className="col-span-9 h-64 rounded-xl bg-slate-300 dark:bg-slate-800"></div>
                    <div className="col-span-4 h-96 rounded-xl bg-slate-300 dark:bg-slate-800"></div>
                    <div className="col-span-4 h-96 rounded-xl bg-slate-300 dark:bg-slate-800"></div>
                    <div className="col-span-4 h-96 rounded-xl bg-slate-300 dark:bg-slate-800"></div>
                </div>
            </div>

            {/* Lock Screen Modal */}
            <div className="relative z-10 w-full max-w-md">
                <div className="rounded-xl border border-white/20 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <LockForm email={user.email || 'Пользователь'} />
                </div>
            </div>
        </section>
    );
}
