export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Pin, ArrowRight, LockKeyhole } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/home/hero-section';
import { api, ArticleListItem, SiteSettings } from '@/lib/api';

async function getArticles() {
  try {
    const response = await api.getArticles(1, 10);
    return response.articles;
  } catch {
    return [];
  }
}

async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await api.getSiteSettings();
  } catch {
    return null;
  }
}

function ArticleRow({ article }: { article: ArticleListItem }) {
  // Use YYYY-MM-DD for fixed width and clean look
  const publishedDate = article.published_at
    ? new Date(article.published_at).toISOString().split('T')[0]
    : null;

  return (
    <Link
      href={`/posts/${article.slug}`}
      className="group flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-3 sm:py-2 -mx-2 sm:-mx-4 px-2 sm:px-4 rounded-md hover:bg-muted/50 transition-colors"
    >
      <span className="text-xs sm:text-sm font-mono text-muted-foreground/60 sm:w-24 shrink-0 tabular-nums sm:text-right">
        {publishedDate || 'Draft'}
      </span>

      <div className="flex items-baseline gap-2.5 min-w-0 flex-1">
        {article.is_pinned && (
          <Pin className="w-3.5 h-3.5 text-foreground/70 shrink-0 translate-y-0.5" />
        )}
        
        <h2 className="text-base font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
          {article.title}
        </h2>
        
        {article.visibility === 'member_full' && (
          <LockKeyhole className="w-3 h-3 text-muted-foreground/40 shrink-0 self-center translate-y-[1px]" />
        )}
      </div>
    </Link>
  );
}

export default async function Home() {
  const [articles, settings] = await Promise.all([
    getArticles(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient Background Glow removed */}

      <Header />

      <main className="flex-1 container max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-24">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-16 md:mb-24">
          <HeroSection settings={settings} />
        </div>

        {/* Articles List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-border">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-widest">
              Latest Writings
            </h2>
            <Link 
              href="/archive"
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View All
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
          
          {articles.length > 0 ? (
            <div className="flex flex-col">
              {articles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-20 bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50">
              <p className="text-sm sm:text-base text-muted-foreground">No articles found yet.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
