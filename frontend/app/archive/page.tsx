'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pin, LockKeyhole } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { api, ArticleListItem } from '@/lib/api';
import { useLanguage } from '@/providers/language-provider';

export default function ArchivePage() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        // Get a large page size to fetch all articles
        const response = await api.getArticles(1, 1000);
        setArticles(response.articles);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  function ArticleRow({ article }: { article: ArticleListItem }) {
    // Use YYYY-MM-DD for fixed width and clean look
    const publishedDate = article.published_at
      ? new Date(article.published_at).toISOString().split('T')[0]
      : null;

    return (
      <Link
        href={`/posts/${article.slug}`}
        className="group flex items-baseline gap-6 py-2 -mx-4 px-4 rounded-md hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-mono text-muted-foreground/60 w-24 shrink-0 tabular-nums text-right">
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Header />

      <main className="flex-1 container max-w-3xl mx-auto px-6 py-12 md:py-24">
        {/* Page Header */}
        <div className="mb-12 border-b border-border pb-4">
          <h1 className="text-xl font-bold mb-2">
            {t('archive.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {articles.length} {articles.length === 1 ? 'post' : 'posts'} in total
          </p>
        </div>

        {/* Articles List */}
        <section className="space-y-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground/20"></div>
            </div>
          ) : articles.length > 0 ? (
            <div className="flex flex-col">
              {articles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No articles found yet.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
