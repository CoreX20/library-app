"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  fetchProgress,
  getBookFileUrl,
  getFileType,
  postProgress,
} from "@/lib/actions/book";
import EpubReader from "./EpubReader";
// import PDFReader from "./PDFReader";

import dynamic from "next/dynamic";

// Dynamically import PdfReader to ensure it only runs on the client side
const PDFReader = dynamic(() => import("./PDFReader"), {
  ssr: false, // Disable SSR for PdfReader
});

const BookReader = ({
  book_id,
  title,
  bookFile,
}: {
  book_id: string;
  title: string;
  bookFile: string;
}) => {
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number>("");
  const lastSavedLocation = useRef<string | number | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "epub" | null>(null);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    const initializeBook = async () => {
      try {
        const parts = bookFile.split("/");
        const bookFileFolder = parts.slice(1, -1).join("/");
        const fileName = parts.pop()!;

        const { fileId } = (await getBookFileUrl(bookFileFolder, fileName)) as {
          fileId: string;
        };

        const format = await getFileType(fileId);

        if (format == "application/epub+zip") setFileType("epub");
        else if (format == "application/pdf") setFileType("pdf");

        // const progress = await fetchProgress(user_id, book_id);
        // if (progress?.location) {
        //   const savedLocation = progress.location;
        //   if (savedLocation) {
        //     setLocation(savedLocation);
        //     lastSavedLocation.current = savedLocation; // Update the last saved location from the DB
        //   }
        // }

        // Get progress from local storage first
        if (typeof window !== "undefined") {
          const localProgress = localStorage.getItem(`bookprogress-${book_id}`);

          if (localProgress) {
            setLocation(localProgress);
            lastSavedLocation.current = localProgress;
            setShowResume(localProgress !== "0");
            // console.log("Progress diambil dari Local Storage:", localProgress);
          } else {
            // If it's not in Local Storage, get it from the server
            const progress = await fetchProgress(book_id);
            if (progress?.location) {
              setLocation(progress.location);
              lastSavedLocation.current = progress.location;
              setShowResume(progress.location !== "0");
              localStorage.setItem(
                `bookprogress-${book_id}`,
                progress.location
              );
              // console.log("Progress diambil dari API:", progress.location);
            } else {
              // First time user reads the book, starting from the beginning
              setLocation(0);
              localStorage.setItem(`bookprogress-${book_id}`, "0");
              lastSavedLocation.current = "0";
            }
          }
        }
        // File dikirim lewat route server agar tidak memanggil ik.imagekit.io dari browser
        setBookUrl(`/api/books/${book_id}/file`);
      } catch (error) {
        console.error(error);
      }
    };

    initializeBook();
  }, [bookFile, book_id]);

  const locationRef = useRef(location);
  locationRef.current = location;

  const saveProgress = async () => {
    const current = locationRef.current;
    if (!book_id || !current) return;
    if (current === lastSavedLocation.current) return;

    const result = await postProgress(book_id, String(current));
    // Gagal simpan: biarkan localStorage sebagai cadangan
    if (result?.success === false) return;

    lastSavedLocation.current = current;
    localStorage.removeItem(`bookprogress-${book_id}`);
  };

  //save progress every 15s/30s
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      saveProgress();
    }, 30000);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [location]);

  // Debounce 30 detik bisa terlewat saat tab ditutup, jadi simpan saat tab disembunyikan
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") saveProgress();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [book_id]);

  // save progress when location change
  // useEffect(() => {
  //   console.log(location);
  //   const debounceTimer = setTimeout(async () => {
  //     if (!isBookInitialized || location === undefined) return;
  //     if (!user_id || !book_id || !location) return;
  //     if (location === lastSavedLocation.current) return;
  //
  //     try {
  //       await postProgress(user_id, book_id, location);
  //       console.log("tersimpan ke db", location);
  //
  //       // lastSavedLocation.current = location;
  //     } catch (error) {
  //       console.error("Gagal menyimpan progres:", error);
  //     }
  //   }, 5000);
  //   return () => {
  //     clearTimeout(debounceTimer);
  //   };
  // }, [location, user_id, book_id, isBookInitialized]);

  return (
    <div className="relative h-dvh">
      {showResume && (
        <div className="absolute inset-x-4 top-4 z-50 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 text-gray-800 shadow-lg">
          <p className="text-sm">Anda terakhir membaca di sini. Lanjutkan?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResume(false)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-white"
            >
              Lanjutkan
            </button>
            <button
              onClick={() => {
                setLocation(0);
                localStorage.setItem(`bookprogress-${book_id}`, "0");
                setShowResume(false);
              }}
              className="rounded-lg border px-3 py-2"
            >
              Mulai dari awal
            </button>
          </div>
        </div>
      )}
      {fileType === "epub" && bookUrl ? (
        <EpubReader
          bookUrl={bookUrl}
          title={title}
          book_id={book_id}
          location={location}
          onLocationChange={setLocation}
        />
      ) : (
        fileType === "pdf" &&
        bookUrl && (
          <PDFReader
            bookUrl={bookUrl}
            currentPage={Number(location)}
            onPageChange={setLocation}
            book_id={book_id}
          />
        )
      )}
    </div>
  );
};

export default BookReader;
