'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, User } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

import { useLanguage } from '@/providers/language-provider';



export default function AdminLayout({

  children,

}: {

  children: React.ReactNode;

}) {
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);



  const navItems = [

    { href: '/admin', label: t('admin.dashboard') },

    { href: '/admin/articles', label: t('admin.articles') },

    { href: '/admin/users', label: t('admin.users') },

    { href: '/admin/settings', label: t('admin.settings') },

  ];



  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getMe();
        if (!userData.roles?.includes('admin')) {
          window.location.href = '/';
          return;
        }
        setUser(userData);
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">⚡️</span>
              Admin
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="h-6 w-px bg-border/50" />
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('admin.viewLiveSite')}
            </Link>
            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hidden sm:inline-block">
              {user.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-7xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
