"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/providers/settings-provider";

export function DynamicHead() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Update document title
    if (settings.site_name) {
      document.title = settings.site_name;
    }

    // Update favicon if logo_url is set
    if (settings.logo_url) {
      // Remove all existing favicon links to avoid conflicts
      const existingLinks = document.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      );
      existingLinks.forEach((link) => link.remove());

      // Create new favicon link
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = settings.logo_url.endsWith(".svg")
        ? "image/svg+xml"
        : settings.logo_url.endsWith(".png")
          ? "image/png"
          : "image/x-icon";
      link.href = settings.logo_url;
      document.head.appendChild(link);
    }
  }, [settings]);

  return null;
}
