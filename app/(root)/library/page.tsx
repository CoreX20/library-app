import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import BookList from "@/components/BookList";
import { Button } from "@/components/ui/button";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";

const PER_PAGE = 24;

const LibraryPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; page?: string }>;
}) => {
  const { q = "", genre = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Math.floor(Number(page)) || 1);

  const genres = (
    await db.selectDistinct({ genre: books.genre }).from(books)
  )
    .map((row) => row.genre)
    .filter((g): g is string => Boolean(g))
    .sort();

  const filters = [];
  if (q) {
    filters.push(
      or(ilike(books.title, `%${q}%`), ilike(books.author, `%${q}%`)),
    );
  }
  if (genre) filters.push(eq(books.genre, genre));
  const where = filters.length ? and(...filters) : undefined;

  const [results, countResult] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        rating: books.rating,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        coverColor: books.coverColor,
        coverUrl: books.coverUrl,
      })
      .from(books)
      .where(where)
      .orderBy(desc(books.createdAt))
      .limit(PER_PAGE)
      .offset((pageNum - 1) * PER_PAGE),
    db.select({ total: count() }).from(books).where(where),
  ]);

  const total = countResult[0].total;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/library?${query}` : "/library";
  };

  const scope = q ? `matching “${q}”` : genre ? `in ${genre}` : "in the collection";

  return (
    <>
      <section className="library">
        <h3 className="library-subtitle">Discover</h3>
        <h1 className="library-title">Library</h1>

        <form
          action="/library"
          className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
        >
          <div className="search flex-1">
            <Image
              src="/icons/search-fill.svg"
              alt=""
              width={20}
              height={20}
              className="mr-3 object-contain"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by title or author"
              className="search-input"
            />
          </div>

          <select
            name="genre"
            defaultValue={genre}
            className="select-trigger h-14 sm:w-56"
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <Button type="submit" size="lg" className="h-14 sm:w-32">
            Search
          </Button>
        </form>
      </section>

      <p className="mt-8 text-light-100">
        {total} {total === 1 ? "book" : "books"} {scope}
      </p>

      <BookList
        books={results as Book[]}
        emptyMessage={
          q || genre
            ? `Nothing matches${q ? ` “${q}”` : ""}${genre ? ` in ${genre}` : ""}. Try a different title or author, or clear the filters.`
            : "The library collection is still empty. Ask an admin to add books first."
        }
        containerClassName="mt-8"
      />

      {totalPages > 1 && (
        <nav id="pagination" className="mt-12" aria-label="Pagination">
          {pageNum > 1 && (
            <Link href={hrefFor(pageNum - 1)}>
              <Button className="pagination-btn_dark">Previous</Button>
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
                    ? "pagination-btn_light"
                    : "pagination-btn_dark"
                }
              >
                {target}
              </Button>
            </Link>
          ))}

          {pageNum < totalPages && (
            <Link href={hrefFor(pageNum + 1)}>
              <Button className="pagination-btn_dark">Next</Button>
            </Link>
          )}
        </nav>
      )}
    </>
  );
};

export default LibraryPage;