import { TengriHeader } from '@/components/tengri-header';
import { TengriFooter } from '@/components/tengri-footer';
import { Providers } from '@/components/providers';
import '../globals.css';

export const metadata = {
  title: 'Аймақ ақшамы - Қалалық газет',
  description: 'Қарағанды қаласының қоғамдық-саяси газеті',
};

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: 'kz' | 'ru' };
}) {
  return (
    <html lang={params.lang === 'kz' ? 'kk' : 'ru'}>
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <TengriHeader lang={params.lang} />
            <main className="flex-1 bg-gray-50">
              {children}
            </main>
            <TengriFooter lang={params.lang} />
          </div>
        </Providers>
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'kz' }, { lang: 'ru' }];
}
