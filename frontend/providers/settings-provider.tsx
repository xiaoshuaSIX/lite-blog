"use client";

import * as React from "react";
import { api, SiteSettings } from "@/lib/api";

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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSiteSettings();
      setSettings(data);
    } catch {
      setError("Failed to load settings");
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
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
