import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetProject, 
  useListMessages, 
  useSendMessage, 
  useListProjects,
  getListMessagesQueryKey,
  getGetProjectQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Send, Download, Loader2, ChevronLeft, LayoutPanelLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectChat({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const { data: projects } = useListProjects();
  const { data: messages, isLoading: messagesLoading } = useListMessages(projectId);
  
  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: (data) => {
        setInput("");
        // Invalidate to fetch the new messages
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(projectId) });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to send message",
          description: error?.message || "An error occurred"
        });
      }
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate({
      projectId,
      data: { content: input.trim() }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownload = (messageId: number, fileName: string) => {
    // A simple approach is window.open or building a download anchor
    const a = document.createElement('a');
    a.href = `/api/messages/${messageId}/file`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderContent = (content: string) => {
    // Super simple regex to find code blocks and style them
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0].trim();
        const code = lines.slice(1).join('\n');
        return (
          <div key={index} className="my-4 rounded-md border border-border bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border text-xs text-muted-foreground font-mono">
              <span>{lang || 'code'}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-[#c9d1d9] whitespace-pre-wrap">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap leading-relaxed">{part}</span>;
    });
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2">
              <ChevronLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
        <div className="p-4 shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Projects</h3>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {projects?.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Button 
                  variant={p.id === projectId ? "secondary" : "ghost"} 
                  className="w-full justify-start font-normal truncate h-9 px-3"
                >
                  <LayoutPanelLeft className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{p.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-6 shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
               <Link href="/dashboard">
                 <Button variant="ghost" size="icon">
                   <ChevronLeft className="h-5 w-5" />
                 </Button>
               </Link>
            </div>
            <Terminal className="h-5 w-5 text-primary hidden md:block" />
            <h1 className="font-semibold text-foreground truncate">
              {projectLoading ? "Loading..." : project?.name}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center mt-20">
                <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-foreground mb-2">Workspace Initialized</h3>
                <p className="text-muted-foreground">
                  CodeAI is ready. Ask for system code, UI components, or any programming task.
                </p>
              </div>
            ) : (
              messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-card border border-border'
                  }`}>
                    <div className="text-sm font-semibold mb-1 opacity-70">
                      {msg.role === 'user' ? 'You' : 'CodeAI'}
                    </div>
                    <div className="text-[15px]">
                      {renderContent(msg.content)}
                    </div>
                    
                    {msg.hasFile && msg.fileName && (
                      <div className="mt-4 pt-3 border-t border-border/30">
                        <Button 
                          variant={msg.role === 'user' ? "secondary" : "outline"}
                          size="sm" 
                          onClick={() => handleDownload(msg.id, msg.fileName!)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download {msg.fileName}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Optimistic Message / Loading State */}
            {sendMutation.isPending && (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl px-5 py-4 bg-primary text-primary-foreground ml-auto opacity-70">
                    <div className="text-sm font-semibold mb-1 opacity-70">You</div>
                    <div className="text-[15px] whitespace-pre-wrap">{input}</div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>CodeAI is writing...</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background shrink-0">
          <div className="max-w-4xl mx-auto relative flex items-end">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CodeAI to build something..."
              className="min-h-[60px] max-h-[400px] w-full resize-none rounded-xl pr-14 py-4 bg-card focus-visible:ring-1 focus-visible:ring-primary border-border text-base"
              rows={1}
              disabled={sendMutation.isPending}
            />
            <Button 
              size="icon"
              className="absolute right-2 bottom-2 h-10 w-10 rounded-lg"
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-center text-xs text-muted-foreground">
            Press Enter to send, Shift + Enter for new line. CodeAI generates real, unrestricted code.
          </div>
        </div>
      </div>
    </div>
  );
}
