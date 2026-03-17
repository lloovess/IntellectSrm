import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { requireAuth } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireAuth();

    return (
        <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <div className="hidden lg:block">
                <AppSidebar role={user.role} />
            </div>

            {/* Main content area */}
            <div className="flex flex-1 flex-col lg:pl-64">
                <TopBar role={user.role} email={user.email} />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
