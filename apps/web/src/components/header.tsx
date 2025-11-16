'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { SearchBar } from './search-bar';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Aimak Akshamy
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-gray-600">
              Главная
            </Link>
            <Link href="/articles" className="hover:text-gray-600">
              Статьи
            </Link>
            <Link href="/categories" className="hover:text-gray-600">
              Категории
            </Link>
            <Link href="/about" className="hover:text-gray-600">
              О нас
            </Link>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="hover:text-gray-600"
              title="Поиск"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>

            {isAuthenticated && user ? (
              <>
                {(user.role === 'EDITOR' || user.role === 'ADMIN') && (
                  <Link href="/admin" className="hover:text-gray-600">
                    Панель редактора
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <span className="text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Выход
                  </button>
                </div>
              </>
            ) : (
              <Link href="/login" className="text-blue-600 hover:text-blue-800">
                Вход
              </Link>
            )}
          </div>
        </nav>

        {showSearch && (
          <div className="mt-4">
            <SearchBar />
          </div>
        )}
      </div>
    </header>
  );
}
