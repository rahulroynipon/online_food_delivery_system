import { useState, useEffect } from 'react';
import { Card, CardContent, Button, toast, Badge, Modal, DataTable, Avatar, Input, Select, type DataTableColumn } from '../../design-system';
import { 
  Users, 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Info,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Lock,
  Filter,
  Store,
  Bike
} from 'lucide-react';
import api from '../../lib/axios';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER' | 'RESTAURANT' | 'RIDER'>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    password: ''
  });

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      if (response.data?.success) {
        setUsers(response.data.users || []);
      }
    } catch {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setSelectedUser(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setModalMode('EDIT');
    setSelectedUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'CUSTOMER',
      status: user.status || 'ACTIVE',
      password: '' // Keep empty unless updating password
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');

    // Create a payload. For EDIT, exclude password if empty
    const payload: any = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      status: form.status
    };
    
    if (modalMode === 'ADD') {
      payload.password = form.password;
    } else if (form.password) {
      payload.password = form.password;
    }

    try {
      if (modalMode === 'ADD') {
        const response = await api.post('/users', payload);
        if (response.data?.success) {
          toast.success('User account created successfully!');
          setIsModalOpen(false);
          fetchUsers();
        }
      } else {
        const response = await api.put(`/users/${selectedUser.id}`, payload);
        if (response.data?.success) {
          toast.success('User account updated successfully!');
          setIsModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save user account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDelete = (user: any) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setActionLoading(`delete-${userToDelete.id}`);
    try {
      const response = await api.delete(`/users/${userToDelete.id}`);
      if (response.data?.success) {
        toast.success('User account deleted successfully.');
        setIsDeleteModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return <Badge variant="soft" color="success" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Active</Badge>;
      case 'PENDING':
        return <Badge variant="soft" color="warning" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Pending</Badge>;
      case 'SUSPENDED':
      case 'REJECTED':
        return <Badge variant="soft" color="danger" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Suspended</Badge>;
      default:
        return <Badge variant="soft" color="neutral" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="soft" color="primary" className="font-extrabold text-[9px] tracking-wide uppercase px-2.5 py-0.5">Admin</Badge>;
      case 'RESTAURANT':
        return <Badge variant="soft" color="warning" className="font-extrabold text-[9px] tracking-wide uppercase px-2.5 py-0.5">Merchant</Badge>;
      case 'RIDER':
        return <Badge variant="soft" color="success" className="font-extrabold text-[9px] tracking-wide uppercase px-2.5 py-0.5">Rider</Badge>;
      default:
        return <Badge variant="soft" color="neutral" className="font-extrabold text-[9px] tracking-wide uppercase px-2.5 py-0.5">Customer</Badge>;
    }
  };

  // Filter & Search Logic
  const filteredUsers = users.filter((u) => {
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRole && matchesSearch;
  });

  const columns: DataTableColumn<any>[] = [
    {
      id: 'user',
      label: 'User Account',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src="" 
            alt={row.name} 
            fallback={<User size={14} />} 
            size="md"
          />
          <div>
            <p className="font-extrabold text-sm text-foreground">{row.name || 'N/A'}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {getRoleBadge(row.role)}
              <span className="text-[10px] text-muted-foreground font-mono">ID: #{row.id}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      label: 'Contact Info',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-foreground">{row.email}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{row.phone || 'No phone'}</p>
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      cell: ({ row }) => getStatusBadge(row.status)
    },
    {
      id: 'date',
      label: 'Joined Date',
      cell: ({ row }) => new Date(row.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    },
    {
      id: 'actions',
      label: '',
      align: 'right' as const,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenEdit(row)}
            leftIcon={<Edit size={12} />}
            className="font-semibold border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenDelete(row)}
            leftIcon={<Trash2 size={12} />}
            className="font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">User Accounts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">View, filter, modify roles, and manage authorization statuses of all platform users.</p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus size={16} />}
          className="font-bold w-fit shadow-xs bg-primary text-white hover:bg-primary/95"
        >
          Create User
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
          {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((status) => {
            const count = status === 'ALL' 
              ? users.length 
              : users.filter(u => u.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-card text-foreground shadow-xs font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 max-w-2xl">
          <div className="shrink-0 w-full md:w-48">
            <Select
              value={roleFilter}
              onValueChange={(val) => setRoleFilter(val as any)}
              size="sm"
              options={[
                { value: 'ALL', label: 'All Roles', icon: <Users size={13} className="text-muted-foreground" /> },
                { value: 'ADMIN', label: 'Administrators', icon: <ShieldCheck size={13} className="text-muted-foreground" /> },
                { value: 'CUSTOMER', label: 'Customers', icon: <User size={13} className="text-muted-foreground" /> },
                { value: 'RESTAURANT', label: 'Merchants', icon: <Store size={13} className="text-muted-foreground" /> },
                { value: 'RIDER', label: 'Delivery Riders', icon: <Bike size={13} className="text-muted-foreground" /> }
              ]}
            />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user name, email, phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/20 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <Card className="border border-border/40 shadow-xs bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No users found</h4>
              <p className="text-xs text-muted-foreground mt-1">There are no user accounts matching the filters.</p>
            </div>
          ) : (
            <DataTable
              data={filteredUsers}
              columns={columns}
              pagination={false}
              searchable={false}
              toolbar={null}
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
          <Modal.Header 
            title={modalMode === 'ADD' ? 'Create User Account' : 'Edit User Settings'} 
            description={modalMode === 'ADD' ? 'Register a new user account with specified system authorization role.' : 'Update user name, contacts, role, status or set a new password.'}
          />
          <form onSubmit={handleSubmit}>
            <Modal.Content className="space-y-6">
              {/* Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Account Info */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                    Profile Credentials
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      required
                      placeholder="e.g. Rahul Roy"
                      leftIcon={<User size={15} className="text-muted-foreground" />}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      leftIcon={<Mail size={15} className="text-muted-foreground" />}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="e.g. +8801700000000"
                      leftIcon={<Phone size={15} className="text-muted-foreground" />}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right Column: Roles & Passwords */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                    Access Level & Password
                  </h3>
                  <div className="space-y-4">
                    <Select
                      label="User Role"
                      value={form.role}
                      onValueChange={(val) => setForm({ ...form, role: val })}
                      options={[
                        { value: 'CUSTOMER', label: 'Customer' },
                        { value: 'RESTAURANT', label: 'Merchant (Owner)' },
                        { value: 'RIDER', label: 'Delivery Rider' },
                        { value: 'ADMIN', label: 'Administrator' }
                      ]}
                    />
                    
                    <Select
                      label="Account Status"
                      value={form.status}
                      onValueChange={(val) => setForm({ ...form, status: val })}
                      options={[
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'PENDING', label: 'PENDING' },
                        { value: 'SUSPENDED', label: 'SUSPENDED' }
                      ]}
                    />

                    <Input
                      label={modalMode === 'ADD' ? 'Security Password' : 'New Password (Optional)'}
                      type="password"
                      required={modalMode === 'ADD'}
                      placeholder={modalMode === 'ADD' ? 'At least 6 characters' : 'Leave blank to keep current'}
                      leftIcon={<Lock size={15} className="text-muted-foreground" />}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </Modal.Content>
            
            <Modal.Footer>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Info size={12} />
                  <span>Passwords are hashed automatically using cryptographically secure algorithms.</span>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="font-semibold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs shadow-xs"
                    loading={actionLoading === 'submit'}
                    disabled={actionLoading !== null}
                  >
                    {modalMode === 'ADD' ? 'Create User' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
          <Modal.Header 
            title="Delete User Account" 
            description="Are you sure you want to delete this user? This will completely wipe credentials, preventing login."
          />
          <Modal.Content>
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
              <Avatar 
                src="" 
                alt={userToDelete.name} 
                fallback={<User size={14} />} 
                size="md"
              />
              <div>
                <p className="font-extrabold text-sm text-foreground">{userToDelete.name || 'N/A'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{userToDelete.email}</p>
                <div className="mt-1">{getRoleBadge(userToDelete.role)}</div>
              </div>
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex gap-2.5 justify-end w-full">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                className="font-semibold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs border-transparent shadow-xs"
                loading={actionLoading === `delete-${userToDelete.id}`}
                disabled={actionLoading !== null}
                onClick={handleConfirmDelete}
              >
                Delete User
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
