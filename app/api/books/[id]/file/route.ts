import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getBookFileUrl } from "@/lib/actions/book";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const [book] = await db
    .select({ bookFile: books.bookFile })
    .from(books)
    .where(eq(books.id, id))
    .limit(1);
  if (!book?.bookFile) return new Response("Not found", { status: 404 });

  // Format bookFile: "/<folder>/<nama-file>", sama seperti di BookReader
  const parts = book.bookFile.split("/");
  const fileName = parts.pop()!;
  const folder = parts.slice(1).join("/");

  try {
    const file = (await getBookFileUrl(folder, fileName)) as { url: string };

    const range = req.headers.get("range");
    const upstream = await fetch(file.url, {
      headers: range ? { range } : {},
    });
    if (!upstream.ok) {
      return new Response("Upstream error", { status: 502 });
    }

    const headers = new Headers({
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    });
    for (const name of ["content-length", "content-range"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error("Error streaming book file:", error);
    return new Response("File not found", { status: 404 });
  }
}
