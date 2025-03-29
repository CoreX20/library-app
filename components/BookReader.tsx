"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  fetchProgress,
  getBookFileUrl,
  postProgress,
} from "@/lib/actions/book";
import { ReactReader } from "react-reader";
import { Rendition, NavItem } from "epubjs";

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
  const [page, setPage] = useState("");
  const toc = useRef<NavItem[]>([]);
  const [location, setLocation] = useState<string | number>("");
  const rendition = useRef<Rendition | null>(null);
  const lastSavedLocation = useRef<string | number | null>(null);

  useEffect(() => {
    const initializeBook = async () => {
      try {
        const parts = bookFile.split("/");
        const bookFileFolder = parts.slice(1, -1).join("/");
        const fileName = parts.pop()!;
        const { url } = await getBookFileUrl(bookFileFolder, fileName);

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
                progress.location,
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
      await postProgress(user_id, book_id, location);
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
      <ReactReader
        url={bookUrl}
        title={title}
        location={location}
        locationChanged={(loc: string) => {
          setLocation(loc);
          localStorage.setItem(`bookprogress-${book_id}`, loc.toString());
          if (rendition.current && toc.current) {
            const { displayed, href } = rendition.current.location.start;
            const chapter = toc.current.find((item) => item.href === href);
            setPage(
              `Page ${displayed.page} of ${displayed.total} in chapter ${
                chapter ? chapter.label : "n/a"
              }`,
            );
          }
        }}
        epubInitOptions={{
          openAs: "epub",
        }}
        epubOptions={{
          allowPopups: true,
          allowScriptedContent: true,
        }}
        getRendition={(r: Rendition) => {
          rendition.current = r;

          // Set default font size dan styling
          r.themes.fontSize("120%");
          r.themes.register("default-style", {
            body: {
              "font-family": "Georgia, serif !important",
              "line-height": "1.6 !important",
              "text-align": "justify !important",
              color: "#333 !important",
            },
            p: {
              "margin-bottom": "1.2em !important",
            },
          });
        }}
        //   r.themes.select("default-style");
        //
        //   r.hooks.content.register((contents: Contents) => {
        //     // @ts-ignore - manager type is missing in epubjs Rendition
        //     r.manager.container.style["scroll-behavior"] = "smooth";
        //   });
        // }}
      />

      <p className="text-white font-bold">{page}</p>
    </div>
  );
};

export default BookReader;
