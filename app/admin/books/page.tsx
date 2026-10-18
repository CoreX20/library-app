import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TableBook } from "@/components/admin/Table";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { count, desc } from "drizzle-orm";
import { deleteBook } from "@/lib/admin/actions/book";

const PER_PAGE = 10;

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Math.floor(Number(page)) || 1);

  const [listBooks, countResult] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        rating: books.rating,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        createdAt: books.createdAt,
      })
      .from(books)
      .orderBy(desc(books.createdAt))
      .limit(PER_PAGE)
      .offset((pageNum - 1) * PER_PAGE),
    db.select({ total: count() }).from(books),
  ]);

  const total = countResult[0].total;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const first = total === 0 ? 0 : (pageNum - 1) * PER_PAGE + 1;
  const last = Math.min(pageNum * PER_PAGE, total);

  const hrefFor = (target: number) =>
    target > 1 ? `/admin/books?page=${target}` : "/admin/books";

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

      <p className="mt-2 text-sm text-light-500">
        Showing {first}&ndash;{last} of {total} {total === 1 ? "book" : "books"}
      </p>

      {total === 0 ? (
        <p className="mt-7 rounded-xl bg-light-300 p-7 text-center text-sm text-light-500">
          No books yet. Use &ldquo;Create a New Book&rdquo; to add the first one.
        </p>
      ) : (
        <div className="mt-7 w-full overflow-hidden">
          <TableBook books={listBooks as Book[]} onDelete={deleteBook} />
        </div>
      )}

      {totalPages > 1 && (
        <nav className="admin-pagination mt-7" aria-label="Pagination">
          {pageNum > 1 && (
            <Link href={hrefFor(pageNum - 1)}>
              <Button className="pagination-btn_light">Previous</Button>
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((target) => (
            <Link
              key={target}
              href={hrefFor(target)}
              aria-current={target === pageNum ? "page" : undefined}
            >
              <Button
                className={
                  target === pageNum
                    ? "pagination-btn_light bg-light-300/70"
                    : "pagination-btn_light"
                }
              >
                {target}
              </Button>
            </Link>
          ))}

          {pageNum < totalPages && (
            <Link href={hrefFor(pageNum + 1)}>
              <Button className="pagination-btn_light">Next</Button>
            </Link>
          )}
        </nav>
      )}
    </section>
  );
};

export default Page;
