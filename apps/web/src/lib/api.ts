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
} from '@/types';

// Правильно формируем API URL
const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  let baseUrl = apiUrl.trim();

  // Если это только имя сервиса (без точек), добавляем .onrender.com
  if (!baseUrl.includes('.') && !baseUrl.startsWith('http') && !baseUrl.includes('localhost')) {
    baseUrl = `${baseUrl}.onrender.com`;
  }

  // Если URL не начинается с http, добавляем https://
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  // Если URL не заканчивается на /api, добавляем
  if (!baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl}/api`;
  }

  return baseUrl;
};

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

export default api;
