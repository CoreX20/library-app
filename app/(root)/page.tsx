import { desc, eq, inArray, sql } from "drizzle-orm";
import BookOverview from "@/components/BookOverview";
import BookList from "@/components/BookList";
import { db } from "@/database/drizzle";
import { books, reading_progress, users } from "@/database/schema";
import { auth } from "@/auth";

const Home = async () => {
  const session = await auth();
  const userId = String(session?.user?.id);

  const latestBooks = (await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt))) as Book[];

  const readBooks = (await db
    .select()
    .from(books)
    .where(
      inArray(
        books.id,
        sql`(SELECT book_id FROM ${reading_progress} WHERE user_id = ${userId})`,
      ),
    )) as Book[];

  return (
    <>
      <BookOverview {...latestBooks[0]} userId={session?.user?.id as string} />

      <BookList
        title="✅ Books You've Read"
        books={readBooks}
        containerClassName="mt-28"
      />

      <BookList
        title="📚 Latest Books"
        books={latestBooks.slice(1, 10)}
        containerClassName="mt-28"
      />

      <BookList
        title="📖 Other Books"
        books={latestBooks.slice(10)}
        containerClassName="mt-28"
      />
    </>
  );
};

export default Home;
