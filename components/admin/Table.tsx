"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";

import DeleteBookDialog from "@/components/admin/DeleteBookDialog";

interface Props {
  title?: string;
  books: Book[];
  onDelete: (id: string) => Promise<{ success: boolean; message?: string }>;
}

// ponytail: the row is rendered as-is; the delete confirmation owns its own pending state.
export function TableBook({ title, books, onDelete }: Props) {
  return (
    <Table className="p-4">
      {title && <TableCaption>{title}</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead className="w-64">Book Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Copies</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {books.map((book) => (
          <TableRow key={book.id}>
            <TableCell className="font-medium">{book.title}</TableCell>
            <TableCell>{book.author}</TableCell>
            <TableCell>{book.rating}</TableCell>
            <TableCell
              className={
                book.availableCopies === 0 ? "text-red-800" : "text-dark-400"
              }
            >
              {book.availableCopies} of {book.totalCopies} available
            </TableCell>
            <TableCell>
              {book.createdAt
                ? new Date(book.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })
                : "Unknown"}
            </TableCell>
            <TableCell>
              <div className="flex flex-row items-center gap-4">
                <Link
                  href={`/admin/books/${book.id}/edit`}
                  aria-label={`Edit ${book.title}`}
                >
                  <PencilLine color="#004cff" />
                </Link>
                <DeleteBookDialog
                  bookTitle={book.title}
                  onConfirm={() => onDelete(book.id)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
