import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TableBook } from "@/components/admin/Table";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const handleDeleteBook = async (id: string) => {
  "use server";
  await db.delete(books).where(eq(books.id, id));
  revalidatePath("/admin/books");
};

const handleEditBook = async (id: string) => {
  "use server";
  console.log(id);
};

const Page = async () => {
  const listBooks = (await db
    .select()
    .from(books)
    .limit(10)
    .orderBy(desc(books.createdAt))) as Book[];

  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">All Books</h2>
        <Button className="bg-primary-admin" asChild>
          <Link href="/admin/books/new" className="text-white">
            + Create a New Book
          </Link>
        </Button>
      </div>

      <div className="mt-7 w-full overflow-hidden">
        <TableBook
          books={listBooks}
          onDelete={handleDeleteBook}
          onEdit={handleEditBook}
        />
      </div>
    </section>
  );
};

export default Page;
