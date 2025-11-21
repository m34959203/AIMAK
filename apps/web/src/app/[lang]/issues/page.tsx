'use client';

import { useState, useEffect } from 'react';
import { useMagazineIssues, useIncrementViews, useIncrementDownloads } from '@/hooks/use-magazine-issues';
import { PDFViewer } from '@/components/pdf-viewer';
import type { MagazineIssue } from '@/types';

interface Props {
  params: Promise<{ lang: 'kz' | 'ru' }>;
}

export default function IssuesPage({ params }: Props) {
  const [lang, setLang] = useState<'kz' | 'ru'>('kz');
  const [selectedIssue, setSelectedIssue] = useState<MagazineIssue | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { data: issues, isLoading } = useMagazineIssues(true); // Только опубликованные
  const incrementViews = useIncrementViews();
  const incrementDownloads = useIncrementDownloads();

  useEffect(() => {
    params.then((p) => setLang(p.lang));
  }, [params]);

  // Получить уникальные годы из выпусков
  const years = Array.from(new Set(issues?.map((issue) => issue.year) || [])).sort((a, b) => b - a);

  // Фильтрация по году
  const filteredIssues = selectedYear
    ? issues?.filter((issue) => issue.year === selectedYear)
    : issues;

  // Группировка по годам
  const issuesByYear = filteredIssues?.reduce((acc, issue) => {
    if (!acc[issue.year]) acc[issue.year] = [];
    acc[issue.year].push(issue);
    return acc;
  }, {} as Record<number, MagazineIssue[]>);

  const handleSelectIssue = (issue: MagazineIssue) => {
    setSelectedIssue(issue);
    incrementViews.mutate(issue.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = () => {
    if (selectedIssue) {
      incrementDownloads.mutate(selectedIssue.id);
    }
  };

  const t = {
    kz: {
      title: 'Журнал шығарылымдары',
      allYears: 'Барлық жылдар',
      issue: 'Шығарылым',
      published: 'Жарияланды',
      pages: 'беттер',
      views: 'көрулер',
      downloads: 'жүктеулер',
      selectIssue: 'Оқу үшін шығарылымды таңдаңыз',
    },
    ru: {
      title: 'Выпуски журнала',
      allYears: 'Все годы',
      issue: 'Выпуск',
      published: 'Опубликовано',
      pages: 'стр.',
      views: 'просмотров',
      downloads: 'скачиваний',
      selectIssue: 'Выберите выпуск для чтения',
    },
  };

  const text = t[lang];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{text.title}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Боковая панель со списком выпусков */}
        <div className="lg:w-1/3">
          {/* Фильтр по годам */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <label className="block text-sm font-medium mb-2">Фильтр по году:</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">{text.allYears}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Список выпусков */}
          <div className="space-y-4">
            {Object.entries(issuesByYear || {})
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, yearIssues]) => (
                <div key={year} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b font-bold">{year}</div>
                  <div className="divide-y">
                    {yearIssues
                      .sort((a, b) => {
                        if (b.year !== a.year) return b.year - a.year;
                        if (b.month !== a.month) return b.month - a.month;
                        return b.issueNumber - a.issueNumber;
                      })
                      .map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => handleSelectIssue(issue)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                            selectedIssue?.id === issue.id ? 'bg-blue-50 border-l-4 border-[#16a34a]' : ''
                          }`}
                        >
                          {issue.isPinned && (
                            <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded mb-2">
                              Закреплен
                            </span>
                          )}
                          <div className="font-bold text-lg mb-1">
                            {text.issue} №{issue.issueNumber}
                          </div>
                          <div className="text-gray-700 mb-1">
                            {lang === 'kz' ? issue.titleKz : issue.titleRu}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {text.published}: {new Date(issue.publishDate).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU')}
                          </div>
                          {issue.coverImageUrl && (
                            <img
                              src={issue.coverImageUrl}
                              alt={lang === 'kz' ? issue.titleKz : issue.titleRu}
                              className="w-full h-40 object-cover rounded mb-2"
                            />
                          )}
                          <div className="flex gap-4 text-xs text-gray-500">
                            {issue.pagesCount && <span>{issue.pagesCount} {text.pages}</span>}
                            <span>{issue.viewsCount} {text.views}</span>
                            <span>{issue.downloadsCount} {text.downloads}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}

            {filteredIssues?.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                Нет доступных выпусков
              </div>
            )}
          </div>
        </div>

        {/* Область просмотра PDF */}
        <div className="lg:w-2/3">
          {selectedIssue ? (
            <div>
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 className="text-2xl font-bold mb-2">
                  {text.issue} №{selectedIssue.issueNumber} ({selectedIssue.month}/{selectedIssue.year})
                </h2>
                <h3 className="text-xl mb-2">
                  {lang === 'kz' ? selectedIssue.titleKz : selectedIssue.titleRu}
                </h3>
                {(lang === 'kz' ? selectedIssue.descriptionKz : selectedIssue.descriptionRu) && (
                  <p className="text-gray-600 mb-2">
                    {lang === 'kz' ? selectedIssue.descriptionKz : selectedIssue.descriptionRu}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-gray-500">
                  {selectedIssue.pagesCount && <span>{selectedIssue.pagesCount} {text.pages}</span>}
                  <span>{selectedIssue.viewsCount} {text.views}</span>
                  <span>{selectedIssue.downloadsCount} {text.downloads}</span>
                  <span>
                    {(selectedIssue.fileSize / 1024 / 1024).toFixed(2)} МБ
                  </span>
                </div>
              </div>

              <PDFViewer url={selectedIssue.pdfUrl} onDownload={handleDownload} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24 mx-auto mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg">{text.selectIssue}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
