'use client';

import { useState, useEffect } from 'react';
import { adminApi, SiteSettings } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useLanguage } from '@/providers/language-provider';

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    site_keywords: '',
    home_title: '',
    home_subtitle: '',
    footer_text: '',
    logo_url: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminApi.getSiteSettings();
        setSettings(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updated = await adminApi.updateSiteSettings(settings);
      setSettings(updated);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{t('admin.settings')}</h1>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="space-y-2">
            <label htmlFor="site_name" className="text-sm font-medium">
              Site Name
            </label>
            <input
              id="site_name"
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="My Blog"
            />
            <p className="text-xs text-muted-foreground">
              Displayed in the header and browser tab
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="site_description" className="text-sm font-medium">
              Site Description
            </label>
            <textarea
              id="site_description"
              value={settings.site_description}
              onChange={(e) => setSettings(prev => ({ ...prev, site_description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="A brief description of your blog"
            />
            <p className="text-xs text-muted-foreground">
              Used for SEO meta description
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="site_keywords" className="text-sm font-medium">
              Site Keywords
            </label>
            <input
              id="site_keywords"
              type="text"
              value={settings.site_keywords}
              onChange={(e) => setSettings(prev => ({ ...prev, site_keywords: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="blog, technology, programming"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords for SEO
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="logo_url" className="text-sm font-medium">
              Logo URL
            </label>
            <input
              id="logo_url"
              type="text"
              value={settings.logo_url}
              onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Optional logo image URL
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Homepage</h2>

          <div className="space-y-2">
            <label htmlFor="home_title" className="text-sm font-medium">
              Homepage Title
            </label>
            <input
              id="home_title"
              type="text"
              value={settings.home_title}
              onChange={(e) => setSettings(prev => ({ ...prev, home_title: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Welcome to My Blog"
            />
            <p className="text-xs text-muted-foreground">
              Main title displayed on the homepage
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="home_subtitle" className="text-sm font-medium">
              Homepage Subtitle
            </label>
            <input
              id="home_subtitle"
              type="text"
              value={settings.home_subtitle}
              onChange={(e) => setSettings(prev => ({ ...prev, home_subtitle: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Discover amazing articles and insights"
            />
            <p className="text-xs text-muted-foreground">
              Subtitle displayed below the main title
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Footer</h2>

          <div className="space-y-2">
            <label htmlFor="footer_text" className="text-sm font-medium">
              Footer Text
            </label>
            <input
              id="footer_text"
              type="text"
              value={settings.footer_text}
              onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="© 2024 My Blog. All rights reserved."
            />
            <p className="text-xs text-muted-foreground">
              Copyright or footer text
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
