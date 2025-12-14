// Use public API URL in the browser; on the server fall back to an internal URL so SSR calls hit the Go API
// instead of the Next.js server itself (which would 404 for /api/*).
const resolveBaseUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl) return publicUrl;

  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || 'http://localhost:8080';
  }

  return '';
};

export const API_BASE_URL = resolveBaseUrl();

export interface User {
  id: number;
  email: string;
  email_verified: boolean;
  is_member: boolean;
  roles: string[];
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  author_id: number;
  author_email?: string;
  visibility: 'hidden' | 'public_full' | 'member_full';
  preview_percentage: number;
  preview_min_chars: number;
  preview_smart_paragraph: boolean;
  status: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_preview: boolean;
}

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author_id: number;
  author_email?: string;
  visibility: 'hidden' | 'public_full' | 'member_full';
  status: number;
  published_at?: string;
  created_at: string;
}

export interface ArticleListResponse {
  articles: ArticleListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  user_email: string;
  parent_id?: number;
  content: string;
  is_deleted: boolean;
  created_at: string;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  code: string;
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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Use relative path by default; allow absolute override via env/constructor.
    const base = this.baseUrl ? this.baseUrl.replace(/\/$/, '') : '';
    const url = `${base}${endpoint}`;

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

  // Auth endpoints
  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getMe(): Promise<User> {
    return this.request('/api/auth/me');
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(): Promise<{ message: string }> {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
    });
  }

  // Article endpoints
  async getArticles(page: number = 1, pageSize: number = 10): Promise<ArticleListResponse> {
    return this.request(`/api/articles?page=${page}&page_size=${pageSize}`);
  }

  async getArticleBySlug(slug: string): Promise<Article> {
    return this.request(`/api/articles/${slug}`);
  }

  // Comment endpoints
  async getComments(articleId: number, page: number = 1, pageSize: number = 20): Promise<CommentListResponse> {
    return this.request(`/api/articles/${articleId}/comments?page=${page}&page_size=${pageSize}`);
  }

  async createComment(articleId: number, content: string, parentId?: number): Promise<Comment> {
    return this.request(`/api/comments/article/${articleId}`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  }

  // Site settings
  async getSiteSettings(): Promise<SiteSettings> {
    return this.request('/api/settings');
  }
}

export const api = new ApiClient();
export default api;
