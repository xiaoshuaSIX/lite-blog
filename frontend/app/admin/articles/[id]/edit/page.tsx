'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { adminApi, UpdateArticleRequest } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateArticleRequest>({
    title: '',
    slug: '',
    content: '',
    visibility: 'member_full',
    preview_percentage: 30,
    preview_min_chars: 200,
    preview_smart_paragraph: true,
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const article = await adminApi.getArticle(parseInt(id));
        setFormData({
          title: article.title,
          slug: article.slug,
          content: article.content,
          visibility: article.visibility || 'member_full',
          preview_percentage: article.preview_percentage || 30,
          preview_min_chars: article.preview_min_chars || 200,
          preview_smart_paragraph: article.preview_smart_paragraph ?? true,
        });
      } catch (err) {
        const apiError = err as ApiError;
        toast.error(apiError.error || 'Failed to fetch article');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminApi.updateArticle(parseInt(id), formData);
      toast.success('Article updated successfully!');
      window.location.href = '/admin/articles';
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.error || 'Failed to update article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Article</h1>
        <Link
          href="/admin/articles"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            required
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Article title"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">
            Slug
          </label>
          <input
            id="slug"
            type="text"
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, slug: e.target.value }))
            }
            required
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="article-slug"
          />
          <p className="text-xs text-muted-foreground">
            URL: /posts/{formData.slug || 'article-slug'}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            required
            rows={15}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="Write your article content here... (Markdown supported)"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="visibility" className="text-sm font-medium">
              Visibility
            </label>
            <select
              id="visibility"
              value={formData.visibility}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  visibility: e.target.value as UpdateArticleRequest['visibility'],
                }))
              }
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="public_full">
                Public - Everyone can read full content
              </option>
              <option value="member_full">
                Members Only - Others see preview
              </option>
              <option value="hidden">Hidden - Admin only</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="preview_percentage" className="text-sm font-medium">
              Preview Percentage
            </label>
            <input
              id="preview_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.preview_percentage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  preview_percentage: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Percentage of content to show in preview (0-100)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="preview_smart_paragraph"
            type="checkbox"
            checked={formData.preview_smart_paragraph}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                preview_smart_paragraph: e.target.checked,
              }))
            }
            className="rounded"
          />
          <label htmlFor="preview_smart_paragraph" className="text-sm">
            Smart paragraph cutting (cut at natural paragraph breaks)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin/articles"
            className="px-6 py-2 border rounded-md hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
