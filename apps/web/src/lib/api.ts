import axios from 'axios';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  User,
  Article,
  Category,
  Tag,
  CreateBilingualArticleDto,
  UpdateBilingualArticleDto,
  CreateBilingualCategoryDto,
  CreateBilingualTagDto,
  MagazineIssue,
  CreateMagazineIssueDto,
  UpdateMagazineIssueDto,
} from '@/types';
import { getApiUrl } from './api-url';

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      // Try to get current lang from pathname, default to 'kz'
      const currentPath = window.location.pathname;
      const langMatch = currentPath.match(/^\/(kz|ru)\//);
      const lang = langMatch ? langMatch[1] : 'kz';
      window.location.href = `/${lang}/login`;
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
};

// Articles API
export const articlesApi = {
  getAll: (published?: boolean) =>
    api.get<Article[]>('/articles', {
      params: published !== undefined ? { published } : {},
    }),
  getById: (id: string) => api.get<Article>(`/articles/${id}`),
  getBySlug: (slug: string) => api.get<Article>(`/articles/slug/${slug}`),
  create: (data: CreateBilingualArticleDto) => api.post<Article>('/articles', data),
  update: (id: string, data: UpdateBilingualArticleDto) =>
    api.patch<Article>(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (data: CreateBilingualCategoryDto) =>
    api.post<Category>('/categories', data),
  update: (id: string, data: Partial<CreateBilingualCategoryDto>) =>
    api.patch<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Tags API
export const tagsApi = {
  getAll: () => api.get<Tag[]>('/tags'),
  getById: (id: string) => api.get<Tag>(`/tags/${id}`),
  create: (data: CreateBilingualTagDto) => api.post<Tag>('/tags', data),
  update: (id: string, data: Partial<CreateBilingualTagDto>) =>
    api.patch<Tag>(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

// Users API
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  update: (id: string, data: { firstName?: string; lastName?: string }) =>
    api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Media API
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{
      id: string;
      url: string;
      filename: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
      createdAt: string;
    }>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Magazine Issues API
export const magazineIssuesApi = {
  getAll: (published?: boolean) =>
    api.get<MagazineIssue[]>('/magazine-issues', {
      params: published !== undefined ? { published } : {},
    }),
  getById: (id: string) => api.get<MagazineIssue>(`/magazine-issues/${id}`),
  create: (data: CreateMagazineIssueDto, pdfFile: File) => {
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('issueNumber', data.issueNumber.toString());
    formData.append('publishDate', data.publishDate);
    formData.append('titleKz', data.titleKz);
    formData.append('titleRu', data.titleRu);
    if (data.pagesCount) formData.append('pagesCount', data.pagesCount.toString());
    if (data.coverImageUrl) formData.append('coverImageUrl', data.coverImageUrl);
    if (data.isPublished !== undefined) formData.append('isPublished', data.isPublished.toString());
    if (data.isPinned !== undefined) formData.append('isPinned', data.isPinned.toString());

    return api.post<MagazineIssue>('/magazine-issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id: string, data: UpdateMagazineIssueDto) =>
    api.patch<MagazineIssue>(`/magazine-issues/${id}`, data),
  delete: (id: string) => api.delete(`/magazine-issues/${id}`),
  incrementViews: (id: string) =>
    api.post(`/magazine-issues/${id}/view`),
  incrementDownloads: (id: string) =>
    api.post(`/magazine-issues/${id}/download`),
};

export default api;
