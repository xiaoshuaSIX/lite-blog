"use client";

import * as React from "react";
import { api, SiteSettings } from "@/lib/api";
import { DynamicHead } from "@/components/dynamic-head";

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
  site_name: "Lite Blog",
  site_description: "A role-based blog system",
  site_keywords: "blog, articles, technology",
  site_url: "http://localhost:8080",
  email_from: "",
  home_title: "Welcome to Lite Blog",
  home_subtitle: "Discover amazing articles and insights",
  home_custom_content: "",
  footer_text: "Lite Blog. All rights reserved.",
  logo_url: "",
};

const SettingsContext = React.createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refresh: async () => {},
});

// Cache settings at module level to prevent refetching on every navigation
let cachedSettings: SiteSettings | null = null;
let settingsFetched = false;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<SiteSettings | null>(cachedSettings);
  const [loading, setLoading] = React.useState(!settingsFetched);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSettings = React.useCallback(async (force = false) => {
    // Skip if already fetched and not forcing refresh
    if (settingsFetched && !force) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getSiteSettings();
      cachedSettings = data;
      setSettings(data);
    } catch {
      setError("Failed to load settings");
      cachedSettings = defaultSettings;
      setSettings(defaultSettings);
    } finally {
      settingsFetched = true;
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!settingsFetched) {
      fetchSettings();
    }
  }, [fetchSettings]);

  const value = React.useMemo(
    () => ({
      settings: settings || defaultSettings,
      loading,
      error,
      refresh: fetchSettings,
    }),
    [settings, loading, error, fetchSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      <DynamicHead />
      {children}
    </SettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SettingsProvider");
  }
  return context;
}
