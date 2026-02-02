"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, User as UserIcon, LogOut, Shield } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuMounted(true);
      return;
    }

    if (!mobileMenuMounted) return;

    const timeout = window.setTimeout(() => {
      setMobileMenuMounted(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [mobileMenuOpen, mobileMenuMounted]);

  const handleLogout = async () => {
    try {
      await api.logout();
      // Clear cache on logout
      cachedUser = null;
      userFetched = false;
      setUser(null);
      setMobileMenuOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-lg sm:text-xl font-bold hover:text-primary transition-colors"
            onClick={closeMobileMenu}
          >
            {settings?.site_name || 'Lite Blog'}
          </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="w-20 h-8 bg-muted animate-pulse rounded" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user.email}</span>
                {user.is_member && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    会员
                  </span>
                )}
              </Link>
              {user.roles?.includes('admin') && (
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  管理后台
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                注册
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative p-2 text-foreground hover:bg-muted rounded-md transition-colors w-9 h-9 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <Menu className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
            <X className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
          </button>
        </div>
      </div>
      </header>

      {/* Mobile Menu Full Screen Overlay */}
      {mobileMenuMounted && (
        <div
          className={`md:hidden fixed top-14 left-0 right-0 bottom-0 bg-background z-50 overflow-y-auto border-t transition-all duration-200 ease-out ${
            mobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div
            className={`container mx-auto px-6 py-8 flex flex-col gap-6 transition-all duration-200 ease-out ${
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {loading ? (
              <div className="w-full h-10 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-lg truncate max-w-[200px]">{user.email}</span>
                      {user.is_member && (
                        <span className="text-primary text-sm font-medium">
                          会员
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 mt-2">
                    <Link
                      href="/profile"
                      className="text-xl font-medium text-foreground/80 hover:text-foreground transition-colors px-2"
                      onClick={closeMobileMenu}
                    >
                      个人中心
                    </Link>

                    {user.roles?.includes('admin') && (
                      <Link
                        href="/admin"
                        className="text-xl font-medium text-foreground/80 hover:text-foreground transition-colors px-2"
                        onClick={closeMobileMenu}
                      >
                        管理后台
                      </Link>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border/50 w-full" />

                <button
                  onClick={handleLogout}
                  className="text-xl font-medium text-destructive hover:text-destructive/80 text-left px-2"
                >
                  退出登录
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-6">
                <Link
                  href="/login"
                  className="text-2xl font-medium text-foreground/80 hover:text-foreground transition-colors px-2"
                  onClick={closeMobileMenu}
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-2xl font-medium text-foreground/80 hover:text-foreground transition-colors px-2"
                  onClick={closeMobileMenu}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
