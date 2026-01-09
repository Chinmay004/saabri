'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import SuccessPopup from '@/components/admin/SuccessPopup';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'AGENT',
    phone: '',
  });
  const [formError, setFormError] = useState('');

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('admin_token');
      let url = '/api/admin/users';
      if (roleFilter !== 'all') {
        url += `?role=${roleFilter}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (userToEdit?: any) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        email: userToEdit.email || '',
        password: '',
        name: userToEdit.name || '',
        role: userToEdit.role || 'USER',
        phone: userToEdit.phone || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'AGENT',
        phone: '',
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'AGENT',
      phone: '',
    });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.email) {
      setFormError('Email is required');
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError('Password is required for new users');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const url = '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
      };

      if (editingUser) {
        body.id = editingUser.id;
        if (formData.password) {
          body.password = formData.password;
        }
      } else {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccessMessage(editingUser ? 'User updated successfully' : 'User created successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        handleCloseModal();
        fetchUsers();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      setFormError('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSuccessMessage('User deleted successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'AGENT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-manrope">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-manrope">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-12">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-manrope">User Management</h1>
              <p className="text-gray-600 font-manrope">
                Create and manage team members with different roles
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center bg-gray-900 hover:bg-black text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-105 font-manrope"
            >
              + Add New User
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label htmlFor="role-filter" className="text-sm font-medium text-gray-700 font-manrope">Filter by Role:</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-manrope"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="AGENT">Agent</option>
            </select>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-3 py-2 bg-transparent hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-medium rounded text-sm transition-colors flex items-center gap-1 border border-gray-300 font-manrope"
            >
              🔄 {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-manrope">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-4 py-3 font-manrope">Name</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-4 py-3 font-manrope">Email</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-4 py-3 font-manrope">Phone</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-4 py-3 font-manrope">Role</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-4 py-3 font-manrope">Created</th>
                      <th className="text-right text-xs sm:text-sm font-semibold text-gray-900 px-4 py-3 font-manrope">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-medium text-sm font-manrope">
                          {userItem.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm font-manrope">{userItem.email}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm font-manrope">{userItem.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded border font-medium ${getRoleBadgeColor(userItem.role)} font-manrope`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm font-manrope">
                          {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(userItem)}
                              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors font-manrope"
                            >
                              Edit
                            </button>
                            {userItem.id !== user?.id && (
                              <button
                                onClick={() => handleDelete(userItem.id)}
                                disabled={actionLoading}
                                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50 font-manrope"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-manrope" onClick={handleCloseModal}>
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 font-manrope">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                  className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-manrope">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 font-manrope">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={actionLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 font-manrope"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 font-manrope">
                    Password {!editingUser && <span className="text-red-600">*</span>}
                    {editingUser && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 font-manrope"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 font-manrope">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 font-manrope"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 font-manrope">Role <span className="text-red-600">*</span></label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    disabled={actionLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 font-manrope"
                  >
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 font-manrope">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 font-manrope"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 font-manrope"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-manrope"
                  >
                    {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              <p className="text-gray-700 font-medium font-manrope">Processing...</p>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccess && <SuccessPopup message={successMessage} />}
      </div>
    </>
  );
}

