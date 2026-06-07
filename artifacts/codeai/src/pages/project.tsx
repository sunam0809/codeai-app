import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'date-fns';
import { 
  Terminal, FolderGit2, Download, FileCode, FileCog, Puzzle, 
  ChevronLeft, Send, Loader2, Plus
} from 'lucide-react';
import { 
  useGetMe, useGetProject, useListProjects, useListMessages, 
  useSendMessage, useListFiles, getListMessagesQueryKey, getListFilesQueryKey,
  getGetMeQueryKey, getListProjectsQueryKey, getGetProjectQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getFileIcon(type: string) {
  if (type === 'application/x-msdownload') return <Terminal className="w-4 h-4 text-primary" />;
  if (type === 'application/x-msdos-program') return <Puzzle className="w-4 h-4 text-blue-400" />;
  if (type === 'application/octet-stream') return <FileCog className="w-4 h-4 text-yellow-400" />;
  return <FileCode className="w-4 h-4 text-green-400" />;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function Project() {
  const { id } = useParams();
  const projectId = Number(id);
  const [, setLocation] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user, isError: userError } = useGetMe({ 
    query: { enabled: isAuthenticated, retry: false, queryKey: getGetMeQueryKey() } 
  });
  
  const { data: projects } = useListProjects({ query: { enabled: !!user, queryKey: getListProjectsQueryKey() } });
  const { data: project } = useGetProject(projectId, { query: { enabled: !!user && !!projectId, queryKey: getGetProjectQueryKey(projectId) } });
  const { data: messages } = useListMessages(projectId, { query: { enabled: !!user && !!projectId, queryKey: getListMessagesQueryKey(projectId) } });
  const { data: files } = useListFiles(projectId, { query: { enabled: !!user && !!projectId, queryKey: getListFilesQueryKey(projectId) } });
  
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (!isAuthenticated || userError) {
      logout();
    }
  }, [isAuthenticated, userError, logout]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMessage.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    sendMessage.mutate({
      id: projectId,
      data: { content: input }
    }, {
      onSuccess: () => {
        setInput('');
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(projectId) });
      }
    });
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const token = localStorage.getItem('codeai_token');
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || !project) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex">
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-4 w-fit transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 대시보드
          </Link>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg font-mono truncate">{project.name}</h2>
          </div>
        </div>
        <div className="p-2 flex-1 overflow-y-auto space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Projects</div>
          {projects?.map(p => (
            <Link key={p.id} href={`/project/${p.id}`}>
              <div className={`px-3 py-2 rounded-md flex items-center gap-2 cursor-pointer transition-colors ${p.id === projectId ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
                <FolderGit2 className="w-4 h-4 opacity-70" />
                <span className="text-sm font-mono truncate">{p.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center text-muted-foreground mr-4">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-bold font-mono truncate">{project.name}</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {messages?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Terminal className="w-16 h-16 mb-4" />
              <p className="text-lg">무엇을 빌드할까요?</p>
            </div>
          ) : (
            messages?.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-12' : 'bg-muted/50 border border-border mr-12'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-primary opacity-80">
                      <Terminal className="w-4 h-4" />
                      <span className="text-xs font-mono font-bold">CodeAI</span>
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none text-sm md:text-base">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              {...props}
                              children={String(children).replace(/\n$/, '')}
                              style={vscDarkPlus as any}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md !bg-black/50 border border-border my-2"
                            />
                          ) : (
                            <code {...props} className="bg-black/30 text-primary-foreground px-1.5 py-0.5 rounded text-sm font-mono">
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {sendMessage.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl p-4 bg-muted/50 border border-border mr-12">
                <div className="flex items-center gap-2 text-primary opacity-80 mb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold">CodeAI</span>
                </div>
                <div className="flex gap-1 py-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="시스템 도구나 컴포넌트 생성을 요청하세요..."
              className="pr-12 bg-muted/30 border-border h-12 font-mono text-sm md:text-base focus-visible:ring-primary/50"
              disabled={sendMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 w-10 h-10"
              disabled={!input.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Files */}
      <div className="w-72 border-l border-border bg-card/20 hidden lg:flex flex-col">
        <div className="h-14 border-b border-border flex items-center px-4">
          <h3 className="font-semibold text-sm">생성된 파일</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!files || files.length === 0) ? (
            <div className="text-center text-muted-foreground text-sm opacity-50 py-8">
              생성된 파일이 없습니다
            </div>
          ) : (
            files.map(file => (
              <div key={file.id} className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 truncate pr-2">
                    {getFileIcon(file.fileType)}
                    <span className="font-mono text-sm truncate" title={file.filename}>{file.filename}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{formatBytes(file.fileSize)}</span>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2"
                    onClick={() => handleDownload(file.id, file.filename)}
                  >
                    <Download className="w-3 h-3 mr-1" /> 받기
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
