'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, type AdminArticleListResponse } from '@/lib/admin-api';
import { ArticleListItem, ApiError } from '@/lib/api';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response: AdminArticleListResponse = await adminApi.getArticles(page, 10);
      setArticles(response.articles);
      setTotalPages(response.total_pages);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const handlePublish = async (id: number) => {
    try {
      await adminApi.publishArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || 'Failed to publish article');
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await adminApi.unpublishArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || 'Failed to unpublish article');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }
    try {
      await adminApi.deleteArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || 'Failed to delete article');
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public_full':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">Public</span>;
      case 'member_full':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">Members</span>;
      case 'hidden':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">Hidden</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">Published</span>
    ) : (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs">Draft</span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Link
          href="/admin/articles/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          New Article
        </Link>
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
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No articles yet.</p>
          <Link href="/admin/articles/new" className="text-primary hover:underline mt-2 inline-block">
            Create your first article
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Visibility</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-muted-foreground">/posts/{article.slug}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(article.status)}</td>
                    <td className="px-4 py-3">{getVisibilityBadge(article.visibility)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="text-sm text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        {article.status === 0 ? (
                          <button
                            onClick={() => handlePublish(article.id)}
                            className="text-sm text-green-600 hover:underline"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublish(article.id)}
                            className="text-sm text-yellow-600 hover:underline"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-sm text-destructive hover:underline"
                        >
                          Delete
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
