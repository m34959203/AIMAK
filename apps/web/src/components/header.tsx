import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Aimak Akshamy
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-gray-600">
              Главная
            </Link>
            <Link href="/articles" className="hover:text-gray-600">
              Статьи
            </Link>
            <Link href="/about" className="hover:text-gray-600">
              О нас
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
