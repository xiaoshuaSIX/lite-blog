'use client';

import Link from 'next/link';
import { useLanguage } from '@/providers/language-provider';

export default function AdminDashboard() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
        <p className="text-muted-foreground mt-2">{t('admin.dashboardSubtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Articles Card */}
        <Link
          href="/admin/articles"
          className="group relative overflow-hidden p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl">
            📝
          </div>
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            {t('admin.articles')}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('admin.articlesDesc')}
          </p>
          <div className="mt-4 flex items-center text-sm text-primary font-medium">
            {t('admin.manageContent')} &rarr;
          </div>
        </Link>

        {/* Users Card */}
        <Link
          href="/admin/users"
          className="group relative overflow-hidden p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl">
            👥
          </div>
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            {t('admin.users')}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
             {t('admin.usersDesc')}
          </p>
          <div className="mt-4 flex items-center text-sm text-primary font-medium">
            {t('admin.viewUsers')} &rarr;
          </div>
        </Link>

        {/* Settings Card */}
        <Link
          href="/admin/settings"
          className="group relative overflow-hidden p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl">
            ⚙️
          </div>
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            {t('admin.settings')}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('admin.settingsDesc')}
          </p>
          <div className="mt-4 flex items-center text-sm text-primary font-medium">
            {t('admin.configureSite')} &rarr;
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-primary/10">
        <h2 className="text-xl font-semibold mb-4">{t('admin.quickActions')}</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            + {t('admin.newArticle')}
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background/50 backdrop-blur px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t('admin.viewLiveSite')}
          </Link>
        </div>
      </div>
    </div>
  );
}
