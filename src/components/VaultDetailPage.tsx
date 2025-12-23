import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Building2, Users, FolderKanban, Target, Plus, Loader2, 
  Calendar, DollarSign, CheckCircle2, Circle, X
} from 'lucide-react';

interface VaultData {
  id: string;
  name: string;
  country: string;
  total_capital: number;
  community_members: number;
  carbon_offset_tons: number;
  projects_funded: number;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

interface CommunityMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  joined_at: string;
}

interface VaultDetailPageProps {
  isOpen: boolean;
  onClose: () => void;
  vault: VaultData | null;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

export const VaultDetailPage = ({ isOpen, onClose, vault }: VaultDetailPageProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    if (vault && isOpen) {
      fetchVaultData();
    }
  }, [vault, isOpen]);

  const fetchVaultData = async () => {
    if (!vault) return;
    setLoading(true);

    try {
      const [projectsRes, membersRes] = await Promise.all([
        supabase.from('vault_projects').select('*').eq('vault_id', vault.id),
        supabase.from('community_members').select('*').eq('vault_id', vault.id),
      ]);

      if (projectsRes.data) {
        setProjects(projectsRes.data);
        
        if (projectsRes.data.length > 0) {
          const projectIds = projectsRes.data.map(p => p.id);
          const milestonesRes = await supabase
            .from('vault_milestones')
            .select('*')
            .in('project_id', projectIds);
          
          if (milestonesRes.data) {
            setMilestones(milestonesRes.data);
          }
        }
      }

      if (membersRes.data) {
        setMembers(membersRes.data);
      }
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault || !user) return;

    setIsAddingProject(true);
    const { error } = await supabase.from('vault_projects').insert({
      vault_id: vault.id,
      name: newProjectName,
      description: newProjectDescription || null,
      budget: parseFloat(newProjectBudget) * 1000000 || 0,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to create project', variant: 'destructive' });
    } else {
      toast({ title: 'Project Created', description: `${newProjectName} added to vault` });
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectBudget('');
      fetchVaultData();
    }
    setIsAddingProject(false);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user) return;

    const { error } = await supabase.from('vault_milestones').insert({
      project_id: selectedProjectId,
      title: newMilestoneTitle,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add milestone', variant: 'destructive' });
    } else {
      toast({ title: 'Milestone Added', description: newMilestoneTitle });
      setNewMilestoneTitle('');
      setSelectedProjectId(null);
      fetchVaultData();
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    const { error } = await supabase
      .from('vault_milestones')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', milestoneId);

    if (!error) {
      setMilestones(prev => 
        prev.map(m => m.id === milestoneId ? { ...m, completed } : m)
      );
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault || !user) return;

    setIsAddingMember(true);
    const { error } = await supabase.from('community_members').insert({
      vault_id: vault.id,
      name: newMemberName,
      email: newMemberEmail || null,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add member', variant: 'destructive' });
    } else {
      toast({ title: 'Member Added', description: `${newMemberName} joined the community` });
      setNewMemberName('');
      setNewMemberEmail('');
      fetchVaultData();
    }
    setIsAddingMember(false);
  };

  if (!vault) return null;

  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            {vault.name}
            <Badge variant={vault.status === 'active' ? 'default' : 'secondary'}>
              {vault.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Vault Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{formatCurrency(vault.total_capital)}</p>
            <p className="text-xs text-muted-foreground">Total Capital</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-secondary" />
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </Card>
          <Card className="p-4 text-center">
            <FolderKanban className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-xs text-muted-foreground">Projects</p>
          </Card>
          <Card className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{completedMilestones}/{totalMilestones}</p>
            <p className="text-xs text-muted-foreground">Milestones</p>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </Card>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="members">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              {user && (
                <Card className="p-4">
                  <form onSubmit={handleAddProject} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Project Name</Label>
                        <Input
                          placeholder="e.g., Clean Water Initiative"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief description"
                          value={newProjectDescription}
                          onChange={(e) => setNewProjectDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Budget ($ millions)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 5"
                          value={newProjectBudget}
                          onChange={(e) => setNewProjectBudget(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" disabled={isAddingProject}>
                      {isAddingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                      Add Project
                    </Button>
                  </form>
                </Card>
              )}

              {projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects yet</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => {
                    const projectMilestones = milestones.filter(m => m.project_id === project.id);
                    const projectCompleted = projectMilestones.filter(m => m.completed).length;
                    const projectProgress = projectMilestones.length > 0 
                      ? (projectCompleted / projectMilestones.length) * 100 
                      : 0;

                    return (
                      <Card key={project.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {project.name}
                              <Badge variant="outline" className="text-xs">{project.status}</Badge>
                            </h4>
                            {project.description && (
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {formatCurrency(project.budget)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress value={projectProgress} className="flex-1 h-1.5" />
                          <span className="text-xs text-muted-foreground">
                            {projectCompleted}/{projectMilestones.length} milestones
                          </span>
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProjectId(project.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Milestone
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              {selectedProjectId && (
                <Card className="p-4">
                  <form onSubmit={handleAddMilestone} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>New Milestone for {projects.find(p => p.id === selectedProjectId)?.name}</Label>
                      <Input
                        placeholder="Milestone title"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedProjectId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </form>
                </Card>
              )}

              {milestones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No milestones yet</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => {
                    const projectMilestones = milestones.filter(m => m.project_id === project.id);
                    if (projectMilestones.length === 0) return null;

                    return (
                      <div key={project.id}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{project.name}</h4>
                        <div className="space-y-1 mb-4">
                          {projectMilestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={milestone.completed}
                                onCheckedChange={(checked) => 
                                  handleToggleMilestone(milestone.id, checked as boolean)
                                }
                              />
                              <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                                {milestone.title}
                              </span>
                              {milestone.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              {user && (
                <Card className="p-4">
                  <form onSubmit={handleAddMember} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Member name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Email (optional)</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={isAddingMember}>
                      {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                      Add Member
                    </Button>
                  </form>
                </Card>
              )}

              {members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No community members yet</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <Card key={member.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role} · Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
