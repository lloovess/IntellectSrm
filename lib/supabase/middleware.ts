import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTE_PERMISSIONS, PERMISSIONS, isRole } from "@/lib/auth/config";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: DO NOT remove this line — it refreshes the session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname, search } = request.nextUrl;
    const isPublic =
        pathname === "/login" || pathname.startsWith("/api/auth/");
    const isLockPage = pathname === "/lock";
    const isUnauthorizedPage = pathname === "/unauthorized";

    // Not authenticated → redirect to login (unless already on login/public)
    if (!user && !isPublic && !isLockPage && !isUnauthorizedPage) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated but on /login → redirect to dashboard
    if (user && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Session lock logic
    if (user && !isPublic) {
        const lastActivityStr = request.cookies.get("srm_last_activity")?.value;
        const isLocked = request.cookies.get("srm_is_locked")?.value === "true";

        const now = Date.now();
        const inactivityMs = 15 * 60 * 1000; // 15 minutes

        if (isLocked && !isLockPage) {
            return NextResponse.redirect(new URL("/lock", request.url));
        }

        if (!isLocked && lastActivityStr) {
            const lastActivity = parseInt(lastActivityStr, 10);
            if (!isNaN(lastActivity) && now - lastActivity > inactivityMs) {
                const redirectRes = NextResponse.redirect(new URL("/lock", request.url));
                redirectRes.cookies.set("srm_is_locked", "true", { path: "/" });
                return redirectRes;
            }
        }

        if (!isLocked && isLockPage) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        if (!isLocked && !isLockPage) {
            supabaseResponse.cookies.set("srm_last_activity", now.toString(), { path: "/" });
        }
    }

    // ─── Route-level RBAC ───────────────────────────────────────────────────
    // Only enforce on authenticated, non-lock, non-public routes
    if (user && !isPublic && !isLockPage && !isUnauthorizedPage) {
        const roleRaw = user.user_metadata?.app_role as string | undefined;
        if (roleRaw && isRole(roleRaw)) {
            const rolePermissions = PERMISSIONS[roleRaw] as readonly string[];
            const matched = ROUTE_PERMISSIONS.find((rp) =>
                pathname.startsWith(rp.prefix)
            );
            if (matched && !rolePermissions.includes(matched.permission)) {
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }
    }

    return supabaseResponse;
}
