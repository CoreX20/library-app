"use server";

import { books, borrowRecords, reading_progress } from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq } from "drizzle-orm";
import dayjs from "dayjs";
import config from "@/lib/config";
import ImageKit from "imagekit";
import { auth } from "@/auth";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;

  try {
    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        error: "Book is not available for borrowing",
      };
    }

    const dueDate = dayjs().add(7, "day").toDate().toDateString();
    const record = await db
      .insert(borrowRecords)
      .values({
        userId,
        bookId,
        dueDate,
        status: "BORROWED",
      })
      .returning();

    await db
      .update(books)
      .set({ availableCopies: book[0].availableCopies - 1 })
      .where(eq(books.id, bookId));

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "An error occured while borrowing the book",
    };
  }
};

export const getBookFileUrl = async (
  bookFileFolder: string,
  fileName: string,
) => {
  const {
    env: {
      imageKit: { publicKey, privateKey, urlEndpoint },
    },
  } = config;

  const imagekit = new ImageKit({
    publicKey: publicKey,
    privateKey: privateKey,
    urlEndpoint: urlEndpoint,
  });

  try {
    const response = await imagekit.listFiles({
      searchQuery: `path:"${bookFileFolder}" AND name="${fileName}"`,
    });

    if (!response.length) throw new Error("No file found.");
    return response[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getFileType = async(
  id: string,
) => {
  const {
    env: {
      imageKit: { publicKey, privateKey, urlEndpoint },
    },
  } = config;

  const imagekit = new ImageKit({
    publicKey: publicKey,
    privateKey: privateKey,
    urlEndpoint: urlEndpoint,
  });

  try {
    const response = await imagekit.getFileDetails(id)
    return response.mime;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchProgress = async (book_id: string) => {
  const session = await auth();
  const user_id = session?.user?.id;
  if (!user_id) return undefined;

  const result = await db
    .select({ location: reading_progress.location })
    .from(reading_progress)
    .where(
      and(
        eq(reading_progress.userId, user_id),
        eq(reading_progress.bookId, book_id),
      ),
    );
  return result[0];
};

export const postProgress = async (book_id: string, location: string) => {
  const session = await auth();
  const user_id = session?.user?.id;
  if (!user_id || typeof location !== "string") {
    return { success: false, error: "Unauthorized or invalid location" };
  }

  try {
    await db
      .insert(reading_progress)
      .values({
        userId: user_id,
        bookId: book_id,
        location: location,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [reading_progress.userId, reading_progress.bookId],
        set: { location: location, updatedAt: new Date() },
      });
    return { success: true };
  } catch (error) {
    console.error("Error posting progress:", error);
    return { success: false, error };
  }
};
