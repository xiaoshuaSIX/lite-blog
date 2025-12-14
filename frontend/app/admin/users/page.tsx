'use client';

import { useState, useEffect } from 'react';
import { adminApi, type UserListItem, type UserListResponse, type RoleInfo } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useLanguage } from '@/providers/language-provider';

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [membershipDate, setMembershipDate] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response: UserListResponse = await adminApi.getUsers(page, 10);
      setUsers(response.users);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await adminApi.getRoles();
      setRoles(response.roles);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page]);

  const handleToggleStatus = async (user: UserListItem) => {
    const newStatus = user.status === 0 ? 1 : 0;
    const action = newStatus === 1 ? t('admin.usersPage.actions.disableConfirm') : t('admin.usersPage.actions.enableConfirm');

    if (!confirm(action)) {
      return;
    }

    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      fetchUsers();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handleDelete = async (user: UserListItem) => {
    if (!confirm(t('admin.usersPage.actions.deleteConfirm'))) {
      return;
    }

    try {
      await adminApi.deleteUser(user.id);
      fetchUsers();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const openRoleModal = (user: UserListItem) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const openMembershipModal = (user: UserListItem) => {
    setSelectedUser(user);
    setMembershipDate(user.member_expire_at ? user.member_expire_at.split('T')[0] : '');
    setShowMembershipModal(true);
  };

  const handleAssignRole = async (roleCode: string) => {
    if (!selectedUser) return;

    try {
      await adminApi.assignRole(selectedUser.id, roleCode);
      fetchUsers();
      setShowRoleModal(false);
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handleRemoveRole = async (roleCode: string) => {
    if (!selectedUser) return;

    try {
      await adminApi.removeRole(selectedUser.id, roleCode);
      fetchUsers();
      setShowRoleModal(false);
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handleUpdateMembership = async () => {
    if (!selectedUser) return;

    try {
      const expireAt = membershipDate ? new Date(membershipDate).toISOString() : null;
      await adminApi.updateUserMembership(selectedUser.id, expireAt);
      fetchUsers();
      setShowMembershipModal(false);
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const getStatusBadge = (status: number) => {
    return status === 0 ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">
        {t('admin.usersPage.status.active')}
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs">
        {t('admin.usersPage.status.disabled')}
      </span>
    );
  };

  const getEmailBadge = (verified: boolean) => {
    return verified ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">
        {t('admin.usersPage.email.verified')}
      </span>
    ) : (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs">
        {t('admin.usersPage.email.unverified')}
      </span>
    );
  };

  const getMemberBadge = (user: UserListItem) => {
    if (!user.is_member) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">
          {t('admin.usersPage.membership.none')}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">
        {t('admin.usersPage.membership.active')}
      </span>
    );
  };

  const getRoleBadges = (userRoles: string[]) => {
    return userRoles.map((role) => (
      <span
        key={role}
        className={`px-2 py-1 rounded text-xs mr-1 ${
          role === 'admin'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : role === 'member'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }`}
      >
        {role}
      </span>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.usersPage.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.usersPage.totalUsers')}: {total}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('admin.usersPage.noUsers')}</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.usersPage.table.email')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.usersPage.table.status')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.usersPage.table.emailVerified')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.usersPage.table.membership')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.usersPage.table.roles')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.usersPage.table.created')}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t('admin.usersPage.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                    <td className="px-4 py-3">{getEmailBadge(user.email_verified)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {getMemberBadge(user)}
                        {user.member_expire_at && (
                          <span className="text-xs text-muted-foreground">
                            {t('admin.usersPage.membership.expires')}: {new Date(user.member_expire_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadges(user.roles)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openRoleModal(user)}
                          className="text-sm text-primary hover:underline"
                        >
                          {t('admin.usersPage.actions.roles')}
                        </button>
                        <button
                          onClick={() => openMembershipModal(user)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {t('admin.usersPage.actions.membership')}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`text-sm hover:underline ${
                            user.status === 0 ? 'text-yellow-600' : 'text-green-600'
                          }`}
                        >
                          {user.status === 0
                            ? t('admin.usersPage.actions.disable')
                            : t('admin.usersPage.actions.enable')}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-sm text-destructive hover:underline"
                        >
                          {t('admin.usersPage.actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {t('admin.usersPage.pagination.previous')}
              </button>
              <span className="px-3 py-1">
                {t('admin.usersPage.pagination.page')} {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {t('admin.usersPage.pagination.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('admin.usersPage.roleModal.title')}</h2>
            <p className="text-muted-foreground mb-4">{selectedUser.email}</p>

            <div className="mb-4">
              <h3 className="font-medium mb-2">{t('admin.usersPage.roleModal.currentRoles')}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedUser.roles.length === 0 ? (
                  <span className="text-muted-foreground text-sm">{t('admin.usersPage.roleModal.noRoles')}</span>
                ) : (
                  selectedUser.roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-muted rounded-full text-sm flex items-center gap-2"
                    >
                      {role}
                      <button
                        onClick={() => handleRemoveRole(role)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('admin.usersPage.roleModal.addRole')}</h3>
              <div className="flex flex-wrap gap-2">
                {roles
                  .filter((r) => !selectedUser.roles.includes(r.code))
                  .map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleAssignRole(role.code)}
                      className="px-3 py-1 border rounded-full text-sm hover:bg-muted"
                    >
                      + {role.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border rounded hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      {showMembershipModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('admin.usersPage.membershipModal.title')}</h2>
            <p className="text-muted-foreground mb-4">{selectedUser.email}</p>

            <div className="mb-6">
              <label className="block font-medium mb-2">
                {t('admin.usersPage.membershipModal.expireDate')}
              </label>
              <input
                type="date"
                value={membershipDate}
                onChange={(e) => setMembershipDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {t('admin.usersPage.membershipModal.hint')}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMembershipModal(false)}
                className="px-4 py-2 border rounded hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateMembership}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
