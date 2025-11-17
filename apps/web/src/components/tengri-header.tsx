'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SearchBar } from './search-bar';

interface HeaderProps {
  lang?: 'kz' | 'ru';
}

export function TengriHeader({ lang = 'kz' }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();

  const categories = [
    { slug: 'zhanalyqtar', nameKz: 'ЖАҢАЛЫҚТАР', nameRu: 'НОВОСТИ' },
    { slug: 'ozekti', nameKz: 'ӨЗЕКТІ', nameRu: 'АКТУАЛЬНО' },
    { slug: 'sayasat', nameKz: 'САЯСАТ', nameRu: 'ПОЛИТИКА' },
    { slug: 'madeniyet', nameKz: 'МӘДЕНИЕТ', nameRu: 'КУЛЬТУРА' },
    { slug: 'qogam', nameKz: 'ҚОҒАМ', nameRu: 'ОБЩЕСТВО' },
    { slug: 'kazakhmys', nameKz: 'KAZAKHMYS NEWS', nameRu: 'KAZAKHMYS NEWS' },
  ];

  const t = {
    kz: {
      home: 'Басты бет',
      multimedia: 'Мультимедиа',
      archive: 'Архив',
      about: 'Біз туралы',
      contacts: 'Байланыс',
      login: 'Кіру',
      logout: 'Шығу',
      adminPanel: 'Редактор панелі',
      search: 'Іздеу',
    },
    ru: {
      home: 'Главная',
      multimedia: 'Мультимедиа',
      archive: 'Архив',
      about: 'О нас',
      contacts: 'Контакты',
      login: 'Вход',
      logout: 'Выход',
      adminPanel: 'Панель редактора',
      search: 'Поиск',
    },
  };

  const text = t[lang];

  const switchLang = (newLang: 'kz' | 'ru') => {
    const newPath = pathname.replace(/^\/(kz|ru)/, `/${newLang}`);
    window.location.href = newPath;
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-gray-600">
              <span className="font-medium">Қарағанды</span>
              <span>🌤️ +15°C</span>
              <span>USD: 450₸</span>
              <span>EUR: 520₸</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:+77005000500" className="text-gray-600 hover:text-green-600">
                +7 700 500 05 00
              </a>
              {/* Language Switcher */}
              <div className="flex gap-1 border rounded">
                <button
                  onClick={() => switchLang('kz')}
                  className={`px-3 py-1 text-xs font-medium ${
                    lang === 'kz'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ҚАЗ
                </button>
                <button
                  onClick={() => switchLang('ru')}
                  className={`px-3 py-1 text-xs font-medium ${
                    lang === 'ru'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  РУС
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center">
            <div className="text-3xl font-bold">
              <span className="text-green-600">АЙМАҚ</span>{' '}
              <span className="text-gray-800">АҚШАМЫ</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title={text.search}
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
              <div className="flex items-center gap-4">
                {(user.role === 'EDITOR' || user.role === 'ADMIN') && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
                  >
                    {text.adminPanel}
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-red-600"
                  >
                    {text.logout}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={`/${lang}/login`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium text-sm"
              >
                {text.login}
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="pb-4">
            <SearchBar />
          </div>
        )}
      </div>

      {/* Categories Navigation */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <nav className="hidden lg:flex items-center justify-between">
            <div className="flex items-center">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${lang}/${cat.slug}`}
                  className="px-4 py-3 hover:bg-gray-800 transition font-medium text-sm uppercase"
                >
                  {lang === 'kz' ? cat.nameKz : cat.nameRu}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${lang}/multimedia`}
                className="px-4 py-3 hover:bg-gray-800 transition font-medium text-sm uppercase"
              >
                {text.multimedia}
              </Link>
              <Link
                href={`/${lang}/archive`}
                className="px-4 py-3 hover:bg-gray-800 transition font-medium text-sm uppercase"
              >
                {text.archive}
              </Link>
            </div>
          </nav>

          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="lg:hidden py-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${lang}/${cat.slug}`}
                  className="block px-4 py-2 hover:bg-gray-800 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {lang === 'kz' ? cat.nameKz : cat.nameRu}
                </Link>
              ))}
              <Link
                href={`/${lang}/multimedia`}
                className="block px-4 py-2 hover:bg-gray-800 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                {text.multimedia}
              </Link>
              <Link
                href={`/${lang}/archive`}
                className="block px-4 py-2 hover:bg-gray-800 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                {text.archive}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
