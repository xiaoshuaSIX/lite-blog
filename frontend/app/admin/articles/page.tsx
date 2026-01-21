'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pin, Search, X } from 'lucide-react';
import { adminApi, type AdminArticleListResponse } from '@/lib/admin-api';
import { ArticleListItem, ApiError } from '@/lib/api';
import { useLanguage } from '@/providers/language-provider';

export default function AdminArticlesPage() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [pinnedFilter, setPinnedFilter] = useState<string>('all');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const filters: {
        search?: string;
        status?: number;
        visibility?: string;
        is_pinned?: boolean;
      } = {};

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      if (statusFilter !== 'all') {
        filters.status = parseInt(statusFilter);
      }
      if (visibilityFilter !== 'all') {
        filters.visibility = visibilityFilter;
      }
      if (pinnedFilter !== 'all') {
        filters.is_pinned = pinnedFilter === 'true';
      }

      const response: AdminArticleListResponse = await adminApi.getArticles(page, 10, filters);
      setArticles(response.articles);
      setTotalPages(response.total_pages);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, statusFilter, visibilityFilter, pinnedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVisibilityFilter('all');
    setPinnedFilter('all');
    setPage(1);
  };

  const handlePublish = async (id: number) => {
    try {
      await adminApi.publishArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await adminApi.unpublishArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.articlesPage.actions.deleteConfirm'))) {
      return;
    }
    try {
      await adminApi.deleteArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handlePin = async (id: number) => {
    try {
      await adminApi.pinArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const handleUnpin = async (id: number) => {
    try {
      await adminApi.unpinArticle(id);
      fetchArticles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.error || t('common.error'));
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public_full':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">{t('admin.articlesPage.visibility.public')}</span>;
      case 'member_full':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">{t('admin.articlesPage.visibility.members')}</span>;
      case 'hidden':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded text-xs">{t('admin.articlesPage.visibility.hidden')}</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">{t('admin.articlesPage.status.published')}</span>
    ) : (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs">{t('admin.articlesPage.status.draft')}</span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('admin.articlesPage.title')}</h1>
        <Link
          href="/admin/articles/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          {t('admin.articlesPage.newArticle')}
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border pb-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-64 group">
          <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin.articlesPage.filters.searchPlaceholder')}
            className="w-full pl-6 pr-4 py-2 bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-sm focus:ring-0"
          />
        </form>

        {/* Filter Group */}
        <div className="flex flex-wrap items-center gap-2 md:gap-6 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:inline-block">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-sm font-medium text-foreground hover:bg-muted/50 rounded px-2 py-1 cursor-pointer focus:ring-0"
            >
              <option value="all">All</option>
              <option value="0">Draft</option>
              <option value="1">Published</option>
            </select>
          </div>

          {/* Visibility Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:inline-block">View</span>
            <select
              value={visibilityFilter}
              onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-sm font-medium text-foreground hover:bg-muted/50 rounded px-2 py-1 cursor-pointer focus:ring-0"
            >
              <option value="all">All</option>
              <option value="public_full">Public</option>
              <option value="member_full">Member</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {/* Pinned Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:inline-block">Pin</span>
            <select
              value={pinnedFilter}
              onChange={(e) => { setPinnedFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-sm font-medium text-foreground hover:bg-muted/50 rounded px-2 py-1 cursor-pointer focus:ring-0"
            >
              <option value="all">All</option>
              <option value="true">Pinned</option>
              <option value="false">Normal</option>
            </select>
          </div>

          {/* Clear Button */}
          {(searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all' || pinnedFilter !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="ml-auto md:ml-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title={t('admin.articlesPage.filters.clearFilters')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('admin.articlesPage.noArticles')}</p>
          <Link href="/admin/articles/new" className="text-primary hover:underline mt-2 inline-block">
            {t('admin.articlesPage.createFirst')}
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium w-[35%]">{t('admin.articlesPage.table.title')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-[10%]">{t('admin.articlesPage.table.status')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-[10%]">{t('admin.articlesPage.table.visibility')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-[10%]">{t('admin.articlesPage.table.pinned')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-[10%]">{t('admin.articlesPage.table.created')}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium w-[25%]">{t('admin.articlesPage.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 mt-0.5 shrink-0">
                          {article.is_pinned && (
                            <Pin className="w-4 h-4 text-primary fill-primary/20" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium break-words">{article.title}</div>
                          <div className="text-sm text-muted-foreground truncate">/posts/{article.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">{getStatusBadge(article.status)}</td>
                    <td className="px-4 py-3 align-top">{getVisibilityBadge(article.visibility)}</td>
                    <td className="px-4 py-3 align-top">
                      {article.is_pinned ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs whitespace-nowrap">{t('admin.articlesPage.pinned.yes')}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs whitespace-nowrap">{t('admin.articlesPage.pinned.no')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground align-top whitespace-nowrap">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="text-sm text-primary hover:underline whitespace-nowrap"
                        >
                          {t('admin.articlesPage.actions.edit')}
                        </Link>
                        {article.status === 0 ? (
                          <button
                            onClick={() => handlePublish(article.id)}
                            className="text-sm text-green-600 hover:underline whitespace-nowrap"
                          >
                            {t('admin.articlesPage.actions.publish')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublish(article.id)}
                            className="text-sm text-yellow-600 hover:underline whitespace-nowrap"
                          >
                            {t('admin.articlesPage.actions.unpublish')}
                          </button>
                        )}
                        {article.is_pinned ? (
                          <button
                            onClick={() => handleUnpin(article.id)}
                            className="text-sm text-orange-600 hover:underline whitespace-nowrap"
                          >
                            {t('admin.articlesPage.actions.unpin')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePin(article.id)}
                            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                          >
                            {t('admin.articlesPage.actions.pin')}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-sm text-destructive hover:underline whitespace-nowrap"
                        >
                          {t('admin.articlesPage.actions.delete')}
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
