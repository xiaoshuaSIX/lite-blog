'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { adminApi, CreateArticleRequest } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';

export default function NewArticlePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateArticleRequest>({
    title: '',
    slug: '',
    content: '',
    visibility: 'member_full',
    preview_percentage: 30,
    preview_min_chars: 200,
    preview_smart_paragraph: true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminApi.createArticle(formData);
      toast.success('Article created successfully!');
      window.location.href = '/admin/articles';
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.error || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">New Article</h1>
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
            onChange={handleTitleChange}
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
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as CreateArticleRequest['visibility'] }))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="public_full">Public - Everyone can read full content</option>
              <option value="member_full">Members Only - Others see preview</option>
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
              onChange={(e) => setFormData(prev => ({ ...prev, preview_percentage: parseInt(e.target.value) }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, preview_smart_paragraph: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="preview_smart_paragraph" className="text-sm">
            Smart paragraph cutting (cut at natural paragraph breaks)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Article'}
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
