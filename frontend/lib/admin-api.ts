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

  // User management
  async getUsers(page: number = 1, pageSize: number = 10): Promise<UserListResponse> {
    return this.request(`/api/admin/users?page=${page}&page_size=${pageSize}`);
  }

  async getUser(id: number): Promise<UserDetail> {
    return this.request(`/api/admin/users/${id}`);
  }

  async updateUserStatus(id: number, status: number): Promise<{ message: string }> {
    return this.request(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateUserMembership(id: number, expireAt: string | null): Promise<{ message: string }> {
    return this.request(`/api/admin/users/${id}/membership`, {
      method: 'PUT',
      body: JSON.stringify({ expire_at: expireAt }),
    });
  }

  async assignRole(userId: number, roleCode: string): Promise<{ message: string }> {
    return this.request(`/api/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_code: roleCode }),
    });
  }

  async removeRole(userId: number, roleCode: string): Promise<{ message: string }> {
    return this.request(`/api/admin/users/${userId}/roles`, {
      method: 'DELETE',
      body: JSON.stringify({ role_code: roleCode }),
    });
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getRoles(): Promise<RolesResponse> {
    return this.request('/api/admin/roles');
  }
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  site_keywords: string;
  home_title: string;
  home_subtitle: string;
  home_custom_content: string;
  footer_text: string;
  logo_url: string;
}

// User management types
export interface UserListItem {
  id: number;
  email: string;
  email_verified: boolean;
  status: number;
  is_member: boolean;
  member_expire_at?: string;
  roles: string[];
  created_at: string;
}

export interface UserDetail {
  id: number;
  email: string;
  email_verified: boolean;
  status: number;
  is_member: boolean;
  member_expire_at?: string;
  roles: RoleInfo[];
  created_at: string;
  updated_at: string;
}

export interface RoleInfo {
  id: number;
  code: string;
  name: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RolesResponse {
  roles: RoleInfo[];
}

export const adminApi = new AdminApiClient();
export default adminApi;
