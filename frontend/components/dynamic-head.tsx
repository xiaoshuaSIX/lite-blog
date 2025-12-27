"use client";

import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/providers/settings-provider";

// Track favicon state to avoid duplicate DOM operations
let appliedFavicon = "";
let defaultFaviconsRemoved = false;

// Module-level cache for site name - persists across navigations
let cachedSiteName: string | null = null;

// Setup a global MutationObserver that runs immediately
// This ensures title is protected even before React hydrates
if (typeof window !== "undefined") {
  const protectTitle = () => {
    if (cachedSiteName && document.title !== cachedSiteName) {
      document.title = cachedSiteName;
    }
  };

  const globalObserver = new MutationObserver(protectTitle);
  globalObserver.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

export function DynamicHead() {
  const { settings } = useSiteSettings();
  const faviconRef = useRef<HTMLLinkElement | null>(null);

  // Update cached site name and apply title immediately
  useEffect(() => {
    // Only update cache if we have a real site name (not default)
    if (settings?.site_name && settings.site_name !== "Lite Blog") {
      cachedSiteName = settings.site_name;
      document.title = settings.site_name;
    } else if (settings?.site_name && cachedSiteName === null) {
      // First load with default, don't cache "Lite Blog"
      cachedSiteName = settings.site_name;
      document.title = settings.site_name;
    }
  }, [settings?.site_name]);

  // Update favicon only if changed
  useEffect(() => {
    if (!settings?.logo_url || settings.logo_url === appliedFavicon) return;

    // Remove default favicons only once on first custom favicon set
    if (!defaultFaviconsRemoved) {
      const defaultFavicons = document.querySelectorAll(
        'link[rel="icon"]:not(#dynamic-favicon), link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      );
      defaultFavicons.forEach((el) => el.remove());
      defaultFaviconsRemoved = true;
    }

    // Remove our previously created dynamic favicon if exists
    if (faviconRef.current && faviconRef.current.parentNode) {
      faviconRef.current.parentNode.removeChild(faviconRef.current);
    }

    // Create new favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = settings.logo_url.endsWith(".svg")
      ? "image/svg+xml"
      : settings.logo_url.endsWith(".png")
        ? "image/png"
        : "image/x-icon";
    link.href = settings.logo_url;
    link.id = "dynamic-favicon";
    document.head.appendChild(link);

    faviconRef.current = link;
    appliedFavicon = settings.logo_url;
  }, [settings?.logo_url]);

  return null;
}
