export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LockKeyhole } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackButton } from '@/components/back-button';
import type { Article } from '@/lib/api';
import { API_BASE_URL } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    // Get cookies from the request to forward to backend
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward the auth cookie if present
    if (token) {
      headers['Cookie'] = `token=${token.value}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/articles/${slug}`, {
      headers,
      cache: 'no-store', // Don't cache authenticated requests
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toISOString().split('T')[0]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] dark:bg-[#18181b] [--grid-color:#e5e7eb] dark:[--grid-color:#000000]"
      style={{
        backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <Header />
      </div>

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Back button */}
        <div className="mb-4">
          <BackButton />
        </div>

        <article className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5 md:p-10 relative overflow-hidden">
          {/* Article Header */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold mb-3 leading-snug tracking-tight text-foreground">
              {article.title}
            </h1>
            <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
              {publishedDate && (
                <span className="px-1.5 py-0.5 rounded-sm bg-stone-50 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800/70">
                  {publishedDate}
                </span>
              )}
              {article.visibility === 'member_full' && (
                <div
                  className="inline-flex items-center justify-center text-amber-700/50 dark:text-amber-400/50"
                  aria-label="Member-only"
                  title="Member-only"
                >
                  <LockKeyhole className="w-3 h-3 opacity-60" />
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className="relative">
            <div className="prose prose-neutral dark:prose-invert max-w-none 
              prose-headings:font-medium prose-headings:tracking-tight 
              prose-h1:text-xl md:prose-h1:text-2xl prose-h1:leading-snug
              prose-h2:text-lg md:prose-h2:text-xl prose-h2:leading-snug
              prose-h3:text-base md:prose-h3:text-lg prose-h3:leading-snug
              prose-h4:text-sm md:prose-h4:text-base prose-h4:leading-snug
              prose-h5:text-sm prose-h5:leading-snug
              prose-h6:text-xs prose-h6:leading-snug
              prose-p:text-[15px] md:prose-p:text-base prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:shadow-sm
              prose-pre:text-sm prose-code:text-sm
              prose-ul:text-[15px] md:prose-ul:text-base
              prose-ol:text-[15px] md:prose-ol:text-base
              prose-li:text-[15px] md:prose-li:text-base">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </div>

            {/* Paywall Overlay */}
            {article.is_preview && (
              <div className="relative mt-8 md:mt-12 pt-8 md:pt-12 border-t border-dashed border-stone-200 dark:border-zinc-800">
                <div className="text-center bg-stone-50 dark:bg-zinc-800/30 p-6 md:p-8 rounded-lg border border-stone-100 dark:border-zinc-800">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockKeyhole className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
                    Member-only Content
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                    The rest of this article is available exclusively to members. Sign in or upgrade to continue reading.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/register"
                      className="bg-foreground text-background px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Become a Member
                    </Link>
                    <Link
                      href="/login"
                      className="bg-white dark:bg-zinc-900 border border-border text-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
