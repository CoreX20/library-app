import React from "react";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import BookReader from "@/components/BookReader";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const { id } = await params;

  const book = await db
    .select({ id: books.id, title: books.title, bookFile: books.bookFile })
    .from(books)
    .where(eq(books.id, id));

  if (!book[0]?.bookFile) {
    return <div>Book not found</div>;
  }

  return (
    <BookReader
      book_id={id}
      user_id={session?.user?.id!}
      title={book[0].title}
      bookFile={book[0].bookFile}
    />
  );
};

export default Page;
