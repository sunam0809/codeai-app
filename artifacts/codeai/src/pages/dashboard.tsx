import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { format } from 'date-fns';
import { FolderGit2, Plus, Terminal, Trash2, LogOut, Clock } from 'lucide-react';
import { 
  useGetMe, 
  useListProjects, 
  useCreateProject, 
  useDeleteProject,
  getGetMeQueryKey,
  getListProjectsQueryKey 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const { data: user, isError: userError } = useGetMe({ 
    query: { enabled: isAuthenticated, retry: false, queryKey: getGetMeQueryKey() } 
  });
  
  const { data: projects, isLoading: projectsLoading } = useListProjects({
    query: { enabled: !!user, queryKey: getListProjectsQueryKey() }
  });

  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  useEffect(() => {
    if (!isAuthenticated || userError) {
      logout();
    }
  }, [isAuthenticated, userError, logout]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    createProject.mutate({
      data: { name: newProjectName, description: newProjectDesc }
    }, {
      onSuccess: (newProj) => {
        setIsCreateOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/project/${newProj.id}`);
      },
      onError: () => {
        toast({ title: '생성 실패', description: '프로젝트를 생성하지 못했습니다.', variant: 'destructive' });
      }
    });
  };

  const handleDeleteProject = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) return;
    
    deleteProject.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: '삭제 완료', description: '프로젝트가 삭제되었습니다.' });
      }
    });
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><Terminal className="w-8 h-8 animate-pulse text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            <span className="font-bold font-mono text-xl">CodeAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground font-mono">
              {user.username} <span className="opacity-50">({user.email})</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="로그아웃">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">작업 공간</h1>
            <p className="text-muted-foreground mt-1">모든 프로젝트와 대화 내역을 관리하세요.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono">
                <Plus className="w-4 h-4 mr-2" /> 새 프로젝트
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>새 프로젝트 생성</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">프로젝트 이름</label>
                  <Input 
                    id="name" 
                    value={newProjectName} 
                    onChange={(e) => setNewProjectName(e.target.value)} 
                    placeholder="ex) System Monitor" 
                    className="font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="desc" className="text-sm font-medium">설명 (선택)</label>
                  <Input 
                    id="desc" 
                    value={newProjectDesc} 
                    onChange={(e) => setNewProjectDesc(e.target.value)} 
                    placeholder="C++ 기반 시스템 모니터링 툴" 
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">취소</Button>
                </DialogClose>
                <Button onClick={handleCreateProject} disabled={createProject.isPending || !newProjectName.trim()}>
                  생성하기
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-card/50 border border-border animate-pulse" />
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-card/20">
            <FolderGit2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">프로젝트가 없습니다</h3>
            <p className="text-muted-foreground mb-6">첫 번째 프로젝트를 생성하고 AI와 코딩을 시작해보세요.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group bg-card/40 backdrop-blur-sm border-border flex flex-col">
                  <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xl font-mono truncate max-w-[200px]">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-2 h-10">
                        {project.description || '설명 없음'}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity -mt-2 -mr-2"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 pb-4 flex justify-between items-center text-sm text-muted-foreground border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{project.messageCount} messages</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(new Date(project.updatedAt), 'MMM d, HH:mm')}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
