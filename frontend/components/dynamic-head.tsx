"use client";

import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/providers/settings-provider";

// Track what we've already applied to avoid duplicate DOM operations
let appliedTitle = "";
let appliedFavicon = "";

export function DynamicHead() {
  const { settings } = useSiteSettings();
  const faviconRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (!settings) return;

    // Update document title only if changed
    if (settings.site_name && settings.site_name !== appliedTitle) {
      document.title = settings.site_name;
      appliedTitle = settings.site_name;
    }

    // Update favicon only if changed
    if (settings.logo_url && settings.logo_url !== appliedFavicon) {
      // Remove our previously created favicon if exists
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
    }
  }, [settings]);

  return null;
}
