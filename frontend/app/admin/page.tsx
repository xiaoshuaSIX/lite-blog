'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Articles Card */}
        <Link
          href="/admin/articles"
          className="block p-6 border rounded-lg hover:border-primary transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Articles</h2>
          <p className="text-muted-foreground">
            Manage blog articles, create new posts, and control visibility settings.
          </p>
        </Link>

        {/* Users Card */}
        <Link
          href="/admin/users"
          className="block p-6 border rounded-lg hover:border-primary transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <p className="text-muted-foreground">
            View users, manage memberships, and control account status.
          </p>
        </Link>

        {/* Quick Stats */}
        <div className="p-6 border rounded-lg bg-primary/5">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/admin/articles?action=new"
                className="text-primary hover:underline"
              >
                Create new article
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="text-primary hover:underline"
              >
                Manage users
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
