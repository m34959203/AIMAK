'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import { SearchBar } from './search-bar';
import { WeatherWidget } from './weather-widget';

interface HeaderProps {
  lang?: 'kz' | 'ru';
}

export function TengriHeader({ lang = 'kz' }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState({ temp: '+15', icon: '🌤️' });
  const [currency, setCurrency] = useState({ usd: '450', eur: '520' });
  const pathname = usePathname();

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using OpenWeatherMap API for Satpaev, Kazakhstan
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Satpaev,KZ&units=metric&appid=aa8b515e87f73801f11cf922205790fd`
        );

        if (response.ok) {
          const data = await response.json();
          const temp = Math.round(data.main.temp);
          const weatherCode = data.weather[0].id;

          // Map weather codes to emojis
          let icon = '🌤️';
          if (weatherCode >= 200 && weatherCode < 300) icon = '⛈️';
          else if (weatherCode >= 300 && weatherCode < 600) icon = '🌧️';
          else if (weatherCode >= 600 && weatherCode < 700) icon = '❄️';
          else if (weatherCode === 800) icon = '☀️';
          else if (weatherCode > 800) icon = '☁️';

          setWeather({ temp: temp > 0 ? `+${temp}` : `${temp}`, icon });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, []);

  // Fetch currency rates
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Using NBK (National Bank of Kazakhstan) API or alternative
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

        if (response.ok) {
          const data = await response.json();
          const kztRate = data.rates.KZT;
          const eurToUsd = data.rates.EUR;

          setCurrency({
            usd: Math.round(kztRate).toString(),
            eur: Math.round(kztRate / eurToUsd).toString()
          });
        }
      } catch (error) {
        console.error('Failed to fetch currency:', error);
      }
    };

    fetchCurrency();
    const interval = setInterval(fetchCurrency, 3600000); // Update every hour
    return () => clearInterval(interval);
  }, []);

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Fallback categories if API is loading or fails
  const fallbackCategories = [
    { slug: 'zhanalyqtar', nameKz: 'ЖАҢАЛЫҚТАР', nameRu: 'НОВОСТИ' },
    { slug: 'ozekti', nameKz: 'ӨЗЕКТІ', nameRu: 'АКТУАЛЬНО' },
    { slug: 'sayasat', nameKz: 'САЯСАТ', nameRu: 'ПОЛИТИКА' },
    { slug: 'madeniyet', nameKz: 'МӘДЕНИЕТ', nameRu: 'КУЛЬТУРА' },
    { slug: 'qogam', nameKz: 'ҚОҒАМ', nameRu: 'ОБЩЕСТВО' },
    { slug: 'kazakhmys', nameKz: 'KAZAKHMYS NEWS', nameRu: 'KAZAKHMYS NEWS' },
  ];

  // Use API categories if available, otherwise use fallback
  const categories = categoriesData && categoriesData.length > 0
    ? categoriesData.filter((cat: any) => cat.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    : fallbackCategories;

  const t = {
    kz: {
      home: 'Басты бет',
      multimedia: 'Мультимедиа',
      issues: 'Шығарылымдар',
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
      issues: 'Выпуски',
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
              <span className="font-medium">Сатпаев</span>
              {currentTime && <span className="font-semibold">{currentTime}</span>}
              <WeatherWidget />
              <span>$ {currency.usd}₸</span>
              <span>€ {currency.eur}₸</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="flex gap-1 border rounded">
                <button
                  onClick={() => switchLang('kz')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    lang === 'kz'
                      ? 'bg-[#16a34a] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ҚАЗ
                </button>
                <button
                  onClick={() => switchLang('ru')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    lang === 'ru'
                      ? 'bg-[#16a34a] text-white'
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
            <div className="text-3xl font-bold tracking-tight">
              <span className="text-[#16a34a]">АЙМАҚ</span>{' '}
              <span className="text-gray-700">АҚШАМЫ</span>
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
                    className="text-sm font-medium text-gray-700 hover:text-[#22A699] transition"
                  >
                    {text.adminPanel}
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-sm font-semibold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-red-500 transition"
                  >
                    {text.logout}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={`/${lang}/login`}
                className="px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#22A699] transition font-medium text-sm"
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
      <div className="bg-[#303133] text-white">
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
                href={`/${lang}/issues`}
                className="px-4 py-3 hover:bg-gray-800 transition font-medium text-sm uppercase"
              >
                {text.issues}
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
                href={`/${lang}/issues`}
                className="block px-4 py-2 hover:bg-gray-800 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                {text.issues}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
