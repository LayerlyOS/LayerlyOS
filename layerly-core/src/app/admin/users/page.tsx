'use client';

import { Lock, Mail, Search, User, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  role: string;
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    printEntries: number;
    printers: number;
    customers: number;
    deletedPrints?: number;
  };
};

import { Checkbox } from '@/components/ui/Checkbox';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

export default function AdminUsersPage() {
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Create state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false,
    role: 'USER',
  });
  const [creating, setCreating] = useState(false);

  // Form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    isAdmin: false,
    role: 'USER',
    subscriptionTier: 'HOBBY',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const editNameId = useId();
  const editEmailId = useId();
  const editAdminId = useId();
  const editTierId = useId();
  const createNameId = useId();
  const createEmailId = useId();
  const createPasswordId = useId();
  const createAdminId = useId();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setUsers(data);
    } catch (_e) {
      console.error('Failed to fetch user list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const startEditing = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email,
      isAdmin: user.isAdmin,
      role: 'USER',
      subscriptionTier: user.subscriptionTier || 'HOBBY',
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }

      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u)));
      setEditingUser(null);
      success('User updated successfully');
    } catch (e: unknown) {
      showError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }

      await fetchUsers();
      setIsCreatingUser(false);
      setCreateForm({ name: '', email: '', password: '', isAdmin: false, role: 'USER' });
      success('User created successfully');
    } catch (e: unknown) {
      showError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (editingUser?.id === userToDelete.id) setEditingUser(null);
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
      success('User deleted successfully');
    } catch (e: unknown) {
      showError((e as Error).message);
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600">Manage user access and roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchUsers}
            isLoading={loading}
            loadingText="Refreshing..."
            variant="outline"
            leftIcon={<i className="fa-solid fa-sync"></i>}
            className="font-medium shadow-sm"
          >
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreatingUser(true)}
            variant="primary"
            leftIcon={<i className="fa-solid fa-plus"></i>}
            className="font-medium shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add user
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="w-full sm:w-96">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500"
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">Total: {filteredUsers.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-slate-200">User</th>
                <th className="px-6 py-3 border-b border-slate-200">Role</th>
                <th className="px-6 py-3 border-b border-slate-200">Plan</th>
                <th className="px-6 py-3 border-b border-slate-200 text-center">Statystyki</th>
                <th className="px-6 py-3 border-b border-slate-200">Created at</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-blue-500"></i>
                    <p>Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No search results.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 overflow-hidden relative">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            (user.name?.[0] || user.email[0]).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                          <div className="text-slate-400 text-[10px] font-mono mt-0.5">
                            {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-current ${
                          user.isAdmin
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-current ${
                          user.subscriptionTier === 'FARM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : user.subscriptionTier === 'MAKER'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {user.subscriptionTier || 'HOBBY'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-start gap-3 text-xs">
                        <div
                          className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700 shadow-sm"
                          title="Print count"
                        >
                          <i className="fa-solid fa-print text-lg mb-0.5"></i>
                          <span className="font-bold text-sm">{user._count.printEntries}</span>
                        </div>
                        <div
                          className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl bg-purple-50/50 border border-purple-100 text-purple-700 shadow-sm"
                          title="Number of printers"
                        >
                          <i className="fa-solid fa-cube text-lg mb-0.5"></i>
                          <span className="font-bold text-sm">{user._count.printers}</span>
                        </div>
                        <div
                          className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl bg-amber-50/50 border border-amber-100 text-amber-700 shadow-sm"
                          title="Client count"
                        >
                          <i className="fa-solid fa-users text-lg mb-0.5"></i>
                          <span className="font-bold text-sm">{user._count.customers || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => setSelectedUser(user)}
                          variant="ghost"
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 h-auto w-auto"
                          title="View details"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Button>
                        <Button
                          onClick={() => startEditing(user)}
                          variant="ghost"
                          className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 p-2 h-auto w-auto"
                          title="Edit user"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm w-full h-full cursor-default"
          onClick={() => setSelectedUser(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedUser(null);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <article
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden cursor-default text-left"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl overflow-hidden border border-slate-200 relative">
                  {selectedUser.image ? (
                    <Image
                      src={selectedUser.image}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <i className="fa-solid fa-user"></i>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedUser.name || 'No name'}
                  </h2>
                  <p className="text-slate-500">{selectedUser.email}</p>
                  <div className="mt-2 flex gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        selectedUser.isAdmin
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {selectedUser.isAdmin ? 'ADMINISTRATOR' : 'USER'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
                      ID: {selectedUser.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setSelectedUser(null)}
                variant="ghost"
                className="text-slate-400 hover:text-slate-600 p-1 h-auto"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </Button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <div className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Prints (Active)
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {selectedUser._count.printEntries}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <div className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Prints (Deleted)
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {selectedUser._count.deletedPrints || 0}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Printers</div>
                <div className="text-2xl font-bold text-slate-800">
                  {selectedUser._count.printers}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <div className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Customers
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {selectedUser._count.customers || 0}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <div>
                <span className="font-bold">Created:</span>{' '}
                {new Date(selectedUser.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-bold">Last edited:</span>{' '}
                {new Date(selectedUser.updatedAt).toLocaleString()}
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Edit user</h3>
              <Button
                onClick={() => setEditingUser(null)}
                variant="ghost"
                className="text-slate-400 hover:text-slate-600 p-1 h-auto"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </Button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor={editNameId}
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Name
                  </label>
                  <Input
                    id={editNameId}
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label
                    htmlFor={editEmailId}
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email
                  </label>
                  <Input
                    id={editEmailId}
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    required
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div className="space-y-2 relative z-20">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={editAdminId}
                      checked={editForm.isAdmin}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({ ...prev, isAdmin: !!checked }))
                      }
                    />
                    <label
                      htmlFor={editAdminId}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                    >
                      Admin (Full access)
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 ml-6">
                    User will have full permissions to manage the system.
                  </p>
                </div>

                <div className="space-y-2 relative z-10">
                  <label htmlFor={editTierId} className="text-sm font-medium text-slate-700">
                    Subscription plan
                  </label>
                  <CustomSelect
                    id={editTierId}
                    value={editForm.subscriptionTier}
                    onChange={(val) => setEditForm((prev) => ({ ...prev, subscriptionTier: val }))}
                    options={[
                      {
                        value: 'HOBBY',
                        label: (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>Starter
                            (Hobby)
                          </span>
                        ),
                      },
                      {
                        value: 'MAKER',
                        label: (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Pro Maker
                          </span>
                        ),
                        className: 'hover:bg-emerald-50 hover:text-emerald-900',
                      },
                      {
                        value: 'FARM',
                        label: (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>Print Farm
                          </span>
                        ),
                        className: 'hover:bg-amber-50 hover:text-amber-900',
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center rounded-b-xl">
                <Button
                  type="button"
                  onClick={() => handleDeleteUser(editingUser)}
                  variant="outline"
                  className="!border-red-500 !text-red-600 hover:!bg-red-50 hover:!border-red-600 font-medium"
                >
                  Delete account
                </Button>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => setEditingUser(null)} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={saving}
                    loadingText="Saving..."
                    variant="primary"
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Add new user</h3>
              <IconButton
                onClick={() => setIsCreatingUser(false)}
                variant="ghost"
                icon={X}
                size="md"
                className="rounded-full text-slate-400 hover:text-slate-600"
              />
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor={createNameId}
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Name
                  </label>
                  <Input
                    id={createNameId}
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    required
                    leftIcon={<User className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label
                    htmlFor={createEmailId}
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email
                  </label>
                  <Input
                    id={createEmailId}
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    required
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label
                    htmlFor={createPasswordId}
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <Input
                    id={createPasswordId}
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={createAdminId}
                    checked={createForm.isAdmin}
                    onCheckedChange={(checked) =>
                      setCreateForm((prev) => ({ ...prev, isAdmin: !!checked }))
                    }
                  />
                  <label
                    htmlFor={createAdminId}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                  >
                    Admin
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" onClick={() => setIsCreatingUser(false)} variant="outline">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={creating}
                  loadingText="Tworzenie..."
                  variant="primary"
                >
                  Create user
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => !deleting && setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete user"
        message={`Are you sure you want to delete user ${userToDelete?.name || userToDelete?.email}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
