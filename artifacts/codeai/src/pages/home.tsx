import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden dark">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 container max-w-4xl px-4 py-20 flex flex-col items-center text-center space-y-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <Terminal className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-mono">CodeAI</h1>
        </div>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          코딩에 특화된 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">AI 어시스턴트</span>
        </h2>

        <p className="text-xl text-muted-foreground max-w-2xl">
          exe, dll, sys 파일을 AI가 직접 생성해드립니다. 
          전문가처럼 강력한 도구를 다루는 경험을 해보세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-12 mb-12 text-left">
          <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-xl flex flex-col items-start">
            <Terminal className="w-6 h-6 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">실행 파일 생성</h3>
            <p className="text-sm text-muted-foreground">대화를 통해 직접 실행 가능한 exe 파일을 빌드하고 다운로드 받으세요.</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-xl flex flex-col items-start">
            <ShieldAlert className="w-6 h-6 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">시스템 도구</h3>
            <p className="text-sm text-muted-foreground">dll, sys 같은 시스템 레벨의 컴포넌트도 안전하게 생성합니다.</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-xl flex flex-col items-start">
            <Cpu className="w-6 h-6 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">지속적인 대화</h3>
            <p className="text-sm text-muted-foreground">프로젝트별로 대화 이력이 저장되어 언제든 이어서 작업할 수 있습니다.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 font-mono text-base h-12">
                대시보드로 이동
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 font-mono text-base h-12">
                  로그인
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 font-mono text-base h-12">
                  무료로 시작하기
                </Button>
              </Link>
            </>
          )}
        </div>
        
        {/* Terminal Animation Demo Mock */}
        <div className="w-full max-w-2xl mt-16 bg-[#0d1117] rounded-lg border border-border overflow-hidden shadow-2xl">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="mx-auto text-xs text-muted-foreground font-mono">build.sh</div>
          </div>
          <div className="p-4 font-mono text-sm text-left text-gray-300">
            <div className="opacity-70">&gt; Building project structure...</div>
            <div className="opacity-70">&gt; Compiling main.c...</div>
            <div className="text-primary">&gt; Linking object files...</div>
            <div>&gt; Generating output.exe...</div>
            <div className="text-green-400 mt-2">✓ Build successful. Ready to download.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
