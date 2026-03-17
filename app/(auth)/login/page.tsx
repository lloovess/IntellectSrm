import LoginForm from '@/components/login-form';
import { School } from 'lucide-react';

export const metadata = {
  title: 'Вход | SRM Intellect',
  description: 'Вход в систему управления ресурсами',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 font-sans">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl md:flex-row min-h-[700px]">
        {/* Left Side: Branding */}
        <div className="relative flex flex-col justify-between p-12 text-white md:w-1/2" style={{
          backgroundColor: '#5048e5',
          backgroundImage: 'radial-gradient(at 0% 0%, hsla(243, 75%, 58%, 1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(220, 75%, 58%, 1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(260, 75%, 58%, 1) 0, transparent 50%)'
        }}>
          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-md">
                <School className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Intellect School CRM</h1>
            </div>
            <div className="space-y-6">
              <h2 className="text-5xl font-black leading-tight">Empowering the next generation of leaders.</h2>
              <p className="max-w-md text-lg text-white/70 opacity-90">The most advanced management system for modern educational institutions. Streamline your workflow and focus on what matters most: the students.</p>
            </div>
          </div>
          <div className="relative z-10 flex gap-4">
            <div className="h-1 w-12 rounded-full bg-white"></div>
            <div className="h-1 w-4 rounded-full bg-white/30"></div>
            <div className="h-1 w-4 rounded-full bg-white/30"></div>
          </div>
        </div>
        {/* Right Side: Form */}
        <div className="flex flex-col justify-center bg-white p-12 dark:bg-slate-900 md:w-1/2">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10">
              <h3 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">С возвращением</h3>
              <p className="text-slate-500 dark:text-slate-400">Пожалуйста, введите учетные данные для доступа к системе.</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
