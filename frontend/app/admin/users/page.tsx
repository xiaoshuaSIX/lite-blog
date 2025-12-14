'use client';

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p className="mb-4">User management will be implemented in the next phase.</p>
        <p className="text-sm">
          This page will allow admins to:
        </p>
        <ul className="text-sm mt-2 space-y-1">
          <li>View all registered users</li>
          <li>See email verification status</li>
          <li>Manage membership (extend/revoke)</li>
          <li>Freeze/unfreeze user accounts</li>
        </ul>
      </div>
    </div>
  );
}
