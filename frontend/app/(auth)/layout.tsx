import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-40 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10 opacity-40 pointer-events-none mix-blend-screen" />

      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 p-6 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">⚡️</span>
            Lite Blog
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Glass Card Container */}
      <main className="w-full max-w-md px-4 relative z-10">
        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-primary/5">
          {children}
        </div>
      </main>
    </div>
  );
}
