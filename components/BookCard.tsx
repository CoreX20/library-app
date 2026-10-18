import React from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";

const BookCard = ({ id, title, genre, coverColor, coverUrl }: Book) => {
  return (
    <li>
      <Link href={`books/${id}`}>
        <BookCover coverColor={coverColor} coverImage={coverUrl} />

        <div className="mt-4 xs:max-w-40 max-w-28">
          <p className="book-title">{title}</p>
          <p className="book-genre">{genre}</p>
        </div>
      </Link>
    </li>
  );
};

export default BookCard;
