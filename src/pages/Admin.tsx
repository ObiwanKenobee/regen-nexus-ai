import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Shield, Users, Search, ChevronLeft, 
  UserCog, Crown, User, Loader2, History, Download, Calendar, RefreshCw,
  Settings, Activity, BarChart3
} from 'lucide-react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import NotificationSettings from '@/components/admin/NotificationSettings';
import RealTimeTransactionWidget from '@/components/admin/RealTimeTransactionWidget';
import UserActivityTracker from '@/components/admin/UserActivityTracker';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

const roleIcons: Record<AppRole, React.ReactNode> = {
  admin: <Crown className="w-4 h-4 text-yellow-500" />,
  moderator: <Shield className="w-4 h-4 text-blue-500" />,
  user: <User className="w-4 h-4 text-muted-foreground" />,
};

const roleBadgeVariants: Record<AppRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  moderator: 'secondary',
  user: 'outline',
};

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { trackPageView, trackFeatureUse } = useActivityTracker();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    trackPageView("Admin Dashboard");
  }, [trackPageView]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You need admin privileges to access this page.',
        variant: 'destructive',
      });
      navigate('/');
    } else if (!authLoading && isAdmin) {
      fetchUsers();
      fetchAuditLogs();
      setupRealtimeSubscriptions();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, isAdmin, authLoading, navigate]);

  const setupRealtimeSubscriptions = () => {
    channelRef.current = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('New user profile created:', payload);
          toast({
            title: 'New User Registered',
            description: `A new user has joined the platform.`,
          });
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('User role changed:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            toast({
              title: 'Role Updated',
              description: 'A user role has been modified.',
            });
          }
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles and their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: (userRole?.role as AppRole) || 'user',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('id, user_id, action, target_type, target_id, old_value, new_value, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs((data || []) as AuditLog[]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [dateFrom, dateTo, isAdmin]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const exportAuditLogsToCSV = () => {
    if (auditLogs.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no audit logs to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Timestamp', 'User ID', 'Action', 'Target Type', 'Target ID', 'Old Value', 'New Value'];
    
    const csvRows = auditLogs.map(log => {
      const oldVal = log.old_value ? JSON.stringify(log.old_value) : '';
      const newVal = log.new_value ? JSON.stringify(log.new_value) : '';
      return [
        new Date(log.created_at).toISOString(),
        log.user_id,
        log.action,
        log.target_type,
        log.target_id || '',
        `"${oldVal.replace(/"/g, '""')}"`,
        `"${newVal.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${auditLogs.length} audit log entries to CSV.`,
    });
  };

  const logAuditAction = async (
    action: string,
    targetType: string,
    targetId: string,
    oldValue: unknown,
    newValue: unknown
  ) => {
    if (!user) return;
    
    await supabase.from('audit_logs').insert([{
      user_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      old_value: oldValue as never,
      new_value: newValue as never,
    }]);
    
    fetchAuditLogs();
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const targetUser = users.find(u => u.user_id === userId);
    const oldRole = targetUser?.role || 'user';
    
    setUpdatingUserId(userId);
    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Log the action
      await logAuditAction(
        'role_change',
        'user',
        userId,
        { role: oldRole, email: targetUser?.email },
        { role: newRole, email: targetUser?.email }
      );

      // Send email notification for admin/moderator role assignments
      if (newRole === 'admin' || newRole === 'moderator') {
        try {
          await supabase.functions.invoke('send-critical-event-email', {
            body: {
              recipientEmail: targetUser?.email || user?.email,
              eventType: newRole === 'admin' ? 'admin_role_assigned' : 'moderator_role_assigned',
              eventData: {
                userName: targetUser?.full_name,
                userEmail: targetUser?.email,
                oldRole: oldRole,
                newRole: newRole,
                assignedBy: user?.email,
              },
            },
          });
          console.log('Critical event email sent for role assignment');
        } catch (emailError) {
          console.error('Failed to send role assignment email:', emailError);
        }
      }

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );

      toast({
        title: 'Role Updated',
        description: `User role changed from ${oldRole} to ${newRole}.`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCog className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'moderator').length}
                </p>
                <p className="text-sm text-muted-foreground">Moderators</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              User Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">User Management</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {roleIcons[u.role]}
                              <span className="font-medium">
                                {u.full_name || 'Unnamed User'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.email || 'No email'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariants[u.role]}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {u.user_id === user?.id ? (
                              <span className="text-sm text-muted-foreground">You</span>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <div>
                                    <Select
                                      value={u.role}
                                      disabled={updatingUserId === u.user_id}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Change User Role</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Select a new role for {u.full_name || u.email || 'this user'}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4 space-y-2">
                                    <Button
                                      variant={u.role === 'user' ? 'secondary' : 'outline'}
                                      className="w-full justify-start"
                                      onClick={() => handleRoleChange(u.user_id, 'user')}
                                      disabled={updatingUserId === u.user_id}
                                    >
                                      <User className="w-4 h-4 mr-2" />
                                      User - Basic access
                                    </Button>
                                    <Button
                                      variant={u.role === 'moderator' ? 'secondary' : 'outline'}
                                      className="w-full justify-start"
                                      onClick={() => handleRoleChange(u.user_id, 'moderator')}
                                      disabled={updatingUserId === u.user_id}
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      Moderator - Content management
                                    </Button>
                                    <Button
                                      variant={u.role === 'admin' ? 'secondary' : 'outline'}
                                      className="w-full justify-start"
                                      onClick={() => handleRoleChange(u.user_id, 'admin')}
                                      disabled={updatingUserId === u.user_id}
                                    >
                                      <Crown className="w-4 h-4 mr-2" />
                                      Admin - Full access
                                    </Button>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="p-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Audit Logs</h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{auditLogs.length} entries</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAuditLogsToCSV}
                      disabled={auditLogs.length === 0}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                
                {/* Date Range Filters */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter by date:</span>
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <span className="text-muted-foreground">to</span>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilters}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No audit logs yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => {
                        const oldVal = log.old_value as Record<string, unknown> | null;
                        const newVal = log.new_value as Record<string, unknown> | null;
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="text-muted-foreground">{log.target_type}:</span>{' '}
                              {String(oldVal?.email || log.target_id?.slice(0, 8) || 'N/A')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {oldVal?.role && newVal?.role ? (
                                <span>
                                  <Badge variant="outline" className="mr-2">{String(oldVal.role)}</Badge>
                                  →
                                  <Badge variant="default" className="ml-2">{String(newVal.role)}</Badge>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <UserActivityTracker />
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-6">
              <NotificationSettings />
              <RealTimeTransactionWidget />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
