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
import React, { useTransition } from "react";
import { PencilLine, Trash2 } from "lucide-react";

interface Props {
  title?: string;
  books: Book[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function TableBook({ title, books, onDelete, onEdit }: Props) {
  const [isPending, startTransition] = useTransition();
  const handleDelete = (id: string) => {
    startTransition(async () => {
      await onDelete(id);
    });
  };

  return (
    <Table className="p-4">
      <TableCaption>{title}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-64">Book Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Genre</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {books.map((book) => (
          <TableRow key={book.id}>
            <TableCell className="font-medium">{book.title}</TableCell>
            <TableCell>{book.author}</TableCell>
            <TableCell>{book.genre}</TableCell>
            <TableCell>
              {book.createdAt
                ? new Date(book.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })
                : "Unknown"}
            </TableCell>
            <TableCell className="flex flex-row gap-4 p-4">
              <button onClick={() => onEdit(book.id)}>
                <PencilLine color="#004cff" />
              </button>
              <button
                onClick={() => handleDelete(book.id)}
                disabled={isPending}
              >
                <Trash2 color="#ff0000" />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
