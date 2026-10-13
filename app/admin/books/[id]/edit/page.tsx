import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookForm from "@/components/admin/forms/BookForm";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, id))
    .limit(1);

  if (!book) notFound();

  return (
    <>
      <Button asChild className="back-btn">
        <Link href="/admin/books">Go Back</Link>
      </Button>

      <section className="w-full max-w-2xl">
        <BookForm type="update" {...book} />
      </section>
    </>
  );
};

export default Page;
