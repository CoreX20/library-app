"use server";

import { books, borrowRecords, reading_progress, users } from "@/database/schema";
import { db } from "@/database/drizzle";
import { auth } from "@/auth";
import { bookSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const isAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id) return false;

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return user?.role === "ADMIN";
};

// Any borrow or progress row blocks delete, so history is never lost.
const hasHistory = async (id: string) => {
  const [borrow] = await db
    .select({ id: borrowRecords.id })
    .from(borrowRecords)
    .where(eq(borrowRecords.bookId, id))
    .limit(1);
  if (borrow) return true;

  const [progress] = await db
    .select({ id: reading_progress.id })
    .from(reading_progress)
    .where(eq(reading_progress.bookId, id))
    .limit(1);
  return !!progress;
};

export const createBook = async (params: BookParams) => {
  try {
    if (!(await isAdmin())) {
      return { success: false, message: "Unauthorized" };
    }

    const newBook = await db
      .insert(books)
      .values({
        ...params,
        availableCopies: params.totalCopies,
      })
      .returning();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newBook[0])),
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "An error occurred while creating book",
    };
  }
};

export const updateBook = async (id: string, params: BookParams) => {
  try {
    if (!(await isAdmin())) {
      return { success: false, message: "Unauthorized" };
    }

    const parsed = bookSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, message: "Invalid book data" };
    }

    const [current] = await db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);
    if (!current) {
      return { success: false, message: "Book not found" };
    }

    // Copies out on loan stay out; only the free count changes.
    const onLoan = current.totalCopies - current.availableCopies;
    const { totalCopies } = parsed.data;
    if (totalCopies < onLoan) {
      return {
        success: false,
        message: `Total copies cannot be less than the ${onLoan} copies on loan`,
      };
    }

    const [updated] = await db
      .update(books)
      .set({ ...parsed.data, availableCopies: totalCopies - onLoan })
      .where(eq(books.id, id))
      .returning();

    revalidatePath("/admin/books");
    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "An error occurred while updating book",
    };
  }
};

export const deleteBook = async (id: string) => {
  try {
    if (!(await isAdmin())) {
      return { success: false, message: "Unauthorized" };
    }

    if (await hasHistory(id)) {
      return {
        success: false,
        message: "Book has borrow or reading history and cannot be deleted",
      };
    }

    await db.delete(books).where(eq(books.id, id));

    revalidatePath("/admin/books");
    return { success: true };
  } catch (error) {
    // A borrow inserted after the check hits the FK constraint here.
    console.log(error);
    return {
      success: false,
      message: "An error occurred while deleting book",
    };
  }
};
