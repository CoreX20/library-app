import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import BookOverview from "@/components/BookOverview";
import BookList from "@/components/BookList";
import { db } from "@/database/drizzle";
import { books, reading_progress } from "@/database/schema";
import { auth } from "@/auth";

const Home = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const latestBooks = (await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt))) as Book[];

  if (!latestBooks.length) {
    return (
      <p className="mt-10 text-xl text-light-100">
        The library collection is still empty. Ask an admin to add books first.
      </p>
    );
  }

  const continueReading = (await db
    .select({ book: books })
    .from(reading_progress)
    .innerJoin(books, eq(books.id, reading_progress.bookId))
    .where(eq(reading_progress.userId, userId))
    .orderBy(desc(reading_progress.updatedAt))
    .limit(10)) as { book: Book }[];

  return (
    <>
      <BookOverview {...latestBooks[0]} userId={userId} />

      <BookList
        title="Continue Reading"
        books={continueReading.map(({ book }) => book)}
        emptyMessage="Books you open will appear here, so you can pick up where you left off."
        containerClassName="mt-28"
      />

      <BookList
        title="New Arrivals"
        books={latestBooks.slice(1, 11)}
        containerClassName="mt-28"
      />
    </>
  );
};

export default Home;
