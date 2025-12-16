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
    site_url: '',
    email_from: '',
    home_title: '',
    home_subtitle: '',
    home_custom_content: '',
    footer_text: '',
    logo_url: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminApi.getSiteSettings();
        // Ensure all fields have default values to avoid controlled/uncontrolled warnings
        setSettings({
          site_name: data.site_name || '',
          site_description: data.site_description || '',
          site_keywords: data.site_keywords || '',
          site_url: data.site_url || '',
          email_from: data.email_from || '',
          home_title: data.home_title || '',
          home_subtitle: data.home_subtitle || '',
          home_custom_content: data.home_custom_content || '',
          footer_text: data.footer_text || '',
          logo_url: data.logo_url || '',
        });
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
      // Ensure all fields have default values
      setSettings({
        site_name: updated.site_name || '',
        site_description: updated.site_description || '',
        site_keywords: updated.site_keywords || '',
        site_url: updated.site_url || '',
        email_from: updated.email_from || '',
        home_title: updated.home_title || '',
        home_subtitle: updated.home_subtitle || '',
        home_custom_content: updated.home_custom_content || '',
        footer_text: updated.footer_text || '',
        logo_url: updated.logo_url || '',
      });
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('admin.settings')}</h1>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 p-4 rounded-md mb-6">
          {t('admin.settingsPage.success')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('admin.settingsPage.basicInfo')}</h2>

          <div className="space-y-2">
            <label htmlFor="site_name" className="text-sm font-medium">
              {t('admin.settingsPage.siteName')}
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
              {t('admin.settingsPage.siteNameHint')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="site_description" className="text-sm font-medium">
              {t('admin.settingsPage.siteDesc')}
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
              {t('admin.settingsPage.siteDescHint')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="site_keywords" className="text-sm font-medium">
              {t('admin.settingsPage.siteKeywords')}
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
              {t('admin.settingsPage.siteKeywordsHint')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="logo_url" className="text-sm font-medium">
              {t('admin.settingsPage.logoUrl')}
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
              {t('admin.settingsPage.logoUrlHint')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="site_url" className="text-sm font-medium">
              {t('admin.settingsPage.siteUrl')}
            </label>
            <input
              id="site_url"
              type="text"
              value={settings.site_url}
              onChange={(e) => setSettings(prev => ({ ...prev, site_url: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.settingsPage.siteUrlHint')}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('admin.settingsPage.emailSettings')}</h2>

          <div className="space-y-2">
            <label htmlFor="email_from" className="text-sm font-medium">
              {t('admin.settingsPage.emailFrom')}
            </label>
            <input
              id="email_from"
              type="email"
              value={settings.email_from}
              onChange={(e) => setSettings(prev => ({ ...prev, email_from: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="noreply@yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.settingsPage.emailFromHint')}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('admin.settingsPage.homepage')}</h2>

          <div className="space-y-2">
            <label htmlFor="home_title" className="text-sm font-medium">
              {t('admin.settingsPage.homeTitle')}
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
              {t('admin.settingsPage.homeTitleHint')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="home_subtitle" className="text-sm font-medium">
              {t('admin.settingsPage.homeSubtitle')}
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
              {t('admin.settingsPage.homeSubtitleHint')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="home_custom_content" className="text-sm font-medium">
              {t('admin.settingsPage.customContent')}
            </label>
            <textarea
              id="home_custom_content"
              value={settings.home_custom_content}
              onChange={(e) => setSettings(prev => ({ ...prev, home_custom_content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="About this blog..."
            />
            <div className="text-xs text-muted-foreground mt-2">
              {t('admin.settingsPage.customContentHint')}
              <ul className="list-disc list-inside mt-1 space-y-1 ml-1 text-muted-foreground/80">
                <li>Use <code className="bg-muted px-1 py-0.5 rounded">**bold**</code> for emphasis.</li>
                <li>Use <code className="bg-muted px-1 py-0.5 rounded">&lt;mark&gt;highlighted text&lt;/mark&gt;</code> for yellow background.</li>
                <li>Add images via <code className="bg-muted px-1 py-0.5 rounded">![Alt](url)</code> or <code className="bg-muted px-1 py-0.5 rounded">&lt;img src="..." /&gt;</code>.</li>
                <li>Links: <code className="bg-muted px-1 py-0.5 rounded">[Title](url)</code>.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('admin.settingsPage.footer')}</h2>

          <div className="space-y-2">
            <label htmlFor="footer_text" className="text-sm font-medium">
              {t('admin.settingsPage.footerText')}
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
              {t('admin.settingsPage.footerTextHint')}
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? t('admin.settingsPage.saving') : t('admin.settingsPage.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
}
