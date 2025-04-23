"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfReaderProps {
  bookUrl: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  book_id: string;
}

const PdfReader = ({
  bookUrl,
  currentPage,
  onPageChange,
  book_id,
}: PdfReaderProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Validasi halaman
  const validatedPage = Math.max(1, Math.min(currentPage, numPages || 1));

  // Re-fetch PDF jika URL berubah
  const pdfFile = useMemo(() => {
    if (!bookUrl) return null;
    return { url: bookUrl };
  }, [bookUrl]);

  // Responsif untuk lebar kontainer
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById("pdf-container");
      setContainerWidth(container?.offsetWidth || 1200);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Membaca halaman yang tersimpan di localStorage pada saat pertama kali load
  useEffect(() => {
    const savedPage = localStorage.getItem(`pdfprogress-${book_id}`);
    const initialPage = savedPage ? parseInt(savedPage, 10) : 1;
    if (currentPage !== initialPage) {
      onPageChange(initialPage);
    }
  }, [book_id, currentPage, onPageChange]);

  // Menangani kesuksesan pemuatan dokumen PDF
  const handleDocumentLoadSuccess = ({ numPages }: PDFDocumentProxy) => {
    setIsLoading(false);
    setNumPages(numPages);
    setError(null);

    // Menangani halaman yang melebihi jumlah total halaman
    if (validatedPage > numPages) {
      const newPage = Math.max(1, numPages);
      onPageChange(newPage);
    }
  };

  // Menangani error ketika dokumen gagal dimuat
  const handleDocumentLoadError = (error: Error) => {
    setIsLoading(false);
    setError("Gagal memuat dokumen PDF");
    console.error("PDF load error:", error);
  };

  // Menangani perubahan halaman
  const handlePageChange = (newPage: number) => {
    const page = Math.max(1, Math.min(newPage, numPages || 1));
    onPageChange(page);
    localStorage.setItem(`pdfprogress-${book_id}`, page.toString());
  };

  return (
    <div className="md:h-full flex flex-col bg-gray-50">
      {/* Kontrol Navigasi */}
      <div className="hidden lg:block bg-white shadow-sm p-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex justify-center items-center gap-2 flex-1">
          <button
            onClick={() => handlePageChange(validatedPage - 1)}
            disabled={validatedPage <= 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-w-[120px]"
          >
            ← Prev
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg p-2 flex-1 max-w-[200px]">
            <input
              type="number"
              min="1"
              max={numPages || 1}
              value={validatedPage.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) handlePageChange(value);
              }}
              className="w-full text-center bg-transparent outline-none"
              onBlur={(e) => {
                if (e.target.value === "") handlePageChange(1);
              }}
            />
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-gray-600">{numPages || "-"}</span>
          </div>

          <button
            onClick={() => handlePageChange(validatedPage + 1)}
            disabled={validatedPage >= (numPages || 1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-w-[120px]"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Konten PDF */}
      <div id="pdf-container" className="flex-1 overflow-auto p-4">
        {error ? (
          <div className="max-w-2xl mx-auto p-6 bg-red-50 rounded-lg text-red-700">
            <h3 className="font-semibold mb-2">Error Memuat Dokumen</h3>
            <p>{error}</p>
            <p className="mt-4 text-sm opacity-75">URL: {bookUrl}</p>
          </div>
        ) : (
          <Document
            file={pdfFile}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="text-center text-gray-500 p-4">
                <div className="animate-pulse bg-gray-200 h-[800px] max-w-4xl mx-auto rounded-lg" />
              </div>
            }
          >
            <div className="flex justify-center">
              <Page
                key={`page_${validatedPage}`}
                pageNumber={validatedPage}
                width={Math.min(containerWidth, 1200)}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="shadow-lg rounded-lg border border-gray-200 bg-white"
                loading={
                  <div className="animate-pulse bg-gray-200 h-[800px] w-full" />
                }
              />
            </div>
          </Document>
        )}
      </div>

      {/* Kontrol Floating untuk Mobile */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-white shadow-xl rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(validatedPage - 1)}
            disabled={validatedPage <= 1}
            className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex-1"
          >
            ←
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1 flex-1 max-w-[140px]">
            <span className="text-gray-600">{validatedPage}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span className="text-gray-500">{numPages || "-"}</span>
          </div>

          <button
            onClick={() => handlePageChange(validatedPage + 1)}
            disabled={validatedPage >= (numPages || 1)}
            className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex-1"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
