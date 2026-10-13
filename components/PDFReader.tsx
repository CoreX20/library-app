"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Document, Page, Thumbnail, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// Aset pdf.js disalin dari pdfjs-dist 4.8.69 ke public/ agar tidak diambil dari unpkg.
const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfOutlineItem {
  title?: string;
  dest: string | unknown[];
  items?: PdfOutlineItem[];
}

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
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<null | "thumbs" | "outline">(null);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const pdfDoc = useRef<PDFDocumentProxy | null>(null);

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

  // Menangani kesuksesan pemuatan dokumen PDF
  const handleDocumentLoadSuccess = async (pdf: PDFDocumentProxy) => {
    setIsLoading(false);
    setNumPages(pdf.numPages);
    setError(null);
    pdfDoc.current = pdf;

    // Outline dipakai panel daftar isi
    setOutline(((await pdf.getOutline()) ?? []) as PdfOutlineItem[]);

    // Menangani halaman yang melebihi jumlah total halaman
    if (validatedPage > pdf.numPages) {
      onPageChange(Math.max(1, pdf.numPages));
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
    localStorage.setItem(`bookprogress-${book_id}`, page.toString());
  };

  // Panah kiri/kanan untuk pindah halaman; input halaman tetap bekerja
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") handlePageChange(validatedPage - 1);
      if (e.key === "ArrowRight") handlePageChange(validatedPage + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [validatedPage, numPages]);

  const pageWidth = Math.max(300, Math.min(containerWidth, 1200) * zoom);

  const goToDest = async (dest: string | unknown[]) => {
    const pdf = pdfDoc.current;
    if (!pdf || !dest) return;
    const explicit =
      typeof dest === "string" ? await pdf.getDestination(dest) : dest;
    if (!explicit?.length) return;
    const page = await pdf.getPageIndex(
      explicit[0] as Parameters<PDFDocumentProxy["getPageIndex"]>[0],
    );
    handlePageChange(page + 1);
  };

  return (
    <div className="md:h-full flex flex-col bg-gray-50">
      {numPages ? (
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-indigo-600 transition-all"
            style={{ width: `${(validatedPage / numPages) * 100}%` }}
          />
        </div>
      ) : null}

      {/* Kontrol Navigasi */}
      <div className="hidden lg:block bg-white shadow-sm p-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex justify-center items-center gap-2 flex-1">
          <button
            aria-label="Previous page"
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
            aria-label="Next page"
            onClick={() => handlePageChange(validatedPage + 1)}
            disabled={validatedPage >= (numPages || 1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors min-w-[120px]"
          >
            Next →
          </button>

          <div className="flex items-center gap-1">
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              −
            </button>
            <span className="w-12 text-center text-sm text-gray-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              +
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
            >
              Pas lebar
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-pressed={panel === "thumbs"}
              onClick={() =>
                setPanel(panel === "thumbs" ? null : "thumbs")
              }
              className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 aria-pressed:bg-indigo-600 aria-pressed:text-white"
            >
              Halaman
            </button>
            <button
              aria-pressed={panel === "outline"}
              onClick={() =>
                setPanel(panel === "outline" ? null : "outline")
              }
              className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 aria-pressed:bg-indigo-600 aria-pressed:text-white"
            >
              Daftar isi
            </button>
          </div>
        </div>
      </div>

      {/* Konten PDF */}
      {error ? (
        <div className="flex-1 max-w-2xl mx-auto p-6 m-4 bg-red-50 rounded-lg text-red-700">
          <h3 className="font-semibold mb-2">Error Memuat Dokumen</h3>
          <p>{error}</p>
          <p className="mt-4 text-sm opacity-75">URL: {bookUrl}</p>
        </div>
      ) : (
        <Document
          file={pdfFile}
          options={options}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={
            <div className="text-center text-gray-500 p-4">
              <div className="animate-pulse bg-gray-200 h-[800px] max-w-4xl mx-auto rounded-lg" />
            </div>
          }
        >
          <div className="flex-1 flex overflow-hidden">
            {panel && (
              // ponytail: sidebar desktop-only dan thumbnail dirender serentak saat terbuka; virtualisasi/grid responsif kalau PDF besar jank.
              <aside className="w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-3 hidden lg:block">
                {panel === "thumbs" ? (
                  <div className="space-y-2">
                    {numPages
                      ? Array.from({ length: numPages }, (_, i) => (
                          <button
                            key={i}
                            aria-label={`Ke halaman ${i + 1}`}
                            onClick={() => handlePageChange(i + 1)}
                            className="block w-full"
                          >
                            <Thumbnail
                              pageNumber={i + 1}
                              width={160}
                              className={
                                i + 1 === validatedPage
                                  ? "ring-2 ring-indigo-600 rounded"
                                  : ""
                              }
                            />
                          </button>
                        ))
                      : null}
                  </div>
                ) : outline.length ? (
                  // ponytail: hanya bab tingkat atas; nested kapan daftarnya memang butuh.
                  <ul className="space-y-1">
                    {outline.map((item, i) => (
                      <li key={i}>
                        <button
                          className="w-full truncate text-left text-sm text-gray-700 hover:text-indigo-600"
                          onClick={() => goToDest(item.dest)}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    Dokumen ini tidak punya daftar isi.
                  </p>
                )}
              </aside>
            )}

            <div id="pdf-container" className="flex-1 overflow-auto p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-4">
              <div className="flex justify-center">
                <Page
                  key={`page_${validatedPage}`}
                  pageNumber={validatedPage}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="shadow-lg rounded-lg border border-gray-200 bg-white"
                  loading={
                    <div className="animate-pulse bg-gray-200 h-[800px] w-full" />
                  }
                />
              </div>
            </div>
          </div>
        </Document>
      )}

      {/* Kontrol Floating untuk Mobile */}
      <div className="lg:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 bg-white shadow-xl rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-3 bg-gray-100 rounded-lg"
          >
            −
          </button>

          <button
            aria-label="Previous page"
            onClick={() => handlePageChange(validatedPage - 1)}
            disabled={validatedPage <= 1}
            className="p-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex-1"
          >
            ←
          </button>

          <div className="flex items-center justify-center bg-gray-100 rounded-lg px-2 py-2 flex-1 max-w-[120px]">
            <span className="text-gray-600">{validatedPage}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span className="text-gray-500">{numPages || "-"}</span>
          </div>

          <button
            aria-label="Next page"
            onClick={() => handlePageChange(validatedPage + 1)}
            disabled={validatedPage >= (numPages || 1)}
            className="p-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex-1"
          >
            →
          </button>

          <button
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-3 bg-gray-100 rounded-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
