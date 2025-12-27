"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useLanguage } from "@/providers/language-provider";
import { useSiteSettings } from "@/providers/settings-provider";
import { api, User } from "@/lib/api";

// Hydration-safe: render language switcher only on client to avoid Radix ID mismatches between server/client.
const LanguageSwitcher = dynamic(
  () =>
    import("@/components/language-switcher").then(
      (mod) => mod.LanguageSwitcher
    ),
  {
    ssr: false,
    loading: () => <div className="size-9 rounded-md bg-muted/60" />,
  }
);

// Cache user data at module level to prevent refetching on every navigation
let cachedUser: User | null = null;
let userFetched = false;

export function Header() {
  const router = useRouter();
  const { t } = useLanguage();
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
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold hover:text-primary">
          {settings?.site_name || 'Lite Blog'}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
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
                  {t('nav.admin')}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
