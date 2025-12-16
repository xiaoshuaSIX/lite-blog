export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/layout/header';
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
    ? new Date(article.published_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
          >
            &larr; Back to articles
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {publishedDate && <span>{publishedDate}</span>}
              {article.author_email && <span>by {article.author_email}</span>}
              {article.visibility === 'member_full' && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  Member Only
                </span>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className="relative">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </div>

            {/* Paywall Overlay */}
            {article.is_preview && (
              <div className="relative">
                {/* Gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" style={{ marginTop: '-8rem' }} />

                {/* CTA Box */}
                <div className="mt-8 p-8 border-2 border-primary rounded-lg text-center bg-primary/5">
                  <h3 className="text-2xl font-bold mb-3">
                    Continue Reading
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Become a member to access the full article and all exclusive content.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/register"
                      className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                      Become a Member
                    </Link>
                    <Link
                      href="/login"
                      className="border border-primary text-primary px-8 py-3 rounded-md font-medium hover:bg-primary/10 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Already a member? Sign in to read the full article.
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Lite Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
