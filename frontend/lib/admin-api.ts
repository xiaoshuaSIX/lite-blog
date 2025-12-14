const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

import type { Article, ArticleListItem, ApiError } from './api';

export interface CreateArticleRequest {
  title: string;
  slug: string;
  content: string;
  visibility: 'hidden' | 'public_full' | 'member_full';
  preview_percentage: number;
  preview_min_chars: number;
  preview_smart_paragraph: boolean;
}

export interface UpdateArticleRequest extends CreateArticleRequest {}

export interface AdminArticleListResponse {
  articles: ArticleListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'An error occurred',
        code: 'UNKNOWN_ERROR',
      }));
      throw error;
    }

    return response.json();
  }

  // Article management
  async getArticles(page: number = 1, pageSize: number = 10): Promise<AdminArticleListResponse> {
    return this.request(`/api/admin/articles?page=${page}&page_size=${pageSize}`);
  }

  async getArticle(id: number): Promise<Article> {
    return this.request(`/api/admin/articles/${id}`);
  }

  async createArticle(data: CreateArticleRequest): Promise<Article> {
    return this.request('/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArticle(id: number, data: UpdateArticleRequest): Promise<Article> {
    return this.request(`/api/admin/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArticle(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/articles/${id}`, {
      method: 'DELETE',
    });
  }

  async publishArticle(id: number): Promise<Article> {
    return this.request(`/api/admin/articles/${id}/publish`, {
      method: 'POST',
    });
  }

  async unpublishArticle(id: number): Promise<Article> {
    return this.request(`/api/admin/articles/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // Comment management
  async deleteComment(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Site settings
  async getSiteSettings(): Promise<SiteSettings> {
    return this.request('/api/admin/settings');
  }

  async updateSiteSettings(data: SiteSettings): Promise<SiteSettings> {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  site_keywords: string;
  home_title: string;
  home_subtitle: string;
  footer_text: string;
  logo_url: string;
}

export const adminApi = new AdminApiClient();
export default adminApi;
