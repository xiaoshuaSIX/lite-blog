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
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
      })
    : null;

  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted/70 text-pink-500 text-xs sm:text-sm font-mono tabular-nums shrink-0">
        {publishedDate || 'Draft'}
      </span>
      <Link
        href={`/posts/${article.slug}`}
        className="min-w-0 text-base sm:text-lg text-primary underline underline-offset-4 decoration-border/80 hover:decoration-primary transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          {article.is_pinned && (
            <Pin className="w-3.5 h-3.5 text-foreground/70 shrink-0" />
          )}
          {article.title}
          {article.visibility === 'member_full' && (
            <LockKeyhole className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
          )}
        </span>
      </Link>
    </div>
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
            <ul className="list-disc pl-5 sm:pl-6 space-y-4 sm:space-y-5 marker:text-foreground/80">
              {articles.map((article) => (
                <li key={article.id}>
                  <ArticleRow article={article} />
                </li>
              ))}
            </ul>
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
