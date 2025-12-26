import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { SiteSettings } from '@/lib/api';

interface HeroSectionProps {
  settings: SiteSettings | null;
}

export function HeroSection({ settings }: HeroSectionProps) {

  return (
    <section className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">
        {settings?.home_title || 'Welcome to Lite Blog'}
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
        {settings?.home_subtitle || 'Discover amazing articles and insights'}
      </p>

      {settings?.home_custom_content && (
        <div className="w-full mt-8 px-2 text-left text-foreground/90 text-base leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // Highlight Styling
              mark: ({ ...props }) => (
                <mark 
                  className="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-900 dark:text-yellow-200 px-1 rounded mx-0.5" 
                  {...props} 
                />
              ),
              // Links
              a: ({ ...props }) => (
                <a 
                  className="text-primary font-medium hover:underline underline-offset-4 decoration-primary/30 transition-colors" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  {...props} 
                />
              ),
              // Images
              img: ({ ...props }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  className="max-w-full h-auto rounded-lg my-4 shadow-sm border border-border/50 block mx-auto" 
                  alt={props.alt || 'Content image'} 
                  {...props} 
                />
              ),
              // Typography
              h1: ({ ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3 first:mt-0" {...props} />,
              h2: ({ ...props }) => <h3 className="text-xl font-bold mt-5 mb-2" {...props} />,
              h3: ({ ...props }) => <h4 className="text-lg font-bold mt-4 mb-2" {...props} />,
              p: ({ ...props }) => <p className="leading-relaxed mb-4 last:mb-0" {...props} />,
              ul: ({ ...props }) => <ul className="list-disc list-inside my-4 space-y-1 pl-2" {...props} />,
              ol: ({ ...props }) => <ol className="list-decimal list-inside my-4 space-y-1 pl-2" {...props} />,
              blockquote: ({ ...props }) => (
                <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 italic text-muted-foreground bg-primary/5 rounded-r" {...props} />
              ),
              hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
            }}
          >
            {settings.home_custom_content}
          </ReactMarkdown>
        </div>
      )}
    </section>
  );
}
