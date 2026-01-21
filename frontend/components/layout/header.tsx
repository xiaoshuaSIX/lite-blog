"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSiteSettings } from "@/providers/settings-provider";
import { api, User } from "@/lib/api";

// Cache user data at module level to prevent refetching on every navigation
let cachedUser: User | null = null;
let userFetched = false;

// Export function to reset cache after login/logout
export function resetUserCache() {
  cachedUser = null;
  userFetched = false;
}

export function Header() {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!userFetched);

  useEffect(() => {
    // Skip if already fetched
    if (userFetched) return;

    const checkAuth = async () => {
      try {
        const userData = await api.getMe();
        cachedUser = userData;
        setUser(userData);
      } catch {
        cachedUser = null;
        setUser(null);
      } finally {
        userFetched = true;
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      // Clear cache on logout
      cachedUser = null;
      userFetched = false;
      setUser(null);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold hover:text-primary">
          {settings?.site_name || 'Lite Blog'}
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="w-20 h-8 bg-muted animate-pulse rounded" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {user.email}
                {user.is_member && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    Member
                  </span>
                )}
              </Link>
              {user.roles?.includes('admin') && (
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  管理后台
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                退出登录
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
