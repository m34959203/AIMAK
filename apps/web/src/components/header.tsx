'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

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
      </div>
    </header>
  );
}
