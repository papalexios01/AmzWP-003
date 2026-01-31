import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { ApiClient } from '../lib/api-client';
import { ICacheService } from './cache-service';
import { ILoggerService } from './logger-service';

const API_CLIENT = new ApiClient({
  retries: 3,
  backoffMs: 1000,
  timeoutMs: 15000,
});

export interface IWpService {
  testConnection(wpUrl: string, username: string, appPassword: string): Promise<ConnectionTestResult>;
  fetchPosts(wpUrl: string, username: string, appPassword: string, page?: number): Promise<WordPressPost[]>;
  fetchPostById(wpUrl: string, postId: number, username: string, appPassword: string): Promise<WordPressPostContent>;
  updatePost(wpUrl: string, postId: number, content: string, username: string, appPassword: string): Promise<{ link: string }>;
  fetchPostBySlug(wpUrl: string, slug: string, username: string, appPassword: string): Promise<WordPressPostContent | null>;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  userInfo?: { id: number; name: string; roles: string[] };
  siteInfo?: { name: string; url: string; version: string };
}

export interface WordPressPost {
  id: number;
  title: { rendered: string };
  link: string;
  type: string;
  modified: string;
  content?: { rendered: string; raw?: string };
}

export interface WordPressPostContent {
  id: number;
  title: { rendered: string; raw?: string };
  content: { rendered: string; raw?: string };
  link: string;
}

@injectable()
export class WpService implements IWpService {
  constructor(
    @inject(TYPES.CacheService) private cache: ICacheService,
    @inject(TYPES.LoggerService) private logger: ILoggerService
  ) {}

  async testConnection(wpUrl: string, username: string, appPassword: string): Promise<ConnectionTestResult> {
    if (!wpUrl || !username || !appPassword) {
      return { success: false, message: 'Missing credentials' };
    }

    const apiBase = wpUrl.replace(/\/$/, '');
    const url = `${apiBase}/users/me`;
    const auth = btoa(`${username}:${appPassword}`);

    try {
      const response = await API_CLIENT.getJson<WordPressUser>(url, {
        headers: { Authorization: `Basic ${auth}` },
      });

      return {
        success: true,
        message: `Connected as ${response.name}`,
        userInfo: {
          id: response.id,
          name: response.name,
          roles: response.roles || [],
        },
      };
    } catch (error: any) {
      this.logger.error('WordPress connection test failed', { error: error.message });
      
      if (error.status === 401) {
        return { success: false, message: 'Invalid credentials' };
      }
      if (error.status === 404) {
        return { success: false, message: 'WordPress REST API not found' };
      }
      return { success: false, message: error.message || 'Connection failed' };
    }
  }

  async fetchPosts(
    wpUrl: string,
    username: string,
    appPassword: string,
    page = 1
  ): Promise<WordPressPost[]> {
    const cacheKey = `wp:posts:${this.hashUrl(wpUrl)}:${page}`;
    const cached = await this.cache.get<WordPressPost[]>(cacheKey);
    
    if (cached) {
      this.logger.debug('WP posts cache hit', { page });
      return cached;
    }

    const apiBase = wpUrl.replace(/\/$/, '');
    const url = `${apiBase}/posts?page=${page}&per_page=100&_embed`;
    const auth = btoa(`${username}:${appPassword}`);

    this.logger.info('Fetching WordPress posts', { page });

    const posts = await API_CLIENT.getJson<WordPressPost[]>(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    await this.cache.set(cacheKey, posts, 5 * 60 * 1000); // 5 min cache
    return posts;
  }

  async fetchPostById(
    wpUrl: string,
    postId: number,
    username: string,
    appPassword: string
  ): Promise<WordPressPostContent> {
    const cacheKey = `wp:post:${postId}`;
    const cached = await this.cache.get<WordPressPostContent>(cacheKey);
    
    if (cached) {
      this.logger.debug('WP post cache hit', { postId });
      return cached;
    }

    const apiBase = wpUrl.replace(/\/$/, '');
    const url = `${apiBase}/posts/${postId}`;
    const auth = btoa(`${username}:${appPassword}`);

    this.logger.info('Fetching WordPress post', { postId });

    const post = await API_CLIENT.getJson<WordPressPostContent>(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    await this.cache.set(cacheKey, post, 5 * 60 * 1000);
    return post;
  }

  async fetchPostBySlug(
    wpUrl: string,
    slug: string,
    username: string,
    appPassword: string
  ): Promise<WordPressPostContent | null> {
    const apiBase = wpUrl.replace(/\/$/, '');
    const url = `${apiBase}/posts?slug=${encodeURIComponent(slug)}`;
    const auth = btoa(`${username}:${appPassword}`);

    this.logger.info('Fetching WordPress post by slug', { slug });

    const posts = await API_CLIENT.getJson<WordPressPostContent[]>(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    return posts.length > 0 ? posts[0] : null;
  }

  async updatePost(
    wpUrl: string,
    postId: number,
    content: string,
    username: string,
    appPassword: string
  ): Promise<{ link: string }> {
    const apiBase = wpUrl.replace(/\/$/, '');
    const url = `${apiBase}/posts/${postId}`;
    const auth = btoa(`${username}:${appPassword}`);

    this.logger.info('Updating WordPress post', { postId });

    const result = await API_CLIENT.postJson<WordPressPostContent>(
      url,
      { content, status: 'publish' },
      { headers: { Authorization: `Basic ${auth}` } }
    );

    // Invalidate cache
    await this.cache.delete(`wp:post:${postId}`);
    
    return { link: result.link || `${wpUrl}?p=${postId}` };
  }

  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

interface WordPressUser {
  id: number;
  name: string;
  slug: string;
  roles: string[];
}
