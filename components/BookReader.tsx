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
  user_id,
  title,
  bookFile,
}: {
  book_id: string;
  user_id: string;
  title: string;
  bookFile: string;
}) => {
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number>("");
  const lastSavedLocation = useRef<string | number | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "epub" | null>(null);

  useEffect(() => {
    const initializeBook = async () => {
      try {
        const parts = bookFile.split("/");
        const bookFileFolder = parts.slice(1, -1).join("/");
        const fileName = parts.pop()!;

        const { url, fileId } = (await getBookFileUrl(
          bookFileFolder,
          fileName
        )) as { url: string; fileId: string };

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
            // console.log("Progress diambil dari Local Storage:", localProgress);
          } else {
            // If it's not in Local Storage, get it from the server
            const progress = await fetchProgress(user_id, book_id);
            if (progress?.location) {
              setLocation(progress.location);
              lastSavedLocation.current = progress.location;
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
        setBookUrl(url);
      } catch (error) {
        console.error(error);
      }
    };

    initializeBook();
  }, [bookFile, user_id, book_id]);

  const saveProgress = async () => {
    if (!user_id || !book_id || !location) return;
    if (location === lastSavedLocation.current) {
      return;
    }

    try {
      await postProgress(user_id, book_id, location as string);
      // console.log("Progress tersimpan ke database:", location);

      lastSavedLocation.current = location;
      localStorage.removeItem(`bookprogress-${book_id}`);
    } catch (error) {
      console.error(error);
    }
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
    <div className="h-screen">
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
