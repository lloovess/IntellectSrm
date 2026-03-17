"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { roleLabels, type Role } from "@/lib/rbac";
import {
    ChevronRight,
    Bell,
    Search,
    LogOut,
    User,
    Menu,
    LockKeyhole,
} from "lucide-react";
import { logoutAction, lockSessionAction } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";

/** Convert pathname segments into breadcrumbs */
const segmentLabels: Record<string, string> = {
    students: "Ученики",
    finance: "Финансы",
    collections: "Задолженности",
    contracts: "Контракты",
    reports: "Отчёты",
    settings: "Настройки",
    users: "Пользователи",
    roles: "Роли",
    branches: "Филиалы",
    "academic-year": "Учебный год",
    "audit-log": "Аудит",
    "import-export": "Импорт / Экспорт",
    new: "Создание",
    edit: "Редактирование",
};

interface TopBarProps {
    role: Role;
    email: string | null;
}

export function TopBar({ role, email }: TopBarProps) {
    const pathname = usePathname();

    // Build breadcrumbs from pathname
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = segmentLabels[seg] ?? seg;
        return { href, label };
    });

    const initials = email
        ? email
            .split("@")[0]
            .slice(0, 2)
            .toUpperCase()
        : "??";

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
            {/* Mobile menu trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <AppSidebar role={role} />
                </SheetContent>
            </Sheet>

            {/* Breadcrumbs */}
            <nav className="hidden items-center gap-1 text-sm lg:flex">
                <Link
                    href="/"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                >
                    Главная
                </Link>
                {breadcrumbs.map((crumb) => (
                    <span key={crumb.href} className="flex items-center gap-1">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <Link
                            href={crumb.href}
                            className="text-muted-foreground transition-colors hover:text-foreground last:text-foreground last:font-medium"
                        >
                            {crumb.label}
                        </Link>
                    </span>
                ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
                {/* Search placeholder */}
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <Search className="h-4.5 w-4.5 text-muted-foreground" />
                </Button>

                {/* Notifications placeholder */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                        3
                    </span>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 rounded-full px-2"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden flex-col items-start text-left md:flex">
                                <span className="text-sm font-medium">{email ?? "—"}</span>
                                <span className="text-[10px] text-muted-foreground">
                                    {roleLabels[role]}
                                </span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Профиль
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <form action={lockSessionAction} className="w-full">
                                <button type="submit" className="flex w-full items-center">
                                    <LockKeyhole className="mr-2 h-4 w-4" />
                                    Заблокировать экраном
                                </button>
                            </form>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <form action={logoutAction} className="w-full">
                                <button type="submit" className="flex w-full items-center text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Выйти
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
