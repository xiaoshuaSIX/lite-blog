export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/home/hero-section';
import { api, ArticleListItem } from '@/lib/api';

async function getArticles() {
  try {
    const response = await api.getArticles(1, 10);
    return response.articles;
  } catch {
    return [];
  }
}

function ArticleRow({ article }: { article: ArticleListItem }) {
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Link 
      href={`/posts/${article.slug}`} 
      className="group relative flex items-center justify-between gap-4 p-4 -mx-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:backdrop-blur-md border border-transparent hover:border-border/50"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="text-lg font-medium text-foreground/90 group-hover:text-primary transition-colors truncate">
          {article.title}
        </h2>
        {/* Optional: Show small excerpt or tags if needed later, kept minimal for now */}
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {article.visibility === 'member_full' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Member
          </span>
        )}
        {publishedDate && (
          <span className="text-sm text-muted-foreground font-mono group-hover:text-foreground/80 transition-colors">
            {publishedDate}
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function Home() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none mix-blend-screen" />

      <Header />

      <main className="flex-1 container max-w-3xl mx-auto px-6 py-12 md:py-24 relative z-10">
        {/* Hero Section */}
        <div className="mb-20 md:mb-32 text-center">
          <HeroSection />
        </div>

        {/* Articles List */}
        <section className="space-y-2">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
              Latest Writings
            </h2>
          </div>
          
          {articles.length > 0 ? (
            <div className="flex flex-col gap-1">
              {articles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50">
              <p className="text-muted-foreground">No articles found yet.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
