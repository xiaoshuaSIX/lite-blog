import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function ArticleLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-[#faf9f6] dark:bg-[#18181b] [--grid-color:#e5e7eb] dark:[--grid-color:#000000]"
      style={{
        backgroundImage:
          'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Header />

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Back button skeleton */}
        <div className="mb-4">
          <div className="h-9 w-28 bg-foreground/10 rounded-md animate-pulse" />
        </div>

        <article className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5 md:p-10 relative overflow-hidden">
          {/* Title skeleton */}
          <div className="mb-6 md:mb-8">
            <div className="h-8 md:h-9 bg-foreground/15 rounded-lg w-5/6 animate-pulse mb-3" />
            <div className="flex items-center gap-3">
              <div className="h-4 bg-foreground/10 rounded w-24 animate-pulse" />
              <div className="h-4 bg-foreground/10 rounded w-10 animate-pulse" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-4/5 animate-pulse" />
            <div className="h-8" />
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-3/4 animate-pulse" />
            <div className="h-8" />
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-foreground/8 rounded w-full animate-pulse" />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
