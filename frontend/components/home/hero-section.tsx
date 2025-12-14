'use client';

import { useSiteSettings } from '@/providers/settings-provider';

export function HeroSection() {
  const { settings } = useSiteSettings();

  return (
    <section className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">
        {settings?.home_title || 'Welcome to Lite Blog'}
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        {settings?.home_subtitle || 'Discover amazing articles and insights'}
      </p>
    </section>
  );
}
