import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Code2, Cpu, Zap, Terminal, FileCode2, Blocks } from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="px-6 lg:px-8 h-20 flex items-center justify-between border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight text-foreground">CodeAI</span>
        </div>
        <nav>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-8">
            <Zap className="mr-2 h-4 w-4" />
            <span>The unrestricted coding assistant for serious engineers.</span>
          </div>
          
          <h1 className="max-w-4xl text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground mb-6">
            Build software <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">without limits.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
            Generate system binaries, write complex UIs, and tackle heavy-lifting programming tasks. 
            CodeAI delivers raw technical power directly to your workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href={isAuthenticated ? "/dashboard" : "/register"}>
              <Button size="lg" className="h-12 px-8 text-base shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-shadow">
                Start Building Now
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border hover:bg-muted">
                Explore Features
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Engineering power at your fingertips</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We stripped away the guardrails so you can focus on writing real software, from high-level web apps down to system internals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Cpu className="h-8 w-8" />}
              title="System Programming"
              description="Generate .exe, .dll, and .sys files. Need C++ or Rust systems code? Just ask."
            />
            <FeatureCard 
              icon={<Blocks className="h-8 w-8" />}
              title="Beautiful UIs"
              description="Write complex React, Vue, or native application interfaces with precision."
            />
            <FeatureCard 
              icon={<FileCode2 className="h-8 w-8" />}
              title="Real Files"
              description="When CodeAI writes a file, you get a direct download button. No more copy-pasting massive chunks."
            />
            <FeatureCard 
              icon={<Code2 className="h-8 w-8" />}
              title="Syntax Mastery"
              description="Deep understanding of niche languages, esoteric frameworks, and legacy codebases."
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8" />}
              title="Zero Restrictions"
              description="An assistant built for professionals. We don't get in your way."
            />
            <FeatureCard 
              icon={<Terminal className="h-8 w-8" />}
              title="Context Aware"
              description="Every project maintains its own isolated conversation history and file context."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground">CodeAI</span>
        </div>
        <p>For serious engineers. Built without limits.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-colors group">
      <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
