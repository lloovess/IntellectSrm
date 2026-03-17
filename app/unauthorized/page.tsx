import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Нет доступа
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    У вашей учётной записи нет прав для просмотра этой страницы. Обратитесь к администратору, если считаете, что это ошибка.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#207fdf] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a6bc4] transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        На главную
                    </Link>
                    <Link
                        href="javascript:history.back()"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Назад
                    </Link>
                </div>
            </div>
        </div>
    );
}
