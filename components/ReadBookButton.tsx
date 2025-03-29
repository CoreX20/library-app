"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  bookId: string;
}

const ReadBookButton = ({ bookId }: Props) => {
  const router = useRouter();

  const handleRead = (bookId: string) => {
    router.push(`/books/read/${bookId}`);
  };
  return (
    <Button className="book-overview_btn" onClick={() => handleRead(bookId)}>
      <p className="font-bebas-neue text-xl text-dark-100">Read Book</p>
    </Button>
  );
};

export default ReadBookButton;
