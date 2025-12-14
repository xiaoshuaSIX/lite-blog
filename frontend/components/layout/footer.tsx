'use client';

import { useSiteSettings } from '@/providers/settings-provider';

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()}{' '}
          {settings?.footer_text || 'Lite Blog. All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
