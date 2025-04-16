import React, { useRef, useState, useEffect } from "react";
import { ReactReader } from "react-reader";
import { Rendition, NavItem } from "epubjs";

interface EpubReaderProps {
  bookUrl: string;
  title: string;
  book_id: string;
  location: string | number;
  onLocationChange: (location: string | number) => void;
}

const EpubReader = ({
  bookUrl,
  title,
  book_id,
  location,
  onLocationChange,
}: EpubReaderProps) => {
  const toc = useRef<NavItem[]>([]);
  const rendition = useRef<Rendition | null>(null);
  const [page, setPage] = useState("");

  return (
    <>
      <ReactReader
        url={bookUrl}
        title={title}
        location={location}
        locationChanged={(loc: string) => {
          //   setLocation(loc);
          onLocationChange(loc);
          localStorage.setItem(`bookprogress-${book_id}`, loc.toString());
          if (rendition.current && toc.current) {
            const { displayed, href } = rendition.current.location.start;
            const chapter = toc.current.find((item) => item.href === href);
            setPage(
              `Page ${displayed.page} of ${displayed.total} in chapter ${
                chapter ? chapter.label : "n/a"
              }`
            );
          }
        }}
        epubInitOptions={{
          openAs: "epub",
        }}
        pageTurnOnScroll={true}
        epubOptions={{
          allowPopups: true,
          allowScriptedContent: true,
          flow: "paginated",
          // manager: "continuous",
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
      />

      <p className="text-white font-bold">{page}</p>
    </>
  );
};

export default EpubReader;
