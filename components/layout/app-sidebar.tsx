"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Wallet,
    PhoneCall,
    BarChart3,
    Shield,
    Import,
    DoorOpen,
    ChevronLeft,
    Briefcase,
    BookOpen,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type NavItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredRoles?: Role[];
};

type NavGroup = {
    title?: string;
    items: NavItem[];
};

const navGroups: NavGroup[] = [
    {
        items: [
            { label: "Дашборд", href: "/", icon: LayoutDashboard },
        ],
    },
    {
        title: "Модули",
        items: [
            {
                label: "Рабочее место",
                href: "/assistant",
                icon: Briefcase,
                requiredRoles: ["assistant"],
            },
            {
                label: "Ученики",
                href: "/students",
                icon: GraduationCap,
            },
            {
                label: "Финансы",
                href: "/finance",
                icon: Wallet,
                requiredRoles: ["finance_manager", "accountant", "admin"],
            },
            {
                label: "Задолженности",
                href: "/collections",
                icon: PhoneCall,
                requiredRoles: ["call_center", "finance_manager", "admin"],
            },
            {
                label: "Отчисления",
                href: "/withdrawals",
                icon: DoorOpen,
                requiredRoles: ["assistant", "finance_manager", "admin"],
            },
        ],
    },
    {
        title: "Операции",
        items: [
            {
                label: "Перевод года",
                href: "/operations/transition",
                icon: DoorOpen, // Reusing icon for now
                requiredRoles: ["admin"],
            },
        ],
    },
    {
        title: "Аналитика",
        items: [
            {
                label: "Журнал оплат",
                href: "/reports",
                icon: BarChart3,
                requiredRoles: ["assistant", "finance_manager", "accountant", "admin"],
            },
        ],
    },
    {
        title: "Настройки",
        items: [
            {
                label: "Пользователи",
                href: "/settings/users",
                icon: Users,
                requiredRoles: ["admin"],
            },
            {
                label: "Роли",
                href: "/settings/roles",
                icon: Shield,
                requiredRoles: ["admin"],
            },
            {
                label: "Филиалы",
                href: "/settings/branches",
                icon: DoorOpen,
                requiredRoles: ["assistant", "admin"],
            },
            {
                label: "Классы",
                href: "/settings/classes",
                icon: BookOpen,
                requiredRoles: ["assistant", "admin"],
            },
            {
                label: "Импорт / Экспорт",
                href: "/settings/import-export",
                icon: Import,
                requiredRoles: ["assistant", "admin"],
            },
        ],
    },
];

interface AppSidebarProps {
    role: Role;
}

export function AppSidebar({ role }: AppSidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const isAllowed = (item: NavItem) =>
        !item.requiredRoles || item.requiredRoles.includes(role);

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                {/* Logo */}
                <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center")}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                            И
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-sidebar-foreground">Интеллект</span>
                                <span className="text-[10px] text-muted-foreground">School CRM</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    {navGroups.map((group, gi) => {
                        const visibleItems = group.items.filter(isAllowed);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={gi} className="mb-4">
                                {group.title && !collapsed && (
                                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {group.title}
                                    </p>
                                )}
                                {group.title && collapsed && <Separator className="mb-2" />}
                                <ul className="space-y-1">
                                    {visibleItems.map((item) => {
                                        const active = isActive(item.href);
                                        const link = (
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                                    active
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 shrink-0" />
                                                {!collapsed && <span>{item.label}</span>}
                                            </Link>
                                        );

                                        return (
                                            <li key={item.href}>
                                                {collapsed ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                                                        <TooltipContent side="right">
                                                            {item.label}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    link
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="border-t border-sidebar-border p-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        <ChevronLeft
                            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
                        />
                        {!collapsed && <span className="ml-2 text-xs">Свернуть</span>}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
