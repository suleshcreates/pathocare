import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Users, Search, User, Building2, Shield,
  MoreHorizontal, Edit2, Trash2, Mail, Phone,
  ChevronLeft, ChevronRight, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { adminService } from '@/services/adminService';
import type { User as UserType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  patient: 'bg-teal-100 text-teal-700',
  lab: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-amber-100 text-amber-700',
};

const roleLabels: Record<string, string> = {
  patient: 'Patient',
  lab: 'Lab Staff',
  admin: 'Administrator',
  PATIENT: 'Patient',
  LAB: 'Lab Staff',
  ADMIN: 'Administrator'
};

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all'); // Allow string to match uppercase roles
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.user-row'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
      );
    }
  }, [searchQuery, roleFilter, loading]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    // Normalize role comparison (DB might be uppercase)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter || user.role?.toUpperCase() === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    patients: users.filter(u => u.role === 'patient').length,
    labs: users.filter(u => u.role === 'lab').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  const handleDeleteUser = async () => {
    setShowDeleteDialog(false);
    toast.info("Delete functionality coming soon");

  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform users and their permissions</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600">
          <User className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Patients', value: stats.patients, color: 'bg-teal-100 text-teal-700' },
          { label: 'Lab Staff', value: stats.labs, color: 'bg-indigo-100 text-indigo-700' },
          { label: 'Admins', value: stats.admins, color: 'bg-amber-100 text-amber-700' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.color.split(' ')[1])}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'patient', 'lab', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role === 'all' ? 'all' : role.toUpperCase())} // Filter by uppercase to match DB likely
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all capitalize',
                (role === 'all' && roleFilter === 'all') || roleFilter === role.toUpperCase()
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300'
              )}
            >
              {role === 'all' ? 'All Roles' : roleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="user-row hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          (roleColors[user.role as keyof typeof roleColors] || 'bg-slate-100').replace('text-', 'bg-').replace('700', '100')
                        )}>
                          <User className={cn('w-5 h-5', (roleColors[user.role as keyof typeof roleColors] || 'text-slate-500').split(' ')[1])} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn('text-xs', roleColors[user.role as keyof typeof roleColors] || 'bg-slate-100 text-slate-500')}>
                        {user.role.toUpperCase() === 'LAB' && <Building2 className="w-3 h-3 mr-1" />}
                        {user.role.toUpperCase() === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {roleLabels[user.role] || roleLabels[user.role.toUpperCase()] || user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-xs",
                        user.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" :
                          user.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                            "bg-rose-100 text-rose-700"
                      )}>
                        {user.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {user.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">No users found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredUsers.length} of {users.length} users
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleDeleteUser}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
