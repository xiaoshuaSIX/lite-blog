import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container max-w-3xl mx-auto px-6 py-12 md:py-20">
        {/* Title skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-muted/50 rounded-lg w-3/4 animate-pulse mb-4" />
          <div className="flex items-center gap-4">
            <div className="h-4 bg-muted/30 rounded w-24 animate-pulse" />
            <div className="h-4 bg-muted/30 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-4/5 animate-pulse" />
          <div className="h-8" />
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
          <div className="h-8" />
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
