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
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.logo_url;
    }
  }, [settings]);

  return null;
}
