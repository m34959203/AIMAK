'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Настройка worker для react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  onDownload?: () => void;
}

export function PDFViewer({ url, onDownload }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const handleDownload = () => {
    if (onDownload) onDownload();
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Панель управления */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(pageNumber - 1)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <span className="text-sm">
            Страница {pageNumber} из {numPages || '...'}
          </span>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(pageNumber + 1)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={scale <= 0.5}
            onClick={() => setScale(scale - 0.25)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            -
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            disabled={scale >= 2.0}
            onClick={() => setScale(scale + 0.25)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            +
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Скачать PDF
        </button>
      </div>

      {/* PDF Документ */}
      <div className="flex justify-center overflow-auto bg-gray-100 rounded">
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-600">Загрузка PDF...</div>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error('Error loading PDF:', error)}
          loading={<div className="text-center py-8">Загрузка...</div>}
          error={<div className="text-center py-8 text-red-600">Ошибка загрузки PDF</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="mx-auto"
          />
        </Document>
      </div>
    </div>
  );
}
